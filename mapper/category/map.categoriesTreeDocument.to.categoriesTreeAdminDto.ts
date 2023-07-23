import { ObjectId } from "mongodb";

import {
	CategoriesNodeAdminDto,
	CategoriesTreeAdminDto,
} from "../../../shop-shared/dto/category/categoriesTree.dto";
import {
	CategoriesTree,
	CategoriesTreeDocument,
	CategoryNode,
} from "../../schema/categoriesTree.schema";

function mapCategoryNodeToCategoriesNodeDTO(object: CategoryNode): CategoriesNodeAdminDto {
	return {
		id: object._id.toString(),
		publicId: object.publicId,
		title: object.title,
		description: object.title,
		children: object.children.map((child) => mapCategoryNodeToCategoriesNodeDTO(child)),
		sort: object.sort,
		active: object.active,
	};
}

export function mapCategoriesTreeDocumentToCategoriesTreeAdminDto(
	object: CategoriesTreeDocument,
): CategoriesTreeAdminDto {
	return {
		root: object.root.map((node) => mapCategoryNodeToCategoriesNodeDTO(node)),
	};
}

export function mapCategoriesNodeDTOToCategoryNode(object: CategoriesNodeAdminDto): CategoryNode {
	return {
		_id: new ObjectId(object.id),
		publicId: object.publicId,
		title: object.title,
		description: object.title,
		children: object.children.map((child) => mapCategoriesNodeDTOToCategoryNode(child)),
		sort: object.sort,
		active: object.active,
	};
}

export function mapCategoriesTreeDTOToCategories(object: CategoryNode[]): CategoriesTree {
	return {
		root: object,
	};
}
