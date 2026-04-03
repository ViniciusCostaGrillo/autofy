import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Trip } from '@/types/models';

const mapTrip = (row: any): Trip => ({
  id: row.id,
  vehicleId: row.vehicle_id || '',
  origin: row.origin || '',
  destination: row.destination || '',
  distanceKm: Number(row.distance_km) || 0,
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
  const { session } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setTrips(data?.map(mapTrip) || []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { refetch(); }, [refetch]);

  const addTrip = async (trip: Omit<Trip, 'id' | 'createdAt'>) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('trips').insert({
      user_id: session.user.id,
      vehicle_id: trip.vehicleId,
      origin: trip.origin,
      destination: trip.destination,
      distance_km: trip.distanceKm,
      avg_consumption_used: trip.avgConsumptionUsed,
      fuel_price_used: trip.fuelPriceUsed,
      estimated_liters: trip.estimatedLiters,
      toll_cost: trip.tollCost,
      fuel_cost: trip.fuelCost,
      total_cost: trip.totalCost,
      round_trip: trip.roundTrip,
      passengers: trip.passengers,
    });
    if (!error) await refetch();
    return { error };
  };

  return { trips, loading, refetch, addTrip };
}
