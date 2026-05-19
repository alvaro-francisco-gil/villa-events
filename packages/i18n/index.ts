import es from './messages/es.json' with { type: 'json' };

export type Locale = 'es';

const CATALOGS: Record<Locale, Record<string, unknown>> = {
  es,
};

export function getMessages(locale: Locale): Record<string, unknown> {
  return CATALOGS[locale];
}

export const SUPPORTED_LOCALES: Locale[] = ['es'];
export const DEFAULT_LOCALE: Locale = 'es';
