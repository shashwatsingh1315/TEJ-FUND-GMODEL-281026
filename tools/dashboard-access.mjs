// Administrator-only command, never deployed as a public API endpoint.
import { createClerkClient } from '@clerk/backend';

const [action, identifier] = process.argv.slice(2);
if (!['invite', 'grant', 'revoke'].includes(action) || !identifier) {
  console.error('Usage: node --env-file=.env tools/dashboard-access.mjs invite EMAIL | grant USER_ID | revoke USER_ID');
  process.exit(1);
}
if (!process.env.CLERK_SECRET_KEY) {
  console.error('Set CLERK_SECRET_KEY securely before managing dashboard access.');
  process.exit(1);
}

try {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  if (action === 'invite') {
    // Clerk sends the invitation through its hosted Account Portal. The grant
    // transfers to the accepting user's publicMetadata after sign-up.
    await clerk.invitations.createInvitation({
      emailAddress: identifier,
      publicMetadata: { dashboardAccess: true },
    });
    console.log('Invitation sent.');
  } else {
    await clerk.users.updateUserMetadata(identifier, {
      publicMetadata: { dashboardAccess: action === 'grant' },
    });
    console.log(action === 'grant' ? 'Dashboard access granted.' : 'Dashboard access revoked.');
  }
} catch {
  console.error('Access update failed. Check the Clerk instance, credentials, and recipient/user ID.');
  process.exitCode = 1;
}
