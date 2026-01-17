'use strict';

//	Required Modules
	const {app, BrowserWindow, Menu, MenuItem, shell, protocol, ipcMain, dialog, globalShortcut} = require('electron');
	const path = require('path');

//	Global Variables
	var window, menu;
	var paths = [];

function dbug(message='dbug') {
	let error = new Error();
	let [dummy, file, line, column] = [...error.stack.matchAll(/\n *at (.*?) \(.*:(.*?):(.*)\)/g)][1];
	let date = new Date();
	date = date.toString().slice(16,24);
	let info = `${date}: ${line}${message ? ` - ${message}` : ''}`;
	return info;
}
console.log(dbug())

//	Startup
	let theLock = app.requestSingleInstanceLock();				//	If second instance, this sends the first instance the 'second-instance' event
	if(theLock) {												//	First Instance?

console.log(dbug('theLock'))

		app.on('second-instance', (event, argv, cwd) => {		//	Subsqeuent signal from attempted second instance
console.log(dbug('second-instance'))

			let argPaths = argv.slice(1).filter(a => a.slice(0,2) != '--');
			window.webContents.send('CLOG', dbug(JSON.stringify(argPaths, null, '\t')));
			argPaths.forEach(path => {
				window?.webContents.send('DROP', path);
			});
		});
	}
	else {														//	No, so forget it
		app.quit();
	}

	console.log(dbug())


//	Settings
	const {DEVELOPMENT} = require('./settings.js');

//	Menu
	//	click: function (menuItem, focusedWindow) { focusedWindow.webContents.undo(); }

	function send(menuItem) {
		window.webContents.send('MENU', menuItem.id);
	}
console.log(dbug())

	menu = [
		{
			label: 'Document Pager',
			submenu: [
				{	label: `Show Documents`,  accelerator: 'CmdOrCtrl+D', id:'DOCUMENTS', click: send},
				{	role: `quit`, accelerator: 'CmdOrCtrl+Q' }
			]
		},
		{
			label: 'File',
			submenu: [
				//                {	label: `New Document`, accelerator: 'CmdOrCtrl+N', id:'NEW', click: send },
				{	label: `Open …`, accelerator: 'CmdOrCtrl+O', id:'OPEN', click: send },
				{	label: `Open URL …`, accelerator: 'CmdOrCtrl+Shift+O', id:'URL', click: send },
				{	label: `Reload`, accelerator: 'CmdOrCtrl+R', id:'LOAD', click: send },
				{	label: `Close`, accelerator: 'CmdOrCtrl+W', id:'CLOSE', click: send },
				{	label: `Save`, accelerator: 'CmdOrCtrl+S', id:'SAVE', click: send },
				{	label: `Save As …`, accelerator: 'CmdOrCtrl+Shift+S', id:'SAVEAS', click: send },

				{	type:'separator' },
				{	label: `Set as Favourite`, accelerator: 'CmdOrCtrl+Y', id:'FAVOURITE', click: send},
				{	label: `Unset as Favourite`, accelerator: 'CmdOrCtrl+Shift+Y', id:'UNFAVOURITE', click: send},
				{	type:'separator' },
				{	label: `Print Page`,  accelerator: 'CmdOrCtrl+P', id:'PRINTPAGE', click: send},
				{	label: `Print Document`,  accelerator: 'Shift+CmdOrCtrl+P', id:'PRINTDOCUMENT', click: send},
			]
		},
		{
			label: 'Edit',
			submenu: [
				{	role: `undo`, accelerator: 'CmdOrCtrl+Z' },
				{	type:'separator' },
				{	role: 'cut', accelerator: 'CmdOrCtrl+X' },
				{	role: 'copy', accelerator: 'CmdOrCtrl+C' },
				{	role: 'paste', accelerator: 'CmdOrCtrl+V' },
				{	role: 'selectAll', accelerator: 'CmdOrCtrl+A' },

				{	type:'separator' },
				{	label: 'Highlight', type: 'checkbox', checked: true, accelerator: 'CmdOrCtrl+T', id: 'HIGHLIGHT', click: (item)=>{
						window.webContents.send('MENU','HIGHLIGHT',item.checked);
					}
				},

				// {	type:'separator' },
				// {	label: 'Find …', accelerator: 'CmdOrCtrl+F', id: 'FIND', click: send },
				// {	label: 'Find Again', accelerator: 'CmdOrCtrl+G', id:'FINDAGAIN', click: send },

				{	type:'separator' },
				{	label: 'Zoom In', accelerator: 'CmdOrCtrl+plus', id: 'ZOOM', click: ()=>{window.webContents.send('MENU','ZOOM',1);} },
				{	label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', id: 'ZOOM', click: ()=>{window.webContents.send('MENU','ZOOM',-1);} },
				{	label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', id:'ZOOM', click: ()=>{window.webContents.send('MENU','ZOOM',0);} },
			]
		},
		{
			role: 'help',
			submenu: [
				{	label: 'About …', id: 'INFO', click: send },
				{	type:'separator' },
				{	label: 'Document Pager Home', icon: path.join(__dirname, 'images/external.png'), click: () => { shell.openExternal('https://github.com/manngo/document-pager'); } },
				{	label: 'Internotes Pager', icon: path.join(__dirname,'images/external.png'), click: () => { shell.openExternal('https://pager.internotes.net/'); } },
				{	id: 'debug-separator', type:'separator' },
			//	{	id: 'debug-developer-tools', label: 'Show Development Tools', click: function (menuItem, focusedWindow) { window.webContents.openDevTools({mode: 'detach'}); } },
				{	id: 'debug-developer-tools', label: 'Show Development Tools', click: function (menuItem, focusedWindow) { window.webContents.openDevTools(); } },
//				{	id: 'debug-developer-tools', label: JSON.stringify(process.argv, null, '\t'), click: function (menuItem, focusedWindow) { window.webContents.openDevTools({mode: 'detach'}); } },
			]
		}
	];

	var developmentMenu = [{
		label: 'Development',
		submenu: [
			{	label: 'Show Development Tools', click: function (menuItem, focusedWindow) { window.webContents.openDevTools(); } },
			{	label: 'Show Development Detached', click: function (menuItem, focusedWindow) { window.webContents.openDevTools({mode: 'detach'}); } },
		]
	}];

	if(process.argv.includes('debug')) menu=menu.concat(developmentMenu);

//	Init
	function init() {
		window = new BrowserWindow({
			width: 1200,
			height: 800,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				enableRemoteModule: true,
			}
		});
		window.setTitle('Document Pager hahaha');
		window.loadFile(`${__dirname}/index.html`);
		if(DEVELOPMENT) window.webContents.openDevTools({mode: 'detach'});

/*
		protocol.registerStringProtocol(
			'doit',
			(request, callback) => {
				let [dummy, action, data, more] = request.url.split(/:/);
				window.webContents.send('DOIT', action, data, more);
			},
			error => {}
		);
/*/
		protocol.handle('doit', request => {
			console.log(request)
//			try {
//				let [dummy, action, data, more] = request.url.split(/:/);
//				window.webContents.send('DOIT', action, data, more);
//			} catch(errror) {
//				console.error(request.url)
//			}
		});
//*/
		globalShortcut.register('CmdOrCtrl+Shift+R', () => {
			window.webContents.send('LOADCSS');
		});

		window.once('ready-to-show', () => {
			window.show();
		});

		menu = Menu.buildFromTemplate(menu);
		Menu.setApplicationMenu(menu);

		window.on('closed', () => {
			window = null;
		});
	}

//	Events

	app.on('ready', init);

	app.on('window-all-closed', () => {
		//	if (process.platform !== 'darwin')
		app.quit();
	});
	app.on('activate', function () {
		if (window === null) init();
	});

	app.on('open-file', onOpen);
	app.on('open-url', onOpen);

	function onOpen(event, path) {
		paths.push(path);
		if(!path) return;
		window?.webContents.send('DROP', path);
	}
/*
//  Prompt
	var prompt, promptResponse;
	var promptOptions = {
		message: 'Enter a URL:',
		match: /https?:\/\//,
		error: 'URL must begin with http:// or https://'
	};

	function doPrompt(parent, callback) {
		prompt = new BrowserWindow({
			width: 400,
			frame: false,
			parent,
			show: true,
			modal: true,
			alwaysOnTop: true,
			title: 'This space for rent …',
			webPreferences : {
				nodeIntegration: true,
				sandbox : false,
			}
		});
		prompt.on('closed', ()=>{
			prompt=null;
			callback(promptResponse);
		});
		prompt.loadURL(`file://${path.join(__dirname, 'content/prompt.html')}`);
		prompt.once('read-to-show', () => prompt.show());
	}

	ipcMain.on('prompt-ok', (event, data) => {log.info(data);});
	ipcMain.on('prompt-ok', (event, data) => {promptResponse=data;});
	ipcMain.on('prompt-cancel', (event, data) => {promptResponse=undefined;});
	ipcMain.on('prompt-size', (event, data) => {
		data=JSON.parse(data);

		prompt.setBounds({
//			width: data.width, height: data.height
			height: parseInt(data.height+1)
		});
	});

	ipcMain.on('prompt-init' , (event , data) => {
		event.returnValue = JSON.stringify(promptOptions, null, '\t');
	});

	ipcMain.on('prompt' , (event , options) => {
		promptOptions = options;
		doPrompt(window , data => {event.returnValue = data; });
	});

	// ipcMain.on('message-box',(event,data)=>{
	// 	dialog.showMessageBoxSync(window,data);
	// });
*/
//	From renderer

	ipcMain.handle('message-box', (event, data) => {
		dialog.showMessageBox(window,data);
	});

	ipcMain.on('open-file', (event, data) => {
		dialog.showOpenDialog(null, data).then(filePaths => {
	    	event.sender.send('open-file-paths', filePaths);
	    });
	});

	ipcMain.on('home', (event, options) => {
		let home = `${app.getPath('home')}/.document-pager`;
		event.returnValue = home;
	});

	ipcMain.on('init', (event, data) => {
		var home = `${app.getPath('home')}`;
		event.returnValue = JSON.stringify({home}, null, '\t');

		window.webContents.send('CLOG', dbug(process.argv));
		paths.push(...process.argv.slice(1));


		window.webContents.send('CLOG', dbug(paths));
		paths.forEach(path => {
			window?.webContents.send('DROPPED', path);
		});

//		window.webContents.send('CLOG', dbug(process.argv));

//		process.argv.forEach(av => {
//			window.webContents.send('CLOG', dbug(av));
//		});

	});
console.log(dbug())
