import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { type Language } from '../i18n/translations';
import { useContent } from '../content/ContentContext';

interface HeaderProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
}

export function Header({ lang, onChangeLang }: HeaderProps) {
  const content = useContent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = content.ui[lang].nav;

  const navLinks = [
    { href: '#about', label: t.about },
    { href: '#cases', label: t.cases },
    { href: '#services', label: t.services },
    { href: '#reviews', label: t.reviews },
    { href: '#contact', label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0C]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="font-display whitespace-nowrap shrink-0 text-base font-bold tracking-tight text-white transition-colors hover:text-[#00F0C8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]"
        >
          {content.brand.logoText}
        </a>

        {/* Zone 2: Single-line Anchor Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-white/70"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white hover:underline hover:decoration-[#00F0C8] hover:underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Language Switcher (RU | КЫР) + Mobile Drawer Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center rounded-lg border border-white/10 bg-[#141419] p-1"
          >
            {(['ru', 'kg'] as const).map((code) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLang(code)}
                  aria-pressed={active}
                  className={`relative whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0C8] ${
                    active ? 'text-[#0A0A0C]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="lang-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-md bg-gradient-to-r from-[#00F0C8] to-[#8B5CF6]"
                    />
                  )}
                  <span className="relative z-10">
                    {code === 'ru' ? 'RU' : 'КЫР'}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#141419] text-white/80 transition-colors hover:text-white md:hidden focus-visible:outline-2 focus-visible:outline-[#8B5CF6]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-white/[0.08] bg-[#0A0A0C]/95 px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
