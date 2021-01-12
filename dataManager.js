const fs = require('fs');
const path = require('path');

function getDataFiles(dirPath, ext) {
	files = fs.readdirSync(dirPath);
	filelist = [];
	files.forEach(function(file) {
		if (!fs.statSync(path.join(dirPath, file)).isDirectory()) {
			if (get_extension(file) == ext) {
				filelist.push(path.join(dirPath, file));
			}
		}
	});
	return filelist;
}
function get_extension(filename) {
	return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}
function readDataFiles(file) {
	let fichier = fs.readFileSync(file)
	let data = JSON.parse(fichier)
	return data;
}
function writeDataFiles(data, file) {
	fs.writeFileSync(file, JSON.stringify(data));
}
function isDirectory(path) {
    if (!fs.existsSync(path)) {
        return false;
    }
    if (!fs.lstatSync(path).isDirectory()) {
        return false;
    }
}
function getPics(dirPath) {
	var extention = ['png','PNG','jpg','JPG','jpeg']
	files = fs.readdirSync(dirPath);
	filelist = [];
	files.forEach(function(file) {
        extention.forEach(ext=>{
            if (!fs.statSync(path.join(dirPath, file)).isDirectory()) {
                if (get_extension(file) == ext) {
                    filelist.push(path.join(dirPath, file));
                }
            }
        })
	});
	return filelist;
}

module.exports = {readDataFiles, writeDataFiles, getDataFiles, isDirectory, getPics};