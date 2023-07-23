import { ProductDto } from "shop-shared/dto/product/product.dto";

import { getTranslation } from "../../helpers/translationHelpers";
import { ProductDocument } from "../../schema/product.schema";

export function mapProductDocumentToProductDto(object: ProductDocument, lang: string): ProductDto {
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
		imagesByColor: object.imagesByColor || {},
		active: object.active,
		createDate: "no any date ololo",
	};
}
