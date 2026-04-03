import React, { useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gauge, Fuel, DollarSign, MapPin } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useRefuels } from '@/hooks/useRefuels';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const refuelSchema = z.object({
  odometer: z.string().transform((value) => Number(value)).pipe(z.number().positive('Odometro invalido')),
  liters: z.string().transform((value) => Number(value.replace(',', '.'))).pipe(z.number().positive('Litros invalidos')),
  totalPrice: z.string().transform((value) => Number(value.replace(',', '.'))).pipe(z.number().positive('Preco invalido')),
  gasStation: z.string().optional(),
});

export default function NewRefuelModal() {
  const insets = useSafeAreaInsets();
  const { vehicles, updateVehicle } = useVehicles();
  const { addRefuel } = useRefuels();
  const defaultVehicle = vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0];
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
    if (!defaultVehicle) {
      setSubmitError('Cadastre um veiculo antes de registrar abastecimentos.');
      return;
    }

    setSaving(true);
    setSubmitError('');

    const pricePerLiter = data.totalPrice / data.liters;
    const refuelResult = await addRefuel({
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

    if (refuelResult.error) {
      setSaving(false);
      setSubmitError('Nao foi possivel salvar o abastecimento. Tente novamente.');
      return;
    }

    if (data.odometer > defaultVehicle.currentOdometer) {
      const updateResult = await updateVehicle(defaultVehicle.id, { currentOdometer: data.odometer });

      if (updateResult.error) {
        setSaving(false);
        setSubmitError('Abastecimento salvo, mas nao foi possivel atualizar o odometro.');
        return;
      }
    }

    setSaving(false);
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
        {defaultVehicle ? (
          <View className="mb-6 p-4 bg-surface rounded-3xl border border-surfaceLight">
            <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veiculo selecionado</Text>
            <Text className="text-textMain font-black text-lg tracking-tight">{defaultVehicle.nickname}</Text>
            <Text className="text-xs text-textMuted font-medium mt-0.5">Odometro atual: {defaultVehicle.currentOdometer.toLocaleString()} km</Text>
          </View>
        ) : null}

        {submitError ? <Text className="text-danger font-bold mb-4">{submitError}</Text> : null}

        <Controller control={control} name="odometer" render={({ field: { onChange, value } }) => (
          <Input
            label="Odometro (km)"
            placeholder="Ex: 45200"
            keyboardType="number-pad"
            value={value}
            onChangeText={onChange}
            error={errors.odometer?.message}
            leftIcon={<Gauge size={20} color="#B3B3B3" />}
          />
        )} />

        <View className="flex-row gap-4 mb-2">
          <View className="flex-1">
            <Controller control={control} name="liters" render={({ field: { onChange, value } }) => (
              <Input
                label="Litros"
                placeholder="40.5"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                error={errors.liters?.message}
                leftIcon={<Fuel size={20} color="#1DB954" />}
              />
            )} />
          </View>
          <View className="flex-1">
            <Controller control={control} name="totalPrice" render={({ field: { onChange, value } }) => (
              <Input
                label="Valor (R$)"
                placeholder="220.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                error={errors.totalPrice?.message}
                leftIcon={<DollarSign size={20} color="#B3B3B3" />}
              />
            )} />
          </View>
        </View>

        <Controller control={control} name="gasStation" render={({ field: { onChange, value } }) => (
          <Input
            label="Posto (opcional)"
            placeholder="Ex: Posto BR Ipiranga"
            value={value}
            onChangeText={onChange}
            error={errors.gasStation?.message}
            leftIcon={<MapPin size={20} color="#B3B3B3" />}
          />
        )} />

        <Button label="Salvar abastecimento" onPress={handleSubmit(onSubmit)} isLoading={saving} className="mt-6" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
