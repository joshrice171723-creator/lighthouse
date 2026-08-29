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

demo_participants = ParticipantProfile.where(organization_id: organization.id, status: "active").order(:id).to_a
demo_participants.each_with_index do |demo_participant, index|
  plan = ParticipantEmploymentPlan.find_or_initialize_by(id: "demo-employment-plan-#{index + 1}")
  plan.assign_attributes(participant_id: demo_participant.id, organization_id: organization.id, goal: "Secure a stable workforce role", target_job_title: index.even? ? "Customer Success Specialist" : "Workforce Program Coordinator", target_industry: "Workforce services", action_steps: ["Complete application practice", "Review interview preparation"], review_date: Date.new(2026, 9, 15), status: "active", created_by_membership_id: staff.id)
  plan.save!

  service = ParticipantServiceRecord.find_or_initialize_by(id: "demo-service-#{index + 1}")
  service.assign_attributes(participant_id: demo_participant.id, organization_id: organization.id, service_type: "Job-search coaching", service_date: Time.zone.local(2026, 8, 15), duration_minutes: 45, completion_status: "completed", provider_membership_id: staff.id, outcome_summary: "Synthetic coaching session completed")
  service.save!

  activity = ParticipantJobActivity.find_or_initialize_by(id: "demo-job-activity-#{index + 1}")
  activity.assign_attributes(participant_id: demo_participant.id, organization_id: organization.id, job_opportunity_id: demo_participant.id == participant.id ? "demo-job-1" : nil, activity_type: "application_review", activity_date: Time.zone.local(2026, 8, 16), status: "completed", staff_membership_id: staff.id, participant_reported: false, notes: "Synthetic application activity")
  activity.save!
end

demo_participants.first(3).each_with_index do |demo_participant, index|
  placement = ParticipantJobPlacement.find_or_initialize_by(id: "demo-placement-#{index + 1}")
  placement.assign_attributes(participant_id: demo_participant.id, organization_id: organization.id, employer_name: "Synthetic Workforce Employer #{index + 1}", job_title: "Workforce Support Specialist", start_date: Date.new(2026, 7, 1), hourly_wage: 18.50, hours_per_week: 32, employment_type: "Full-time", verification_method: "synthetic_staff_record", verified_at: now, verified_by_membership_id: staff.id, status: "active")
  placement.save!

  retention = ParticipantRetentionCheckin.find_or_initialize_by(id: "demo-retention-#{index + 1}")
  retention.assign_attributes(participant_id: demo_participant.id, organization_id: organization.id, job_placement_id: placement.id, checkin_date: Date.new(2026, 7, 31), days_since_start: 30, still_employed: true, hours_per_week: 32, wage_changed: false, support_provided: "Synthetic retention check-in", participant_reported: false, next_checkin_date: Date.new(2026, 9, 29))
  retention.save!
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
