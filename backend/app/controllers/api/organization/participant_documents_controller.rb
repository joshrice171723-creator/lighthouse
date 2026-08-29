require "digest"
require "base64"
require "fileutils"
require "securerandom"

class Api::Organization::ParticipantDocumentsController < ApplicationController
  before_action :require_json_request

  def index
    participant = participant_from_session
    return unless participant

    documents = ParticipantDocument.where(participant_id: participant.id, organization_id: participant.organization_id)
                                   .order(updated_at: :desc).limit(50)
    render json: documents.map { |document| document_json(document) }
  end

  def create
    participant = participant_from_session
    return unless participant

    input = params[:input].presence || params
    file_name = input[:fileName].to_s.gsub(/[^a-zA-Z0-9._-]/, "_")[0, 160]
    mime_type = input[:mimeType].to_s
    document_type = input[:documentType].to_s
    encoded = input[:dataBase64].to_s
    allowed_types = { "application/pdf" => ".pdf", "application/msword" => ".doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx" }
    return render(json: { error: "Only PDF, DOC, and DOCX documents are supported." }, status: :unprocessable_entity) unless allowed_types.key?(mime_type) && %w[resume cover_letter].include?(document_type) && file_name.end_with?(allowed_types[mime_type])

    bytes = Base64.strict_decode64(encoded)
    return render(json: { error: "Document must be smaller than 5 MB." }, status: :unprocessable_entity) if bytes.bytesize > 5.megabytes

    id = "participant-document-#{SecureRandom.uuid}"
    storage_dir = Rails.root.join("storage", "participant-documents")
    FileUtils.mkdir_p(storage_dir)
    storage_path = storage_dir.join("#{id}-#{file_name}")
    File.binwrite(storage_path, bytes)
    document = ParticipantDocument.create!(id: id, participant_id: participant.id, organization_id: participant.organization_id, document_type: document_type, file_name: file_name, mime_type: mime_type, byte_size: bytes.bytesize, storage_path: storage_path.to_s)
    render json: { document: document_json(document) }, status: :created
  rescue ArgumentError
    render json: { error: "Document encoding is invalid." }, status: :unprocessable_entity
  end

  def access
    participant = participant_from_session
    return unless participant
    document = ParticipantDocument.where(id: params[:documentId], participant_id: participant.id, organization_id: participant.organization_id).first
    return render(json: { error: "Document not found." }, status: :not_found) unless document

    capability = document_verifier.generate({ "participantId" => participant.id, "documentId" => document.id }, expires_in: 10.minutes)
    render json: { capability: capability, expiresInSeconds: 600, document: document_json(document) }
  end

  def download
    participant = participant_from_session
    return unless participant
    payload = document_verifier.verified(params[:capability].to_s)
    return render(json: { error: "Document capability is invalid or expired." }, status: :unauthorized) unless payload
    return render(json: { error: "Document capability does not match this participant." }, status: :forbidden) unless payload["participantId"] == participant.id

    document = ParticipantDocument.where(id: payload["documentId"], participant_id: participant.id, organization_id: participant.organization_id).first
    return render(json: { error: "Document not found." }, status: :not_found) unless document
    return render(json: { error: "Document storage is unavailable." }, status: :not_found) unless File.file?(document.storage_path)

    send_file document.storage_path, filename: document.file_name, type: document.mime_type, disposition: "attachment"
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

  def document_verifier
    Rails.application.message_verifier("participant-document-capability")
  end

  def require_json_request
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
