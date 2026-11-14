import * as trackflow from './index.js';

const sampleProducts: trackflow.Product[] = [
  {
    sku: 'SHOE-BLK-42',
    name: 'Black Running Shoes - Size 42',
    category: 'Fashion',
    weightKg: 0.8,
    dimensions: { lengthCm: 35, widthCm: 22, heightCm: 12 },
    warehouse: 'Los Angeles',
    stockQuantity: 45,
    minStockThreshold: 20,
    unitCostUSD: 35,
    isFragile: false,
    status: 'Active',
  },
  {
    sku: 'LAPTOP-DELL-15',
    name: 'Dell Laptop 15 inch',
    category: 'Electronics',
    weightKg: 2.3,
    dimensions: { lengthCm: 40, widthCm: 28, heightCm: 3 },
    warehouse: 'Zaragoza',
    stockQuantity: 8,
    minStockThreshold: 10,
    unitCostUSD: 650,
    isFragile: true,
    status: 'Low stock',
  },
  {
    sku: 'PERFUME-COCO-50',
    name: 'Coco Perfume 50ml',
    category: 'Cosmetics',
    weightKg: 0.3,
    dimensions: { lengthCm: 12, widthCm: 8, heightCm: 15 },
    warehouse: 'Los Angeles',
    stockQuantity: 120,
    minStockThreshold: 30,
    unitCostUSD: 85,
    isFragile: true,
    status: 'Active',
  },
];

const sampleCarriers: trackflow.Carrier[] = [
  {
    id: 'CAR-UPS',
    name: 'UPS',
    operatesIn: ['United States'],
    baseRateUSD: 5,
    ratePerKgUSD: 1.2,
    ratePerKmUSD: 0.05,
    avgDeliveryDays: 3,
    onTimeRate: 88,
    maxWeightKg: 30,
    handlesFragile: true,
    acceptsPriority: ['Standard', 'Express'],
  },
  {
    id: 'CAR-SEUR',
    name: 'SEUR',
    operatesIn: ['Spain'],
    baseRateUSD: 6.5,
    ratePerKgUSD: 1.5,
    ratePerKmUSD: 0.08,
    avgDeliveryDays: 2,
    onTimeRate: 92,
    maxWeightKg: 25,
    handlesFragile: true,
    acceptsPriority: ['Standard', 'Express', 'Same-day'],
  },
  {
    id: 'CAR-DHL',
    name: 'DHL Express',
    operatesIn: ['United States', 'Spain'],
    baseRateUSD: 12,
    ratePerKgUSD: 2,
    ratePerKmUSD: 0.1,
    avgDeliveryDays: 1,
    onTimeRate: 95,
    maxWeightKg: 50,
    handlesFragile: true,
    acceptsPriority: ['Express', 'Same-day'],
  },
];

const sampleShipment: trackflow.Shipment = {
  id: 'SH-2024-8821',
  sku: 'LAPTOP-DELL-15',
  quantity: 1,
  origin: 'Zaragoza',
  destination: {
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28001',
    distanceKm: 320,
  },
  priority: 'Express',
  declaredValueUSD: 650,
  carrier: null,
  status: 'Pending',
  createdAt: new Date('2024-03-15'),
};

const sampleMovement: trackflow.InventoryMovement = {
  id: 'MOV-2024-001',
  sku: 'LAPTOP-DELL-15',
  warehouse: 'Zaragoza',
  type: 'Inbound',
  quantity: 8,
  reason: 'Supplier replenishment',
  timestamp: new Date('2024-03-14'),
};

const product = trackflow.findProductBySKU(sampleProducts, sampleShipment.sku);
const carrier = sampleCarriers.find((item) => item.id === 'CAR-UPS');

if (product === null || carrier === undefined) {
  throw new Error('The sample shipment requires its product and UPS carrier.');
}

const validationResults: trackflow.ValidationResult[] = [
  ...sampleProducts.map(trackflow.validateProduct),
  ...sampleCarriers.map(trackflow.validateCarrier),
  trackflow.validateShipment(sampleShipment),
];

if (validationResults.some((result) => !result.valid)) {
  throw new Error('Sample data must pass validation before processing.');
}

const originalData = JSON.stringify({ sampleProducts, sampleCarriers, sampleShipment });
const sortedByWeight = [...sampleProducts].sort((first, second) => first.weightKg - second.weightKg);
const stockAscending = trackflow.sortProductsByStock(sampleProducts, 'asc');
const stockDescending = trackflow.sortProductsByStock(sampleProducts, 'desc');
const reliabilityAscending = trackflow.sortCarriersByReliability(sampleCarriers, 'asc');
const reliabilityDescending = trackflow.sortCarriersByReliability(sampleCarriers, 'desc');
const reportShipments: trackflow.Shipment[] = [
  sampleShipment,
  { ...sampleShipment, id: 'SH-2024-8822', carrier: 'UPS', status: 'Assigned' },
  { ...sampleShipment, id: 'SH-2024-8823', carrier: 'SEUR', status: 'Delivered' },
  { ...sampleShipment, id: 'SH-2024-8824', carrier: 'UPS', status: 'In transit' },
];
const unsuitableCarrier: trackflow.Carrier = {
  ...carrier,
  onTimeRate: 0,
  maxWeightKg: 1,
  handlesFragile: false,
  acceptsPriority: [],
};
const bestCarrier = trackflow.selectBestCarrier(sampleCarriers, sampleShipment, product);
const carrierComparisonMatrix: [number, number][] = sampleCarriers.map((item) => [
  trackflow.scoreCarrierForShipment(item, sampleShipment, product),
  trackflow.calculateShippingCost(sampleShipment, product, item),
]);
const incompleteProduct: trackflow.Product = { ...product };
Reflect.deleteProperty(incompleteProduct, 'dimensions');

console.log(JSON.stringify({
  collections: {
    zaragoza: trackflow.filterProductsByWarehouse(sampleProducts, 'Zaragoza').map((item) => item.sku),
    fashion: trackflow.filterProductsByCategory(sampleProducts, 'Fashion').map((item) => item.sku),
    lowStock: trackflow.filterLowStockProducts(sampleProducts).map((item) => item.sku),
    stockAscending: stockAscending.map((item) => item.stockQuantity),
    stockDescending: stockDescending.map((item) => item.stockQuantity),
    reliabilityAscending: reliabilityAscending.map((item) => item.onTimeRate),
    reliabilityDescending: reliabilityDescending.map((item) => item.onTimeRate),
  },
  searches: {
    caseInsensitiveSKU: trackflow.findProductBySKU(sampleProducts, 'laptop-dell-15')?.sku,
    shipmentId: trackflow.findShipmentById(reportShipments, sampleShipment.id)?.id,
    missingProduct: trackflow.findProductBySKU(sampleProducts, 'MISSING'),
    missingShipment: trackflow.findShipmentById(reportShipments, 'MISSING'),
    sortedWeights: sortedByWeight.map((item) => item.weightKg),
    firstWeightIndex: trackflow.binarySearchProductByWeight(sortedByWeight, 0.3),
    lastWeightIndex: trackflow.binarySearchProductByWeight(sortedByWeight, 2.3),
    missingWeightIndex: trackflow.binarySearchProductByWeight(sortedByWeight, 1),
  },
  shipping: {
    carrierNames: sampleCarriers.map((item) => item.name),
    scoreAndCostMatrix: carrierComparisonMatrix,
    selected: bestCarrier === null ? null : {
      carrier: bestCarrier.carrier.name,
      score: bestCarrier.score,
      cost: bestCarrier.cost,
    },
    noSuitableCarrier: trackflow.selectBestCarrier([unsuitableCarrier], sampleShipment, product),
  },
  reports: {
    categories: trackflow.countProductsByCategory(sampleProducts),
    inventoryValueUSD: trackflow.calculateTotalInventoryValue(sampleProducts),
    averageDistanceKm: trackflow.calculateAverageShipmentDistance(reportShipments),
    shipmentsByStatus: Object.fromEntries(
      Object.entries(trackflow.groupShipmentsByStatus(reportShipments))
        .map(([status, shipments]) => [status, shipments.map((item) => item.id)]),
    ),
    topCarriers: trackflow.findTopCarriers(reportShipments, 2),
    lightestSKU: trackflow.findLightestProduct(sampleProducts)?.sku,
    heaviestSKU: trackflow.findHeaviestProduct(sampleProducts)?.sku,
  },
  validation: {
    validSamples: validationResults,
    missingDimensions: trackflow.validateProduct(incompleteProduct),
    nonFiniteWeight: trackflow.validateProduct({ ...product, weightKg: NaN }),
    excessiveWeight: trackflow.validateProduct({ ...product, weightKg: 101 }),
    maximumWeight: trackflow.validateProduct({ ...product, weightKg: 100 }),
    zeroQuantity: trackflow.validateShipment({ ...sampleShipment, quantity: 0 }),
    invalidDate: trackflow.validateShipment({ ...sampleShipment, createdAt: new Date('invalid') }),
    nonFiniteRate: trackflow.validateCarrier({ ...carrier, baseRateUSD: Infinity }),
    excessiveReliability: trackflow.validateCarrier({ ...carrier, onTimeRate: 101 }),
  },
  emptyInputs: {
    products: trackflow.filterLowStockProducts([]),
    linearSearch: trackflow.findProductBySKU([], 'MISSING'),
    binarySearch: trackflow.binarySearchProductByWeight([], 1),
    selectedCarrier: trackflow.selectBestCarrier([], sampleShipment, product),
    categories: trackflow.countProductsByCategory([]),
    inventoryValueUSD: trackflow.calculateTotalInventoryValue([]),
    averageDistanceKm: trackflow.calculateAverageShipmentDistance([]),
    statusGroups: trackflow.groupShipmentsByStatus([]),
    topCarriers: trackflow.findTopCarriers([], 2),
    lightest: trackflow.findLightestProduct([]),
    heaviest: trackflow.findHeaviestProduct([]),
  },
  inventoryMovement: sampleMovement,
  sampleInputsUnchanged: originalData === JSON.stringify({ sampleProducts, sampleCarriers, sampleShipment }),
}, null, 2));