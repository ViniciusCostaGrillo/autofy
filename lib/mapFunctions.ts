import { supabaseAnonKey, supabaseUrl } from './supabase';

export async function invokeMapFunction<TResponse>(name: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  const payload = safeParsePayload<TResponse>(rawText);

  if (!response.ok) {
    throw new Error(payload.error || `Falha ao consultar o servidor (${response.status}).`);
  }

  return payload;
}

function safeParsePayload<TResponse>(rawText: string) {
  if (!rawText) {
    return {} as TResponse & { error?: string };
  }

  try {
    return JSON.parse(rawText) as TResponse & { error?: string };
  } catch {
    return { error: rawText } as TResponse & { error?: string };
  }
}
