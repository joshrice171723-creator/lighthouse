require "digest"
require "securerandom"

class Api::Organization::InterviewPrepController < ApplicationController
  before_action :require_json_request

  def index
    participant = participant_from_session
    return unless participant

    contexts = InterviewPrepContext.where(participant_id: participant.id, organization_id: participant.organization_id, status: "active").order(updated_at: :desc)
    sessions = InterviewPrepSession.joins("INNER JOIN interview_prep_contexts ON interview_prep_contexts.id = interview_prep_sessions.context_id").where(participant_id: participant.id, organization_id: participant.organization_id, interview_prep_contexts: { participant_id: participant.id, organization_id: participant.organization_id }).order(started_at: :desc)
    render json: { contexts: contexts.map { |c| context_json(c) }, sessions: sessions.map { |s| session_json(s) } }
  end

  def create
    participant = participant_from_session
    return unless participant
    input = payload
    context = InterviewPrepContext.where(id: input[:contextId], participant_id: participant.id, organization_id: participant.organization_id, status: "active").first if input[:contextId].present?
    context ||= InterviewPrepContext.create!(id: "interview-context-#{SecureRandom.uuid}", participant_id: participant.id, organization_id: participant.organization_id, employment_plan_id: input[:employmentPlanId].presence, job_opportunity_id: input[:jobOpportunityId].presence, title: input[:title].presence || "My interview preparation", visibility: "private", status: "active")
    session = InterviewPrepSession.create!(id: "interview-session-#{SecureRandom.uuid}", context_id: context.id, participant_id: participant.id, organization_id: participant.organization_id, session_type: %w[flashcards questions simulation drill].include?(input[:sessionType]) ? input[:sessionType] : "simulation", status: input[:status] == "completed" ? "completed" : "started", score: safe_score(input[:score]), started_at: parse_time(input[:startedAt]) || Time.current, completed_at: input[:status] == "completed" ? Time.current : nil)
    Array(input[:results]).first(50).each do |result|
      InterviewPrepResult.create!(id: "interview-result-#{SecureRandom.uuid}", session_id: session.id, context_id: context.id, participant_id: participant.id, organization_id: participant.organization_id, result_type: result[:resultType].presence || session.session_type, item_key: result[:itemKey].presence || "item", score: result[:score].to_i.clamp(0, 100), confidence: result[:confidence].present? ? result[:confidence].to_i.clamp(1, 5) : nil, improvement_area: result[:improvementArea].presence, response_text: result[:responseText].presence, created_at: Time.current)
    end
    render json: { id: session.id, contextId: context.id, status: session.status, score: session.score }, status: :created
  end

  private

  def participant_from_session
    raw = params[:sessionToken].to_s
    platform_session = PlatformSession.where(token_digest: Digest::SHA256.hexdigest(raw), subject_type: "participant", revoked_at: nil).where("expires_at > ?", Time.current).first
    unless platform_session
      render json: { error: "Platform session is invalid or expired." }, status: :unauthorized
      return nil
    end
    participant = ParticipantProfile.where(id: platform_session.subject_id, organization_id: platform_session.organization_id, status: "active").first
    unless participant
      render json: { error: "Participant not found." }, status: :not_found
      return nil
    end
    participant
  end

  def safe_score(value)
    value.is_a?(ActionController::Parameters) || value.is_a?(Hash) ? value.to_h.slice("overall", "clarity", "relevance", "structure", "score").transform_values { |v| v.to_i.clamp(0, 100) } : {}
  end

  def payload
    params[:input].presence || params
  end

  def parse_time(value)
    Time.zone.parse(value.to_s) if value.present?
  rescue ArgumentError
    nil
  end

  def context_json(context)
    { id: context.id, title: context.title, visibility: context.visibility, employmentPlanId: context.employment_plan_id, jobOpportunityId: context.job_opportunity_id, createdAt: context.created_at, updatedAt: context.updated_at }
  end

  def session_json(session)
    { id: session.id, contextId: session.context_id, title: session.context&.title, sessionType: session.session_type, status: session.status, score: session.score, startedAt: session.started_at, completedAt: session.completed_at }
  end

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
