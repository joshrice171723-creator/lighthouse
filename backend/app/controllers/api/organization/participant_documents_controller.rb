require "digest"

class Api::Organization::ParticipantDocumentsController < ApplicationController
  before_action :require_json_request

  def index
    participant = participant_from_session
    return unless participant

    documents = ParticipantDocument.where(participant_id: participant.id, organization_id: participant.organization_id)
                                   .order(updated_at: :desc).limit(50)
    render json: { documents: documents.map { |document| document_json(document) } }
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

  def document_json(document)
    { id: document.id, fileName: document.file_name, mimeType: document.mime_type, documentType: document.document_type, byteSize: document.byte_size, createdAt: document.created_at, updatedAt: document.updated_at }
  end

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
