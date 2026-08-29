require "digest"
require "securerandom"

class Api::Organization::InterviewPrepController < ApplicationController
  before_action :require_json_request

  FUNDAMENTALS = [
    { "key" => "story", "title" => "Tell a clear story", "prompt" => "Walk through a meaningful problem you solved. What was the situation, what did you do, and what changed?", "cue" => "Use Situation, Action, Result, then name what you learned." },
    { "key" => "tradeoff", "title" => "Explain a tradeoff", "prompt" => "Describe a decision where you balanced speed, quality, risk, or stakeholder needs.", "cue" => "State the constraints, options, decision, and consequence." },
    { "key" => "role_fit", "title" => "Connect your experience", "prompt" => "Why is this role the right next step for you, and what evidence supports that claim?", "cue" => "Connect one concrete achievement to the role's likely priorities." },
    { "key" => "questions", "title" => "Ask useful questions", "prompt" => "What would you want to learn from the interviewer before deciding whether this team is a fit?", "cue" => "Ask about priorities, success measures, constraints, and collaboration." }
  ].freeze

  QUIZ = [
    { "key" => "star", "question" => "Which structure makes a behavioral answer easiest to follow?", "options" => ["A. STAR: Situation, Task, Action, Result", "B. List every project chronologically", "C. Start with unrelated background", "D. Give only the final result", "E. Ask the interviewer to answer first"], "answer" => "A", "explanation" => "STAR gives the interviewer context, your contribution, and the outcome." },
    { "key" => "weakness", "question" => "What is the strongest way to discuss a weakness?", "options" => ["A. Deny having one", "B. Blame a former manager", "C. Name a real pattern and show how you manage it", "D. Give a weakness unrelated to work", "E. Change the subject"], "answer" => "C", "explanation" => "Specific self-awareness plus a concrete improvement habit is credible." },
    { "key" => "questions", "question" => "A good question for an interviewer should usually uncover…", "options" => ["A. Only the salary range", "B. The team's priorities and measures of success", "C. Private information about coworkers", "D. The easiest possible workload", "E. Nothing about the role"], "answer" => "B", "explanation" => "Priorities and success measures help both sides evaluate fit." },
    { "key" => "uncertainty", "question" => "How should you handle a question you cannot answer?", "options" => ["A. Invent a confident answer", "B. State what you know, name the gap, and explain how you would investigate", "C. Change the subject", "D. Criticize the question", "E. End the interview"], "answer" => "B", "explanation" => "Honest reasoning is more credible than unsupported certainty." },
    { "key" => "failure", "question" => "If you made a mistake, the strongest answer includes…", "options" => ["A. No ownership", "B. Blame for someone else", "C. What happened, what you changed, and what you learned", "D. Only the happy ending", "E. A claim that mistakes never happen"], "answer" => "C", "explanation" => "Ownership plus a changed practice demonstrates judgment and growth." }
  ].freeze

  CARDS = [
    ["ownership", "What is your strongest example of ownership?", "Frame the context, the decision you owned, the result, and what you would repeat or change."],
    ["stakeholder", "Tell me about a difficult stakeholder conversation.", "Show how you listened, made the disagreement concrete, and moved toward a decision."],
    ["first_30", "What would you do in your first 30 days?", "Start with users, goals, constraints, and existing signals before proposing changes."],
    ["result", "What makes a result stronger?", "Use a concrete metric or observable change; evidence makes impact easier to trust and remember."],
    ["uncertainty", "What is a useful way to communicate uncertainty?", "Separate knowns, unknowns, assumptions, and next checks without using false certainty."],
    ["review_before_fill", "What does review before fill protect?", "It preserves user control before a consequential application action."],
    ["career_gap", "How can you explain a career gap?", "State the responsibility plainly, its end point, and why you are ready now."],
    ["collaboration", "How should you discuss collaboration?", "Explain the shared goal, your role, and how decisions were made."],
    ["technical", "When describing a technical design, start with…", "Start with the user goal and system constraints so the design has a clear reason."],
    ["close", "What is the best close to an interview answer?", "Give one clear result and what you learned."]
  ].freeze

  def index
    participant = participant_from_session
    return unless participant
    contexts = InterviewPrepContext.where(participant_id: participant.id, organization_id: participant.organization_id, status: "active").order(updated_at: :desc)
    sessions = InterviewPrepSession.where(participant_id: participant.id, organization_id: participant.organization_id).includes(:context, :results).order(started_at: :desc).limit(50)
    results = InterviewPrepResult.where(participant_id: participant.id, organization_id: participant.organization_id).order(created_at: :desc).limit(100)
    render json: { catalog: catalog, contexts: contexts.map { |c| context_json(c) }, availableContexts: available_contexts(participant), sessions: sessions.map { |s| session_json(s) }, results: results.map { |r| result_json(r) }, progress: progress_json(sessions, results) }
  end

  def create
    participant = participant_from_session
    return unless participant
    input = payload
    context = owned_context(participant, input[:contextId])
    context ||= InterviewPrepContext.create!(id: "interview-context-#{SecureRandom.uuid}", participant_id: participant.id, organization_id: participant.organization_id, employment_plan_id: owned_reference_id("participant_employment_plans", input[:employmentPlanId], participant), job_opportunity_id: owned_reference_id("participant_job_opportunities", input[:jobOpportunityId], participant), title: input[:title].presence || "My interview preparation", visibility: "private", status: "active")
    session_type = %w[flashcards questions simulation drill fundamentals].include?(input[:sessionType].to_s) ? input[:sessionType].to_s : "simulation"
    results_input = Array(input[:results]).first(50)
    score = results_input.empty? ? safe_score(input[:score]) : score_for(session_type, results_input, input)
    session = InterviewPrepSession.create!(id: "interview-session-#{SecureRandom.uuid}", context_id: context.id, participant_id: participant.id, organization_id: participant.organization_id, session_type: session_type, status: input[:status].to_s == "completed" ? "completed" : "started", score: score, started_at: parse_time(input[:startedAt]) || Time.current, completed_at: input[:status].to_s == "completed" ? Time.current : nil)
    results_input.each do |result|
      normalized = normalize_result(result, session_type)
      InterviewPrepResult.create!(id: "interview-result-#{SecureRandom.uuid}", session_id: session.id, context_id: context.id, participant_id: participant.id, organization_id: participant.organization_id, result_type: normalized[:result_type], item_key: normalized[:item_key], score: normalized[:score], confidence: normalized[:confidence], improvement_area: normalized[:improvement_area], response_text: normalized[:response_text], created_at: Time.current)
    end
    render json: { id: session.id, contextId: context.id, status: session.status, score: session.score }, status: :created
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

  def payload = params[:input].presence || params
  def require_json_request = head(:unsupported_media_type) unless request.media_type == "application/json"
  def parse_time(value)
    Time.zone.parse(value.to_s) if value.present?
  rescue ArgumentError
    nil
  end
  def owned_context(participant, id) = InterviewPrepContext.where(id: id, participant_id: participant.id, organization_id: participant.organization_id, status: "active").first if id.present?

  def owned_reference_id(table, id, participant)
    return nil unless id.present? && ActiveRecord::Base.connection.data_source_exists?(table)
    sql = ActiveRecord::Base.sanitize_sql_array(["SELECT id FROM #{table} WHERE id = ? AND participant_id = ? AND organization_id = ? LIMIT 1", id, participant.id, participant.organization_id])
    ActiveRecord::Base.connection.select_value(sql)
  end

  def catalog
    { fundamentals: FUNDAMENTALS, quiz: QUIZ, cards: CARDS.map { |key, front, back| { "key" => key, "front" => front, "back" => back } }, simulation: FUNDAMENTALS.map { |item| { "key" => item["key"], "prompt" => item["prompt"], "cue" => item["cue"] } } }
  end

  def available_contexts(participant)
    plans = ParticipantEmploymentPlan.where(participant_id: participant.id, organization_id: participant.organization_id, status: "active").limit(10).map { |plan| { "id" => plan.id, "kind" => "employment_plan", "label" => plan.target_job_title.presence || plan.goal.to_s.truncate(80) } }
    jobs = ParticipantJobOpportunity.where(participant_id: participant.id, organization_id: participant.organization_id).where.not(status: "closed").order(updated_at: :desc).limit(20).map { |job| { "id" => job.id, "kind" => "job_opportunity", "label" => [job.job_title, job.employer_name].compact.join(" · ") } }
    plans + jobs
  end

  def score_for(type, entries, input)
    values = entries.map { |entry| normalize_result(entry, type)[:score] }
    return safe_score(input[:score]) if values.empty?
    { "overall" => (values.sum.to_f / values.length).round, "completedItems" => values.length, "type" => type }
  end

  def normalize_result(result, type)
    key = result[:itemKey].presence || "item"
    response = result[:responseText].to_s.slice(0, 4000)
    score = result[:score].to_i.clamp(0, 100)
    if type == "simulation" && response.present?
      score = rubric(response)["overall"]
    elsif type == "questions"
      item = QUIZ.find { |entry| entry["key"] == key }
      score = result[:answer].to_s == item&.fetch("answer", nil) ? 100 : 0 if item
    end
    { result_type: result[:resultType].presence || type, item_key: key, score: score, confidence: result[:confidence].present? ? result[:confidence].to_i.clamp(1, 5) : nil, improvement_area: result[:improvementArea].presence || improvement_for(score), response_text: response.presence }
  end

  def rubric(text)
    words = text.split(/\s+/).reject(&:empty?).length
    structure = %w[situation task action result].count { |term| text.match?(/\b#{Regexp.escape(term)}\b/i) }
    relevance = text.match?(/\b(role|customer|user|team|impact|goal)\b/i) ? 80 : 55
    clarity = words.between?(35, 180) ? 85 : words.positive? ? 65 : 0
    reflection = text.match?(/\b(learn|change|improve|next time)\b/i) ? 90 : 55
    { "overall" => (([structure * 25, 100].min + relevance + clarity + reflection) / 4.0).round, "structure" => [structure * 25, 100].min, "relevance" => relevance, "clarity" => clarity, "reflection" => reflection, "wordCount" => words, "communication" => communication_feedback(text) }
  end

  def communication_feedback(text)
    fillers = text.downcase.scan(/\b(?:um|uh|like|basically|actually|you know)\b/).length
    words = text.split(/\s+/).reject(&:empty?).length
    { "wordCount" => words, "fillerCount" => fillers, "signal" => fillers.positive? ? "Try a short pause instead of filler phrases." : words > 180 ? "Tighten the answer around one result." : "Add one concrete result or metric." }
  end

  def improvement_for(score) = score < 70 ? "Add a concrete example and result." : "Keep practicing concise delivery."
  def safe_score(value) = value.is_a?(ActionController::Parameters) || value.is_a?(Hash) ? value.to_h.slice("overall", "clarity", "relevance", "structure", "reflection").transform_values { |v| v.to_i.clamp(0, 100) } : {}
  def context_json(c) = { id: c.id, title: c.title, visibility: c.visibility, employmentPlanId: c.employment_plan_id, jobOpportunityId: c.job_opportunity_id, createdAt: c.created_at, updatedAt: c.updated_at }
  def session_json(s) = { id: s.id, contextId: s.context_id, title: s.context&.title, sessionType: s.session_type, status: s.status, score: s.score, startedAt: s.started_at, completedAt: s.completed_at }
  def result_json(r) = { id: r.id, sessionId: r.session_id, resultType: r.result_type, itemKey: r.item_key, score: r.score, confidence: r.confidence, improvementArea: r.improvement_area, responseText: r.response_text, createdAt: r.created_at }

  def progress_json(sessions, results)
    completed = sessions.select { |s| s.status == "completed" }
    scores = completed.filter_map { |s| s.score["overall"].to_i if s.score.is_a?(Hash) && s.score["overall"].present? }
    days = sessions.map { |s| s.started_at.to_date }.uniq.sort.reverse
    streak = days.each_cons(2).take_while { |a, b| (a - b).to_i == 1 }.length + (days.any? ? 1 : 0)
    { "sessionsCompleted" => completed.length, "cardsRated" => results.count { |r| r.result_type == "flashcards" }, "averageScore" => scores.empty? ? nil : (scores.sum.to_f / scores.length).round, "streak" => streak }
  end
end
