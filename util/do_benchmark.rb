require 'fileutils'
require 'benchmark'

dir = File.join File.dirname(__FILE__), 'input'
FileUtils.mkdir_p dir
TOTAL_FILES = 200
TOTAL_FILES.times do |index|
  filename = File.join(dir, "file_#{index}.rb")
  File.write filename, "puts 'this is file '+#{index}.to_s"
end

puts "Starting benchmark for webpack to compile #{TOTAL_FILES} files"
RUNS = 3

Benchmark.bm(7) do |x|
  RUNS.times do |time|
    x.report("Run #{time}") { system '../node_modules/.bin/webpack 1>/dev/null 2>/dev/null' }
  end
end
