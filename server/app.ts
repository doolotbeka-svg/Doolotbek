import express, { type Express } from 'express';
import fs from 'fs';

const REVIEWS_FILE = '/tmp/arsen_portfolio_reviews.json';
const ANALYTICS_FILE = '/tmp/arsen_portfolio_analytics.json';

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
    textRu: 'Нужен был интерактивный MVP личного кабинета для питча инвесторам. Арсен собрал готовый продукт на React и Tailwind за 72 часа — с плавной анимацией и чистой архитектурой.',
    textKg: 'Инвесторлорго көрсөтүү үчүн жеке кабинеттин интерактивдүү MVPси керек эле. Арсен React жана Tailwind негизиндеги даяр продуктуну 72 саатта жасап берди — анимациясы жылмакай, архитектурасы таза.',
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

function loadReviews(): ReviewItem[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const raw = fs.readFileSync(REVIEWS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to defaults
  }
  return [...DEFAULT_REVIEWS];
}

function saveReviews(reviews: ReviewItem[]): void {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch {
    // ignore ephemeral fs write issues
  }
}

let reviewsStore: ReviewItem[] = loadReviews();

function loadAnalytics(): AnalyticsEvent[] {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
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

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'arsen-portfolio' });
  });

  app.get('/api/reviews', (_req, res) => {
    res.json({ reviews: reviewsStore });
  });

  app.post('/api/reviews', (req, res) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const role = typeof body.role === 'string' ? body.role.trim().slice(0, 80) : '';
    const company = typeof body.company === 'string' ? body.company.trim().slice(0, 80) : '';
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 600) : '';
    const ratingRaw = Number(body.rating);
    const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5;
    const lang: 'ru' | 'kg' = body.lang === 'kg' ? 'kg' : 'ru';

    if (!name || !text || text.length < 10) {
      res.status(400).json({ error: 'Invalid review payload' });
      return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      name,
      role: role || (lang === 'kg' ? 'Кардар' : 'Клиент'),
      company: company || (lang === 'kg' ? 'Жеке долбоор' : 'Частный проект'),
      rating,
      textRu: text,
      textKg: text,
      date: dateStr,
      lang,
    };

    reviewsStore = [newReview, ...reviewsStore].slice(0, 24);
    saveReviews(reviewsStore);

    res.status(201).json({ review: newReview });
  });

  app.post('/api/contact', (req, res) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
    const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 120) : '';
    const service = typeof body.service === 'string' ? body.service.trim().slice(0, 120) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

    if (!name || !contact || !message) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    recordEvent({
      type: 'contact_submit',
      path: '/#contact',
      lang: body.lang === 'kg' ? 'kg' : 'ru',
      meta: { service },
      timestamp: new Date().toISOString(),
    });

    res.json({
      ok: true,
      deliveredVia: 'server-relay',
      receivedAt: new Date().toISOString(),
    });
  });

  app.post('/api/analytics/event', (req, res) => {
    const body = req.body ?? {};
    const type = typeof body.type === 'string' ? body.type.slice(0, 60) : 'pageview';
    const eventPath = typeof body.path === 'string' ? body.path.slice(0, 120) : '/';
    const lang = body.lang === 'kg' ? 'kg' : 'ru';
    const meta = body.meta && typeof body.meta === 'object' ? body.meta : undefined;

    recordEvent({
      type,
      path: eventPath,
      lang,
      meta,
      timestamp: new Date().toISOString(),
    });

    res.status(204).end();
  });

  app.get('/api/analytics/summary', (_req, res) => {
    const pageviews = analyticsStore.filter((e) => e.type === 'pageview').length;
    const caseViews = analyticsStore.filter((e) => e.type === 'case_open').length;
    const contacts = analyticsStore.filter((e) => e.type === 'contact_submit').length;
    res.json({
      totalEvents: analyticsStore.length,
      pageviews,
      caseViews,
      contacts,
    });
  });

  return app;
}
