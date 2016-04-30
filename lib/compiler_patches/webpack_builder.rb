module Webpack
  class Builder < Opal::Builder
    attr_reader :requires

    def build_str(source, filename, options={})
      path = path_reader.expand(filename).to_s unless stub?(filename)
      asset = processor_for(source, filename, path, options)
      @require_trees = asset.required_trees.any?
      @requires = preload + asset.requires + tree_requires(asset, path)
      processed << asset
      # will not compile the requires yet, that's webpack's job
      # requires.map { |r| process_require(r, options) }
      self
    end

    def require_trees?
      @require_trees
    end
  end
end
