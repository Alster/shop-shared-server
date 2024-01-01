import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { ProductDto } from "../../../shop-shared/dto/product/product.dto";
import { getTranslation } from "../../helpers/translationHelpers";
import { ProductDocument } from "../../schema/product.schema";

export function mapProductDocumentToProductDto(
	object: ProductDocument,
	lang: LanguageEnum,
	colorInFilters?: string[],
): ProductDto {
	return {
		id: object._id.toString(),
		publicId: object.publicId,
		title: getTranslation(object.title, lang),
		description: getTranslation(object.description, lang),
		categories: object.categories.map((category) => category.toString()),
		characteristics: object.characteristics,
		items: object.items,
		attrs: object.attrs,
		quantity: object.quantity,
		price: object.price,
		discount: object.discount,
		selectedItem: (() => {
			if (!colorInFilters) {
				return object.items[0]?.sku ?? null;
			}

			// const bestItem = object.items.find((item) =>
			// 	(item.attributes["color"] ?? []).some((color) => colorInFilters.includes(color)),
			// );

			const [bestItem] = object.items
				.flatMap((item) =>
					colorInFilters.map((color) => ({
						score: (item.attributes["color"] ?? []).indexOf(color),
						item,
					})),
				)
				.filter((item) => item.score !== -1)
				.map((score) => ({ ...score, score: score.score }))
				.sort((a, b) => a.score - b.score);

			if (bestItem) {
				return bestItem.item.sku;
			}

			return null;
		})(),
		active: object.active,
		createDate: "no any date ololo",
	};
}
