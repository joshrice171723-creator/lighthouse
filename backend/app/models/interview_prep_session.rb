class InterviewPrepSession < LighthouseRecord
  belongs_to :context, class_name: "InterviewPrepContext", foreign_key: :context_id, optional: true
end
