import { FuelType } from '@/types/models';

export interface VehicleCatalogEntry {
  brand: string;
  model: string;
  fuelType: FuelType;
  recommendedConsumptionKmL: number;
  recommendationNote: string;
}

// Starter catalog based on common models in Brazil and INMETRO PBEV 2026 figures.
export const vehicleCatalog: VehicleCatalogEntry[] = [
  {
    brand: 'Fiat',
    model: 'Strada Freedom CD13',
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Fiat',
    model: 'Strada Ultra T200 AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.5,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Fiat',
    model: 'Argo 1.0',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.1,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Fiat',
    model: 'Mobi Like 1.0',
    fuelType: 'flex',
    recommendedConsumptionKmL: 15.2,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Fiat',
    model: 'Cronos 1.0',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.7,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Volkswagen',
    model: 'Polo Comfortline TSI AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Volkswagen',
    model: 'Polo MPI',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Volkswagen',
    model: 'T-Cross 200TSI AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.3,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Volkswagen',
    model: 'Nivus Comfortline 200TSI AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Chevrolet',
    model: 'Onix 1.0 Turbo AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.7,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Chevrolet',
    model: 'Onix 1.0 Turbo MT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 15.7,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Chevrolet',
    model: 'Onix 1.0 MT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.9,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Hyundai',
    model: 'HB20 1.0',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.4,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Hyundai',
    model: 'HB20 1.0 Turbo AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.0,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Hyundai',
    model: 'Creta 1.0 Turbo AT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.4,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Honda',
    model: 'HR-V EXL 1.5 CVT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.2,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Honda',
    model: 'HR-V Advance 1.5T CVT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.2,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  {
    brand: 'Toyota',
    model: 'Corolla Cross XR 2.0 CVT',
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.3,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
];

export const vehicleBrands = [...new Set(vehicleCatalog.map((entry) => entry.brand))].sort();

export function getModelsByBrand(brand: string) {
  return vehicleCatalog
    .filter((entry) => entry.brand.toLowerCase() === brand.toLowerCase())
    .map((entry) => entry.model)
    .sort();
}

export function findVehicleCatalogEntry(brand: string, model: string) {
  return vehicleCatalog.find(
    (entry) =>
      entry.brand.toLowerCase() === brand.toLowerCase() &&
      entry.model.toLowerCase() === model.toLowerCase()
  );
}
