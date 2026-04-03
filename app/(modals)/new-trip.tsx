import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { MapPin, Users, Route, Fuel, DollarSign, Navigation } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useTrips } from '@/hooks/useTrips';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { calculateRequiredLiters, calculateFuelCost, calculateTotalTripCost, formatCurrency } from '@/utils/calculations';

const tripSchema = z.object({
  origin: z.string().min(2, 'Origem é obrigatória'),
  destination: z.string().min(2, 'Destino é obrigatório'),
  distanceKm: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Distância inválida')),
  passengers: z.string().optional().transform(v => v ? Number(v) : 1),
  fuelPrice: z.string().transform(v => Number(v.replace(',', '.'))).pipe(z.number().positive('Preço inválido')),
  tollCost: z.string().optional().transform(v => v ? Number(v.replace(',', '.')) : 0),
});

export default function NewTripModal() {
  const { vehicles } = useVehicles();
  const { addTrip } = useTrips();
  const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: { origin: '', destination: '', distanceKm: '', passengers: '1', fuelPrice: '', tollCost: '0' },
  });

  const onSubmit = (data: any) => {
    if (!defaultVehicle) return;
    const avgConsumption = defaultVehicle.manualAvgConsumption;
    const requiredLiters = calculateRequiredLiters(data.distanceKm, avgConsumption);
    const fuelCost = calculateFuelCost(requiredLiters, data.fuelPrice);
    const totalCost = calculateTotalTripCost(fuelCost, data.tollCost);
    setResult({ ...data, avgConsumption, requiredLiters, fuelCost, totalCost });
  };

  const handleSaveTrip = async () => {
    if (!result || !defaultVehicle) return;
    setSaving(true);
    await addTrip({
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
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
      <View className="px-6 pt-6 pb-10">
        {!result ? (
          <>
            <View className="mb-6 p-4 bg-surface rounded-3xl border border-surfaceLight">
              <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veículo Selecionado</Text>
              <Text className="text-textMain font-black text-lg tracking-tight">{defaultVehicle?.nickname || 'Nenhum veículo'}</Text>
              <Text className="text-xs text-textMuted font-medium mt-0.5">Consumo base: {defaultVehicle?.manualAvgConsumption} km/l</Text>
            </View>

            <Controller control={control} name="origin"
              render={({ field: { onChange, value } }) => (
                <Input label="Origem" placeholder="Ex: São Paulo, SP" value={value} onChangeText={onChange}
                  error={errors.origin?.message} leftIcon={<Navigation size={20} color="#B3B3B3" />} />
              )}
            />
            <Controller control={control} name="destination"
              render={({ field: { onChange, value } }) => (
                <Input label="Destino" placeholder="Ex: Campinas, SP" value={value} onChangeText={onChange}
                  error={errors.destination?.message} leftIcon={<MapPin size={20} color="#1DB954" />} />
              )}
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Controller control={control} name="distanceKm"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Distância (km)" placeholder="95.5" keyboardType="numeric"
                      value={value} onChangeText={onChange} error={errors.distanceKm?.message}
                      leftIcon={<Route size={20} color="#B3B3B3" />} />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller control={control} name="passengers"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Pessoas" placeholder="1" keyboardType="numeric"
                      value={value} onChangeText={onChange} error={errors.passengers?.message}
                      leftIcon={<Users size={20} color="#B3B3B3" />} />
                  )}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Controller control={control} name="fuelPrice"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Preço Combustível" placeholder="5.79" keyboardType="numeric"
                      value={value} onChangeText={onChange} error={errors.fuelPrice?.message}
                      leftIcon={<Fuel size={20} color="#B3B3B3" />} />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller control={control} name="tollCost"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Pedágios" placeholder="24.50" keyboardType="numeric"
                      value={value} onChangeText={onChange} error={errors.tollCost?.message}
                      leftIcon={<DollarSign size={20} color="#B3B3B3" />} />
                  )}
                />
              </View>
            </View>

            <Button label="Calcular Custo" onPress={handleSubmit(onSubmit)} className="mt-2" />
          </>
        ) : (
          <View>
            <View className="bg-secondary rounded-3xl p-6 mb-6 border-b-4 border-[#1a4ba3]">
              <Text className="text-white/70 font-bold text-xs uppercase tracking-widest mb-1">Custo Total Estimado</Text>
              <Text className="text-white text-5xl font-black tracking-tighter mb-5">{formatCurrency(result.totalCost)}</Text>
              <View className="flex-row justify-between pt-4 border-t border-white/20">
                <View>
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Por passageiro</Text>
                  <Text className="text-white font-black text-xl mt-1">{formatCurrency(result.totalCost / result.passengers)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Combustível</Text>
                  <Text className="text-white font-black text-xl mt-1">{result.requiredLiters.toFixed(1)} L</Text>
                </View>
              </View>
            </View>

            <Text className="text-textMain font-black text-xl tracking-tight mb-4">Resumo da Rota</Text>
            <View className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-6">
              {[
                { label: 'Combustível', value: formatCurrency(result.fuelCost) },
                { label: 'Pedágio', value: formatCurrency(result.tollCost) },
                { label: 'Distância', value: `${result.distanceKm} km` },
              ].map((item, i, arr) => (
                <View key={item.label} className={`flex-row justify-between py-3 ${i < arr.length - 1 ? 'border-b border-surfaceLight' : ''}`}>
                  <Text className="text-textMuted font-bold">{item.label}</Text>
                  <Text className="font-black text-textMain">{item.value}</Text>
                </View>
              ))}
            </View>

            <Button label="Salvar Viagem" onPress={handleSaveTrip} isLoading={saving} className="mb-4" />
            <Button label="Recalcular" variant="ghost" onPress={() => setResult(null)} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
