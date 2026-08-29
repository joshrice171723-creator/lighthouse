const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("participant consent API is session, tenant, and employment-outcomes scoped", () => {
  const controller = fs.readFileSync(path.join(root, "backend", "app", "controllers", "api", "organization", "participant_consents_controller.rb"), "utf8");
  const routes = fs.readFileSync(path.join(root, "backend", "config", "routes.rb"), "utf8");
  assert.match(controller, /subject_type: "participant"/);
  assert.match(controller, /participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(controller, /consent_type: "employment_outcomes"/);
  assert.match(controller, /status: "granted", revoked_at: nil/);
  assert.match(controller, /update!\(status: "revoked", revoked_at: Time\.current\)/);
  assert.doesNotMatch(controller, /storage_path|response_text|resume|treatment|diagnos/i);
  assert.match(routes, /post "participant\/consent" => "participant_consents#index"/);
  assert.match(routes, /post "participant\/consent\/revoke" => "participant_consents#revoke"/);
});

test("participant UI exposes consent state, revocation, and refresh recovery", () => {
  const ui = fs.readFileSync(path.join(root, "src", "OrganizationPortal.jsx"), "utf8");
  assert.match(ui, /organizationParticipantConsent: "participant\/consent"/);
  assert.match(ui, /organizationParticipantConsentRevoke: "participant\/consent\/revoke"/);
  assert.match(ui, /Privacy & consent/);
  assert.match(ui, /Turn off aggregate reporting/);
  assert.match(ui, /loadParticipantConsent/);
  assert.match(ui, /consentLoading/);
  assert.match(ui, /Employment-outcomes consent lets your organization include your progress/);
  assert.match(ui, /Your aggregate reporting consent is now off/);
});

test("synthetic seed contains a participant-owned employment consent", () => {
  const seed = fs.readFileSync(path.join(root, "backend", "db", "seeds.rb"), "utf8");
  assert.match(seed, /demo-consent/);
  assert.match(seed, /consent_type: "employment_outcomes"/);
  assert.match(seed, /status: "granted"/);
  assert.match(seed, /participant_id: participant\.id, organization_id: organization\.id/);
});
