# not yet implemented in 0.10 - https://github.com/opal/opal/pull/1408
unless Dir.method_defined?(:entries)
  class Dir
    @__fs__ = node_require :fs
    `var __fs__ = #{@__fs__}`
    @__glob__ = node_require :glob
    `var __glob__ = #{@__glob__}`

    class << self
      def entries(dirname)
        %x{
          var result = [];
          var entries = __fs__.readdirSync(#{dirname});
          for (var i = 0; i < entries.length; i++) {
            result.push(entries[i]);
          }
          return result;
        }
      end

      def [](*globs)
        globs.map {|glob| `__glob__.sync(#{glob})` }.flatten
      end
    end
  end
end

