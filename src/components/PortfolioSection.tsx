import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type CaseItem, type Language } from '../i18n/translations';
import { useContent } from '../content/ContentContext';
import { ResilientImage } from './ResilientImage';
import { trackEvent } from '../lib/analytics';

type FilterType = 'all' | 'video-art' | 'web-apps';

interface PortfolioSectionProps {
  lang: Language;
  onOpenCase: (item: CaseItem) => void;
}

export function PortfolioSection({ lang, onOpenCase }: PortfolioSectionProps) {
  const content = useContent();
  const [filter, setFilter] = useState<FilterType>('all');
  const t = content.ui[lang].portfolio;

  const filteredCases =
    filter === 'all' ? content.cases : content.cases.filter((c) => c.category === filter);

  const filterTabs: { id: FilterType; label: string }[] = [
    { id: 'all', label: t.filters.all },
    { id: 'video-art', label: t.filters.videoArt },
    { id: 'web-apps', label: t.filters.webApps },
  ];

  const handleFilterChange = (nextFilter: FilterType) => {
    setFilter(nextFilter);
    trackEvent('portfolio_filter', lang, { filter: nextFilter });
  };

  return (
    <section
      id="cases"
      className="border-t border-white/[0.08] bg-[#0D0D11]/50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header + Interactive Filter Controls */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#00F0C8]">
              {t.sectionLabel}
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t.sectionTitle}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label={t.sectionTitle}
            className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#141419] p-1"
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleFilterChange(tab.id)}
                  className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#00F0C8] sm:text-sm ${
                    active
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-white/65 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsive Cases Grid */}
        <motion.div
          layout
          className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredCases.map((item) => {
              const copy = lang === 'ru' ? item.ru : item.kg;
              return (
                <motion.article
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="bento-surface bento-surface-hover group flex flex-col overflow-hidden rounded-2xl"
                >
                  {/* Media Preview */}
                  <button
                    type="button"
                    onClick={() => onOpenCase(item)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-[#0A0A0C] text-left focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
                  >
                    <ResilientImage
                      src={item.image}
                      alt={copy.title}
                      titleFallback={copy.title}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#121216]/90 via-transparent to-transparent"
                    />
                  </button>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-white/55">
                        <span className="text-[#00F0C8]">{copy.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.client}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.year}</span>
                      </div>

                      <h3 className="font-display mt-2.5 text-lg font-semibold leading-snug text-white">
                        {copy.title}
                      </h3>

                      <p className="mt-2.5 text-sm leading-relaxed text-white/70">
                        {copy.shortDesc}
                      </p>
                    </div>

                    <div className="mt-6 space-y-4 border-t border-white/[0.08] pt-4">
                      <p className="text-xs text-white/55">
                        {item.tools.join(' · ')}
                      </p>

                      <button
                        type="button"
                        onClick={() => onOpenCase(item)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-white transition-colors hover:text-[#00F0C8] focus-visible:outline-2 focus-visible:outline-[#8B5CF6]"
                      >
                        <span>{t.detailsBtn}</span>
                        <ArrowUpRight
                          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
