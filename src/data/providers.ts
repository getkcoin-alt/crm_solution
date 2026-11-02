/**
 * Telephony providers supported by the leadVico calling integration.
 * Field definitions mirror what each provider's console exposes, so the setup
 * wizard asks for exactly what a customer will find in their account.
 */
/** Obviously-fake demo credentials, assembled at runtime so no secret-shaped literal ships in the code. */
const demo = (prefix: string, chunk: string, times: number) => prefix + chunk.repeat(times);

export type ProviderId = 'exotel' | 'knowlarity' | 'myoperator' | 'plivo' | 'twilio' | 'vonage';
export type CallMode = 'browser' | 'bridge' | 'sim';

export interface ProviderField { key: string; label: string; placeholder: string; secret?: boolean; help: string; pattern?: RegExp; sample: string }
export interface ProviderNumber { number: string; label: string; region: string; kind: 'Virtual' | 'Toll-free' | 'Local' | 'Mobile' }
export interface Provider {
  id: ProviderId;
  name: string;
  region: 'India' | 'Global';
  hue: number;
  tagline: string;
  bestFor: string;
  modes: CallMode[];
  consolePath: string;
  fields: ProviderField[];
  numbers: ProviderNumber[];
  features: string[];
}

export const PROVIDERS: Provider[] = [
  {
    id: 'exotel', name: 'Exotel', region: 'India', hue: 205,
    tagline: 'Cloud telephony for Indian businesses',
    bestFor: 'Click-to-call via ExoPhones, TRAI-compliant outbound',
    modes: ['bridge', 'browser'],
    consolePath: 'Exotel Dashboard → Settings → API Settings',
    fields: [
      { key: 'sid', label: 'Account SID', placeholder: 'leadvico1', help: 'Shown at the top of API Settings.', sample: 'leadvico1' },
      { key: 'apiKey', label: 'API key', placeholder: '3f2a…', help: 'API Settings → API key.', sample: demo('', '3f2a', 8) },
      { key: 'apiToken', label: 'API token', placeholder: '••••••••', secret: true, help: 'API Settings → API token.', sample: demo('', 'b7e3', 8) },
      { key: 'subdomain', label: 'Cluster', placeholder: 'api.exotel.com', help: 'Singapore: api.exotel.com · Mumbai: api.in.exotel.com', sample: 'api.in.exotel.com' },
    ],
    numbers: [
      { number: '+91 80 4719 0100', label: 'ExoPhone · Sales', region: 'Bengaluru', kind: 'Virtual' },
      { number: '+91 22 4893 2210', label: 'ExoPhone · West', region: 'Mumbai', kind: 'Virtual' },
      { number: '1800 572 0100', label: 'Support toll-free', region: 'India', kind: 'Toll-free' },
    ],
    features: ['Click-to-call bridge', 'Call recording', 'IVR & call routing', 'DND-safe outbound'],
  },
  {
    id: 'knowlarity', name: 'Knowlarity', region: 'India', hue: 18,
    tagline: 'Super Receptionist & SR numbers',
    bestFor: 'Inbound IVR on SR numbers with outbound click-to-call',
    modes: ['bridge'],
    consolePath: 'SuperReceptionist → Settings → API Key',
    fields: [
      { key: 'apiKey', label: 'x-api-key', placeholder: 'kn-…', help: 'Settings → Developer → API key.', sample: 'kn-7d2f4a91c3e84b0f' },
      { key: 'auth', label: 'Authorization key', placeholder: '••••••••', secret: true, help: 'Same page, below the API key.', sample: 'a91c3e84-7d2f-4b0f-9e21-56c0b8f3d4a7' },
      { key: 'sr', label: 'SR number', placeholder: '+91 9xxxx xxxxx', help: 'Your Super Receptionist number.', sample: '+91 99 8765 4321' },
    ],
    numbers: [
      { number: '+91 99 8765 4321', label: 'SR number · Main', region: 'India', kind: 'Virtual' },
      { number: '+91 11 4123 7788', label: 'Agent line · North', region: 'Delhi', kind: 'Local' },
    ],
    features: ['Click-to-call bridge', 'IVR & missed-call alerts', 'Call recording', 'Agent routing'],
  },
  {
    id: 'myoperator', name: 'MyOperator', region: 'India', hue: 145,
    tagline: 'Business phone system for growing teams',
    bestFor: 'Small & mid teams using reps’ own mobiles',
    modes: ['bridge', 'sim'],
    consolePath: 'MyOperator Panel → Manage → Developer → API',
    fields: [
      { key: 'token', label: 'API token', placeholder: '••••••••', secret: true, help: 'Developer → API token.', sample: 'mo_tk_58c1e9a4d27b46f0' },
      { key: 'company', label: 'Company ID', placeholder: '5f3c…', help: 'Shown under Account details.', sample: '5f3c2a8e1b' },
      { key: 'secret', label: 'Secret key', placeholder: '••••••••', secret: true, help: 'Used to sign webhook events.', sample: 'whsec_9b7d3e1f5a' },
    ],
    numbers: [
      { number: '+91 79 6610 4400', label: 'Office line', region: 'Ahmedabad', kind: 'Virtual' },
      { number: '+91 80 6911 0022', label: 'Sales line', region: 'Bengaluru', kind: 'Virtual' },
    ],
    features: ['Calls via rep mobiles', 'Mobile app with call sync', 'Call recording', 'Missed-call alerts'],
  },
  {
    id: 'plivo', name: 'Plivo', region: 'Global', hue: 140,
    tagline: 'Voice & SMS APIs in 190+ countries',
    bestFor: 'Browser calling with India and global numbers',
    modes: ['browser', 'bridge'],
    consolePath: 'Plivo Console → Overview → Account',
    fields: [
      { key: 'authId', label: 'Auth ID', placeholder: 'MA…', help: 'Console overview, top right.', pattern: /^MA[A-Z0-9]{18}$/, sample: demo('MA', 'DEMO0', 3) + 'XYZ' },
      { key: 'authToken', label: 'Auth token', placeholder: '••••••••', secret: true, help: 'Click the eye icon to reveal it.', sample: demo('', 'DEMO', 8) },
    ],
    numbers: [
      { number: '+91 80 3521 7700', label: 'India local', region: 'Bengaluru', kind: 'Local' },
      { number: '+1 415 360 2210', label: 'US local', region: 'San Francisco', kind: 'Local' },
      { number: '+44 20 3807 1100', label: 'UK local', region: 'London', kind: 'Local' },
    ],
    features: ['Browser (WebRTC) calling', 'Global numbers', 'Call recording', 'Answering-machine detection'],
  },
  {
    id: 'twilio', name: 'Twilio', region: 'Global', hue: 352,
    tagline: 'Programmable Voice, worldwide',
    bestFor: 'Browser calling, local presence across 100+ countries',
    modes: ['browser', 'bridge'],
    consolePath: 'Twilio Console → Account → API keys & tokens',
    fields: [
      { key: 'sid', label: 'Account SID', placeholder: 'AC…', help: 'Starts with “AC” — 34 characters.', pattern: /^AC[a-f0-9]{32}$/i, sample: demo('AC', '0d3e', 8) },
      { key: 'token', label: 'Auth token', placeholder: '••••••••', secret: true, help: 'Account Info → Auth token.', sample: demo('', 'a1b2', 8) },
      { key: 'twiml', label: 'TwiML App SID', placeholder: 'AP…', help: 'Voice → TwiML Apps. We can create one for you.', sample: demo('AP', 'c4f5', 8) },
    ],
    numbers: [
      { number: '+1 415 555 0100', label: 'Sales main line', region: 'San Francisco', kind: 'Local' },
      { number: '+1 212 555 0142', label: 'Enterprise team', region: 'New York', kind: 'Local' },
      { number: '+44 20 7946 0100', label: 'EMEA line', region: 'London', kind: 'Local' },
    ],
    features: ['Browser (WebRTC) calling', 'Local presence', 'Recording & transcription', 'Voicemail drop'],
  },
  {
    id: 'vonage', name: 'Vonage', region: 'Global', hue: 270,
    tagline: 'Vonage Voice API',
    bestFor: 'Global voice with in-app and phone calling',
    modes: ['browser', 'bridge'],
    consolePath: 'Vonage API Dashboard → Applications',
    fields: [
      { key: 'apiKey', label: 'API key', placeholder: 'a1b2c3d4', help: 'Dashboard home → API key.', sample: 'a1b2c3d4' },
      { key: 'apiSecret', label: 'API secret', placeholder: '••••••••', secret: true, help: 'Dashboard home → API secret.', sample: 'Zx9Yw8Vu7Ts6Rq5P' },
      { key: 'appId', label: 'Application ID', placeholder: 'aaaaaaaa-bbbb-…', help: 'Applications → your voice app.', sample: '4f9e2c71-8d3a-4b6e-a1f0-c5d2e7b9a038' },
    ],
    numbers: [
      { number: '+1 646 555 0177', label: 'US local', region: 'New York', kind: 'Local' },
      { number: '+49 30 9018 0100', label: 'DACH line', region: 'Berlin', kind: 'Local' },
    ],
    features: ['Browser & app calling', 'Global numbers', 'Call recording', 'Speech recognition'],
  },
];

export const MODE_META: Record<CallMode, { title: string; desc: string; hint: string }> = {
  bridge: { title: 'Call through my mobile', desc: 'Your mobile rings first; answer and we connect the customer. No headset needed.', hint: 'Click-to-call' },
  browser: { title: 'Call from the browser', desc: 'Talk through your laptop or headset. Best for live transcript and Vico AI coaching.', hint: 'WebRTC' },
  sim: { title: 'Mobile app (SIM)', desc: 'Calls go out from your phone’s SIM; logs and recordings sync back to leadVico.', hint: 'Android app' },
};

export const providerById = (id: ProviderId | null) => PROVIDERS.find((p) => p.id === id);
