import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getLocalVehicles, saveLocalVehicles } from '@/lib/localStore';
import { Vehicle, FuelType } from '@/types/models';

interface MutationResult {
  error: Error | null;
}

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
  const { session, isLocalAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isLocalAdmin) {
      const data = [...(await getLocalVehicles())];
      setVehicles(
        data.sort(
          (a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt.localeCompare(a.createdAt)
        )
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setVehicles([]);
      setLoading(false);
      throw error;
    }

    setVehicles(data?.map(mapVehicle) || []);
    setLoading(false);
  }, [isLocalAdmin, session?.user?.id]);

  useEffect(() => {
    refetch().catch((error) => {
      console.error('Failed to fetch vehicles', error);
    });
  }, [refetch]);

  const addVehicle = async (
    vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (isLocalAdmin) {
      try {
        const existing = await getLocalVehicles();
        const now = new Date().toISOString();
        const nextVehicle: Vehicle = {
          id: `vehicle-${Date.now()}`,
          userId: session.user.id,
          nickname: vehicle.nickname,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          fuelType: vehicle.fuelType,
          manualAvgConsumption: vehicle.manualAvgConsumption,
          currentOdometer: vehicle.currentOdometer,
          hasTollTag: vehicle.hasTollTag,
          isDefault: vehicle.isDefault || existing.length === 0,
          createdAt: now,
          updatedAt: now,
        };

        const updated = existing
          .map((item) => ({
            ...item,
            isDefault: nextVehicle.isDefault ? false : item.isDefault,
          }))
          .concat(nextVehicle);

        await saveLocalVehicles(updated);
        await refetch();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to save local vehicle'),
        };
      }
    }

    if (vehicle.isDefault || vehicles.length === 0) {
      const resetDefaultResult = await supabase
        .from('vehicles')
        .update({ is_default: false })
        .eq('user_id', session.user.id);

      if (resetDefaultResult.error) {
        return { error: resetDefaultResult.error };
      }
    }

    const { error } = await supabase.from('vehicles').insert({
      user_id: session.user.id,
      nickname: vehicle.nickname,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuel_type: vehicle.fuelType,
      manual_avg_consumption: vehicle.manualAvgConsumption,
      current_odometer: vehicle.currentOdometer,
      has_toll_tag: vehicle.hasTollTag,
      is_default: vehicle.isDefault || vehicles.length === 0,
    });

    if (error) {
      return { error };
    }

    await refetch();
    return { error: null };
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (isLocalAdmin) {
      try {
        const existing = await getLocalVehicles();
        const updated = existing.map((item) => {
          if (item.id !== id) {
            return data.isDefault ? { ...item, isDefault: false } : item;
          }

          return {
            ...item,
            currentOdometer: data.currentOdometer ?? item.currentOdometer,
            isDefault: data.isDefault ?? item.isDefault,
            updatedAt: new Date().toISOString(),
          };
        });

        await saveLocalVehicles(updated);
        await refetch();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to update local vehicle'),
        };
      }
    }

    const update: Record<string, unknown> = {};

    if (data.currentOdometer !== undefined) {
      update.current_odometer = data.currentOdometer;
    }

    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        const resetDefaultResult = await supabase
          .from('vehicles')
          .update({ is_default: false })
          .eq('user_id', session.user.id);

        if (resetDefaultResult.error) {
          return { error: resetDefaultResult.error };
        }
      }

      update.is_default = data.isDefault;
    }

    const { error } = await supabase.from('vehicles').update(update).eq('id', id);

    if (error) {
      return { error };
    }

    await refetch();
    return { error: null };
  };

  const setDefault = async (id: string): Promise<MutationResult> => {
    return updateVehicle(id, { isDefault: true });
  };

  const deleteVehicle = async (id: string): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (isLocalAdmin) {
      try {
        const existing = await getLocalVehicles();
        const target = existing.find((item) => item.id === id);
        if (!target) {
          return { error: new Error('Vehicle not found') };
        }

        const remaining = existing.filter((item) => item.id !== id);
        if (target.isDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isDefault: true, updatedAt: new Date().toISOString() };
        }

        await saveLocalVehicles(remaining);
        await refetch();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to delete local vehicle'),
        };
      }
    }

    const target = vehicles.find((item) => item.id === id);
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      return { error };
    }

    if (target?.isDefault) {
      const nextDefault = vehicles.find((item) => item.id !== id);
      if (nextDefault) {
        const defaultResult = await supabase
          .from('vehicles')
          .update({ is_default: true })
          .eq('id', nextDefault.id)
          .eq('user_id', session.user.id);

        if (defaultResult.error) {
          return { error: defaultResult.error };
        }
      }
    }

    await refetch();
    return { error: null };
  };

  return { vehicles, loading, refetch, addVehicle, updateVehicle, setDefault, deleteVehicle };
}
