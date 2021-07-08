const rtf2md = require("./index");
const mdast2md = require("mdast-util-to-markdown");

const fs = require("fs");
const util = require("util");

const readFile = util.promisify(fs.readFile);

readFile(process.argv[2], "utf-8")
  .then(rtf2md)
  .then(mdast2md)
  .then(console.log);
