import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Fuel, Plus, Calendar } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/utils/calculations';
import { EmptyState } from '@/components/ui/EmptyState';

export default function RefuelsScreen() {
  const { refuels } = useStore();

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-slate-800 dark:text-white">Abastecimentos</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(modals)/new-refuel')}
          className="bg-emerald-50 dark:bg-emerald-900/30 w-10 h-10 rounded-full items-center justify-center"
        >
          <Plus size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      {refuels.length === 0 ? (
        <EmptyState 
          icon={<Fuel size={48} color="#94A3B8" />}
          title="Nenhum abastecimento"
          description="Você ainda não registrou nenhum abastecimento para o veículo."
        />
      ) : (
        <View className="gap-4">
          {refuels.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((refuel) => (
            <View key={refuel.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 items-center justify-center mr-3">
                    <Fuel size={18} color="#64748B" />
                  </View>
                  <View>
                    <Text className="text-slate-800 dark:text-white font-semibold">
                      {refuel.gasStation || 'Posto Desconhecido'}
                    </Text>
                    <Text className="text-slate-500 text-xs">Odômetro: {refuel.odometer} km</Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-emerald-500">{formatCurrency(refuel.totalPrice)}</Text>
              </View>
              
              <View className="flex-row justify-between pt-1">
                <Text className="text-slate-500 text-sm">{refuel.liters}L</Text>
                <Text className="text-slate-500 text-sm">{formatCurrency(refuel.pricePerLiter)}/L</Text>
                <Text className="text-slate-500 text-sm text-right flex-row items-center">
                   {new Date(refuel.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
