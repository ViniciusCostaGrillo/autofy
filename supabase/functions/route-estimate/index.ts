const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const ANP_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const ANP_GASOLINE_FILE_URL = 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-gasolina-etanol.csv';
const ANP_DIESEL_FILE_URL = 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-diesel-gnv.csv';
const anpDatasetCache = new Map();
Deno.serve(async (request)=>{
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (request.method !== 'POST') {
    return jsonResponse({
      error: 'Method not allowed.'
    }, 405);
  }
  try {
    const openRouteServiceApiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!openRouteServiceApiKey) {
      return jsonResponse({
        error: 'Serviço de rotas não configurado.'
      }, 500);
    }
    const body = await request.json();
    const origin = sanitizePlace(body.origin);
    const destination = sanitizePlace(body.destination);
    const countryCode = sanitizeCountryCode(body.countryCode);
    if (!origin || !destination) {
      return jsonResponse({
        error: 'Origem e destino são obrigatórios.'
      }, 400);
    }
    if (!Number.isFinite(body.avgConsumptionKmL) || body.avgConsumptionKmL <= 0) {
      return jsonResponse({
        error: 'Consumo médio inválido.'
      }, 400);
    }
    const originLookup = await geocodePlace(openRouteServiceApiKey, origin, countryCode);
    const destinationLookup = await geocodePlace(openRouteServiceApiKey, destination, countryCode);
    const route = await fetchRoute(openRouteServiceApiKey, originLookup.coordinates, destinationLookup.coordinates);
    const fuelSuggestion = countryCode === 'BR' ? await getRegionalFuelSuggestion(resolvePricingFuelType(body.fuelType, body.pricingFuelType), originLookup.city || extractCityFromInput(origin), originLookup.state || extractStateFromInput(origin)) : null;
    const distanceKm = roundTo(route.distanceMeters / 1000, 1);
    const durationMinutes = Math.max(1, Math.round(route.durationSeconds / 60));
    const tollCost = 0;
    const fuelLiters = roundTo(distanceKm / body.avgConsumptionKmL, 2);
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
        distanceSource: 'openrouteservice',
        tollSource: 'manual'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao calcular rota.';
    return jsonResponse({
      error: message
    }, 500);
  }
});
async function geocodePlace(apiKey, query, countryCode) {
  const url = new URL('https://api.openrouteservice.org/geocode/search');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('text', query);
  url.searchParams.set('size', '1');
  url.searchParams.set('boundary.country', countryCode);
  url.searchParams.set('lang', countryCode === 'BR' ? 'pt-BR' : countryCode === 'ES' ? 'es' : 'en');
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Falha ao localizar a cidade informada.');
  }
  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    throw new Error('Não foi possível localizar a origem ou o destino informados.');
  }
  const properties = feature.properties || {};
  return {
    coordinates: [
      Number(coordinates[0]),
      Number(coordinates[1])
    ],
    city: firstString(properties.locality, properties.localadmin, properties.county, properties.municipality),
    state: extractStateCode(firstString(properties.region_a, properties.region, properties.macroregion, properties.label))
  };
}
async function fetchRoute(apiKey, start, end) {
  const url = new URL('https://api.openrouteservice.org/v2/directions/driving-car');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('start', `${start[0]},${start[1]}`);
  url.searchParams.set('end', `${end[0]},${end[1]}`);
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Falha ao consultar a rota.');
  }
  const summary = payload.features?.[0]?.properties?.summary;
  if (!summary?.distance || !summary?.duration) {
    throw new Error('Não foi possível encontrar uma rota válida.');
  }
  return {
    distanceMeters: summary.distance,
    durationSeconds: summary.duration
  };
}
async function getRegionalFuelSuggestion(fuelType, city, state) {
  if (fuelType === 'electric') {
    return null;
  }
  const datasetKey = fuelType === 'diesel' ? 'diesel' : 'gasoline';
  const rows = await getAnpRows(datasetKey);
  const productMatcher = getAnpProductMatcher(fuelType);
  const normalizedState = normalizeText(state || '');
  const normalizedCity = normalizeText(city || '');
  const relevantRows = rows.filter((row)=>productMatcher(row.product));
  if (relevantRows.length === 0) {
    return null;
  }
  const exactRows = relevantRows.filter((row)=>row.state === normalizedState && row.city === normalizedCity);
  const fallbackRows = relevantRows.filter((row)=>row.state === normalizedState);
  const targetRows = exactRows.length > 0 ? exactRows : fallbackRows;
  if (targetRows.length === 0) {
    return null;
  }
  const latestDate = getLatestDate(targetRows);
  const latestRows = latestDate ? targetRows.filter((row)=>row.date === latestDate) : targetRows;
  const averagePrice = latestRows.reduce((sum, row)=>sum + row.price, 0) / latestRows.length;
  return {
    suggestedFuelPrice: roundTo(averagePrice, 2),
    city: exactRows.length > 0 && normalizedCity ? toTitleCase(normalizedCity) : undefined,
    state: normalizedState || undefined,
    weekLabel: latestDate ? formatBrazilianDate(latestDate) : undefined,
    source: exactRows.length > 0 ? 'ANP, média municipal de revenda nas 4 últimas semanas' : 'ANP, média estadual de revenda nas 4 últimas semanas'
  };
}
async function getAnpRows(datasetKey) {
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
    rows
  });
  return rows;
}
function parseAnpCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line)=>line.trim());
  if (lines.length < 2) {
    return [];
  }
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header)=>normalizeHeader(header));
  const cityIndex = findHeaderIndex(headers, [
    'municipio'
  ]);
  const stateIndex = findHeaderIndex(headers, [
    'estado_sigla',
    'sigla_estado',
    'estado'
  ]);
  const productIndex = findHeaderIndex(headers, [
    'produto'
  ]);
  const priceIndex = findHeaderIndex(headers, [
    'valor_de_venda',
    'preco_medio_revenda',
    'preco_medio'
  ]);
  const dateIndex = findHeaderIndex(headers, [
    'data_da_coleta',
    'data_inicial',
    'data_final'
  ]);
  if (cityIndex < 0 || stateIndex < 0 || productIndex < 0 || priceIndex < 0) {
    return [];
  }
  const rows = [];
  for (const line of lines.slice(1)){
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
      date
    });
  }
  return rows;
}
function parseCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let insideQuotes = false;
  for(let index = 0; index < line.length; index += 1){
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
function detectDelimiter(line) {
  return line.includes(';') ? ';' : ',';
}
function normalizeHeader(value) {
  return normalizeText(value).replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}
function findHeaderIndex(headers, candidates) {
  return headers.findIndex((header)=>candidates.includes(header));
}
function getAnpProductMatcher(fuelType) {
  if (fuelType === 'ethanol') {
    return (product)=>product.includes('ETANOL');
  }
  if (fuelType === 'diesel') {
    return (product)=>product.includes('DIESEL');
  }
  return (product)=>product.includes('GASOLINA');
}
function resolvePricingFuelType(fuelType, pricingFuelType) {
  if (pricingFuelType) {
    return pricingFuelType;
  }
  if (fuelType === 'diesel') {
    return 'diesel';
  }
  if (fuelType === 'ethanol') {
    return 'ethanol';
  }
  return 'gasoline';
}
function sanitizePlace(value) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim().slice(0, 120);
}
function sanitizeCountryCode(value) {
  const normalized = `${value || 'BR'}`.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  return normalized || 'BR';
}
function extractCityFromInput(value) {
  return value.split(',')[0]?.trim() || '';
}
function extractStateFromInput(value) {
  const match = value.match(/\b([A-Z]{2})\b/i);
  return match?.[1]?.toUpperCase() || '';
}
function extractStateCode(value) {
  const input = `${value || ''}`;
  const upper = input.toUpperCase();
  const directMatch = upper.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  return directMatch?.[1] || '';
}
function normalizeText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}
function parseBrazilianNumber(value) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return Number(normalized);
}
function parseAnpDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}
function getLatestDate(rows) {
  return rows.map((row)=>row.date || '').filter(Boolean).sort().at(-1);
}
function formatBrazilianDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
function toTitleCase(value) {
  return value.toLowerCase().split(' ').filter(Boolean).map((part)=>part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function firstString(...values) {
  for (const value of values){
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}
function roundTo(value, fractionDigits) {
  return Number(value.toFixed(fractionDigits));
}
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
