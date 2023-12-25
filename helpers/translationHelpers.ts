import { LanguageEnum } from "../../shop-shared/constants/localization";
import { TranslatedText } from "../../shop-shared/dto/translatedText";

export function getTranslation(translations: TranslatedText, lang: LanguageEnum): string {
	if (!translations) {
		return "";
	}
	return translations[lang] || translations[LanguageEnum.en] || "";
}
