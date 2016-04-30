var benchmarkFiles = require.context('./input', true, /\.rb$/)
benchmarkFiles.keys().forEach(benchmarkFiles)
