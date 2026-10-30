export type {
  Carrier,
  CarrierSelection,
  CarrierUsage,
  Country,
  Destination,
  Dimensions,
  InventoryMovement,
  MovementType,
  Product,
  ProductCategory,
  ProductStatus,
  Shipment,
  ShipmentPriority,
  ShipmentStatus,
  SortOrder,
  ValidationResult,
  WarehouseLocation,
} from './types/models.js';

export {
  filterLowStockProducts,
  filterProductsByCategory,
  filterProductsByWarehouse,
  sortCarriersByReliability,
  sortProductsByStock,
} from './utils/collections.js';

export {
  binarySearchProductByWeight,
  findProductBySKU,
  findShipmentById,
} from './utils/search.js';

export {
  calculateAverageShipmentDistance,
  calculateShippingCost,
  calculateTotalInventoryValue,
  countProductsByCategory,
  findHeaviestProduct,
  findLightestProduct,
  findTopCarriers,
  groupShipmentsByStatus,
  scoreCarrierForShipment,
  selectBestCarrier,
} from './utils/transformations.js';

export {
  validateCarrier,
  validateProduct,
  validateShipment,
} from './utils/validations.js';