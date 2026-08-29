require "test_helper"
require "digest"

class WorkforcePilotTest < ActionDispatch::IntegrationTest
  parallelize(workers: 1)

  def setup
    clean_test_database

    @organization = Organization.create!(id: "org-workforce", name: "Workforce Pilot", slug: "workforce-pilot", status: "active")
    @location_a = OrganizationLocation.create!(id: "location-a", organization_id: @organization.id, name: "Location A", is_primary: true, status: "active")
    @location_b = OrganizationLocation.create!(id: "location-b", organization_id: @organization.id, name: "Location B", is_primary: false, status: "active")
    @owner = OrganizationMembership.create!(id: "staff-owner", organization_id: @organization.id, email: "owner@pilot.test", display_name: "Pilot Owner", role: "owner", status: "active")
    @manager = OrganizationMembership.create!(id: "staff-manager", organization_id: @organization.id, email: "manager@pilot.test", display_name: "Pilot Manager", role: "manager", location_id: @location_a.id, status: "active")
    @employee = OrganizationMembership.create!(id: "staff-employee", organization_id: @organization.id, email: "employee@pilot.test", display_name: "Pilot Employee", role: "employee", location_id: @location_a.id, status: "active")

    @participants = 6.times.map do |index|
      ParticipantProfile.create!(id: "participant-#{index + 1}", organization_id: @organization.id, email: "participant#{index + 1}@pilot.test", display_name: "Participant #{index + 1}", location_id: index == 5 ? @location_b.id : @location_a.id, sponsor_membership_id: @owner.id, status: "active")
    end
    @foreign_organization = Organization.create!(id: "org-foreign", name: "Foreign Organization", slug: "foreign-organization", status: "active")
    @foreign_staff = OrganizationMembership.create!(id: "foreign-owner", organization_id: @foreign_organization.id, email: "owner@foreign.test", display_name: "Foreign Owner", role: "owner", status: "active")

    @owner_token = seed_session("owner-token", "staff", @owner.id, @organization.id)
    @manager_token = seed_session("manager-token", "staff", @manager.id, @organization.id)
    @employee_token = seed_session("employee-token", "staff", @employee.id, @organization.id)
    @foreign_token = seed_session("foreign-token", "staff", @foreign_staff.id, @foreign_organization.id)
  end

  test "Rails PostgreSQL workforce path records a complete journey and reports only consented participants" do
    @participants.first(5).each { |participant| record(@owner_token, participant, "consent", consentType: "employment_outcomes", status: "granted", version: "pilot-v1") }
    record(@owner_token, @participants[0], "profile", goal: "Secure a stable workforce role", targetJobTitle: "Support Specialist")
    record(@owner_token, @participants[0], "enrollment", enrollmentDate: "2026-08-01", eligibilityStatus: "eligible", status: "active")
    record(@owner_token, @participants[0], "service", serviceType: "Job-search coaching", serviceDate: "2026-08-05", durationMinutes: 45)
    record(@owner_token, @participants[0], "job_opportunity", employerName: "Synthetic Employer", jobTitle: "Support Specialist", savedAt: "2026-08-06T00:00:00Z", appliedAt: "2026-08-07T00:00:00Z", status: "applied")
    record(@owner_token, @participants[0], "job_activity", activityType: "application_review", activityDate: "2026-08-07")
    placement = record(@owner_token, @participants[0], "placement", employerName: "Synthetic Employer", jobTitle: "Support Specialist", startDate: "2026-08-15")
    record(@owner_token, @participants[0], "retention", jobPlacementId: placement.fetch("id"), checkinDate: "2026-09-14", daysSinceStart: 30, stillEmployed: true)
    record(@owner_token, @participants[1], "exit", enrollmentDate: "2026-08-01", exitDate: "2026-08-20", exitReason: "no_outcome", status: "exited")

    report = post_json("/api/organization/workforce/report", { sessionToken: @owner_token })

    assert_equal 6, report.dig("privacy", "participantCount")
    assert_equal 5, report.dig("privacy", "consentedParticipantCount")
    assert_equal false, report.dig("privacy", "suppressed")
    assert_equal 1, report.dig("metrics", "employmentGoalsRecorded")
    assert_equal 1, report.dig("metrics", "servicesDelivered")
    assert_equal 1, report.dig("metrics", "jobActivitiesRecorded")
    assert_equal 1, report.dig("metrics", "applicationsSubmitted")
    assert_equal 1, report.dig("metrics", "placementsStarted")
    assert_equal 1, report.dig("metrics", "retentionCheckins")
    assert_equal 1, report.dig("metrics", "noOutcomeExits")
    assert_equal 5, report.dig("report", "participantCount")
    assert_nil report["detail"]
    assert_not_includes response.body, @participants.first.display_name
    assert_not_includes response.body, @participants.first.id
    assert_equal "postgresql", ActiveRecord::Base.connection.adapter_name.downcase
  end

  test "revoked consent removes participant activity from the report and blocks new records" do
    @participants.first(5).each { |participant| record(@owner_token, participant, "consent", consentType: "employment_outcomes", status: "granted", version: "pilot-v1") }
    record(@owner_token, @participants[0], "profile", goal: "Secure work")
    record(@owner_token, @participants[0], "service", serviceType: "Job-search coaching", serviceDate: "2026-08-05")

    revoke = post_json("/api/organization/workforce/consent/revoke", { sessionToken: @owner_token, participantId: @participants[0].id })
    assert_equal 1, revoke.fetch("revokedCount")

    post_json("/api/organization/workforce/records", { sessionToken: @owner_token, recordType: "service", participantId: @participants[0].id, input: { kind: "service", participantId: @participants[0].id, serviceType: "Blocked service", serviceDate: "2026-08-06" } }, :forbidden)
    report = post_json("/api/organization/workforce/report", { sessionToken: @owner_token })

    assert_equal 6, report.dig("privacy", "participantCount")
    assert_equal 4, report.dig("privacy", "consentedParticipantCount")
    assert_equal 4, report.dig("report", "participantCount")
    assert_equal 0, report.dig("metrics", "employmentGoalsRecorded")
    assert_equal 0, report.dig("metrics", "servicesDelivered")
    assert_equal 1, report.dig("missingData", "consent")
  end

  test "Rails enforces tenant, location, and role boundaries" do
    @participants.first(5).each { |participant| record(@owner_token, participant, "consent", consentType: "employment_outcomes", status: "granted", version: "pilot-v1") }

    post_json("/api/organization/workforce/report", { sessionToken: @employee_token }, :forbidden)
    post_json("/api/organization/workforce/records", { sessionToken: @employee_token, recordType: "service", participantId: @participants[0].id, input: { kind: "service", participantId: @participants[0].id, serviceType: "Outside sponsor scope", serviceDate: "2026-08-06" } }, :not_found)
    post_json("/api/organization/workforce/records", { sessionToken: @foreign_token, recordType: "consent", participantId: @participants[0].id, input: { kind: "consent", participantId: @participants[0].id, consentType: "employment_outcomes", status: "granted", version: "pilot-v1" } }, :not_found)

    manager_report = post_json("/api/organization/workforce/report", { sessionToken: @manager_token })
    assert_equal 5, manager_report.dig("privacy", "participantCount")
    assert_equal 5, manager_report.dig("privacy", "consentedParticipantCount")
    assert_equal false, manager_report.dig("privacy", "suppressed")
  end

  private

  def clean_test_database
    connection = ActiveRecord::Base.connection
    connection.tables.reject { |table| %w[schema_migrations ar_internal_metadata].include?(table) }.each do |table|
      connection.execute("TRUNCATE TABLE #{connection.quote_table_name(table)} CASCADE")
    end
  end

  def seed_session(token, subject_type, subject_id, organization_id)
    PlatformSession.create!(id: "session-#{token}", subject_type: subject_type, subject_id: subject_id, organization_id: organization_id, token_digest: Digest::SHA256.hexdigest(token), expires_at: 2.hours.from_now)
    token
  end

  def record(token, participant, kind, input = {})
    post_json("/api/organization/workforce/records", { sessionToken: token, recordType: kind, participantId: participant.id, input: input.merge(kind: kind, participantId: participant.id) }, :created)
  end

  def post_json(path, payload, expected_status = :ok)
    post path, params: payload.to_json, headers: { "CONTENT_TYPE" => "application/json", "ACCEPT" => "application/json" }
    assert_response expected_status
    JSON.parse(response.body)
  end
end
