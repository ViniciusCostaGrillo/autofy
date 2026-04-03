const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EstimateRouteRequest {
  origin: string;
  destination: string;
  fuelPrice: number;
  avgConsumptionKmL: number;
  useTollTag: boolean;
  fuelType: 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'electric' | 'hybrid';
}

interface GoogleMoney {
  units?: string;
  nanos?: number;
  currencyCode?: string;
}

interface GoogleRouteResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    travelAdvisory?: {
      tollInfo?: {
        estimatedPrice?: GoogleMoney[];
      };
    };
  }>;
  error?: {
    message?: string;
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      return jsonResponse({ error: 'GOOGLE_MAPS_API_KEY nao configurada.' }, 500);
    }

    const body = (await request.json()) as EstimateRouteRequest;

    if (!body.origin?.trim() || !body.destination?.trim()) {
      return jsonResponse({ error: 'Origem e destino sao obrigatorios.' }, 400);
    }

    if (!Number.isFinite(body.fuelPrice) || body.fuelPrice <= 0) {
      return jsonResponse({ error: 'Preco do combustivel invalido.' }, 400);
    }

    if (!Number.isFinite(body.avgConsumptionKmL) || body.avgConsumptionKmL <= 0) {
      return jsonResponse({ error: 'Consumo medio invalido.' }, 400);
    }

    const googleResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask':
          'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo',
      },
      body: JSON.stringify({
        origin: { address: body.origin.trim() },
        destination: { address: body.destination.trim() },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
        units: 'METRIC',
        languageCode: 'pt-BR',
        regionCode: 'BR',
        extraComputations: ['TOLLS'],
        routeModifiers: {
          vehicleInfo: {
            emissionType: mapFuelTypeToEmissionType(body.fuelType),
          },
          tollPasses: body.useTollTag ? ['BR_SEM_PARAR'] : [],
        },
      }),
    });

    const routePayload = (await googleResponse.json()) as GoogleRouteResponse;

    if (!googleResponse.ok) {
      return jsonResponse(
        { error: routePayload.error?.message || 'Falha ao consultar a Google Routes API.' },
        googleResponse.status
      );
    }

    const route = routePayload.routes?.[0];
    if (!route?.distanceMeters || !route.duration) {
      return jsonResponse({ error: 'Nao foi possivel encontrar uma rota valida.' }, 422);
    }

    const distanceKm = roundTo(route.distanceMeters / 1000, 1);
    const durationMinutes = Math.max(1, Math.round(parseDurationSeconds(route.duration) / 60));
    const tollPrice = route.travelAdvisory?.tollInfo?.estimatedPrice?.[0];
    const tollCost = tollPrice ? moneyToNumber(tollPrice) : 0;
    const fuelLiters = roundTo(distanceKm / body.avgConsumptionKmL, 2);
    const fuelCost = roundTo(fuelLiters * body.fuelPrice, 2);
    const totalCost = roundTo(fuelCost + tollCost, 2);

    return jsonResponse({
      data: {
        distanceKm,
        durationMinutes,
        tollCost,
        fuelLiters,
        fuelCost,
        totalCost,
        currencyCode: tollPrice?.currencyCode || 'BRL',
        usedTollPass: body.useTollTag,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao calcular rota.';
    return jsonResponse({ error: message }, 500);
  }
});

function parseDurationSeconds(duration: string) {
  return Number(duration.replace('s', '')) || 0;
}

function moneyToNumber(money: GoogleMoney) {
  const units = Number(money.units || '0');
  const nanos = (money.nanos || 0) / 1_000_000_000;
  return roundTo(units + nanos, 2);
}

function roundTo(value: number, fractionDigits: number) {
  return Number(value.toFixed(fractionDigits));
}

function mapFuelTypeToEmissionType(fuelType: EstimateRouteRequest['fuelType']) {
  if (fuelType === 'electric') return 'ELECTRIC';
  if (fuelType === 'hybrid') return 'HYBRID';
  return 'GASOLINE';
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
