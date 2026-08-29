# Next Step

Next Step is the partner and participant employment-support portal.

## Local development

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run lighthouse:server
```

The active Interview Prep API runs in the Rails backend. In a second terminal,
from `backend/`, run `bin/rails db:prepare` and `bin/rails server -b
127.0.0.1 -p 3000`. The frontend sends Interview Prep requests to Rails on
port 3000; older portal endpoints remain on the compatibility server above
until their Rails controllers are migrated.

Once Ruby and PostgreSQL are available, `npm.cmd run next-step:dev` starts the
Vite frontend, compatibility API, and Rails API together.

Open `http://127.0.0.1:8787/lighthouse-partner.html` for the partner workspace.

The normal partner URL is a login page. Owner setup is protected and must be
started with a local setup key:

```powershell
$env:LIGHTHOUSE_SETUP_KEY = 'choose-a-local-owner-key'
npm.cmd run lighthouse:server
```

Then open `lighthouse-partner.html?setup=1`. Use this only to create the first
workspace or set the initial password for an existing owner account.
