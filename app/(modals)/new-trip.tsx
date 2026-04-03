import React, { useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Users, Fuel, Navigation, Clock3, Ticket, Route as RouteIcon } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useTrips } from '@/hooks/useTrips';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { estimateRoute } from '@/lib/routeEstimate';
import { RouteEstimate } from '@/types/models';
import { formatCurrency } from '@/utils/calculations';

const tripSchema = z.object({
  origin: z.string().min(2, 'Origem obrigatoria'),
  destination: z.string().min(2, 'Destino obrigatorio'),
  passengers: z.string().optional().transform((value) => (value ? Number(value) : 1)),
  fuelPrice: z
    .string()
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(z.number().positive('Preco invalido')),
});

interface TripPreview extends RouteEstimate {
  origin: string;
  destination: string;
  passengers: number;
  fuelPrice: number;
  avgConsumptionKmL: number;
}

export default function NewTripModal() {
  const insets = useSafeAreaInsets();
  const { vehicles } = useVehicles();
  const { addTrip } = useTrips();
  const defaultVehicle = vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0];
  const [result, setResult] = useState<TripPreview | null>(null);
  const [calculating, setCalculating] = useState(false);
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
      passengers: '1',
      fuelPrice: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!defaultVehicle) {
      setSubmitError('Cadastre um veiculo antes de planejar uma viagem.');
      return;
    }

    setCalculating(true);
    setSubmitError('');

    try {
      const estimate = await estimateRoute({
        origin: data.origin,
        destination: data.destination,
        fuelPrice: data.fuelPrice,
        avgConsumptionKmL: defaultVehicle.manualAvgConsumption,
        useTollTag: defaultVehicle.hasTollTag,
        fuelType: defaultVehicle.fuelType,
      });

      setResult({
        ...estimate,
        origin: data.origin,
        destination: data.destination,
        passengers: data.passengers,
        fuelPrice: data.fuelPrice,
        avgConsumptionKmL: defaultVehicle.manualAvgConsumption,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel calcular a rota.';
      setSubmitError(message);
    } finally {
      setCalculating(false);
    }
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
      durationMinutes: result.durationMinutes,
      avgConsumptionUsed: result.avgConsumptionKmL,
      fuelPriceUsed: result.fuelPrice,
      estimatedLiters: result.fuelLiters,
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
              <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veiculo selecionado</Text>
              <Text className="text-textMain font-black text-lg tracking-tight">{defaultVehicle?.nickname || 'Nenhum veiculo'}</Text>
              <Text className="text-xs text-textMuted font-medium mt-0.5">Consumo base: {defaultVehicle?.manualAvgConsumption} km/l</Text>
              <Text className="text-xs text-textMuted font-medium mt-0.5">Tag de pedagio: {defaultVehicle?.hasTollTag ? 'Sim (Sem Parar)' : 'Nao'}</Text>
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

            <Button label="Calcular rota" onPress={handleSubmit(onSubmit)} isLoading={calculating} className="mt-2" />
          </>
        ) : (
          <View>
            <View className="bg-secondary rounded-3xl p-6 mb-6 border-b-4 border-[#1a4ba3]">
              <Text className="text-white/70 font-bold text-xs uppercase tracking-widest mb-1">Custo total estimado</Text>
              <Text className="text-white text-5xl font-black tracking-tighter mb-5">{formatCurrency(result.totalCost)}</Text>
              <View className="flex-row justify-between pt-4 border-t border-white/20">
                <View>
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Por passageiro</Text>
                  <Text className="text-white font-black text-xl mt-1">{formatCurrency(result.totalCost / result.passengers)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Combustivel</Text>
                  <Text className="text-white font-black text-xl mt-1">{result.fuelLiters.toFixed(2)} L</Text>
                </View>
              </View>
            </View>

            <Text className="text-textMain font-black text-xl tracking-tight mb-4">Resumo da rota</Text>
            <View className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-6">
              {[
                { label: 'Distancia', value: `${result.distanceKm.toFixed(1)} km`, icon: <RouteIcon size={16} color="#B3B3B3" /> },
                { label: 'Duracao', value: `${result.durationMinutes} min`, icon: <Clock3 size={16} color="#B3B3B3" /> },
                { label: 'Combustivel', value: formatCurrency(result.fuelCost), icon: <Fuel size={16} color="#B3B3B3" /> },
                { label: 'Pedagio', value: formatCurrency(result.tollCost), icon: <Ticket size={16} color="#B3B3B3" /> },
              ].map((item, index, items) => (
                <View key={item.label} className={`flex-row justify-between items-center py-3 ${index < items.length - 1 ? 'border-b border-surfaceLight' : ''}`}>
                  <View className="flex-row items-center">
                    <View className="mr-2">{item.icon}</View>
                    <Text className="text-textMuted font-bold">{item.label}</Text>
                  </View>
                  <Text className="font-black text-textMain">{item.value}</Text>
                </View>
              ))}
            </View>

            <View className="bg-surface rounded-3xl p-4 border border-surfaceLight mb-6">
              <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Tag de pedagio aplicada</Text>
              <Text className="text-textMain font-bold">{result.usedTollPass ? 'Sem Parar' : 'Sem tag'}</Text>
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
