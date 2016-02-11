(function() {
  var ElmCompiler, elmCompile, childProcess, path;

  childProcess = require('child_process');

  path = require('path');

  module.exports = ElmCompiler = (function() {
    ElmCompiler.prototype.brunchPlugin = true;

    ElmCompiler.prototype.type = 'javascript';

    ElmCompiler.prototype.extension = 'elm';

    function ElmCompiler(config) {
      var elm_config = {};

      var elmBrunchConfig = (config.plugins.elmBrunch || {});
      elm_config.outputFile = elmBrunchConfig.outputFile || path.join(config.paths.public, 'compiled-elm.js');
      elm_config.elmFolder = elmBrunchConfig.elmFolder || null;

      this.elm_config = elm_config;
      this.seenAfterInit = {};
      this.mainFiles = [];
    }

    function escapeRegExp(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function isMainFile(inFile) {
      var fs = require('fs');
      contents = fs.readFileSync(inFile, 'utf8');

      lines = contents.split("\n");

      foundMainLine = false;
      lines.forEach(function(line) {
        if (line.startsWith("main =")) {
          foundMainLine = true;
        }
      })

      return foundMainLine;
    }

    ElmCompiler.prototype.compile = function(data, inFile, callback) {
      var elmFolder = this.elm_config.elmFolder;
      var outputFile = this.elm_config.outputFile;
      var mainFiles = this.mainFiles;
      var buildFile = this.seenAfterInit[inFile] || false;

      // Autodetect main files and save them in a list
      relativePath = inFile.replace(new RegExp('^' + escapeRegExp(elmFolder) + '[/\\\\]?'), '');
      if (isMainFile(inFile) && mainFiles.indexOf(relativePath) == -1) {
        mainFiles.push(relativePath);
        buildFile = true;
      }

      // Automatially remove main files from the list if they are removed from disk
      // if(!fs.accessSync(inFile, fs.F_OK)) { }
      // TODO

      // Don't build it once per regular file on boot
      this.seenAfterInit[inFile] = true;

      // Build all main files to a single javascript file
      if(buildFile) {
        var sourcePaths = mainFiles.join(" ")
        elmCompile(sourcePaths, elmFolder, outputFile, callback);
      } else {
        callback(null, "");
      }
    };

    return ElmCompiler;
  })();

  elmCompile = function(srcFile, elmFolder, outputFile, callback) {
    var info = 'Elm compile: ' + srcFile;

    if (elmFolder) {
      info += ', in ' + elmFolder;
    }

    info += ', to ' + outputFile;

    console.log(info);

    var command = 'elm make --yes --output ' + outputFile + ' ' + srcFile;

    try {
      childProcess.execSync(command, { cwd: elmFolder })
      callback(null, "");
    } catch (error) {
      callback(error, "");
    }
  };

}).call(this);
