require "digest"

class Api::Organization::ParticipantConsentsController < ApplicationController
  before_action :require_json_request

  def index
    participant = participant_from_session
    return unless participant

    consent = ParticipantConsent.where(participant_id: participant.id, organization_id: participant.organization_id, consent_type: "employment_outcomes").order(updated_at: :desc).first
    render json: consent_json(consent)
  end

  def revoke
    participant = participant_from_session
    return unless participant

    consent = ParticipantConsent.where(participant_id: participant.id, organization_id: participant.organization_id, consent_type: "employment_outcomes", status: "granted", revoked_at: nil).order(updated_at: :desc).first
    return render(json: { error: "Employment-outcomes consent is already revoked or unavailable." }, status: :unprocessable_entity) unless consent

    consent.update!(status: "revoked", revoked_at: Time.current)
    render json: consent_json(consent)
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

  def consent_json(consent)
    return { consentType: "employment_outcomes", status: "not_recorded", version: nil, recordedAt: nil, revokedAt: nil } unless consent

    { id: consent.id, consentType: consent.consent_type, status: consent.status, version: consent.version, recordedAt: consent.recorded_at, revokedAt: consent.revoked_at }
  end

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
