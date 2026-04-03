import React, { useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, MapPin, Fuel, TrendingUp, LogOut, Wrench } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useRefuels } from '@/hooks/useRefuels';
import { useOilChanges } from '@/hooks/useOilChanges';
import { useMaintenanceExpenses } from '@/hooks/useMaintenanceExpenses';
import { useAuth } from '@/lib/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { usePreferences } from '@/lib/PreferencesContext';
import {
  formatConsumptionForPreferences,
  formatCurrencyForPreferences,
  formatDistanceForPreferences,
} from '@/lib/formatting';
import { getMaintenanceMonthlyAverage } from '@/lib/maintenance';
import { getUpcomingOilAlert } from '@/lib/oil';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const hasSkippedInitialFocusRefresh = useRef(false);
  const { vehicles, loading: vehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { refuels, loading: refuelsLoading, refetch: refetchRefuels } = useRefuels();
  const { oilChanges, refetch: refetchOilChanges } = useOilChanges();
  const { expenses, refetch: refetchMaintenanceExpenses } = useMaintenanceExpenses();
  const { signOut } = useAuth();
  const { preferences, t } = usePreferences();

  useFocusEffect(
    useCallback(() => {
      if (!hasSkippedInitialFocusRefresh.current) {
        hasSkippedInitialFocusRefresh.current = true;
        return;
      }

      Promise.allSettled([
        refetchVehicles(),
        refetchRefuels(),
        refetchOilChanges(),
        refetchMaintenanceExpenses(),
      ]).then((results) => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            return;
          }

          const source = ['vehicles', 'refuels', 'oil changes', 'maintenance expenses'][index];
          console.error(`Failed to refresh dashboard ${source}`, result.reason);
        });
      });
    }, [refetchMaintenanceExpenses, refetchOilChanges, refetchRefuels, refetchVehicles])
  );

  const defaultVehicle = vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0];
  const totalSpent = refuels.reduce((sum, refuel) => sum + refuel.totalPrice, 0);
  const monthlyMaintenanceCost = getMaintenanceMonthlyAverage(expenses, defaultVehicle?.id);

  const estimatedCostPerKm = (() => {
    if (!defaultVehicle || defaultVehicle.manualAvgConsumption === 0) return null;

    const lastRefuel = refuels[0];
    if (!lastRefuel) return null;

    return lastRefuel.pricePerLiter / defaultVehicle.manualAvgConsumption;
  })();

  const loading = vehiclesLoading || refuelsLoading;
  const oilAlert = getUpcomingOilAlert(oilChanges, defaultVehicle);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />

      <View
        className="px-6 pb-8 bg-surface rounded-b-[40px] border-b-2 border-surfaceLight"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-textMuted">Veiculo atual</Text>
          <TouchableOpacity onPress={signOut} className="bg-surfaceLight p-2 rounded-full" hitSlop={10}>
            <LogOut size={18} color="#B3B3B3" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-14 h-14 rounded-full bg-surfaceLight items-center justify-center mr-4">
              <Car size={24} color="#1DB954" />
            </View>
            <View className="flex-1">
              {loading ? (
                <ActivityIndicator color="#1DB954" />
              ) : (
                <>
                  <Text className="text-3xl font-black tracking-tighter text-textMain">
                    {defaultVehicle?.nickname || 'Adicione um carro'}
                  </Text>
                  {defaultVehicle ? (
                    <Text className="text-sm font-medium text-textMuted">
                      {defaultVehicle.brand} {defaultVehicle.model} • {defaultVehicle.year}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/vehicles')}
            className="bg-surfaceLight p-3 rounded-full border border-surfaceLight ml-3"
            hitSlop={10}
          >
            <Car size={20} color="#B3B3B3" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row gap-4 mb-6">
          <StatCard
            title="Consumo medio"
            value={defaultVehicle ? formatConsumptionForPreferences(defaultVehicle.manualAvgConsumption, preferences) : '--'}
            icon={<TrendingUp size={16} color="#1DB954" />}
          />
          <StatCard
            title="Gasto total"
            value={formatCurrencyForPreferences(totalSpent, preferences)}
            icon={<Fuel size={16} color="#E91429" />}
          />
        </View>

        <View className="mb-6">
          <StatCard
            title={t('maintenance.dashboardMonthly')}
            value={formatCurrencyForPreferences(monthlyMaintenanceCost, preferences)}
            subtitle={t('maintenance.last30DaysTotal')}
            icon={<Wrench size={16} color="#3B82F6" />}
          />
        </View>

        <View className="mb-6 bg-primary rounded-3xl p-5 border-b-4 border-[#14833b]">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-4">
              <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
                Estimativa de custo por km
              </Text>
              <Text className="text-white text-4xl font-black tracking-tighter">
                {estimatedCostPerKm ? formatCurrencyForPreferences(estimatedCostPerKm, preferences) : '--'}
              </Text>
              {!estimatedCostPerKm ? (
                <Text className="text-white/50 text-xs mt-1">Registre um abastecimento</Text>
              ) : null}
            </View>
            <View className="bg-black/15 p-4 rounded-2xl">
              <TrendingUp size={28} color="white" />
            </View>
          </View>
        </View>

        {oilAlert ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/maintenance')}
            className={`mb-6 rounded-3xl p-5 border-2 ${
              oilAlert.dueByDate || oilAlert.dueByKm ? 'bg-danger/10 border-danger' : 'bg-primary/10 border-primary'
            }`}
          >
            <Text className={`font-black text-lg ${oilAlert.dueByDate || oilAlert.dueByKm ? 'text-danger' : 'text-primary'}`}>
              {oilAlert.dueByDate || oilAlert.dueByKm ? t('maintenance.alertDue') : t('maintenance.alertSoon')}
            </Text>
            <Text className="text-textMuted mt-2">
              {oilAlert.oilChange.oilName}
              {oilAlert.remainingKm !== null
                ? ` • ${formatDistanceForPreferences(oilAlert.remainingKm, preferences)} restantes`
                : ''}
            </Text>
            {oilAlert.oilChange.nextChangeDate ? (
              <Text className="text-textMuted mt-1">
                {t('maintenance.nextByDate')}:{' '}
                {new Date(oilAlert.oilChange.nextChangeDate).toLocaleDateString('pt-BR')}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : null}

        <Text className="text-xl font-black tracking-tight text-textMain mb-5 ml-1">Acoes rapidas</Text>

        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={() => router.push('/(modals)/trip-planner')}
            className="flex-1 min-h-[156px] items-center justify-center px-4 py-5 bg-surface rounded-3xl border-2 border-surfaceLight"
          >
            <View className="w-14 h-14 rounded-full bg-[#1a1a1a] items-center justify-center mb-3">
              <MapPin size={24} color="#3B82F6" />
            </View>
            <Text className="w-full text-[15px] leading-5 font-bold text-textMain text-center" numberOfLines={2}>
              Nova viagem
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(modals)/new-refuel')}
            className="flex-1 min-h-[156px] items-center justify-center px-4 py-5 bg-surface rounded-3xl border-2 border-surfaceLight"
          >
            <View className="w-14 h-14 rounded-full bg-[#1a1a1a] items-center justify-center mb-3">
              <Fuel size={24} color="#1DB954" />
            </View>
            <Text className="w-full text-[15px] leading-5 font-bold text-textMain text-center" numberOfLines={2}>
              Abastecer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
