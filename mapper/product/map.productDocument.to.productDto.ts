import { AttributesEnum } from "../../../shop-shared/constants/attributesEnum";
import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { ProductDto } from "../../../shop-shared/dto/product/product.dto";
import { getTranslation } from "../../helpers/translationHelpers";
import { ProductDocument } from "../../schema/product.schema";

export function mapProductDocumentToProductDto(
	object: ProductDocument,
	lang: LanguageEnum,
	colorInFilters: string[] = [],
	sizeInFilters: string[] = [],
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
			const maxColorValuesCount = Math.max(
				...object.items.map((item) => (item.attributes[AttributesEnum.COLOR] ?? []).length),
			);

			const [bestItem] = object.items
				.map((item) => ({
					item,
					score:
						// Score how many colors from filters are in item, and what is their position
						colorInFilters
							.map((color) =>
								(item.attributes[AttributesEnum.COLOR] ?? []).indexOf(color),
							)
							.filter((index) => index !== -1)
							.map((index) => (maxColorValuesCount - index) / maxColorValuesCount)
							.reduce((a, b) => a + b, 0) +
						// Score if item has size from filters
						sizeInFilters
							.map((size) =>
								(
									item.attributes[AttributesEnum.SIZE] ??
									item.attributes[AttributesEnum.SIZE_SHOES] ??
									[]
								).includes(size)
									? 1
									: 0,
							)
							.reduce((a, b) => a + b, 0 as number),
				}))
				.sort((a, b) => b.score - a.score);

			if (bestItem) {
				return bestItem.item.sku;
			}

			return object.items[0]?.sku ?? null;
		})(),
		active: object.active,
		createDate: "no any date ololo",
	};
}
