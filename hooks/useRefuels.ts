import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Refuel, FuelType } from '@/types/models';

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
  const { session } = useAuth();
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('refuels')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setRefuels(data?.map(mapRefuel) || []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { refetch(); }, [refetch]);

  const addRefuel = async (refuel: Omit<Refuel, 'id' | 'createdAt'>) => {
    if (!session?.user?.id) return;
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
    if (!error) await refetch();
    return { error };
  };

  return { refuels, loading, refetch, addRefuel };
}
