/*	Document Pager
	================================================
	================================================ */
	'use strict';
//	window.onerror=function(message,url,line) {
//		alert('Error: '+message+'\n'+url+': '+line);
//	};
	document.ondragover = document.ondrop = (event) => {
console.log('dragover | drop');
		event.preventDefault();
	};

	document.body.ondrop = (event) => {
//console.log(JSON.stringify(event.dataTransfer.files[0].path));
//		openFile(event.dataTransfer.files[0].path.toString());
		event.preventDefault();
	};

//	Development
	const {DEVELOPMENT,cwd}=require('../settings.js');

//	Generic

	const iterableProperties={
		enumerable: false,
		value: function * () {
			for(let key in this) if(this.hasOwnProperty(key)) yield this[key];
		}
	};

//	Requires
	const path = require('path');
	const fs = require('fs');
	const fsp = require('fs').promises;
	const { ipcRenderer, shell} = require('electron');
	const { dialog } = require('electron').remote;
//	const dialog = require('electron').remote.dialog;

	const electron=require('electron');

	const remote=electron.remote;
	const app=remote.app;
	const BrowserWindow = remote.BrowserWindow;

	const normalize = require('normalize-path');
//	const dialog = remote.require('dialog');

	const marked = require('marked');

	const window=remote.getCurrentWindow();
	window.webContents.on('new-window', function(event, url) {
	  event.preventDefault();
	  shell.openExternal(url);
	});
	const temp=require('temp').track();

	const {jx,DOM}=require('../scripts/utilities.js');

//	Support Functions

	function load(theDocument) {
		return new Promise((resolve,reject)=>{
			if(!theDocument) return;
			fsp
			.readFile(theDocument)
			.then(data => {
				data=data.toString();

				resolve(data);
			})
			.catch(error=>{
				console.log(error);
			});
		});
	}

//	Environment

	var platform=process.platform;
	var os=require('os');

/*	Pager
	================================================
	================================================ */

//	Globals
	var settings;
	var documentTitle;

	var home=`${app.getPath('home')}/.document-pager`;
	var breaksJSON=`${home}/breaks.json`;
	var filesJSON=`${home}/files.json`, files={};

//	Main
	main();

	function main() {
//		elements.codeElement=elements.codeElement.contentWindow.document.querySelector('pre>code')

		var breaks;

		var promise=
			//	Default Settings
				load(path.join(cwd, '/settings.json'))
				.then(data=>settings=JSON.parse(data))

			//	Home Directory
				.then(()=>fs.promises.stat(home))
				.then(()=>console.log(`${home} exists`))
				.catch(()=>{fs.promises.mkdir(home);})

			//	Breaks
				.then(()=>fs.promises.stat(breaksJSON))
				.catch(()=>fs.promises.writeFile(breaksJSON,'{}'))
				.then(()=>fs.promises.readFile(breaksJSON))
				.then(data=>{
					breaks=JSON.parse(data);
					for(let v in breaks) settings.breaks[v]=breaks[v];
				})

			//	Details
				.then(()=>documentTitle=settings.headings.title+' '+settings.version)

			//	About
				.then(()=>load(path.join(cwd, '/README.md')))
				.then(data=>addDocument(data,'md','about.md',path.join(cwd, '/data/about.md')))

			//	Files
				.then(()=>fs.promises.stat(filesJSON))
				.catch(()=>fs.promises.writeFile(filesJSON,'[]'))
				.then(()=>fs.promises.readFile(filesJSON))
				.then(data=>{
					files=JSON.parse(data);
//					files.forEach(v=>load(v.path).then((data)=>addDocument(data,v.language,v.title,v.path)));
					files.forEach(v=>openFile(v));
				})
			;

		if(DEVELOPMENT)
			promise
			.then(()=>load(path.join(cwd,'data/exercises.sql')))
			.then((data)=>addDocument(data,'sql','exercises.sql',path.join(cwd,'data/exercises.sql')))
			;//.then(()=>console.log(JSON.stringify(settings)))
	}



//	Constants
//	var documentTitle=settings.headings.title+' '+settings.version;
	//	Document Tabs
		var currentTab;
		var currentItem;
		var tabs=[];

	//	Elements
		var elements={
			//	Header
				h1: document.querySelector('h1'),
				formControl: document.querySelector('form#control'),
			//	Main
				tabPane: document.querySelector('ul#tabs'),
				pager: document.querySelector('div#pager'),
			//	Index
				indexDiv: document.querySelector('div#index'),
				indexHeading: document.querySelector('div#index>h2'),
				indexUL: document.querySelector('div#index>ul'),
				resizeIndex: document.querySelector('div#index>span#resize-index'),
			//	Content
				contentDiv: document.querySelector('div#content'),
				contentHeading: document.querySelector('div#content>h2'),
				divContentPre: document.querySelector('div#content>pre'),
//				codeElement: document.querySelector('div#content>pre>code'),
				codeElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('pre>code'),
				highlightButton: document.querySelector('button#highlight'),
				smallerButton: document.querySelector('button#smaller'),
				defaultButton: document.querySelector('button#default'),
				largerButton: document.querySelector('button#larger'),
				previousButton: document.querySelector('button#previous'),
				nextButton: document.querySelector('button#next'),
			//	Footer
				footerMessage: document.querySelector('span#footer-message'),
				footerLanguage: document.querySelector('span#footer-language'),
				footerHeading: document.querySelector('span#footer-heading'),
		};

//jx.draggable(document.querySelector('footer'))
	jx.stretch(elements.indexDiv,elements.resizeIndex);

	var lineNumbers=addLineNumbers(elements.codeElement);
	elements.codeElement.setLineNumbers();

	elements.formControl.elements['show-highlight'].onclick=function(event) {
		currentItem.click();
	};

	function addLineNumbers(element) {
		var lineNumbers=document.createElement('div');
//		var styles=BrowserWindow.webContents.getComputedStyle(element);
		lineNumbers.classList.add('line-numbers');
		element.insertAdjacentElement('beforebegin',lineNumbers);
		element.setLineNumbers=function() {
			var lines=element.textContent.split(/\r?\n/).length;
			lineNumbers.textContent=Array.from({length: lines},(v,i)=>i+1).join('\n');
		};
		return lineNumbers;
	}

//	Add Document
	function addDocument(text,language,fileName,path) {
		var tab=document.createElement('li');
			tab.textContent=fileName;
			tab.data={text: text, language: language, fileName: fileName, path: path, item: 0, highlighted: 1 };
			tab.onclick=doTab;
		var close=document.createElement('button');
			// var img=document.createElement('img');
			// img.src=
			close.innerHTML=`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0" y="0" width="8" height="8" viewBox="0, 0, 24, 24"><path d="M3.141,24 L-0,24 L10.332,11.935 L-0,0 L3.401,0 L12,9.06 L20.924,0 L24,0 L13.581,11.935 L24,24 L20.664,24 L12,14.33 z" fill="#000000"/></svg>`;	//	'⨉';	//	✖️
			close.onclick=closeTab.bind(tab);
			close.id='tab-close';
		var refresh=document.createElement('button');
			refresh.innerHTML='↻';
			refresh.onclick=refreshTab.bind(tab);
			refresh.id='tab-refresh';
		//	Add to DOM
			tab.appendChild(close);
//			tab.insertAdjacentElement('afterbegin',refresh);
			elements.tabPane.appendChild(tab);

		//	Activate
			tab.click();

		//	Track
			tabs.push(tab);
			currentTab=tab;

		function doTab(event) {
			if(currentTab!==undefined) currentTab.classList.remove('selected');
			currentTab=this;
			doPager(this.data);
			currentTab.classList.add('selected');
		}
		function closeTab(event) {
			var path=`${this.data.path}/${this.data.fileName}`;
			files=files.filter(value=>value!=path);
			fs.promises.writeFile(filesJSON,JSON.stringify(files));

			var sibling=this.previousElementSibling||this.nextElementSibling||undefined;
			elements.tabPane.removeChild(this);
			currentTab=undefined;
			if(sibling) sibling.click();
			else {
				elements.indexUL.innerHTML='';
				elements.codeElement.innerHTML='';
				document.title=documentTitle;
				elements.h1.innerHTML=settings.headings.h1+' '+settings.version;
				elements.contentHeading.innerHTML=settings.headings.content;
				elements.indexHeading.innerHTML=settings.headings.index;

				elements.contentDiv.classList.add('empty');
			}
			event.stopPropagation();
		}
	}
	function refreshTab(event) {
		load(currentTab.data.path).then(text=>currentTab.data.text=text).then(()=>currentTab.click());
	}


	function doPager(data) {
		var br, major, minor;
	//	Adjust Environment
		elements.indexHeading.innerHTML=data.fileName;

	//	Variables
		var selected=null;
		var headingsRE, headingMajor, headingMinor, RE;
		var title;

	//	Heading Regular Expressions(Hard Code for Now):
		var breaks=settings.breaks[data.language]||settings.breaks['*'];
		var literals=/[-\/\\^$*+.()|[\]{}]/g;

		//	Major Breaks
			if(Array.isArray(breaks.major)) {
				major=[];
				breaks.major.forEach((value,i)=>major[i]=value.replace(literals,'\\$&'));
				major=major.join('|');
			}
			else major=breaks.major.replace(literals,'\\$&');
		//	Minor Breaks
			if(breaks.minor) {
				if(Array.isArray(breaks.minor)) {
					minor=[];
					breaks.minor.forEach((value,i)=>minor[i]=value.replace(literals,'\\$&'));
					minor=minor.join('|');
				}
				else minor=breaks.minor.replace(literals,'\\$&');
			}
			else minor=null;

		br=`${major}\\s+|${minor}\\s+`;
		elements.footerHeading.innerHTML=`Breaks: ${br}`;


		headingsRE=new RegExp(`(?:\\n\\s*)(?=${br})`);
		headingMajor=new RegExp(`(?:^${major}\\s+)(.*?)\\r?\\n`);
		headingMinor=new RegExp(`(?:^${minor}\\s+)(.*?)\\r?\\n`);

	//	Populate Index
		var items=data.text.split(headingsRE);
		elements.indexUL.innerHTML='';
		var nested=false, ul, previous=null;
		if(items.length>1) {
			var previous=undefined, selected=undefined;
			items.forEach(function(value,i) {
				var li=document.createElement('li');

				RE=value.match(headingMajor);
				if(RE && RE[1]) {
					nested=false;
					title=RE[1];
				}
				else {
					RE=value.match(headingMinor);
					if(RE && RE[1]) {
						//	Nesting
							if(!nested) {
								nested=true;
								elements.indexUL.appendChild(li);
								ul=document.createElement('ul');
								previous.appendChild(ul);
							}

						title=RE[1];
					}
					else title='';
				}

				li.innerHTML=`<span>${title}</span>`;
				li.next=li.previous=undefined;
				if(previous) {
					previous.next=li;
					li.previous=previous;
				}
				previous=li;
				li.onclick=loadItem.bind(li,data,value,title,i);
				if(nested) ul.appendChild(li);
				else elements.indexUL.appendChild(li);
				if(i==data.item) selected=li;
				previous=li;
			});
			selected.click();
		}
		else showItem(data.text,data.fileName,true);

	//	Not Empty
		elements.contentDiv.classList.remove('empty');

	//	Load Content
		function loadItem(data,item,title,i,event) {
			elements.previousButton.onclick=elements.nextButton.onclick=null;
			var p=this.previous;
			if(p) {
				elements.previousButton.onclick=function(event) { p.click(); };
			}
			var n=this.next;
			if(n) {
				elements.nextButton.onclick=function(event) { n.click(); };
			}

			var doHighlight=elements.formControl.elements['show-highlight'].checked?!event.altKey:event.altKey;
			currentItem=data.li=this;
			elements.highlightButton.doHighlight=doHighlight;
			setHighlightButton();
			if(selected) selected.classList.remove('selected');
			selected=this;
			selected.classList.add('selected');
			data.item=i;
			showItem(item,title,doHighlight);
			event.stopPropagation();
		}
		function showItem(item,title,doHighlight) {
			elements.footerLanguage.innerHTML=`Language: ${data.language}`;
			elements.codeElement.classList.remove('markdown');
			var language=['js','javascript','sql','php'].indexOf(data.language)>-1;
			elements.codeElement.innerHTML=item;

			lineNumbers.style.display='block';

			if(language && doHighlight) elements.codeElement.innerHTML=Prism.highlight(item, Prism.languages[data.language], data.language);
			else if(data.language=='md' && doHighlight) {
				elements.codeElement.innerHTML=marked(item,{baseUrl: `${data.path}/${data.fileName}`});
				elements.codeElement.classList.add('markdown');
				lineNumbers.style.display='none';
			}
			document.title=documentTitle+': '+data.fileName+' — '+title;
//			elements.h1.innerHTML=documentTitle+': '+data.fileName+' — '+title;
			elements.contentHeading.innerHTML=title;
			elements.codeElement.setLineNumbers();

		}
		function setHighlightButton() {
			elements.highlightButton.classList.toggle('highlight',!elements.highlightButton.doHighlight);
			elements.highlightButton.innerHTML=!elements.highlightButton.doHighlight?'Highlight':'Raw';
		}
	}

	function openFile(pathName) {
		var path=normalize(pathName).split('/');
		var fileName=path.pop();
		path=path.join('/');
		var language=fileName.split('.').pop();
		load(`${path}/${fileName}`)
		.then(data=> {
			addDocument(data,language,fileName,path);
		})
		;
	}

	function footerMessage(message) {
		elements.footerMessage.textContent=message;
	}

//	IPC

	ipcRenderer.on('DOIT',(event,action,data,more)=>{
		switch(action) {
			case 'open':
				openFile(data);
				break;
			case 'message':
				footerMessage(data);
				break;
			case 'find':
				// searchData={
				// 	string: data,
				// 	fromIndex: 1,
				// 	caseSensitive: false
				// };
				// doFind();
				break;
			case 'locate':
				// dialog.showOpenDialog({
				// 	title: data,
				// 	defaultPath: tabs[tab].path
				// },function(filePaths){
				// 	if(!filePaths) return;
				// 	var location=filePaths.toString();
				// 	location=location.replace(' ','\\ ');
				// 	if(more=='replace') tabs[tab].content.setRangeText(location);
				// });
				break;
			case 'special':
				// switch(data) {
				// 	case 'sendmail':
				// 		dialog.showOpenDialog({
				// 			title: data,
				// 			defaultPath: tabs[tab].path
				// 		},function(filePaths){
				// 			var location=filePaths.toString();
				// 			searchData={
				// 				string: 'sendmail_path',
				// 				fromIndex: 1,
				// 				caseSensitive: false
				// 			};
				// 			doFind();
				// 		});
				// 		break;
				// }
				// break;
		}
	});

	ipcRenderer.on('MENU',(event,data)=>{
		switch(data) {
			case 'NEW':

				break;
			case 'OPEN':
				dialog.showOpenDialog(
					{
						title: 'Title',
						defaultPath: localStorage.getItem('defaultPath')||'/nfs/html/internotes.net/pager/content'
					},
					function(path) {
						var pathName=normalize(path[0]);
						path=pathName.split('/');
						var fileName=path.pop();
						var path=path.join('/');
						localStorage.setItem('defaultPath',path);
						var language=fileName.split('.').pop();
						load(pathName)
						.then(function(data) {
							addDocument(data,language,fileName,pathName);
						})
						.then(()=>{
							if(!files.includes(pathName)) {
								files.push(pathName);
								fs.promises.writeFile(filesJSON,JSON.stringify(files));
							}
						})
						;
					}
				);	//	.then(data=>console.log(data))
				break;
			case 'LOAD':
				refreshTab();
				break;
			case 'SAVE':
//				save();
				break;
			case 'SAVEAS':
//				saveAs();
				break;

			case 'FIND':
//				find();
				break;
			case 'FINDAGAIN':
//				findAgain();
				break;
			case 'ABOUT':
//				doAbout('about');
				break;
			case 'INSTRUCTIONS':
//				doAbout('instructions');
				break;
			case 'MISC':
				break;
		}
	});

//	alert('end');
