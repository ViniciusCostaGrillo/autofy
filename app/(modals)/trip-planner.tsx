import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
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
import { estimateRoute } from '@/lib/routeEstimate';
import { FuelType, RouteEstimate } from '@/types/models';
import { usePreferences } from '@/lib/PreferencesContext';
import { searchRoutePlaces } from '@/lib/routePlaces';
import { useAuth } from '@/lib/AuthContext';
import { logAppError } from '@/lib/errorLogger';
import {
  calculateRequiredLiters,
  calculateFuelCost,
  calculateTotalTripCost,
  formatCurrency,
} from '@/utils/calculations';

const tripSchema = z.object({
  origin: z.string().min(2, 'Origem obrigatória'),
  destination: z.string().min(2, 'Destino obrigatório'),
  distanceKm: z
    .string()
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(z.number().positive('Distância inválida')),
  passengers: z.string().optional().transform((value) => (value ? Number(value) : 1)),
  fuelPrice: z
    .string()
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(z.number().positive('Preço inválido')),
  tollCost: z.string().optional().transform((value) => (value ? Number(value.replace(',', '.')) : 0)),
});

export default function NewTripModal() {
  const insets = useSafeAreaInsets();
  const { vehicles } = useVehicles();
  const { addTrip } = useTrips();
  const { preferences, t } = usePreferences();
  const { session, isLocalAdmin } = useAuth();
  const defaultVehicle = vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0];
  const canUseAutomaticRouteServices = Boolean(session?.access_token) && !isLocalAdmin;
  const [pricingFuelType, setPricingFuelType] = useState<Extract<FuelType, 'gasoline' | 'ethanol' | 'diesel'>>(
    defaultPricingFuelType(defaultVehicle?.fuelType)
  );
  const [result, setResult] = useState<any>(null);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [focusedField, setFocusedField] = useState<'origin' | 'destination' | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{ label: string }>>([]);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    watch,
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

  const watchedOrigin = watch('origin');
  const watchedDestination = watch('destination');

  useEffect(() => {
    if (!focusedField) {
      setPlaceSuggestions([]);
      return;
    }

    if (!canUseAutomaticRouteServices) {
      setPlaceSuggestions([]);
      return;
    }

    const value = getValues(focusedField)?.trim();
    if (!value || value.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchRoutePlaces(value, preferences.countryCode)
        .then((results) => {
          setPlaceSuggestions(results);
        })
        .catch((error) => {
          logAppError('tripPlanner.searchRoutePlaces', error, {
            field: focusedField,
            countryCode: preferences.countryCode,
          }).catch(() => undefined);
          setPlaceSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    canUseAutomaticRouteServices,
    focusedField,
    getValues,
    preferences.countryCode,
    watchedDestination,
    watchedOrigin,
  ]);

  const handleAutoEstimate = async () => {
    if (!defaultVehicle) {
      setSubmitError('Cadastre um veículo antes de planejar uma viagem.');
      return;
    }

    if (!canUseAutomaticRouteServices) {
      setSubmitError('O cálculo automático exige login por email. No modo admin de teste, informe a distância manualmente.');
      return;
    }

    const origin = getValues('origin')?.trim();
    const destination = getValues('destination')?.trim();

    if (!origin || !destination) {
      setSubmitError('Preencha origem e destino antes de buscar a rota.');
      return;
    }

    try {
      setEstimating(true);
      setSubmitError('');

      const nextEstimate = await estimateRoute({
        origin,
        destination,
        avgConsumptionKmL: defaultVehicle.manualAvgConsumption,
        fuelType: defaultVehicle.fuelType,
        pricingFuelType,
        countryCode: preferences.countryCode,
      });

      setRouteEstimate(nextEstimate);
      setValue('distanceKm', nextEstimate.distanceKm.toFixed(1), { shouldValidate: true });

      if (nextEstimate.suggestedFuelPrice) {
        setValue('fuelPrice', nextEstimate.suggestedFuelPrice.toFixed(2), { shouldValidate: true });
      }
    } catch (error) {
      await logAppError('tripPlanner.handleAutoEstimate', error, {
        origin,
        destination,
        countryCode: preferences.countryCode,
        isLocalAdmin,
      });
      const message =
        error instanceof Error ? error.message : 'Não foi possível buscar a distância automática.';
      setSubmitError(message);
    } finally {
      setEstimating(false);
    }
  };

  const onSubmit = (data: any) => {
    if (!defaultVehicle) {
      setSubmitError('Cadastre um veículo antes de planejar uma viagem.');
      return;
    }

    setSubmitError('');
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
      durationMinutes: routeEstimate?.durationMinutes,
    });
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
                Veículo selecionado
              </Text>
              <Text className="text-textMain font-black text-lg tracking-tight">
                {defaultVehicle?.nickname || 'Nenhum veículo'}
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
                  onFocus={() => setFocusedField('origin')}
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
                  onFocus={() => setFocusedField('destination')}
                  error={errors.destination?.message}
                  leftIcon={<MapPin size={20} color="#1DB954" />}
                />
              )}
            />

            {focusedField && placeSuggestions.length > 0 ? (
              <View className="mb-4 mt-[-10px] rounded-3xl border border-surfaceLight bg-surface overflow-hidden">
                {placeSuggestions.map((suggestion) => (
                  <Pressable
                    key={`${focusedField}-${suggestion.label}`}
                    onPress={() => {
                      setValue(focusedField, suggestion.label, { shouldValidate: true });
                      setPlaceSuggestions([]);
                      setFocusedField(null);
                    }}
                    className="px-5 py-4 border-b border-surfaceLight"
                  >
                    <Text className="text-textMain font-bold">{suggestion.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!canUseAutomaticRouteServices ? (
              <Text className="text-textMuted text-xs mb-4 px-1">
                Busca automática de rota disponível apenas para contas autenticadas por email.
              </Text>
            ) : null}

            {defaultVehicle?.fuelType === 'flex' ? (
              <View className="mb-4">
                <Text className="text-textMuted font-bold text-sm tracking-widest mb-3 ml-2 uppercase">
                  Combustível para preço médio
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { key: 'gasoline', label: t('trip.autoFuelGasoline') },
                    { key: 'ethanol', label: t('trip.autoFuelEthanol') },
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      label={label}
                      variant={pricingFuelType === key ? 'primary' : 'ghost'}
                      onPress={() => setPricingFuelType(key as Extract<FuelType, 'gasoline' | 'ethanol'>)}
                      className="flex-1"
                    />
                  ))}
                </View>
                <Text className="text-textMuted text-xs mt-3 px-1">
                  {t('trip.autoFuelFlexHint')}
                </Text>
              </View>
            ) : defaultVehicle?.fuelType === 'diesel' ? (
              <Text className="text-textMuted text-xs mb-4 px-1">
                {t('trip.autoFuelDieselHint')}
              </Text>
            ) : defaultVehicle?.fuelType === 'ethanol' ? (
              <Text className="text-textMuted text-xs mb-4 px-1">
                {t('trip.autoFuelEthanolHint')}
              </Text>
            ) : defaultVehicle?.fuelType === 'gasoline' || defaultVehicle?.fuelType === 'hybrid' ? (
              <Text className="text-textMuted text-xs mb-4 px-1">
                {t('trip.autoFuelGasolineHint')}
              </Text>
            ) : null}

            <Button
              label={
                !canUseAutomaticRouteServices
                  ? 'Faça login por email para usar'
                  : estimating
                    ? 'Buscando rota...'
                    : 'Buscar distância e preço médio'
              }
              onPress={handleAutoEstimate}
              isLoading={estimating}
              disabled={!canUseAutomaticRouteServices}
              className="mb-4"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="distanceKm"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Distância (km)"
                      placeholder="150"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.distanceKm?.message}
                      leftIcon={<Route size={20} color="#B3B3B3" />}
                    />
                  )}
                />
                {routeEstimate?.distanceSource ? (
                  <Text className="text-textMuted text-xs mt-[-10px] mb-4 px-1">
                    Distância sugerida por {routeEstimate.distanceSource}.
                  </Text>
                ) : null}
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

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="fuelPrice"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Preço combustível"
                      placeholder="5.79"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.fuelPrice?.message}
                      leftIcon={<Fuel size={20} color="#B3B3B3" />}
                    />
                  )}
                />
                {routeEstimate?.suggestedFuelPrice ? (
                  <Text className="text-primary text-xs font-bold mt-[-10px] mb-4 px-1">
                    Sugestão {routeEstimate.fuelPriceSource}: {formatCurrency(routeEstimate.suggestedFuelPrice)}
                    {routeEstimate.fuelPriceCity && routeEstimate.fuelPriceState
                      ? ` em ${routeEstimate.fuelPriceCity}/${routeEstimate.fuelPriceState}`
                      : ''}
                    {routeEstimate.fuelPriceWeekLabel ? `, ref. ${routeEstimate.fuelPriceWeekLabel}` : ''}.
                  </Text>
                ) : (
                  <Text className="text-textMuted text-xs mt-[-10px] mb-4 px-1">
                    Preço editável. Se a API não encontrar a média local, informe manualmente.
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="tollCost"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Pedágios"
                      placeholder="24.50"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={errors.tollCost?.message}
                      leftIcon={<DollarSign size={20} color="#B3B3B3" />}
                    />
                  )}
                />
                <Text className="text-textMuted text-xs mt-[-10px] mb-4 px-1">
                  Pedágio continua manual por enquanto.
                </Text>
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
                    Combustível
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
                { label: 'Distância', value: `${result.distanceKm.toFixed(1)} km` },
                {
                  label: 'Duração',
                  value: result.durationMinutes ? `${result.durationMinutes} min` : 'Não informada',
                },
                { label: 'Combustível', value: formatCurrency(result.fuelCost) },
                { label: 'Pedágio', value: formatCurrency(result.tollCost) },
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

function defaultPricingFuelType(fuelType?: FuelType): Extract<FuelType, 'gasoline' | 'ethanol' | 'diesel'> {
  if (fuelType === 'diesel') return 'diesel';
  if (fuelType === 'ethanol') return 'ethanol';
  return 'gasoline';
}
