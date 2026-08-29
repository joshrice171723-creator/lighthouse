class InterviewPrepSession < LighthouseRecord
  belongs_to :context, class_name: "InterviewPrepContext", foreign_key: :context_id, optional: true
  has_many :results, class_name: "InterviewPrepResult", foreign_key: :session_id, dependent: :restrict_with_exception
end
