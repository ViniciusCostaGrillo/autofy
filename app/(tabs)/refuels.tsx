import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fuel, Plus, Trash2 } from 'lucide-react-native';
import { useRefuels } from '@/hooks/useRefuels';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePreferences } from '@/lib/PreferencesContext';
import { formatCurrencyForPreferences, formatDistanceForPreferences } from '@/lib/formatting';

export default function RefuelsScreen() {
  const insets = useSafeAreaInsets();
  const { refuels, loading, refetch, deleteRefuel } = useRefuels();
  const { preferences, t } = usePreferences();

  useFocusEffect(
    useCallback(() => {
      refetch().catch((error) => {
        console.error('Failed to refresh refuels', error);
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
          await deleteRefuel(id);
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
        <Text className="text-3xl font-black text-textMain tracking-tighter">Abastecimentos</Text>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/new-refuel')}
          className="bg-primary w-12 h-12 rounded-full items-center justify-center border-b-4 border-[#14833b]"
        >
          <Plus size={24} color="#121212" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : refuels.length === 0 ? (
        <EmptyState
          icon={<Fuel size={48} color="#B3B3B3" />}
          title="Nenhum abastecimento"
          description="Registre seu primeiro abastecimento para acompanhar seus gastos."
        />
      ) : (
        <View>
          {refuels.map((refuel) => (
            <View key={refuel.id} className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-4">
              <View className="flex-row items-center justify-between mb-3 border-b border-surfaceLight pb-3">
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mr-3">
                    <Fuel size={18} color="#1DB954" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textMain font-bold" numberOfLines={1}>
                      {refuel.gasStation || 'Posto desconhecido'}
                    </Text>
                    <Text className="text-textMuted text-xs font-medium mt-0.5">
                      Odometro: {formatDistanceForPreferences(refuel.odometer, preferences)}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-black text-primary">
                    {formatCurrencyForPreferences(refuel.totalPrice, preferences)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(refuel.id)} hitSlop={10} className="mt-2">
                    <Trash2 size={16} color="#E91429" />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-textMuted font-medium text-sm">{refuel.liters.toFixed(1)} L</Text>
                <Text className="text-textMuted font-medium text-sm">
                  {formatCurrencyForPreferences(refuel.pricePerLiter, preferences)}/L
                </Text>
                <Text className="text-textMuted font-medium text-sm">
                  {new Date(refuel.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
