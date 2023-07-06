import {
  CategoriesTree,
  CategoriesTreeDocument,
  CategoryNode,
} from '../../schema/categories-tree.schema';
import { ObjectId } from 'mongodb';
import {
  CategoriesNodeAdminDto,
  CategoriesTreeAdminDto,
} from '../../../shop-shared/dto/category/categories-tree.dto';

function mapCategoryNodeToCategoriesNodeDTO(
  obj: CategoryNode,
): CategoriesNodeAdminDto {
  return {
    id: obj._id.toString(),
    publicId: obj.publicId,
    title: obj.title,
    description: obj.title,
    children: obj.children.map((child) =>
      mapCategoryNodeToCategoriesNodeDTO(child),
    ),
    sort: obj.sort,
    active: obj.active,
  };
}

export function mapCategoriesTreeDocumentToCategoriesTreeAdminDTO(
  obj: CategoriesTreeDocument,
): CategoriesTreeAdminDto {
  return {
    root: obj.root.map(mapCategoryNodeToCategoriesNodeDTO),
  };
}

export function mapCategoriesNodeDTOToCategoryNode(
  obj: CategoriesNodeAdminDto,
): CategoryNode {
  return {
    _id: new ObjectId(obj.id),
    publicId: obj.publicId,
    title: obj.title,
    description: obj.title,
    children: obj.children.map((child) =>
      mapCategoriesNodeDTOToCategoryNode(child),
    ),
    sort: obj.sort,
    active: obj.active,
  };
}

export function mapCategoriesTreeDTOToCategories(
  obj: CategoryNode[],
): CategoriesTree {
  return {
    root: obj,
  };
}
