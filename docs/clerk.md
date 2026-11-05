# Clerk access for the investor dashboard

This remains a Python-built HTML dashboard hosted on Vercel with framework
**Other**. A Node.js function authenticates each document request before reading
`.private/dashboard.html`. Access is configured per Vercel project:

- `DASHBOARD_ACCESS_MODE=authenticated`: every signed-in user can view the model
  without an invitation or manual approval.
- `restricted` (the default): requires a server-managed
  `publicMetadata.dashboardAccess` grant or an allowlisted, verified primary email.

Both modes deny banned or locked accounts and an explicit
`publicMetadata.dashboardAccess:false` block. Browser-editable metadata cannot
override a block. The owner selected `authenticated` access for all three linked
Tejas projects: `tejas-growth-model`, `tejas-fin-model`, and `tejas-growth-plan`.
Public `dist/` contains no model HTML.
Both `/` and `/index.html` route to the function; calling `/api/dashboard`
directly performs the same checks. Responses must never be cached publicly.

## Activate the integration

The Clerk CLI currently rejects `--accountless` for its `javascript` framework.
Use a Clerk application owned by your account; no framework migration is needed.

1. Create/select the Clerk application in the Clerk Dashboard, or link an existing
   application using `npx -y clerk@latest auth login` and
   `npx -y clerk@latest link`. Do not install the CLI globally.
2. For access by all signed-in users, allow public sign-up in Clerk and set
   `DASHBOARD_ACCESS_MODE=authenticated` in each Vercel project. Clerk still
   handles account verification and sign-in. For invitation-only access instead,
   choose Clerk's **Invite-only** access mode and use `restricted` dashboard access.
3. Configure the hosted **Account Portal** sign-in page and set the application's
   **Home URL** to the dashboard origin. Use the portal's real sign-in URL for
   `CLERK_SIGN_IN_URL`; it remains the recovery fallback and backend SDK setting.
   The project's local `/sign-up` and `/sign-in` pages handle normal account access.
4. Add these variables to each Vercel project using this repository. A template is
   in `.env.example`. Keep the secret key in Vercel or a git-ignored env file.

   | Variable | Value |
   | --- | --- |
   | `CLERK_PUBLISHABLE_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | The selected Clerk instance's publishable key; either name is supported |
   | `CLERK_SECRET_KEY` | Its secret key; server-only |
   | `APP_ORIGIN` | That project's stable HTTPS origin, without a path |
   | `CLERK_SIGN_IN_URL` | Full hosted Clerk Account Portal sign-in URL, used for recovery fallback and backend SDK configuration |
   | `CLERK_AUTHORIZED_PARTIES` | Optional comma-separated permitted session origins; defaults to `APP_ORIGIN` |
   | `CLERK_JWT_KEY` | Optional PEM public key for networkless signature verification |
   | `DASHBOARD_ALLOWED_EMAILS` | Optional comma-separated exact viewer emails; only Clerk-verified primary addresses qualify |
   | `DASHBOARD_ACCESS_MODE` | `authenticated` for all signed-in users; `restricted` by default |

   A standard production Clerk setup uses production keys and Clerk's domain
   setup. The owner has explicitly approved using the existing **development**
   instance on `https://tejas-growth-model.vercel.app`; a custom domain is not a
   prerequisite for that approved setup. See the development-origin procedure
   below. Use a separate development instance and test keys for previews, with
   the exact preview origin configured. Vercel previews derive their origin from the
   platform-supplied `VERCEL_URL`; omit `CLERK_AUTHORIZED_PARTIES` in Preview
   to use that exact origin. Never add a wildcard or derive trusted origins
   from a user-provided redirect parameter.
5. In `authenticated` mode, viewers simply register or sign in: no grants or
   allowlist entries are needed. In `restricted` mode, grant the Clerk user access
   or add its verified primary email to `DASHBOARD_ALLOWED_EMAILS`. The dashboard
   allowlist does not bypass Clerk's sign-up restrictions.
6. Deploy a preview and verify the complete signed-out → create account/sign-in → dashboard
   flow with real Clerk credentials before promoting production. An ordinary
   signed-in account must receive HTTP 200 in `authenticated` mode and HTTP 403
   in `restricted` mode. Explicitly blocked accounts must receive HTTP 403 in both.

Until the required environment variables are configured, the function fails
closed with HTTP 503. Unrecognized access modes also fail closed. This change alone does not secure an
older deployment. Retire or protect earlier public deployments and other aliases
that still publish the old static HTML.

## Branded account pages and Google sign-in

After Clerk's handshake, an unauthenticated dashboard request redirects to
`/sign-up` on the same project, with **Create account** first and **Sign in**
alongside it. `api/auth.mjs` and `server/auth-page.mjs` serve `/sign-up/:path*`
and `/sign-in/:path*` through Vercel rewrites. `tools/build-site.py` assembles
`site-assets/auth.html` into `.private/auth.html`, using the existing Tejas logo,
Poppins fonts, blue `#0851a3`, and cream branding in a responsive, form-first layout.

The pages load official ClerkJS 6 and UI 1 prebuilt widgets for sign-up, sign-in,
verification, and recovery. Only public configuration (the publishable key and
script URLs) and canonical project return URLs are injected; the secret key and
financial model HTML remain server-side. The account pages retain private/no-store,
noindex, nosniff, and same-origin referrer headers. Keep each project's existing
`APP_ORIGIN` so successful account access returns to that project's dashboard.

Google buttons appear automatically when the Google social connection is enabled
for the shared Clerk Development instance. The widgets place social buttons at
the top with `appearance.options.socialButtonsPlacement`. In the Clerk Dashboard,
select the correct Development instance, then **SSO connections → Add connection
→ For all users → Google**, enable sign-up and sign-in, and **Save**. Development
uses Clerk's shared credentials; no Google client keys are needed for this step.
The latest public Frontend API `user_settings.social` check returned `{}`, so
Google availability has not been verified. Recheck that instance and confirm the
button and completed Google return flow on each project after saving.

## Fix the development Account Portal return

The hosted recovery fallback still needs the correct development home origin;
do not depend on Clerk's browser SDK automatically discovering it. On 2026-11-05, the
existing instance's effective Home URL, after-sign-in URL, and after-sign-up URL
all pointed at `https://rare-weevil-5017.accounts.dev/default-redirect`.
The handler's `redirect_url` and `afterSignInUrl` do not persist these
instance-level defaults.

For this existing application, set the supported Backend API
`development_origin` field to `https://tejas-growth-model.vercel.app`.
This has already been applied to development instance
`ins_3LgCAQSK4uuHBnqJlv5qbbs4sJz`. The equivalent SDK operation, with the
existing server-only key securely loaded in the environment, is:

```js
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
await clerk.instances.update({ developmentOrigin: process.env.APP_ORIGIN });
```

This is `PATCH https://api.clerk.com/v1/instance`, not a domain migration or
reinitialization. Re-read the public Frontend API `/v1/environment` and
`/v1/account_portal`: Home URL, `after_sign_in_url`, and `after_sign_up_url`
must resolve to the dashboard origin. Both endpoints now report the dashboard
origin for those returns. Instance configuration takes effect immediately;
this change does not require rebuilding or redeploying the Vercel function.

Keep URL-based development session syncing enabled. A browser document request
first follows Clerk's handshake, then the handler preserves the returned
cookies and verifies the session before reading the model. For HTTP checks,
follow and record each redirect explicitly: a final HTTP 200 from the hosted
sign-in page is not a dashboard success. Verify the final host, HTML content,
and status. A Backend API-issued session token lacks the browser origin (`azp`)
claim and is correctly rejected by this dashboard's `authorizedParties` check;
do not relax that check to make an automated test pass.

Use Clerk's official Testing Tokens and `+clerk_test` email addresses for
temporary automated sign-up tests. They keep bot detection enabled for ordinary
visitors and avoid sending verification emails. Test both the sign-in and
sign-up paths, verify the configured access policy and explicit account blocks, and
delete test users afterward. Always verify `/.private/dashboard.html` remains
HTTP 404, including when authenticated.

References: [instance update](https://clerk.com/docs/reference/backend/instance/update),
[Account Portal development home detection](https://clerk.com/docs/guides/account-portal/getting-started),
[portal redirects](https://clerk.com/docs/guides/account-portal/direct-links),
and [testing](https://clerk.com/docs/guides/development/testing/overview).

## Block or restore an account

In Clerk's **Users** page, select an account and edit **Public metadata**:
`"dashboardAccess":false` blocks dashboard access on its next request.
Set it to `true` to restore access. Preserve any other metadata fields.
In `authenticated` mode, every account without an explicit block is already
allowed, so ordinary viewers never need this step.

## Invitations and administrator commands

Run administrator commands from your own trusted terminal with keys loaded
from a git-ignored `.env`. These commands use Clerk's Backend API. They are not
public web endpoints. **The invite command sends an email.**

```sh
# An existing owner account: copy the user ID from Clerk's Users page.
node --env-file=.env tools/dashboard-access.mjs grant user_REPLACE_ME

# New viewer: invitation transfers dashboardAccess:true to the accepted user.
node --env-file=.env tools/dashboard-access.mjs invite investor@example.com

# Remove an existing viewer's access on their next dashboard request.
node --env-file=.env tools/dashboard-access.mjs revoke user_REPLACE_ME
```

For invitation-only (`restricted`) access, invitations created in Clerk should include
`{"dashboardAccess":true}` in their public metadata, or grant the accepted user
with the command above. An invitation alone without this metadata does not
authorize the financial model. Browser-editable `unsafeMetadata` is ignored.
Revoke pending invitations separately in Clerk so they cannot later be accepted.
An explicit `dashboardAccess:false` user metadata flag overrides both access
modes and email allowlist access. In restricted mode, remove retired viewers
from `DASHBOARD_ALLOWED_EMAILS` too.

Viewers create an account or sign in on the project's branded account pages;
the hosted portal remains available for recovery and session management.
Clerk's server handshake handles session cookie synchronization.
Once delivered, dashboard content can be saved by an authorized viewer; access
revocation governs subsequent requests.

## Checks

```sh
npm ci --ignore-scripts
npm run test:auth
python3 tools/test-build-site.py
python3 tools/build-site.py
```

The auth tests use the real Clerk SDK to verify locally signed RSA session
tokens, with only the user API mocked. They cover invalid/expired tokens,
untrusted origins, pending sessions, missing grants, revocation, backend failure,
handshake cookies and cache headers. Build tests ensure the private model never
appears in public `dist/` and stale output cannot be published.

Real Clerk sign-in, invitation email delivery, cookie renewal, Vercel function
bundling, and production routing still require a configured preview deployment.
Do not use an unauthenticated static-server smoke check as proof of access control.
