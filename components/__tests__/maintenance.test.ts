import {
  getMaintenanceWindowStart,
  getVehicleMaintenanceExpenses,
  getMaintenanceLast30DaysTotal,
  getMaintenanceMonthlyAverage,
  getMaintenanceCategoryLabel,
} from '../../lib/maintenance';
import { MaintenanceExpense } from '@/types/models';

describe('maintenance helper functions', () => {
  const mockExpenses: MaintenanceExpense[] = [
    {
      id: '1',
      userId: 'u1',
      vehicleId: 'v1',
      category: 'oil_change',
      title: 'Oil Change',
      amount: 150,
      date: '2026-06-15T12:00:00.000Z',
      isRecurring: false,
      recurrenceMonths: 0,
      monthlyAmount: 0,
      createdAt: '2026-06-15T12:00:00.000Z',
    },
    {
      id: '2',
      userId: 'u1',
      vehicleId: 'v1',
      category: 'insurance',
      title: 'Annual Insurance',
      amount: 1200,
      date: '2026-06-01T12:00:00.000Z',
      isRecurring: true,
      recurrenceMonths: 12,
      monthlyAmount: 100,
      createdAt: '2026-06-01T12:00:00.000Z',
    },
    {
      id: '3',
      userId: 'u1',
      vehicleId: 'v2',
      category: 'tires',
      title: 'New Tires v2',
      amount: 800,
      date: '2026-06-10T12:00:00.000Z',
      isRecurring: false,
      recurrenceMonths: 0,
      monthlyAmount: 0,
      createdAt: '2026-06-10T12:00:00.000Z',
    },
    {
      id: '4',
      userId: 'u1',
      vehicleId: 'v1',
      category: 'other',
      title: 'Old Expense',
      amount: 300,
      date: '2026-04-01T12:00:00.000Z',
      isRecurring: false,
      recurrenceMonths: 0,
      monthlyAmount: 0,
      createdAt: '2026-04-01T12:00:00.000Z',
    },
  ];

  const refDate = new Date('2026-06-20T12:00:00.000Z');

  test('getMaintenanceWindowStart', () => {
    const start = getMaintenanceWindowStart(refDate);
    // 30 days before June 20 is May 21
    expect(start.toISOString()).toBe('2026-05-21T12:00:00.000Z');
  });

  test('getVehicleMaintenanceExpenses', () => {
    expect(getVehicleMaintenanceExpenses(mockExpenses, 'v1')).toHaveLength(3);
    expect(getVehicleMaintenanceExpenses(mockExpenses, 'v2')).toHaveLength(1);
    expect(getVehicleMaintenanceExpenses(mockExpenses)).toHaveLength(0);
  });

  test('getMaintenanceLast30DaysTotal', () => {
    // For v1:
    // Expense 1 (150, June 15) -> within last 30 days (since May 21)
    // Expense 2 (1200, June 1) -> within last 30 days
    // Expense 4 (300, April 1) -> outside last 30 days
    // Total should be 150 + 1200 = 1350
    expect(getMaintenanceLast30DaysTotal(mockExpenses, 'v1', refDate)).toBe(1350);
  });

  test('getMaintenanceMonthlyAverage', () => {
    // For v1:
    // Expense 1: non-recurring, amount 150, within 30 days -> counts 150
    // Expense 2: recurring (monthlyAmount 100), active in June -> counts 100
    // Expense 4: non-recurring, outside 30 days -> counts 0
    // Total should be 150 + 100 = 250
    expect(getMaintenanceMonthlyAverage(mockExpenses, 'v1', refDate)).toBe(250);
  });

  test('getMaintenanceCategoryLabel', () => {
    const labels = {
      oil_change: 'Troca de óleo',
      tires: 'Pneus',
      insurance: 'Seguro',
      parts: 'Peças',
      service: 'Revisão',
      other: 'Outro',
    };
    expect(getMaintenanceCategoryLabel('oil_change', labels)).toBe('Troca de óleo');
    expect(getMaintenanceCategoryLabel('insurance', labels)).toBe('Seguro');
  });
});
