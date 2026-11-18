import crypto from 'crypto';
import fs from 'fs';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { isAllowedImageType, readJSON, saveImage, storageMode, writeJSON } from './storage.ts';
import { bilingualText, translateJson, translationEnabled, type Lang } from './translate.ts';

const ANALYTICS_FILE = '/tmp/doolot_portfolio_analytics.json';

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  textRu: string;
  textKg: string;
  date: string;
  lang: 'ru' | 'kg';
}

interface LeadItem {
  id: string;
  name: string;
  contact: string;
  service: string;
  message: string;
  lang: 'ru' | 'kg';
  createdAt: string;
}

interface AnalyticsEvent {
  type: string;
  path: string;
  lang: string;
  meta?: Record<string, string>;
  timestamp: string;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Айбек Токтогулов',
    role: 'Основатель',
    company: 'Nomad Gear KG',
    rating: 5,
    textRu: 'Заказали рекламный AI-ролик для запуска зимней коллекции. За 5 дней получили кинематографичный тизер, который принёс +180% переходов в Instagram без затрат на выездные съёмки в горах.',
    textKg: 'Кышкы коллекцияны чыгаруу үчүн AI жарнамалык ролик буюртма кылдык. 5 күндүн ичинде тоого чыгып тартууга кетчү чыгымсыз Instagram баракчабызга +180% өтүү алып келген кинематографиялык тизер алдык.',
    date: '2026-10',
    lang: 'ru',
  },
  {
    id: 'rev-2',
    name: 'Алина Сатыбалдиева',
    role: 'Product Lead',
    company: 'KyrgyzPay Studio',
    rating: 5,
    textRu: 'Нужен был интерактивный MVP личного кабинета для питча инвесторам. Доолот собрал готовый продукт на React и Tailwind за 72 часа — с плавной анимацией и чистой архитектурой.',
    textKg: 'Инвесторлорго көрсөтүү үчүн жеке кабинеттин интерактивдүү MVPси керек эле. Доолот React жана Tailwind негизиндеги даяр продуктуну 72 саатта жасап берди — анимациясы жылмакай, архитектурасы таза.',
    date: '2026-09',
    lang: 'ru',
  },
  {
    id: 'rev-3',
    name: 'Бакыт Эрмеков',
    role: 'Маркетинг-директор',
    company: 'Oimo Roasters',
    rating: 5,
    textRu: 'Внедрили ИИ-ассистента для обработки заявок и генерации визуалов под акции. Время реакции на сообщения клиентов сократилось с 2 часов до 40 секунд, а конверсия выросла на 34%.',
    textKg: 'Өтүнмөлөрдү иштетүү жана акцияларга визуал даярдоо үчүн ЖИ-ассистент киргиздик. Кардарлардын билдирүүлөрүнө жооп берүү убактысы 2 сааттан 40 секундга кыскарып, конверсия 34% өстү.',
    date: '2026-08',
    lang: 'kg',
  },
];

async function loadReviews(): Promise<ReviewItem[]> {
  const saved = await readJSON<ReviewItem[]>('reviews');
  return Array.isArray(saved) ? saved : [...DEFAULT_REVIEWS];
}

async function loadLeads(): Promise<LeadItem[]> {
  const saved = await readJSON<LeadItem[]>('leads');
  return Array.isArray(saved) ? saved : [];
}

function loadAnalytics(): AnalyticsEvent[] {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

let analyticsStore: AnalyticsEvent[] = loadAnalytics();

function recordEvent(evt: AnalyticsEvent): void {
  analyticsStore.push(evt);
  if (analyticsStore.length > 1000) {
    analyticsStore = analyticsStore.slice(-1000);
  }
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analyticsStore), 'utf-8');
  } catch {
    // ignore
  }
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/** Constant-time password check against ADMIN_PASSWORD. */
function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected || !candidate) return false;
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// ---- Brute-force protection: per-IP lockout after repeated wrong passwords ----
const MAX_FAILURES = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; first: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd ?? '').split(',')[0].trim();
  return first || req.socket.remoteAddress || 'unknown';
}

function isLocked(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > LOCK_WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function noteFailure(ip: string): void {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.first > LOCK_WINDOW_MS) {
    failures.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

/** Checks the password with lockout + a delay on failure. Sends the error response itself when it fails. */
async function checkPassword(req: Request, res: Response, candidate: string): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: 'ADMIN_PASSWORD is not configured on the server' });
    return false;
  }
  const ip = clientIp(req);
  if (isLocked(ip)) {
    res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    return false;
  }
  if (!passwordMatches(candidate)) {
    noteFailure(ip);
    await new Promise((r) => setTimeout(r, 1000));
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  failures.delete(ip);
  return true;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  checkPassword(req, res, token).then((ok) => {
    if (ok) next();
  });
}

/** Wraps async handlers so storage errors become JSON 500s instead of hanging requests. */
const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => {
    fn(req, res).catch((err: unknown) => {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
    });
  };

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'doolot-portfolio', storage: storageMode(), translation: translationEnabled() });
  });

  // ---------- Public content ----------
  app.get(
    '/api/content',
    wrap(async (_req, res) => {
      const content = await readJSON<unknown>('content');
      res.setHeader('Cache-Control', 'no-store');
      res.json({ content });
    }),
  );

  app.get(
    '/api/reviews',
    wrap(async (_req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.json({ reviews: await loadReviews() });
    }),
  );

  app.post(
    '/api/reviews',
    wrap(async (req, res) => {
      const body = req.body ?? {};
      const name = str(body.name, 80);
      const role = str(body.role, 80);
      const company = str(body.company, 80);
      const text = str(body.text, 600);
      const ratingRaw = Number(body.rating);
      const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5;
      const lang: 'ru' | 'kg' = body.lang === 'kg' ? 'kg' : 'ru';

      if (!name || !text || text.length < 10) {
        res.status(400).json({ error: 'Invalid review payload' });
        return;
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Show the review in both site languages; fall back to the original text if Gemini is unavailable.
      let texts = { ru: text, kg: text };
      if (translationEnabled()) {
        try {
          texts = await bilingualText(text);
        } catch (err) {
          console.error('Review translation failed', err);
        }
      }

      const newReview: ReviewItem = {
        id: `rev-${Date.now()}`,
        name,
        role: role || (lang === 'kg' ? 'Кардар' : 'Клиент'),
        company: company || (lang === 'kg' ? 'Жеке долбоор' : 'Частный проект'),
        rating,
        textRu: texts.ru,
        textKg: texts.kg,
        date: dateStr,
        lang,
      };

      const reviews = [newReview, ...(await loadReviews())].slice(0, 50);
      await writeJSON('reviews', reviews);
      res.status(201).json({ review: newReview });
    }),
  );

  app.post(
    '/api/contact',
    wrap(async (req, res) => {
      const body = req.body ?? {};
      const name = str(body.name, 100);
      const contact = str(body.contact, 120);
      const service = str(body.service, 120);
      const message = str(body.message, 2000);
      const lang: 'ru' | 'kg' = body.lang === 'kg' ? 'kg' : 'ru';

      if (!name || !contact || !message) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      recordEvent({
        type: 'contact_submit',
        path: '/#contact',
        lang,
        meta: { service },
        timestamp: new Date().toISOString(),
      });

      const lead: LeadItem = {
        id: `lead-${Date.now()}`,
        name,
        contact,
        service,
        message,
        lang,
        createdAt: new Date().toISOString(),
      };
      try {
        const leads = [lead, ...(await loadLeads())].slice(0, 500);
        await writeJSON('leads', leads);
      } catch (err) {
        console.error('Failed to store lead', err);
      }

      res.json({ ok: true, deliveredVia: 'server-relay', receivedAt: lead.createdAt });
    }),
  );

  app.post('/api/analytics/event', (req, res) => {
    const body = req.body ?? {};
    recordEvent({
      type: typeof body.type === 'string' ? body.type.slice(0, 60) : 'pageview',
      path: typeof body.path === 'string' ? body.path.slice(0, 120) : '/',
      lang: body.lang === 'kg' ? 'kg' : 'ru',
      meta: body.meta && typeof body.meta === 'object' ? body.meta : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(204).end();
  });

  // ---------- Admin ----------
  app.post(
    '/api/admin/translate',
    requireAdmin,
    wrap(async (req, res) => {
      const from: Lang = req.body?.from === 'kg' ? 'kg' : 'ru';
      const to: Lang = from === 'ru' ? 'kg' : 'ru';
      const value = req.body?.value;
      if (value === undefined) {
        res.status(400).json({ error: 'value is required' });
        return;
      }
      try {
        res.json({ value: await translateJson(value, from, to) });
      } catch (err) {
        const status = (err as { status?: number }).status ?? 502;
        res.status(status).json({ error: err instanceof Error ? err.message : 'Translation failed' });
      }
    }),
  );

  app.post(
    '/api/admin/login',
    wrap(async (req, res) => {
      if (!(await checkPassword(req, res, str(req.body?.password, 200)))) return;
      res.json({ ok: true, storage: storageMode() });
    }),
  );

  app.put(
    '/api/admin/content',
    requireAdmin,
    wrap(async (req, res) => {
      const content = req.body?.content;
      if (!content || typeof content !== 'object' || Array.isArray(content)) {
        res.status(400).json({ error: 'content must be an object' });
        return;
      }
      await writeJSON('content', content);
      res.json({ ok: true, savedAt: new Date().toISOString() });
    }),
  );

  app.put(
    '/api/admin/reviews',
    requireAdmin,
    wrap(async (req, res) => {
      const reviews = req.body?.reviews;
      if (!Array.isArray(reviews)) {
        res.status(400).json({ error: 'reviews must be an array' });
        return;
      }
      await writeJSON('reviews', reviews.slice(0, 200));
      res.json({ ok: true });
    }),
  );

  app.get(
    '/api/admin/leads',
    requireAdmin,
    wrap(async (_req, res) => {
      res.json({ leads: await loadLeads() });
    }),
  );

  app.put(
    '/api/admin/leads',
    requireAdmin,
    wrap(async (req, res) => {
      const leads = req.body?.leads;
      if (!Array.isArray(leads)) {
        res.status(400).json({ error: 'leads must be an array' });
        return;
      }
      await writeJSON('leads', leads);
      res.json({ ok: true });
    }),
  );

  app.post(
    '/api/admin/upload',
    requireAdmin,
    wrap(async (req, res) => {
      const contentType = str(req.body?.contentType, 60);
      const data = typeof req.body?.data === 'string' ? req.body.data : '';
      if (!isAllowedImageType(contentType) || !data) {
        res.status(400).json({ error: 'Unsupported image' });
        return;
      }
      const buffer = Buffer.from(data, 'base64');
      if (buffer.length > 3 * 1024 * 1024) {
        res.status(413).json({ error: 'Image too large (max 3 MB)' });
        return;
      }
      const url = await saveImage(buffer, contentType);
      res.json({ url });
    }),
  );

  app.get('/api/analytics/summary', requireAdmin, (_req, res) => {
    res.json({
      totalEvents: analyticsStore.length,
      pageviews: analyticsStore.filter((e) => e.type === 'pageview').length,
      caseViews: analyticsStore.filter((e) => e.type === 'case_open').length,
      contacts: analyticsStore.filter((e) => e.type === 'contact_submit').length,
    });
  });

  return app;
}
