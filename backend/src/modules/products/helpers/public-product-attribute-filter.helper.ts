import { AppError } from '../../../shared/errors/AppError.js';
import { CategoryModel } from '../../admin/categories/models/category.model.js';
import type { CategoryAttribute } from '../../admin/categories/types/category.types.js';

function invalidAttributeFilter(): AppError {
  return new AppError({
    statusCode: 400,
    code: 'INVALID_PRODUCT_ATTRIBUTE_FILTER',
    message: 'One or more category attribute filters are invalid.',
  });
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds exact-match query conditions from the category's filterable attributes. */
export async function buildPublicProductAttributeMatch(
  categoryId: string | undefined,
  filters: Record<string, string>,
): Promise<Record<string, unknown>> {
  const entries = Object.entries(filters);

  if (entries.length === 0) return {};
  if (!categoryId) throw invalidAttributeFilter();

  const category = await CategoryModel.findOne({
    _id: categoryId,
    status: 'active',
  })
    .select('attributes')
    .lean()
    .exec();

  if (!category) throw invalidAttributeFilter();

  const definitionsBySlug = new Map<string, CategoryAttribute>(
    category.attributes.map((attribute: CategoryAttribute): [string, CategoryAttribute] => [
      attribute.slug,
      attribute,
    ]),
  );
  const match: Record<string, unknown> = {};

  for (const [slug, rawValue] of entries) {
    const definition = definitionsBySlug.get(slug);
    const value = rawValue.trim();

    if (!definition || definition.filterable !== true || !value) {
      throw invalidAttributeFilter();
    }

    const field = `attributes.${slug}`;

    switch (definition.type) {
      case 'text':
        match[field] = {
          $regex: `^${escapeRegularExpression(value)}$`,
          $options: 'i',
        };
        break;

      case 'select': {
        const option = definition.options.find(
          (candidate) => candidate.trim().toLowerCase() === value.toLowerCase(),
        );

        if (!option) throw invalidAttributeFilter();

        match[field] = {
          $regex: `^${escapeRegularExpression(option.trim())}$`,
          $options: 'i',
        };
        break;
      }

      case 'number': {
        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) throw invalidAttributeFilter();

        match[field] = numberValue;
        break;
      }

      case 'boolean':
        if (value !== 'true' && value !== 'false') throw invalidAttributeFilter();

        match[field] = value === 'true';
        break;
    }
  }

  return match;
}
