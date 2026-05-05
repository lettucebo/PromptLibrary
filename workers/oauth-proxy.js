/**
 * Cloudflare Worker — GitHub OAuth Token Exchange Proxy
 *
 * This worker securely exchanges a GitHub OAuth authorization code for an
 * access token, keeping the client_secret on the server side.
 *
 * Environment variables (set via `wrangler secret put`):
 *   GITHUB_CLIENT_ID     — Your GitHub OAuth App client ID
 *   GITHUB_CLIENT_SECRET — Your GitHub OAuth App client secret
 *   ALLOWED_ORIGINS      — Comma-separated list of allowed CORS origins
 *                          (e.g. "https://lettucebo.github.io")
 *
 * Deployment:
 *   1. Install Wrangler: npm install -g wrangler
 *   2. Authenticate: wrangler login
 *   3. Create wrangler.toml (see below) then run: wrangler deploy
 *
 * Example wrangler.toml:
 *   name = "prompt-library-oauth-proxy"
 *   main = "workers/oauth-proxy.js"
 *   compatibility_date = "2024-01-01"
 *
 *   [vars]
 *   ALLOWED_ORIGINS = "https://lettucebo.github.io"
 *
 *   # Secrets (set via CLI, not in file):
 *   # wrangler secret put GITHUB_CLIENT_ID
 *   # wrangler secret put GITHUB_CLIENT_SECRET
 */

export default {
  async fetch(request, env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '';

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { code } = await request.json();
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing "code" parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error, error_description: tokenData.error_description }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ access_token: tokenData.access_token }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
