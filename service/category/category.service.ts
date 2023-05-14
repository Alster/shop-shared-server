import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CategoriesTree,
  CategoriesTreeDocument,
  CategoryNode,
} from '../../schema/categories-tree.schema';
import {
  Category,
  CategoryDocument,
} from '../../schema/category.schema';

@Injectable()
export class CategoryService {
  private logger: Logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(CategoriesTree.name)
    private categoriesModel: Model<CategoriesTreeDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  public async getCategoriesTree(): Promise<CategoriesTreeDocument> {
    const result = await this.categoriesModel.findOne().exec();
    if (!result) {
      throw new Error('Categories tree not found');
    }
    return result;
  }

  public async saveCategoriesTree(
    categoriesTree: CategoryNode[],
  ): Promise<void> {
    const session = await this.categoriesModel.startSession();

    await session.withTransaction(async () => {
      const foundTree = await this.categoriesModel
        .findOne()
        .session(session)
        .exec();
      if (!foundTree) {
        throw new Error('Categories tree not found');
      }

      await this.categoriesModel
        .updateOne(
          { _id: foundTree._id },
          { $set: { root: categoriesTree } },
          { session },
        )
        .exec();

      await this.categoryModel.deleteMany({}).session(session).exec();
      const categories = this.convertTreeToCategories(categoriesTree, []);
      await this.categoryModel.insertMany(categories, { session });
    });

    await session.endSession();
  }

  getCategories(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  private convertTreeToCategories(
    categoriesTree: CategoryNode[],
    parents: CategoryNode[],
  ): Category[] {
    const categories: Category[] = [];
    for (const category of categoriesTree) {
      categories.push({
        _id: category._id,
        title: category.title,
        description: category.description,
        children: category.children.map((child) => child._id),
        parents: parents.map((parent) => parent._id),
        sort: category.sort,
      });
      categories.push(
        ...this.convertTreeToCategories(category.children, [
          ...parents,
          category,
        ]),
      );
    }

    return categories;
  }
}
