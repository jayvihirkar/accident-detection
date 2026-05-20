type AccidentEvent = {
  id?: string;
  type?: string;
  severity?: string;
  impact_magnitude?: number;
  lat?: number | null;
  lng?: number | null;
  speed?: number | null;
  satellites?: number | null;
  timestamp?: number;
  device_id?: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: AccidentEvent;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-crash-sms-secret',
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatTimestamp(timestamp?: number) {
  if (!isFiniteNumber(timestamp)) {
    return 'unknown time';
  }

  return new Date(timestamp * 1000).toISOString();
}

function mapLink(event: AccidentEvent) {
  if (!isFiniteNumber(event.lat) || !isFiniteNumber(event.lng)) {
    return null;
  }

  return `https://www.google.com/maps?q=${event.lat},${event.lng}`;
}

function smsBody(event: AccidentEvent) {
  const location = mapLink(event);
  const locationLine = location ? `Location: ${location}` : 'Location: GPS unavailable';
  const speed = isFiniteNumber(event.speed) ? `${event.speed} km/h` : 'unknown speed';
  const impact = isFiniteNumber(event.impact_magnitude)
    ? `${event.impact_magnitude.toFixed(2)}g`
    : 'unknown impact';

  return [
    'CRASH DETECTED',
    `Vehicle: ${event.device_id || 'unknown'}`,
    `Severity: ${event.severity || 'UNKNOWN'}`,
    `Impact: ${impact}`,
    `Speed: ${speed}`,
    `Time: ${formatTimestamp(event.timestamp)}`,
    locationLine,
  ].join('\n');
}

async function sendSms(to: string, body: string) {
  const accountSid = requiredEnv('TWILIO_ACCOUNT_SID');
  const authToken = requiredEnv('TWILIO_AUTH_TOKEN');
  const from = requiredEnv('TWILIO_FROM_NUMBER');

  const form = new URLSearchParams();
  form.set('From', from);
  form.set('To', to);
  form.set('Body', body);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || `Twilio request failed with ${response.status}`);
  }

  return data?.sid;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  const webhookSecret = requiredEnv('CRASH_SMS_WEBHOOK_SECRET');
  if (request.headers.get('x-crash-sms-secret') !== webhookSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  try {
    const payload = (await request.json()) as WebhookPayload;
    const event = payload.record;

    if (payload.table !== 'accident_events' || !event) {
      return Response.json(
        { error: 'Expected an accident_events webhook payload' },
        { status: 400, headers: corsHeaders },
      );
    }

    const recipients = requiredEnv('ALERT_TO_NUMBERS')
      .split(',')
      .map((number) => number.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      throw new Error('ALERT_TO_NUMBERS must contain at least one phone number');
    }

    const body = smsBody(event);
    const messageSids = await Promise.all(recipients.map((to) => sendSms(to, body)));

    return Response.json({ ok: true, messageSids }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
