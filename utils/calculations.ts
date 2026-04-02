export const calculateRequiredLiters = (distanceKm: number, avgConsumptionKmL: number): number => {
  if (avgConsumptionKmL <= 0) return 0;
  return distanceKm / avgConsumptionKmL;
};

export const calculateFuelCost = (requiredLiters: number, fuelPrice: number): number => {
  return requiredLiters * fuelPrice;
};

export const calculateTotalTripCost = (fuelCost: number, tollCost: number = 0): number => {
  return fuelCost + tollCost;
};

export const calculateCostPerPassenger = (totalCost: number, passengers: number): number => {
  if (passengers <= 0) return totalCost;
  return totalCost / passengers;
};

export const calculateConsumption = (distanceKm: number, liters: number): number => {
  if (liters <= 0) return 0;
  return distanceKm / liters;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatKm = (value: number): string => {
  return `${value.toLocaleString('pt-BR')} km`;
};

export const formatConsumption = (value: number): string => {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km/l`;
};
