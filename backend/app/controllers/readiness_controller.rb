class ReadinessController < ActionController::API
  def show
    ActiveRecord::Base.connection.verify!

    render json: { status: "ok", database: "ok" }, status: :ok
  rescue ActiveRecord::ConnectionNotEstablished, ActiveRecord::StatementInvalid
    render json: { status: "unavailable", database: "unavailable" }, status: :service_unavailable
  end
end
