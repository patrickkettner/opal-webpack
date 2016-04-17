class AssetsMock
  def paths
    require 'opal-browser'
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
