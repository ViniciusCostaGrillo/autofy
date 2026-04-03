import React, { useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Users, Route, Fuel, DollarSign, Navigation } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useTrips } from '@/hooks/useTrips';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  calculateRequiredLiters,
  calculateFuelCost,
  calculateTotalTripCost,
  formatCurrency,
} from '@/utils/calculations';

const tripSchema = z.object({
  origin: z.string().min(2, 'Origem obrigatoria'),
  destination: z.string().min(2, 'Destino obrigatorio'),
  distanceKm: z
    .string()
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(z.number().positive('Distancia invalida')),
  passengers: z.string().optional().transform((value) => (value ? Number(value) : 1)),
  fuelPrice: z
    .string()
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(z.number().positive('Preco invalido')),
  tollCost: z.string().optional().transform((value) => (value ? Number(value.replace(',', '.')) : 0)),
});

export default function NewTripModal() {
  const insets = useSafeAreaInsets();
  const { vehicles } = useVehicles();
  const { addTrip } = useTrips();
  const defaultVehicle = vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0];
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      origin: '',
      destination: '',
      distanceKm: '',
      passengers: '1',
      fuelPrice: '',
      tollCost: '0',
    },
  });

  const onSubmit = (data: any) => {
    if (!defaultVehicle) {
      setSubmitError('Cadastre um veiculo antes de planejar uma viagem.');
      return;
    }

    setSubmitError('');
    const avgConsumption = defaultVehicle.manualAvgConsumption;
    const requiredLiters = calculateRequiredLiters(data.distanceKm, avgConsumption);
    const fuelCost = calculateFuelCost(requiredLiters, data.fuelPrice);
    const totalCost = calculateTotalTripCost(fuelCost, data.tollCost);
    setResult({ ...data, avgConsumption, requiredLiters, fuelCost, totalCost });
  };

  const handleSaveTrip = async () => {
    if (!result || !defaultVehicle) return;

    setSaving(true);
    setSubmitError('');

    const saveResult = await addTrip({
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
    });

    setSaving(false);

    if (saveResult.error) {
      setSubmitError('Nao foi possivel salvar a viagem. Tente novamente.');
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
        {!result ? (
          <>
            <View className="mb-6 p-4 bg-surface rounded-3xl border border-surfaceLight">
              <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">
                Veiculo selecionado
              </Text>
              <Text className="text-textMain font-black text-lg tracking-tight">
                {defaultVehicle?.nickname || 'Nenhum veiculo'}
              </Text>
              <Text className="text-xs text-textMuted font-medium mt-0.5">
                Consumo base: {defaultVehicle?.manualAvgConsumption} km/l
              </Text>
            </View>

            {submitError ? <Text className="text-danger font-bold mb-4">{submitError}</Text> : null}

            <Controller
              control={control}
              name="origin"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Origem"
                  placeholder="Ex: Cascavel, PR"
                  value={value}
                  onChangeText={onChange}
                  error={errors.origin?.message}
                  leftIcon={<Navigation size={20} color="#B3B3B3" />}
                />
              )}
            />
            <Controller
              control={control}
              name="destination"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Destino"
                  placeholder="Ex: Foz do Iguacu, PR"
                  value={value}
                  onChangeText={onChange}
                  error={errors.destination?.message}
                  leftIcon={<MapPin size={20} color="#1DB954" />}
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
                      label="Distancia (km)"
                      placeholder="150"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.distanceKm?.message}
                      leftIcon={<Route size={20} color="#B3B3B3" />}
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
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.passengers?.message}
                      leftIcon={<Users size={20} color="#B3B3B3" />}
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
                      label="Preco combustivel"
                      placeholder="5.79"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.fuelPrice?.message}
                      leftIcon={<Fuel size={20} color="#B3B3B3" />}
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
                      label="Pedagios"
                      placeholder="24.50"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.tollCost?.message}
                      leftIcon={<DollarSign size={20} color="#B3B3B3" />}
                    />
                  )}
                />
              </View>
            </View>

            <Button label="Calcular custo" onPress={handleSubmit(onSubmit)} className="mt-2" />
          </>
        ) : (
          <View>
            <View className="bg-secondary rounded-3xl p-6 mb-6 border-b-4 border-[#1a4ba3]">
              <Text className="text-white/70 font-bold text-xs uppercase tracking-widest mb-1">
                Custo total estimado
              </Text>
              <Text className="text-white text-5xl font-black tracking-tighter mb-5">
                {formatCurrency(result.totalCost)}
              </Text>
              <View className="flex-row justify-between pt-4 border-t border-white/20">
                <View>
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    Por passageiro
                  </Text>
                  <Text className="text-white font-black text-xl mt-1">
                    {formatCurrency(result.totalCost / result.passengers)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    Combustivel
                  </Text>
                  <Text className="text-white font-black text-xl mt-1">
                    {result.requiredLiters.toFixed(2)} L
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-textMain font-black text-xl tracking-tight mb-4">Resumo da rota</Text>
            <View className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-6">
              {[
                { label: 'Distancia', value: `${result.distanceKm.toFixed(1)} km` },
                { label: 'Combustivel', value: formatCurrency(result.fuelCost) },
                { label: 'Pedagio', value: formatCurrency(result.tollCost) },
              ].map((item, index, items) => (
                <View
                  key={item.label}
                  className={`flex-row justify-between py-3 ${
                    index < items.length - 1 ? 'border-b border-surfaceLight' : ''
                  }`}
                >
                  <Text className="text-textMuted font-bold">{item.label}</Text>
                  <Text className="font-black text-textMain">{item.value}</Text>
                </View>
              ))}
            </View>

            {submitError ? <Text className="text-danger font-bold mb-4">{submitError}</Text> : null}
            <Button label="Salvar viagem" onPress={handleSaveTrip} isLoading={saving} className="mb-4" />
            <Button
              label="Recalcular"
              variant="ghost"
              onPress={() => {
                setSubmitError('');
                setResult(null);
              }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
