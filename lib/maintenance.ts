import { MaintenanceCategory, MaintenanceExpense } from '@/types/models';

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export function getMaintenanceWindowStart(referenceDate = new Date()) {
  return new Date(referenceDate.getTime() - THIRTY_DAYS_MS);
}

export function getVehicleMaintenanceExpenses(
  expenses: MaintenanceExpense[],
  vehicleId?: string
) {
  if (!vehicleId) return [];
  return expenses.filter((item) => item.vehicleId === vehicleId);
}

export function getMaintenanceLast30DaysTotal(
  expenses: MaintenanceExpense[],
  vehicleId?: string,
  referenceDate = new Date()
) {
  const windowStart = getMaintenanceWindowStart(referenceDate).getTime();
  return getVehicleMaintenanceExpenses(expenses, vehicleId)
    .filter((item) => new Date(item.date).getTime() >= windowStart)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getMaintenanceMonthlyAverage(
  expenses: MaintenanceExpense[],
  vehicleId?: string,
  referenceDate = new Date()
) {
  const windowStart = getMaintenanceWindowStart(referenceDate).getTime();

  return getVehicleMaintenanceExpenses(expenses, vehicleId).reduce((sum, item) => {
    if (item.isRecurring && item.recurrenceMonths && item.recurrenceMonths > 0) {
      const start = new Date(item.date);
      const end = new Date(start);
      end.setMonth(end.getMonth() + item.recurrenceMonths);
      if (referenceDate >= start && referenceDate < end) {
        return sum + item.monthlyAmount;
      }
      return sum;
    }

    if (new Date(item.date).getTime() >= windowStart) {
      return sum + item.amount;
    }

    return sum;
  }, 0);
}

export function getMaintenanceCategoryLabel(
  category: MaintenanceCategory,
  labels: Record<MaintenanceCategory, string>
) {
  return labels[category];
}
