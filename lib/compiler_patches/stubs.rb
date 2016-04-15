%x{
  // in Node, tools like Karma might use $inject for dependency injection
  if (typeof process !== 'undefined') {
    var original_add_stubs = Opal.add_stubs;
    Opal.add_stubs = function(stubs) {
      var injectIndex = stubs.indexOf("$inject");
      if (injectIndex != -1) {
        stubs.splice(injectIndex, 1);
      }
      original_add_stubs(stubs);
    };
  }
}
