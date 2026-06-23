import { OilChange, Vehicle } from '@/types/models';

export function getUpcomingOilAlert(oilChanges: OilChange[], vehicle?: Vehicle) {
  if (!vehicle) return null;

  // Use the most recent oil change record (sorted by changedAt descending)
  const current = oilChanges
    .filter((item) => item.vehicleId === vehicle.id)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))[0];
  if (!current) return null;

  const now = new Date();
  const nextDate = current.nextChangeDate ? new Date(current.nextChangeDate) : null;
  const remainingKm =
    current.nextChangeOdometer !== undefined
      ? current.nextChangeOdometer - vehicle.currentOdometer
      : null;

  const dueByDate = nextDate ? nextDate.getTime() <= now.getTime() : false;
  const dueSoonByDate = nextDate
    ? nextDate.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 * 14
    : false;
  const dueByKm = remainingKm !== null ? remainingKm <= 0 : false;
  const dueSoonByKm = remainingKm !== null ? remainingKm <= 500 : false;

  if (!dueByDate && !dueSoonByDate && !dueByKm && !dueSoonByKm) {
    return null;
  }

  return {
    oilChange: current,
    remainingKm,
    dueByDate,
    dueSoonByDate,
    dueByKm,
    dueSoonByKm,
  };
}
