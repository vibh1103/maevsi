import { test, expect } from '@playwright/test'

test.describe('headers middleware', () => {
  test('sets the correct CSP header', async ({ request }) => {
    const resp = await request.get('/')

    expect(resp.headers()['content-security-policy']).toEqual(
      process.env.NODE_ENV === 'production'
        ? "connect-src 'self' blob: https://localhost:3001 https://postgraphile.localhost:3001 https://tusd.localhost:3001 https://*.analytics.google.com https://*.google-analytics.com https://*.googletagmanager.com https://cdn.jsdelivr.net/npm/@sec-ant/ https://localhost:3001/cdn-cgi/rum;base-uri 'none';default-src 'none';font-src 'self' data:;form-action 'self';frame-ancestors 'none';frame-src https://challenges.cloudflare.com;img-src 'self' blob: data: https://tusd.localhost:3001 https://*.google-analytics.com https://*.googletagmanager.com https://www.gravatar.com/avatar/;manifest-src 'self';media-src 'none';object-src 'none';prefetch-src 'self';report-uri https://dargmuesli.report-uri.com/r/d/csp/enforce;script-src blob: 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.googletagmanager.com https://polyfill.io/v3/polyfill.min.js 'unsafe-inline' 'unsafe-eval';style-src 'self' 'unsafe-inline';"
        : "connect-src 'self' blob: https://maev.si https://postgraphile.maev.si https://tusd.maev.si https://*.analytics.google.com https://*.google-analytics.com https://*.googletagmanager.com https://cdn.jsdelivr.net/npm/@sec-ant/ http://localhost:24678/_nuxt/ https://localhost:24678/_nuxt/ ws://localhost:24678/_nuxt/ wss://localhost:24678/_nuxt/;font-src 'self' data: https://fonts.gstatic.com/s/inter/v12/;frame-ancestors 'none' 'self';frame-src https://challenges.cloudflare.com 'self';script-src blob: 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.googletagmanager.com https://polyfill.io/v3/polyfill.min.js 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com/;style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net/npm/gardevoir https://fonts.googleapis.com/css2;base-uri 'none';default-src 'none';form-action 'self';img-src 'self' blob: data: https://tusd.maev.si https://*.google-analytics.com https://*.googletagmanager.com https://www.gravatar.com/avatar/;manifest-src 'self';media-src 'none';object-src 'none';prefetch-src 'self';report-uri https://dargmuesli.report-uri.com/r/d/csp/enforce;",
    )
  })
})
