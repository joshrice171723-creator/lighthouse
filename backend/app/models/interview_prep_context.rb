class InterviewPrepContext < LighthouseRecord
  belongs_to :participant, class_name: "ParticipantProfile", foreign_key: :participant_id, optional: true
  has_many :sessions, class_name: "InterviewPrepSession", foreign_key: :context_id, dependent: :restrict_with_exception
end
