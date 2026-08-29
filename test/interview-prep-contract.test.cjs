const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const railsController = fs.readFileSync(path.join(root, 'backend', 'app', 'controllers', 'api', 'organization', 'interview_prep_controller.rb'), 'utf8');
const participantView = fs.readFileSync(path.join(root, 'src', 'OrganizationPortal.jsx'), 'utf8');

test('interview preparation is Rails-authoritative and server-scored', () => {
  assert.match(railsController, /def index/);
  assert.match(railsController, /def rubric/);
  assert.match(railsController, /participant_id: participant\.id, organization_id: participant\.organization_id/);
  assert.match(railsController, /owned_context\(participant, input\[:contextId\]\)/);
  assert.match(railsController, /communication_feedback/);
  assert.doesNotMatch(railsController, /clinical|diagnos|medication|recovery narrative|recording/i);
});

test('participant UI consumes the server catalog and exposes the complete supported modes', () => {
  assert.match(participantView, /const catalog = data\?\.catalog/);
  for (const mode of ['simulation', 'questions', 'flashcards', 'fundamentals', 'drills']) assert.match(participantView, new RegExp(`setMode\\(\\"${mode}\\"\\)`));
  assert.match(participantView, /Typed responses only; audio, recordings, and AI processing are unavailable/);
  assert.doesNotMatch(participantView, /const prepQuestions =/);
});
