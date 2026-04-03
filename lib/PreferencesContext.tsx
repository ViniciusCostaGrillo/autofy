import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppLanguage, AppPreferences, ConsumptionUnit, UnitSystem } from '@/types/models';
import { getLocalPreferences, saveLocalPreferences } from '@/lib/localStore';

type TranslationKey =
  | 'tabs.home'
  | 'tabs.trips'
  | 'tabs.refuels'
  | 'tabs.oil'
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
  | 'oil.title'
  | 'oil.emptyTitle'
  | 'oil.emptyDescription'
  | 'oil.new'
  | 'oil.nextByDate'
  | 'oil.nextByKm'
  | 'oil.alertDue'
  | 'oil.alertSoon';

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
    'tabs.oil': 'Óleo',
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
    'oil.title': 'Troca de óleo',
    'oil.emptyTitle': 'Nenhuma troca registrada',
    'oil.emptyDescription': 'Registre a troca de óleo para receber alertas por data e odômetro.',
    'oil.new': 'Nova troca',
    'oil.nextByDate': 'Próxima troca por data',
    'oil.nextByKm': 'Próxima troca por km',
    'oil.alertDue': 'Troca de óleo vencida',
    'oil.alertSoon': 'Troca de óleo próxima',
  },
  en: {
    'tabs.home': 'Home',
    'tabs.trips': 'Trips',
    'tabs.refuels': 'Refuels',
    'tabs.oil': 'Oil',
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
    'oil.title': 'Oil changes',
    'oil.emptyTitle': 'No oil changes yet',
    'oil.emptyDescription': 'Register an oil change to receive alerts by date and odometer.',
    'oil.new': 'New oil change',
    'oil.nextByDate': 'Next change by date',
    'oil.nextByKm': 'Next change by mileage',
    'oil.alertDue': 'Oil change overdue',
    'oil.alertSoon': 'Oil change coming soon',
  },
  es: {
    'tabs.home': 'Inicio',
    'tabs.trips': 'Viajes',
    'tabs.refuels': 'Cargas',
    'tabs.oil': 'Aceite',
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
    'trip.autoFuelDieselHint': 'La sugerencia automática usará diesel de la base oficial de la ANP.',
    'trip.autoFuelEthanolHint': 'La sugerencia automática usará etanol de la base oficial de la ANP.',
    'trip.autoFuelGasolineHint': 'La sugerencia automática usará gasolina de la base oficial de la ANP.',
    'common.delete': 'Borrar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.remove': 'Eliminar',
    'common.editable': 'Editable',
    'oil.title': 'Cambios de aceite',
    'oil.emptyTitle': 'Sin cambios registrados',
    'oil.emptyDescription': 'Registra el cambio de aceite para recibir alertas por fecha y kilometraje.',
    'oil.new': 'Nuevo cambio',
    'oil.nextByDate': 'Próximo cambio por fecha',
    'oil.nextByKm': 'Próximo cambio por km',
    'oil.alertDue': 'Cambio de aceite vencido',
    'oil.alertSoon': 'Cambio de aceite próximo',
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
