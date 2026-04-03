import { AppPreferences } from '@/types/models';

export function formatCurrencyForPreferences(value: number, preferences: AppPreferences) {
  return new Intl.NumberFormat(localeForPreferences(preferences), {
    style: 'currency',
    currency: preferences.currencyCode || 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDistanceForPreferences(distanceKm: number, preferences: AppPreferences) {
  if (preferences.unitSystem === 'imperial') {
    const miles = distanceKm * 0.621371;
    return `${miles.toLocaleString(localeForPreferences(preferences), { maximumFractionDigits: 1 })} mi`;
  }

  return `${distanceKm.toLocaleString(localeForPreferences(preferences), { maximumFractionDigits: 1 })} km`;
}

export function formatConsumptionForPreferences(kmPerLiter: number, preferences: AppPreferences) {
  if (preferences.consumptionUnit === 'l_100km') {
    const litersPer100Km = kmPerLiter > 0 ? 100 / kmPerLiter : 0;
    return `${litersPer100Km.toLocaleString(localeForPreferences(preferences), { maximumFractionDigits: 1 })} L/100 km`;
  }

  if (preferences.consumptionUnit === 'mpg_us') {
    const mpg = kmPerLiter * 2.35215;
    return `${mpg.toLocaleString(localeForPreferences(preferences), { maximumFractionDigits: 1 })} mpg`;
  }

  if (preferences.consumptionUnit === 'mpg_uk') {
    const mpg = kmPerLiter * 2.82481;
    return `${mpg.toLocaleString(localeForPreferences(preferences), { maximumFractionDigits: 1 })} mpg`;
  }

  return `${kmPerLiter.toLocaleString(localeForPreferences(preferences), { maximumFractionDigits: 1 })} km/l`;
}

export function localeForPreferences(preferences: AppPreferences) {
  if (preferences.language === 'en') return 'en-US';
  if (preferences.language === 'es') return 'es-ES';
  return 'pt-BR';
}
