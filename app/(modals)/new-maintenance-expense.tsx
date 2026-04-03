import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, CircleDollarSign, Wrench } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useVehicles } from '@/hooks/useVehicles';
import { useMaintenanceExpenses } from '@/hooks/useMaintenanceExpenses';
import { MaintenanceCategory } from '@/types/models';
import { getMaintenanceCategoryLabels, usePreferences } from '@/lib/PreferencesContext';

const schema = z.object({
  title: z.string().min(2, 'Descricao obrigatoria'),
  amount: z.string().transform((value) => Number(value.replace(',', '.'))).pipe(z.number().positive('Valor invalido')),
  date: z.string().min(8, 'Data obrigatoria'),
  recurrenceMonths: z.string().optional().transform((value) => (value ? Number(value) : undefined)),
  notes: z.string().optional(),
});

const categories: MaintenanceCategory[] = ['oil_change', 'tires', 'insurance', 'parts', 'service', 'other'];

export default function NewMaintenanceExpenseModal() {
  const insets = useSafeAreaInsets();
  const { vehicles } = useVehicles();
  const { addExpense } = useMaintenanceExpenses();
  const { t } = usePreferences();
  const categoryLabels = getMaintenanceCategoryLabels(t);
  const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory>('service');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const defaultVehicle = useMemo(() => vehicles.find((item) => item.isDefault) || vehicles[0], [vehicles]);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      recurrenceMonths: '12',
      notes: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!defaultVehicle) {
      setSubmitError(t('maintenance.noVehicle'));
      return;
    }

    setSaving(true);
    setSubmitError('');

    const recurrenceMonths = isRecurring ? Math.max(data.recurrenceMonths || 1, 1) : undefined;
    const monthlyAmount = isRecurring && recurrenceMonths ? data.amount / recurrenceMonths : data.amount;

    const result = await addExpense({
      vehicleId: defaultVehicle.id,
      category: selectedCategory,
      title: data.title,
      amount: data.amount,
      date: data.date,
      notes: data.notes || undefined,
      isRecurring,
      recurrenceMonths,
      monthlyAmount,
    });

    setSaving(false);

    if (result.error) {
      setSubmitError('Nao foi possivel salvar o gasto de manutencao.');
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
          <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veículo selecionado</Text>
          <Text className="text-textMain font-black text-lg tracking-tight">
            {defaultVehicle?.nickname || 'Nenhum veiculo'}
          </Text>
        </View>

        <Text className="text-textMuted font-bold text-sm tracking-wide mb-3 ml-2 uppercase">
          {t('maintenance.category')}
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2.5 rounded-full border-2 ${
                selectedCategory === category ? 'bg-primary border-primary' : 'bg-surface border-surfaceLight'
              }`}
            >
              <Text className={`font-black text-sm ${selectedCategory === category ? 'text-background' : 'text-textMuted'}`}>
                {categoryLabels[category]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('maintenance.titleField')}
              placeholder="Ex: Seguro anual, troca de pneus"
              value={value}
              onChangeText={onChange}
              error={errors.title?.message as string | undefined}
              leftIcon={<Wrench size={18} color="#1DB954" />}
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('maintenance.amount')}
              placeholder="1200.00"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              error={errors.amount?.message as string | undefined}
              leftIcon={<CircleDollarSign size={18} color="#B3B3B3" />}
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('maintenance.date')}
              placeholder="2026-04-03"
              value={value}
              onChangeText={onChange}
              error={errors.date?.message as string | undefined}
              leftIcon={<CalendarDays size={18} color="#B3B3B3" />}
            />
          )}
        />

        <TouchableOpacity
          onPress={() => setIsRecurring((current) => !current)}
          className={`flex-row items-center p-4 rounded-2xl border-2 mb-4 ${
            isRecurring ? 'border-primary bg-primary/10' : 'border-surfaceLight bg-surface'
          }`}
        >
          <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${isRecurring ? 'bg-primary border-primary' : 'border-surfaceLight'}`}>
            {isRecurring ? <Text className="text-background text-xs font-black">OK</Text> : null}
          </View>
          <View className="flex-1">
            <Text className={`font-bold ${isRecurring ? 'text-primary' : 'text-textMuted'}`}>
              {t('maintenance.recurring')}
            </Text>
            <Text className="text-textMuted text-xs mt-1">{t('maintenance.recurringHint')}</Text>
          </View>
        </TouchableOpacity>

        {isRecurring ? (
          <Controller
            control={control}
            name="recurrenceMonths"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('maintenance.recurringMonths')}
                placeholder="12"
                keyboardType="number-pad"
                value={`${value ?? ''}`}
                onChangeText={onChange}
                error={errors.recurrenceMonths?.message as string | undefined}
              />
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input
              label={t('maintenance.notes')}
              placeholder="Detalhes, oficina, observacoes"
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        {submitError ? <Text className="text-danger font-bold mb-4">{submitError}</Text> : null}
        <Button label={t('maintenance.saveExpense')} onPress={handleSubmit(onSubmit)} isLoading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
