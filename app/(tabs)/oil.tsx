import React, { useCallback } from 'react';
import { Alert, ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Droplets, Plus, Trash2 } from 'lucide-react-native';
import { useOilChanges } from '@/hooks/useOilChanges';
import { useVehicles } from '@/hooks/useVehicles';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePreferences } from '@/lib/PreferencesContext';
import { formatDistanceForPreferences } from '@/lib/formatting';
import { getUpcomingOilAlert } from '@/lib/oil';

export default function OilScreen() {
  const insets = useSafeAreaInsets();
  const { oilChanges, loading, refetch, deleteOilChange } = useOilChanges();
  const { vehicles } = useVehicles();
  const { preferences, t } = usePreferences();

  useFocusEffect(
    useCallback(() => {
      refetch().catch((error) => {
        console.error('Failed to refresh oil changes', error);
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
          await deleteOilChange(id);
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
        <Text className="text-3xl font-black text-textMain tracking-tighter">{t('oil.title')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/new-oil-change')}
          className="bg-primary w-12 h-12 rounded-full items-center justify-center border-b-4 border-[#14833b]"
        >
          <Plus size={24} color="#121212" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : oilChanges.length === 0 ? (
        <EmptyState
          icon={<Droplets size={48} color="#B3B3B3" />}
          title={t('oil.emptyTitle')}
          description={t('oil.emptyDescription')}
        />
      ) : (
        oilChanges.map((oilChange) => {
          const vehicle = vehicles.find((item) => item.id === oilChange.vehicleId);
          const alert = getUpcomingOilAlert([oilChange], vehicle);

          return (
            <View key={oilChange.id} className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                  <Text className="text-textMain font-black text-lg">{vehicle?.nickname || oilChange.oilName}</Text>
                  <Text className="text-textMuted font-medium mt-1">{oilChange.oilName}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(oilChange.id)} hitSlop={10}>
                  <Trash2 size={18} color="#E91429" />
                </TouchableOpacity>
              </View>
              <View className="gap-2">
                <Text className="text-textMuted text-sm">
                  {new Date(oilChange.changedAt).toLocaleDateString('pt-BR')} •{' '}
                  {formatDistanceForPreferences(oilChange.odometer, preferences)}
                </Text>
                {oilChange.nextChangeDate ? (
                  <Text className="text-textMuted text-sm">
                    {t('oil.nextByDate')}: {new Date(oilChange.nextChangeDate).toLocaleDateString('pt-BR')}
                  </Text>
                ) : null}
                {oilChange.nextChangeOdometer ? (
                  <Text className="text-textMuted text-sm">
                    {t('oil.nextByKm')}: {formatDistanceForPreferences(oilChange.nextChangeOdometer, preferences)}
                  </Text>
                ) : null}
                {alert ? (
                  <Text className={`font-bold text-sm ${alert.dueByDate || alert.dueByKm ? 'text-danger' : 'text-primary'}`}>
                    {alert.dueByDate || alert.dueByKm ? t('oil.alertDue') : t('oil.alertSoon')}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
