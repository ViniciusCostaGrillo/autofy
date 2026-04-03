import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { Car, Gauge, Calendar } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FuelType } from '@/types/models';

const schema = z.object({
  nickname: z.string().min(1, 'Apelido obrigatório'),
  brand: z.string().min(1, 'Marca obrigatória'),
  model: z.string().min(1, 'Modelo obrigatório'),
  year: z.string().transform(v => Number(v)).pipe(z.number().min(1960).max(new Date().getFullYear() + 1, 'Ano inválido')),
  manualAvgConsumption: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Consumo inválido')),
  currentOdometer: z.string().transform(v => Number(v)).pipe(z.number().min(0)),
});

const FUEL_TYPES: { key: FuelType; label: string }[] = [
  { key: 'flex', label: 'Flex' },
  { key: 'gasoline', label: 'Gasolina' },
  { key: 'ethanol', label: 'Etanol' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'electric', label: 'Elétrico' },
  { key: 'hybrid', label: 'Híbrido' },
];

export default function NewVehicleModal() {
  const { addVehicle, vehicles } = useVehicles();
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('flex');
  const [isDefault, setIsDefault] = useState(vehicles.length === 0);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: '', brand: '', model: '',
      year: new Date().getFullYear().toString(),
      manualAvgConsumption: '',
      currentOdometer: '0',
    },
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    await addVehicle({
      nickname: data.nickname,
      brand: data.brand,
      model: data.model,
      year: data.year,
      fuelType: selectedFuel,
      manualAvgConsumption: data.manualAvgConsumption,
      currentOdometer: data.currentOdometer,
      hasTollTag: false,
      isDefault: isDefault || vehicles.length === 0,
    });
    setSaving(false);
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
      <View className="px-6 pt-6 pb-10">
        <Controller control={control} name="nickname"
          render={({ field: { onChange, value } }) => (
            <Input label="Apelido do veículo" placeholder="Ex: Meu Civic, Carro da Família"
              value={value} onChangeText={onChange} error={errors.nickname?.message}
              leftIcon={<Car size={20} color="#1DB954" />} />
          )}
        />

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Controller control={control} name="brand"
              render={({ field: { onChange, value } }) => (
                <Input label="Marca" placeholder="Honda" value={value} onChangeText={onChange} error={errors.brand?.message} />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller control={control} name="model"
              render={({ field: { onChange, value } }) => (
                <Input label="Modelo" placeholder="Civic" value={value} onChangeText={onChange} error={errors.model?.message} />
              )}
            />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Controller control={control} name="year"
              render={({ field: { onChange, value } }) => (
                <Input label="Ano" placeholder="2020" keyboardType="numeric"
                  value={value} onChangeText={onChange} error={errors.year?.message}
                  leftIcon={<Calendar size={20} color="#B3B3B3" />} />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller control={control} name="currentOdometer"
              render={({ field: { onChange, value } }) => (
                <Input label="Odômetro (km)" placeholder="45000" keyboardType="numeric"
                  value={value} onChangeText={onChange} error={errors.currentOdometer?.message}
                  leftIcon={<Gauge size={20} color="#B3B3B3" />} />
              )}
            />
          </View>
        </View>

        <Controller control={control} name="manualAvgConsumption"
          render={({ field: { onChange, value } }) => (
            <Input label="Consumo médio (km/l)" placeholder="Ex: 10.5" keyboardType="numeric"
              value={value} onChangeText={onChange} error={errors.manualAvgConsumption?.message} />
          )}
        />

        {/* Seletor de combustível */}
        <Text className="text-textMuted font-bold text-sm tracking-widest mb-3 ml-2 uppercase">Combustível</Text>
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

        {/* Toggle padrão */}
        {vehicles.length > 0 && (
          <TouchableOpacity
            onPress={() => setIsDefault(!isDefault)}
            className={`flex-row items-center p-4 rounded-2xl border-2 mb-6 ${isDefault ? 'border-primary bg-primary/10' : 'border-surfaceLight bg-surface'}`}
          >
            <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${isDefault ? 'bg-primary border-primary' : 'border-surfaceLight'}`}>
              {isDefault && <Text className="text-background text-xs font-black">✓</Text>}
            </View>
            <Text className={`font-bold ${isDefault ? 'text-primary' : 'text-textMuted'}`}>Definir como veículo padrão</Text>
          </TouchableOpacity>
        )}

        <Button label="Salvar Veículo" onPress={handleSubmit(onSubmit)} isLoading={saving} />
      </View>
    </ScrollView>
  );
}
