# MRI implement `begin/end while condition` differently
# See issue: https://github.com/opal/opal/issues/575

# backport from 0.10, fixed in https://github.com/opal/opal/pull/1426
unless SourceMap::VLQ.encode([0]) == 'A'
  module SourceMap
    module VLQ
      def self.encode(ary)
        result = []
        ary.each do |n|
          vlq = n < 0 ? ((-n) << 1) + 1 : n << 1
          loop do
            digit  = vlq & VLQ_BASE_MASK
            vlq  >>= VLQ_BASE_SHIFT
            digit |= VLQ_CONTINUATION_BIT if vlq > 0
            result << BASE64_DIGITS[digit]
            break unless vlq > 0
          end
        end
        result.join
      end
    end
  end
end
