import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppLanguage,
  AppPreferences,
  ConsumptionUnit,
  MaintenanceCategory,
  UnitSystem,
} from '@/types/models';
import { getLocalPreferences, saveLocalPreferences } from '@/lib/localStore';

type TranslationKey =
  | 'tabs.home'
  | 'tabs.trips'
  | 'tabs.refuels'
  | 'tabs.maintenance'
  | 'tabs.vehicles'
  | 'tabs.settings'
  | 'setup.title'
  | 'setup.subtitle'
  | 'setup.language'
  | 'setup.country'
  | 'setup.unitSystem'
  | 'setup.consumptionUnit'
  | 'setup.finish'
  | 'settings.title'
  | 'settings.save'
  | 'settings.restartHint'
  | 'settings.language'
  | 'settings.country'
  | 'settings.unitSystem'
  | 'settings.consumptionUnit'
  | 'settings.metric'
  | 'settings.imperial'
  | 'settings.km_l'
  | 'settings.l_100km'
  | 'settings.mpg_us'
  | 'settings.mpg_uk'
  | 'trip.autoFuelFlexHint'
  | 'trip.autoFuelGasoline'
  | 'trip.autoFuelEthanol'
  | 'trip.autoFuelDieselHint'
  | 'trip.autoFuelEthanolHint'
  | 'trip.autoFuelGasolineHint'
  | 'common.delete'
  | 'common.cancel'
  | 'common.save'
  | 'common.remove'
  | 'common.editable'
  | 'maintenance.title'
  | 'maintenance.emptyTitle'
  | 'maintenance.emptyDescription'
  | 'maintenance.last30DaysTotal'
  | 'maintenance.monthlyAverage'
  | 'maintenance.nextOilAlert'
  | 'maintenance.noUpcomingOil'
  | 'maintenance.sectionOil'
  | 'maintenance.sectionExpenses'
  | 'maintenance.newExpense'
  | 'maintenance.newOil'
  | 'maintenance.nextByDate'
  | 'maintenance.nextByKm'
  | 'maintenance.alertDue'
  | 'maintenance.alertSoon'
  | 'maintenance.noExpenses'
  | 'maintenance.noVehicle'
  | 'maintenance.recurring'
  | 'maintenance.recurringMonths'
  | 'maintenance.recurringHint'
  | 'maintenance.category'
  | 'maintenance.titleField'
  | 'maintenance.amount'
  | 'maintenance.date'
  | 'maintenance.notes'
  | 'maintenance.saveExpense'
  | 'maintenance.dashboardMonthly'
  | 'maintenance.category.oil_change'
  | 'maintenance.category.tires'
  | 'maintenance.category.insurance'
  | 'maintenance.category.parts'
  | 'maintenance.category.service'
  | 'maintenance.category.other';

interface PreferencesContextType {
  preferences: AppPreferences;
  loading: boolean;
  t: (key: TranslationKey) => string;
  updatePreferences: (input: Partial<AppPreferences>) => Promise<void>;
  completeOnboarding: (input: Partial<AppPreferences>) => Promise<void>;
}

const defaultPreferences: AppPreferences = {
  onboardingCompleted: false,
  initialVehicleCompleted: false,
  language: 'pt-BR',
  countryCode: 'BR',
  unitSystem: 'metric',
  consumptionUnit: 'km_l',
  currencyCode: 'BRL',
};

const countryDefaults: Record<
  string,
  Pick<AppPreferences, 'language' | 'unitSystem' | 'consumptionUnit' | 'currencyCode'>
> = {
  BR: { language: 'pt-BR', unitSystem: 'metric', consumptionUnit: 'km_l', currencyCode: 'BRL' },
  US: { language: 'en', unitSystem: 'imperial', consumptionUnit: 'mpg_us', currencyCode: 'USD' },
  GB: { language: 'en', unitSystem: 'imperial', consumptionUnit: 'mpg_uk', currencyCode: 'GBP' },
  ES: { language: 'es', unitSystem: 'metric', consumptionUnit: 'l_100km', currencyCode: 'EUR' },
  MX: { language: 'es', unitSystem: 'metric', consumptionUnit: 'km_l', currencyCode: 'MXN' },
  AR: { language: 'es', unitSystem: 'metric', consumptionUnit: 'km_l', currencyCode: 'ARS' },
};

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  'pt-BR': {
    'tabs.home': 'Início',
    'tabs.trips': 'Viagens',
    'tabs.refuels': 'Abastecimentos',
    'tabs.maintenance': 'Manutenções',
    'tabs.vehicles': 'Frota',
    'tabs.settings': 'Configurações',
    'setup.title': 'Configure seu app',
    'setup.subtitle': 'Escolha idioma, país e unidades logo no primeiro acesso. Tudo pode ser alterado depois.',
    'setup.language': 'Idioma',
    'setup.country': 'País',
    'setup.unitSystem': 'Sistema de medidas',
    'setup.consumptionUnit': 'Unidade de consumo',
    'setup.finish': 'Continuar',
    'settings.title': 'Configurações',
    'settings.save': 'Salvar configurações',
    'settings.restartHint': 'Essas preferências podem ser alteradas a qualquer momento.',
    'settings.language': 'Idioma',
    'settings.country': 'País',
    'settings.unitSystem': 'Sistema de medidas',
    'settings.consumptionUnit': 'Unidade de consumo',
    'settings.metric': 'Métrico',
    'settings.imperial': 'Imperial',
    'settings.km_l': 'km/l',
    'settings.l_100km': 'L/100 km',
    'settings.mpg_us': 'MPG (US)',
    'settings.mpg_uk': 'MPG (UK)',
    'trip.autoFuelFlexHint': 'Para veículo flex, escolha se a sugestão da ANP deve usar gasolina ou etanol.',
    'trip.autoFuelGasoline': 'Gasolina',
    'trip.autoFuelEthanol': 'Etanol',
    'trip.autoFuelDieselHint': 'A sugestão automática usará diesel na base oficial da ANP.',
    'trip.autoFuelEthanolHint': 'A sugestão automática usará etanol na base oficial da ANP.',
    'trip.autoFuelGasolineHint': 'A sugestão automática usará gasolina na base oficial da ANP.',
    'common.delete': 'Apagar',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.remove': 'Remover',
    'common.editable': 'Editável',
    'maintenance.title': 'Manutenções/Gastos',
    'maintenance.emptyTitle': 'Nenhuma manutenção registrada',
    'maintenance.emptyDescription': 'Registre trocas de óleo e outros gastos para acompanhar o custo de manter o veículo.',
    'maintenance.last30DaysTotal': 'Total 30 dias',
    'maintenance.monthlyAverage': 'Média mensal',
    'maintenance.nextOilAlert': 'Próxima troca de óleo',
    'maintenance.noUpcomingOil': 'Nenhum alerta de óleo por enquanto',
    'maintenance.sectionOil': 'Trocas de óleo',
    'maintenance.sectionExpenses': 'Gastos de manutenção',
    'maintenance.newExpense': 'Novo gasto',
    'maintenance.newOil': 'Troca de óleo',
    'maintenance.nextByDate': 'Próxima troca por data',
    'maintenance.nextByKm': 'Próxima troca por km',
    'maintenance.alertDue': 'Troca de óleo vencida',
    'maintenance.alertSoon': 'Troca de óleo próxima',
    'maintenance.noExpenses': 'Nenhum gasto de manutenção nos últimos registros.',
    'maintenance.noVehicle': 'Cadastre um veículo para acompanhar manutenção e gastos.',
    'maintenance.recurring': 'Gasto recorrente',
    'maintenance.recurringMonths': 'Meses de cobertura',
    'maintenance.recurringHint': 'Seguro e gastos recorrentes entram no custo mensal pelo valor rateado.',
    'maintenance.category': 'Categoria',
    'maintenance.titleField': 'Descrição',
    'maintenance.amount': 'Valor',
    'maintenance.date': 'Data',
    'maintenance.notes': 'Observações',
    'maintenance.saveExpense': 'Salvar gasto',
    'maintenance.dashboardMonthly': 'Manutenção/mês',
    'maintenance.category.oil_change': 'Troca de óleo',
    'maintenance.category.tires': 'Pneus',
    'maintenance.category.insurance': 'Seguro',
    'maintenance.category.parts': 'Peças',
    'maintenance.category.service': 'Revisão/serviço',
    'maintenance.category.other': 'Outro',
  },
  en: {
    'tabs.home': 'Home',
    'tabs.trips': 'Trips',
    'tabs.refuels': 'Refuels',
    'tabs.maintenance': 'Maintenance',
    'tabs.vehicles': 'Fleet',
    'tabs.settings': 'Settings',
    'setup.title': 'Set up your app',
    'setup.subtitle': 'Choose language, country, and units on first launch. You can change everything later.',
    'setup.language': 'Language',
    'setup.country': 'Country',
    'setup.unitSystem': 'Unit system',
    'setup.consumptionUnit': 'Consumption unit',
    'setup.finish': 'Continue',
    'settings.title': 'Settings',
    'settings.save': 'Save settings',
    'settings.restartHint': 'These preferences can be changed at any time.',
    'settings.language': 'Language',
    'settings.country': 'Country',
    'settings.unitSystem': 'Unit system',
    'settings.consumptionUnit': 'Consumption unit',
    'settings.metric': 'Metric',
    'settings.imperial': 'Imperial',
    'settings.km_l': 'km/l',
    'settings.l_100km': 'L/100 km',
    'settings.mpg_us': 'MPG (US)',
    'settings.mpg_uk': 'MPG (UK)',
    'trip.autoFuelFlexHint': 'For flex-fuel vehicles, choose whether the ANP suggestion should use gasoline or ethanol.',
    'trip.autoFuelGasoline': 'Gasoline',
    'trip.autoFuelEthanol': 'Ethanol',
    'trip.autoFuelDieselHint': 'Automatic suggestion will use diesel from the official ANP dataset.',
    'trip.autoFuelEthanolHint': 'Automatic suggestion will use ethanol from the official ANP dataset.',
    'trip.autoFuelGasolineHint': 'Automatic suggestion will use gasoline from the official ANP dataset.',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.remove': 'Remove',
    'common.editable': 'Editable',
    'maintenance.title': 'Maintenance/Costs',
    'maintenance.emptyTitle': 'No maintenance records yet',
    'maintenance.emptyDescription': 'Register oil changes and maintenance costs to track the real cost of keeping your vehicle.',
    'maintenance.last30DaysTotal': 'Last 30 days',
    'maintenance.monthlyAverage': 'Monthly average',
    'maintenance.nextOilAlert': 'Next oil change',
    'maintenance.noUpcomingOil': 'No oil alerts right now',
    'maintenance.sectionOil': 'Oil changes',
    'maintenance.sectionExpenses': 'Maintenance expenses',
    'maintenance.newExpense': 'New expense',
    'maintenance.newOil': 'Oil change',
    'maintenance.nextByDate': 'Next change by date',
    'maintenance.nextByKm': 'Next change by mileage',
    'maintenance.alertDue': 'Oil change overdue',
    'maintenance.alertSoon': 'Oil change coming soon',
    'maintenance.noExpenses': 'No maintenance expenses yet.',
    'maintenance.noVehicle': 'Add a vehicle to track maintenance and ownership costs.',
    'maintenance.recurring': 'Recurring expense',
    'maintenance.recurringMonths': 'Coverage months',
    'maintenance.recurringHint': 'Insurance and recurring costs are converted into a monthly ownership cost.',
    'maintenance.category': 'Category',
    'maintenance.titleField': 'Description',
    'maintenance.amount': 'Amount',
    'maintenance.date': 'Date',
    'maintenance.notes': 'Notes',
    'maintenance.saveExpense': 'Save expense',
    'maintenance.dashboardMonthly': 'Maintenance/month',
    'maintenance.category.oil_change': 'Oil change',
    'maintenance.category.tires': 'Tires',
    'maintenance.category.insurance': 'Insurance',
    'maintenance.category.parts': 'Parts',
    'maintenance.category.service': 'Service',
    'maintenance.category.other': 'Other',
  },
  es: {
    'tabs.home': 'Inicio',
    'tabs.trips': 'Viajes',
    'tabs.refuels': 'Cargas',
    'tabs.maintenance': 'Mantenimiento',
    'tabs.vehicles': 'Flota',
    'tabs.settings': 'Configuración',
    'setup.title': 'Configura tu app',
    'setup.subtitle': 'Elige idioma, país y unidades en el primer acceso. Todo se puede cambiar después.',
    'setup.language': 'Idioma',
    'setup.country': 'País',
    'setup.unitSystem': 'Sistema de medidas',
    'setup.consumptionUnit': 'Unidad de consumo',
    'setup.finish': 'Continuar',
    'settings.title': 'Configuración',
    'settings.save': 'Guardar configuración',
    'settings.restartHint': 'Estas preferencias se pueden cambiar en cualquier momento.',
    'settings.language': 'Idioma',
    'settings.country': 'País',
    'settings.unitSystem': 'Sistema de medidas',
    'settings.consumptionUnit': 'Unidad de consumo',
    'settings.metric': 'Métrico',
    'settings.imperial': 'Imperial',
    'settings.km_l': 'km/l',
    'settings.l_100km': 'L/100 km',
    'settings.mpg_us': 'MPG (US)',
    'settings.mpg_uk': 'MPG (UK)',
    'trip.autoFuelFlexHint': 'Para vehículos flex, elige si la sugerencia de la ANP debe usar gasolina o etanol.',
    'trip.autoFuelGasoline': 'Gasolina',
    'trip.autoFuelEthanol': 'Etanol',
    'trip.autoFuelDieselHint': 'La sugerencia automática usará diésel de la base oficial de la ANP.',
    'trip.autoFuelEthanolHint': 'La sugerencia automática usará etanol de la base oficial de la ANP.',
    'trip.autoFuelGasolineHint': 'La sugerencia automática usará gasolina de la base oficial de la ANP.',
    'common.delete': 'Borrar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.remove': 'Eliminar',
    'common.editable': 'Editable',
    'maintenance.title': 'Mantenimiento/Gastos',
    'maintenance.emptyTitle': 'Sin mantenimientos registrados',
    'maintenance.emptyDescription': 'Registra cambios de aceite y otros gastos para controlar el costo real del vehículo.',
    'maintenance.last30DaysTotal': 'Total 30 días',
    'maintenance.monthlyAverage': 'Promedio mensual',
    'maintenance.nextOilAlert': 'Próximo cambio de aceite',
    'maintenance.noUpcomingOil': 'Sin alertas de aceite por ahora',
    'maintenance.sectionOil': 'Cambios de aceite',
    'maintenance.sectionExpenses': 'Gastos de mantenimiento',
    'maintenance.newExpense': 'Nuevo gasto',
    'maintenance.newOil': 'Cambio de aceite',
    'maintenance.nextByDate': 'Próximo cambio por fecha',
    'maintenance.nextByKm': 'Próximo cambio por km',
    'maintenance.alertDue': 'Cambio de aceite vencido',
    'maintenance.alertSoon': 'Cambio de aceite próximo',
    'maintenance.noExpenses': 'Todavía no hay gastos de mantenimiento.',
    'maintenance.noVehicle': 'Agrega un vehículo para controlar mantenimiento y costos.',
    'maintenance.recurring': 'Gasto recurrente',
    'maintenance.recurringMonths': 'Meses de cobertura',
    'maintenance.recurringHint': 'Seguro y gastos recurrentes se convierten en costo mensual del vehículo.',
    'maintenance.category': 'Categoría',
    'maintenance.titleField': 'Descripción',
    'maintenance.amount': 'Valor',
    'maintenance.date': 'Fecha',
    'maintenance.notes': 'Notas',
    'maintenance.saveExpense': 'Guardar gasto',
    'maintenance.dashboardMonthly': 'Mantenimiento/mes',
    'maintenance.category.oil_change': 'Cambio de aceite',
    'maintenance.category.tires': 'Neumáticos',
    'maintenance.category.insurance': 'Seguro',
    'maintenance.category.parts': 'Piezas',
    'maintenance.category.service': 'Servicio',
    'maintenance.category.other': 'Otro',
  },
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocalPreferences()
      .then((saved) => {
        if (saved) {
          setPreferences({ ...defaultPreferences, ...saved });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<PreferencesContextType>(
    () => ({
      preferences,
      loading,
      t: (key) => translations[preferences.language][key] || translations['pt-BR'][key] || key,
      updatePreferences: async (input) => {
        const next = { ...preferences, ...input };
        setPreferences(next);
        await saveLocalPreferences(next);
      },
      completeOnboarding: async (input) => {
        const next = {
          ...preferences,
          ...input,
          onboardingCompleted: true,
        };
        setPreferences(next);
        await saveLocalPreferences(next);
      },
    }),
    [loading, preferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}

export function getCountryDefaults(countryCode: string) {
  return countryDefaults[countryCode] || countryDefaults.BR;
}

export function getMaintenanceCategoryLabels(
  t: (key: TranslationKey) => string
): Record<MaintenanceCategory, string> {
  return {
    oil_change: t('maintenance.category.oil_change'),
    tires: t('maintenance.category.tires'),
    insurance: t('maintenance.category.insurance'),
    parts: t('maintenance.category.parts'),
    service: t('maintenance.category.service'),
    other: t('maintenance.category.other'),
  };
}

export const languageOptions: { value: AppLanguage; label: string }[] = [
  { value: 'pt-BR', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

export const countryOptions = [
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'United States' },
  { value: 'ES', label: 'España' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'GB', label: 'United Kingdom' },
];

export const unitSystemOptions: { value: UnitSystem; key: TranslationKey }[] = [
  { value: 'metric', key: 'settings.metric' },
  { value: 'imperial', key: 'settings.imperial' },
];

export const consumptionUnitOptions: { value: ConsumptionUnit; key: TranslationKey }[] = [
  { value: 'km_l', key: 'settings.km_l' },
  { value: 'l_100km', key: 'settings.l_100km' },
  { value: 'mpg_us', key: 'settings.mpg_us' },
  { value: 'mpg_uk', key: 'settings.mpg_uk' },
];
