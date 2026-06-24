declare const Deno: any;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ANP_GASOLINE_FILE_URL =
  'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-gasolina-etanol.csv';
const ANP_DIESEL_FILE_URL =
  'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-diesel-gnv.csv';

interface GroupedData {
  sum: number;
  count: number;
  latestDate: string;
}

Deno.serve(async (request: any) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Iniciando sincronização dos preços de combustível da ANP...');

    // 1. Download and parse Gasoline/Ethanol CSV
    console.log(`Baixando dados de gasolina/etanol de: ${ANP_GASOLINE_FILE_URL}`);
    const gasolineRes = await fetch(ANP_GASOLINE_FILE_URL);
    if (!gasolineRes.ok) {
      throw new Error(`Falha ao baixar dados de gasolina/etanol (${gasolineRes.status})`);
    }
    const gasolineText = (await gasolineRes.text()).replace(/^\uFEFF/, '');
    console.log('Gasolina/Etanol baixados. Processando...');

    const grouped = new Map<string, GroupedData>();
    processCsvText(gasolineText, grouped);

    // 2. Download and parse Diesel CSV
    console.log(`Baixando dados de diesel de: ${ANP_DIESEL_FILE_URL}`);
    const dieselRes = await fetch(ANP_DIESEL_FILE_URL);
    if (!dieselRes.ok) {
      throw new Error(`Falha ao baixar dados de diesel (${dieselRes.status})`);
    }
    const dieselText = (await dieselRes.text()).replace(/^\uFEFF/, '');
    console.log('Diesel baixado. Processando...');
    processCsvText(dieselText, grouped);

    // 3. Convert grouped Map to rows
    console.log(`Agrupamento concluído. Gerando ${grouped.size} médias municipais...`);
    const upsertRows = Array.from(grouped.entries()).map(([key, data]) => {
      const [state, city, product] = key.split('|');
      return {
        state,
        city,
        product,
        price: Number((data.sum / data.count).toFixed(2)),
        week_label: data.latestDate ? formatBrazilianDate(data.latestDate) : undefined,
        updated_at: new Date().toISOString()
      };
    });

    // 4. Batch upsert to public.fuel_prices
    console.log(`Iniciando upsert de ${upsertRows.length} linhas no banco de dados em lotes de 1000...`);
    let successCount = 0;
    for (let i = 0; i < upsertRows.length; i += 1000) {
      const batch = upsertRows.slice(i, i + 1000);
      const { error } = await supabase
        .from('fuel_prices')
        .upsert(batch, { onConflict: 'state,city,product' });

      if (error) {
        console.error(`Erro ao salvar lote em fuel_prices: ${error.message}`);
        throw error;
      }
      successCount += batch.length;
      console.log(`Salvo lote ${i / 1000 + 1} (${successCount}/${upsertRows.length})`);
    }

    return new Response(JSON.stringify({ success: true, rowsSynced: upsertRows.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao sincronizar.';
    console.error(`Erro na sincronização: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processCsvText(csvText: string, grouped: Map<string, GroupedData>) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return;

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = parseCsvLine(lines[0], delimiter).map((header) => normalizeHeader(header));

  const cityIndex = findHeaderIndex(headers, ['municipio']);
  const stateIndex = findHeaderIndex(headers, ['estado_sigla', 'sigla_estado', 'estado']);
  const productIndex = findHeaderIndex(headers, ['produto']);
  const priceIndex = findHeaderIndex(headers, ['valor_de_venda', 'preco_medio_revenda', 'preco_medio']);
  const dateIndex = findHeaderIndex(headers, ['data_da_coleta', 'data_inicial', 'data_final']);

  if (cityIndex < 0 || stateIndex < 0 || productIndex < 0 || priceIndex < 0) {
    console.warn('Cabeçalhos necessários não encontrados na base ANP.');
    return;
  }

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

    const key = `${state}|${city}|${product}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.sum += price;
      existing.count += 1;
      if (date && (!existing.latestDate || date > existing.latestDate)) {
        existing.latestDate = date;
      }
    } else {
      grouped.set(key, { sum: price, count: 1, latestDate: date });
    }
  }
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

function normalizeHeader(value: string) {
  return normalizeText(value)
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function findHeaderIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.includes(header));
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function extractStateCode(value: string) {
  const upper = value.toUpperCase().trim();
  const directMatch = upper.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  return directMatch?.[1] || '';
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

function formatBrazilianDate(value: string) {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
