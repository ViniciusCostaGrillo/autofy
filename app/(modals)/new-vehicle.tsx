import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, Gauge, Calendar } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SearchablePicker } from '@/components/ui/SearchablePicker';
import { findVehicleCatalogEntry, getModelsByBrand, vehicleBrands } from '@/lib/vehicleCatalog';
import { FuelType } from '@/types/models';

const schema = z.object({
  nickname: z.string().min(1, 'Apelido obrigatorio'),
  brand: z.string().min(1, 'Marca obrigatoria'),
  model: z.string().min(1, 'Modelo obrigatorio'),
  year: z.string().transform((value) => Number(value)).pipe(z.number().min(1960).max(new Date().getFullYear() + 1, 'Ano invalido')),
  manualAvgConsumption: z.string().transform((value) => Number(value.replace(',', '.'))).pipe(z.number().positive('Consumo invalido')),
  currentOdometer: z.string().transform((value) => Number(value)).pipe(z.number().min(0)),
});

const FUEL_TYPES: { key: FuelType; label: string }[] = [
  { key: 'flex', label: 'Flex' },
  { key: 'gasoline', label: 'Gasolina' },
  { key: 'ethanol', label: 'Etanol' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'electric', label: 'Eletrico' },
  { key: 'hybrid', label: 'Hibrido' },
];

export default function NewVehicleModal() {
  const insets = useSafeAreaInsets();
  const { addVehicle, vehicles } = useVehicles();
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('flex');
  const [isDefault, setIsDefault] = useState(vehicles.length === 0);
  const [hasTollTag, setHasTollTag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [brandPickerVisible, setBrandPickerVisible] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: '',
      brand: '',
      model: '',
      year: new Date().getFullYear().toString(),
      manualAvgConsumption: '',
      currentOdometer: '0',
    },
  });

  const selectedBrand = watch('brand');
  const selectedModel = watch('model');
  const suggestedVehicle = findVehicleCatalogEntry(selectedBrand || '', selectedModel || '');
  const modelsForSelectedBrand = selectedBrand ? getModelsByBrand(selectedBrand) : [];

  const handleBrandSelect = (brand: string) => {
    setValue('brand', brand, { shouldValidate: true });
    const nextModels = getModelsByBrand(brand);
    if (!nextModels.includes(selectedModel || '')) {
      setValue('model', '', { shouldValidate: true });
    }
  };

  const handleModelSelect = (model: string) => {
    setValue('model', model, { shouldValidate: true });
    const catalogEntry = findVehicleCatalogEntry(selectedBrand || '', model);
    if (!catalogEntry) return;

    if (catalogEntry.fuelType) {
      setSelectedFuel(catalogEntry.fuelType);
    }

    if (catalogEntry.recommendedConsumptionKmL && catalogEntry.recommendedConsumptionKmL > 0) {
      setValue('manualAvgConsumption', catalogEntry.recommendedConsumptionKmL.toFixed(1), {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    setSubmitError('');

    const result = await addVehicle({
      nickname: data.nickname,
      brand: data.brand,
      model: data.model,
      year: data.year,
      fuelType: selectedFuel,
      manualAvgConsumption: data.manualAvgConsumption,
      currentOdometer: data.currentOdometer,
      hasTollTag,
      isDefault: isDefault || vehicles.length === 0,
    });

    setSaving(false);

    if (result.error) {
      setSubmitError('Nao foi possivel salvar o veiculo. Tente novamente.');
      return;
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="nickname"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Apelido do veiculo"
              placeholder="Ex: Meu Civic, Carro da Familia"
              value={value}
              onChangeText={onChange}
              error={errors.nickname?.message}
              leftIcon={<Car size={20} color="#1DB954" />}
            />
          )}
        />

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Controller control={control} name="brand" render={({ field: { onChange, value } }) => (
              <Input
                label="Marca"
                placeholder="Honda"
                value={value}
                onChangeText={onChange}
                error={errors.brand?.message}
              />
            )} />
            <TouchableOpacity
              onPress={() => setBrandPickerVisible(true)}
              className="mt-[-8px] mb-3 self-start px-3 py-2 rounded-full bg-surface border border-surfaceLight"
            >
              <Text className="text-textMuted text-xs font-bold">Escolher da lista</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Controller control={control} name="model" render={({ field: { onChange, value } }) => (
              <Input
                label="Modelo"
                placeholder="Civic"
                value={value}
                onChangeText={onChange}
                error={errors.model?.message}
              />
            )} />
            <TouchableOpacity
              onPress={() => setModelPickerVisible(true)}
              disabled={!selectedBrand}
              className={`mt-[-8px] mb-3 self-start px-3 py-2 rounded-full border ${selectedBrand ? 'bg-surface border-surfaceLight' : 'bg-surfaceLight border-surfaceLight opacity-50'}`}
            >
              <Text className="text-textMuted text-xs font-bold">Escolher da lista</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Controller control={control} name="year" render={({ field: { onChange, value } }) => (
              <Input
                label="Ano"
                placeholder="2020"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                error={errors.year?.message}
                leftIcon={<Calendar size={20} color="#B3B3B3" />}
              />
            )} />
          </View>
          <View className="flex-1">
            <Controller control={control} name="currentOdometer" render={({ field: { onChange, value } }) => (
              <Input
                label="Odometro (km)"
                placeholder="45000"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                error={errors.currentOdometer?.message}
                leftIcon={<Gauge size={20} color="#B3B3B3" />}
              />
            )} />
          </View>
        </View>

        <Controller control={control} name="manualAvgConsumption" render={({ field: { onChange, value } }) => (
          <Input
            label="Consumo medio (km/l)"
            placeholder="Ex: 10.5"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            error={errors.manualAvgConsumption?.message}
          />
        )} />

        {suggestedVehicle?.recommendedConsumptionKmL ? (
          <View className="mb-6 mt-[-10px] px-1">
            <Text className="text-primary text-sm font-bold">
              {suggestedVehicle.recommendationNote} {suggestedVehicle.recommendedConsumptionKmL.toFixed(1)} km/l
            </Text>
            <Text className="text-textMuted text-xs mt-1">
              Esse valor e apenas uma recomendacao inicial e pode ser editado manualmente.
            </Text>
          </View>
        ) : suggestedVehicle ? (
          <View className="mb-6 mt-[-10px] px-1">
            <Text className="text-textMuted text-xs mt-1">
              Modelo encontrado na lista brasileira. Preencha o consumo manualmente caso ainda nao exista recomendacao automatica.
            </Text>
          </View>
        ) : null}

        <Text className="text-textMuted font-bold text-sm tracking-widest mb-3 ml-2 uppercase">Combustivel</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {FUEL_TYPES.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedFuel(key)}
              className={`px-4 py-2.5 rounded-full border-2 ${selectedFuel === key ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight'}`}
            >
              <Text className={`font-black text-sm ${selectedFuel === key ? 'text-background' : 'text-textMuted'}`}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setHasTollTag(!hasTollTag)}
          className={`flex-row items-center p-4 rounded-2xl border-2 mb-6 ${hasTollTag ? 'border-primary bg-primary/10' : 'border-surfaceLight bg-surface'}`}
        >
          <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${hasTollTag ? 'bg-primary border-primary' : 'border-surfaceLight'}`}>
            {hasTollTag ? <Text className="text-background text-xs font-black">OK</Text> : null}
          </View>
          <View className="flex-1">
            <Text className={`font-bold ${hasTollTag ? 'text-primary' : 'text-textMuted'}`}>Possui tag de pedagio</Text>
            <Text className="text-textMuted text-xs mt-1">Usa estimativa com Sem Parar ao calcular pedagios.</Text>
          </View>
        </TouchableOpacity>

        {vehicles.length > 0 ? (
          <TouchableOpacity
            onPress={() => setIsDefault(!isDefault)}
            className={`flex-row items-center p-4 rounded-2xl border-2 mb-6 ${isDefault ? 'border-primary bg-primary/10' : 'border-surfaceLight bg-surface'}`}
          >
            <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${isDefault ? 'bg-primary border-primary' : 'border-surfaceLight'}`}>
              {isDefault ? <Text className="text-background text-xs font-black">OK</Text> : null}
            </View>
            <Text className={`font-bold ${isDefault ? 'text-primary' : 'text-textMuted'}`}>Definir como veiculo padrao</Text>
          </TouchableOpacity>
        ) : null}

        {submitError ? <Text className="text-danger font-bold mb-4">{submitError}</Text> : null}
        <Button label="Salvar veiculo" onPress={handleSubmit(onSubmit)} isLoading={saving} />
      </ScrollView>

      <SearchablePicker
        title="Escolher marca"
        visible={brandPickerVisible}
        options={vehicleBrands}
        onClose={() => setBrandPickerVisible(false)}
        onSelect={handleBrandSelect}
      />
      <SearchablePicker
        title={selectedBrand ? `Modelos de ${selectedBrand}` : 'Escolher modelo'}
        visible={modelPickerVisible}
        options={modelsForSelectedBrand}
        onClose={() => setModelPickerVisible(false)}
        onSelect={handleModelSelect}
      />
    </KeyboardAvoidingView>
  );
}
