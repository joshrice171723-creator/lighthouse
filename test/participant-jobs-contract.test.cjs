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
  assert.match(source, /applicationUrl: "http:\/\/127\.0\.0\.1:38742\/apply\/#\{slug\}"/);
});

test("participant tracker is wired to the Rails jobs routes", () => {
  const source = fs.readFileSync(path.join(root, "src", "OrganizationPortal.jsx"), "utf8");
  assert.match(source, /organizationParticipantJobs: "participant\/jobs"/);
  assert.match(source, /organizationParticipantJobsUpdate: "participant\/jobs\/update"/);
  assert.match(source, /<JobTrackerView session=\{session\} \/>/);
  assert.match(source, /Offline demo mode/);
  assert.match(source, /Open synthetic application/);
});

test("participant document catalog is Rails-authoritative and metadata-only", () => {
  const controller = fs.readFileSync(path.join(root, "backend", "app", "controllers", "api", "organization", "participant_documents_controller.rb"), "utf8");
  const routes = fs.readFileSync(path.join(root, "backend", "config", "routes.rb"), "utf8");
  const ui = fs.readFileSync(path.join(root, "src", "OrganizationPortal.jsx"), "utf8");
  assert.match(controller, /participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(controller, /byteSize: document\.byte_size/);
  assert.doesNotMatch(controller.slice(controller.indexOf("def document_json"), controller.indexOf("def require_json_request")), /storage_path/);
  assert.match(routes, /post "participant\/documents" => "participant_documents#index"/);
  assert.match(ui, /organizationParticipantDocuments/);
  assert.match(ui, /organizationUploadDocument/);
  assert.match(routes, /post "participant\/documents\/upload" => "participant_documents#create"/);
  assert.match(controller, /Base64\.strict_decode64/);
  assert.match(controller, /5\.megabytes/);
});

test("Rails demo seed stays synthetic and repeatable", () => {
  const source = fs.readFileSync(path.join(root, "backend", "db", "seeds.rb"), "utf8");
  assert.match(source, /synthetic-local-demo/);
  assert.match(source, /demo-job-1/);
  assert.match(source, /demo-participant-session/);
  assert.match(source, /demo-participant-#{number}/);
  assert.match(source, /Synthetic Participant #{number}/);
  assert.match(source, /robins-house\.test/);
});
