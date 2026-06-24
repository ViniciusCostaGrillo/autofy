import React, { useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car,
  Fuel,
  TrendingUp,
  Wrench,
  Bell,
  ChevronRight,
  Coins,
  History,
  LogOut,
} from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useRefuels } from '@/hooks/useRefuels';
import { useOilChanges } from '@/hooks/useOilChanges';
import { useMaintenanceExpenses } from '@/hooks/useMaintenanceExpenses';
import { useAuth } from '@/lib/AuthContext';
import { usePreferences } from '@/lib/PreferencesContext';
import {
  formatConsumptionForPreferences,
  formatCurrencyForPreferences,
  formatDistanceForPreferences,
} from '@/lib/formatting';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const hasSkippedInitialFocusRefresh = useRef(false);
  const { vehicles, loading: vehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { refuels, loading: refuelsLoading, refetch: refetchRefuels } = useRefuels();
  const { oilChanges, refetch: refetchOilChanges } = useOilChanges();
  const { expenses, refetch: refetchMaintenanceExpenses } = useMaintenanceExpenses();
  const { session, signOut } = useAuth();
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

  const estimatedCostPerKm = (() => {
    if (!defaultVehicle || defaultVehicle.manualAvgConsumption === 0) return null;

    const lastRefuel = refuels[0];
    if (!lastRefuel) return null;

    return lastRefuel.pricePerLiter / defaultVehicle.manualAvgConsumption;
  })();

  const loading = vehiclesLoading || refuelsLoading;

  // Obter nome do usuário logado ou João como fallback
  const userName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'João';
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Mês atual em português formatado
  const currentMonthName = new Date().toLocaleString(preferences.language || 'pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Lógica de Atividade Recente com mesclagem e fallback
  const realActivities = [
    ...refuels.map((r) => ({
      id: `refuel-${r.id}`,
      type: 'refuel',
      title: `Abastecimento - ${formatCurrencyForPreferences(r.totalPrice, preferences)}`,
      date: new Date(r.date),
      dateText: new Date(r.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      rawDateText: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    ...oilChanges.map((o) => ({
      id: `oil-${o.id}`,
      type: 'oil_change',
      title: `Troca de Óleo - ${o.oilName || 'Serviço'}`,
      date: new Date(o.changedAt),
      dateText: new Date(o.changedAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      rawDateText: new Date(o.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      type: 'expense',
      title: `${e.title} - ${formatCurrencyForPreferences(e.amount, preferences)}`,
      date: new Date(e.date),
      dateText: new Date(e.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      rawDateText: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Atividades de fallback idênticas ao mockup
  const mockActivities = [
    {
      id: 'mock-1',
      type: 'refuel',
      title: 'Abastecimento - R$ 245,50',
      date: new Date('2026-10-28'),
      dateText: 'Oct 28',
      rawDateText: 'Oct 28',
    },
    {
      id: 'mock-2',
      type: 'oil_change',
      title: 'Troca de Óleo - R$ 380,00',
      date: new Date('2026-10-25'),
      dateText: 'Oct 25',
      rawDateText: 'Oct 25',
    },
    {
      id: 'mock-3',
      type: 'expense',
      title: 'Lavagem - R$ 75,00',
      date: new Date('2026-10-22'),
      dateText: 'Oct 22',
      rawDateText: 'Oct 22',
    },
  ];

  // Preencher até 3 atividades
  const displayActivities = [...realActivities];
  if (displayActivities.length < 3) {
    const needed = 3 - displayActivities.length;
    for (let i = 0; i < needed; i++) {
      displayActivities.push(mockActivities[i]);
    }
  }
  const finalActivities = displayActivities.slice(0, 3);

  // Valor de consumo médio exibido (real ou mockup fallback de 14.5)
  const displayAvgConsumption = defaultVehicle && defaultVehicle.manualAvgConsumption > 0
    ? formatConsumptionForPreferences(defaultVehicle.manualAvgConsumption, preferences)
    : '14.5 km/L';

  // Valor de custo por km (real ou mockup fallback de 0.42)
  const displayCostPerKmVal = estimatedCostPerKm !== null ? estimatedCostPerKm : 0.42;
  const displayCostPerKmText = estimatedCostPerKm !== null 
    ? `${formatCurrencyForPreferences(estimatedCostPerKm, preferences)} /km` 
    : 'R$ 0,42 /km';

  // Porcentagem da barra de progresso (baseada no custo por km, max 1.00)
  const progressPercent = Math.min(Math.max((displayCostPerKmVal / 1.0) * 100, 0), 100);

  // Valor total gasto (real ou mockup fallback de 1.845,70)
  const displayTotalSpent = totalSpent > 0
    ? formatCurrencyForPreferences(totalSpent, preferences)
    : 'R$ 1.845,70';

  return (
    <View className="flex-1 bg-[#121212]">
      <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />

      {/* Glow verde sutil no topo simulando estética premium */}
      <View
        style={{
          position: 'absolute',
          top: -120,
          alignSelf: 'center',
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#10B981',
          opacity: 0.08,
          transform: [{ scaleX: 1.6 }],
        }}
        pointerEvents="none"
      />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Título Autofy */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-black text-white tracking-tighter">Autofy</Text>
          <TouchableOpacity onPress={signOut} className="bg-surfaceLight p-2 rounded-full" hitSlop={10}>
            <LogOut size={16} color="#B3B3B3" />
          </TouchableOpacity>
        </View>

        {/* Bloco de Perfil: João */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' }}
              className="w-12 h-12 rounded-full border border-surfaceLight mr-3"
            />
            <View>
              <Text className="text-xs font-semibold text-textMuted">Resumo de {capitalizedMonth}</Text>
              <Text className="text-lg font-black text-white tracking-tight">Olá, {capitalizedName}!</Text>
            </View>
          </View>
          <TouchableOpacity className="relative bg-surface p-3 rounded-full border border-surfaceLight">
            <Bell size={20} color="#FFFFFF" />
            <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-danger" />
          </TouchableOpacity>
        </View>

        {/* Card do Veículo Selecionado */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/vehicles')}
          className="bg-surface rounded-2xl p-4 border border-surfaceLight flex-row items-center justify-between mb-6"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-xl bg-surfaceLight items-center justify-center mr-3">
              <Car size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white leading-5">
                {defaultVehicle ? `${defaultVehicle.brand} ${defaultVehicle.model}` : 'Ford Focus'}
              </Text>
              <Text className="text-xs text-textMuted font-medium mt-0.5">
                <Text className="text-[#10B981] font-bold">Ativo</Text> •{' '}
                {defaultVehicle
                  ? formatDistanceForPreferences(defaultVehicle.currentOdometer, preferences)
                  : '48.250 km'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#B3B3B3" />
        </TouchableOpacity>

        {/* Grid de Consumo Médio & Gasto Total */}
        <View className="flex-row gap-4 mb-6">
          {/* Card 1: Consumo Médio (Verde) */}
          <View className="flex-1 bg-surface rounded-3xl p-4 border border-[#10B981]/30">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] mb-1">
              Consumo Médio
            </Text>
            <Text className="text-xl font-black text-white tracking-tighter mb-0.5">
              {displayAvgConsumption}
            </Text>
            <Text className="text-[10px] text-textMuted font-medium mb-3">
              Gasolina Comum
            </Text>

            {/* Mini Gráfico de Barras */}
            <View className="flex-row items-end justify-between px-1 h-12 mb-3">
              <View className="items-center">
                <View className="w-4 bg-[#10B981]/40 rounded-t h-4" />
                <Text className="text-[8px] text-textMuted font-semibold mt-1">Ago</Text>
              </View>
              <View className="items-center">
                <View className="w-4 bg-[#10B981]/70 rounded-t h-7" />
                <Text className="text-[8px] text-textMuted font-semibold mt-1">Set</Text>
              </View>
              <View className="items-center">
                <View className="w-4 bg-[#10B981] rounded-t h-11" />
                <Text className="text-[8px] text-textMuted font-semibold mt-1">Out</Text>
              </View>
            </View>

            {/* Indicador de Desempenho */}
            <View className="bg-[#10B981]/10 py-1.5 px-3 rounded-full flex-row items-center justify-center">
              <Text className="text-[10px] font-extrabold text-[#10B981]">↑ 4% vs. Set</Text>
            </View>
          </View>

          {/* Card 2: Gasto Total (Azul) */}
          <View className="flex-1 bg-surface rounded-3xl p-4 border border-[#3B82F6]/30">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-[#3B82F6] mb-1">
              Gasto Total
            </Text>
            <Text className="text-xl font-black text-white tracking-tighter mb-0.5">
              {displayTotalSpent}
            </Text>
            <Text className="text-[10px] text-textMuted font-medium mb-3">
              Este Mês ({capitalizedMonth})
            </Text>

            {/* Distribuição de Categorias */}
            <View className="flex-row justify-between items-center h-12 mb-3">
              <View className="items-center">
                <View className="w-7 h-7 rounded-full bg-surfaceLight items-center justify-center border border-[#10B981]/20">
                  <Fuel size={11} color="#10B981" />
                </View>
                <Text className="text-[7px] text-textMuted mt-1" numberOfLines={1}>Combustível</Text>
                <Text className="text-[8px] font-bold text-white">60%</Text>
              </View>
              <View className="items-center">
                <View className="w-7 h-7 rounded-full bg-surfaceLight items-center justify-center border border-[#3B82F6]/20">
                  <Wrench size={11} color="#3B82F6" />
                </View>
                <Text className="text-[7px] text-textMuted mt-1" numberOfLines={1}>Manutenção</Text>
                <Text className="text-[8px] font-bold text-white">25%</Text>
              </View>
              <View className="items-center">
                <View className="w-7 h-7 rounded-full bg-surfaceLight items-center justify-center border border-[#3B82F6]/20">
                  <Coins size={11} color="#3B82F6" />
                </View>
                <Text className="text-[7px] text-textMuted mt-1" numberOfLines={1}>Impostos</Text>
                <Text className="text-[8px] font-bold text-white">15%</Text>
              </View>
            </View>

            {/* Indicador de Desempenho */}
            <View className="bg-[#3B82F6]/10 py-1.5 px-3 rounded-full flex-row items-center justify-center">
              <Text className="text-[10px] font-extrabold text-[#3B82F6]">↓ 2% vs. Meta</Text>
            </View>
          </View>
        </View>

        {/* Card de Custo Estimado por KM */}
        <View className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-6">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-textMuted">
                Custo Estimado por KM
              </Text>
              <Text className="text-2xl font-black text-white mt-1 tracking-tighter">
                {displayCostPerKmText}
              </Text>
              <Text className="text-[10px] text-textMuted font-medium mt-0.5">
                Based on últimos 3 meses
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(modals)/trip-planner')}
              hitSlop={10}
            >
              <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider">
                Melhorar Eficiência
              </Text>
            </TouchableOpacity>
          </View>

          {/* Slider Progress Bar */}
          <View className="w-full h-1.5 bg-surfaceLight rounded-full relative my-3">
            <View
              className="h-full bg-[#3B82F6] rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            <View
              className="w-4 h-4 rounded-full bg-[#3B82F6] border-2 border-white absolute -top-[5px]"
              style={{ left: `${progressPercent}%`, marginLeft: -8 }}
            />
          </View>

          <View className="flex-row justify-between">
            <Text className="text-[10px] font-medium text-textMuted">0 - 1.00</Text>
            <Text className="text-[10px] font-medium text-textMuted">0 - 1.00</Text>
          </View>
        </View>

        {/* Seção de Atividade Recente */}
        <View className="mb-2">
          <Text className="text-lg font-black text-white tracking-tight mb-4">
            Atividade Recente
          </Text>

          {finalActivities.map((act, index) => {
            const isRefuel = act.type === 'refuel';
            const isOil = act.type === 'oil_change';

            return (
              <View
                key={act.id || index}
                className="flex-row items-center justify-between bg-surface rounded-2xl p-4 border border-surfaceLight mb-3"
              >
                <View className="flex-row items-center flex-1 pr-4">
                  {isRefuel ? (
                    <View className="w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 items-center justify-center mr-3">
                      <Fuel size={18} color="#10B981" />
                    </View>
                  ) : isOil ? (
                    <View className="w-10 h-10 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 items-center justify-center mr-3">
                      <Wrench size={18} color="#F59E0B" />
                    </View>
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 items-center justify-center mr-3">
                      <Car size={18} color="#3B82F6" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-white" numberOfLines={1}>
                      {act.title}
                    </Text>
                    <Text className="text-[11px] text-textMuted font-medium mt-0.5">
                      {preferences.language === 'pt-BR' ? act.dateText : act.rawDateText}
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] font-semibold text-textMuted">
                  {preferences.language === 'pt-BR' ? act.dateText : act.rawDateText}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
