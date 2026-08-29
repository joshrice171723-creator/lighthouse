require "digest"

class Api::Organization::ParticipantJobsController < ApplicationController
  before_action :require_json_request

  STATUSES = %w[saved applied interviewing offer rejected withdrawn archived].freeze

  def index
    participant = participant_from_session
    return unless participant

    jobs = ParticipantJobOpportunity.where(participant_id: participant.id, organization_id: participant.organization_id)
                                   .order(updated_at: :desc).limit(100)
    render json: { jobs: jobs.map { |job| job_json(job) } }
  end

  def update
    participant = participant_from_session
    return unless participant

    job_id = params[:jobId].presence || params.dig(:input, :jobId)
    job = ParticipantJobOpportunity.where(id: job_id, participant_id: participant.id, organization_id: participant.organization_id).first
    return render(json: { error: "Opportunity not found." }, status: :not_found) unless job

    status = params.dig(:input, :status).to_s
    return render(json: { error: "Unsupported opportunity status." }, status: :unprocessable_entity) unless STATUSES.include?(status)

    timestamp = Time.current
    job.update!(status: status, applied_at: status == "applied" ? timestamp : job.applied_at, interview_at: status == "interviewing" ? timestamp : job.interview_at, offer_at: status == "offer" ? timestamp : job.offer_at, updated_at: timestamp)
    render json: { job: job_json(job) }
  end

  private

  def participant_from_session
    raw = params[:sessionToken].to_s
    platform_session = PlatformSession.where(token_digest: Digest::SHA256.hexdigest(raw), subject_type: "participant", revoked_at: nil).where("expires_at > ?", Time.current).first
    return render(json: { error: "Platform session is invalid or expired." }, status: :unauthorized) && nil unless platform_session

    participant = ParticipantProfile.where(id: platform_session.subject_id, organization_id: platform_session.organization_id, status: "active").first
    return render(json: { error: "Participant not found." }, status: :not_found) && nil unless participant

    participant
  end

  def job_json(job)
    slug = job.job_title.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-+\z/, "")
    { id: job.id, title: job.job_title, company: job.employer_name, location: job.location_text, status: job.status, source: job.source, applicationUrl: "http://127.0.0.1:38742/apply/#{slug}", savedAt: job.saved_at, appliedAt: job.applied_at, interviewAt: job.interview_at, offerAt: job.offer_at, updatedAt: job.updated_at }
  end

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
