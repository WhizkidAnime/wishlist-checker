import { WishlistItem } from '../types/wishlistItem';
import { getSiteUrl } from './authRedirect';
import { supabase, isSupabaseAvailable } from './supabaseClient';

interface SharePayloadV1Item {
  name: string;
  link?: string;
  price: number;
  currency: string;
  itemType?: string;
  comment?: string;
  category?: string;
}

export interface ShareDisplayOptionsV1 {
  includePrices?: boolean;
  includeLinks?: boolean;
  includeComments?: boolean;
  includeItemType?: boolean;
}

interface SharePayloadV1 {
  v: 1;
  author?: string;
  authorEmail?: string;
  title?: string;
  options?: ShareDisplayOptionsV1;
  note?: string;
  items: SharePayloadV1Item[];
}

const encodeUnicodeToBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const decodeUnicodeFromBase64 = (b64: string): string => {
  return decodeURIComponent(escape(atob(b64)));
};

export const createShareUrl = (
  items: WishlistItem[],
  author?: string,
  authorEmail?: string,
  title?: string,
  options?: ShareDisplayOptionsV1,
  note?: string
): string => {
  const payload: SharePayloadV1 = {
    v: 1,
    author,
    authorEmail,
    title,
    options,
    note,
    items: items.map((it) => ({
      name: it.name,
      link: it.link || undefined,
      price: it.price,
      currency: it.currency,
      itemType: it.itemType || undefined,
      comment: it.comment || undefined,
      category: it.category || undefined,
    })),
  };

  const json = JSON.stringify(payload);
  const encoded = encodeUnicodeToBase64(json);
  const base = getSiteUrl();
  const url = `${base}?share=${encodeURIComponent(encoded)}`;
  return url;
};

export const parseShareFromLocation = (): SharePayloadV1 | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const share = params.get('share');
    if (!share) return null;
    const decoded = decodeUnicodeFromBase64(decodeURIComponent(share));
    const parsed = JSON.parse(decoded) as SharePayloadV1;
    if (parsed && parsed.v === 1 && Array.isArray(parsed.items)) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Генерация короткого id (base62)
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateShortId = (len = 10): string => {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
};

// Пытаемся создать короткую ссылку через Supabase (fallback на обычную)
export const createShareUrlSmart = async (
  items: WishlistItem[],
  author?: string,
  authorEmail?: string,
  opts?: { title?: string; options?: ShareDisplayOptionsV1; expiresAt?: string | null; note?: string; ownerUserId?: string }
): Promise<string> => {
  const fallback = createShareUrl(items, author, authorEmail, opts?.title, opts?.options, opts?.note);
  if (!isSupabaseAvailable() || !supabase) return fallback;

  try {
    const payload: SharePayloadV1 = {
      v: 1,
      author,
      authorEmail,
      title: opts?.title,
      options: opts?.options,
      note: opts?.note,
      items: items.map((it) => ({
        name: it.name,
        link: it.link || undefined,
        price: it.price,
        currency: it.currency,
        itemType: it.itemType || undefined,
        comment: it.comment || undefined,
        category: it.category || undefined,
      })),
    };

    // пробуем несколько раз, если id занялся
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = generateShortId(10);
      // 1) Пытаемся с owner_user_id, если он есть
      const insertDataWithOwner: any = { id, payload, expires_at: opts?.expiresAt || null };
      if (opts?.ownerUserId) insertDataWithOwner.owner_user_id = opts.ownerUserId;

      const { error: insertErr1 } = await (supabase as any)
        .from('share_links')
        .insert(insertDataWithOwner);

      if (!insertErr1) {
        const base = getSiteUrl();
        return `${base}?s=${encodeURIComponent(id)}`;
      }

      // 2) Если колонка owner_user_id отсутствует (или запрещена политикой схемы) — пробуем без неё
      const isUnknownColumn = typeof insertErr1?.message === 'string' && insertErr1.message.toLowerCase().includes('owner_user_id');
      if (isUnknownColumn || insertErr1?.code === '42703') {
        const { error: insertErr2 } = await (supabase as any)
          .from('share_links')
          .insert({ id, payload, expires_at: opts?.expiresAt || null });
        if (!insertErr2) {
          const base = getSiteUrl();
          return `${base}?s=${encodeURIComponent(id)}`;
        }
      }
      // Иначе повторяем попытку с новым id
    }
  } catch (e) {
    // ignore and fallback
  }
  return fallback;
};

// Загружаем payload из URL (поддержка короткого s и длинного share)
export const loadSharedPayloadFromQuery = async (): Promise<SharePayloadV1 | null> => {
  const params = new URLSearchParams(window.location.search);
  const shortId = params.get('s');
  if (shortId && isSupabaseAvailable() && supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from('share_links')
        .select('payload')
        .eq('id', shortId)
        .single();
      if (!error && data?.payload) {
        return data.payload as SharePayloadV1;
      }
    } catch (_) {
      // ignore
    }
  }
  return parseShareFromLocation();
};

export type { SharePayloadV1, SharePayloadV1Item };

// ===== Управление публичными ссылками пользователя =====

export interface UserShareLink {
  id: string;
  url: string;
  title: string;
  itemsCount: number;
  createdAt?: string;
  expiresAt?: string | null;
}

export const getShareLinkUrlById = (id: string): string => {
  const base = getSiteUrl();
  return `${base}?s=${encodeURIComponent(id)}`;
};

export const listMyShareLinks = async (
  userId: string,
  userEmail?: string
): Promise<UserShareLink[]> => {
  if (!isSupabaseAvailable() || !supabase) return [];

  const mapRows = (rows: any[]): UserShareLink[] => {
    return (rows || []).map((r) => {
      const payload = r.payload as SharePayloadV1 | undefined;
      return {
        id: r.id,
        url: getShareLinkUrlById(r.id),
        title: (payload?.title || 'Без названия') as string,
        itemsCount: Array.isArray(payload?.items) ? payload!.items.length : 0,
        createdAt: r.created_at,
        expiresAt: r.expires_at ?? null,
      } as UserShareLink;
    });
  };

  try {
    const { data, error } = await (supabase as any)
      .from('share_links')
      .select('id, payload, created_at, expires_at, owner_user_id')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) {
      return mapRows(data);
    }
  } catch (_) {}

  if (userEmail) {
    try {
      const { data, error } = await (supabase as any)
        .from('share_links')
        .select('id, payload, created_at, expires_at')
        .contains('payload', { authorEmail: userEmail })
        .order('created_at', { ascending: false });
      if (!error) {
        return mapRows(data);
      }
    } catch (_) {}
  }

  return [];
};

export const deleteShareLink = async (id: string): Promise<{ success: boolean; message?: string }> => {
  if (!isSupabaseAvailable() || !supabase) {
    return { success: false, message: 'Supabase недоступен' };
  }
  try {
    const { error } = await (supabase as any)
      .from('share_links')
      .delete()
      .eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Не удалось удалить ссылку' };
  }
};


