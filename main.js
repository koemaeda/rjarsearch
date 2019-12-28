#!/usr/bin/env/node
const program = require("commander");
const path = require('path');
const runzip = require("runzip");
const minimatch = require("minimatch");
const getStream = require('get-stream');

function searchJar(jarFile, searchExpr) {
  const isDirectory = fileName => /\/$/.test(fileName);
  const isJar = fileName => /\.jar$/.test(fileName);
  const isSelectedType = fileName => program.fileTypes.findIndex(pattern => minimatch(path.basename(fileName), pattern)) !== -1;

  runzip.open(
    jarFile,
    {
      filter: entry => isJar(entry.fileName)
    },
    (err, zipfile) => {
      if (err) throw err;
      zipfile.on("entry", entry => {
        if (isDirectory(entry.fileName))
          return;

        entry.openReadStream((err, readStream) => {
          if (err) throw err;

          if (isSelectedType(entry.fileName)) {
            // entry.nestedPath is an array of the recursively nested zip filenames
            const entryPath = [entry.nestedPath.join("/"), entry.fileName].join('/');
            (async () => {
              const fileContents = await getStream(readStream);
              if (
                (searchExpr instanceof RegExp && searchExpr.test(fileContents))
                || (typeof searchExpr === 'string' && fileContents.indexOf(searchExpr) !== -1)
              ) {
                console.log(">>>>>", entryPath);
                console.debug(fileContents);
              }
            })();
          }
        });
      });
    }
  );
}

function stringList(val) {
  return val.split(",").map(String);
}

program
  .name("rjarsearch")
  .description("Command-line tool to recursively search for text inside JAR files")
  .arguments("<jar-file> <search-string>")
  .option(
    "-t, --file-types [items]",
    "File types in which content is searched",
    stringList,
    ["*.xml"]
  )
  .option("-e, --regex", "Use the search string as a Regular Expression")
  .action(function (file, searchString) {
    let searchExpr = program.regex ? new RegExp(searchString) : searchString;
    searchJar(file, searchExpr, program.recursive);
  })
  .parse(process.argv);
