# Opal compiler code uses these and creates lots of noise, want a way to turn this off on both 0.9 and 0.10
module Kernel
  def freeze
    self
  end

  def taint
    self
  end

  def untaint
    self
  end

  def tainted?
    self
  end

  def frozen?
    self
  end
end
