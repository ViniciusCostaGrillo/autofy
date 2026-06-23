import {
  calculateRequiredLiters,
  calculateFuelCost,
  calculateTotalTripCost,
  calculateCostPerPassenger,
  calculateConsumption,
  formatCurrency,
  formatKm,
  formatConsumption,
} from '../../utils/calculations';

describe('calculations utility functions', () => {
  test('calculateRequiredLiters', () => {
    expect(calculateRequiredLiters(100, 10)).toBe(10);
    expect(calculateRequiredLiters(150, 15)).toBe(10);
    expect(calculateRequiredLiters(100, 0)).toBe(0);
    expect(calculateRequiredLiters(100, -5)).toBe(0);
  });

  test('calculateFuelCost', () => {
    expect(calculateFuelCost(10, 5)).toBe(50);
    expect(calculateFuelCost(0, 5)).toBe(0);
    expect(calculateFuelCost(5.5, 6)).toBe(33);
  });

  test('calculateTotalTripCost', () => {
    expect(calculateTotalTripCost(50, 20)).toBe(70);
    expect(calculateTotalTripCost(50)).toBe(50);
    expect(calculateTotalTripCost(50, 0)).toBe(50);
  });

  test('calculateCostPerPassenger', () => {
    expect(calculateCostPerPassenger(100, 4)).toBe(25);
    expect(calculateCostPerPassenger(100, 0)).toBe(100);
    expect(calculateCostPerPassenger(100, -1)).toBe(100);
  });

  test('calculateConsumption', () => {
    expect(calculateConsumption(100, 10)).toBe(10);
    expect(calculateConsumption(100, 0)).toBe(0);
    expect(calculateConsumption(150, 12)).toBe(12.5);
  });

  test('formatCurrency', () => {
    // We replace non-breaking spaces (\xa0) with regular spaces to avoid environment-specific matching issues
    const format = (val: number, loc?: string, cur?: string) =>
      formatCurrency(val, loc, cur).replace(/\s/g, ' ');

    expect(format(1000)).toMatch(/R\$\s?1\.000,00/);
    expect(format(1000, 'en-US', 'USD')).toMatch(/\$\s?1,000\.00/);
  });

  test('formatKm', () => {
    expect(formatKm(1000).replace(/\s/g, ' ')).toBe('1.000 km');
  });

  test('formatConsumption', () => {
    expect(formatConsumption(12.34).replace(/\s/g, ' ')).toBe('12,3 km/l');
  });
});
