# Blizzard configuration

Configure BLIZZARD_CLIENT_ID and a newly rotated BLIZZARD_CLIENT_SECRET in the server environment of production and preview. The old secret remains in Git history and must be revoked at https://develop.battle.net/access/clients.

The browser calls /api/blizzard for the catalogue resources used by the site. This route accepts only fixed public game-data paths and approved locales, authenticates with Blizzard on the server, and never returns the OAuth token or client secret. Successful public catalogue responses can be cached by the CDN for five minutes. No account/profile or arbitrary URL proxy is exposed.

Run npm test. Provider tests use synthetic credentials and mocked requests; a production smoke check requires the newly configured provider credentials.
