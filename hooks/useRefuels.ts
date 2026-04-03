import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getLocalRefuels, saveLocalRefuels } from '@/lib/localStore';
import { Refuel, FuelType } from '@/types/models';

interface MutationResult {
  error: Error | null;
}

const mapRefuel = (row: any): Refuel => ({
  id: row.id,
  vehicleId: row.vehicle_id || '',
  date: row.date || row.created_at,
  odometer: Number(row.odometer) || 0,
  liters: Number(row.liters) || 0,
  totalPrice: Number(row.total_price) || 0,
  pricePerLiter: Number(row.price_per_liter) || 0,
  fuelType: (row.fuel_type || 'flex') as FuelType,
  fullTank: row.full_tank ?? true,
  gasStation: row.gas_station,
  createdAt: row.created_at,
});

export function useRefuels() {
  const { session, isLocalAdmin } = useAuth();
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) {
      setRefuels([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isLocalAdmin) {
      const data = [...(await getLocalRefuels())];
      setRefuels(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('refuels')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setRefuels([]);
      setLoading(false);
      throw error;
    }

    setRefuels(data?.map(mapRefuel) || []);
    setLoading(false);
  }, [isLocalAdmin, session?.user?.id]);

  useEffect(() => {
    refetch().catch((error) => {
      console.error('Failed to fetch refuels', error);
    });
  }, [refetch]);

  const addRefuel = async (refuel: Omit<Refuel, 'id' | 'createdAt'>): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (isLocalAdmin) {
      try {
        const existing = await getLocalRefuels();
        const nextRefuel: Refuel = {
          ...refuel,
          id: `refuel-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        await saveLocalRefuels([nextRefuel, ...existing]);
        await refetch();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to save local refuel'),
        };
      }
    }

    const { error } = await supabase.from('refuels').insert({
      user_id: session.user.id,
      vehicle_id: refuel.vehicleId,
      date: refuel.date,
      odometer: refuel.odometer,
      liters: refuel.liters,
      total_price: refuel.totalPrice,
      price_per_liter: refuel.pricePerLiter,
      fuel_type: refuel.fuelType,
      full_tank: refuel.fullTank,
      gas_station: refuel.gasStation,
    });

    if (error) {
      return { error };
    }

    await refetch();
    return { error: null };
  };

  const deleteRefuel = async (id: string): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (isLocalAdmin) {
      try {
        const existing = await getLocalRefuels();
        await saveLocalRefuels(existing.filter((item) => item.id !== id));
        await refetch();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to delete local refuel'),
        };
      }
    }

    const { error } = await supabase.from('refuels').delete().eq('id', id).eq('user_id', session.user.id);

    if (error) {
      return { error };
    }

    await refetch();
    return { error: null };
  };

  return { refuels, loading, refetch, addRefuel, deleteRefuel };
}
