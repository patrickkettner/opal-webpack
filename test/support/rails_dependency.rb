require 'opal'

Opal.append_path 'foobar'
stubs = Opal::VERSION.include?('0.9') ? Opal::Processor.stubbed_files : Opal::Config.stubbed_files
stubs.add 'a_stub'
