# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Disposable local demo data only. Keep this deterministic and never point it at
# a production database or real participant records.
require "digest"

now = Time.current
organization = Organization.find_or_initialize_by(id: "demo-organization")
organization.assign_attributes(name: "Robins House Demo", slug: "robins-house-demo", status: "active")
organization.save!

location = OrganizationLocation.find_or_initialize_by(id: "demo-location")
location.assign_attributes(organization_id: organization.id, name: "Main workforce program", is_primary: true, status: "active")
location.save!

staff = OrganizationMembership.find_or_initialize_by(id: "demo-staff")
staff.assign_attributes(organization_id: organization.id, email: "staff@robins-house.test", display_name: "Demo Staff", role: "owner", location_id: location.id, status: "active")
staff.password = "demo-staff-password" if staff.respond_to?(:password=)
staff.save!

participant = ParticipantProfile.find_or_initialize_by(id: "demo-participant")
participant.assign_attributes(organization_id: organization.id, email: "participant.login@robins-house.test", display_name: "Alex Johnson", location_id: location.id, sponsor_membership_id: staff.id, status: "active", consent_version: "employment-outcomes-v1")
participant.password = "alex-pass-123" if participant.respond_to?(:password=)
participant.save!

consent = ParticipantConsent.find_or_initialize_by(id: "demo-consent")
consent.assign_attributes(participant_id: participant.id, organization_id: organization.id, consent_type: "employment_outcomes", version: "v1", status: "granted", recorded_at: now, recorded_by_membership_id: staff.id, revoked_at: nil)
consent.save!

4.times do |index|
  number = index + 2
  synthetic_participant = ParticipantProfile.find_or_initialize_by(id: "demo-participant-#{number}")
  synthetic_participant.assign_attributes(organization_id: organization.id, email: "participant#{number}.login@robins-house.test", display_name: "Synthetic Participant #{number}", location_id: location.id, sponsor_membership_id: staff.id, status: "active", consent_version: "employment-outcomes-v1")
  synthetic_participant.save!

  synthetic_consent = ParticipantConsent.find_or_initialize_by(id: "demo-consent-#{number}")
  synthetic_consent.assign_attributes(participant_id: synthetic_participant.id, organization_id: organization.id, consent_type: "employment_outcomes", version: "v1", status: "granted", recorded_at: now, recorded_by_membership_id: staff.id, revoked_at: nil)
  synthetic_consent.save!
end

[
  ["demo-job-1", "Customer Success Specialist", "Acme Support", "Remote · United States", "saved"],
  ["demo-job-2", "Workforce Program Coordinator", "Community Pathways", "Oklahoma City, OK", "applied"]
].each do |id, title, employer, location_text, status|
  job = ParticipantJobOpportunity.find_or_initialize_by(id: id)
  job.assign_attributes(participant_id: participant.id, organization_id: organization.id, employer_name: employer, job_title: title, location_text: location_text, employment_type: "Full-time", status: status, source: "synthetic-local-demo", saved_at: now, applied_at: status == "applied" ? now : nil)
  job.save!
end

session_token = "demo-participant-session"
session = PlatformSession.find_or_initialize_by(id: "demo-participant-session-record")
session.assign_attributes(subject_type: "participant", subject_id: participant.id, organization_id: organization.id, token_digest: Digest::SHA256.hexdigest(session_token), expires_at: 30.days.from_now, revoked_at: nil)
session.save!

document = ParticipantDocument.find_or_initialize_by(id: "demo-resume")
document.assign_attributes(participant_id: participant.id, organization_id: organization.id, document_type: "resume", file_name: "Alex_Johnson_Resume.pdf", mime_type: "application/pdf", byte_size: 2048, storage_path: "synthetic-local-demo/demo-resume.pdf")
document.save!

puts "Seeded disposable Next Step demo: #{participant.email} / token #{session_token}"
