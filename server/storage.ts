import fs from 'fs';
import path from 'path';
import { head, put } from '@vercel/blob';

/**
 * Persistent JSON + image storage.
 * - On Vercel (BLOB_READ_WRITE_TOKEN set): Vercel Blob.
 * - Locally: files under ./.data (uploads served at /uploads by server.ts).
 */
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const LOCAL_DATA_DIR = path.resolve(process.cwd(), '.data');
export const LOCAL_UPLOADS_DIR = path.join(LOCAL_DATA_DIR, 'uploads');

const memo = new Map<string, { value: unknown; at: number }>();
const MEMO_TTL_MS = 10_000;

export function storageMode(): 'blob' | 'local' {
  return useBlob() ? 'blob' : 'local';
}

export async function readJSON<T>(key: string): Promise<T | null> {
  const cached = memo.get(key);
  if (cached && Date.now() - cached.at < MEMO_TTL_MS) {
    return cached.value as T | null;
  }

  let value: T | null = null;
  if (useBlob()) {
    try {
      const meta = await head(`data/${key}.json`);
      const res = await fetch(`${meta.url}?v=${meta.uploadedAt.getTime()}`, { cache: 'no-store' });
      if (res.ok) value = (await res.json()) as T;
    } catch {
      value = null; // not created yet
    }
  } else {
    const file = path.join(LOCAL_DATA_DIR, `${key}.json`);
    if (fs.existsSync(file)) {
      try {
        value = JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
      } catch {
        value = null;
      }
    }
  }

  memo.set(key, { value, at: Date.now() });
  return value;
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  const body = JSON.stringify(value);
  if (useBlob()) {
    await put(`data/${key}.json`, body, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
  } else {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DATA_DIR, `${key}.json`), body, 'utf-8');
  }
  memo.set(key, { value: JSON.parse(body), at: Date.now() });
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export function isAllowedImageType(contentType: string): boolean {
  return contentType in EXT_BY_TYPE;
}

/** Saves an image and returns the public URL to put into content. */
export async function saveImage(buffer: Buffer, contentType: string): Promise<string> {
  const ext = EXT_BY_TYPE[contentType] ?? 'bin';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  if (useBlob()) {
    const blob = await put(`uploads/${name}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_UPLOADS_DIR, name), buffer);
  return `/uploads/${name}`;
}
