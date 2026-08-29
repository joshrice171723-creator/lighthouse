const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("participant jobs API stays participant and tenant scoped", () => {
  const source = fs.readFileSync(path.join(root, "backend", "app", "controllers", "api", "organization", "participant_jobs_controller.rb"), "utf8");
  assert.match(source, /subject_type: "participant"/);
  assert.match(source, /participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(source, /STATUSES = %w\[saved applied interviewing offer rejected withdrawn archived\]/);
  assert.match(source, /where\(id: job_id, participant_id: participant\.id, organization_id: participant\.organization_id\)/);
});

test("participant tracker is wired to the Rails jobs routes", () => {
  const source = fs.readFileSync(path.join(root, "src", "OrganizationPortal.jsx"), "utf8");
  assert.match(source, /organizationParticipantJobs: "participant\/jobs"/);
  assert.match(source, /organizationParticipantJobsUpdate: "participant\/jobs\/update"/);
  assert.match(source, /<JobTrackerView session=\{session\} \/>/);
  assert.match(source, /Offline demo mode/);
});
