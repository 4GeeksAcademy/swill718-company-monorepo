import type { Product, Shipment } from '../types/models.js';

export function findProductBySKU(
  products: Product[],
  sku: string,
): Product | null {
  const normalizedSKU = sku.toLowerCase();

  for (const product of products) {
    if (product.sku.toLowerCase() === normalizedSKU) {
      return product;
    }
  }

  return null;
}

export function findShipmentById(
  shipments: Shipment[],
  id: string,
): Shipment | null {
  for (const shipment of shipments) {
    if (shipment.id === id) {
      return shipment;
    }
  }

  return null;
}

export function binarySearchProductByWeight(
  sortedProducts: Product[],
  targetWeight: number,
): number {
  if (!Number.isFinite(targetWeight)) {
    return -1;
  }

  let lowerBound = 0;
  let upperBound = sortedProducts.length - 1;

  while (lowerBound <= upperBound) {
    const midpoint = lowerBound + Math.floor((upperBound - lowerBound) / 2);
    const product = sortedProducts[midpoint];

    if (product === undefined) {
      return -1;
    }

    if (product.weightKg === targetWeight) {
      return midpoint;
    }

    if (product.weightKg < targetWeight) {
      lowerBound = midpoint + 1;
    } else {
      upperBound = midpoint - 1;
    }
  }

  return -1;
}