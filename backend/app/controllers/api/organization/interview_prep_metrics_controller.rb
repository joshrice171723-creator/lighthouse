require "digest"

class Api::Organization::InterviewPrepMetricsController < ApplicationController
  def create
    staff_session = PlatformSession.where(token_digest: Digest::SHA256.hexdigest(params[:sessionToken].to_s), subject_type: "staff", revoked_at: nil).where("expires_at > ?", Time.current).first
    return render json: { error: "Platform session is invalid or expired." }, status: :unauthorized unless staff_session
    membership = OrganizationMembership.where(id: staff_session.subject_id, organization_id: staff_session.organization_id, status: "active").first
    return render json: { error: "This account cannot view preparation metrics." }, status: :forbidden unless membership && %w[owner admin manager].include?(membership.role)

    scope = InterviewPrepSession.joins("INNER JOIN participant_profiles ON participant_profiles.id = interview_prep_sessions.participant_id AND participant_profiles.organization_id = interview_prep_sessions.organization_id").where(organization_id: staff_session.organization_id)
    scope = scope.where(participant_profiles: { location_id: membership.location_id }) if membership.location_id.present?
    scope = scope.where("interview_prep_sessions.started_at >= ?", params[:from]) if params[:from].present?
    scope = scope.where("interview_prep_sessions.started_at < ?", params[:to]) if params[:to].present?
    sample_size = scope.distinct.count(:participant_id)
    suppressed = sample_size.positive? && sample_size < 5
    metrics = nil
    unless suppressed
      started = scope.count
      completed = scope.where(status: "completed").count
      scores = scope.where(status: "completed").pluck(:score).filter_map { |score| score["overall"].to_f if score.is_a?(Hash) && score["overall"].present? }
      metrics = { startedParticipants: sample_size, sessionsStarted: started, sessionsCompleted: completed, completionRate: started.zero? ? 0 : (completed * 100.0 / started).round, averageRubricScore: scores.empty? ? nil : (scores.sum / scores.length).round }
    end
    render json: { organizationId: staff_session.organization_id, period: { from: params[:from], to: params[:to] }, sampleSize: sample_size, suppressed: suppressed, metrics: metrics }
  end
end
