import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  consumptionUnitOptions,
  countryOptions,
  getCountryDefaults,
  languageOptions,
  unitSystemOptions,
  usePreferences,
} from '@/lib/PreferencesContext';
import { AppLanguage, ConsumptionUnit, UnitSystem } from '@/types/models';

const avatarTemplates = [
  { id: '1', name: 'João', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: '2', name: 'Marina', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: '3', name: 'Lucas', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: '4', name: 'Sofia', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80' }
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences, t, updatePreferences } = usePreferences();
  const [language, setLanguage] = useState<AppLanguage>(preferences.language);
  const [countryCode, setCountryCode] = useState(preferences.countryCode);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(preferences.unitSystem);
  const [consumptionUnit, setConsumptionUnit] = useState<ConsumptionUnit>(preferences.consumptionUnit);
  
  // Custom Profile Configuration States
  const [name, setName] = useState(preferences.name || 'João');
  const [avatarUrl, setAvatarUrl] = useState(preferences.avatarUrl || avatarTemplates[0].url);

  useEffect(() => {
    setLanguage(preferences.language);
    setCountryCode(preferences.countryCode);
    setUnitSystem(preferences.unitSystem);
    setConsumptionUnit(preferences.consumptionUnit);
    setName(preferences.name || 'João');
    setAvatarUrl(preferences.avatarUrl || avatarTemplates[0].url);
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
      name,
      avatarUrl,
    });
  };

  // Localized Labels
  const labelProfile = preferences.language === 'pt-BR' ? 'Configuração de Perfil' : preferences.language === 'es' ? 'Configuración de Perfil' : 'Profile Settings';
  const labelName = preferences.language === 'pt-BR' ? 'Nome de Exibição' : preferences.language === 'es' ? 'Nombre de Mostrar' : 'Display Name';
  const labelAvatar = preferences.language === 'pt-BR' ? 'Escolha seu Avatar' : preferences.language === 'es' ? 'Elige tu Avatar' : 'Choose your Avatar';
  const labelCustomUrl = preferences.language === 'pt-BR' ? 'Ou insira uma URL de foto personalizada' : preferences.language === 'es' ? 'O introduce una URL de foto personalizada' : 'Or paste a custom photo URL';
  const labelAppPreferences = preferences.language === 'pt-BR' ? 'Preferências do Aplicativo' : preferences.language === 'es' ? 'Preferencias del Aplicativo' : 'App Preferences';

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

      {/* Profile Section */}
      <View className="mb-8 bg-surface rounded-3xl p-5 border border-surfaceLight">
        <Text className="text-primary font-black text-base uppercase tracking-wider mb-4">{labelProfile}</Text>

        {/* Display Name Input */}
        <Input
          label={labelName}
          value={name}
          onChangeText={setName}
          placeholder="Ex: João"
        />

        {/* Avatar Template Picker */}
        <Text className="text-textMuted font-bold text-sm tracking-wide mb-3 ml-2 uppercase">{labelAvatar}</Text>
        <View className="flex-row justify-between mb-5">
          {avatarTemplates.map((template) => {
            const isSelected = avatarUrl === template.url;
            return (
              <TouchableOpacity
                key={template.id}
                onPress={() => setAvatarUrl(template.url)}
                className="relative"
              >
                <Image
                  source={{ uri: template.url }}
                  className={`w-14 h-14 rounded-full ${
                    isSelected ? 'border-4 border-[#3B82F6]' : 'border border-surfaceLight'
                  }`}
                />
                {isSelected && (
                  <View className="absolute -bottom-1 -right-1 bg-[#3B82F6] rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-[10px] text-white font-bold">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Avatar URL Input */}
        <Input
          label={labelCustomUrl}
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://exemplo.com/sua-foto.jpg"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Text className="text-primary font-black text-base uppercase tracking-wider mb-6 ml-2">{labelAppPreferences}</Text>

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
