import { FuelType, RouteEstimate } from '@/types/models';
import { logAppError } from './errorLogger';
import { invokeMapFunction } from './mapFunctions';

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
  try {
    const payload = await invokeMapFunction<EstimateRouteResponse>('route-estimate', input);

    if (!payload.data) {
      throw new Error(payload.error || 'Não foi possível calcular a rota.');
    }

    return payload.data;
  } catch (error) {
    await logAppError('functions.route-estimate', error, {
      origin: input.origin,
      destination: input.destination,
      countryCode: input.countryCode || 'BR',
    });
    throw error;
  }
}
