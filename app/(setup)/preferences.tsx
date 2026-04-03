import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import {
  consumptionUnitOptions,
  countryOptions,
  getCountryDefaults,
  languageOptions,
  unitSystemOptions,
  usePreferences,
} from '@/lib/PreferencesContext';
import { AppLanguage, ConsumptionUnit, UnitSystem } from '@/types/models';

export default function PreferencesSetupScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, preferences, t } = usePreferences();
  const [language, setLanguage] = useState<AppLanguage>(preferences.language);
  const [countryCode, setCountryCode] = useState(preferences.countryCode);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(preferences.unitSystem);
  const [consumptionUnit, setConsumptionUnit] = useState<ConsumptionUnit>(preferences.consumptionUnit);

  useEffect(() => {
    const defaults = getCountryDefaults(countryCode);
    setLanguage(defaults.language);
    setUnitSystem(defaults.unitSystem);
    setConsumptionUnit(defaults.consumptionUnit);
  }, [countryCode]);

  const handleFinish = async () => {
    const defaults = getCountryDefaults(countryCode);
    await completeOnboarding({
      language,
      countryCode,
      unitSystem,
      consumptionUnit,
      currencyCode: defaults.currencyCode,
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: Math.max(insets.bottom, 24) + 24,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-textMain text-4xl font-black tracking-tighter mb-3">{t('setup.title')}</Text>
      <Text className="text-textMuted text-base font-medium mb-8">{t('setup.subtitle')}</Text>

      <OptionGroup
        title={t('setup.language')}
        options={languageOptions.map((item) => ({ value: item.value, label: item.label }))}
        selected={language}
        onSelect={(value) => setLanguage(value as AppLanguage)}
      />

      <OptionGroup
        title={t('setup.country')}
        options={countryOptions.map((item) => ({ value: item.value, label: item.label }))}
        selected={countryCode}
        onSelect={setCountryCode}
      />

      <OptionGroup
        title={t('setup.unitSystem')}
        options={unitSystemOptions.map((item) => ({ value: item.value, label: t(item.key) }))}
        selected={unitSystem}
        onSelect={(value) => setUnitSystem(value as UnitSystem)}
      />

      <OptionGroup
        title={t('setup.consumptionUnit')}
        options={consumptionUnitOptions.map((item) => ({ value: item.value, label: t(item.key) }))}
        selected={consumptionUnit}
        onSelect={(value) => setConsumptionUnit(value as ConsumptionUnit)}
      />

      <Button label={t('setup.finish')} onPress={handleFinish} className="mt-6" />
    </ScrollView>
  );
}

function OptionGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="mb-7">
      <Text className="text-textMuted font-bold text-sm tracking-wide mb-3 ml-1 uppercase">{title}</Text>
      <View className="gap-3">
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`rounded-3xl border-2 px-5 py-4 ${
              selected === option.value ? 'bg-primary/15 border-primary' : 'bg-surface border-surfaceLight'
            }`}
          >
            <Text className={`font-bold text-base ${selected === option.value ? 'text-primary' : 'text-textMain'}`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
