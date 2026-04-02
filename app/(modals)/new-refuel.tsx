import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import uuid from 'react-native-uuid';

import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const refuelSchema = z.object({
  odometer: z.string().transform(v => Number(v)).pipe(z.number().positive('Odômetro inválido')),
  liters: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Litros inválidos')),
  totalPrice: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Preço inválido')),
  gasStation: z.string().optional(),
});

type RefuelFormValues = z.input<typeof refuelSchema>;

export default function NewRefuelModal() {
  const { vehicles, addRefuel, updateVehicle } = useStore();
  const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(refuelSchema),
    defaultValues: {
      odometer: defaultVehicle?.currentOdometer.toString() || '',
      liters: '',
      totalPrice: '',
      gasStation: '',
    }
  });

  const onSubmit = (data: any) => {
    if (!defaultVehicle) return;

    const pricePerLiter = data.totalPrice / data.liters;

    addRefuel({
      id: uuid.v4() as string,
      vehicleId: defaultVehicle.id,
      date: new Date().toISOString(),
      odometer: data.odometer,
      liters: data.liters,
      totalPrice: data.totalPrice,
      pricePerLiter,
      fuelType: defaultVehicle.fuelType,
      fullTank: true, // simplified for MVP UI
      gasStation: data.gasStation,
      createdAt: new Date().toISOString(),
    });

    // Atualiza odômetro no carro
    if (data.odometer > defaultVehicle.currentOdometer) {
      updateVehicle(defaultVehicle.id, { currentOdometer: data.odometer });
    }

    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900" keyboardShouldPersistTaps="handled">
      <View className="px-6 pt-6 pb-10">
        
        {defaultVehicle && (
          <View className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <Text className="text-slate-500 mb-1">Veículo Selecionado</Text>
            <Text className="text-slate-800 dark:text-white font-semibold text-lg">{defaultVehicle.nickname}</Text>
            <Text className="text-xs text-slate-400">Rodagem atual: {defaultVehicle.currentOdometer} km</Text>
          </View>
        )}

        <Controller
          control={control}
          name="odometer"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Odômetro (km)"
              placeholder="Ex: 45200"
              keyboardType="numeric"
              value={value}
              onChangeText={onChange}
              error={errors.odometer?.message}
            />
          )}
        />

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Controller
              control={control}
              name="liters"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Litros abastecidos"
                  placeholder="Ex: 40.5"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={errors.liters?.message}
                />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="totalPrice"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Valor Pago (R$)"
                  placeholder="Ex: 220.00"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={errors.totalPrice?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="gasStation"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Posto (Opcional)"
              placeholder="Ex: Posto BR Ipiranga"
              value={value}
              onChangeText={onChange}
              error={errors.gasStation?.message}
            />
          )}
        />

        <Button
          label="Salvar Abastecimento"
          onPress={handleSubmit(onSubmit)}
          className="mt-6"
        />
      </View>
    </ScrollView>
  );
}
