import { ArrowUpRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { type Language, SERVICES_DATA, UI_COPY } from '../i18n/translations';

interface ServicesSectionProps {
  lang: Language;
  onSelectService: (serviceTitle: string) => void;
}

export function ServicesSection({ lang, onSelectService }: ServicesSectionProps) {
  const t = UI_COPY[lang].services;

  return (
    <section id="services" className="border-t border-white/[0.08] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-[#8B5CF6]">
            {t.sectionLabel}
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl [text-wrap:balance]">
            {t.sectionTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SERVICES_DATA.map((service, index) => {
            const copy = lang === 'ru' ? service.ru : service.kg;
            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bento-surface bento-surface-hover flex flex-col justify-between rounded-2xl p-6 sm:p-8"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span className="font-mono tabular-nums text-[#00F0C8]">
                      {service.number}
                    </span>
                    <span>
                      {t.timelineLabel}{' '}
                      <strong className="font-semibold text-white/85">
                        {copy.timeline}
                      </strong>
                    </span>
                  </div>

                  <h3 className="font-display mt-4 text-lg font-semibold leading-snug text-white [text-wrap:balance]">
                    {copy.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {copy.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t border-white/[0.08] pt-5">
                    {copy.deliverables.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 text-sm text-white/80"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#00F0C8]"
                          aria-hidden="true"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => onSelectService(copy.title)}
                    className="inline-flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/15 focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
                  >
                    <span className="whitespace-nowrap">{copy.cta}</span>
                    <ArrowUpRight className="h-4 w-4 text-[#00F0C8]" aria-hidden="true" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
