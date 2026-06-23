import { getUpcomingOilAlert } from '../../lib/oil';
import { OilChange, Vehicle } from '@/types/models';

describe('oil helper functions', () => {
  const mockVehicle: Vehicle = {
    id: 'v1',
    userId: 'u1',
    nickname: 'My Car',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    fuelType: 'gasoline',
    manualAvgConsumption: 12,
    currentOdometer: 50000,
    hasTollTag: false,
    isDefault: true,
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
  };

  const mockOilChanges: OilChange[] = [
    {
      id: 'o1',
      userId: 'u1',
      vehicleId: 'v1',
      changedAt: '2026-05-01T12:00:00.000Z',
      odometer: 40000,
      oilName: '5W30 Synthetic',
      nextChangeDate: '2026-11-01T12:00:00.000Z',
      nextChangeOdometer: 60000,
      createdAt: '2026-05-01T12:00:00.000Z',
    },
    {
      id: 'o2', // Most recent change
      userId: 'u1',
      vehicleId: 'v1',
      changedAt: '2026-06-01T12:00:00.000Z',
      odometer: 50000,
      oilName: '5W30 Synthetic Pro',
      nextChangeDate: '2026-12-01T12:00:00.000Z',
      nextChangeOdometer: 55000,
      createdAt: '2026-06-01T12:00:00.000Z',
    },
    {
      id: 'o3', // Older change
      userId: 'u1',
      vehicleId: 'v1',
      changedAt: '2025-12-01T12:00:00.000Z',
      odometer: 30000,
      oilName: '5W30 Semi-Synthetic',
      nextChangeDate: '2026-06-01T12:00:00.000Z',
      nextChangeOdometer: 45000,
      createdAt: '2025-12-01T12:00:00.000Z',
    },
  ];

  test('returns null if vehicle is missing', () => {
    expect(getUpcomingOilAlert(mockOilChanges, undefined)).toBeNull();
  });

  test('returns null if there are no oil changes', () => {
    expect(getUpcomingOilAlert([], mockVehicle)).toBeNull();
  });

  test('uses the most recent oil change and calculates alerts', () => {
    // Current odometer: 50,000 km
    // Most recent oil change (o2) nextChangeOdometer: 55,000 km -> remainingKm: 5,000 km.
    // nextChangeDate is 2026-12-01 (far future).
    // It should not be due since remainingKm = 5000 and nextChangeDate is far away.
    expect(getUpcomingOilAlert(mockOilChanges, mockVehicle)).toBeNull();
  });

  test('returns alert if remaining km is low (due soon)', () => {
    const vehicleSoon = { ...mockVehicle, currentOdometer: 54600 };
    // 400 km remaining (<= 500 km)
    const alert = getUpcomingOilAlert(mockOilChanges, vehicleSoon);
    expect(alert).not.toBeNull();
    expect(alert?.oilChange.oilName).toBe('5W30 Synthetic Pro');
    expect(alert?.remainingKm).toBe(400);
    expect(alert?.dueSoonByKm).toBe(true);
    expect(alert?.dueByKm).toBe(false);
  });

  test('returns alert if odometer exceeds nextChangeOdometer (overdue)', () => {
    const vehicleOverdue = { ...mockVehicle, currentOdometer: 56000 };
    // -1000 km remaining (<= 0)
    const alert = getUpcomingOilAlert(mockOilChanges, vehicleOverdue);
    expect(alert).not.toBeNull();
    expect(alert?.dueByKm).toBe(true);
    expect(alert?.remainingKm).toBe(-1000);
  });
});
