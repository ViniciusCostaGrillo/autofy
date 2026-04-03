import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { Gauge, Fuel, DollarSign, MapPin } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useRefuels } from '@/hooks/useRefuels';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const refuelSchema = z.object({
  odometer: z.string().transform(v => Number(v)).pipe(z.number().positive('Odômetro inválido')),
  liters: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Litros inválidos')),
  totalPrice: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Preço inválido')),
  gasStation: z.string().optional(),
});

export default function NewRefuelModal() {
  const { vehicles, updateVehicle } = useVehicles();
  const { addRefuel } = useRefuels();
  const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(refuelSchema),
    defaultValues: {
      odometer: defaultVehicle?.currentOdometer.toString() || '',
      liters: '',
      totalPrice: '',
      gasStation: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!defaultVehicle) return;
    setSaving(true);
    const pricePerLiter = data.totalPrice / data.liters;
    await addRefuel({
      vehicleId: defaultVehicle.id,
      date: new Date().toISOString(),
      odometer: data.odometer,
      liters: data.liters,
      totalPrice: data.totalPrice,
      pricePerLiter,
      fuelType: defaultVehicle.fuelType,
      fullTank: true,
      gasStation: data.gasStation,
    });
    if (data.odometer > defaultVehicle.currentOdometer) {
      await updateVehicle(defaultVehicle.id, { currentOdometer: data.odometer });
    }
    setSaving(false);
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
      <View className="px-6 pt-6 pb-10">
        {defaultVehicle && (
          <View className="mb-6 p-4 bg-surface rounded-3xl border border-surfaceLight">
            <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veículo Selecionado</Text>
            <Text className="text-textMain font-black text-lg tracking-tight">{defaultVehicle.nickname}</Text>
            <Text className="text-xs text-textMuted font-medium mt-0.5">Odômetro atual: {defaultVehicle.currentOdometer.toLocaleString()} km</Text>
          </View>
        )}

        <Controller control={control} name="odometer"
          render={({ field: { onChange, value } }) => (
            <Input label="Odômetro (km)" placeholder="Ex: 45200" keyboardType="numeric"
              value={value} onChangeText={onChange} error={errors.odometer?.message}
              leftIcon={<Gauge size={20} color="#B3B3B3" />} />
          )}
        />

        <View className="flex-row gap-4 mb-2">
          <View className="flex-1">
            <Controller control={control} name="liters"
              render={({ field: { onChange, value } }) => (
                <Input label="Litros" placeholder="40.5" keyboardType="numeric"
                  value={value} onChangeText={onChange} error={errors.liters?.message}
                  leftIcon={<Fuel size={20} color="#1DB954" />} />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller control={control} name="totalPrice"
              render={({ field: { onChange, value } }) => (
                <Input label="Valor (R$)" placeholder="220.00" keyboardType="numeric"
                  value={value} onChangeText={onChange} error={errors.totalPrice?.message}
                  leftIcon={<DollarSign size={20} color="#B3B3B3" />} />
              )}
            />
          </View>
        </View>

        <Controller control={control} name="gasStation"
          render={({ field: { onChange, value } }) => (
            <Input label="Posto (Opcional)" placeholder="Ex: Posto BR Ipiranga"
              value={value} onChangeText={onChange} error={errors.gasStation?.message}
              leftIcon={<MapPin size={20} color="#B3B3B3" />} />
          )}
        />

        <Button label="Salvar Abastecimento" onPress={handleSubmit(onSubmit)} isLoading={saving} className="mt-6" />
      </View>
    </ScrollView>
  );
}
