import React, { useCallback } from 'react';
import { Alert, ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, CircleDollarSign, Droplets, Plus, Shield, Trash2, Wrench } from 'lucide-react-native';
import { useVehicles } from '@/hooks/useVehicles';
import { useOilChanges } from '@/hooks/useOilChanges';
import { useMaintenanceExpenses } from '@/hooks/useMaintenanceExpenses';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { getMaintenanceCategoryLabels, usePreferences } from '@/lib/PreferencesContext';
import {
  formatCurrencyForPreferences,
  formatDistanceForPreferences,
  localeForPreferences,
} from '@/lib/formatting';
import { getMaintenanceLast30DaysTotal, getMaintenanceMonthlyAverage } from '@/lib/maintenance';
import { getUpcomingOilAlert } from '@/lib/oil';

export default function MaintenanceScreen() {
  const insets = useSafeAreaInsets();
  const { vehicles, refetch: refetchVehicles } = useVehicles();
  const { oilChanges, loading: oilLoading, refetch: refetchOilChanges, deleteOilChange } = useOilChanges();
  const {
    expenses,
    loading: expensesLoading,
    refetch: refetchExpenses,
    deleteExpense,
  } = useMaintenanceExpenses();
  const { preferences, t } = usePreferences();
  const categoryLabels = getMaintenanceCategoryLabels(t);
  const defaultVehicle = vehicles.find((item) => item.isDefault) || vehicles[0];

  useFocusEffect(
    useCallback(() => {
      Promise.allSettled([refetchVehicles(), refetchOilChanges(), refetchExpenses()]).catch(() => undefined);
    }, [refetchExpenses, refetchOilChanges, refetchVehicles])
  );

  const vehicleOilChanges = defaultVehicle
    ? oilChanges.filter((item) => item.vehicleId === defaultVehicle.id)
    : [];
  const vehicleExpenses = defaultVehicle
    ? expenses.filter((item) => item.vehicleId === defaultVehicle.id)
    : [];
  const oilAlert = getUpcomingOilAlert(vehicleOilChanges, defaultVehicle);
  const last30DaysTotal = getMaintenanceLast30DaysTotal(expenses, defaultVehicle?.id);
  const monthlyAverage = getMaintenanceMonthlyAverage(expenses, defaultVehicle?.id);
  const loading = oilLoading || expensesLoading;

  const handleDeleteOil = (id: string) => {
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

  const handleDeleteExpense = (id: string) => {
    Alert.alert(t('common.delete'), t('common.remove'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
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
        <Text className="text-3xl font-black text-textMain tracking-tighter">{t('maintenance.title')}</Text>
      </View>

      {!defaultVehicle ? (
        <EmptyState
          icon={<Wrench size={48} color="#B3B3B3" />}
          title={t('maintenance.emptyTitle')}
          description={t('maintenance.noVehicle')}
        />
      ) : (
        <>
          <View className="mb-6 p-5 bg-surface rounded-3xl border border-surfaceLight">
            <Text className="text-xs font-bold uppercase tracking-widest text-textMuted mb-1">Veículo atual</Text>
            <Text className="text-textMain font-black text-xl">{defaultVehicle.nickname}</Text>
            <Text className="text-textMuted mt-1">
              {defaultVehicle.brand} {defaultVehicle.model} • {defaultVehicle.year}
            </Text>
          </View>

          <View className="flex-row gap-4 mb-6">
            <StatCard
              title={t('maintenance.last30DaysTotal')}
              value={formatCurrencyForPreferences(last30DaysTotal, preferences)}
              icon={<CircleDollarSign size={16} color="#1DB954" />}
            />
            <StatCard
              title={t('maintenance.monthlyAverage')}
              value={formatCurrencyForPreferences(monthlyAverage, preferences)}
              icon={<Shield size={16} color="#3B82F6" />}
            />
          </View>

          <View className="mb-6 bg-surface rounded-3xl p-5 border border-surfaceLight">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-textMuted text-xs font-bold uppercase tracking-widest mb-2">
                  {t('maintenance.nextOilAlert')}
                </Text>
                {oilAlert ? (
                  <>
                    <Text
                      className={`font-black text-lg ${
                        oilAlert.dueByDate || oilAlert.dueByKm ? 'text-danger' : 'text-primary'
                      }`}
                    >
                      {oilAlert.dueByDate || oilAlert.dueByKm ? t('maintenance.alertDue') : t('maintenance.alertSoon')}
                    </Text>
                    <Text className="text-textMuted mt-2">
                      {oilAlert.oilChange.oilName}
                      {oilAlert.remainingKm !== null
                        ? ` • ${formatDistanceForPreferences(oilAlert.remainingKm, preferences)} restantes`
                        : ''}
                    </Text>
                    {oilAlert.oilChange.nextChangeDate ? (
                      <Text className="text-textMuted mt-1">
                        {t('maintenance.nextByDate')}:{' '}
                        {new Date(oilAlert.oilChange.nextChangeDate).toLocaleDateString(
                          localeForPreferences(preferences)
                        )}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text className="text-textMuted">{t('maintenance.noUpcomingOil')}</Text>
                )}
              </View>
              <View className="bg-surfaceLight p-3 rounded-2xl">
                <CalendarClock size={22} color="#B3B3B3" />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => router.push('/(modals)/new-oil-change')}
              className="flex-1 bg-primary rounded-full items-center justify-center py-4 border-b-4 border-[#14833b]"
            >
              <Text className="text-background font-black text-sm uppercase tracking-wider">
                {t('maintenance.newOil')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(modals)/new-maintenance-expense')}
              className="flex-1 bg-surface rounded-full items-center justify-center py-4 border border-surfaceLight"
            >
              <Text className="text-textMain font-black text-sm uppercase tracking-wider">
                {t('maintenance.newExpense')}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#1DB954" />
            </View>
          ) : vehicleOilChanges.length === 0 && vehicleExpenses.length === 0 ? (
            <EmptyState
              icon={<Wrench size={48} color="#B3B3B3" />}
              title={t('maintenance.emptyTitle')}
              description={t('maintenance.emptyDescription')}
            />
          ) : (
            <>
              <Text className="text-textMain font-black text-xl tracking-tight mb-4 ml-1">
                {t('maintenance.sectionOil')}
              </Text>
              {vehicleOilChanges.length === 0 ? (
                <Text className="text-textMuted mb-6">{t('maintenance.noUpcomingOil')}</Text>
              ) : (
                vehicleOilChanges.map((oilChange) => {
                  const alert = getUpcomingOilAlert([oilChange], defaultVehicle);

                  return (
                    <View key={oilChange.id} className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-4">
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1 pr-4">
                          <Text className="text-textMain font-black text-lg">{oilChange.oilName}</Text>
                          <Text className="text-textMuted font-medium mt-1">
                            {new Date(oilChange.changedAt).toLocaleDateString(localeForPreferences(preferences))} •{' '}
                            {formatDistanceForPreferences(oilChange.odometer, preferences)}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteOil(oilChange.id)} hitSlop={10}>
                          <Trash2 size={18} color="#E91429" />
                        </TouchableOpacity>
                      </View>
                      {oilChange.nextChangeDate ? (
                        <Text className="text-textMuted text-sm">
                          {t('maintenance.nextByDate')}:{' '}
                          {new Date(oilChange.nextChangeDate).toLocaleDateString(localeForPreferences(preferences))}
                        </Text>
                      ) : null}
                      {oilChange.nextChangeOdometer ? (
                        <Text className="text-textMuted text-sm mt-1">
                          {t('maintenance.nextByKm')}:{' '}
                          {formatDistanceForPreferences(oilChange.nextChangeOdometer, preferences)}
                        </Text>
                      ) : null}
                      {alert ? (
                        <Text
                          className={`font-bold text-sm mt-2 ${
                            alert.dueByDate || alert.dueByKm ? 'text-danger' : 'text-primary'
                          }`}
                        >
                          {alert.dueByDate || alert.dueByKm ? t('maintenance.alertDue') : t('maintenance.alertSoon')}
                        </Text>
                      ) : null}
                    </View>
                  );
                })
              )}

              <Text className="text-textMain font-black text-xl tracking-tight mb-4 mt-2 ml-1">
                {t('maintenance.sectionExpenses')}
              </Text>
              {vehicleExpenses.length === 0 ? (
                <Text className="text-textMuted">{t('maintenance.noExpenses')}</Text>
              ) : (
                vehicleExpenses.map((expense) => (
                  <View key={expense.id} className="bg-surface rounded-3xl p-5 border border-surfaceLight mb-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 pr-4">
                        <Text className="text-textMain font-black text-lg">{expense.title}</Text>
                        <Text className="text-textMuted font-medium mt-1">
                          {categoryLabels[expense.category]} •{' '}
                          {new Date(expense.date).toLocaleDateString(localeForPreferences(preferences))}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteExpense(expense.id)} hitSlop={10}>
                        <Trash2 size={18} color="#E91429" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-primary font-black text-lg mb-1">
                      {formatCurrencyForPreferences(expense.amount, preferences)}
                    </Text>
                    {expense.isRecurring ? (
                      <Text className="text-textMuted text-sm">
                        {t('maintenance.recurring')}: {formatCurrencyForPreferences(expense.monthlyAmount, preferences)}
                        /mês • {expense.recurrenceMonths} meses
                      </Text>
                    ) : null}
                    {expense.notes ? <Text className="text-textMuted text-sm mt-2">{expense.notes}</Text> : null}
                  </View>
                ))
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
