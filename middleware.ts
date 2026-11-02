import { next } from '@vercel/functions';

/**
 * Site-wide login for demo.leadvico.com (Vercel Routing Middleware).
 *
 * Runs on the server before any page or asset is served, so nothing in the app
 * is reachable without signing in. Credentials are verified against a SHA-256
 * digest (the plain password is not stored in the code). Set DEMO_USERNAME and
 * DEMO_PASSWORD in Vercel to change them, and DEMO_AUTH_SECRET to sign sessions
 * with a private key.
 */
export const config = { matcher: '/:path*' };

const CREDENTIAL_SHA256 = 'e819e3d90537a0a22aa15c95c43bb3b2a021ca274a47940659eadd6f1220503b';
const COOKIE = 'lv_demo_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const LOGIN = '/__auth/login';
const LOGOUT = '/__auth/logout';

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function expectedCredential() {
  const u = process.env.DEMO_USERNAME, p = process.env.DEMO_PASSWORD;
  return u && p ? sha256(`${u}:${p}`) : CREDENTIAL_SHA256;
}

async function sessionToken() {
  const secret = process.env.DEMO_AUTH_SECRET || (await expectedCredential());
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode('leadvico-demo-session-v1')));
}

function readCookie(req: Request, name: string) {
  const m = (req.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

const safeNext = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith(LOGIN) ? v : '/');

const redirect = (to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: to, 'Cache-Control': 'no-store', ...headers } });

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === LOGOUT) {
    return redirect(LOGIN, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  if (url.pathname === LOGIN) {
    if (request.method === 'POST') {
      const form = await request.formData();
      const user = String(form.get('username') ?? '').trim();
      const pass = String(form.get('password') ?? '');
      const dest = safeNext(String(form.get('next') ?? '/'));
      if (safeEqual(await sha256(`${user}:${pass}`), await expectedCredential())) {
        const cookie = `${COOKIE}=${await sessionToken()}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
        return redirect(dest, { 'Set-Cookie': cookie });
      }
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      return redirect(`${LOGIN}?error=1&next=${encodeURIComponent(dest)}`);
    }
    return new Response(loginPage(url.searchParams.has('error'), safeNext(url.searchParams.get('next'))), {
      status: url.searchParams.has('error') ? 401 : 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex' },
    });
  }

  const token = readCookie(request, COOKIE);
  if (token && safeEqual(token, await sessionToken())) {
    return next({ headers: { 'X-Robots-Tag': 'noindex' } });
  }

  const accept = request.headers.get('accept') ?? '';
  if (request.method === 'GET' && accept.includes('text/html')) {
    return redirect(`${LOGIN}?next=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return new Response('Authentication required', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function loginPage(error: boolean, nextPath: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Sign in · leadVico</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%235856ee'/%3E%3Cpath d='M8 9.5l8 13.5 8-13.5' fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root { --bg:#f6f6f8; --surface:#fff; --fg:#0e0f13; --muted:#686a75; --line:#dcdce3; --brand:#5856ee; --danger:#e13c48; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0a0b0e; --surface:#111216; --fg:#ededf1; --muted:#8b8d98; --line:#2c2d36; --brand:#7c7aff; --danger:#f85c68; color-scheme: dark; } }
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); display: flex; -webkit-font-smoothing: antialiased; }
  .art { position: relative; width: 46%; background: #0d0e14; color: #fff; padding: 40px; display: flex; flex-direction: column; overflow: hidden; }
  .art::before { content: ''; position: absolute; inset: 0; background: radial-gradient(80% 60% at 10% 0%, rgba(88,86,238,.45), transparent 60%), radial-gradient(60% 50% at 100% 100%, rgba(139,108,246,.25), transparent 60%); }
  .art > * { position: relative; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -.02em; }
  .mark { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg,#7774ff,#4b47e0); display: grid; place-items: center; box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 4px 12px -2px rgba(88,86,238,.6); }
  .brand small { display: block; font-size: 11px; font-weight: 500; opacity: .55; letter-spacing: 0; }
  .pitch { margin-top: auto; max-width: 440px; }
  .pitch h1 { font-size: 34px; line-height: 1.1; letter-spacing: -.03em; font-weight: 600; }
  .pitch p { margin-top: 12px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,.65); }
  .main { flex: 1; display: grid; place-items: center; padding: 24px; }
  .box { width: 100%; max-width: 380px; animation: up .35s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .box .brand { color: var(--fg); margin-bottom: 32px; display: none; }
  h2 { font-size: 22px; font-weight: 600; letter-spacing: -.02em; }
  .sub { margin-top: 4px; font-size: 13px; color: var(--muted); }
  form { margin-top: 28px; display: grid; gap: 14px; }
  label { font-size: 12px; font-weight: 500; display: grid; gap: 6px; }
  .field { position: relative; }
  input { width: 100%; height: 40px; border-radius: 8px; border: 0; padding: 0 12px; font: inherit; font-size: 14px; color: var(--fg); background: var(--surface); box-shadow: inset 0 0 0 1px var(--line); outline: none; transition: box-shadow .15s; }
  input:focus { box-shadow: inset 0 0 0 1px var(--brand), 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
  .toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: none; color: var(--muted); font: inherit; font-size: 12px; font-weight: 500; cursor: pointer; padding: 4px 6px; border-radius: 6px; }
  .toggle:hover { color: var(--fg); }
  button.primary { height: 42px; margin-top: 6px; border: 0; border-radius: 9px; background: var(--brand); color: #fff; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 6px 16px -6px color-mix(in srgb, var(--brand) 70%, transparent); transition: filter .15s, transform .1s; }
  button.primary:hover { filter: brightness(1.08); }
  button.primary:active { transform: scale(.99); }
  .error { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 8px; font-size: 13px; color: var(--danger); background: color-mix(in srgb, var(--danger) 10%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--danger) 25%, transparent); }
  .foot { margin-top: 28px; font-size: 11.5px; color: var(--muted); text-align: center; }
  @media (max-width: 900px) { .art { display: none; } .box .brand { display: flex; } }
</style>
</head>
<body>
  <aside class="art">
    <div class="brand"><span class="mark"><svg width="18" height="18" viewBox="0 0 32 32"><path d="M8 9.5l8 13.5 8-13.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>leadVico<small>Sales CRM</small></span></div>
    <div class="pitch">
      <h1>Every call, lead and deal — in one place.</h1>
      <p>The sales CRM with calling built in. Dial from any record, record and transcribe automatically, and let Vico AI tell you who to call next.</p>
    </div>
  </aside>
  <main class="main">
    <div class="box">
      <div class="brand"><span class="mark"><svg width="18" height="18" viewBox="0 0 32 32"><path d="M8 9.5l8 13.5 8-13.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>leadVico<small>Sales CRM</small></span></div>
      <h2>Sign in to the demo</h2>
      <p class="sub">This preview is private. Enter the credentials you were given.</p>
      <form method="post" action="${LOGIN}">
        ${error ? '<div class="error" role="alert">Incorrect username or password. Please try again.</div>' : ''}
        <input type="hidden" name="next" value="${esc(nextPath)}" />
        <label>Username<input name="username" autocomplete="username" autocapitalize="off" spellcheck="false" required autofocus /></label>
        <label>Password<span class="field"><input id="pw" name="password" type="password" autocomplete="current-password" required /><button type="button" class="toggle" onclick="var p=document.getElementById('pw');var s=p.type==='password';p.type=s?'text':'password';this.textContent=s?'Hide':'Show'">Show</button></span></label>
        <button class="primary" type="submit">Sign in →</button>
      </form>
      <p class="foot">leadVico demo workspace · sample data only</p>
    </div>
  </main>
</body>
</html>`;
}
