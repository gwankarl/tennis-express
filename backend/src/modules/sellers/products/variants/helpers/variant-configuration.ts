import { AppError } from '../../../../../shared/errors/AppError.js';
import type { ProductOptionDefinition } from '../../management/types/product.types.js';

export interface VariantConfiguration {
  attributes: Record<string, string>;
  configurationKey: string;
  isDefault: boolean;
}

/** Normalizes variant attributes and verifies them against product options. */
export function buildVariantConfiguration(
  options: ProductOptionDefinition[],
  suppliedAttributes: Record<string, string> | undefined,
): VariantConfiguration {
  if (options.length === 0) {
    if (suppliedAttributes && Object.keys(suppliedAttributes).length > 0) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_VARIANT_CONFIGURATION',
        message: 'This product does not have selectable options.',
      });
    }

    return {
      attributes: {},
      configurationKey: 'default',
      isDefault: true,
    };
  }

  if (!suppliedAttributes) {
    throw new AppError({
      statusCode: 400,
      code: 'INVALID_VARIANT_CONFIGURATION',
      message: 'A value is required for every product option.',
    });
  }

  const normalizedInput = new Map<string, string>();

  for (const [name, value] of Object.entries(suppliedAttributes)) {
    const normalizedName = name.trim().toLowerCase();

    if (normalizedInput.has(normalizedName)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_VARIANT_CONFIGURATION',
        message: 'Each product option can be supplied only once.',
      });
    }

    normalizedInput.set(normalizedName, value.trim());
  }

  if (normalizedInput.size !== options.length) {
    throw new AppError({
      statusCode: 400,
      code: 'INVALID_VARIANT_CONFIGURATION',
      message: 'A value is required for every product option, with no extra options.',
    });
  }

  const attributes: Record<string, string> = {};

  for (const option of options) {
    const suppliedValue = normalizedInput.get(option.name.trim().toLowerCase());

    if (suppliedValue === undefined) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_VARIANT_CONFIGURATION',
        message: `A value is required for the "${option.name}" option.`,
      });
    }

    const allowedValue = option.values.find(
      (value) => value.trim().toLowerCase() === suppliedValue.toLowerCase(),
    );

    if (allowedValue === undefined) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_VARIANT_CONFIGURATION',
        message: `The supplied value is not valid for the "${option.name}" option.`,
      });
    }

    attributes[option.name] = allowedValue;
  }

  const canonicalAttributes = Object.entries(attributes).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return {
    attributes,
    configurationKey: `options:${JSON.stringify(canonicalAttributes)}`,
    isDefault: false,
  };
}
