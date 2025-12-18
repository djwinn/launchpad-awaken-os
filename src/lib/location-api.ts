// Helper functions for API calls using location_id authentication

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ApiOptions {
  locationId: string;
  body?: unknown;
  formData?: FormData;
}

export async function callEdgeFunction(
  functionName: string,
  options: ApiOptions
): Promise<Response> {
  const { locationId, body, formData } = options;

  if (!locationId) {
    throw new Error('Location ID required');
  }

  const headers: Record<string, string> = {
    'X-Location-ID': locationId,
  };

  let requestBody: string | FormData | undefined;

  if (formData) {
    requestBody = formData;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: requestBody,
  });

  return response;
}

export async function transcribeAudio(
  locationId: string,
  audioBase64: string
): Promise<{ text?: string; error?: string }> {
  const response = await callEdgeFunction('transcribe', {
    locationId,
    body: { audio: audioBase64 },
  });

  return response.json();
}

export async function parseDocument(
  locationId: string,
  file: File
): Promise<{ text?: string; fileName?: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await callEdgeFunction('parse-document', {
    locationId,
    formData,
  });

  return response.json();
}

export async function extractFunnelContext(
  locationId: string,
  content: string
): Promise<{ extracted?: unknown; error?: string }> {
  const response = await callEdgeFunction('extract-funnel-context', {
    locationId,
    body: { content },
  });

  return response.json();
}
