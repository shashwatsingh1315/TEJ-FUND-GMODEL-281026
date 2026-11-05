# Publish the investor dashboard

Vercel serves a stable investor URL. GitHub remains the source; the Claude artifact
is a separately published copy and is not updated by this deployment.

## Connect Vercel once

1. Open <https://vercel.com/new> and sign in with GitHub.
2. Import `shashwatsingh1315/TEJ-FUND-GMODEL-281026`. Grant Vercel access to this
   repository if it does not appear. The repository can stay private.
3. Keep **Root Directory** at the repository root and **Framework Preset** at
   **Other**. `vercel.json` supplies the build command and output directory:
   `python3 tools/build-site.py`, `dist`. Node 24+ installs the Clerk backend SDK.
   Configure the required variables and access mode in [Clerk setup](clerk.md)
   before deploying; missing configuration denies access.
4. Use `main` as the **Production Branch**. Deploy, then share the project's
   production URL with invited investors. Check Deployment Protection allows your
   intended investors to reach Clerk's sign-in flow, then test both signed-out and
   authorized access. With `DASHBOARD_ACCESS_MODE=authenticated`, any signed-in
   account can view the model. Explicitly blocked accounts must receive HTTP 403.

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
It never chooses the old HTML in `dashboard/`. Only four static files are public:
`version.json` (commit and dashboard checksum), `robots.txt`,
`tejas-preview.png` (shared-link image), and `tejas-icon.png` (home-screen icon).
The dashboard HTML is generated into `.private/dashboard.html` and included only
in the authenticated Node function bundle. Source files, reports, context and
archives are outside the published directory.

Search indexing is disabled. Clerk session verification and the project's
dashboard access mode provide access control; see [Clerk setup](clerk.md). Previous
static deployments remain public until retired or protected separately.

## Local deployment check

Requires Python 3 and Node 24+. Browser checks need Playwright and Chromium.

```sh
npm ci --ignore-scripts
npm run test:auth
python3 tools/test-build-site.py
python3 tools/build-site.py
```

CI also runs the model browser check using a temporary copy served only on
loopback; it does not publish the private HTML in `dist/`. For a deployed preview,
verify real Clerk sign-in and account blocks as described in [Clerk setup](clerk.md).
The existing unauthenticated smoke script is a model-rendering check and cannot
test a protected live deployment without an authenticated browser session.
`/version.json` identifies the deployed commit and exact dashboard bytes. The dashboard currently
targets laptop screens; the source guide lists the supported sizes. Input changes
persist in each viewer's browser and are not shared with other investors.

## Tejas branding

The official logo lives in `workspace-2026-10-28/src/brand/tejas-logo.svg`.
The dashboard builder embeds the logo and browser icon, preserving offline use.
The public preview title and image are declared in the base HTML. All three
Vercel aliases use the same preview asset on `tejas-growth-model.vercel.app`.
To update the checked-in PNGs after changing the brand artwork or preview design,
run `node tools/render-brand.cjs` with Playwright available, then rebuild and check.
