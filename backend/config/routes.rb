Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
  get "ready" => "readiness#show", as: :readiness_check

  namespace :api do
    namespace :organization do
      post "participant/interview-prep" => "interview_prep#index"
      post "participant/interview-prep/save" => "interview_prep#create"
      post "participant/jobs" => "participant_jobs#index"
      post "participant/jobs/update" => "participant_jobs#update"
      post "participant/jobs/review" => "participant_jobs#review"
      post "participant/documents" => "participant_documents#index"
      post "participant/documents/upload" => "participant_documents#create"
      post "participant/documents/access" => "participant_documents#access"
      post "participant/documents/download" => "participant_documents#download"
      post "participant/consent" => "participant_consents#index"
      post "participant/consent/revoke" => "participant_consents#revoke"
      post "interview-prep/metrics" => "interview_prep_metrics#create"
      post "workforce/records" => "workforce#create"
      post "workforce/consent/revoke" => "workforce#revoke_consent"
      post "workforce/report" => "workforce#report"
      post "employment-support/save" => "workforce#create"
      post "employment-report" => "workforce#report"
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
