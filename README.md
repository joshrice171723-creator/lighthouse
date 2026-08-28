# Lighthouse

Lighthouse is the partner and participant portal powered by North Star services.

## Local development

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run lighthouse:server
```

Open `http://127.0.0.1:8787/lighthouse-partner.html` for the partner workspace.

The normal partner URL is a login page. Owner setup is protected and must be
started with a local setup key:

```powershell
$env:LIGHTHOUSE_SETUP_KEY = 'choose-a-local-owner-key'
npm.cmd run lighthouse:server
```

Then open `lighthouse-partner.html?setup=1`. Use this only to create the first
workspace or set the initial password for an existing owner account.
