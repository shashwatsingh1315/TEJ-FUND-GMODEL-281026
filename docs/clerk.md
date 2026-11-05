# Clerk access for the investor dashboard

This remains a Python-built HTML dashboard hosted on Vercel with framework
**Other**. A Node.js function authenticates each document request and checks
the user's server-managed `publicMetadata.dashboardAccess` grant before
reading `.private/dashboard.html`. Public `dist/` contains no model HTML.
Both `/` and `/index.html` route to the function; calling `/api/dashboard`
directly performs the same checks. Responses must never be cached publicly.

## Activate the integration

The Clerk CLI currently rejects `--accountless` for its `javascript` framework.
Use a Clerk application owned by your account; no framework migration is needed.

1. Create/select the Clerk application in the Clerk Dashboard, or link an existing
   application using `npx -y clerk@latest auth login` and
   `npx -y clerk@latest link`. Do not install the CLI globally.
2. Set the application's **Access mode** to **Invite-only**. The API value is
   `restricted`. When using the CLI, inspect `npx -y clerk@latest config schema`
   and apply the appropriate `sign_up_mode` setting with `config patch`.
3. Configure the hosted **Account Portal** sign-in page and set the application's
   **Home URL** to the dashboard origin. Use the portal's real sign-in URL for
   `CLERK_SIGN_IN_URL`; there is no local `/sign-in` page.
4. Add these variables to each Vercel project using this repository. A template is
   in `.env.example`. Keep the secret key in Vercel or a git-ignored env file.

   | Variable | Value |
   | --- | --- |
   | `CLERK_PUBLISHABLE_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | The selected Clerk instance's publishable key; either name is supported |
   | `CLERK_SECRET_KEY` | Its secret key; server-only |
   | `APP_ORIGIN` | That project's stable HTTPS origin, without a path |
   | `CLERK_SIGN_IN_URL` | Full hosted Clerk Account Portal sign-in URL |
   | `CLERK_AUTHORIZED_PARTIES` | Optional comma-separated permitted session origins; defaults to `APP_ORIGIN` |
   | `CLERK_JWT_KEY` | Optional PEM public key for networkless signature verification |

   Production requires production keys and Clerk's production domain setup.
   Use a separate development instance and test keys for previews, with the exact
   preview origin configured. Vercel previews derive their origin from the
   platform-supplied `VERCEL_URL`; omit `CLERK_AUTHORIZED_PARTIES` in Preview
   to use that exact origin. Never add a wildcard or derive trusted origins
   from a user-provided redirect parameter.
5. Grant your own Clerk user access before testing, then invite investors as below.
6. Deploy a preview and verify the complete signed-out → sign-in → dashboard
   flow with real Clerk credentials before promoting production. Confirm an
   ordinary signed-in account without a grant receives HTTP 403.

Until the environment variables and account grants are configured, the function
fails closed with HTTP 503 or 403. This code change alone does not secure an
older deployment. Retire or protect earlier public deployments and other aliases
that still publish the old static HTML.

## Invite and revoke viewers

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

For invitations created in the Clerk Dashboard instead, include
`{"dashboardAccess":true}` in their public metadata, or grant the accepted user
with the command above. An invitation alone without this metadata does not
authorize the financial model. Browser-editable `unsafeMetadata` is ignored.
Revoke pending invitations separately in Clerk so they cannot later be accepted.

Viewers sign in through Clerk's hosted portal and can manage/sign out of their
session there. Clerk's server handshake handles session cookie synchronization.
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
