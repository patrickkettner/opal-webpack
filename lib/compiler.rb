require 'corelib/runtime'
# This needs to run right after runtime and no later
require 'compiler_patches/stubs'
# Now we can safely do this
require 'opal'
require "opal-source-maps"
require "opal-parser"
require "pathname"

require 'compiler_patches/source_maps'
require 'compiler_patches/pathname'
require 'compiler_patches/regexp'
require 'compiler_patches/compiler'
require 'compiler_patches/file'
