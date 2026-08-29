Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :organization do
      post "participant/interview-prep" => "interview_prep#index"
      post "participant/interview-prep/save" => "interview_prep#create"
      post "interview-prep/metrics" => "interview_prep_metrics#create"
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
