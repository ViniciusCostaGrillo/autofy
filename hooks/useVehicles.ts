import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Vehicle, FuelType } from '@/types/models';

const mapVehicle = (row: any): Vehicle => ({
  id: row.id,
  userId: row.user_id || '',
  nickname: row.nickname || '',
  brand: row.brand || '',
  model: row.model || '',
  year: row.year || new Date().getFullYear(),
  fuelType: (row.fuel_type || 'flex') as FuelType,
  manualAvgConsumption: Number(row.manual_avg_consumption) || 10,
  currentOdometer: Number(row.current_odometer) || 0,
  hasTollTag: row.has_toll_tag || false,
  isDefault: row.is_default || false,
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
});

export function useVehicles() {
  const { session } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setVehicles(data?.map(mapVehicle) || []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { refetch(); }, [refetch]);

  const addVehicle = async (v: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!session?.user?.id) return;
    if (v.isDefault || vehicles.length === 0) {
      await supabase.from('vehicles').update({ is_default: false }).eq('user_id', session.user.id);
    }
    const { error } = await supabase.from('vehicles').insert({
      user_id: session.user.id,
      nickname: v.nickname,
      brand: v.brand,
      model: v.model,
      year: v.year,
      fuel_type: v.fuelType,
      manual_avg_consumption: v.manualAvgConsumption,
      current_odometer: v.currentOdometer,
      has_toll_tag: v.hasTollTag,
      is_default: v.isDefault || vehicles.length === 0,
    });
    if (!error) await refetch();
    return { error };
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    if (!session?.user?.id) return;
    const update: any = {};
    if (data.currentOdometer !== undefined) update.current_odometer = data.currentOdometer;
    if (data.isDefault !== undefined) {
      if (data.isDefault) await supabase.from('vehicles').update({ is_default: false }).eq('user_id', session.user.id);
      update.is_default = data.isDefault;
    }
    await supabase.from('vehicles').update(update).eq('id', id);
    await refetch();
  };

  const setDefault = async (id: string) => {
    if (!session?.user?.id) return;
    await supabase.from('vehicles').update({ is_default: false }).eq('user_id', session.user.id);
    await supabase.from('vehicles').update({ is_default: true }).eq('id', id);
    await refetch();
  };

  return { vehicles, loading, refetch, addVehicle, updateVehicle, setDefault };
}
