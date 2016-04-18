module Webpack
  class Builder < Opal::Builder
    attr_reader :requires

    def build_str(source, filename, options={})
      path = path_reader.expand(filename).to_s unless stub?(filename)
      puts "expanded path from #{filename} to #{path}"
      asset = processor_for(source, filename, path, options)
      if path.nil? or path.empty?
        dirname = Dir.pwd
      else
        dirname = File.dirname(File.expand_path(path))
      end
      paths = path_reader.paths.map{|p| File.expand_path(p)}
      puts "trees are #{asset.required_trees}, paths are #{paths}, type of #{paths.class}"
      expanded = File.expand_path 'tree', dirname
      puts "expanded is #{expanded}"
      base = paths.find { |p| expanded.start_with?(p) }
      if base.nil?
        puts 'base path is nil'
      else
        puts "base is #{base}"
        globs = extensions.map { |ext| File.join base, 'tree', '**', "*.#{ext}" }
        puts "globs are #{globs}"
        Dir[*globs].each do |file|
          puts "glob file #{file}"
        end
      end
      # TODO: asset.requires are not full paths
      @requires = preload + asset.requires + tree_requires(asset, path)
      processed << asset
      # will not compile the requires yet, that's webpack's job
      # requires.map { |r| process_require(r, options) }
      self
    rescue MissingRequire => error
      raise error, "A file required by #{filename.inspect} wasn't found.\n#{error.message}", error.backtrace
    end
  end
end
