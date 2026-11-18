/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { type CaseItem, type Language, UI_COPY } from './i18n/translations';
import { initAnalytics, trackEvent } from './lib/analytics';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { AboutBento } from './components/AboutBento';
import { PortfolioSection } from './components/PortfolioSection';
import { CaseModal } from './components/CaseModal';
import { ServicesSection } from './components/ServicesSection';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactFooter } from './components/ContactFooter';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('arsen_lang');
      if (saved === 'kg' || saved === 'ru') return saved;
    }
    return 'ru';
  });

  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [preselectedService, setPreselectedService] = useState('');

  useEffect(() => {
    initAnalytics();
    trackEvent('pageview', lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem('arsen_lang', lang);
    document.documentElement.lang = lang === 'kg' ? 'ky' : 'ru';
    document.title = UI_COPY[lang].seoTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', UI_COPY[lang].seoDescription);
    }
  }, [lang]);

  const handleChangeLang = (nextLang: Language) => {
    if (nextLang === lang) return;
    setLang(nextLang);
    trackEvent('lang_switch', nextLang);
  };

  const handleOpenCase = (item: CaseItem) => {
    setActiveCase(item);
    trackEvent('case_open', lang, { caseId: item.id });
  };

  const scrollToContactWithTopic = (topic: string) => {
    setPreselectedService(topic);
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    trackEvent('service_intent', lang, { topic });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F8FAFC]">
      <Header lang={lang} onChangeLang={handleChangeLang} />

      <main>
        <HeroSection lang={lang} />
        <AboutBento lang={lang} />
        <PortfolioSection lang={lang} onOpenCase={handleOpenCase} />
        <ServicesSection lang={lang} onSelectService={scrollToContactWithTopic} />
        <ReviewsSection lang={lang} />
      </main>

      <ContactFooter
        lang={lang}
        preselectedService={preselectedService}
        onChangeLang={handleChangeLang}
      />

      <CaseModal
        item={activeCase}
        lang={lang}
        onClose={() => setActiveCase(null)}
        onDiscussProject={(caseTitle) =>
          scrollToContactWithTopic(
            lang === 'ru'
              ? `Похожий проект: ${caseTitle}`
              : `Окшош долбоор: ${caseTitle}`,
          )
        }
      />
    </div>
  );
}
