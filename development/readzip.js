const zipFile = 'images2.zip';
const unzipper = require('/opt/homebrew/lib/node_modules/unzipper');
const fsp = require('fs').promises;
const http = require('http');
const port = 8080;
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

class ZipData {
	constructor(file) {
		this.zipFile = this.init(file);
	}
	
	async init(file) {
		this.directory = {};
		this.zip = await unzipper.Open.file(file);
		this.root = this.zip.files[0].path.replace(/\/$/,'');
		this.zip.files.forEach(f => {
			let path = f.path;
			if(path.split('/').pop().charAt(0) != '.') this.directory[path] = f;
		});
	}
	
	async get(path) {
		return this.directory[path].buffer();
	}
}

async function doit() {
	const path = require("path")
//	let { zip, directory, root } = await openZip(zipFile);
	let container = new ZipData(zipFile);
	
	let server = http.createServer( async (request, response) => {
		let data, url = request.url;
console.log(url)
		if(url == '/') {
			data = await container.get(`${container.root}/${container.root}.html`)
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/html');
			response.write(data);
			response.end();
		}
		else {
			try {
console.log(`${container.root}${url}`)
				data = await container.get(`${container.root}${url}`);
				response.statusCode = 200;
				response.setHeader('Content-Type', mimeTypes[path.extname(url)]);
				response.write(data, 'binary');
				response.end();
			}
			catch(error) {
				console.log(`oops: ${error}`)
			}
		}
	});
	server.listen(port, () => {
		console.log('listening')
	});
}

doit();
