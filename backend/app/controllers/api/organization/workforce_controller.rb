require "digest"

class Api::Organization::WorkforceController < ApplicationController
  RECORDS = {
    "consent" => ParticipantConsent,
    "profile" => ParticipantEmploymentPlan,
    "enrollment" => ParticipantProgramEnrollment,
    "service" => ParticipantServiceRecord,
    "job_opportunity" => ParticipantJobOpportunity,
    "job_activity" => ParticipantJobActivity,
    "placement" => ParticipantJobPlacement,
    "retention" => ParticipantRetentionCheckin,
    "product_activity" => ParticipantProductActivity
  }.freeze

  ALLOWED_ATTRIBUTES = {
    "consent" => %w[consent_type status version recorded_at revoked_at],
    "profile" => %w[funding_program_id goal target_job_title target_start_date status],
    "enrollment" => %w[funding_program_id enrollment_date exit_date exit_reason eligibility_status status],
    "exit" => %w[funding_program_id enrollment_date exit_date exit_reason eligibility_status status],
    "service" => %w[funding_program_id service_type service_date duration_minutes completion_status evidence_document_id outcome_summary],
    "job_opportunity" => %w[funding_program_id employer_name job_title location_text employment_type hourly_wage hours_per_week status source saved_at applied_at interview_at offer_at closed_at closed_reason],
    "job_activity" => %w[funding_program_id job_opportunity_id activity_type activity_date status staff_membership_id participant_reported evidence_document_id notes],
    "placement" => %w[funding_program_id job_opportunity_id employer_name job_title start_date hourly_wage hours_per_week employment_type verification_method verified_at verified_by_membership_id status end_date end_reason],
    "retention" => %w[job_placement_id checkin_date days_since_start still_employed hours_per_week wage_changed support_provided participant_reported next_checkin_date],
    "product_activity" => %w[funding_program_id activity_type status activity_date related_document_id related_job_opportunity_id staff_verified]
  }.freeze

  def create
    staff_session, membership = authenticate_staff
    return unless staff_session && membership

    input = params[:input].respond_to?(:to_unsafe_h) ? params[:input].to_unsafe_h : {}
    record_type = (params[:recordType].presence || input["kind"]).to_s
    record_type = "enrollment" if record_type == "exit"
    record_class = RECORDS[record_type]
    return render json: { error: "Unsupported workforce record type." }, status: :unprocessable_entity unless record_class

    participant_id = params[:participantId].presence || input["participantId"]
    participant = ParticipantProfile.where(id: participant_id, organization_id: staff_session.organization_id, status: "active").first
    return render json: { error: "Participant is not in this organization." }, status: :not_found unless participant
    unless record_type == "consent" || ParticipantConsent.where(participant_id: participant.id, organization_id: staff_session.organization_id, status: "granted", revoked_at: nil).exists?
      return render json: { error: "An active participant consent is required." }, status: :forbidden
    end

    source = params[:input].present? ? params[:input] : params
    normalized_source = ActionController::Parameters.new(source.to_unsafe_h.transform_keys { |key| key.to_s.underscore })
    attributes = normalized_source.permit(*ALLOWED_ATTRIBUTES.fetch(record_type)).to_h
    attributes["consent_type"] ||= input["consentType"] if record_type == "consent"
    attributes["recorded_at"] ||= Time.current if record_type == "consent"
    record = record_class.new(attributes.merge(participant_id: participant.id, organization_id: staff_session.organization_id))
    record.staff_membership_id = membership.id if record.respond_to?(:staff_membership_id=) && record.staff_membership_id.blank?
    if record.save
      render json: { id: record.id, recordType: record_type, participantId: participant.id, organizationId: staff_session.organization_id }, status: :created
    else
      render json: { error: "Workforce record could not be saved.", details: record.errors.to_hash }, status: :unprocessable_entity
    end
  end

  def report
    staff_session, membership = authenticate_staff
    return unless staff_session && membership
    unless %w[owner admin manager].include?(membership.role)
      return render json: { error: "This account cannot view workforce reports." }, status: :forbidden
    end

    participant_scope = ParticipantProfile.where(organization_id: staff_session.organization_id, status: "active")
    participant_scope = participant_scope.where(location_id: membership.location_id) if membership.location_id.present?
    participant_ids = participant_scope.select(:id)
    participant_count = participant_scope.count
    suppressed = participant_count.positive? && participant_count < 5
    base = ->(model) { model.where(organization_id: staff_session.organization_id, participant_id: participant_ids) }
    report = {
      organizationId: staff_session.organization_id,
      locationId: membership.location_id,
      participantCount: participant_count,
      enrollments: base.call(ParticipantProgramEnrollment).count,
      services: base.call(ParticipantServiceRecord).count,
      jobOpportunities: base.call(ParticipantJobOpportunity).count,
      jobActivities: base.call(ParticipantJobActivity).count,
      placements: base.call(ParticipantJobPlacement).count,
      retentionCheckins: base.call(ParticipantRetentionCheckin).count,
      productActivities: base.call(ParticipantProductActivity).count
    }
    metrics = if suppressed
      nil
    else
      opportunities = base.call(ParticipantJobOpportunity)
      placements = base.call(ParticipantJobPlacement)
      retentions = base.call(ParticipantRetentionCheckin)
      plans = base.call(ParticipantEmploymentPlan)
      enrollments = base.call(ParticipantProgramEnrollment)
      consents = base.call(ParticipantConsent).where(status: "granted", revoked_at: nil)
      {
        enrolledParticipants: enrollments.distinct.count(:participant_id),
        employmentGoalsRecorded: plans.distinct.count(:participant_id),
        servicesDelivered: base.call(ParticipantServiceRecord).count,
        jobActivitiesRecorded: base.call(ParticipantJobActivity).count,
        applicationsSubmitted: opportunities.where.not(applied_at: nil).count,
        interviewsRecorded: opportunities.where.not(interview_at: nil).count,
        offersRecorded: opportunities.where.not(offer_at: nil).count,
        placementsStarted: placements.count,
        retentionCheckins: retentions.count,
        retainedAt30Days: retentions.where(days_since_start: 30, still_employed: true).count,
        retainedAt60Days: retentions.where(days_since_start: 60, still_employed: true).count,
        retainedAt90Days: retentions.where(days_since_start: 90, still_employed: true).count,
        noOutcomeExits: enrollments.where.not(exit_date: nil).where.not(participant_id: placements.select(:participant_id)).distinct.count(:participant_id)
      }
    end
    missing_data = if suppressed
      nil
    else
      {
        consent: participant_count - consents.distinct.count(:participant_id),
        employmentGoal: participant_count - plans.distinct.count(:participant_id),
        enrollment: participant_count - enrollments.distinct.count(:participant_id),
        outcomeOrExit: participant_count - (placements.distinct.pluck(:participant_id) + enrollments.where.not(exit_date: nil).distinct.pluck(:participant_id)).uniq.length
      }
    end
    render json: { empty: participant_count.zero?, privacy: { participantCount: participant_count, suppressed: suppressed }, metrics: metrics, missingData: missing_data, report: suppressed ? nil : report, detail: nil }
  end

  def revoke_consent
    staff_session, membership = authenticate_staff
    return unless staff_session && membership
    unless %w[owner admin manager].include?(membership.role)
      return render json: { error: "This account cannot revoke workforce consent." }, status: :forbidden
    end

    participant_scope = ParticipantProfile.where(id: params[:participantId], organization_id: staff_session.organization_id, status: "active")
    participant_scope = participant_scope.where(location_id: membership.location_id) if membership.location_id.present?
    participant = participant_scope.first
    return render json: { error: "Participant is not in this organization." }, status: :not_found unless participant

    consents = ParticipantConsent.where(participant_id: participant.id, organization_id: staff_session.organization_id, status: "granted", revoked_at: nil)
    revoked = consents.update_all(status: "revoked", revoked_at: Time.current, updated_at: Time.current)
    render json: { participantId: participant.id, organizationId: staff_session.organization_id, revokedCount: revoked }
  end

  private

  def authenticate_staff
    token = params[:sessionToken].to_s
    session = PlatformSession.where(token_digest: Digest::SHA256.hexdigest(token), subject_type: "staff", revoked_at: nil).where("expires_at > ?", Time.current).first
    unless session
      render json: { error: "Platform session is invalid or expired." }, status: :unauthorized
      return [nil, nil]
    end
    membership = OrganizationMembership.where(id: session.subject_id, organization_id: session.organization_id, status: "active").first
    unless membership
      render json: { error: "This staff membership is not active in the organization." }, status: :forbidden
      return [session, nil]
    end
    [session, membership]
  end
end
