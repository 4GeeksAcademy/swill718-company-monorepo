import type {
  Carrier,
  Product,
  Shipment,
  ValidationResult,
} from '../types/models.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAllowedValue(value: unknown, allowedValues: readonly string[]): boolean {
  return typeof value === 'string' && allowedValues.includes(value);
}

function validateRequiredStrings(
  record: Record<string, unknown>,
  fieldNames: readonly string[],
): string[] {
  return fieldNames
    .filter((fieldName) => !isNonEmptyString(record[fieldName]))
    .map((fieldName) => `${fieldName} must be a non-empty string.`);
}

export function validateProduct(product: Product): ValidationResult {
  if (!isRecord(product)) {
    return { valid: false, errors: ['Product must be an object.'] };
  }

  const errors = validateRequiredStrings(product, ['sku', 'name']);

  if (!isAllowedValue(product.category, ['Fashion', 'Electronics', 'Cosmetics', 'Home', 'Other'])) {
    errors.push('category must be a supported product category.');
  }

  if (!isAllowedValue(product.warehouse, ['Los Angeles', 'Zaragoza'])) {
    errors.push('warehouse must be Los Angeles or Zaragoza.');
  }

  if (!isAllowedValue(product.status, ['Active', 'Low stock', 'Out of stock', 'Discontinued'])) {
    errors.push('status must be a supported product status.');
  }

  if (!isFiniteNumber(product.weightKg) || product.weightKg <= 0 || product.weightKg > 100) {
    errors.push('weightKg must be a finite number greater than 0 and at most 100.');
  }

  if (!isRecord(product.dimensions)) {
    errors.push('dimensions must be an object.');
  } else {
    for (const dimensionName of ['lengthCm', 'widthCm', 'heightCm'] as const) {
      const dimension = product.dimensions[dimensionName];

      if (!isFiniteNumber(dimension) || dimension <= 0 || dimension > 200) {
        errors.push(`dimensions.${dimensionName} must be a finite number greater than 0 and at most 200.`);
      }
    }
  }

  for (const fieldName of ['stockQuantity', 'minStockThreshold'] as const) {
    const value = product[fieldName];

    if (!isFiniteNumber(value) || value < 0) {
      errors.push(`${fieldName} must be a finite number greater than or equal to 0.`);
    }
  }

  if (!isFiniteNumber(product.unitCostUSD) || product.unitCostUSD <= 0) {
    errors.push('unitCostUSD must be a finite number greater than 0.');
  }

  if (typeof product.isFragile !== 'boolean') {
    errors.push('isFragile must be a boolean.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateShipment(shipment: Shipment): ValidationResult {
  if (!isRecord(shipment)) {
    return { valid: false, errors: ['Shipment must be an object.'] };
  }

  const errors = validateRequiredStrings(shipment, ['id', 'sku']);

  if (!isAllowedValue(shipment.origin, ['Los Angeles', 'Zaragoza'])) {
    errors.push('origin must be Los Angeles or Zaragoza.');
  }

  if (!isAllowedValue(shipment.priority, ['Standard', 'Express', 'Same-day'])) {
    errors.push('priority must be Standard, Express, or Same-day.');
  }

  if (!isAllowedValue(shipment.status, ['Pending', 'Assigned', 'In transit', 'Delivered', 'Failed'])) {
    errors.push('status must be a supported shipment status.');
  }

  for (const fieldName of ['quantity', 'declaredValueUSD'] as const) {
    const value = shipment[fieldName];

    if (!isFiniteNumber(value) || value <= 0) {
      errors.push(`${fieldName} must be a finite number greater than 0.`);
    }
  }

  if (!isRecord(shipment.destination)) {
    errors.push('destination must be an object.');
  } else {
    errors.push(...validateRequiredStrings(shipment.destination, ['city', 'postalCode']));

    if (!isAllowedValue(shipment.destination.country, ['United States', 'Spain'])) {
      errors.push('destination.country must be United States or Spain.');
    }

    if (!isFiniteNumber(shipment.destination.distanceKm) || shipment.destination.distanceKm < 0) {
      errors.push('destination.distanceKm must be a finite number greater than or equal to 0.');
    }
  }

  if (shipment.carrier !== null && !isNonEmptyString(shipment.carrier)) {
    errors.push('carrier must be null or a non-empty string.');
  }

  if (!(shipment.createdAt instanceof Date) || !Number.isFinite(shipment.createdAt.getTime())) {
    errors.push('createdAt must be a valid Date.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateCarrier(carrier: Carrier): ValidationResult {
  if (!isRecord(carrier)) {
    return { valid: false, errors: ['Carrier must be an object.'] };
  }

  const errors = validateRequiredStrings(carrier, ['id', 'name']);

  if (
    !Array.isArray(carrier.operatesIn)
    || carrier.operatesIn.length === 0
    || !carrier.operatesIn.every((country) => isAllowedValue(country, ['United States', 'Spain']))
  ) {
    errors.push('operatesIn must contain at least one country, with every entry United States or Spain.');
  }

  for (const fieldName of ['baseRateUSD', 'ratePerKgUSD', 'ratePerKmUSD'] as const) {
    const value = carrier[fieldName];

    if (!isFiniteNumber(value) || value < 0) {
      errors.push(`${fieldName} must be a finite number greater than or equal to 0.`);
    }
  }

  for (const fieldName of ['avgDeliveryDays', 'maxWeightKg'] as const) {
    const value = carrier[fieldName];

    if (!isFiniteNumber(value) || value <= 0) {
      errors.push(`${fieldName} must be a finite number greater than 0.`);
    }
  }

  if (!isFiniteNumber(carrier.onTimeRate) || carrier.onTimeRate < 0 || carrier.onTimeRate > 100) {
    errors.push('onTimeRate must be a finite number between 0 and 100 inclusive.');
  }

  if (typeof carrier.handlesFragile !== 'boolean') {
    errors.push('handlesFragile must be a boolean.');
  }

  if (
    !Array.isArray(carrier.acceptsPriority)
    || !carrier.acceptsPriority.every((priority) => isAllowedValue(priority, ['Standard', 'Express', 'Same-day']))
  ) {
    errors.push('acceptsPriority must be an array of supported shipment priorities.');
  }

  return { valid: errors.length === 0, errors };
}