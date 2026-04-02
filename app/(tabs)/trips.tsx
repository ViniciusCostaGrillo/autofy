import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { MapPin, ArrowRight, Plus } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/utils/calculations';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TripsScreen() {
  const { trips } = useStore();

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-slate-800 dark:text-white">Viagens</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(modals)/new-trip')}
          className="bg-blue-50 dark:bg-blue-900/30 w-10 h-10 rounded-full items-center justify-center"
        >
          <Plus size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <EmptyState 
          icon={<MapPin size={48} color="#94A3B8" />}
          title="Nenhuma viagem planejada"
          description="Você ainda não salvou nenhuma estimativa de viagem."
        />
      ) : (
        <View className="gap-4">
          {trips.map((trip) => (
            <View key={trip.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                <View className="flex-row items-center flex-1 pr-4">
                  <Text className="text-slate-800 dark:text-white font-semibold" numberOfLines={1}>{trip.origin}</Text>
                  <ArrowRight size={14} color="#94A3B8" style={{ marginHorizontal: 8 }} />
                  <Text className="text-slate-800 dark:text-white font-semibold flex-1" numberOfLines={1}>{trip.destination}</Text>
                </View>
                <Text className="text-lg font-bold text-blue-500">{formatCurrency(trip.totalCost)}</Text>
              </View>
              
              <View className="flex-row justify-between pt-1">
                <Text className="text-slate-500 text-sm">{trip.distanceKm} km</Text>
                <Text className="text-slate-500 text-sm">Passageiros: {trip.passengers}</Text>
                <Text className="text-slate-500 text-sm text-right">{new Date(trip.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
