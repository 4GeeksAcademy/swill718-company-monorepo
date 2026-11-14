import type {
  Carrier,
  CarrierSelection,
  CarrierUsage,
  Product,
  ProductCategory,
  Shipment,
  ShipmentPriority,
  ShipmentStatus,
} from '../types/models.js';

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON * Math.abs(value)) * 100) / 100;
}

export function calculateShippingCost(
  shipment: Shipment,
  product: Product,
  carrier: Carrier,
): number {
  const priorityMultipliers: Record<ShipmentPriority, number> = {
    Standard: 1,
    Express: 1.3,
    'Same-day': 1.6,
  };
  const weightCost = product.weightKg * carrier.ratePerKgUSD * shipment.quantity;
  const distanceCost = shipment.destination.distanceKm * carrier.ratePerKmUSD;
  const subtotal = carrier.baseRateUSD + weightCost + distanceCost;

  return roundToTwoDecimals(subtotal * priorityMultipliers[shipment.priority]);
}

export function scoreCarrierForShipment(
  carrier: Carrier,
  shipment: Shipment,
  product: Product,
): number {
  const countryScore = carrier.operatesIn.includes(shipment.destination.country) ? 20 : 0;
  const weightScore = product.weightKg * shipment.quantity <= carrier.maxWeightKg ? 20 : 0;
  const priorityScore = carrier.acceptsPriority.includes(shipment.priority) ? 15 : 0;
  const fragileScore = !product.isFragile || carrier.handlesFragile ? 15 : 0;
  const reliabilityScore = carrier.onTimeRate * 0.3;

  return roundToTwoDecimals(
    countryScore + weightScore + priorityScore + fragileScore + reliabilityScore,
  );
}

export function selectBestCarrier(
  carriers: Carrier[],
  shipment: Shipment,
  product: Product,
): CarrierSelection | null {
  let bestSelection: CarrierSelection | null = null;

  for (const carrier of carriers) {
    const score = scoreCarrierForShipment(carrier, shipment, product);

    if (score < 50) {
      continue;
    }

    const cost = calculateShippingCost(shipment, product, carrier);

    if (bestSelection === null || cost < bestSelection.cost) {
      bestSelection = { carrier, score, cost };
    }
  }

  return bestSelection;
}

export function countProductsByCategory(
  products: Product[],
): Record<ProductCategory, number> {
  const counts: Record<ProductCategory, number> = {
    Fashion: 0,
    Electronics: 0,
    Cosmetics: 0,
    Home: 0,
    Other: 0,
  };

  for (const product of products) {
    counts[product.category] += 1;
  }

  return counts;
}

export function calculateTotalInventoryValue(products: Product[]): number {
  const total = products.reduce(
    (sum, product) => sum + product.stockQuantity * product.unitCostUSD,
    0,
  );

  return roundToTwoDecimals(total);
}

export function calculateAverageShipmentDistance(shipments: Shipment[]): number {
  if (shipments.length === 0) {
    return 0;
  }

  const totalDistance = shipments.reduce(
    (sum, shipment) => sum + shipment.destination.distanceKm,
    0,
  );

  return roundToTwoDecimals(totalDistance / shipments.length);
}

export function groupShipmentsByStatus(
  shipments: Shipment[],
): Record<ShipmentStatus, Shipment[]> {
  const groups: Record<ShipmentStatus, Shipment[]> = {
    Pending: [],
    Assigned: [],
    'In transit': [],
    Delivered: [],
    Failed: [],
  };

  for (const shipment of shipments) {
    groups[shipment.status].push(shipment);
  }

  return groups;
}

export function findTopCarriers(
  shipments: Shipment[],
  topN: number,
): CarrierUsage[] {
  if (!Number.isFinite(topN) || topN < 1) {
    return [];
  }

  const usageCounts = new Map<string, number>();

  for (const shipment of shipments) {
    if (shipment.carrier !== null) {
      usageCounts.set(shipment.carrier, (usageCounts.get(shipment.carrier) ?? 0) + 1);
    }
  }

  return Array.from(usageCounts, ([carrier, count]) => ({ carrier, count }))
    .sort((first, second) => {
      const countDifference = second.count - first.count;

      if (countDifference !== 0) {
        return countDifference;
      }

      if (first.carrier === second.carrier) {
        return 0;
      }

      return first.carrier < second.carrier ? -1 : 1;
    })
    .slice(0, Math.trunc(topN));
}

export function findLightestProduct(products: Product[]): Product | null {
  let lightestProduct: Product | null = null;

  for (const product of products) {
    if (lightestProduct === null || product.weightKg < lightestProduct.weightKg) {
      lightestProduct = product;
    }
  }

  return lightestProduct;
}

export function findHeaviestProduct(products: Product[]): Product | null {
  let heaviestProduct: Product | null = null;

  for (const product of products) {
    if (heaviestProduct === null || product.weightKg > heaviestProduct.weightKg) {
      heaviestProduct = product;
    }
  }

  return heaviestProduct;
}