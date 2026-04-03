import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Car, MapPin, Fuel, TrendingUp, LogOut } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useRefuels } from '@/hooks/useRefuels';
import { useAuth } from '@/lib/AuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/utils/calculations';

export default function DashboardScreen() {
  const { vehicles, loading: vLoading } = useVehicles();
  const { refuels, loading: rLoading } = useRefuels();
  const { signOut } = useAuth();

  const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];
  const totalSpent = refuels.reduce((acc, r) => acc + r.totalPrice, 0);

  const costPerKm = (() => {
    if (!defaultVehicle || defaultVehicle.manualAvgConsumption === 0) return null;
    // Estimativa: custo médio por km baseado no consumo e no preço médio do último abastecimento
    const lastRefuel = refuels[0];
    if (!lastRefuel) return null;
    return lastRefuel.pricePerLiter / defaultVehicle.manualAvgConsumption;
  })();

  const loading = vLoading || rLoading;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />

      {/* Header */}
      <View className="pt-16 pb-8 px-6 bg-surface rounded-b-[40px] border-b-2 border-surfaceLight">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-textMuted">Veículo Atual</Text>
          <TouchableOpacity onPress={signOut} className="bg-surfaceLight p-2 rounded-full">
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
                  {defaultVehicle && (
                    <Text className="text-sm font-medium text-textMuted">
                      {defaultVehicle.brand} {defaultVehicle.model} • {defaultVehicle.year}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/vehicles')}
            className="bg-surfaceLight p-3 rounded-full border border-surfaceLight ml-3"
          >
            <Car size={20} color="#B3B3B3" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View className="flex-row gap-4 mb-6">
          <StatCard
            title="Consumo Médio"
            value={defaultVehicle ? `${defaultVehicle.manualAvgConsumption} km/l` : '--'}
            icon={<TrendingUp size={16} color="#1DB954" />}
          />
          <StatCard
            title="Gasto Total"
            value={totalSpent > 0 ? formatCurrency(totalSpent) : 'R$ 0,00'}
            icon={<Fuel size={16} color="#E91429" />}
          />
        </View>

        {/* Custo por KM */}
        <View className="mb-6 bg-secondary rounded-3xl p-5 border-b-4 border-[#1a4ba3]">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Custo por km rodado</Text>
              <Text className="text-white text-4xl font-black tracking-tighter">
                {costPerKm ? formatCurrency(costPerKm) : '--'}
              </Text>
              {!costPerKm && <Text className="text-white/50 text-xs mt-1">Registre um abastecimento</Text>}
            </View>
            <View className="bg-white/20 p-4 rounded-2xl">
              <TrendingUp size={28} color="white" />
            </View>
          </View>
        </View>

        {/* Ações Rápidas */}
        <Text className="text-xl font-black tracking-tight text-textMain mb-5 ml-1">Ações Rápidas</Text>
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={() => router.push('/(modals)/new-trip')}
            className="flex-1 items-center justify-center p-5 bg-surface rounded-3xl border-2 border-surfaceLight"
          >
            <View className="w-14 h-14 rounded-full bg-[#1a1a1a] items-center justify-center mb-3">
              <MapPin size={24} color="#3B82F6" />
            </View>
            <Text className="text-sm font-bold text-textMain tracking-wide text-center">Nova Viagem</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(modals)/new-refuel')}
            className="flex-1 items-center justify-center p-5 bg-surface rounded-3xl border-2 border-surfaceLight"
          >
            <View className="w-14 h-14 rounded-full bg-[#1a1a1a] items-center justify-center mb-3">
              <Fuel size={24} color="#1DB954" />
            </View>
            <Text className="text-sm font-bold text-textMain tracking-wide text-center">Abastecer</Text>
          </TouchableOpacity>
        </View>

        <View className="pb-10" />
      </ScrollView>
    </View>
  );
}
