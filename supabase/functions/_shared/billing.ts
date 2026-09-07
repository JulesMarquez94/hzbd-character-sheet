/**
 * What every billing function needs, in one place.
 *
 * Four functions live beside this file and they are the only server code
 * Hazebound has. Everything else is a static build on Cloudflare Pages talking
 * to Postgres through RLS, which is why the rule below matters more than any
 * other line in the folder:
 *
 *   **The secret keys exist here and nowhere else.** Anything the browser
 *   holds is public (Vite bakes every VITE_ variable into the bundle), so the
 *   Stripe secret key and the Supabase service role key never leave this
 *   runtime. A function that needs to know who is calling reads a verified
 *   JWT; it never takes a user id from a request body.
 *
 * ---------------------------------------------------------------- the pins
 * `npm:stripe@^22` is the version Supabase's own Stripe example pins, and the
 * SDK's major tracks Stripe's API version. If a deploy ever fails resolving it,
 * that number is the one to move, and nothing else here depends on it.
 */
import Stripe from 'npm:stripe@^22';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@^2';

/* --------------------------------------------------------------- the clients */

/**
 * Deno has no Node crypto and no Node http, so stripe-node is handed the fetch
 * client explicitly. The crypto provider is passed at the call site instead,
 * because only the webhook needs it.
 */
export const stripe = new Stripe(mustEnv('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * The service role client. Bypasses every policy, which is the point: the
 * webhook writes tables that have no write policy at all, and calls
 * apply_entitlements, which is revoked from anon and authenticated.
 *
 * `persistSession: false` because there is no session to persist in a function
 * that answers one request and exits.
 */
export function adminClient(): SupabaseClient {
  return createClient(
    mustEnv('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? mustEnv('SUPABASE_SECRET_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Who is calling, proved rather than claimed.
 *
 * The client's `Authorization: Bearer <jwt>` is handed straight to the Auth
 * server, which is what makes this a verification and not a decoding. A missing
 * or expired token comes back as null and every caller turns that into a 401.
 */
export async function callerFromRequest(req: Request) {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return null;

  const scoped = createClient(
    mustEnv('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY') ?? mustEnv('SUPABASE_PUBLISHABLE_KEY'),
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } }
  );

  const { data, error } = await scoped.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/* ------------------------------------------------------------------- the plans */

/**
 * What may be bought, as a map from a word the browser is allowed to say to the
 * name of the environment variable holding the real Stripe price.
 *
 * The browser sends `monthly`. It never sends a price id, because a price id in
 * a request body is a request body that can be edited: without this list an
 * attacker could check out against a one cent price of their own making and
 * still land a subscription that reads as premium here.
 *
 * A yearly plan is two lines away: make the price in Stripe, set
 * STRIPE_PRICE_YEARLY, and turn on the `yearly` entry in src/lib/premium.js so
 * the page offers it. It is worth doing. Stripe's fixed $0.30 per charge is a
 * tenth of a $3 monthly and a hundredth of a $30 yearly.
 */
export const PLAN_PRICE_ENV: Record<string, string> = {
  monthly: 'STRIPE_PRICE_MONTHLY',
  yearly: 'STRIPE_PRICE_YEARLY',
};

export function priceIdForPlan(plan: unknown): string {
  const key = String(plan ?? '').trim().toLowerCase();
  const envName = PLAN_PRICE_ENV[key];
  if (!envName) throw new HttpError(400, 'That is not a plan this site sells.');

  const priceId = Deno.env.get(envName);
  if (!priceId) {
    throw new HttpError(500, `This plan is not set up yet. Set ${envName} on the function.`);
  }
  return priceId;
}

/* ------------------------------------------------------------------ the origin */

/**
 * Where the browser is allowed to be, and where it is allowed to be sent back
 * to. Comma separated in SITE_URL, first entry winning as the default.
 *
 * Two jobs, and both are refusals. It is the CORS allowlist, so a page on
 * someone else's domain cannot drive these functions with a visitor's token.
 * And it is where every redirect URL is built from, so a `success_url` can
 * never be smuggled in through a request body and turned into an open redirect.
 */
function allowedOrigins(): string[] {
  return (Deno.env.get('SITE_URL') ?? 'http://localhost:5173')
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function siteUrl(): string {
  return allowedOrigins()[0];
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = allowedOrigins();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  // Echoed only when it matches. An origin that is not on the list gets no
  // allow header at all, and the browser refuses the response for us.
  if (allowed.includes(origin.replace(/\/+$/, ''))) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

/* ------------------------------------------------------------------- plumbing */

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function mustEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

/**
 * One shape for every user-facing function: answer the preflight, refuse
 * anything but POST, and turn a thrown HttpError into a status the page can
 * read. An error that is not an HttpError is a bug rather than a refusal, so it
 * is logged in full and reported as a sentence that gives nothing away.
 */
export function serveJson(handler: (req: Request) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
    if (req.method !== 'POST') return json(req, { error: 'Use POST.' }, 405);

    try {
      return json(req, await handler(req));
    } catch (err) {
      if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
      console.error('[billing]', err);

      /* The sentence above gives nothing away, which is right: a provider error
         can name a price, a customer or an account, and none of that belongs in
         a response to a browser. It is also useless when the thing you need is
         exactly what the provider said, and the log it went to lives in a
         dashboard the CLI cannot reach.

         So: off unless STRIPE_DEBUG_ERRORS is set to "true", and set it only
         while you are looking. A provider's own words are not written for the
         public and can carry ids from the account. */
      const detail =
        (Deno.env.get('STRIPE_DEBUG_ERRORS') ?? '').toLowerCase() === 'true'
          ? { detail: err instanceof Error ? err.message : String(err) }
          : {};

      return json(
        req,
        { error: 'Something went wrong reaching the payment provider.', ...detail },
        500
      );
    }
  };
}

/** Stripe hands back either an id or the whole expanded object. */
export function idOf(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id);
  return null;
}
