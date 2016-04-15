'use strict'

const sourceMap = require('source-map')
const SourceNode = sourceMap.SourceNode
const SourceMapConsumer = sourceMap.SourceMapConsumer
const SourceMapGenerator = sourceMap.SourceMapGenerator

module.exports = function(compiler, source, resourcePath, rawResult, generatedSource) {
  let rawMap = JSON.parse(compiler.$source_map().$as_json().$to_json())

  // Since it's compiled from the current resource
  rawMap.sources = [resourcePath]

  // Set source content
  let consumer = new SourceMapConsumer(rawMap)
  let map = SourceMapGenerator.fromSourceMap(consumer)
  map.setSourceContent(resourcePath, source)

  // Prepend the chunk of our injected script
  let node = SourceNode.fromStringWithSourceMap(rawResult, new SourceMapConsumer(map.toString()))
  node.prepend(generatedSource)
  return JSON.parse(node.toStringWithSourceMap().map.toString())
}
