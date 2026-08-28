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

test('partner setup stores the partner organization name independently of Lighthouse', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-'));
  const platform = createOrganizationPlatform({ databasePath: path.join(dir, 'platform.sqlite') });
  try {
    const organization = platform.createOrganization({ name: 'Harbor House' });
    assert.equal(organization.name, 'Harbor House');
    assert.notEqual(organization.name, 'North Star');
  } finally {
    platform.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform owner accounts are stored separately from partner memberships', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-'));
  const platform = createOrganizationPlatform({ databasePath: path.join(dir, 'platform.sqlite') });
  try {
    const account = platform.createPlatformAccount({ email: 'builder@northstar.local', displayName: 'Builder', password: 'owner-pass-123' });
    const organization = platform.createOrganization({ name: 'Harbor House' });
    const membership = platform.addStaff({ organizationId: organization.id, email: 'admin@harbor.org', displayName: 'Partner Admin', password: 'admin-pass-123', role: 'admin' });
    assert.equal(account.email, 'builder@northstar.local');
    assert.equal(membership.role, 'admin');
    assert.notEqual(account.email, membership.email);
  } finally {
    platform.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('participants can retrieve only their own uploaded documents', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-'));
  const platform = createOrganizationPlatform({ databasePath: path.join(dir, 'platform.sqlite') });
  try {
    const organization = platform.createOrganization({ name: 'Harbor House' });
    const owner = platform.addStaff({ organizationId: organization.id, email: 'owner@harbor.org', displayName: 'Owner', role: 'owner' });
    const ownerSession = platform.createStaffSession({ membershipId: owner.id });
    const location = platform.createLocation(ownerSession.token, { name: 'Main location' });
    const invite = platform.createInvite(ownerSession.token, { email: 'josh@harbor.org', locationId: location.id });
    const participantSession = platform.redeemInvite({ inviteToken: invite.inviteToken, email: 'josh@harbor.org', password: 'participant-pass-123' });
    const uploaded = platform.uploadParticipantDocument(participantSession.token, { fileName: 'resume.pdf', mimeType: 'application/pdf', dataBase64: Buffer.from('resume bytes').toString('base64') });
    const fetched = platform.getParticipantDocument(participantSession.token, uploaded.id);
    assert.equal(fetched.fileName, 'resume.pdf');
    assert.equal(Buffer.from(fetched.dataBase64, 'base64').toString(), 'resume bytes');
    assert.throws(() => platform.getParticipantDocument(ownerSession.token, uploaded.id), /session is invalid or expired/);
    platform.uploadParticipantDocument(participantSession.token, { fileName: 'letter.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', documentType: 'cover_letter', dataBase64: Buffer.from('cover letter').toString('base64') });
    platform.uploadParticipantDocument(participantSession.token, { fileName: 'Cover Letter - Harbor House.pdf', mimeType: 'application/pdf', documentType: 'resume', dataBase64: Buffer.from('cover letter').toString('base64') });
    assert.deepEqual(platform.listParticipantDocuments(participantSession.token).map((document) => document.documentType).sort(), ['cover_letter', 'resume', 'resume']);
  } finally {
    platform.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
