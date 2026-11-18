import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ExternalLink,
  Image as ImageIcon,
  Inbox,
  Languages,
  LayoutGrid,
  LogOut,
  MessageSquareQuote,
  Briefcase,
  Link2,
  Lock,
  RotateCcw,
  Save,
  Wrench,
} from 'lucide-react';
import { DEFAULT_CONTENT, mergeWithDefaults, type SiteContent } from '../content/types';
import { FieldEditor, type EditorContext, type Json } from './FieldEditor';

const TOKEN_KEY = 'doolot_admin_token';

function readToken(): string {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeToken(value: string) {
  try {
    if (value) window.sessionStorage.setItem(TOKEN_KEY, value);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || `Ошибка ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

/** Downscales large photos in the browser so uploads stay well under the 4.5 MB function limit. */
async function prepareImage(file: File): Promise<{ contentType: string; data: string }> {
  const toBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { contentType: file.type, data: await toBase64(file) };
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 1920;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Не удалось обработать картинку'))), 'image/webp', 0.86),
  );
  return { contentType: 'image/webp', data: await toBase64(blob) };
}

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
  lang: string;
  createdAt: string;
}

type TabId = 'brand' | 'socials' | 'ru' | 'kg' | 'cases' | 'services' | 'tools' | 'reviews' | 'leads';

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid; hint: string }[] = [
  { id: 'brand', label: 'Бренд и фото', icon: ImageIcon, hint: 'Логотип, имя и главные картинки сайта.' },
  { id: 'socials', label: 'Соцсети', icon: Link2, hint: 'Ссылки в блоке «Прямая связь». Иконка подбирается по названию (Telegram, WhatsApp, Instagram, Behance, GitHub).' },
  { id: 'ru', label: 'Тексты — RU', icon: Languages, hint: 'Все надписи сайта на русском.' },
  { id: 'kg', label: 'Тексты — КЫР', icon: Languages, hint: 'Все надписи сайта на кыргызском.' },
  { id: 'cases', label: 'Кейсы', icon: Briefcase, hint: 'Проекты в портфолио. Можно добавлять, удалять и менять порядок.' },
  { id: 'services', label: 'Услуги', icon: LayoutGrid, hint: 'Карточки услуг.' },
  { id: 'tools', label: 'Инструменты', icon: Wrench, hint: 'Инструменты в блоке «Обо мне».' },
  { id: 'reviews', label: 'Отзывы', icon: MessageSquareQuote, hint: 'Отзывы клиентов, включая оставленные через форму на сайте.' },
  { id: 'leads', label: 'Заявки', icon: Inbox, hint: 'Сообщения из формы контактов.' },
];

export default function AdminApp() {
  const [token, setToken] = useState(readToken);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(Boolean(readToken()));

  useEffect(() => {
    document.title = 'Админ-панель';
    const t = readToken();
    if (!t) return;
    api('/api/admin/login', '', { method: 'POST', body: JSON.stringify({ password: t }) })
      .then(() => setAuthed(true))
      .catch(() => writeToken(''))
      .finally(() => setChecking(false));
  }, []);

  const logout = () => {
    writeToken('');
    setToken('');
    setAuthed(false);
  };

  if (checking) return <div className="min-h-screen bg-[#0A0A0C]" />;
  if (!authed) {
    return (
      <Login
        onSuccess={(pw) => {
          writeToken(pw);
          setToken(pw);
          setAuthed(true);
        }}
      />
    );
  }
  return <Dashboard token={token} onLogout={logout} />;
}

function Login({ onSuccess }: { onSuccess: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/login', '', { method: 'POST', body: JSON.stringify({ password }) });
      onSuccess(password);
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 503
          ? 'На сервере не задан пароль. Добавьте переменную ADMIN_PASSWORD в настройках Vercel и сделайте Redeploy.'
          : status === 429
            ? 'Слишком много попыток. Попробуйте через 15 минут.'
            : 'Неверный пароль',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0C] px-4">
      <form onSubmit={submit} className="bento-surface w-full max-w-sm rounded-2xl p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/20">
            <Lock className="h-5 w-5 text-[#8B5CF6]" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-white">Админ-панель</h1>
            <p className="text-xs text-white/50">Управление контентом сайта</p>
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-white/60">Пароль</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0A0A0C] px-3 py-2.5 text-sm text-white focus:border-[#8B5CF6] focus:outline-none"
          />
        </label>
        {error && <p className="mt-3 text-xs leading-relaxed text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Проверка…' : 'Войти'}
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-white/50 hover:text-white">
          ← На сайт
        </a>
      </form>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>('brand');
  const [content, setContent] = useState<SiteContent | null>(null);
  const [savedJson, setSavedJson] = useState('');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [savedReviewsJson, setSavedReviewsJson] = useState('');
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ content: unknown }>('/api/content', token)
      .then((d) => {
        const merged = mergeWithDefaults(DEFAULT_CONTENT, d.content);
        setContent(merged);
        setSavedJson(JSON.stringify(merged));
      })
      .catch(() => {
        setContent(DEFAULT_CONTENT);
        setSavedJson(JSON.stringify(DEFAULT_CONTENT));
      });
    api<{ reviews: ReviewItem[] }>('/api/reviews', token)
      .then((d) => {
        setReviews(d.reviews);
        setSavedReviewsJson(JSON.stringify(d.reviews));
      })
      .catch(() => undefined);
    api<{ leads: LeadItem[] }>('/api/admin/leads', token)
      .then((d) => setLeads(d.leads))
      .catch(() => undefined);
  }, [token]);

  const contentDirty = content !== null && JSON.stringify(content) !== savedJson;
  const reviewsDirty = JSON.stringify(reviews) !== savedReviewsJson;
  const dirty = contentDirty || reviewsDirty;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const ctx: EditorContext = useMemo(
    () => ({
      uploadImage: async (file: File) => {
        const payload = await prepareImage(file);
        const res = await api<{ url: string }>('/api/admin/upload', token, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return res.url;
      },
    }),
    [token],
  );

  const save = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    setStatus(null);
    try {
      if (contentDirty) {
        await api('/api/admin/content', token, { method: 'PUT', body: JSON.stringify({ content }) });
        setSavedJson(JSON.stringify(content));
      }
      if (reviewsDirty) {
        await api('/api/admin/reviews', token, { method: 'PUT', body: JSON.stringify({ reviews }) });
        setSavedReviewsJson(JSON.stringify(reviews));
      }
      setStatus({ kind: 'ok', text: 'Сохранено. Изменения появятся на сайте в течение минуты.' });
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        onLogout();
        return;
      }
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Не удалось сохранить' });
    } finally {
      setSaving(false);
    }
  }, [content, contentDirty, reviews, reviewsDirty, token, onLogout]);

  const resetSection = () => {
    if (!content) return;
    if (!window.confirm('Вернуть этот раздел к исходному варианту? Несохранённые изменения пропадут.')) return;
    const d = DEFAULT_CONTENT;
    const next: SiteContent = { ...content };
    if (tab === 'brand') next.brand = d.brand;
    if (tab === 'socials') next.socials = d.socials;
    if (tab === 'ru') next.ui = { ...next.ui, ru: d.ui.ru };
    if (tab === 'kg') next.ui = { ...next.ui, kg: d.ui.kg };
    if (tab === 'cases') next.cases = d.cases;
    if (tab === 'services') next.services = d.services;
    if (tab === 'tools') {
      next.aiTools = d.aiTools;
      next.vibeTools = d.vibeTools;
    }
    setContent(next);
  };

  const [translating, setTranslating] = useState(false);

  /** Fills the other language of the current tab with a Gemini translation (unsaved until “Сохранить”). */
  const translateTab = async (from: 'ru' | 'kg') => {
    if (!content) return;
    const to = from === 'ru' ? 'kg' : 'ru';
    const toName = to === 'ru' ? 'русском' : 'кыргызском';
    if (!window.confirm(`Тексты на ${toName} в этом разделе будут заменены переводом. Продолжить?`)) return;

    const call = async <T,>(value: unknown): Promise<T> =>
      (
        await api<{ value: T }>('/api/admin/translate', token, {
          method: 'POST',
          body: JSON.stringify({ from, value }),
        })
      ).value;

    setTranslating(true);
    setStatus(null);
    try {
      if (tab === 'ru' || tab === 'kg') {
        const ui = await call<SiteContent['ui']['ru']>(content.ui[from]);
        setContent({ ...content, ui: { ...content.ui, [to]: ui } });
      } else if (tab === 'cases' || tab === 'services') {
        const items = content[tab] as unknown as Array<Record<string, unknown>>;
        const translated = await call<unknown[]>(items.map((item) => item[from]));
        setContent({ ...content, [tab]: items.map((item, i) => ({ ...item, [to]: translated[i] })) });
      } else if (tab === 'tools') {
        const fromKey = from === 'ru' ? 'ruRole' : 'kgRole';
        const toKey = from === 'ru' ? 'kgRole' : 'ruRole';
        const res = await call<{ ai: string[]; vibe: string[] }>({
          ai: content.aiTools.map((t) => t[fromKey]),
          vibe: content.vibeTools.map((t) => t[fromKey]),
        });
        setContent({
          ...content,
          aiTools: content.aiTools.map((t, i) => ({ ...t, [toKey]: res.ai[i] })),
          vibeTools: content.vibeTools.map((t, i) => ({ ...t, [toKey]: res.vibe[i] })),
        });
      } else if (tab === 'reviews') {
        const fromKey = from === 'ru' ? 'textRu' : 'textKg';
        const toKey = from === 'ru' ? 'textKg' : 'textRu';
        const res = await call<string[]>(reviews.map((r) => r[fromKey]));
        setReviews(reviews.map((r, i) => ({ ...r, [toKey]: res[i] })));
      }
      setStatus({ kind: 'ok', text: 'Переведено. Проверьте текст и нажмите «Сохранить».' });
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        onLogout();
        return;
      }
      const msg = err instanceof Error ? err.message : '';
      setStatus({
        kind: 'error',
        text: msg.includes('GEMINI_API_KEY')
          ? 'Перевод не настроен: добавьте GEMINI_API_KEY в настройках Vercel и сделайте Redeploy.'
          : `Не удалось перевести: ${msg || 'ошибка'}`,
      });
    } finally {
      setTranslating(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm('Удалить заявку?')) return;
    const next = leads.filter((l) => l.id !== id);
    try {
      await api('/api/admin/leads', token, { method: 'PUT', body: JSON.stringify({ leads: next }) });
      setLeads(next);
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Не удалось удалить' });
    }
  };

  if (!content) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0A0A0C] text-sm text-white/50">Загрузка…</div>;
  }

  const set = <K extends keyof SiteContent>(key: K) => (next: Json) =>
    setContent({ ...content, [key]: next as unknown as SiteContent[K] });

  const current = TABS.find((t) => t.id === tab)!;
  const editable = tab !== 'reviews' && tab !== 'leads';
  const translatable = ['ru', 'kg', 'cases', 'services', 'tools', 'reviews'].includes(tab);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0A0A0C]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-display truncate text-sm font-bold">{content.brand.logoText}</span>
            <span className="hidden rounded-md bg-[#8B5CF6]/20 px-2 py-0.5 text-[11px] font-semibold text-[#C4B5FD] sm:inline">
              Админ-панель
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Открыть сайт
            </a>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {saving ? 'Сохранение…' : dirty ? 'Сохранить' : 'Сохранено'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Выйти"
              aria-label="Выйти"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {status && (
          <div
            className={`border-t px-4 py-2 text-center text-xs ${
              status.kind === 'ok' ? 'border-[#00F0C8]/20 bg-[#00F0C8]/10 text-[#7FFFE6]' : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {status.text}
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:self-start" aria-label="Разделы">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#00F0C8]' : ''}`} aria-hidden="true" />
                {t.label}
                {t.id === 'leads' && leads.length > 0 && (
                  <span className="ml-auto rounded-full bg-[#8B5CF6] px-1.5 text-[10px] font-bold">{leads.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        <main className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold">{current.label}</h1>
              <p className="mt-1 text-sm text-white/55">{current.hint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {translatable && (
                <>
                  <button
                    type="button"
                    disabled={translating}
                    onClick={() => translateTab('ru')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F0C8]/30 bg-[#00F0C8]/10 px-3 py-1.5 text-xs font-semibold text-[#7FFFE6] hover:bg-[#00F0C8]/20 disabled:opacity-50"
                  >
                    <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                    {translating ? 'Перевод…' : 'RU → КЫР'}
                  </button>
                  <button
                    type="button"
                    disabled={translating}
                    onClick={() => translateTab('kg')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F0C8]/30 bg-[#00F0C8]/10 px-3 py-1.5 text-xs font-semibold text-[#7FFFE6] hover:bg-[#00F0C8]/20 disabled:opacity-50"
                  >
                    <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                    {translating ? 'Перевод…' : 'КЫР → RU'}
                  </button>
                </>
              )}
              {editable && (
                <button
                  type="button"
                  onClick={resetSection}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Вернуть исходное
                </button>
              )}
            </div>
          </div>

          <div className="bento-surface rounded-2xl p-5 sm:p-6">
            {tab === 'brand' && <FieldEditor fieldKey="brand" value={content.brand as unknown as Json} onChange={set('brand')} ctx={ctx} />}
            {tab === 'socials' && <FieldEditor fieldKey="socials" value={content.socials as unknown as Json} onChange={set('socials')} ctx={ctx} />}
            {(tab === 'ru' || tab === 'kg') && (
              <FieldEditor
                fieldKey={tab}
                value={content.ui[tab] as unknown as Json}
                onChange={(next) => setContent({ ...content, ui: { ...content.ui, [tab]: next } as SiteContent['ui'] })}
                ctx={ctx}
              />
            )}
            {tab === 'cases' && <FieldEditor fieldKey="cases" value={content.cases as unknown as Json} onChange={set('cases')} ctx={ctx} />}
            {tab === 'services' && <FieldEditor fieldKey="services" value={content.services as unknown as Json} onChange={set('services')} ctx={ctx} />}
            {tab === 'tools' && (
              <div className="space-y-8">
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-white">Инструменты AI-креатора</h2>
                  <FieldEditor fieldKey="aiTools" value={content.aiTools as unknown as Json} onChange={set('aiTools')} ctx={ctx} />
                </section>
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-white">Инструменты вайб-кодинга</h2>
                  <FieldEditor fieldKey="vibeTools" value={content.vibeTools as unknown as Json} onChange={set('vibeTools')} ctx={ctx} />
                </section>
              </div>
            )}
            {tab === 'reviews' && (
              <FieldEditor
                fieldKey="reviews"
                value={reviews as unknown as Json}
                onChange={(next) => setReviews(next as unknown as ReviewItem[])}
                ctx={ctx}
              />
            )}
            {tab === 'leads' && <LeadsList leads={leads} onDelete={deleteLead} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function LeadsList({ leads, onDelete }: { leads: LeadItem[]; onDelete: (id: string) => void }) {
  if (leads.length === 0) {
    return <p className="text-sm text-white/50">Пока заявок нет.</p>;
  }
  return (
    <ul className="space-y-3">
      {leads.map((l) => (
        <li key={l.id} className="rounded-xl border border-white/[0.08] bg-[#0A0A0C]/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{l.name}</p>
              <p className="text-xs text-[#00F0C8]">{l.contact}</p>
            </div>
            <div className="flex items-center gap-3">
              <time className="text-xs text-white/40">{new Date(l.createdAt).toLocaleString('ru-RU')}</time>
              <button type="button" onClick={() => onDelete(l.id)} className="text-xs text-white/40 hover:text-red-300">
                Удалить
              </button>
            </div>
          </div>
          {l.service && <p className="mt-2 text-xs text-white/60">Направление: {l.service}</p>}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{l.message}</p>
        </li>
      ))}
    </ul>
  );
}
