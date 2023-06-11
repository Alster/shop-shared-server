import { TranslatedText } from '../../shop-shared/dto/translated-text';

export function getTranslation(
  translations: TranslatedText,
  lang: string,
): string {
  if (!translations) {
    return '';
  }
  return translations[lang] || translations['en'] || '';
}
