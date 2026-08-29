const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'backend/app/controllers/api/organization/workforce_controller.rb'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'backend/config/routes.rb'), 'utf8');

test('workforce API derives tenant scope and requires active consent', () => {
  assert.match(controller, /organization_id: staff_session\.organization_id/);
  assert.match(controller, /status: "granted", revoked_at: nil/);
  assert.match(controller, /permit\(\*ALLOWED_ATTRIBUTES/);
  assert.match(controller, /params\[:input\]/);
  assert.match(controller, /record_type == "consent"/);
});

test('workforce report is staff-scoped and aggregate-only', () => {
  assert.match(controller, /subject_type: "staff"/);
  assert.match(controller, /where\(location_id: membership\.location_id\)/);
  assert.match(controller, /suppressed = participant_count\.positive\? && participant_count < 5/);
  assert.match(controller, /report: suppressed \? nil : report/);
  assert.match(controller, /detail: nil/);
  assert.match(routes, /post "workforce\/records" => "workforce#create"/);
  assert.match(routes, /post "workforce\/report" => "workforce#report"/);
  assert.match(routes, /post "employment-support\/save" => "workforce#create"/);
  assert.match(routes, /post "employment-report" => "workforce#report"/);
});
