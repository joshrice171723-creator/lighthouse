const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createOrganizationPlatform } = require('../electron/organization-platform.cjs');

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-report-'));
  const platform = createOrganizationPlatform({ databasePath: path.join(dir, 'platform.sqlite') });
  const organization = platform.createOrganization({ name: 'Synthetic Workforce', slug: `synthetic-${Date.now()}` });
  const membership = platform.addStaff({ organizationId: organization.id, email: 'admin@synthetic.test', displayName: 'Synthetic Admin', password: 'admin-pass-123', role: 'admin' });
  const staffSession = platform.createStaffSession({ membershipId: membership.id });
  return { dir, platform, organization, session: staffSession.token };
}

function participant(platform, staffSession, index) {
  const invite = platform.createInvite(staffSession, { email: `participant-${index}@synthetic.test` });
  return platform.redeemInvite({ inviteToken: invite.inviteToken, email: invite.email, displayName: `Synthetic Participant ${index}`, password: 'participant-pass-123' });
}

test('employment report aggregates a complete synthetic workforce journey without participant details', () => {
  const { dir, platform, session } = fixture();
  try {
    for (let index = 1; index <= 5; index += 1) {
      const current = participant(platform, session, index);
      platform.saveEmploymentSupport(session, { kind: 'consent', participantId: current.participant.id, status: 'granted' });
      platform.saveEmploymentSupport(session, { kind: 'profile', participantId: current.participant.id, employmentGoal: 'Full-time customer support work' });
      platform.saveEmploymentSupport(session, { kind: 'enrollment', participantId: current.participant.id, enrollmentDate: '2026-08-01', status: 'active' });
      platform.saveEmploymentSupport(session, { kind: 'service', participantId: current.participant.id, serviceType: 'Job-search assistance', serviceDate: '2026-08-05' });
      platform.saveEmploymentSupport(session, { kind: 'job_activity', participantId: current.participant.id, activityType: 'application', activityDate: '2026-08-06' });
      if (index < 5) {
        const placement = platform.saveEmploymentSupport(session, { kind: 'placement', participantId: current.participant.id, employerName: 'Synthetic Employer', jobTitle: 'Support Specialist', startDate: '2026-08-10' });
        platform.saveEmploymentSupport(session, { kind: 'retention', participantId: current.participant.id, jobPlacementId: placement.id, checkinDate: '2026-09-09', daysSinceStart: 30, stillEmployed: true });
      } else {
        platform.saveEmploymentSupport(session, { kind: 'exit', participantId: current.participant.id, exitDate: '2026-08-20', exitReason: 'no_outcome' });
      }
    }
    const report = platform.employmentReport(session, { from: '2026-08-01', to: '2026-10-01' });
    assert.equal(report.privacy.participantCount, 5);
    assert.equal(report.privacy.consentedParticipantCount, 5);
    assert.equal(report.privacy.suppressed, false);
    assert.deepEqual(report.metrics, { enrolledParticipants: 5, employmentGoalsRecorded: 5, servicesDelivered: 5, jobActivitiesRecorded: 5, placementsStarted: 4, retentionCheckins: 4, retainedAt30Days: 4, retainedAt60Days: 0, retainedAt90Days: 0, noOutcomeExits: 1 });
    assert.deepEqual(report.missingData, { consent: 0, employmentGoal: 0, enrollment: 0, outcomeOrExit: 0 });
    assert.equal(Object.hasOwn(report, 'participants'), false);
    assert.equal(JSON.stringify(report).includes('Synthetic Participant'), false);
  } finally { platform.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('employment report exposes missing consent and suppresses small cohorts', () => {
  const { dir, platform, session } = fixture();
  try {
    const current = participant(platform, session, 1);
    platform.saveEmploymentSupport(session, { kind: 'profile', participantId: current.participant.id, employmentGoal: 'Warehouse work' });
    const report = platform.employmentReport(session);
    assert.equal(report.privacy.suppressed, true);
    assert.equal(report.metrics, null);
    assert.equal(report.missingData, null);
  } finally { platform.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('employment writes and reports enforce staff role and tenant scope, including empty reports', () => {
  const first = fixture(); const second = fixture();
  try {
    const current = participant(first.platform, first.session, 1);
    assert.throws(() => second.platform.saveEmploymentSupport(second.session, { kind: 'profile', participantId: current.participant.id, employmentGoal: 'Wrong tenant' }), /outside this staff account/);
    assert.throws(() => first.platform.employmentReport('not-a-session'), /invalid or expired/);
    const empty = second.platform.employmentReport(second.session);
    assert.equal(empty.empty, true);
    assert.deepEqual(empty.metrics, { enrolledParticipants: 0, employmentGoalsRecorded: 0, servicesDelivered: 0, jobActivitiesRecorded: 0, placementsStarted: 0, retentionCheckins: 0, retainedAt30Days: 0, retainedAt60Days: 0, retainedAt90Days: 0, noOutcomeExits: 0 });
    assert.deepEqual(empty.privacy, { minimumCohort: 5, participantCount: 0, consentedParticipantCount: 0, suppressed: false });
  } finally { first.platform.close(); second.platform.close(); fs.rmSync(first.dir, { recursive: true, force: true }); fs.rmSync(second.dir, { recursive: true, force: true }); }
});
