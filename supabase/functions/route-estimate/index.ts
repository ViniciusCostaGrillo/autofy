// @ts-nocheck
declare const Deno: any;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

const ANP_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const ANP_GASOLINE_FILE_URL =
  'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-gasolina-etanol.csv';
const ANP_DIESEL_FILE_URL =
  'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-diesel-gnv.csv';

const anpDatasetCache = new Map<string, { loadedAt: number; rows: AnpRow[] }>();

type EstimateFuelType = 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'electric' | 'hybrid';
type PricingFuelType = 'gasoline' | 'ethanol' | 'diesel';

interface EstimateRouteRequest {
  origin?: string;
  destination?: string;
  avgConsumptionKmL?: number;
  fuelType?: EstimateFuelType;
  pricingFuelType?: PricingFuelType;
  countryCode?: string;
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: Record<string, string>;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
  }>;
  message?: string;
}

interface AnpRow {
  city: string;
  state: string;
  product: string;
  price: number;
  date: string;
}

Deno.serve(async (request: any) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const body = (await request.json()) as EstimateRouteRequest;
    const origin = sanitizePlace(body.origin);
    const destination = sanitizePlace(body.destination);
    const countryCode = sanitizeCountryCode(body.countryCode);

    if (!origin || !destination) {
      return jsonResponse({ error: 'Origem e destino sao obrigatorios.' }, 400);
    }

    if (!Number.isFinite(body.avgConsumptionKmL) || Number(body.avgConsumptionKmL) <= 0) {
      return jsonResponse({ error: 'Consumo medio invalido.' }, 400);
    }

    const originLookup = await geocodePlace(origin, countryCode);
    const destinationLookup = await geocodePlace(destination, countryCode);
    const route = await fetchRoute(originLookup.coordinates, destinationLookup.coordinates);

    const pricingFuelType = resolvePricingFuelType(body.fuelType, body.pricingFuelType);
    const fuelSuggestion =
      countryCode === 'BR'
        ? await getRegionalFuelSuggestion(
            pricingFuelType,
            originLookup.city || extractCityFromInput(origin),
            originLookup.state || extractStateFromInput(origin)
          )
        : null;

    const distanceKm = roundTo(route.distanceMeters / 1000, 1);
    const durationMinutes = Math.max(1, Math.round(route.durationSeconds / 60));
    const tollCost = 0;
    const fuelLiters = roundTo(distanceKm / Number(body.avgConsumptionKmL), 2);
    const fuelCost = fuelSuggestion ? roundTo(fuelLiters * fuelSuggestion.suggestedFuelPrice, 2) : 0;
    const totalCost = roundTo(fuelCost + tollCost, 2);

    return jsonResponse({
      data: {
        distanceKm,
        durationMinutes,
        tollCost,
        fuelLiters,
        fuelCost,
        totalCost,
        currencyCode: countryCode === 'BR' ? 'BRL' : 'USD',
        usedTollPass: false,
        suggestedFuelPrice: fuelSuggestion?.suggestedFuelPrice,
        fuelPriceCity: fuelSuggestion?.city,
        fuelPriceState: fuelSuggestion?.state,
        fuelPriceWeekLabel: fuelSuggestion?.weekLabel,
        fuelPriceSource: fuelSuggestion?.source,
        distanceSource: 'OSRM',
        tollSource: 'manual',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao calcular rota.';
    return jsonResponse({ error: message }, 500);
  }
});

async function geocodePlace(query: string, countryCode: string) {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '5');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao localizar a cidade informada (${response.status}).`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const place = (payload.features || []).find((feature) => {
    const featureCountry = (feature.properties?.countrycode || '').toUpperCase();
    return !countryCode || !featureCountry || featureCountry === countryCode.toUpperCase();
  });

  const coordinates = place?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    throw new Error('Nao foi possivel localizar a origem ou o destino informados.');
  }

  return {
    coordinates: [Number(coordinates[0]), Number(coordinates[1])] as [number, number],
    city: firstString(
      place.properties?.city,
      place.properties?.district,
      place.properties?.county,
      place.properties?.name
    ),
    state: extractStateCode(firstString(place.properties?.state, place.properties?.country)),
  };
}

async function fetchRoute(start: [number, number], end: [number, number]) {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}`
  );
  url.searchParams.set('overview', 'false');
  url.searchParams.set('alternatives', 'false');
  url.searchParams.set('steps', 'false');

  const response = await fetch(url);
  const payload = (await response.json()) as OsrmRouteResponse;
  if (!response.ok || payload.code !== 'Ok') {
    throw new Error(payload.message || `Falha ao consultar a rota (${response.status}).`);
  }

  const route = payload.routes?.[0];
  if (!route?.distance || !route?.duration) {
    throw new Error('Nao foi possivel encontrar uma rota valida.');
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

async function getRegionalFuelSuggestion(
  fuelType: PricingFuelType | 'electric',
  city: string,
  state: string
) {
  if (fuelType === 'electric') {
    return null;
  }

  const normalizedState = normalizeText(state || '');
  const normalizedCity = normalizeText(city || '');
  const productKeyword = fuelType === 'ethanol' ? 'ETANOL' : fuelType === 'diesel' ? 'DIESEL' : 'GASOLINA';

  try {
    // 1. Try to find the exact city and state in the fuel_prices database table
    const { data: cityRows, error: cityError } = await supabaseClient
      .from('fuel_prices')
      .select('price, week_label')
      .eq('state', normalizedState)
      .eq('city', normalizedCity)
      .ilike('product', `%${productKeyword}%`);

    if (cityError) throw cityError;

    if (cityRows && cityRows.length > 0) {
      const avgPrice = cityRows.reduce((sum: number, row: any) => sum + Number(row.price), 0) / cityRows.length;
      const latestDate = cityRows[0]?.week_label;
      return {
        suggestedFuelPrice: roundTo(avgPrice, 2),
        city: toTitleCase(normalizedCity),
        state: normalizedState,
        weekLabel: latestDate || undefined,
        source: 'ANP, media municipal de revenda (cache de banco de dados)',
      };
    }

    // 2. Fallback to state average from cached database rows
    const { data: stateRows, error: stateError } = await supabaseClient
      .from('fuel_prices')
      .select('price, week_label')
      .eq('state', normalizedState)
      .ilike('product', `%${productKeyword}%`);

    if (stateError) throw stateError;

    if (stateRows && stateRows.length > 0) {
      const avgPrice = stateRows.reduce((sum: number, row: any) => sum + Number(row.price), 0) / stateRows.length;
      const latestDate = stateRows[0]?.week_label;
      return {
        suggestedFuelPrice: roundTo(avgPrice, 2),
        city: undefined,
        state: normalizedState,
        weekLabel: latestDate || undefined,
        source: 'ANP, media estadual de revenda (cache de banco de dados)',
      };
    }
  } catch (dbError) {
    const err = dbError as any;
    console.error(`Erro ao consultar cache do banco: ${err?.message || err}. Usando fallback offline/CSV.`);
  }

  // 3. Fallback to the original method (online CSV download and parse)
  console.log('Utilizando fallback de download de CSV da ANP...');
  const datasetKey = fuelType === 'diesel' ? 'diesel' : 'gasoline';
  try {
    const rows = await getAnpRows(datasetKey);
    const productMatcher = getAnpProductMatcher(fuelType);
    const relevantRows = rows.filter((row) => productMatcher(row.product));

    if (relevantRows.length === 0) {
      return null;
    }

    const exactRows = relevantRows.filter(
      (row) => row.state === normalizedState && row.city === normalizedCity
    );
    const fallbackRows = relevantRows.filter((row) => row.state === normalizedState);
    const targetRows = exactRows.length > 0 ? exactRows : fallbackRows;

    if (targetRows.length === 0) {
      return null;
    }

    const latestDate = getLatestDate(targetRows);
    const latestRows = latestDate ? targetRows.filter((row) => row.date === latestDate) : targetRows;
    const averagePrice = latestRows.reduce((sum, row) => sum + row.price, 0) / latestRows.length;

    return {
      suggestedFuelPrice: roundTo(averagePrice, 2),
      city: exactRows.length > 0 && normalizedCity ? toTitleCase(normalizedCity) : undefined,
      state: normalizedState || undefined,
      weekLabel: latestDate ? formatBrazilianDate(latestDate) : undefined,
      source:
        exactRows.length > 0
          ? 'ANP, media municipal de revenda nas 4 ultimas semanas (CSV fallback)'
          : 'ANP, media estadual de revenda nas 4 ultimas semanas (CSV fallback)',
    };
  } catch (fallbackError) {
    const err = fallbackError as any;
    console.error(`Falha no fallback de download do CSV: ${err?.message || err}`);
    return null;
  }
}

async function getAnpRows(datasetKey: 'gasoline' | 'diesel') {
  const cached = anpDatasetCache.get(datasetKey);
  if (cached && Date.now() - cached.loadedAt < ANP_CACHE_TTL_MS) {
    return cached.rows;
  }

  const datasetUrl = datasetKey === 'diesel' ? ANP_DIESEL_FILE_URL : ANP_GASOLINE_FILE_URL;
  const response = await fetch(datasetUrl);
  if (!response.ok) {
    throw new Error('Falha ao consultar a base oficial da ANP.');
  }

  const csvText = (await response.text()).replace(/^\uFEFF/, '');
  const rows = parseAnpCsv(csvText);
  anpDatasetCache.set(datasetKey, {
    loadedAt: Date.now(),
    rows,
  });

  return rows;
}

function parseAnpCsv(csvText: string): AnpRow[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => normalizeHeader(header));
  const cityIndex = findHeaderIndex(headers, ['municipio']);
  const stateIndex = findHeaderIndex(headers, ['estado_sigla', 'sigla_estado', 'estado']);
  const productIndex = findHeaderIndex(headers, ['produto']);
  const priceIndex = findHeaderIndex(headers, [
    'valor_de_venda',
    'preco_medio_revenda',
    'preco_medio',
  ]);
  const dateIndex = findHeaderIndex(headers, ['data_da_coleta', 'data_inicial', 'data_final']);

  if (cityIndex < 0 || stateIndex < 0 || productIndex < 0 || priceIndex < 0) {
    return [];
  }

  const rows: AnpRow[] = [];

  for (const line of lines.slice(1)) {
    const columns = parseCsvLine(line, delimiter);
    const city = normalizeText(columns[cityIndex] || '');
    const state = extractStateCode(columns[stateIndex] || '');
    const product = normalizeText(columns[productIndex] || '');
    const price = parseBrazilianNumber(columns[priceIndex] || '');
    const date = parseAnpDate(columns[dateIndex] || '');

    if (!city || !state || !product || !Number.isFinite(price) || price <= 0) {
      continue;
    }

    rows.push({
      city,
      state,
      product,
      price,
      date,
    });
  }

  return rows;
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === delimiter && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function detectDelimiter(line: string) {
  return line.includes(';') ? ';' : ',';
}

function normalizeHeader(value: string) {
  return normalizeText(value)
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function findHeaderIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.includes(header));
}

function getAnpProductMatcher(fuelType: PricingFuelType) {
  if (fuelType === 'ethanol') {
    return (product: string) => product.includes('ETANOL');
  }

  if (fuelType === 'diesel') {
    return (product: string) => product.includes('DIESEL');
  }

  return (product: string) => product.includes('GASOLINA');
}

function resolvePricingFuelType(
  fuelType?: EstimateFuelType,
  pricingFuelType?: PricingFuelType
): PricingFuelType | 'electric' {
  if (pricingFuelType) {
    return pricingFuelType;
  }

  if (fuelType === 'diesel') {
    return 'diesel';
  }

  if (fuelType === 'ethanol') {
    return 'ethanol';
  }

  if (fuelType === 'electric') {
    return 'electric';
  }

  return 'gasoline';
}

function sanitizePlace(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function sanitizeCountryCode(value: unknown) {
  const normalized = `${value || 'BR'}`
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);

  return normalized || 'BR';
}

function extractCityFromInput(value: string) {
  return value.split(',')[0]?.trim() || '';
}

function extractStateFromInput(value: string) {
  const match = value.match(/\b([A-Z]{2})\b/i);
  return match?.[1]?.toUpperCase() || '';
}

function extractStateCode(value: string) {
  const input = `${value || ''}`;
  const upper = input.toUpperCase();
  const directMatch = upper.match(
    /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/
  );
  return directMatch?.[1] || '';
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function parseBrazilianNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return Number(normalized);
}

function parseAnpDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function getLatestDate(rows: AnpRow[]) {
  return rows
    .map((row) => row.date || '')
    .filter(Boolean)
    .sort()
    .at(-1);
}

function formatBrazilianDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function firstString(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function roundTo(value: number, fractionDigits: number) {
  return Number(value.toFixed(fractionDigits));
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
