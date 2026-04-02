import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { MapPin, Users, Route } from 'lucide-react-native';
import uuid from 'react-native-uuid';

import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { calculateRequiredLiters, calculateFuelCost, calculateTotalTripCost, formatCurrency } from '@/utils/calculations';

const tripSchema = z.object({
  origin: z.string().min(2, 'Origem é obrigatória'),
  destination: z.string().min(2, 'Destino é obrigatório'),
  distanceKm: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Distância deve ser maior que 0')),
  passengers: z.string().optional().transform(v => v ? Number(v) : 1),
  fuelPrice: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Preço do combustível')),
  tollCost: z.string().optional().transform(v => v ? Number(v.replace(',', '.')) : 0),
});

type TripFormValues = z.input<typeof tripSchema>;

export default function NewTripModal() {
  const { vehicles, addTrip } = useStore();
  const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];
  const [result, setResult] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      origin: '',
      destination: '',
      distanceKm: '',
      passengers: '1',
      fuelPrice: '',
      tollCost: '0',
    }
  });

  const onSubmit = (data: any) => {
    if (!defaultVehicle) return;

    const avgConsumption = defaultVehicle.manualAvgConsumption;
    const requiredLiters = calculateRequiredLiters(data.distanceKm, avgConsumption);
    const fuelCost = calculateFuelCost(requiredLiters, data.fuelPrice);
    const totalCost = calculateTotalTripCost(fuelCost, data.tollCost);

    setResult({
      ...data,
      avgConsumption,
      requiredLiters,
      fuelCost,
      totalCost,
    });
  };

  const handleSaveTrip = () => {
    if (!result || !defaultVehicle) return;

    addTrip({
      id: uuid.v4() as string,
      vehicleId: defaultVehicle.id,
      origin: result.origin,
      destination: result.destination,
      distanceKm: result.distanceKm,
      avgConsumptionUsed: result.avgConsumption,
      fuelPriceUsed: result.fuelPrice,
      estimatedLiters: result.requiredLiters,
      tollCost: result.tollCost,
      fuelCost: result.fuelCost,
      totalCost: result.totalCost,
      roundTrip: false,
      passengers: result.passengers,
      createdAt: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" keyboardShouldPersistTaps="handled">
      <View className="px-6 pt-6 pb-10">
        
        {!result ? (
          <>
            <View className="mb-6">
              <Text className="text-slate-500 mb-1">Veículo Selecionado</Text>
              <Text className="text-slate-800 font-semibold">{defaultVehicle?.nickname || 'Nenhum veículo'}</Text>
              <Text className="text-xs text-slate-400">Consumo médio base: {defaultVehicle?.manualAvgConsumption} km/l</Text>
            </View>

            <Controller
              control={control}
              name="origin"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Origem"
                  placeholder="Ex: São Paulo, SP"
                  value={value}
                  onChangeText={onChange}
                  error={errors.origin?.message}
                  leftIcon={<MapPin size={20} color="#94A3B8" />}
                />
              )}
            />

            <Controller
              control={control}
              name="destination"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Destino"
                  placeholder="Ex: Campinas, SP"
                  value={value}
                  onChangeText={onChange}
                  error={errors.destination?.message}
                  leftIcon={<MapPin size={20} color="#94A3B8" />}
                />
              )}
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="distanceKm"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Distância (km)"
                      placeholder="Ex: 95.5"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      error={errors.distanceKm?.message}
                      leftIcon={<Route size={20} color="#94A3B8" />}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="passengers"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Pessoas"
                      placeholder="1"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      error={errors.passengers?.message}
                      leftIcon={<Users size={20} color="#94A3B8" />}
                    />
                  )}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="fuelPrice"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Preço Combustível"
                      placeholder="Ex: 5.79"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      error={errors.fuelPrice?.message}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="tollCost"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Pedágios Totais"
                      placeholder="Ex: 24.50"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      error={errors.tollCost?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Button
              label="Calcular Custo da Viagem"
              onPress={handleSubmit(onSubmit)}
              className="mt-4"
            />
          </>
        ) : (
          <View>
            <Card className="mb-6 bg-accent border-0 p-6">
              <Text className="text-white/80 font-medium mb-1">Custo Estimado Total</Text>
              <Text className="text-white text-4xl font-bold mb-4">
                {formatCurrency(result.totalCost)}
              </Text>
              
              <View className="flex-row justify-between pt-4 border-t border-white/20">
                <View>
                  <Text className="text-white/80 text-xs">Por passageiro</Text>
                  <Text className="text-white font-semibold">{formatCurrency(result.totalCost / result.passengers)}</Text>
                </View>
                <View>
                  <Text className="text-white/80 text-xs text-right">Litragem</Text>
                  <Text className="text-white font-semibold text-right">{result.requiredLiters.toFixed(1)} L</Text>
                </View>
              </View>
            </Card>

            <Text className="text-lg font-bold text-slate-800 dark:text-white mb-4">Resumo da Rota</Text>
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm mb-6">
              <View className="flex-row justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                <Text className="text-slate-500">Combustível</Text>
                <Text className="font-medium text-slate-800 dark:text-white">{formatCurrency(result.fuelCost)}</Text>
              </View>
              <View className="flex-row justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                <Text className="text-slate-500">Pedágio</Text>
                <Text className="font-medium text-slate-800 dark:text-white">{formatCurrency(result.tollCost)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-500">Distância</Text>
                <Text className="font-medium text-slate-800 dark:text-white">{result.distanceKm} km</Text>
              </View>
            </View>

            <Button
              label="Salvar Viagem"
              onPress={handleSaveTrip}
              className="mb-4"
            />
            <Button
              label="Recalcular"
              variant="ghost"
              onPress={() => setResult(null)}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
