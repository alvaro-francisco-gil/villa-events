export const locales = ['es'] as const;
export const defaultLocale = 'es';
export type Locale = (typeof locales)[number];
