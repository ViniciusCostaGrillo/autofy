import { FuelType, RouteEstimate } from '@/types/models';
import { supabase } from './supabase';

interface EstimateRouteInput {
  origin: string;
  destination: string;
  avgConsumptionKmL: number;
  fuelType: FuelType;
  pricingFuelType?: Extract<FuelType, 'gasoline' | 'ethanol' | 'diesel'>;
  countryCode?: string;
}

interface EstimateRouteResponse {
  data?: RouteEstimate;
  error?: string;
}

export async function estimateRoute(input: EstimateRouteInput): Promise<RouteEstimate> {
  const { data, error } = await supabase.functions.invoke('route-estimate', {
    body: input,
  });

  const payload = data as EstimateRouteResponse | null;
  if (error || !payload?.data) {
    throw new Error(payload?.error || error?.message || 'Nao foi possivel calcular a rota.');
  }

  return payload.data;
}
