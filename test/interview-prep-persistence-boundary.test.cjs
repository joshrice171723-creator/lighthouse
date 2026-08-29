const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const migration = read('backend', 'db', 'migrate', '20260829000000_create_interview_preparation.rb');
const controller = read('backend', 'app', 'controllers', 'api', 'organization', 'interview_prep_controller.rb');
const models = {
  context: read('backend', 'app', 'models', 'interview_prep_context.rb'),
  session: read('backend', 'app', 'models', 'interview_prep_session.rb'),
  result: read('backend', 'app', 'models', 'interview_prep_result.rb')
};

test('interview-prep persistence keeps context, session, and result ownership tenant-scoped', () => {
  // Rails/PostgreSQL is not part of the Node test harness, so this cross-checks
  // the migration contract against every persistence and authorization write path.
  for (const table of ['contexts', 'sessions', 'results']) {
    assert.match(migration, new RegExp(`create_table :interview_prep_${table}`));
  }
  for (const column of ['participant_id', 'organization_id']) {
    assert.match(migration, new RegExp(`t\\.string :${column}, null: false`));
  }
  for (const column of ['context_id', 'session_id']) {
    assert.match(migration, new RegExp(`t\\.string :${column}, null: false`));
  }
  assert.match(migration, /%i\[organization_id participant_id updated_at\]/);
  assert.match(migration, /%i\[organization_id participant_id result_type created_at\]/);

  assert.match(models.context, /has_many :sessions, class_name: "InterviewPrepSession", foreign_key: :context_id/);
  assert.match(models.session, /belongs_to :context, class_name: "InterviewPrepContext", foreign_key: :context_id/);
  assert.match(models.session, /has_many :results, class_name: "InterviewPrepResult", foreign_key: :session_id/);
  assert.match(models.result, /belongs_to :session, class_name: "InterviewPrepSession", foreign_key: :session_id/);
  assert.match(models.result, /belongs_to :context, class_name: "InterviewPrepContext", foreign_key: :context_id/);

  for (const model of Object.values(models)) {
    assert.match(model, /class .* < LighthouseRecord/);
  }
  for (const persistence of [
    'InterviewPrepContext.create!',
    'InterviewPrepSession.create!',
    'InterviewPrepResult.create!'
  ]) {
    assert.match(controller, new RegExp(`${persistence}[^\\n]*organization_id: participant\\.organization_id`));
    assert.match(controller, new RegExp(`${persistence}[^\\n]*participant_id: participant\\.id`));
  }

  assert.match(controller, /InterviewPrepContext\.where\(participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(controller, /InterviewPrepSession\.where\(participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(controller, /InterviewPrepResult\.where\(participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(controller, /InterviewPrepContext\.where\(id: id, participant_id: participant\.id, organization_id: participant\.organization_id, status: "active"\)/);
  // Associations are for hydration only; authorization must use the scoped queries above.
  assert.doesNotMatch(controller, /where\(.*context\.sessions|where\(.*session\.results|context\.sessions\.find|session\.results\.find/);
  assert.doesNotMatch(`${migration}\n${controller}\n${Object.values(models).join('\n')}`, /clinical|medical|treatment|sobriety|recovery|audio|recordings/i);
});
