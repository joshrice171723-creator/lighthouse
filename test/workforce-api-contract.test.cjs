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
  assert.match(controller, /params\.permit\(\*ALLOWED_ATTRIBUTES/);
});

test('workforce report is staff-scoped and aggregate-only', () => {
  assert.match(controller, /subject_type: "staff"/);
  assert.match(controller, /where\(location_id: membership\.location_id\)/);
  assert.match(controller, /detail: nil/);
  assert.match(routes, /post "workforce\/records" => "workforce#create"/);
  assert.match(routes, /post "workforce\/report" => "workforce#report"/);
});
