const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createOrganizationPlatform } = require('../electron/organization-platform.cjs');

test('staff invitation creates a scoped staff session and is single-use', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-'));
  const platform = createOrganizationPlatform({ databasePath: path.join(dir, 'platform.sqlite') });
  try {
    const organization = platform.createOrganization({ name: 'Harbor Works' });
    const owner = platform.addStaff({ organizationId: organization.id, email: 'owner@harbor.org', displayName: 'Owner', role: 'owner' });
    const ownerSession = platform.createStaffSession({ membershipId: owner.id });
    const invite = platform.createStaffInvite(ownerSession.token, { email: 'staff@harbor.org', displayName: 'Staff member', role: 'employee' });
    assert.equal(invite.email, 'staff@harbor.org');
    const staffSession = platform.redeemStaffInvite({ inviteToken: invite.inviteToken, email: 'staff@harbor.org', displayName: 'Staff member', password: 'staff-pass-123' });
    assert.equal(staffSession.membership.role, 'employee');
    assert.equal(staffSession.membership.email, 'staff@harbor.org');
    const loggedIn = platform.loginStaff({ email: 'staff@harbor.org', password: 'staff-pass-123' });
    assert.equal(loggedIn.membership.id, staffSession.membership.id);
    assert.throws(() => platform.redeemStaffInvite({ inviteToken: invite.inviteToken, email: 'staff@harbor.org', displayName: 'Staff member', password: 'staff-pass-123' }), /invalid, expired, or already used/);
  } finally {
    platform.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
