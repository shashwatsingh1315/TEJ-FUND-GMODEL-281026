# Publish the investor dashboard

Vercel serves a stable investor URL. GitHub remains the source; the Claude artifact
is a separately published copy and is not updated by this deployment.

## Connect Vercel once

1. Open <https://vercel.com/new> and sign in with GitHub.
2. Import `shashwatsingh1315/TEJ-FUND-GMODEL-281026`. Grant Vercel access to this
   repository if it does not appear. The repository can stay private.
3. Keep **Root Directory** at the repository root and **Framework Preset** at
   **Other**. `vercel.json` supplies the build command and output directory:
   `python3 tools/build-site.py`, `dist`. No environment variables are needed.
4. Use `main` as the **Production Branch**. Deploy, then share the project's
   production URL with investors. Check Deployment Protection allows your intended
   investors to open production; test the URL in a signed-out browser.

This requires the hosting configuration commit to be on `main` first. If it is on
a pull-request branch, review and merge that branch before the production import.

## Edit and publish

1. Edit the active sources in `workspace-2026-10-28/src/`. See
   [the source guide](../workspace-2026-10-28/WORKING-ON-THE-DASHBOARD.md).
2. Rebuild with `python3 workspace-2026-10-28/src/build.py`.
3. Run the dashboard checks and review the preview. Commit source and generated
   HTML together, then push a branch. Vercel creates a preview deployment once the
   repository is connected. Its toolbar supports comments on previews when enabled;
   persistent in-app annotations are a separate feature.
4. Merge reviewed changes into `main`. Vercel deploys them to the same production
   URL automatically. A failed build keeps the previous successful deployment live.
   Require the **Dashboard checks** GitHub check in branch protection if financial
   and browser checks must pass before a merge. Vercel does not wait for that CI job
   by default.

The website build uses the existing Python generator. It compares the result
byte-for-byte with the committed current dashboard and fails if they disagree.
It never chooses the old HTML in `dashboard/`. Only five files are published:
`index.html`, `version.json` (commit and dashboard checksum), `robots.txt`,
`tejas-preview.png` (shared-link image), and `tejas-icon.png` (home-screen icon).
Source files, reports, context and archives are outside the published directory.

Search indexing is disabled, but that is not access control. Anyone with an
unprotected investor URL can open the dashboard and its embedded model data.

## Local deployment check

Requires Python 3. Financial checks need Node 18+; browser checks need Playwright
and Chromium. No dependencies are needed for the Vercel build itself.

```sh
python3 tools/test-build-site.py
python3 tools/build-site.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
# In another terminal:
node tools/smoke-site.cjs http://127.0.0.1:8000/
```

Run the same smoke command against the live URL after deploying. `/version.json`
identifies the deployed commit and exact dashboard bytes. The dashboard currently
targets laptop screens; the source guide lists the supported sizes. Input changes
persist in each viewer's browser and are not shared with other investors.

## Tejas branding

The official logo lives in `workspace-2026-10-28/src/brand/tejas-logo.svg`.
The dashboard builder embeds the logo and browser icon, preserving offline use.
The public preview title and image are declared in the base HTML. All three
Vercel aliases use the same preview asset on `tejas-growth-model.vercel.app`.
To update the checked-in PNGs after changing the brand artwork or preview design,
run `node tools/render-brand.cjs` with Playwright available, then rebuild and check.
