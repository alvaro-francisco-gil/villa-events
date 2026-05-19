import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, getMessages } from '@cultuvilla/i18n';

export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages: getMessages(DEFAULT_LOCALE),
}));
