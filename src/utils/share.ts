import { WishlistItem } from '../types/wishlistItem';
import { getSiteUrl } from './authRedirect';
import { supabase, isSupabaseAvailable } from './supabaseClient';
import { safeFormatUrl } from './url';

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
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const decodeUnicodeFromBase64 = (b64: string): string => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

export const createShareUrl = (
  items: WishlistItem[],
  author?: string,
  _authorEmail?: string,
  title?: string,
  options?: ShareDisplayOptionsV1,
  note?: string
): string => {
  // Не включаем email в публичный payload
  const payload: SharePayloadV1 = {
    v: 1,
    author,
    authorEmail: undefined,
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
    // Ограничение размера для защиты от чрезмерных payload
    const raw = decodeURIComponent(share);
    if (raw.length > 100000) { // ~100 KB закодированной строки
      return null;
    }
    const decoded = decodeUnicodeFromBase64(raw);
    const parsedRaw = JSON.parse(decoded) as unknown;
    const parsed = validateAndSanitizeSharePayload(parsedRaw);
    if (parsed) return parsed;
    return null;
  } catch (e) {
    return null;
  }
};

// Защита от прототип-поллюции и валидация: копируем только ожидаемые поля
const MAX_STR = 1000;
const MAX_ITEMS = 1000;
function clampString(input: any, max = MAX_STR): string | undefined {
  if (typeof input !== 'string') return undefined;
  const s = input.slice(0, max).trim();
  return s || undefined;
}

function toNumber(n: any): number | null {
  if (typeof n === 'number' && isFinite(n)) return n;
  const v = Number(n);
  return isFinite(v) ? v : null;
}

function sanitizeItem(raw: any): SharePayloadV1Item | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = clampString((raw as any).name, 300);
  if (!name) return null;
  const priceNum = toNumber((raw as any).price);
  if (priceNum === null || priceNum < 0) return null;
  const currency = clampString((raw as any).currency, 10) || 'RUB';
  const link = clampString((raw as any).link, 2000);
  const safeLink = link ? safeFormatUrl(link) : null;
  // Если ссылка была задана, но после проверки оказалась небезопасной — отклоняем элемент
  if (link && !safeLink) return null;
  const itemType = clampString((raw as any).itemType, 200);
  const comment = clampString((raw as any).comment, 2000);
  const category = clampString((raw as any).category, 200);
  return {
    name,
    price: priceNum,
    currency,
    link: safeLink || undefined,
    itemType: itemType || undefined,
    comment: comment || undefined,
    category: category || undefined,
  };
}

export function validateAndSanitizeSharePayload(raw: any): SharePayloadV1 | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = (raw as any).v;
  if (v !== 1) return null;
  const itemsArr = Array.isArray((raw as any).items) ? (raw as any).items : [];
  if (itemsArr.length > MAX_ITEMS) return null;
  const items: SharePayloadV1Item[] = [];
  for (let i = 0; i < itemsArr.length; i++) {
    const sanitized = sanitizeItem(itemsArr[i]);
    if (sanitized) items.push(sanitized);
  }
  const author = clampString((raw as any).author, 200);
  const authorEmail = clampString((raw as any).authorEmail, 254);
  const title = clampString((raw as any).title, 200);
  const note = clampString((raw as any).note, 4000);
  const optionsRaw = (raw as any).options || {};
  const options = {
    includePrices: Boolean(optionsRaw?.includePrices ?? true),
    includeLinks: Boolean(optionsRaw?.includeLinks ?? true),
    includeComments: Boolean(optionsRaw?.includeComments ?? false),
    includeItemType: Boolean(optionsRaw?.includeItemType ?? true),
  } as ShareDisplayOptionsV1;
  const out: SharePayloadV1 = {
    v: 1,
    author,
    authorEmail,
    title,
    options,
    note,
    items,
  };
  return out;
}

// Генерация короткого id (base62) на основе криптографической случайности
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateShortId = (len = 10): string => {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    // Фолбек: псевдослучайный генератор — реже, но сохраняем работоспособность
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
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
      authorEmail: authorEmail || undefined,
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
      // Безопасное чтение публичного payload через RPC под SECURITY DEFINER
      const { data, error } = await (supabase as any)
        .rpc('get_share_payload', { p_id: shortId });
      if (!error && data) {
        const validated = validateAndSanitizeSharePayload(data);
        if (validated) return validated;
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

// ===== Система бронирования товаров =====

export interface Reservation {
  item_index: number;
  reserved_by: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface ShareDataWithReservations {
  payload: SharePayloadV1;
  is_owner: boolean;
  reservations: Reservation[];
}

// Получить данные публичной ссылки с информацией о бронированиях (для владельца)
export const loadShareDataWithReservations = async (
  shortId: string
): Promise<ShareDataWithReservations | null> => {
  if (!isSupabaseAvailable() || !supabase) return null;

  try {
    const { data, error } = await (supabase as any)
      .rpc('get_owner_share_data', { p_share_link_id: shortId });

    if (error || !data) return null;

    const payload = validateAndSanitizeSharePayload(data.payload);
    if (!payload) return null;

    return {
      payload,
      is_owner: data.is_owner ?? false,
      reservations: Array.isArray(data.reservations) ? data.reservations : [],
    };
  } catch (_) {
    return null;
  }
};

// Получить список бронирований для публичной ссылки
export const getShareReservations = async (
  shareId: string
): Promise<Reservation[]> => {
  if (!isSupabaseAvailable() || !supabase) return [];

  try {
    const { data, error } = await (supabase as any)
      .rpc('get_share_reservations', { p_share_link_id: shareId });

    if (error || !data) return [];
    return data as Reservation[];
  } catch (_) {
    return [];
  }
};

// Создать бронирование товара
export const createReservation = async (
  shareId: string,
  itemIndex: number,
  reservedBy?: string,
  isAnonymous: boolean = true
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseAvailable() || !supabase) {
    return { success: false, error: 'Supabase недоступен' };
  }

  try {
    const { data, error } = await (supabase as any)
      .rpc('create_reservation', {
        p_share_link_id: shareId,
        p_item_index: itemIndex,
        p_reserved_by: isAnonymous ? null : (reservedBy || null),
        p_is_anonymous: isAnonymous,
      });

    if (error) return { success: false, error: error.message };
    if (data && typeof data === 'object') {
      return {
        success: data.success === true,
        error: data.error || undefined,
      };
    }
    return { success: false, error: 'Неизвестная ошибка' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка при бронировании' };
  }
};

// Отменить бронирование (только для владельца)
export const cancelReservation = async (
  shareId: string,
  itemIndex: number
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseAvailable() || !supabase) {
    return { success: false, error: 'Supabase недоступен' };
  }

  try {
    const { data, error } = await (supabase as any)
      .rpc('cancel_reservation', {
        p_share_link_id: shareId,
        p_item_index: itemIndex,
      });

    if (error) return { success: false, error: error.message };
    if (data && typeof data === 'object') {
      return {
        success: data.success === true,
        error: data.error || undefined,
      };
    }
    return { success: false, error: 'Неизвестная ошибка' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Ошибка при отмене бронирования' };
  }
};

// Получить shortId из URL если есть
export const getShareIdFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('s');
};


