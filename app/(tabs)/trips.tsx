import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, ArrowRight, Plus, Trash2 } from 'lucide-react-native';
import { useTrips } from '@/hooks/useTrips';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePreferences } from '@/lib/PreferencesContext';
import { formatCurrencyForPreferences, formatDistanceForPreferences } from '@/lib/formatting';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { trips, loading, refetch, deleteTrip } = useTrips();
  const { preferences, t } = usePreferences();

  useFocusEffect(
    useCallback(() => {
      refetch().catch((error) => {
        console.error('Failed to refresh trips', error);
      });
    }, [refetch])
  );

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), t('common.remove'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(id);
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        padding: 24,
        paddingBottom: Math.max(insets.bottom, 16) + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-black text-textMain tracking-tighter">Viagens</Text>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/trip-planner')}
          className="bg-primary w-12 h-12 rounded-full items-center justify-center border-b-4 border-[#14833b]"
        >
          <Plus size={24} color="#121212" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<MapPin size={48} color="#B3B3B3" />}
          title="Nenhuma viagem"
          description="Planeje sua primeira viagem e veja o custo estimado."
        />
      ) : (
        <View>
          {trips.map((trip) => (
            <View key={trip.id} className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-4">
              <View className="flex-row items-center justify-between mb-3 border-b border-surfaceLight pb-3">
                <View className="flex-row items-center flex-1 pr-4">
                  <Text className="text-textMain font-bold" numberOfLines={1}>
                    {trip.origin}
                  </Text>
                  <ArrowRight size={14} color="#B3B3B3" style={{ marginHorizontal: 8 }} />
                  <Text className="text-textMain font-bold flex-1" numberOfLines={1}>
                    {trip.destination}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-black text-primary">
                    {formatCurrencyForPreferences(trip.totalCost, preferences)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(trip.id)} hitSlop={10} className="mt-2">
                    <Trash2 size={16} color="#E91429" />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-textMuted font-medium text-sm">
                  {formatDistanceForPreferences(trip.distanceKm, preferences)}
                </Text>
                <Text className="text-textMuted font-medium text-sm">
                  {trip.passengers} pessoa{trip.passengers !== 1 ? 's' : ''}
                </Text>
                <Text className="text-textMuted font-medium text-sm">
                  {new Date(trip.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
