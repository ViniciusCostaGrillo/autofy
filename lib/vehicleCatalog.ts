import { FuelType } from '@/types/models';

export interface VehicleCatalogEntry {
  brand: string;
  model: string;
  fuelType?: FuelType;
  recommendedConsumptionKmL?: number;
  recommendationNote?: string;
}

const brazilVehicleBrands: Record<string, string[]> = {
  Audi: ['A3 Sedan', 'A4 Sedan', 'A5 Sportback', 'A6 Sedan', 'Q3', 'Q3 Sportback', 'Q5', 'Q5 Sportback', 'Q7', 'Q8', 'e-tron'],
  BMW: ['118i', '218i Gran Coupe', '320i', '330e', 'X1', 'X3', 'X4', 'X5', 'iX1'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Seal', 'Song Plus', 'Yuan Pro', 'Yuan Plus', 'King', 'Tan'],
  Caoa: ['Chery Arrizo 6', 'Chery Arrizo 8', 'Chery Tiggo 5X', 'Chery Tiggo 7', 'Chery Tiggo 8'],
  Chevrolet: ['Montana', 'Onix', 'Onix Plus', 'Tracker', 'S10', 'Spin', 'Equinox', 'Trailblazer'],
  Citroen: ['C3', 'C3 Aircross', 'Basalt', 'Jumpy', 'Jumper'],
  Fiat: ['Argo', 'Cronos', 'Fastback', 'Fiorino', 'Mobi', 'Pulse', 'Scudo', 'Strada', 'Titano', 'Toro'],
  Ford: ['Bronco Sport', 'Maverick', 'Mustang', 'Ranger', 'Territory'],
  GWM: ['Haval H6', 'Ora 03', 'Tank 300'],
  Honda: ['City Hatchback', 'City Sedan', 'Civic', 'CR-V', 'HR-V', 'ZR-V'],
  Hyundai: ['Creta', 'HB20', 'HB20S', 'Kona Hybrid', 'Palisade', 'Tucson'],
  Jeep: ['Commander', 'Compass', 'Gladiator', 'Renegade', 'Wrangler'],
  Kia: ['Bongo', 'Carnival', 'Niro', 'Sportage', 'Stonic'],
  MercedesBenz: ['A 200', 'C 200', 'CLA 200', 'E 300', 'GLA 200', 'GLB 200', 'GLC 220d', 'GLC 300', 'GLE 400d'],
  Mitsubishi: ['Eclipse Cross', 'L200 Triton', 'Outlander Sport', 'Pajero Sport'],
  Nissan: ['Frontier', 'Kicks', 'Leaf', 'Sentra', 'Versa'],
  Peugeot: ['2008', '208', 'Boxer', 'Expert', 'Partner Rapid'],
  Porsche: ['Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Ram: ['1500', '2500', '3500', 'Rampage'],
  Renault: ['Duster', 'Kardian', 'Kwid', 'Master', 'Oroch'],
  Toyota: ['Corolla', 'Corolla Cross', 'Hilux', 'RAV4', 'SW4', 'Yaris', 'Yaris Sedan'],
  Volkswagen: ['Amarok', 'Nivus', 'Polo', 'Saveiro', 'Taos', 'T-Cross', 'Tiguan Allspace', 'Virtus'],
  Volvo: ['C40', 'EX30', 'XC40', 'XC60', 'XC90'],
};

const officialRecommendations: Record<
  string,
  { fuelType: FuelType; recommendedConsumptionKmL: number; recommendationNote: string }
> = {
  'Fiat|Strada Freedom CD13': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Fiat|Strada Ultra T200 AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.5,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Fiat|Argo 1.0': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.1,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Fiat|Mobi Like 1.0': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 15.2,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Fiat|Cronos 1.0': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.7,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Volkswagen|Polo Comfortline TSI AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Volkswagen|Polo MPI': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Volkswagen|T-Cross 200TSI AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.3,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Volkswagen|Nivus Comfortline 200TSI AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.6,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Chevrolet|Onix 1.0 Turbo AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.7,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Chevrolet|Onix 1.0 Turbo MT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 15.7,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Chevrolet|Onix 1.0 MT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.9,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Hyundai|HB20 1.0': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.4,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Hyundai|HB20 1.0 Turbo AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 14.0,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Hyundai|Creta 1.0 Turbo AT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.4,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Honda|HR-V EXL 1.5 CVT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 13.2,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Honda|HR-V Advance 1.5T CVT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.2,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'Toyota|Corolla Cross XR 2.0 CVT': {
    fuelType: 'flex',
    recommendedConsumptionKmL: 12.3,
    recommendationNote: 'Sugestao Inmetro 2026: media gasolina cidade/estrada.',
  },
  'BYD|Dolphin': {
    fuelType: 'electric',
    recommendedConsumptionKmL: 0,
    recommendationNote: 'Modelo eletrico. Ajuste o consumo manualmente se quiser usar custo por energia.',
  },
};

const generatedCatalog: VehicleCatalogEntry[] = [];

for (const [brand, models] of Object.entries(brazilVehicleBrands)) {
  for (const model of models) {
    const recommendation = officialRecommendations[`${brand}|${model}`];
    generatedCatalog.push({
      brand,
      model,
      fuelType: recommendation?.fuelType,
      recommendedConsumptionKmL: recommendation?.recommendedConsumptionKmL,
      recommendationNote: recommendation?.recommendationNote,
    });
  }
}

for (const key of Object.keys(officialRecommendations)) {
  const [brand, model] = key.split('|');
  const alreadyExists = generatedCatalog.some((entry) => entry.brand === brand && entry.model === model);
  if (!alreadyExists) {
    generatedCatalog.push({
      brand,
      model,
      ...officialRecommendations[key],
    });
  }
}

export const vehicleCatalog = generatedCatalog.sort((a, b) =>
  a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)
);

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
