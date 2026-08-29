class Organization < LighthouseRecord
  validates :name, :slug, presence: true
  validates :slug, uniqueness: true
end
