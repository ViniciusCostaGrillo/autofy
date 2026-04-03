import { FuelType, RouteEstimate } from '@/types/models';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface EstimateRouteInput {
  origin: string;
  destination: string;
  fuelPrice: number;
  avgConsumptionKmL: number;
  useTollTag: boolean;
  fuelType: FuelType;
}

interface EstimateRouteResponse {
  data?: RouteEstimate;
  error?: string;
}

export async function estimateRoute(input: EstimateRouteInput): Promise<RouteEstimate> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars missing for route estimate.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/route-estimate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as EstimateRouteResponse;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || 'Nao foi possivel calcular a rota.');
  }

  return payload.data;
}
