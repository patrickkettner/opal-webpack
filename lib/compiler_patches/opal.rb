# specific to this webpack loader
module Opal
  def self.reset_paths!
    # we have no GEM dir, if we live this in, we get a blank dir which throws
    # off the load path
    @paths = [core_dir.untaint, std_dir.untaint]#, gem_dir.untaint]
    nil
  end

  reset_paths!
end
