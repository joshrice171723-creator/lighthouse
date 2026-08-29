require "digest"

class Api::Organization::ParticipantApplicationAccountsController < ApplicationController
  before_action :require_json_request

  def create
    participant = participant_from_session
    return unless participant

    site_key = params[:siteKey].to_s.strip
    status = params[:status].to_s
    return render(json: { error: "Synthetic site identity is invalid." }, status: :unprocessable_entity) unless site_key.match?(/\A[a-z0-9._:\/-]{1,180}\z/)
    return render(json: { error: "Unsupported account status." }, status: :unprocessable_entity) unless ParticipantApplicationAccount::STATUSES.include?(status)

    account = ParticipantApplicationAccount.where(participant_id: participant.id, organization_id: participant.organization_id, site_key: site_key).first_or_initialize
    account.status = status
    account.save!
    render json: { account: { id: account.id, siteKey: account.site_key, status: account.status, createdAt: account.created_at } }, status: :created
  end

  private

  def participant_from_session
    raw = params[:sessionToken].to_s
    session = PlatformSession.where(token_digest: Digest::SHA256.hexdigest(raw), subject_type: "participant", revoked_at: nil).where("expires_at > ?", Time.current).first
    return render(json: { error: "Platform session is invalid or expired." }, status: :unauthorized) && nil unless session

    participant = ParticipantProfile.where(id: session.subject_id, organization_id: session.organization_id, status: "active").first
    return render(json: { error: "Participant not found." }, status: :not_found) && nil unless participant

    participant
  end

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
