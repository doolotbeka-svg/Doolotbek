import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { type Language, UI_COPY } from '../i18n/translations';
import { sendContactMessage } from '../lib/emailjs';

interface ContactFooterProps {
  lang: Language;
  preselectedService: string;
  onChangeLang: (lang: Language) => void;
}

const SOCIAL_LINKS = [
  {
    name: 'Telegram',
    handle: '@arsen_ai_kg',
    href: 'https://t.me/arsen_ai_kg',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    handle: '+996 555 019 204',
    href: 'https://wa.me/996555019204',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.12c-.24.69-1.41 1.32-1.96 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.99-.32-1.71-.63-3.01-1.3-4.97-4.33-5.12-4.53-.15-.2-1.22-1.63-1.22-3.11 0-1.48.77-2.21 1.05-2.51.27-.3.6-.38.8-.38.2 0 .4 0 .58.01.19.01.44-.07.69.52.24.6.83 2.07.91 2.22.07.15.12.33.02.53-.1.2-.15.33-.3.5-.15.18-.32.4-.45.53-.15.15-.31.32-.13.62.18.3.79 1.3 1.7 2.11 1.17 1.04 2.16 1.36 2.46 1.51.3.15.48.13.66-.08.18-.2.75-.88.95-1.18.2-.3.4-.25.68-.15.28.1 1.76.83 2.06.98.3.15.5.22.58.35.07.13.07.75-.17 1.44z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@arsen.ai.kg',
    href: 'https://instagram.com/arsen.ai.kg',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    name: 'Behance',
    handle: 'behance.net/arsen-ai',
    href: 'https://behance.net/arsen-ai',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M22 7h-7v2h7V7zm-3.5 3.5c-2.5 0-4.2 1.8-4.2 4.5s1.6 4.5 4.3 4.5c2 0 3.5-1 4-2.6h-2.1c-.3.6-.9.9-1.8.9-1.1 0-1.9-.6-2.1-1.9h6.1c.1-.3.1-.7.1-1 0-2.7-1.7-4.4-4.3-4.4zm-1.9 3.6c.2-1.1.9-1.8 1.9-1.8s1.7.6 1.9 1.8h-3.8zM7.6 11.4c1-.4 1.6-1.2 1.6-2.3 0-2-1.4-3-4-3H1v12.8h4.5c2.7 0 4.3-1.2 4.3-3.5 0-1.5-.8-2.6-2.2-3zM3.4 8h1.8c1 0 1.6.4 1.6 1.2 0 .8-.6 1.2-1.6 1.2H3.4V8zm2 8.9H3.4v-3.2h2c1.2 0 1.9.5 1.9 1.6 0 1.1-.7 1.6-1.9 1.6z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    handle: 'github.com/arsen-ai-kg',
    href: 'https://github.com/arsen-ai-kg',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
];

export function ContactFooter({
  lang,
  preselectedService,
  onChangeLang,
}: ContactFooterProps) {
  const t = UI_COPY[lang].contact;
  const f = UI_COPY[lang].footer;
  const nav = UI_COPY[lang].nav;

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState<string>(t.form.serviceOptions[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (preselectedService) {
      setService(preselectedService);
    } else {
      setService(t.form.serviceOptions[0]);
    }
  }, [preselectedService, t.form.serviceOptions]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('idle');

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setStatus('error');
      return;
    }

    setSending(true);
    try {
      await sendContactMessage({
        name: name.trim(),
        contact: contact.trim(),
        service,
        message: message.trim(),
        lang,
      });
      setName('');
      setContact('');
      setMessage('');
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <footer id="contact" className="border-t border-white/[0.08] bg-[#0A0A0C]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left: CTA + Direct Social Channels */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#8B5CF6]">
                {t.sectionLabel}
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl [text-wrap:balance]">
                {t.headline}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                {t.subtitle}
              </p>
            </div>

            <div className="mt-10 border-t border-white/[0.08] pt-8">
              <h3 className="text-sm font-semibold text-white">{t.directTitle}</h3>
              <p className="mt-1 text-xs text-white/55">{t.directSubtitle}</p>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bento-surface bento-surface-hover flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-2.5 text-white/85 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
                  >
                    <span className="text-[#00F0C8]">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">
                        {item.name}
                      </div>
                      <div className="truncate text-[11px] text-white/55">
                        {item.handle}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: EmailJS Contact Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bento-surface rounded-2xl p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-medium text-white/75"
                  >
                    {t.form.nameLabel}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.form.namePlaceholder}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0C] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#8B5CF6] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-channel"
                    className="block text-xs font-medium text-white/75"
                  >
                    {t.form.contactLabel}
                  </label>
                  <input
                    id="contact-channel"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t.form.contactPlaceholder}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0C] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#8B5CF6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="contact-service"
                  className="block text-xs font-medium text-white/75"
                >
                  {t.form.serviceLabel}
                </label>
                <select
                  id="contact-service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0C] px-4 py-3 text-sm text-white focus:border-[#8B5CF6] focus:outline-none"
                >
                  {preselectedService &&
                    !(t.form.serviceOptions as readonly string[]).includes(
                      preselectedService,
                    ) && (
                      <option value={preselectedService}>
                        {preselectedService}
                      </option>
                    )}
                  {t.form.serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-medium text-white/75"
                >
                  {t.form.messageLabel}
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.form.messagePlaceholder}
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0C] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>

              {status === 'success' && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#00F0C8]/35 bg-[#00F0C8]/10 px-4 py-3 text-xs text-[#00F0C8]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{t.form.successTitle}</p>
                    <p className="mt-0.5 text-white/80">{t.form.successBody}</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                  {t.form.errorBody}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{sending ? t.form.sending : t.form.submitBtn}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Clean Minimal Bottom Bar */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-white/75">{f.rights}</p>
            <p className="mt-0.5">{f.tagline}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#about" className="hover:text-white">
              {nav.about}
            </a>
            <a href="#cases" className="hover:text-white">
              {nav.cases}
            </a>
            <a href="#services" className="hover:text-white">
              {nav.services}
            </a>
            <a href="#reviews" className="hover:text-white">
              {nav.reviews}
            </a>
            <button
              type="button"
              onClick={() => onChangeLang(lang === 'ru' ? 'kg' : 'ru')}
              className="font-semibold text-[#00F0C8] hover:underline"
            >
              {lang === 'ru' ? 'КЫРГЫЗЧА' : 'РУССКИЙ'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
