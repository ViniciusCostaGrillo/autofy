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
  const loading = vehiclesLoading || refuelsLoading;

  // 1. Obter dados do usuário logado ou "João" como fallback
  const userName = preferences.name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'João';
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const displayAvatarUrl = preferences.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';

  // 2. Mês atual formatado no idioma correto
  const currentMonthName = new Date().toLocaleString(preferences.language || 'pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // 3. Cálculos de Gastos Dinâmicos para o Mês Vigente (Gasto Total)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();

  const currentMonthRefuels = refuels.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
  });

  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
  });

  let fuelSum = currentMonthRefuels.reduce((sum, r) => sum + r.totalPrice, 0);
  let maintSum = currentMonthExpenses
    .filter((e) => ['oil_change', 'tires', 'parts', 'service'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
  let taxSum = currentMonthExpenses
    .filter((e) => ['insurance', 'other'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
  let monthlyTotal = fuelSum + maintSum + taxSum;

  // Fallback para histórico acumulado total caso não haja gastos no mês corrente
  const hasMonthlySpent = monthlyTotal > 0;
  if (!hasMonthlySpent) {
    fuelSum = refuels.reduce((sum, r) => sum + r.totalPrice, 0);
    maintSum = expenses
      .filter((e) => ['oil_change', 'tires', 'parts', 'service'].includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);
    taxSum = expenses
      .filter((e) => ['insurance', 'other'].includes(e.category))
      .reduce((sum, e) => sum + e.amount, 0);
    monthlyTotal = fuelSum + maintSum + taxSum;
  }

  // Porcentagens dinâmicas por categoria de despesas
  let fuelPercent = 0;
  let maintPercent = 0;
  let taxPercent = 0;

  if (monthlyTotal > 0) {
    fuelPercent = Math.round((fuelSum / monthlyTotal) * 100);
    maintPercent = Math.round((maintSum / monthlyTotal) * 100);
    taxPercent = Math.round((taxSum / monthlyTotal) * 100);

    // Ajustar soma das frações arredondadas para somar 100% exatos
    const sum = fuelPercent + maintPercent + taxPercent;
    if (sum > 0 && sum !== 100) {
      const diff = 100 - sum;
      if (fuelPercent >= maintPercent && fuelPercent >= taxPercent) {
        fuelPercent += diff;
      } else if (maintPercent >= fuelPercent && maintPercent >= taxPercent) {
        maintPercent += diff;
      } else {
        taxPercent += diff;
      }
    }
  } else {
    // Fallback padrão amigável para base limpa
    fuelPercent = 0;
    maintPercent = 0;
    taxPercent = 0;
  }

  const displayTotalSpent = formatCurrencyForPreferences(monthlyTotal, preferences);

  // 4. Consumo Médio Dinâmico
  const displayAvgConsumption = defaultVehicle && defaultVehicle.manualAvgConsumption > 0
    ? formatConsumptionForPreferences(defaultVehicle.manualAvgConsumption, preferences)
    : '--';

  // 5. Gráfico de Barras Dinâmico de Gastos de Combustível (Últimos 3 Meses)
  const getMonthLabel = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    const label = d.toLocaleString(preferences.language || 'pt-BR', { month: 'short' });
    return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
  };

  const getMonthFuelSpent = (offset: number) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - offset);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    return refuels
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      })
      .reduce((sum, r) => sum + r.totalPrice, 0);
  };

  const label3 = getMonthLabel(2);
  const label2 = getMonthLabel(1);
  const label1 = getMonthLabel(0);

  const fuelSpentM3 = getMonthFuelSpent(2);
  const fuelSpentM2 = getMonthFuelSpent(1);
  const fuelSpentM1 = getMonthFuelSpent(0);

  let bar3Height = 4;
  let bar2Height = 4;
  let bar1Height = 4;

  const maxSpent = Math.max(fuelSpentM3, fuelSpentM2, fuelSpentM1);
  if (maxSpent > 0) {
    const minBarHeight = 12;
    const maxBarHeight = 44;
    const scale = (val: number) => {
      if (val === 0) return 4;
      return minBarHeight + (val / maxSpent) * (maxBarHeight - minBarHeight);
    };
    bar3Height = scale(fuelSpentM3); // Ago/M3
    bar2Height = scale(fuelSpentM2); // Set/M2
    bar1Height = scale(fuelSpentM1); // Out/M1
  }

  // 6. Indicadores de Comparação / Tendências
  let consumptionDiffText = '--';
  let consumptionIsPositive = true;

  if (fuelSpentM2 > 0) {
    const diffPercent = Math.round(((fuelSpentM1 - fuelSpentM2) / fuelSpentM2) * 100);
    if (diffPercent >= 0) {
      consumptionDiffText = `↑ ${diffPercent}% vs. ${label2}`;
      consumptionIsPositive = true;
    } else {
      consumptionDiffText = `↓ ${Math.abs(diffPercent)}% vs. ${label2}`;
      consumptionIsPositive = false;
    }
  } else if (fuelSpentM1 > 0) {
    consumptionDiffText = preferences.language === 'pt-BR' ? 'Novo' : preferences.language === 'es' ? 'Nuevo' : 'New';
    consumptionIsPositive = true;
  }

  let spendingDiffText = '--';
  let spendingIsDown = true;

  const getMonthTotalSpent = (offset: number) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - offset);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();

    const fSpent = refuels
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      })
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const mSpent = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return fSpent + mSpent;
  };

  const totalSpentM2 = getMonthTotalSpent(1);
  const totalSpentM1 = monthlyTotal;

  if (totalSpentM2 > 0 && hasMonthlySpent) {
    const diffPercent = Math.round(((totalSpentM1 - totalSpentM2) / totalSpentM2) * 100);
    if (diffPercent <= 0) {
      spendingDiffText = `↓ ${Math.abs(diffPercent)}% vs. ${getMonthLabel(1)}`;
      spendingIsDown = true;
    } else {
      spendingDiffText = `↑ ${diffPercent}% vs. ${getMonthLabel(1)}`;
      spendingIsDown = false;
    }
  } else if (hasMonthlySpent) {
    spendingDiffText = preferences.language === 'pt-BR' ? 'Novo' : preferences.language === 'es' ? 'Nuevo' : 'New';
    spendingIsDown = false;
  }

  // 7. Custo Estimado por KM e Slider Linear
  const estimatedCostPerKm = (() => {
    if (!defaultVehicle || defaultVehicle.manualAvgConsumption === 0) return null;
    const lastRefuel = refuels[0];
    if (!lastRefuel) return null;
    return lastRefuel.pricePerLiter / defaultVehicle.manualAvgConsumption;
  })();

  const hasRealCostPerKm = estimatedCostPerKm !== null && estimatedCostPerKm > 0;
  const displayCostPerKmText = hasRealCostPerKm
    ? `${formatCurrencyForPreferences(estimatedCostPerKm, preferences)}/km`
    : '--';
  const progressPercent = hasRealCostPerKm ? Math.min(Math.max((estimatedCostPerKm / 1.0) * 100, 0), 100) : 0;

  // 8. Lista de Atividades Recentes Dinâmica
  const realActivities = [
    ...refuels.map((r) => ({
      id: `refuel-${r.id}`,
      type: 'refuel',
      title: `${preferences.language === 'pt-BR' ? 'Abastecimento' : preferences.language === 'es' ? 'Abastecimiento' : 'Refuel'} - ${formatCurrencyForPreferences(r.totalPrice, preferences)}`,
      date: new Date(r.date),
      dateText: new Date(r.date).toLocaleDateString(preferences.language === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' }),
    })),
    ...oilChanges.map((o) => ({
      id: `oil-${o.id}`,
      type: 'oil_change',
      title: `${preferences.language === 'pt-BR' ? 'Troca de Óleo' : preferences.language === 'es' ? 'Cambio de Aceite' : 'Oil Change'} - ${o.oilName}`,
      date: new Date(o.changedAt),
      dateText: new Date(o.changedAt).toLocaleDateString(preferences.language === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' }),
    })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      type: 'expense',
      title: `${e.title} - ${formatCurrencyForPreferences(e.amount, preferences)}`,
      date: new Date(e.date),
      dateText: new Date(e.date).toLocaleDateString(preferences.language === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' }),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // 9. Strings Dinâmicas de Internacionalização
  const txtActive = preferences.language === 'pt-BR' ? 'Ativo' : preferences.language === 'es' ? 'Activo' : 'Active';
  const txtMonthSummary = preferences.language === 'pt-BR' ? `Resumo de ${capitalizedMonth}` : preferences.language === 'es' ? `Resumen de ${capitalizedMonth}` : `${capitalizedMonth} Summary`;
  const txtHello = preferences.language === 'pt-BR' ? 'Olá' : preferences.language === 'es' ? 'Hola' : 'Hello';
  
  const labelFuel = preferences.language === 'pt-BR' ? 'Combustível' : preferences.language === 'es' ? 'Combustible' : 'Fuel';
  const labelMaint = preferences.language === 'pt-BR' ? 'Manutenção' : preferences.language === 'es' ? 'Mantenimiento' : 'Maintenance';
  const labelTax = preferences.language === 'pt-BR' ? 'Impostos' : preferences.language === 'es' ? 'Impuestos' : 'Taxes';
  const labelRegularGas = preferences.language === 'pt-BR' ? 'Gasolina Comum' : preferences.language === 'es' ? 'Gasolina Común' : 'Regular Gasoline';
  const labelThisMonth = preferences.language === 'pt-BR' ? `Este Mês (${capitalizedMonth})` : preferences.language === 'es' ? `Este Mes (${capitalizedMonth})` : `This Month (${capitalizedMonth})`;

  const titleRecentActivity = preferences.language === 'pt-BR' ? 'Atividade Recente' : preferences.language === 'es' ? 'Actividad Reciente' : 'Recent Activity';
  const titleCostPerKm = preferences.language === 'pt-BR' ? 'Custo Estimado por KM' : preferences.language === 'es' ? 'Costo Estimado por KM' : 'Estimated Cost per KM';
  const txtBasedOn3 = preferences.language === 'pt-BR' ? 'Baseado nos últimos 3 meses' : preferences.language === 'es' ? 'Basado en los últimos 3 meses' : 'Based on last 3 months';
  const btnImprove = preferences.language === 'pt-BR' ? 'Melhorar Eficiência' : preferences.language === 'es' ? 'Mejorar Eficiencia' : 'Improve Efficiency';

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

        {/* Bloco de Perfil */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Image
              source={{ uri: displayAvatarUrl }}
              className="w-12 h-12 rounded-full border border-surfaceLight mr-3"
            />
            <View>
              <Text className="text-xs font-semibold text-textMuted">{txtMonthSummary}</Text>
              <Text className="text-lg font-black text-white tracking-tight">{txtHello}, {capitalizedName}!</Text>
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
                {defaultVehicle ? `${defaultVehicle.brand} ${defaultVehicle.model}` : t('dashboard.addVehicle')}
              </Text>
              <Text className="text-xs text-textMuted font-medium mt-0.5">
                <Text className="text-[#10B981] font-bold">{txtActive}</Text> •{' '}
                {defaultVehicle
                  ? formatDistanceForPreferences(defaultVehicle.currentOdometer, preferences)
                  : '--'}
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
              {t('dashboard.avgConsumption')}
            </Text>
            <Text className="text-xl font-black text-white tracking-tighter mb-0.5">
              {displayAvgConsumption}
            </Text>
            <Text className="text-[10px] text-textMuted font-medium mb-3">
              {labelRegularGas}
            </Text>

            {/* Mini Gráfico de Barras */}
            <View className="flex-row items-end justify-between px-1 h-12 mb-3">
              <View className="items-center">
                <View className="w-4 bg-[#10B981]/40 rounded-t" style={{ height: bar3Height }} />
                <Text className="text-[8px] text-textMuted font-semibold mt-1">{label3}</Text>
              </View>
              <View className="items-center">
                <View className="w-4 bg-[#10B981]/70 rounded-t" style={{ height: bar2Height }} />
                <Text className="text-[8px] text-textMuted font-semibold mt-1">{label2}</Text>
              </View>
              <View className="items-center">
                <View className="w-4 bg-[#10B981] rounded-t" style={{ height: bar1Height }} />
                <Text className="text-[8px] text-textMuted font-semibold mt-1">{label1}</Text>
              </View>
            </View>

            {/* Indicador de Desempenho */}
            <View className="bg-[#10B981]/10 py-1.5 px-3 rounded-full flex-row items-center justify-center">
              <Text className="text-[10px] font-extrabold text-[#10B981]">{consumptionDiffText}</Text>
            </View>
          </View>

          {/* Card 2: Gasto Total (Azul) */}
          <View className="flex-1 bg-surface rounded-3xl p-4 border border-[#3B82F6]/30">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-[#3B82F6] mb-1">
              {t('dashboard.totalSpent')}
            </Text>
            <Text className="text-xl font-black text-white tracking-tighter mb-0.5">
              {displayTotalSpent}
            </Text>
            <Text className="text-[10px] text-textMuted font-medium mb-3">
              {labelThisMonth}
            </Text>

            {/* Distribuição de Categorias */}
            <View className="flex-row justify-between items-center h-12 mb-3">
              <View className="items-center">
                <View className="w-7 h-7 rounded-full bg-surfaceLight items-center justify-center border border-[#10B981]/25">
                  <Fuel size={11} color="#10B981" />
                </View>
                <Text className="text-[7px] text-textMuted mt-1" numberOfLines={1}>{labelFuel}</Text>
                <Text className="text-[8px] font-bold text-white">{fuelPercent}%</Text>
              </View>
              <View className="items-center">
                <View className="w-7 h-7 rounded-full bg-surfaceLight items-center justify-center border border-[#3B82F6]/25">
                  <Wrench size={11} color="#3B82F6" />
                </View>
                <Text className="text-[7px] text-textMuted mt-1" numberOfLines={1}>{labelMaint}</Text>
                <Text className="text-[8px] font-bold text-white">{maintPercent}%</Text>
              </View>
              <View className="items-center">
                <View className="w-7 h-7 rounded-full bg-surfaceLight items-center justify-center border border-[#3B82F6]/25">
                  <Coins size={11} color="#3B82F6" />
                </View>
                <Text className="text-[7px] text-textMuted mt-1" numberOfLines={1}>{labelTax}</Text>
                <Text className="text-[8px] font-bold text-white">{taxPercent}%</Text>
              </View>
            </View>

            {/* Indicador de Desempenho */}
            <View className="bg-[#3B82F6]/10 py-1.5 px-3 rounded-full flex-row items-center justify-center">
              <Text className="text-[10px] font-extrabold text-[#3B82F6]">{spendingDiffText}</Text>
            </View>
          </View>
        </View>

        {/* Card de Custo Estimado por KM */}
        <View className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-6">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-textMuted">
                {titleCostPerKm}
              </Text>
              <Text className="text-2xl font-black text-white mt-1 tracking-tighter">
                {displayCostPerKmText}
              </Text>
              <Text className="text-[10px] text-textMuted font-medium mt-0.5">
                {txtBasedOn3}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(modals)/trip-planner')}
              hitSlop={10}
            >
              <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider">
                {btnImprove}
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
            {titleRecentActivity}
          </Text>

          {realActivities.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-surfaceLight items-center justify-center">
              <Text className="text-sm text-textMuted font-medium text-center">
                {preferences.language === 'pt-BR' 
                  ? 'Nenhuma atividade recente' 
                  : preferences.language === 'es' 
                  ? 'Sin actividad reciente' 
                  : 'No recent activity'}
              </Text>
              <Text className="text-xs text-textMuted/60 text-center mt-1">
                {preferences.language === 'pt-BR' 
                  ? 'Abasteça seu carro ou registre gastos para vê-los aqui!' 
                  : preferences.language === 'es' 
                  ? '¡Abastece tu carro o registra gastos para verlos aquí!' 
                  : 'Refuel your car or register expenses to see them here!'}
              </Text>
            </View>
          ) : (
            realActivities.slice(0, 3).map((act, index) => {
              const isRefuel = act.type === 'refuel';
              const isOil = act.type === 'oil_change';

              return (
                <View
                  key={act.id || index}
                  className="flex-row items-center justify-between bg-surface rounded-2xl p-4 border border-surfaceLight mb-3"
                >
                  <View className="flex-row items-center flex-1 pr-4">
                    {isRefuel ? (
                      <View className="w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 items-center justify-center mr-3">
                        <Fuel size={18} color="#10B981" />
                      </View>
                    ) : isOil ? (
                      <View className="w-10 h-10 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/25 items-center justify-center mr-3">
                        <Wrench size={18} color="#F59E0B" />
                      </View>
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/25 items-center justify-center mr-3">
                        <Car size={18} color="#3B82F6" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-white" numberOfLines={1}>
                        {act.title}
                      </Text>
                      <Text className="text-[11px] text-textMuted font-medium mt-0.5">
                        {act.dateText}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[11px] font-semibold text-textMuted">
                    {act.dateText}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
