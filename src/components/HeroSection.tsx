import { ArrowUpRight, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { type Language } from '../i18n/translations';
import { useContent } from '../content/ContentContext';
import { ShaderCanvas } from './ShaderCanvas';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  lang: Language;
}

export function HeroSection({ lang }: HeroSectionProps) {
  const content = useContent();
  const t = content.ui[lang].hero;

  return (
    <section id="top" className="relative overflow-hidden border-b border-white/[0.08]">
      <ShaderCanvas />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
        {/* Split-screen Hero */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Typographic Anchor */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between lg:col-span-7"
          >
            <div>
              <p className="mb-5 text-xs font-medium tracking-wide text-[#00F0C8]">
                {t.kicker}
              </p>

              <h1 className="font-display max-w-2xl text-[clamp(1.95rem,3.9vw,3.35rem)] font-bold leading-[1.12] tracking-tight text-white [text-wrap:balance]">
                {t.headline}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                {t.subtitle}
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#cases"
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap shrink-0 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0C8]"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>{t.ctaPrimary}</span>
              </a>

              <a
                href="#contact"
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:border-[#00F0C8]/50 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]"
              >
                <span>{t.ctaSecondary}</span>
                <ArrowUpRight className="h-4 w-4 text-[#00F0C8]" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          {/* Right Media Container matching height */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="bento-surface relative h-full min-h-[280px] overflow-hidden rounded-2xl">
              <ResilientImage
                src={content.brand.heroImage}
                alt={t.studioCaption}
                titleFallback={`${content.brand.logoText} Studio`}
                priority
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/85 via-[#0A0A0C]/20 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs font-medium text-white/80">
                  {t.studioCaption}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-width 4-column proof strip below the split */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-8 sm:grid-cols-4 sm:gap-6">
          {t.metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="font-display tabular-nums text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {metric.value}
              </div>
              <p className="text-xs leading-snug text-white/60 sm:text-sm">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
