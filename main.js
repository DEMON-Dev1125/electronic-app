const bytenode = require('bytenode');
const fs = require('fs');
const v8 = require('v8');

v8.setFlagsFromString('--no-lazy');

if (!fs.existsSync('./app.jsc')) {
	bytenode.compileFile('./app.js', './app.jsc');
}

require('./app.js')