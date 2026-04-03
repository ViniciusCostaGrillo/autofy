import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, Plus } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { EmptyState } from '@/components/ui/EmptyState';

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
  electric: 'Eletrico',
  hybrid: 'Hibrido',
};

const FUEL_COLORS: Record<string, string> = {
  gasoline: '#3B82F6',
  ethanol: '#1DB954',
  flex: '#F59E0B',
  diesel: '#6B7280',
  electric: '#22D3EE',
  hybrid: '#A855F7',
};

export default function VehiclesScreen() {
  const insets = useSafeAreaInsets();
  const { vehicles, loading, setDefault } = useVehicles();

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-black text-textMain tracking-tighter">Minha frota</Text>
          <Text className="text-textMuted font-medium">
            {vehicles.length} veiculo{vehicles.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {vehicles.length === 0 ? (
          <EmptyState
            icon={<Car size={48} color="#B3B3B3" />}
            title="Nenhum veiculo"
            description="Adicione seu carro para comecar a rastrear gastos e planejar viagens."
          />
        ) : (
          <View className="gap-4">
            {vehicles.map((vehicle) => {
              const color = FUEL_COLORS[vehicle.fuelType] || '#B3B3B3';

              return (
                <View key={vehicle.id} className="bg-surface rounded-3xl p-5 border border-surfaceLight">
                  <View className="flex-row items-center">
                    <View
                      className="w-14 h-14 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Car size={26} color={color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-textMain font-black text-xl tracking-tight">
                          {vehicle.nickname}
                        </Text>
                        {vehicle.isDefault ? (
                          <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                            <Text className="text-primary text-xs font-black">PADRAO</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-textMuted font-medium text-sm mt-0.5">
                        {vehicle.brand} {vehicle.model} • {vehicle.year}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row mt-4 pt-4 border-t border-surfaceLight">
                    <View className="flex-1 items-center">
                      <Text className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1">
                        Consumo
                      </Text>
                      <Text className="text-textMain font-black text-lg">
                        {vehicle.manualAvgConsumption} km/l
                      </Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1">
                        Odometro
                      </Text>
                      <Text className="text-textMain font-black text-lg">
                        {vehicle.currentOdometer.toLocaleString()} km
                      </Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1">
                        Combustivel
                      </Text>
                      <Text className="font-black text-sm" style={{ color }}>
                        {FUEL_LABELS[vehicle.fuelType]}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3">
                    <Text className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1">
                      Tag de pedagio
                    </Text>
                    <Text className={`font-bold text-sm ${vehicle.hasTollTag ? 'text-primary' : 'text-textMuted'}`}>
                      {vehicle.hasTollTag ? 'Sem Parar' : 'Nao possui'}
                    </Text>
                  </View>

                  {!vehicle.isDefault ? (
                    <TouchableOpacity
                      onPress={() => setDefault(vehicle.id)}
                      className="mt-4 py-2.5 rounded-full border border-surfaceLight items-center"
                    >
                      <Text className="text-textMuted font-bold text-sm">Definir como padrao</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push('/(modals)/new-vehicle')}
        className="absolute right-6 w-16 h-16 bg-primary rounded-full items-center justify-center border-b-4 border-[#14833b]"
        style={{
          bottom: Math.max(insets.bottom, 16) + 12,
          elevation: 8,
          shadowColor: '#1DB954',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Plus size={28} color="#121212" />
      </TouchableOpacity>
    </View>
  );
}
