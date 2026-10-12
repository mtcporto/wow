# Configuration and server boundaries

Blizzard credentials stay in ignored `.env.local` and Vercel environment variables. Next.js loads `.env.local`; client assets contain neither credential nor OAuth token. The Route Handler `app/api/blizzard/route.ts` reuses the resource allowlist, fixed regional hosts, input validation and response redaction in `server/blizzard.cjs`.

Clients call the API on the same origin; the previous separate localhost/static server is retired. Apache proxies `/wow` to Next.js through the project `.htaccess`. Only `public/` files are served as assets: `.env`, `.git`, server code and repository documents are not public routes.

`NEXT_PUBLIC_BASE_PATH` is a nonsecret deployment path, empty on Vercel and `/wow` for this local Apache setup. Never prefix provider credentials with `NEXT_PUBLIC_`.

Future Google sessions and Turso persistence must run on the server. Build ownership must come from an authenticated session, and saving/importing builds must validate rules against their game version. No database or user authentication is configured yet.
