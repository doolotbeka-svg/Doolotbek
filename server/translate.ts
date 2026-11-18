import { GoogleGenAI, Type } from '@google/genai';

export type Lang = 'ru' | 'kg';

const LANG_NAME: Record<Lang, string> = { ru: 'Russian', kg: 'Kyrgyz' };

// "gemini-flash-latest" is Google's rolling alias, so the site keeps working when models are retired.
const MODEL = () => process.env.GEMINI_MODEL || 'gemini-flash-latest';

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server'), { status: 503 });
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function translationEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const STYLE_RULES = `This is copy for the portfolio website of an AI creator and "vibe coder" from Kyrgyzstan.
Rules:
- Translate naturally and idiomatically, as a native copywriter would, keeping the tone and length similar.
- Keep brand names, product and tool names (Midjourney, Runway, Cursor, React, etc.), URLs, @handles, emails, numbers and units unchanged.
- Keep punctuation style, emoji and line breaks.
- Use Cyrillic script for Kyrgyz.`;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Translation timed out')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Translates a list of strings, returning a list of the same length and order. */
export async function translateStrings(texts: string[], from: Lang, to: Lang): Promise<string[]> {
  if (texts.length === 0) return [];
  const ai = getClient();
  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL(),
      contents: `Translate each string in the JSON array below from ${LANG_NAME[from]} to ${LANG_NAME[to]}.
Return a JSON array with exactly ${texts.length} strings, in the same order. Empty strings stay empty.

${STYLE_RULES}

Input:
${JSON.stringify(texts)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        temperature: 0.2,
      },
    }),
    50_000,
  );

  const parsed: unknown = JSON.parse(response.text ?? '[]');
  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error('Translation returned an unexpected result, please try again');
  }
  return parsed.map((v, i) => (typeof v === 'string' ? v : texts[i]));
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/**
 * Translates every string inside an arbitrary JSON value (keys untouched) in one request.
 * Strings that look like URLs/paths/ids are left as-is.
 */
export async function translateJson(value: Json, from: Lang, to: Lang): Promise<Json> {
  const texts: string[] = [];
  const shouldTranslate = (s: string) =>
    s.trim() !== '' && !/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(s.trim()) && /\p{L}/u.test(s);

  const collect = (v: Json) => {
    if (typeof v === 'string') {
      if (shouldTranslate(v)) texts.push(v);
    } else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  collect(value);

  const translated = await translateStrings(texts, from, to);
  let i = 0;
  const rebuild = (v: Json): Json => {
    if (typeof v === 'string') return shouldTranslate(v) ? translated[i++] : v;
    if (Array.isArray(v)) return v.map(rebuild);
    if (v && typeof v === 'object') {
      const out: Record<string, Json> = {};
      for (const [k, child] of Object.entries(v)) out[k] = rebuild(child);
      return out;
    }
    return v;
  };
  return rebuild(value);
}

/** Produces Russian and Kyrgyz versions of a visitor review, whatever language it was written in. */
export async function bilingualText(text: string): Promise<{ ru: string; kg: string }> {
  const ai = getClient();
  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL(),
      contents: `A client wrote the review below (it may be in Russian, Kyrgyz or another language).
Return its Russian and Kyrgyz versions. If it is already in one of these languages, keep that version exactly as written and translate only the other.

${STYLE_RULES}

Review:
${JSON.stringify(text)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { ru: { type: Type.STRING }, kg: { type: Type.STRING } },
          required: ['ru', 'kg'],
        },
        temperature: 0.2,
      },
    }),
    8_000,
  );
  const parsed = JSON.parse(response.text ?? '{}') as { ru?: unknown; kg?: unknown };
  return {
    ru: typeof parsed.ru === 'string' && parsed.ru.trim() ? parsed.ru : text,
    kg: typeof parsed.kg === 'string' && parsed.kg.trim() ? parsed.kg : text,
  };
}
