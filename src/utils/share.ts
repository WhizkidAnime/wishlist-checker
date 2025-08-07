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
}

interface SharePayloadV1 {
  v: 1;
  author?: string;
  authorEmail?: string;
  items: SharePayloadV1Item[];
}

const encodeUnicodeToBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const decodeUnicodeFromBase64 = (b64: string): string => {
  return decodeURIComponent(escape(atob(b64)));
};

export const createShareUrl = (items: WishlistItem[], author?: string, authorEmail?: string): string => {
  const payload: SharePayloadV1 = {
    v: 1,
    author,
    authorEmail,
    items: items.map((it) => ({
      name: it.name,
      link: it.link || undefined,
      price: it.price,
      currency: it.currency,
      itemType: it.itemType || undefined,
      comment: it.comment || undefined,
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
  authorEmail?: string
): Promise<string> => {
  const fallback = createShareUrl(items, author);
  if (!isSupabaseAvailable() || !supabase) return fallback;

  try {
    const payload: SharePayloadV1 = {
      v: 1,
      author,
      authorEmail,
      items: items.map((it) => ({
        name: it.name,
        link: it.link || undefined,
        price: it.price,
        currency: it.currency,
        itemType: it.itemType || undefined,
        comment: it.comment || undefined,
      })),
    };

    // пробуем несколько раз, если id занялся
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = generateShortId(10);
      const { error } = await (supabase as any)
        .from('share_links')
        .insert({ id, payload });
      if (!error) {
        const base = getSiteUrl();
        return `${base}?s=${encodeURIComponent(id)}`;
      }
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


