/*	dozip.js
	================================================
	Mark Simon
	================================================ */

	'use strict';

	const unzipper = require('unzipper');
	const fsp = require('fs').promises;
	const path = require("path")

	const mimeTypes = {
	//  Web Documents
		'.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json',
	//  Images
		'.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.gif': 'image/gif',
	//  Video
		'.ogm': 'video/ogm', '.ogv': 'video/ogv', '.ogg': 'video/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm',
	//  Misc
		'.txt': 'text/plain', '.pdf': 'application/pdf',
	};

	async function openZip(zipFile) {
		let directory = {};
		let zip = await unzipper.Open.file(zipFile);
		let root = zip.files[0].path.replace(/\/$/,'');

		for await (let f of zip.files) {
			let fpath = f.path;
			if(fpath.split('/').pop().charAt(0) == '.') continue;
			let buffer = await f.buffer();
			let blob = new Blob([buffer], { type: mimeTypes[path.extname(fpath)] });
			let blobURL = URL.createObjectURL(blob);
			directory[fpath] = {file: f, blobURL};
		};

		return { zip, directory, root };
	}

	//	Export
		module.exports = { openZip };
