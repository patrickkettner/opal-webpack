class AssetsMock
  def paths
    require 'rails_dependency'
    Opal.paths
  end
end

class AppMock
  def assets
    AssetsMock.new
  end
end

class Rails
  def self.application
    AppMock.new
  end
end
