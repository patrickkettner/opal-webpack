class File
  # Backports from opal 0.10, in O.9, dirname comes back as an array for this case
  # dirname fixed in 0.10 - https://github.com/opal/opal/pull/1429
  result = File.dirname('stuff')
  unless result.is_a?(String) && result == '.' && File.method_defined?(:basename) && File.method_defined?(:extname)
    @__fs__ = node_require :fs
    `var __fs__ = #{@__fs__}`

    # Fixed in 0.10 - https://github.com/opal/opal/commit/a0d07f82ffc745e208a509c28a415b914af8c435
    def initialize(path, flags)
      binary_flag_regexp = /b/
      encoding_flag_regexp = /:(.*)/
      # binary flag is unsupported
      warn "Binary flag (b) is unsupported by Node.js openSync method, removing flag." if flags.match(binary_flag_regexp)
      flags = flags.gsub(binary_flag_regexp, '')
      # encoding flag is unsupported
      warn "Encoding flag (:encoding) is unsupported by Node.js openSync method, removing flag." if flags.match(encoding_flag_regexp)
      flags = flags.gsub(encoding_flag_regexp, '')
      @path = path
      @flags = flags
      @fd = `__fs__.openSync(path, flags)`
    end

    class << self
      def expand_path(path, basedir = nil)
        path = [basedir, path].compact.join(SEPARATOR)
        parts = path.split(SEPARATOR)
        new_parts = []
        parts[0] = Dir.home if parts.first == '~'
        parts[0] = Dir.pwd if parts.first == '.'

        parts.each do |part|
          if part == '..'
            new_parts.pop
          else
            new_parts << part
          end
        end
        new_parts.join(SEPARATOR)
      end

      alias realpath expand_path

      %x{
        function chompdirsep(path) {
          var last;

          while (path.length > 0) {
            if (isDirSep(path)) {
              last = path;
              path = path.substring(1, path.length);
              while (path.length > 0 && isDirSep(path)) {
                path = inc(path);
              }
              if (path.length == 0) {
                return last;
              }
            }
            else {
              path = inc(path);
            }
          }
          return path;
        }

        function inc(a) {
          return a.substring(1, a.length);
        }

        function skipprefix(path) {
          return path;
        }

        function lastSeparator(path) {
          var tmp, last;

          while (path.length > 0) {
            if (isDirSep(path)) {
              tmp = path;
              path = inc(path);

              while (path.length > 0 && isDirSep(path)) {
                path = inc(path);
              }
              if (!path) {
                break;
              }
              last = tmp;
            }
            else {
              path = inc(path);
            }
          }

          return last;
        }

        function isDirSep(sep) {
          return sep.charAt(0) === #{SEPARATOR};
        }

        function skipRoot(path) {
          while (path.length > 0 && isDirSep(path)) {
            path = inc(path);
          }
          return path;
        }

        function pointerSubtract(a, b) {
          if (a.length == 0) {
            return b.length;
          }
          return b.indexOf(a);
        }

        function handleSuffix(n, f, p, suffix, name, origName) {
          var suffixMatch;

          if (n >= 0) {
            if (suffix === nil) {
              f = n;
            }
            else {
              suffixMatch = suffix === '.*' ? '\\.\\w+' : suffix.replace(/\?/g, '\\?');
              suffixMatch = new RegExp(suffixMatch + #{Separator} + '*$').exec(p);
              if (suffixMatch) {
                f = suffixMatch.index;
              }
              else {
                f = n;
              }
            }

            if (f === origName.length) {
              return name;
            }
          }

          return p.substring(0, f);
        }
      }

      def dirname(path)
        %x{
          if (path === nil) {
            #{raise TypeError, 'no implicit conversion of nil into String'}
          }
          if (#{path.respond_to?(:to_path)}) {
            path = #{path.to_path};
          }
          if (!path.$$is_string) {
            #{raise TypeError, "no implicit conversion of #{path.class} into String"}
          }

          var root, p;

          root = skipRoot(path);

          // if (root > name + 1) in the C code
          if (root.length == 0) {
            path = path.substring(path.length - 1, path.length);
          }
          else if (root.length - path.length < 0) {
            path = path.substring(path.indexOf(root)-1, path.length);
          }

          p = lastSeparator(root);
          if (!p) {
            p = root;
          }
          if (p === path) {
            return '.';
          }
          return path.substring(0, path.length - p.length);
        }
      end

      def basename(name, suffix=nil)
        %x{
          var p, q, e, f = 0, n = -1, tmp, pointerMath, origName;

          if (name === nil) {
            #{raise TypeError, 'no implicit conversion of nil into String'}
          }
          if (#{name.respond_to?(:to_path)}) {
            name = #{name.to_path};
          }
          if (!name.$$is_string) {
            #{raise TypeError, "no implicit conversion of #{name.class} into String"}
          }
          if (suffix !== nil && !suffix.$$is_string) {
            #{raise TypeError, "no implicit conversion of #{suffix.class} into String"}
          }

          if (name.length == 0) {
            return name;
          }

          origName = name;
          name = skipprefix(name);

          while (isDirSep(name)) {
            tmp = name;
            name = inc(name);
          }

          if (!name) {
            p = tmp;
            f = 1;
          }
          else {
            if (!(p = lastSeparator(name))) {
              p = name;
            }
            else {
              while (isDirSep(p)) {
                p = inc(p);
              }
            }

            n = pointerSubtract(chompdirsep(p), p);

            for (q = p; pointerSubtract(q, p) < n && q.charAt(0) === '.'; q = inc(q)) {
            }

            for (e = null; pointerSubtract(q, p) < n; q = inc(q)) {
              if (q.charAt(0) === '.') {
                e = q;
              }
            }

            if (e) {
              f = pointerSubtract(e, p);
            }
            else {
              f = n;
            }
          }

          return handleSuffix(n, f, p, suffix, name, origName);
        }
      end

      def extname(path)
        raise TypeError, 'no implicit conversion of nil into String' if path.nil?
        path = path.to_path if path.respond_to?(:to_path)
        raise TypeError, "no implicit conversion of #{path.class} into String" unless path.is_a?(String)
        filename = basename(path)
        return '' if filename.empty?
        last_dot_idx = filename[1..-1].rindex('.')
        # extension name must contains at least one character .(something)
        (last_dot_idx.nil? || last_dot_idx + 1 == filename.length - 1) ? '' : filename[(last_dot_idx + 1)..-1]
      end

      def exist? path
        path = path.path if path.respond_to? :path
        `__fs__.existsSync(#{path})`
      end
    end
  end

  # probably the only thing in here that's not yet a backport from 0.10
  unless File.const_defined?('FNM_SYSCASE')
    # case insenstive filesysem??
    FNM_SYSCASE = 0
  end
end

# Fixed in 0.10 already
unless File.const_defined?('Stat')
  class File::Stat
    @__fs__ = node_require :fs
    `var __fs__ = #{@__fs__}`

    def initialize(path)
      @path = path
    end

    def file?
      `__fs__.statSync(#{@path}).isFile()`
    end
  end

  class File
    def self.stat path
      path = path.path if path.respond_to? :path
      File::Stat.new(path)
    end
  end
end
