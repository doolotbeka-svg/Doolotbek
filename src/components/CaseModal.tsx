import { useEffect } from 'react';
import { ArrowUpRight, ExternalLink, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type CaseItem, type Language } from '../i18n/translations';
import { useContent } from '../content/ContentContext';
import { ResilientImage } from './ResilientImage';

interface CaseModalProps {
  item: CaseItem | null;
  lang: Language;
  onClose: () => void;
  onDiscussProject: (caseTitle: string) => void;
}

export function CaseModal({ item, lang, onClose, onDiscussProject }: CaseModalProps) {
  const site = useContent();
  const t = site.ui[lang].portfolio.modal;

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  const content = item ? (lang === 'ru' ? item.ru : item.kg) : null;

  return (
    <AnimatePresence>
      {item && content && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bento-surface relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#111116]"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0A0A0C]/85 text-white transition-colors hover:border-[#00F0C8]/60 hover:text-[#00F0C8] focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Media Header */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0A0A0C]">
              <ResilientImage
                src={item.image}
                alt={content.title}
                titleFallback={content.title}
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111116] via-[#111116]/20 to-transparent"
              />
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span className="font-medium text-[#00F0C8]">{content.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{item.client}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{item.year}</span>
              </div>

              <h3
                id="case-modal-title"
                className="font-display mt-2 text-xl font-bold text-white sm:text-2xl [text-wrap:balance]"
              >
                {content.title}
              </h3>

              <div className="mt-6 space-y-5 border-t border-white/[0.08] pt-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t.challenge}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                    {content.challenge}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t.solution}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                    {content.solution}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#00F0C8]">
                    {t.result}
                  </h4>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-white">
                    {content.result}
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-4 text-xs text-white/65">
                  <span className="text-white/45">{t.toolsLabel}: </span>
                  <span className="font-medium text-white/90">
                    {item.tools.join(' · ')}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDiscussProject(content.title);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#00F0C8]"
                >
                  <span>{t.discussSimilar}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <a
                  href={item.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/85 transition-colors hover:border-[#00F0C8]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-[#8B5CF6]"
                >
                  <span>{t.visitDemo}</span>
                  <ExternalLink className="h-4 w-4 text-[#00F0C8]" aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
