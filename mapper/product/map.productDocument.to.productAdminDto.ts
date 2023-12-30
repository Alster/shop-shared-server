import { ProductAdminDto } from "../../../shop-shared/dto/product/product.dto";
import { ProductDocument } from "../../schema/product.schema";

export function mapProductDocumentToProductAdminDto(object: ProductDocument): ProductAdminDto {
	return {
		id: object._id.toString(),
		publicId: object.publicId,
		title: object.title,
		description: object.description,
		categories: object.categories.map((category) => category.toString()),
		characteristics: object.characteristics,
		items: object.items,
		attrs: object.attrs,
		quantity: object.quantity,
		price: object.price,
		discount: object.discount,
		currency: object.currency,
		active: object.active,
		createDate: "no any date ololo",
	};
}
