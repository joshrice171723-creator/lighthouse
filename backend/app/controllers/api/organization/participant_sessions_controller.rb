require "digest"
require "securerandom"

class Api::Organization::ParticipantSessionsController < ApplicationController
  before_action :require_json_request

  def create
    email = params[:email].to_s.strip.downcase
    participant = ParticipantProfile.where(email: email, status: "active").first
    return render(json: { error: "Email or password is incorrect." }, status: :unauthorized) unless participant&.authenticate(params[:password].to_s)

    organization = Organization.where(id: participant.organization_id, status: "active").first
    return render(json: { error: "Organization not found." }, status: :not_found) unless organization

    raw_token = SecureRandom.urlsafe_base64(32)
    PlatformSession.create!(
      subject_type: "participant",
      subject_id: participant.id,
      organization_id: participant.organization_id,
      token_digest: Digest::SHA256.hexdigest(raw_token),
      expires_at: 12.hours.from_now
    )

    render json: {
      token: raw_token,
      participant: { id: participant.id, organizationId: participant.organization_id, email: participant.email, displayName: participant.display_name, status: participant.status },
      organization: { id: organization.id, name: organization.name, slug: organization.slug, status: organization.status }
    }
  end

  private

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
