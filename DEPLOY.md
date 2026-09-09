# Deploying

This app deploys to Cloudflare Workers (static assets) via Wrangler.

```sh
npm run deploy
```

This runs `tsc && vite build && wrangler deploy`: type-checks, builds the
static site into `dist/`, then uploads it as a Worker.

First time only, authenticate Wrangler with Cloudflare:

```sh
npx wrangler login
```

Worker name and asset config live in `wrangler.jsonc`.
