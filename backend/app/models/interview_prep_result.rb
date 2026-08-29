class InterviewPrepResult < LighthouseRecord
  belongs_to :session, class_name: "InterviewPrepSession", foreign_key: :session_id, optional: true
  belongs_to :context, class_name: "InterviewPrepContext", foreign_key: :context_id, optional: true
end
