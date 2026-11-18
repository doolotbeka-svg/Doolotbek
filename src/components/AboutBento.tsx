import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Sparkles, Terminal } from 'lucide-react';
import {
  AI_CREATOR_TOOLS,
  type Language,
  UI_COPY,
  VIBE_CODING_TOOLS,
} from '../i18n/translations';
import { ResilientImage } from './ResilientImage';

interface AboutBentoProps {
  lang: Language;
}

export function AboutBento({ lang }: AboutBentoProps) {
  const t = UI_COPY[lang].about;
  const [activeAiTool, setActiveAiTool] = useState(AI_CREATOR_TOOLS[0].name);
  const [activeVibeTool, setActiveVibeTool] = useState(VIBE_CODING_TOOLS[0].name);

  const selectedAi = AI_CREATOR_TOOLS.find((x) => x.name === activeAiTool) || AI_CREATOR_TOOLS[0];
  const selectedVibe =
    VIBE_CODING_TOOLS.find((x) => x.name === activeVibeTool) || VIBE_CODING_TOOLS[0];

  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-[#8B5CF6]">
          {t.sectionLabel}
        </p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl [text-wrap:balance]">
          {t.sectionTitle}
        </h2>
      </div>

      {/* Asymmetric Dark Bento Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Card 1: Who I am (Wide Bento Card) */}
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bento-surface bento-surface-hover overflow-hidden rounded-2xl lg:col-span-7"
        >
          <div className="grid h-full grid-cols-1 sm:grid-cols-12">
            <div className="relative min-h-[260px] sm:col-span-5">
              <ResilientImage
                src="/src/assets/images/creator_portrait_1794990053313.jpg"
                alt={t.whoHeadline}
                titleFallback="Arsen Amanov"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-[#121216]/90"
              />
            </div>

            <div className="flex flex-col justify-between p-6 sm:col-span-7 sm:p-8">
              <div>
                <p className="text-xs font-medium text-[#00F0C8]">{t.whoTitle}</p>
                <h3 className="font-display mt-2 text-xl font-semibold leading-snug text-white [text-wrap:balance]">
                  {t.whoHeadline}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-[15px]">
                  {t.whoBody}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-xs text-white/60">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8B5CF6]" aria-hidden="true" />
                <span>{t.locationLine}</span>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Card 2: AI Creator Tools */}
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="bento-surface bento-surface-hover flex flex-col justify-between rounded-2xl p-6 sm:p-8 lg:col-span-5"
        >
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-white">
                {t.creatorTitle}
              </h3>
              <Sparkles className="h-4 w-4 shrink-0 text-[#8B5CF6]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {t.creatorSubtitle}
            </p>

            {/* Clean interactive typographic grid (no pill-badge clutter) */}
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
              {AI_CREATOR_TOOLS.map((tool) => {
                const isSelected = tool.name === activeAiTool;
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => setActiveAiTool(tool.name)}
                    onMouseEnter={() => setActiveAiTool(tool.name)}
                    className={`min-h-[40px] whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#00F0C8] ${
                      isSelected
                        ? 'bg-[#8B5CF6]/20 text-white'
                        : 'text-white/65 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {tool.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 border-t border-white/[0.08] pt-4 text-xs text-white/75">
            <span className="font-semibold text-[#00F0C8]">{selectedAi.name}</span>
            <span aria-hidden="true" className="mx-2 text-white/30">·</span>
            <span>{lang === 'ru' ? selectedAi.ruRole : selectedAi.kgRole}</span>
          </div>
        </motion.article>

        {/* Card 3: Vibe Coding Stack (Full-width bottom bento bar) */}
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bento-surface bento-surface-hover rounded-2xl p-6 sm:p-8 lg:col-span-12"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-md">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-4 w-4 shrink-0 text-[#00F0C8]" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-white">
                  {t.vibeTitle}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {t.vibeSubtitle}
              </p>
              <p className="mt-4 text-xs text-white/75">
                <span className="font-semibold text-[#8B5CF6]">{selectedVibe.name}</span>
                <span aria-hidden="true" className="mx-2 text-white/30">·</span>
                <span>{lang === 'ru' ? selectedVibe.ruRole : selectedVibe.kgRole}</span>
              </p>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {VIBE_CODING_TOOLS.map((tool) => {
                const isSelected = tool.name === activeVibeTool;
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => setActiveVibeTool(tool.name)}
                    onMouseEnter={() => setActiveVibeTool(tool.name)}
                    className={`min-h-[42px] whitespace-nowrap rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#00F0C8] ${
                      isSelected
                        ? 'border-[#00F0C8]/50 bg-[#00F0C8]/10 text-[#00F0C8]'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {tool.name}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
