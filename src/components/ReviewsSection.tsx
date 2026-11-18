import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { type Language } from '../i18n/translations';
import { useContent } from '../content/ContentContext';
import { trackEvent } from '../lib/analytics';

export interface ReviewItem {
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

interface ReviewsSectionProps {
  lang: Language;
}

export function ReviewsSection({ lang }: ReviewsSectionProps) {
  const content = useContent();
  const t = content.ui[lang].reviews;
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [roleCompany, setRoleCompany] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    let active = true;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Load failed'))))
      .then((data) => {
        if (active && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {
        // Keep clean empty/fallback list if offline
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('idle');

    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName || cleanText.length < 10) {
      setStatus('error');
      return;
    }

    const parts = roleCompany.split(',').map((p) => p.trim());
    const role = parts[0] || '';
    const company = parts[1] || '';

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          role,
          company,
          rating,
          text: cleanText,
          lang,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const data = await response.json();
      if (data.review) {
        setReviews((prev) => [data.review, ...prev]);
      }

      setName('');
      setRoleCompany('');
      setRating(5);
      setText('');
      setStatus('success');
      trackEvent('review_submit', lang, { rating: String(rating) });
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="reviews"
      className="border-t border-white/[0.08] bg-[#0D0D11]/50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-[#00F0C8]">
            {t.sectionLabel}
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl [text-wrap:balance]">
            {t.sectionTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Attributable Testimonials List */}
          <div className="space-y-4 lg:col-span-7">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="bento-surface h-36 animate-pulse rounded-2xl bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : (
              reviews.slice(0, 4).map((rev, idx) => (
                <motion.article
                  key={rev.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="bento-surface rounded-2xl p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{rev.name}</h3>
                      <p className="mt-0.5 text-xs text-white/55">
                        {rev.role}
                        {rev.company ? ` · ${rev.company}` : ''}
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums">{rev.date}</span>
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-0.5"
                      aria-label={`${rev.rating} / 5`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating
                              ? 'fill-[#00F0C8] text-[#00F0C8]'
                              : 'text-white/20'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/80">
                    {lang === 'ru' ? rev.textRu : rev.textKg}
                  </p>
                </motion.article>
              ))
            )}
          </div>

          {/* Right: Interactive Feedback Collection Form */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="bento-surface rounded-2xl p-6 sm:p-7"
            >
              <h3 className="font-display text-lg font-semibold text-white">
                {t.formTitle}
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="review-name"
                    className="block text-xs font-medium text-white/75"
                  >
                    {t.nameLabel}
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0C] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#00F0C8] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="review-role"
                    className="block text-xs font-medium text-white/75"
                  >
                    {t.roleLabel}
                  </label>
                  <input
                    id="review-role"
                    type="text"
                    value={roleCompany}
                    onChange={(e) => setRoleCompany(e.target.value)}
                    placeholder={t.rolePlaceholder}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0C] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#00F0C8] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-white/75">
                    {t.ratingLabel}
                  </span>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        aria-label={`${starValue} / 5`}
                        aria-pressed={rating === starValue}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0A0A0C] transition-colors hover:border-[#00F0C8]/60 focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            starValue <= rating
                              ? 'fill-[#00F0C8] text-[#00F0C8]'
                              : 'text-white/25'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-text"
                    className="block text-xs font-medium text-white/75"
                  >
                    {t.textLabel}
                  </label>
                  <textarea
                    id="review-text"
                    rows={4}
                    required
                    minLength={10}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.textPlaceholder}
                    className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0C] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#00F0C8] focus:outline-none"
                  />
                </div>

                {status === 'success' && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#00F0C8]/30 bg-[#00F0C8]/10 px-3.5 py-2.5 text-xs font-medium text-[#00F0C8]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.successMsg}</span>
                  </div>
                )}

                {status === 'error' && (
                  <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                    {t.errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00F0C8] hover:text-[#0A0A0C] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
                >
                  {submitting ? t.submitting : t.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
