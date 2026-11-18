import {
  AI_CREATOR_TOOLS,
  CASES_DATA,
  SERVICES_DATA,
  UI_COPY,
  VIBE_CODING_TOOLS,
  type CaseItem,
  type ServiceItem,
  type ToolItem,
  type UiCopy,
} from '../i18n/translations';

export interface SocialLink {
  name: string;
  handle: string;
  href: string;
}

export interface BrandSettings {
  logoText: string;
  personName: string;
  heroImage: string;
  portraitImage: string;
}

/** Everything on the public site that can be edited from /admin. */
export interface SiteContent {
  brand: BrandSettings;
  socials: SocialLink[];
  ui: { ru: UiCopy; kg: UiCopy };
  cases: CaseItem[];
  services: ServiceItem[];
  aiTools: ToolItem[];
  vibeTools: ToolItem[];
}

export const DEFAULT_CONTENT: SiteContent = {
  brand: {
    logoText: 'DOOLOT.AI',
    personName: 'Doolot',
    heroImage: '/src/assets/images/hero_ai_studio_1794990053430.jpg',
    portraitImage: '/src/assets/images/creator_portrait_1794990053313.jpg',
  },
  socials: [
    { name: 'Telegram', handle: '@doolot_ai', href: 'https://t.me/doolot_ai' },
    { name: 'WhatsApp', handle: '+996 555 019 204', href: 'https://wa.me/996555019204' },
    { name: 'Instagram', handle: '@doolot.ai', href: 'https://instagram.com/doolot.ai' },
    { name: 'Behance', handle: 'behance.net/doolot-ai', href: 'https://behance.net/doolot-ai' },
    { name: 'GitHub', handle: 'github.com/doolotbeka-svg', href: 'https://github.com/doolotbeka-svg' },
  ],
  ui: UI_COPY,
  cases: CASES_DATA,
  services: SERVICES_DATA,
  aiTools: AI_CREATOR_TOOLS,
  vibeTools: VIBE_CODING_TOOLS,
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Deep-merge saved content over defaults so that fields added to the site later
 * still get a value even if the saved JSON predates them. Arrays are taken as-is
 * from the saved content (the admin owns the whole list).
 */
export function mergeWithDefaults<T>(defaults: T, saved: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(saved) ? saved : defaults) as T;
  }
  if (isPlainObject(defaults)) {
    const src = isPlainObject(saved) ? saved : {};
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) {
      out[key] = mergeWithDefaults((defaults as Record<string, unknown>)[key], src[key]);
    }
    return out as T;
  }
  if (typeof defaults === 'number') {
    return (typeof saved === 'number' ? saved : defaults) as T;
  }
  return (typeof saved === 'string' ? saved : defaults) as T;
}
