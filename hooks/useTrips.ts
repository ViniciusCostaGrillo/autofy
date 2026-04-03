import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getLocalTrips, saveLocalTrips } from '@/lib/localStore';
import { Trip } from '@/types/models';

interface MutationResult {
  error: Error | null;
}

const mapTrip = (row: any): Trip => ({
  id: row.id,
  vehicleId: row.vehicle_id || '',
  origin: row.origin || '',
  destination: row.destination || '',
  distanceKm: Number(row.distance_km) || 0,
  durationMinutes: Number(row.duration_minutes) || undefined,
  avgConsumptionUsed: Number(row.avg_consumption_used) || 0,
  fuelPriceUsed: Number(row.fuel_price_used) || 0,
  estimatedLiters: Number(row.estimated_liters) || 0,
  tollCost: Number(row.toll_cost) || 0,
  fuelCost: Number(row.fuel_cost) || 0,
  totalCost: Number(row.total_cost) || 0,
  roundTrip: row.round_trip || false,
  passengers: Number(row.passengers) || 1,
  createdAt: row.created_at,
});

export function useTrips() {
  const { session, isLocalAdmin } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isLocalAdmin) {
      const data = [...(await getLocalTrips())];
      setTrips(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setTrips([]);
      setLoading(false);
      throw error;
    }

    setTrips(data?.map(mapTrip) || []);
    setLoading(false);
  }, [isLocalAdmin, session?.user?.id]);

  useEffect(() => {
    refetch().catch((error) => {
      console.error('Failed to fetch trips', error);
    });
  }, [refetch]);

  const addTrip = async (trip: Omit<Trip, 'id' | 'createdAt'>): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (isLocalAdmin) {
      try {
        const existing = await getLocalTrips();
        const nextTrip: Trip = {
          ...trip,
          id: `trip-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        await saveLocalTrips([nextTrip, ...existing]);
        await refetch();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to save local trip'),
        };
      }
    }

    const insertPayload = {
      user_id: session.user.id,
      vehicle_id: trip.vehicleId,
      origin: trip.origin,
      destination: trip.destination,
      distance_km: trip.distanceKm,
      duration_minutes: trip.durationMinutes,
      avg_consumption_used: trip.avgConsumptionUsed,
      fuel_price_used: trip.fuelPriceUsed,
      estimated_liters: trip.estimatedLiters,
      toll_cost: trip.tollCost,
      fuel_cost: trip.fuelCost,
      total_cost: trip.totalCost,
      round_trip: trip.roundTrip,
      passengers: trip.passengers,
    };

    let { error } = await supabase.from('trips').insert(insertPayload);

    if (error && `${error.message}`.includes('duration_minutes')) {
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.duration_minutes;
      const fallbackResult = await supabase.from('trips').insert(fallbackPayload);
      error = fallbackResult.error;
    }

    if (error) {
      return { error };
    }

    await refetch();
    return { error: null };
  };

  return { trips, loading, refetch, addTrip };
}
