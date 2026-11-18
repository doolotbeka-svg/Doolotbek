import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_CONTENT, mergeWithDefaults, type SiteContent } from './types';

const ContentContext = createContext<SiteContent>(DEFAULT_CONTENT);

export function useContent(): SiteContent {
  return useContext(ContentContext);
}

/** Loads the editable site content from /api/content, falling back to built-in defaults. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    let done = false;
    const finish = (value: SiteContent) => {
      if (done) return;
      done = true;
      setContent(value);
    };
    // Never leave the page blank for long if the API is slow or down.
    const timer = window.setTimeout(() => finish(DEFAULT_CONTENT), 4000);

    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('content load failed'))))
      .then((data) => finish(mergeWithDefaults(DEFAULT_CONTENT, data?.content)))
      .catch(() => finish(DEFAULT_CONTENT))
      .finally(() => window.clearTimeout(timer));

    return () => window.clearTimeout(timer);
  }, []);

  if (!content) {
    return <div className="min-h-screen bg-[#0A0A0C]" aria-busy="true" />;
  }

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
