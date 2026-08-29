const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'backend/app/controllers/api/organization/participant_application_accounts_controller.rb'), 'utf8');
const route = fs.readFileSync(path.join(root, 'backend/config/routes.rb'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'backend/db/migrate/20260829173000_create_participant_application_accounts.rb'), 'utf8');
const model = fs.readFileSync(path.join(root, 'backend/app/models/participant_application_account.rb'), 'utf8');
const extension = fs.readFileSync(path.join(__dirname, '..', '..', 'applypilot/background.js'), 'utf8');

assert.match(route, /participant\/application-accounts/);
assert.match(controller, /subject_type: "participant"/);
assert.match(controller, /organization_id: session\.organization_id/);
assert.match(model, /STATUSES = %w\[created failed\]/);
assert.match(controller, /site_key.*status/);
assert.match(migration, /organization_id.*participant_id.*site_key/);
assert.match(migration, /unique: true/);
assert.match(extension, /APPLYPILOT_RECORD_SYNTHETIC_ACCOUNT/);
assert.match(extension, /participant\/application-accounts/);
assert.match(extension, /siteKey, status/);
assert.doesNotMatch(extension, /password.*application-accounts/);
console.log('Participant synthetic account boundary: 11/11 checks passed');
