import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
import { TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences, t, updatePreferences } = usePreferences();
  const [language, setLanguage] = useState<AppLanguage>(preferences.language);
  const [countryCode, setCountryCode] = useState(preferences.countryCode);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(preferences.unitSystem);
  const [consumptionUnit, setConsumptionUnit] = useState<ConsumptionUnit>(preferences.consumptionUnit);

  useEffect(() => {
    setLanguage(preferences.language);
    setCountryCode(preferences.countryCode);
    setUnitSystem(preferences.unitSystem);
    setConsumptionUnit(preferences.consumptionUnit);
  }, [preferences]);

  const handleCountryChange = (value: string) => {
    const defaults = getCountryDefaults(value);
    setCountryCode(value);
    setLanguage(defaults.language);
    setUnitSystem(defaults.unitSystem);
    setConsumptionUnit(defaults.consumptionUnit);
  };

  const handleSave = async () => {
    const defaults = getCountryDefaults(countryCode);
    await updatePreferences({
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
        padding: 24,
        paddingBottom: Math.max(insets.bottom, 16) + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-black text-textMain tracking-tighter mb-2">{t('settings.title')}</Text>
      <Text className="text-textMuted mb-8">{t('settings.restartHint')}</Text>

      <OptionGroup
        title={t('settings.language')}
        options={languageOptions.map((item) => ({ value: item.value, label: item.label }))}
        selected={language}
        onSelect={(value) => setLanguage(value as AppLanguage)}
      />
      <OptionGroup
        title={t('settings.country')}
        options={countryOptions.map((item) => ({ value: item.value, label: item.label }))}
        selected={countryCode}
        onSelect={handleCountryChange}
      />
      <OptionGroup
        title={t('settings.unitSystem')}
        options={unitSystemOptions.map((item) => ({ value: item.value, label: t(item.key) }))}
        selected={unitSystem}
        onSelect={(value) => setUnitSystem(value as UnitSystem)}
      />
      <OptionGroup
        title={t('settings.consumptionUnit')}
        options={consumptionUnitOptions.map((item) => ({ value: item.value, label: t(item.key) }))}
        selected={consumptionUnit}
        onSelect={(value) => setConsumptionUnit(value as ConsumptionUnit)}
      />

      <Button label={t('settings.save')} onPress={handleSave} className="mt-6" />
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
