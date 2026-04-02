import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Car, MapPin, Fuel, TrendingUp } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';

export default function DashboardScreen() {
  const { vehicles, trips, refuels } = useStore();
  
  const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />
      
      {/* Header */}
      <View className="pt-16 pb-6 px-6 bg-white dark:bg-slate-800 rounded-b-[32px] shadow-sm">
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
          Veículo Atual
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-accent/10 items-center justify-center mr-4">
              <Car size={24} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                {defaultVehicle?.nickname || 'Nenhum Veículo'}
              </Text>
              {defaultVehicle && (
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {defaultVehicle.brand} {defaultVehicle.model} • {defaultVehicle.year}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-full">
            <Car size={20} className="text-slate-600 dark:text-slate-300" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Quick Stats Grid */}
        <View className="flex-row gap-4 mb-6">
          <StatCard 
            title="Média (mês)" 
            value={defaultVehicle?.manualAvgConsumption.toString() + ' km/l'} 
            icon={<TrendingUp size={16} color="#10B981" />} 
          />
          <StatCard 
            title="Gasto Acumulado" 
            value="R$ 1.250" 
            icon={<Fuel size={16} color="#EF4444" />} 
          />
        </View>

        {/* Custo/KM Section */}
        <Card className="mb-6 bg-accent border-0">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white/80 text-sm font-medium mb-1">Custo por km rodado</Text>
              <Text className="text-white text-3xl font-bold">R$ 0,55</Text>
            </View>
            <View className="bg-white/20 p-3 rounded-2xl">
              <TrendingUp size={24} color="white" />
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Ações Rápidas
        </Text>
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity 
            onPress={() => router.push('/(modals)/new-trip')}
            className="flex-1 items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"
          >
            <View className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-3">
              <MapPin size={24} color="#3B82F6" />
            </View>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Nova Viagem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/(modals)/new-refuel')}
            className="flex-1 items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"
          >
            <View className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mb-3">
              <Fuel size={24} color="#10B981" />
            </View>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Abastecer</Text>
          </TouchableOpacity>
        </View>

        <View className="pb-10" />
      </ScrollView>
    </View>
  );
}
