import type {
  Activity, Call, Company, Contact, Deal, Disposition, Lead, LeadSource, LeadStatus, Notification, Rep, Stage, Task, TaskType,
} from '@/types';
import { DAY, HOUR, MIN, rng, startOfDay } from '@/lib/utils';

/**
 * Deterministic, interconnected demo dataset.
 * Every timestamp is relative to "now", so the workspace always feels live.
 */
const R = rng(20261102);
export const NOW = Math.floor(Date.now() / MIN) * MIN;
const TODAY = startOfDay(NOW);

/** Snap a timestamp into business hours (08:00–19:00) without moving it into the future. */
function biz(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  if (h < 8 || h >= 19) d.setHours(8 + ((h * 7) % 11), d.getMinutes());
  let t = d.getTime();
  while (t > NOW) t -= DAY;
  return t;
}

function bizTime(daysAgo: number, h0 = 8, h1 = 18) {
  let t = TODAY - daysAgo * DAY + R.int(h0 * 60, h1 * 60) * MIN;
  if (t > NOW) t = NOW - R.int(4, 180) * MIN;
  return t;
}

/* ───────────────────────── Reps ───────────────────────── */
export const CURRENT_USER_ID = 'rep_aisha';
/** One demo login per panel: Admin, Sales Manager, Account Executive, SDR. */
export const DEMO_PERSONAS = ['rep_aisha', 'rep_daniel', 'rep_marcus', 'rep_zara'] as const;
const repDefs: [string, string, Rep['role'], string, Rep['team'], string, number, number, Rep['presence']][] = [
  ['aisha', 'Aisha Rahman', 'Admin', 'VP of Sales', 'Enterprise', 'Global', 0, 262, 'online'],
  ['daniel', 'Daniel Okafor', 'Sales Manager', 'Head of Enterprise', 'Enterprise', 'North America', 900_000, 210, 'online'],
  ['priya', 'Priya Nair', 'Sales Manager', 'Head of Mid-Market', 'Mid-Market', 'EMEA', 650_000, 330, 'away'],
  ['marcus', 'Marcus Chen', 'Account Executive', 'Senior Account Executive', 'Enterprise', 'West Coast', 520_000, 200, 'on-call'],
  ['sofia', 'Sofia Alvarez', 'Account Executive', 'Account Executive', 'Enterprise', 'LATAM', 460_000, 14, 'online'],
  ['ethan', 'Ethan Brooks', 'Account Executive', 'Account Executive', 'Mid-Market', 'East Coast', 380_000, 160, 'online'],
  ['hana', 'Hana Kobayashi', 'Account Executive', 'Account Executive', 'Mid-Market', 'APAC', 360_000, 290, 'on-call'],
  ['liam', "Liam O'Connor", 'Account Executive', 'Account Executive', 'Growth', 'UK & Ireland', 240_000, 40, 'away'],
  ['zara', 'Zara Ahmed', 'SDR', 'Sales Development Rep', 'Growth', 'EMEA', 120_000, 340, 'online'],
  ['noah', 'Noah Fischer', 'SDR', 'Sales Development Rep', 'Growth', 'DACH', 120_000, 185, 'offline'],
  ['maya', 'Maya Patel', 'SDR', 'Sales Development Rep', 'Mid-Market', 'North America', 120_000, 120, 'online'],
];
export const reps: Rep[] = repDefs.map(([k, name, role, title, team, territory, quota, hue, presence], i) => ({
  id: `rep_${k}`,
  name,
  email: `${k}@leadvico.com`,
  phone: `+1 (415) 555-01${String(10 + i).padStart(2, '0')}`,
  role, title, team, territory, quota, hue, presence,
  joinedAt: NOW - (120 + i * 97) * DAY,
  managerId: i === 0 ? undefined : role === 'Sales Manager' ? 'rep_aisha' : team === 'Enterprise' ? 'rep_daniel' : 'rep_priya',
}));
const sellers = reps.filter((r) => r.role !== 'Admin');
const aes = reps.filter((r) => r.role === 'Account Executive' || r.role === 'Sales Manager');
const sdrs = reps.filter((r) => r.role === 'SDR');

/* ───────────────────────── Companies ───────────────────────── */
const companyDefs: [string, string, string, string][] = [
  ['Northwind Logistics', 'Logistics', 'Chicago', 'United States'],
  ['Halcyon Health', 'Healthcare', 'Boston', 'United States'],
  ['Vertex Robotics', 'Manufacturing', 'Pittsburgh', 'United States'],
  ['Bluepeak Capital', 'Financial Services', 'New York', 'United States'],
  ['Lumina Retail Group', 'Retail', 'London', 'United Kingdom'],
  ['Arcadia Foods', 'Consumer Goods', 'Austin', 'United States'],
  ['Kestrel Aerospace', 'Aerospace', 'Seattle', 'United States'],
  ['Solace Insurance', 'Insurance', 'Hartford', 'United States'],
  ['Brightline Telecom', 'Telecommunications', 'Dallas', 'United States'],
  ['Ironclad Security', 'Cybersecurity', 'Tel Aviv', 'Israel'],
  ['Cobalt Energy', 'Energy', 'Houston', 'United States'],
  ['Ferro Industrial', 'Manufacturing', 'Stuttgart', 'Germany'],
  ['Atlas Freightways', 'Logistics', 'Rotterdam', 'Netherlands'],
  ['Juniper Biotech', 'Life Sciences', 'San Diego', 'United States'],
  ['Quanta Analytics', 'Software', 'Toronto', 'Canada'],
  ['Mosaic Media', 'Media', 'Los Angeles', 'United States'],
  ['Pinnacle Hospitality', 'Hospitality', 'Dubai', 'United Arab Emirates'],
  ['Riverbend Pharma', 'Pharmaceuticals', 'Basel', 'Switzerland'],
  ['Sterling Mutual Bank', 'Financial Services', 'Edinburgh', 'United Kingdom'],
  ['Tidewater Marine', 'Maritime', 'Singapore', 'Singapore'],
  ['Evergreen Learning', 'Education', 'Portland', 'United States'],
  ['Orion Mobility', 'Automotive', 'Munich', 'Germany'],
  ['Redwood Construction', 'Construction', 'Denver', 'United States'],
  ['Summit Legal Partners', 'Legal', 'Washington', 'United States'],
  ['Nimbus Cloudworks', 'Software', 'Bengaluru', 'India'],
  ['Granite & Co.', 'Professional Services', 'Sydney', 'Australia'],
  ['Helix Genomics', 'Life Sciences', 'Cambridge', 'United Kingdom'],
  ['Polaris Fleet', 'Automotive', 'Detroit', 'United States'],
  ['Saffron Hotels', 'Hospitality', 'Mumbai', 'India'],
  ['Clearwater Utilities', 'Energy', 'Phoenix', 'United States'],
  ['Meadowlark Insurance', 'Insurance', 'Dublin', 'Ireland'],
  ['Vantage Payments', 'Fintech', 'São Paulo', 'Brazil'],
  ['Copperleaf Retail', 'Retail', 'Melbourne', 'Australia'],
  ['Silverpine Media', 'Media', 'Stockholm', 'Sweden'],
  ['Beacon Diagnostics', 'Healthcare', 'Minneapolis', 'United States'],
  ['Everline Telecom', 'Telecommunications', 'Madrid', 'Spain'],
];
const descs: Record<string, string> = {
  Logistics: 'Multi-modal freight and last-mile delivery network operating regional distribution hubs.',
  Healthcare: 'Integrated care provider running hospitals, outpatient clinics and telehealth services.',
  Manufacturing: 'Precision industrial manufacturer with automated production lines across three plants.',
  'Financial Services': 'Wealth and asset management firm serving institutional and private clients.',
  Retail: 'Omnichannel retail group with flagship stores and a fast-growing e-commerce arm.',
  'Consumer Goods': 'Fast-moving consumer goods brand distributed through national grocery chains.',
  Aerospace: 'Designs and services avionics systems for commercial and defence aircraft.',
  Insurance: 'Property & casualty insurer modernising its broker and claims operations.',
  Telecommunications: 'Regional carrier offering fibre broadband, mobile and enterprise connectivity.',
  Cybersecurity: 'Managed detection and response provider protecting mid-size enterprises.',
  Energy: 'Generation and distribution utility investing heavily in renewable capacity.',
  'Life Sciences': 'Research-led biotech developing diagnostics and precision therapies.',
  Software: 'B2B software company building data infrastructure for analytics teams.',
  Media: 'Digital media studio producing streaming content and branded campaigns.',
  Hospitality: 'Premium hotel and resort operator with properties across key business cities.',
  Pharmaceuticals: 'Specialty pharmaceutical manufacturer with a global distribution footprint.',
  Maritime: 'Port services and vessel operations company across Southeast Asia.',
  Education: 'Online learning provider partnering with universities and corporate academies.',
  Automotive: 'Connected-vehicle and fleet electrification specialist.',
  Construction: 'Commercial construction and infrastructure contractor.',
  Legal: 'Full-service corporate law firm with a growing technology practice.',
  'Professional Services': 'Management consultancy focused on operations and transformation.',
  Fintech: 'Payments platform powering checkout for high-growth merchants.',
};
export const companies: Company[] = companyDefs.map(([name, industry, city, country], i) => {
  const employees = R.pick([180, 320, 650, 1200, 2400, 4800, 9500, 15000]);
  return {
    id: `co_${i + 1}`,
    name, industry, city, country,
    domain: name.toLowerCase().replace(/&|\./g, '').replace(/\s+/g, '').replace(/(group|co)$/, '') + '.com',
    employees,
    revenue: employees * R.int(120, 340) * 1000,
    ownerId: R.pick(aes).id,
    tier: employees > 4000 ? 'Strategic' : employees > 1000 ? 'Key' : 'Standard',
    hue: (i * 47) % 360,
    health: R.int(42, 98),
    description: descs[industry] ?? 'Enterprise organisation.',
    createdAt: NOW - R.int(40, 600) * DAY,
  };
});

/* ───────────────────────── People names ───────────────────────── */
const firsts = ['Olivia','James','Amelia','Arjun','Chloe','Mateo','Isla','Kenji','Grace','Omar','Elena','Lucas','Freya','Ravi','Nora','Diego','Leah','Tomás','Ava','Samuel','Mei','Jonah','Ines','Felix','Ruby','Kwame','Sara','Hugo','Lena','Adrian','Yara','Elliot','Naomi','Rafael','Julia','Theo','Anika','Gabriel','Ivy','Malik','Clara','Vikram','Esme','Andre','Lucia','Oscar','Tara','Henrik','Layla','Ben','Rosa','Kai','Alina','Simon','Zoe','Mohammed','Hannah','Paolo','Ingrid','Dev'];
const lasts = ['Bennett','Kapoor','Hughes','Nakamura','Moreau','Silva','Lindqvist','Okonkwo','Walsh','Haddad','Rossi','Schmidt','Dubois','Reyes','Kowalski','Sharma','Turner','Fernandes','Novak','Mensah','Larsen','Iyer','Becker','Tanaka','Murphy','Costa','Weber','Johansson','Ortiz','Sato','Grant','Ahmadi','Keller','Banerjee','Price','Varga','Morales','Holt','Chen','Laurent'];
const seniorTitles = ['Chief Revenue Officer','VP of Operations','VP of Sales','Head of Procurement','Chief Operating Officer','Director of IT','VP of Customer Experience','Head of Growth','Director of Sales Operations','CFO'];
const midTitles = ['Operations Manager','IT Manager','Procurement Lead','Sales Operations Manager','Customer Success Lead','Revenue Operations Analyst','Program Manager','Contact Center Manager'];
let nameIdx = 0;
const nextName = () => {
  const f = firsts[(nameIdx * 7) % firsts.length]!;
  const l = lasts[(nameIdx * 11 + Math.floor(nameIdx / firsts.length)) % lasts.length]!;
  nameIdx++;
  return [f, l] as const;
};
const phoneFor = (country: string, i: number) => {
  const n = String(1000 + ((i * 37) % 9000));
  switch (country) {
    case 'United Kingdom': return `+44 20 7946 ${n.slice(0, 4)}`;
    case 'India': return `+91 98450 ${String(10000 + i * 13).slice(0, 5)}`;
    case 'Germany': return `+49 30 9018 ${n}`;
    case 'Australia': return `+61 2 9012 ${n}`;
    case 'Canada': return `+1 (416) 555-${n}`;
    default: return `+1 (${R.pick(['212', '312', '415', '646', '617', '512', '206', '303'])}) 555-${n}`;
  }
};

/* ───────────────────────── Contacts ───────────────────────── */
const tzFor = (country: string) =>
  ({ 'United Kingdom': 'Europe/London', India: 'Asia/Kolkata', Germany: 'Europe/Berlin', Australia: 'Australia/Sydney', Singapore: 'Asia/Singapore', 'United Arab Emirates': 'Asia/Dubai', Brazil: 'America/Sao_Paulo' } as Record<string, string>)[country] ?? 'America/New_York';
export const contacts: Contact[] = [];
companies.forEach((co) => {
  const n = co.tier === 'Strategic' ? 4 : co.tier === 'Key' ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const [f, l] = nextName();
    const i = contacts.length;
    contacts.push({
      id: `ct_${i + 1}`,
      firstName: f, lastName: l,
      title: k === 0 ? R.pick(seniorTitles) : R.pick(midTitles),
      companyId: co.id,
      email: `${f.toLowerCase()}.${l.toLowerCase()}@${co.domain}`.normalize('NFD').replace(/[̀-ͯ]/g, ''),
      phone: phoneFor(co.country, i + 400),
      ownerId: co.ownerId,
      lastContactedAt: biz(NOW - R.int(0, 30) * DAY - R.int(0, 600) * MIN),
      createdAt: co.createdAt + R.int(1, 30) * DAY,
      tags: R.shuffle(['Budget holder', 'Technical', 'Exec sponsor', 'Newsletter', 'Event attendee', 'Renewal']).slice(0, R.int(0, 2)),
      timezone: tzFor(co.country),
      persona: k === 0 ? R.pick(['Decision maker', 'Decision maker', 'Champion'] as const) : R.pick(['Champion', 'Influencer', 'End user', 'Influencer', 'Blocker'] as const),
    });
  }
});

/* ───────────────────────── Leads ───────────────────────── */
const pre = ['Apex','Crescent','Driftwood','Ember','Fable','Glacier','Harbor','Indigo','Jadeport','Keystone','Lantern','Meadow','Novaline','Oakridge','Prism','Quill','Radiant','Sable','Terra','Umbra','Wildflower','Willow','Zephyr','Brookfield','Cinder','Duskwood','Fairhaven','Goldcrest','Hollow Pine','Ivory Gate'];
const suf = ['Labs','Systems','Health','Logistics','Analytics','Retail','Capital','Foods','Studios','Networks','Partners','Dynamics','Works','Clinics','Freight','Energy'];
const leadIndustry: Record<string, string> = { Labs: 'Life Sciences', Systems: 'Software', Health: 'Healthcare', Logistics: 'Logistics', Analytics: 'Software', Retail: 'Retail', Capital: 'Financial Services', Foods: 'Consumer Goods', Studios: 'Media', Networks: 'Telecommunications', Partners: 'Professional Services', Dynamics: 'Manufacturing', Works: 'Manufacturing', Clinics: 'Healthcare', Freight: 'Logistics', Energy: 'Energy' };
const cities: [string, string][] = [['New York','United States'],['San Francisco','United States'],['Austin','United States'],['Chicago','United States'],['London','United Kingdom'],['Manchester','United Kingdom'],['Berlin','Germany'],['Bengaluru','India'],['Mumbai','India'],['Toronto','Canada'],['Sydney','Australia'],['Boston','United States'],['Miami','United States'],['Atlanta','United States']];
const sources: [LeadSource, number][] = [['Website', 22], ['IndiaMART', 14], ['Meta Lead Ads', 14], ['Google Ads', 10], ['JustDial', 8], ['WhatsApp', 9], ['Referral', 10], ['LinkedIn', 10], ['Missed call', 5], ['Webinar', 6], ['Cold outbound', 9], ['Trade show', 4], ['Partner', 4], ['Paid search', 4]];
const statuses: [LeadStatus, number][] = [['New', 22], ['Contacted', 26], ['Qualified', 18], ['Nurturing', 16], ['Unqualified', 8], ['Converted', 10]];
const tagPool = ['Enterprise', 'Inbound', 'Pricing page', 'Competitor user', 'Expansion', 'Decision maker', 'Demo requested', 'Event'];

export function computeScore(l: Pick<Lead, 'title' | 'employees' | 'source' | 'status' | 'lastActivityAt'>) {
  const f: { label: string; points: number }[] = [];
  const senior = /Chief|VP|Head|Director|CFO|COO|CRO/.test(l.title);
  f.push({ label: senior ? 'Senior decision maker' : 'Practitioner-level title', points: senior ? 24 : 10 });
  const sz = l.employees > 3000 ? 22 : l.employees > 800 ? 16 : l.employees > 200 ? 10 : 5;
  f.push({ label: `Company size · ${l.employees.toLocaleString()} employees`, points: sz });
  const srcPts: Partial<Record<LeadSource, number>> = { Referral: 20, Website: 16, Webinar: 14, Partner: 15, 'Paid search': 11, LinkedIn: 10, 'Trade show': 12, 'Cold outbound': 6, IndiaMART: 14, JustDial: 11, TradeIndia: 11, 'Meta Lead Ads': 10, 'Google Ads': 13, WhatsApp: 17, 'Missed call': 15, '99acres': 13, MagicBricks: 13 };
  f.push({ label: `Source · ${l.source}`, points: srcPts[l.source] ?? 10 });
  const days = (NOW - l.lastActivityAt) / DAY;
  const eng = days < 2 ? 22 : days < 7 ? 15 : days < 14 ? 8 : 2;
  f.push({ label: days < 2 ? 'Engaged in last 48h' : days < 7 ? 'Engaged this week' : 'Engagement cooling', points: eng });
  const st: Record<LeadStatus, number> = { New: 2, Contacted: 6, Qualified: 12, Nurturing: 4, Unqualified: -18, Converted: 12 };
  f.push({ label: `Lifecycle · ${l.status}`, points: st[l.status] });
  const score = Math.max(4, Math.min(99, f.reduce((s, x) => s + x.points, 0)));
  return { score, factors: f };
}

export const leads: Lead[] = Array.from({ length: 148 }, (_, i) => {
  const [f, l] = nextName();
  const p = pre[(i * 7) % pre.length]!;
  const s = suf[(i * 5 + Math.floor(i / pre.length)) % suf.length]!;
  const company = `${p} ${s}`;
  const [city, country] = R.pick(cities);
  const status = R.weighted(statuses);
  const source = R.weighted(sources);
  const createdAt = biz(NOW - (i < 10 ? R.int(0, 2) : R.int(1, 75)) * DAY - R.int(0, 600) * MIN);
  const lastActivityAt = Math.max(createdAt, biz(Math.min(NOW - R.int(5, 300) * MIN, createdAt + R.int(0, Math.max(1, Math.round((NOW - createdAt) / DAY))) * DAY)));
  const employees = R.pick([25, 60, 140, 320, 750, 1500, 3200, 6800]);
  const title = R.bool(0.45) ? R.pick(seniorTitles) : R.pick(midTitles);
  const { score, factors } = computeScore({ title, employees, source, status, lastActivityAt });
  return {
    id: `ld_${i + 1}`,
    firstName: f, lastName: l, title, company,
    industry: leadIndustry[s] ?? 'Software',
    employees,
    email: `${f[0]!.toLowerCase()}${l.toLowerCase()}@${p.toLowerCase().replace(/\s/g, '')}${s.toLowerCase()}.com`.normalize('NFD').replace(/[̀-ͯ]/g, ''),
    phone: phoneFor(country, i),
    city, country, source, status, score, scoreFactors: factors,
    ownerId: i % 13 === 5 ? null : i % 9 === 2 ? CURRENT_USER_ID : (status === 'New' || status === 'Contacted') && R.bool(0.6) ? R.pick(sdrs).id : R.pick(sellers).id,
    estValue: Math.round((employees * R.int(18, 60)) / 1000) * 1000 + 6000,
    createdAt, lastActivityAt,
    tags: R.shuffle(tagPool).slice(0, R.int(0, 3)),
    starred: R.bool(0.12),
  };
});

/* ───────────────────────── Deals ───────────────────────── */
export const STAGES: { id: Stage; probability: number; color: string }[] = [
  { id: 'Discovery', probability: 0.1, color: '#8b8fa3' },
  { id: 'Qualification', probability: 0.25, color: '#5b8def' },
  { id: 'Proposal', probability: 0.5, color: '#8b6cf6' },
  { id: 'Negotiation', probability: 0.75, color: '#e8a23b' },
  { id: 'Closed Won', probability: 1, color: '#22a06b' },
  { id: 'Closed Lost', probability: 0, color: '#e05260' },
];
const products = ['Platform · Enterprise', 'Platform · Growth', 'Voice & Calling Add-on', 'Revenue Analytics Suite', 'Data Connectors Pack', 'Onboarding & Services'];
const dealThemes = ['Contact center modernisation', 'Sales team rollout', 'Platform expansion', 'Calling add-on', 'Multi-region deployment', 'Analytics upgrade', 'Renewal + upsell', 'Pilot to production', 'Global license', 'Partner channel rollout'];
const nextSteps = ['Send revised proposal', 'Security review with IT', 'Pricing call with CFO', 'Technical demo for ops team', 'Legal redlines due', 'Confirm decision timeline', 'Intro to economic buyer', 'Pilot success review', 'Kick-off planning', 'Procurement paperwork'];
const lostReasons = ['Chose competitor', 'No budget this year', 'Went dark', 'Built in-house', 'Timing'];
const stageMix: [Stage, number][] = [['Discovery', 9], ['Qualification', 10], ['Proposal', 9], ['Negotiation', 7], ['Closed Won', 15], ['Closed Lost', 11]];
const quarterStart = (() => { const d = new Date(NOW); return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).getTime(); })();
export const QUARTER_START = quarterStart;

export const deals: Deal[] = [];
let di = 0;
for (const [stage, count] of stageMix) {
  for (let k = 0; k < count; k++) {
    const co = companies[(di * 5 + 3) % companies.length]!;
    const cts = contacts.filter((c) => c.companyId === co.id);
    const st = STAGES.find((s) => s.id === stage)!;
    const big = co.tier === 'Strategic';
    const value = Math.round(R.int(big ? 90 : 18, big ? 420 : 140) * 1000 / 500) * 500;
    const closed = stage === 'Closed Won' || stage === 'Closed Lost';
    const createdAt = NOW - R.int(closed ? 50 : 8, closed ? 140 : 90) * DAY;
    const closeDate = closed ? quarterStart + R.int(0, Math.max(1, Math.floor((NOW - quarterStart) / DAY) - 1)) * DAY + R.int(9, 17) * HOUR : NOW + R.int(6, 85) * DAY;
    deals.push({
      id: `dl_${di + 1}`,
      name: `${co.name.split(' ')[0]} — ${R.pick(dealThemes)}`,
      companyId: co.id,
      contactId: cts[0]?.id ?? contacts[0]!.id,
      ownerId: R.bool(0.75) ? co.ownerId : R.pick(aes).id,
      stage, value,
      probability: st.probability,
      closeDate, createdAt,
      stageChangedAt: closed ? closeDate : NOW - R.int(1, 26) * DAY,
      product: R.pick(products),
      priority: R.weighted([['High', 3], ['Medium', 5], ['Low', 2]] as const),
      nextStep: closed ? (stage === 'Closed Won' ? 'Handoff to onboarding' : 'Re-engage next quarter') : R.pick(nextSteps),
      lostReason: stage === 'Closed Lost' ? R.pick(lostReasons) : undefined,
    });
    di++;
  }
}
// Link converted leads to open deals for a coherent story.
leads.filter((l) => l.status === 'Converted').forEach((l, i) => {
  const d = deals[i % deals.length];
  if (d && !d.leadId) { d.leadId = l.id; l.dealId = d.id; }
});

/* ───────────────────────── Calls ───────────────────────── */
const notesBank: Record<Disposition, string[]> = {
  Interested: [
    'Strong interest in the calling add-on. Wants pricing for 40 seats and a sandbox for their ops lead.',
    'Pain is fragmented call logging across 3 tools. Asked for a case study from a similar logistics team.',
    'Budget confirmed for Q1. Needs SSO and audit logs — sending the security pack.',
    'Evaluating two vendors. Our pipeline analytics resonated; book technical demo next week.',
  ],
  'Meeting booked': [
    'Booked a 45-min demo with VP Ops and two team leads for Thursday. Focus: power dialer + reporting.',
    'Discovery went well — scheduled a workshop with their RevOps team to map current process.',
    'Agreed on a pilot scoping session. Will bring solutions engineer.',
  ],
  'Call back later': [
    'In back-to-back meetings, asked to call back after 3pm their time.',
    'Travelling this week. Prefers a call Monday morning.',
    'Needs to check with finance first — follow up in 5 days.',
  ],
  'Not interested': [
    'Locked into a 2-year contract with current vendor. Revisit in 14 months.',
    'Team too small right now; spreadsheets are enough. Nurture.',
  ],
  'Left voicemail': ['Left a short voicemail referencing their webinar question; sent follow-up email.', 'Voicemail left — mentioned the ROI calculator.'],
  'No answer': ['No answer. Will retry tomorrow morning.', 'Rang out, no voicemail set up.'],
  'Wrong number': ['Number belongs to reception; asked to be transferred next time.'],
};
const summaries = [
  'Prospect confirmed a 40-seat team with high call volume. Key concerns: CRM data migration and call recording compliance. Next step: technical demo with IT and Ops on Thursday.',
  'Discussed current tooling gaps and reporting needs. Budget owner is the COO; decision expected end of quarter. Prospect asked for references in their industry.',
  'Champion is enthusiastic, but procurement requires a security review. Agreed to send SOC 2 report and DPA today.',
  'Negotiated multi-year pricing. Customer wants a 10% discount for a 3-year commitment; needs approval from finance.',
];

type Ref = { type: 'lead' | 'contact'; id: string; phone: string; ownerId: string | null };
const refPool: Ref[] = [
  ...leads.filter((l) => l.status !== 'New').map((l) => ({ type: 'lead' as const, id: l.id, phone: l.phone, ownerId: l.ownerId })),
  ...contacts.map((c) => ({ type: 'contact' as const, id: c.id, phone: c.phone, ownerId: c.ownerId })),
];
export const calls: Call[] = [];
for (let d = 0; d < 60; d++) {
  const dow = new Date(TODAY - d * DAY).getDay();
  const weekend = dow === 0 || dow === 6;
  const n = d === 0 ? 26 : weekend ? R.int(1, 4) : R.int(12, 20);
  for (let k = 0; k < n; k++) {
    const ref = R.pick(refPool);
    const repId = ref.ownerId && R.bool(0.7) ? ref.ownerId : R.pick(sellers).id;
    const direction = R.bool(0.72) ? 'outbound' : 'inbound';
    const status = R.weighted(direction === 'outbound'
      ? ([['completed', 58], ['no-answer', 22], ['voicemail', 20]] as const)
      : ([['completed', 78], ['missed', 22]] as const));
    const disposition: Disposition = status === 'completed'
      ? R.weighted([['Interested', 30], ['Meeting booked', 16], ['Call back later', 26], ['Not interested', 10], ['Wrong number', 2]] as const)
      : status === 'voicemail' ? 'Left voicemail' : 'No answer';
    const dur = status === 'completed' ? R.int(70, 1500) : status === 'voicemail' ? R.int(20, 45) : 0;
    calls.push({
      id: `cl_${calls.length + 1}`,
      direction, status,
      ref: { type: ref.type, id: ref.id },
      repId,
      phone: ref.phone,
      startedAt: bizTime(d),
      duration: dur,
      recorded: status === 'completed' && R.bool(0.82),
      disposition,
      notes: R.pick(notesBank[disposition]),
      sentiment: status === 'completed' ? R.weighted([['positive', 5], ['neutral', 4], ['negative', 1]] as const) : undefined,
      summary: status === 'completed' && dur > 300 ? R.pick(summaries) : undefined,
    });
  }
}
calls.sort((a, b) => b.startedAt - a.startedAt);

/* ───────────────────────── Tasks ───────────────────────── */
const taskTitles: Record<TaskType, string[]> = {
  Call: ['Follow-up call re: pricing', 'Discovery call', 'Check in after demo', 'Call to confirm decision timeline', 'Reconnect after voicemail'],
  Email: ['Send proposal & ROI deck', 'Share security documentation', 'Send case study', 'Recap email with next steps', 'Send contract for review'],
  Meeting: ['QBR with exec sponsor', 'Pricing negotiation', 'Stakeholder alignment', 'Onboarding kickoff'],
  'Follow-up': ['Follow up on proposal', 'Nudge on legal redlines', 'Check pilot usage', 'Re-engage cold lead'],
  Demo: ['Product demo — calling workspace', 'Technical deep-dive', 'Executive demo'],
};
export const tasks: Task[] = Array.from({ length: 86 }, (_, i) => {
  const type = R.weighted([['Call', 34], ['Email', 20], ['Meeting', 14], ['Follow-up', 22], ['Demo', 10]] as const);
  const bucket = R.weighted([['overdue', 12], ['today', 24], ['tomorrow', 16], ['week', 22], ['later', 10], ['done', 18]] as const);
  const h = R.int(9, 17);
  const offsetDays = { overdue: -R.int(1, 4), today: 0, tomorrow: 1, week: R.int(2, 6), later: R.int(7, 18), done: -R.int(0, 6) }[bucket];
  const dueAt = TODAY + offsetDays * DAY + h * HOUR + R.pick([0, 15, 30, 45]) * MIN;
  const useLead = R.bool(0.6);
  const ref = useLead
    ? (() => { const l = R.pick(leads.filter((x) => x.status !== 'Unqualified')); return { type: 'lead' as const, id: l.id, owner: l.ownerId }; })()
    : (() => { const c = R.pick(contacts); return { type: 'contact' as const, id: c.id, owner: c.ownerId }; })();
  const ownerId = i < 48 ? DEMO_PERSONAS[i % DEMO_PERSONAS.length]! : ref.owner ?? R.pick(sellers).id;
  return {
    id: `tk_${i + 1}`,
    title: R.pick(taskTitles[type]),
    type, dueAt,
    durationMin: type === 'Meeting' || type === 'Demo' ? R.pick([30, 45, 60]) : type === 'Call' ? 15 : undefined,
    priority: R.weighted([['High', 3], ['Medium', 5], ['Low', 2]] as const),
    done: bucket === 'done',
    completedAt: bucket === 'done' ? Math.min(NOW, dueAt) : undefined,
    ownerId,
    ref: { type: ref.type, id: ref.id },
    notes: R.bool(0.4) ? 'Prep: review last call notes and open questions before reaching out.' : undefined,
  };
});

/* ───────────────────────── Activities ───────────────────────── */
export const activities: Activity[] = [];
const pushAct = (a: Omit<Activity, 'id'>) => activities.push({ ...a, id: `ac_${activities.length + 1}` });
calls.forEach((c) => pushAct({
  type: 'call', at: c.startedAt, repId: c.repId, ref: c.ref, callId: c.id,
  title: c.status === 'completed' ? `${c.direction === 'inbound' ? 'Inbound' : 'Outbound'} call · ${c.disposition}` : c.status === 'missed' ? 'Missed inbound call' : c.status === 'voicemail' ? 'Left voicemail' : 'Call not answered',
  body: c.notes,
}));
const emailSubjects = ['Re: Pricing for 40 seats', 'Following up on our call', 'Security questionnaire — completed', 'Proposal: leadVico Platform', 'Quick question about your rollout', 'Case study you asked for', 'Agenda for Thursday'];
const noteBodies = ['Champion mentioned their current vendor contract renews in March — timing works in our favour.', 'Decision committee: COO, Head of IT, Finance BP. IT is the likely blocker on SSO.', 'Asked about multi-currency reporting; flagged to product.', 'Prefers WhatsApp for quick coordination; formal comms via email.'];
leads.forEach((l) => {
  const owner = l.ownerId ?? 'rep_zara';
  pushAct({ type: 'created', at: l.createdAt, repId: owner, ref: { type: 'lead', id: l.id }, title: `Lead created from ${l.source}`, body: l.source === 'Website' ? 'Submitted “Book a demo” form on /pricing.' : undefined });
  const span = Math.max(1, l.lastActivityAt - l.createdAt);
  const n = R.int(1, 4);
  for (let k = 0; k < n; k++) {
    const at = biz(l.createdAt + Math.round(span * ((k + 1) / (n + 1))));
    const t = R.weighted([['email', 5], ['note', 3], ['meeting', 2], ['status', 2]] as const);
    if (t === 'email') pushAct({ type: 'email', at, repId: owner, ref: { type: 'lead', id: l.id }, title: R.pick(emailSubjects), body: R.bool() ? 'Opened 3 times · clicked pricing link' : 'Delivered · opened' });
    else if (t === 'note') pushAct({ type: 'note', at, repId: owner, ref: { type: 'lead', id: l.id }, title: 'Note added', body: R.pick(noteBodies) });
    else if (t === 'meeting') pushAct({ type: 'meeting', at, repId: owner, ref: { type: 'lead', id: l.id }, title: R.pick(['Discovery meeting', 'Product demo', 'Intro call with RevOps']), body: '30 min · Google Meet · 3 attendees' });
    else pushAct({ type: 'status', at, repId: owner, ref: { type: 'lead', id: l.id }, title: `Status changed to ${l.status}` });
  }
});
contacts.forEach((c) => {
  if (R.bool(0.6)) pushAct({ type: 'email', at: c.lastContactedAt, repId: c.ownerId, ref: { type: 'contact', id: c.id }, title: R.pick(emailSubjects), body: 'Delivered · opened' });
  if (R.bool(0.3)) pushAct({ type: 'meeting', at: c.lastContactedAt - 2 * DAY, repId: c.ownerId, ref: { type: 'contact', id: c.id }, title: 'Quarterly business review', body: '45 min · Zoom · 5 attendees' });
});
activities.sort((a, b) => b.at - a.at);

/* ───────────────────────── Revenue history ───────────────────────── */
export const revenueHistory = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(NOW);
  d.setDate(1);
  d.setMonth(d.getMonth() - (12 - i));
  const base = 880_000 + i * 34_000;
  return {
    month: d.toLocaleString('en-US', { month: 'short' }),
    ts: d.getTime(),
    won: Math.round(base * (0.82 + R.next() * 0.36) / 1000) * 1000,
    target: Math.round((960_000 + i * 28_000) / 1000) * 1000,
    pipeline: Math.round(base * (2.4 + R.next() * 0.8) / 1000) * 1000,
  };
});

/* ───────────────────────── Notifications ───────────────────────── */
export const notifications: Notification[] = [
  { id: 'n1', at: NOW - 6 * MIN, kind: 'deal', title: 'Deal moved to Negotiation', body: `${deals.find((d) => d.stage === 'Negotiation')?.name} · by Marcus Chen`, read: false, href: '/pipeline' },
  { id: 'n2', at: NOW - 24 * MIN, kind: 'call', title: 'Missed call from Olivia Bennett', body: 'Inbound · 0:00 · tap to call back', read: false, href: '/calls' },
  { id: 'n3', at: NOW - 52 * MIN, kind: 'lead', title: 'New hot lead assigned to you', body: `${leads[2]!.firstName} ${leads[2]!.lastName} · ${leads[2]!.company} · score ${leads[2]!.score}`, read: false, href: `/leads/${leads[2]!.id}` },
  { id: 'n4', at: NOW - 2 * HOUR, kind: 'mention', title: 'Priya Nair mentioned you', body: '“@Aisha can you join the Helix pricing call tomorrow?”', read: true },
  { id: 'n5', at: NOW - 5 * HOUR, kind: 'task', title: '3 follow-ups due today', body: 'Your agenda has 3 high-priority follow-ups', read: true, href: '/tasks' },
  { id: 'n6', at: NOW - 26 * HOUR, kind: 'deal', title: 'Closed Won 🎉', body: `${deals.find((d) => d.stage === 'Closed Won')?.name} · by Sofia Alvarez`, read: true, href: '/pipeline' },
];

/* ───────────────────────── Live call script ───────────────────────── */
export const transcriptScript: { who: 'rep' | 'them'; text: string }[] = [
  { who: 'rep', text: 'Hi, this is Aisha from leadVico — is now still a good time?' },
  { who: 'them', text: 'Yes, perfect timing. I just came out of our ops review actually.' },
  { who: 'rep', text: 'Great. Last time you mentioned call logging was spread across three tools. Is that still the main pain?' },
  { who: 'them', text: 'It is. Our reps spend maybe 40 minutes a day just updating records after calls.' },
  { who: 'rep', text: 'That’s exactly what the calling workspace removes — every call is logged, recorded and summarised automatically.' },
  { who: 'them', text: 'How does pricing work if we roll it out to around forty seats?' },
  { who: 'rep', text: 'For forty seats you’d be on the Enterprise tier. I can send a proposal with volume pricing today.' },
  { who: 'them', text: 'That works. We’d also need SSO and an audit trail for compliance.' },
  { who: 'rep', text: 'Both are included. Shall we book a technical demo with your IT lead for Thursday?' },
  { who: 'them', text: 'Thursday at 2pm works. I’ll loop in Marco from IT.' },
];
