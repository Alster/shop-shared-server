import {
  CategoriesTree,
  CategoriesTreeDocument,
  CategoryNode,
} from '../schema/categories-tree.schema';
import { ObjectId } from 'mongodb';
import {
  CategoriesNodeDto,
  CategoriesTreeDto,
} from '../../shop_shared/dto/categories-tree.dto';

function mapCategoryNodeToCategoriesNodeDTO(
  obj: CategoryNode,
): CategoriesNodeDto {
  return {
    id: obj._id.toString(),
    title: obj.title,
    description: obj.title,
    children: obj.children.map((child) =>
      mapCategoryNodeToCategoriesNodeDTO(child),
    ),
    sort: obj.sort,
    active: obj.active,
  };
}

export function mapCategoriesTreeDocumentToCategoriesTreeDTO(
  obj: CategoriesTreeDocument,
): CategoriesTreeDto {
  return {
    root: obj.root.map(mapCategoryNodeToCategoriesNodeDTO),
  };
}

export function mapCategoriesNodeDTOToCategoryNode(
  obj: CategoriesNodeDto,
): CategoryNode {
  return {
    _id: new ObjectId(obj.id),
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
