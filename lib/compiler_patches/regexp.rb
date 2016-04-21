regexp_escaped_trailing_ok = begin
  Regexp.new('\\A[A-Z]:\\\\')
  true
  rescue RegexpError => _
    false
end

# https://github.com/opal/opal/pull/1422 - already in 0.10
# prevents RSpec compilation
unless regexp_escaped_trailing_ok
  class Regexp
    class << self
      def new(regexp, options = undefined)
        %x{
          if (regexp.$$is_regexp) {
            return new RegExp(regexp);
          }

          regexp = #{Opal.coerce_to!(regexp, String, :to_str)};

          if (regexp.charAt(regexp.length - 1) === '\\' && regexp.charAt(regexp.length - 2) !== '\\') {
            #{raise RegexpError, "too short escape sequence: /#{regexp}/"}
          }

          if (options === undefined || #{!options}) {
            return new RegExp(regexp);
          }

          if (options.$$is_number) {
            var temp = '';
            if (#{IGNORECASE} & options) { temp += 'i'; }
            if (#{MULTILINE}  & options) { temp += 'm'; }
            options = temp;
          }
          else {
            options = 'i';
          }

          return new RegExp(regexp, options);
        }
      end
    end
  end
end
