'use strict';

const log = require('electron-log');

//	Settings
	const {DEVELOPMENT}=require('./settings.js');

	if(DEVELOPMENT && process.platform == 'darwin') require('electron-reload')(__dirname);


//	Required Modules
	const {app, BrowserWindow, Menu, MenuItem, shell, ipcRenderer, protocol, ipcMain, dialog} = require('electron');

	//	https://github.com/electron/electron/issues/18214#issuecomment-495043193
		app.commandLine.appendSwitch('disable-site-isolation-trials');
	//	console.log(require.resolve('electron'))
	const path = require('path');

//	Startup

	// if(app.requestSingleInstanceLock()) {
	//     app.on('second-instance', (event, argv, cwd) => {
	//         console.log(JSON.stringify(argv));
	//         window.webContents.send('DOIT','message',JSON.stringify(argv));
	//     });
	// }
	// else {
	//     app.quit();
	// }

//	Global Variables
	var window, menu;

//	Menu
	//	click: function (menuItem, focusedWindow) { focusedWindow.webContents.undo(); }

	function send(menuItem) {
		window.webContents.send('MENU',menuItem.id);
	}

	menu=[
		{
			label: 'Document Pager',
			submenu: [
//                {	label: `New Document`, accelerator: 'CmdOrCtrl+N', id:'NEW', click: send },
				{	label: `Open …`, accelerator: 'CmdOrCtrl+O', id:'OPEN', click: send },
				{	label: `Reload`, accelerator: 'CmdOrCtrl+R', id:'LOAD', click: send },
				{	label: `Open URL …`, accelerator: 'CmdOrCtrl+Shift+O', id:'URL', click: send },
				{	label: `Close`, accelerator: 'CmdOrCtrl+W', id:'CLOSE', click: send },
				{	label: `Save`, accelerator: 'CmdOrCtrl+S', id:'SAVE', click: send },
//				{	label: `Save As …`, accelerator: 'CmdOrCtrl+Shift+S', id:'SAVEAS', click: send },

				{	type:'separator' },
				{	label: `Show Documents`,  accelerator: 'CmdOrCtrl+D', id:'DOCUMENTS', click: send},
				{	label: `Set as Favourite`, accelerator: 'CmdOrCtrl+Y', id:'FAVOURITE', click: send},
				{	label: `Unset as Favourite`, accelerator: 'CmdOrCtrl+Shift+Y', id:'UNFAVOURITE', click: send},

				{	type:'separator' },
				{	role: `quit`, accelerator: 'CmdOrCtrl+Q' }
			]
		},
		{
			label: 'Edit',
			submenu: [
				{	role: `undo`, accelerator: 'CmdOrCtrl+Z' },
				{	type:'separator' },
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
				{	label: 'About …', id: 'ABOUT', click: send },
				{	label: 'Instructions …', id: 'INSTRUCTIONS', click: send },
				{	type:'separator' },
				{	label: 'Document Pager Home', icon: path.join(__dirname, 'images/external.png'), click: () => { shell.openExternal('https://github.com/manngo/document-pager'); } },
				{	label: 'Internotes Pager', icon: path.join(__dirname,'images/external.png'), click: () => { shell.openExternal('https://pager.internotes.net/'); } },
				{	id: 'debug-separator', type:'separator' },
				{	id: 'debug-developer-tools', label: 'Show Development Tools', click: function (menuItem, focusedWindow) { window.webContents.openDevTools({mode: 'detach'}); } },
//				{	id: 'debug-developer-tools', label: JSON.stringify(process.argv), click: function (menuItem, focusedWindow) { window.webContents.openDevTools({mode: 'detach'}); } },
			]
		}
	];

	var developmentMenu=[{
		label: 'Development',
		submenu: [
			{	label: 'Show Development Tools', click: function (menuItem, focusedWindow) { window.webContents.openDevTools(); } },
			{	label: 'Show Development Detached', click: function (menuItem, focusedWindow) { window.webContents.openDevTools({mode: 'detach'}); } },
		]
	}];

//	if(DEVELOPMENT) menu=menu.concat(developmentMenu);
//if(DEVELOPMENT) window.webContents.openDevTools({mode: 'detach'});
//if(process.argv.includes('debug')) window.webContents.openDevTools({mode: 'detach'});
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
//	window.webContents.send('debug-data', process);


	protocol.registerStringProtocol('doit',(request,callback)=>{
//		console.log(request);
//		console.log(callback);
		var [dummy,action,data,more]=request.url.split(/:/);
		window.webContents.send('DOIT',action,data,more);
	},(error)=> {});

		window.once('ready-to-show', () => {
			window.show();
		});

		window.setTitle('Document Pager');
		menu=Menu.buildFromTemplate(menu);
/*	not working for main menuy
		menu.addListener('menu-will-show',event=>{
			console.log(event);
		});
*/
		Menu.setApplicationMenu(menu);

		window.loadURL(path.join('file://', __dirname, '/index.html'));
		if(DEVELOPMENT) window.webContents.openDevTools({mode: 'detach'});
		// if(DEVELOPMENT) window.webContents.openDevTools();

	//	window.webContents.setDevToolsWebContents(devtools.webContents);

		window.on('closed', function () {
			window = null;
		});
	}

//	Events

	app.on('ready', init);
	app.on('window-all-closed', function () {
		//	if (process.platform !== 'darwin')
		app.quit();
	});
	app.on('activate', function () {
		if (window === null) init();
	});

//    process.argv.forEach(onOpen);

	app.on('open-file', onOpen);
	app.on('open-url', onOpen);

	function onOpen(path) {
		if(!path) return;
		console.log(JSON.stringify(arguments));
		window.webContents.send('DOIT','open',path);
	}

//  Prompt
	var prompt, promptResponse;
	var promptOptions={
		message: 'Enter a URL:',
		match: /https?:\/\//,
		error: 'URL must begin with http:// or https://'
	};

	function doPrompt(parent,callback) {
		prompt=new BrowserWindow({
//            width: 1400, height: 200,
			width: 400,
			frame: false,
			parent,
			show: true,
			modal: true,
			alwaysOnTop: true,
//            title: options.title,
			title: 'This space for rent …',
			webPreferences : {
				nodeIntegration: true,
				sandbox : false,
			}
		});
		prompt.on('closed',()=>{
			prompt=null;
			callback(promptResponse);
		});
		prompt.loadURL(`file://${path.join(__dirname,'content/prompt.html')}`);
		prompt.once('read-to-show',()=>prompt.show());
	}

	ipcMain.on('prompt-ok',(event,data)=>{log.info(data);});
	ipcMain.on('prompt-ok',(event,data)=>{promptResponse=data;});
	ipcMain.on('prompt-cancel',(event,data)=>{promptResponse=undefined;});
	ipcMain.on('prompt-size',(event,data)=>{
		data=JSON.parse(data);

		prompt.setBounds({
//            width: data.width, height: data.height
			height: parseInt(data.height+1)
		});
	});

	ipcMain.on('prompt-init',(event,data)=>{
		event.returnValue=JSON.stringify(promptOptions);
	});

	ipcMain.on('prompt',(event,options)=>{
		promptOptions=options;
		doPrompt(window,data=>event.returnValue=data);
	});

	ipcMain.on('message-box',(event,data)=>{
		dialog.showMessageBox(data);
	});
	ipcMain.on('open-file',(event,data)=>{
		dialog.showOpenDialog(null, data).then(filePaths => {
	    	event.sender.send('open-file-paths', filePaths);
	    });
	});

	ipcMain.on('home',(event,options)=>{
		var home=`${app.getPath('home')}/.document-pager`;
		event.returnValue = home;
	});

	ipcMain.on('init',(event,data)=>{
		var home=`${app.getPath('home')}`;
		event.returnValue = JSON.stringify({home});
	});
