# Blizzard configuration

Configure BLIZZARD_CLIENT_ID and a newly rotated BLIZZARD_CLIENT_SECRET in the server environment of production and preview. The old secret remains in Git history and must be revoked at https://develop.battle.net/access/clients.

The browser calls /api/blizzard for the catalogue resources used by the site. This route accepts only fixed public game-data paths and approved locales, authenticates with Blizzard on the server, and never returns the OAuth token or client secret. Successful public catalogue responses can be cached by the CDN for five minutes. No account/profile or arbitrary URL proxy is exposed.

Run npm test. Provider tests use synthetic credentials and mocked requests; a production smoke check requires the newly configured provider credentials.

For localhost, configure the local client's BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET in an ignored .env, then run npm run dev. The server binds only 127.0.0.1:8788 and serves the catalogue API and both pages. Apache copies under /wow/ also use this local API. Server files and .env are never served by the local static handler.

Copies hosted under /wow/ on other domains use the public catalogue-only API at https://wow-one-pi.vercel.app. The API permits cross-origin reads of public game data, without exposing OAuth credentials. Client-credentials authentication does not use a redirect URI.
