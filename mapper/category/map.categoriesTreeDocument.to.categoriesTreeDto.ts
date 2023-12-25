import { LanguageEnum } from "../../../shop-shared/constants/localization";
import {
	CategoriesNodeDto,
	CategoriesTreeDto,
} from "../../../shop-shared/dto/category/categoriesTree.dto";
import { CategoriesTreeDocument, CategoryNode } from "../../schema/categoriesTree.schema";

function mapCategoryNodeToCategoriesNodeDTO(
	object: CategoryNode,
	lang: LanguageEnum,
): CategoriesNodeDto {
	return {
		id: object._id.toString(),
		publicId: object.publicId,
		title: object.title[lang] ?? "",
		description: object.title[lang] ?? "",
		children: object.children.map((child) => mapCategoryNodeToCategoriesNodeDTO(child, lang)),
		sort: object.sort,
		active: object.active,
	};
}

export function mapCategoriesTreeDocumentToCategoriesTreeDto(
	object: CategoriesTreeDocument,
	lang: LanguageEnum,
): CategoriesTreeDto {
	return {
		root: object.root.map((o) => mapCategoryNodeToCategoriesNodeDTO(o, lang)),
	};
}
