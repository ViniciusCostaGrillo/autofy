import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Droplets, Gauge, CalendarDays } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useOilChanges } from '@/hooks/useOilChanges';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  oilName: z.string().min(2, 'Oleo obrigatorio'),
  odometer: z.string().transform((value) => Number(value)).pipe(z.number().min(0)),
  changedAt: z.string().min(8, 'Data obrigatoria'),
  nextChangeDate: z.string().optional(),
  nextChangeOdometer: z.string().optional().transform((value) => (value ? Number(value) : undefined)),
  notes: z.string().optional(),
});

export default function NewOilChangeModal() {
  const insets = useSafeAreaInsets();
  const { vehicles } = useVehicles();
  const { addOilChange } = useOilChanges();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const defaultVehicle = useMemo(() => vehicles.find((item) => item.isDefault) || vehicles[0], [vehicles]);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      oilName: '',
      odometer: defaultVehicle?.currentOdometer?.toString() || '0',
      changedAt: new Date().toISOString().slice(0, 10),
      nextChangeDate: '',
      nextChangeOdometer: '',
      notes: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!defaultVehicle) {
      setSubmitError('Cadastre um veiculo antes de registrar a troca de oleo.');
      return;
    }

    setSaving(true);
    setSubmitError('');

    const result = await addOilChange({
      vehicleId: defaultVehicle.id,
      changedAt: data.changedAt,
      odometer: data.odometer,
      oilName: data.oilName,
      nextChangeDate: data.nextChangeDate || undefined,
      nextChangeOdometer: data.nextChangeOdometer,
      notes: data.notes || undefined,
    });

    setSaving(false);

    if (result.error) {
      setSubmitError('Nao foi possivel salvar a troca de oleo.');
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
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 p-4 bg-surface rounded-3xl border border-surfaceLight">
          <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veiculo selecionado</Text>
          <Text className="text-textMain font-black text-lg tracking-tight">
            {defaultVehicle?.nickname || 'Nenhum veiculo'}
          </Text>
        </View>

        <Controller
          control={control}
          name="oilName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Oleo utilizado"
              placeholder="Ex: 5W30 Sintetico"
              value={value}
              onChangeText={onChange}
              error={errors.oilName?.message as string | undefined}
              leftIcon={<Droplets size={18} color="#1DB954" />}
            />
          )}
        />
        <Controller
          control={control}
          name="odometer"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Odometro na troca"
              placeholder="45000"
              keyboardType="number-pad"
              value={value}
              onChangeText={onChange}
              error={errors.odometer?.message as string | undefined}
              leftIcon={<Gauge size={18} color="#B3B3B3" />}
            />
          )}
        />
        <Controller
          control={control}
          name="changedAt"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Data da troca"
              placeholder="2026-04-03"
              value={value}
              onChangeText={onChange}
              error={errors.changedAt?.message as string | undefined}
              leftIcon={<CalendarDays size={18} color="#B3B3B3" />}
            />
          )}
        />
        <Controller
          control={control}
          name="nextChangeDate"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Proxima troca por data"
              placeholder="2026-10-03"
              value={value}
              onChangeText={onChange}
              error={errors.nextChangeDate?.message as string | undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="nextChangeOdometer"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Proxima troca por km"
              placeholder="55000"
              keyboardType="number-pad"
              value={`${value ?? ''}`}
              onChangeText={onChange}
              error={errors.nextChangeOdometer?.message as string | undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Observacoes"
              placeholder="Filtro trocado, marca do oleo, etc."
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        {submitError ? <Text className="text-danger font-bold mb-4">{submitError}</Text> : null}
        <Button label="Salvar troca de oleo" onPress={handleSubmit(onSubmit)} isLoading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
