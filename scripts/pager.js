/**	Document Pager
	================================================
	================================================ */

	'use strict';

/**	Drag & Drop … ?
	================================================ */

	document.ondragover = document.ondrop = (event) => {
		console.log('dragover | drop');
		event.preventDefault();
	};

	document.body.ondrop = (event) => {
		//console.log(JSON.stringify(event.dataTransfer.files[0].path));
		//		openFile(event.dataTransfer.files[0].path.toString());
		event.preventDefault();
	};

/**	settings.js
	================================================ */

	const {DEVELOPMENT,cwd}=require('../settings.js');

/**	Generic
	================================================ */

	const iterableProperties={
		enumerable: false,
		value: function * () {
			for(let key in this) if(this.hasOwnProperty(key)) yield this[key];
		}
	};

/**	Requires
	================================================ */

	const electron=require('electron');
		const { ipcRenderer, shell, remote } = require('electron');
			const app=remote.app;
			const BrowserWindow = remote.BrowserWindow;
			const dialog=remote.dialog;
	const path = require('path');
	const fs = require('fs');
		const fsp = fs.promises;
	const normalize = require('normalize-path');
	const temp=require('temp').track();

	//	Others
		const {jx,DOM}=require('../scripts/utilities.js');
		const marked = require('marked');

/**	Environment
	================================================ */

	const platform=process.platform;
	const os=require('os');

/**	Extensions
	================================================ */

	var renderer = new marked.Renderer();
	renderer.paragraph=function(text) {
		var pattern=/^(#+)(.*?)(\.(.*?))?(\s+(.*?))?$/;
		var parts=text.match(pattern);
		if(parts) {
			var id=parts[2]?` id="${parts[2]}"`:'';
			var className=parts[4]?` class="${parts[4]}"`:'';
			var level=parts[1].length;
			var content=parts[6]||'';
			return `<h${level}${id}${className}>${content}</h${level}>`;
		}
		else return marked(text);

	};

	const window=remote.getCurrentWindow();
	window.webContents.on('new-window', function(event, url) {
	  event.preventDefault();
	  shell.openExternal(url);
	});

/**	Support Functions
	================================================
	================================================ */

	function load(theDocument) {
		return new Promise((resolve,reject)=>{
			if(!theDocument) return;
			fsp
			.readFile(theDocument)
			.then(data => {
				data=data.toString();
				resolve(data);
			});
		});
	}
open
/**	Pager
	================================================
	================================================ */

//	Globals
	var settings,languages,extensions;
	var documentTitle;

	var home=`${app.getPath('home')}/.document-pager`;
	var languagesJSON=`${home}/languages.json`;
	var filesJSON=`${home}/files.json`, files={};

//	Main
	init();

	function init() {
		var breaks;

		var promise=
			//	Default Settings
				load(path.join(cwd, '/settings.json'))
				.then(data=>{
					settings=JSON.parse(data);
				})

			//	Home Directory
				.then(()=>fsp.stat(home))
				.catch(()=>{fsp.mkdir(home);})

			//	Languages
				.then(()=>fsp.stat(languagesJSON))
				.catch(()=>fsp.writeFile(languagesJSON,'{}'))
				.then(()=>fsp.readFile(languagesJSON))
				.then(data=>{
					languages=JSON.parse(data);
					Object.keys(languages).forEach(l=> {
						if(!settings.languages[l]) settings.languages[l]=languages[l];
						else {
							if(languages[l].extensions) languages[l].extensions.forEach(ext=>settings.languages[l].extensions.push(ext));
							if(languages[l].breaks) {
								if(languages[l].breaks.major) {
									if(!settings.languages[l].breaks.major) settings.languages[l].breaks.major=[];
									languages[l].breaks.major.forEach(br=>settings.languages[l].breaks.major.push(br));
								}
								if(languages[l].breaks.minor) {
									if(!settings.languages[l].breaks.minor) settings.languages[l].breaks.minor=[];
									languages[l].breaks.minor.forEach(br=>settings.languages[l].breaks.minor.push(br));
								}
							}
						}
					});

					extensions={};
					Object.keys(settings.languages).forEach(l=>{
						settings.languages[l].extensions.forEach(e=>extensions[e]=l);
					});
				})

			//	Details
				.then(()=>documentTitle=settings.headings.title+' '+settings.version)

			//	About
				.then(()=>{
					openFile(path.join(cwd, '/README.md'));
				})

			//	Files
				.then(()=>fs.promises.stat(filesJSON))
				.catch(()=>fs.promises.writeFile(filesJSON,'[]'))
				.then(()=>fs.promises.readFile(filesJSON))
				.then(data=>{
					files=JSON.parse(data);
					files.forEach(v=>{
						if(v.match(/^https?:\/\//)) openURL(v,true);
						else {
							fsp.stat(v)
							.then(()=>openFile(v))
							.catch(error=>{
								dialog.showMessageBox({
									buttons: ['OK'],
									message: `Oh Dear. The File ${v} appears to have disappeared.`
								});

								files=files.filter(value=>value!=v);
								fsp.writeFile(filesJSON,JSON.stringify(files));

								console.log(`Error: The File ${v} appears to have disappeared.`);
							});
						}
					});
				})
		;

		if(DEVELOPMENT)
			promise
//			.then(()=>openURL('https://pager.internotes.net/content/mssql-techniques.sql',true))
			.then(()=>openFile(path.join(cwd, 'data/exercises.sql')))
			.then(()=>tabs[0].click())
			;
	}

/**	Pager
	================================================
	================================================ */

	//	Document Tabs
		var currentTab;
		var currentItem;
		var tabs=[];

	//	Other Variables
		var lineNumbers;
		var codeFontSize,originalCodeFontSize;

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
				iframe: document.querySelector('div#content>iframe').contentWindow,
				iframeCSS: document.querySelector('div#content>iframe').contentWindow.document.querySelector('link#additional-css'),
				iframeBody: document.querySelector('div#content>iframe').contentWindow.document.querySelector('body'),
				mainContent: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content'),
				codeElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content>code'),
				mdElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content>div#md'),
				highlightButton: document.querySelector('button#highlight'),
				smallerButton: document.querySelector('button#smaller'),
				defaultButton: document.querySelector('button#default'),
				largerButton: document.querySelector('button#larger'),
				previousButton: document.querySelector('button#previous'),
				nextButton: document.querySelector('button#next'),
			//	Footer
				footerFile: document.querySelector('span#footer-file'),
				footerMessage: document.querySelector('span#footer-message'),
				footerLanguage: document.querySelector('span#footer-language'),
				footerHeading: document.querySelector('span#footer-heading'),
		};

		codeFontSize=getComputedStyle(document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content')).getPropertyValue('--font-size');
		codeFontSize=codeFontSize.match(/((\d*)(\.\d+)?)([a-z]+)/);
		codeFontSize={size: codeFontSize[1], units: codeFontSize[4]};
		originalCodeFontSize=codeFontSize.size;

	//	Adjust Elements
		jx.stretch(elements.indexDiv,elements.resizeIndex);

		lineNumbers=jx.addLineNumbers(elements.codeElement);
		elements.codeElement.resetLineNumbers();

		elements.formControl.elements['show-highlight'].onclick=function(event) {
			currentItem.click();
		};
		elements.formControl.elements['zoom-larger'].onclick=zoom.bind(null,1);
		elements.formControl.elements['zoom-smaller'].onclick=zoom.bind(null,-1);
		elements.formControl.elements['zoom-default'].onclick=zoom.bind(null,0);

		jx.contentEditable(elements.codeElement,true);
		elements.codeElement.onblur=event=>{
			console.log('blur');
		};

/**	Add Document
	================================================
	elements.iframeCSS.href=`${data.css}`;
	fs.stat
	================================================ */

	function addDocument(text,language,fileName,path,css) {
		var tab=document.createElement('li');
			// var css='';
			tab.textContent=fileName;
			// if(language=='markdown') var css=`${path}/${fileName.replace(/\..*$/,'')}/styles.css`;

			tab.data={text, language, fileName, path, item: 0, highlighted: 1 , css};
			tab.onclick=doTab;

		var close=document.createElement('button');
			close.innerHTML=`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0" y="0" width="8" height="8" viewBox="0, 0, 24, 24"><path d="M3.141,24 L-0,24 L10.332,11.935 L-0,0 L3.401,0 L12,9.06 L20.924,0 L24,0 L13.581,11.935 L24,24 L20.664,24 L12,14.33 z" fill="#000000"/></svg>`;	//	'⨉';	//	✖️
			close.onclick=closeTab.bind(tab);
			close.id='tab-close';
		var refresh=document.createElement('button');
			refresh.innerHTML='↻';
			refresh.onclick=refreshTab.bind(tab);
			refresh.id='tab-refresh';

		//	Add to DOM
			tab.appendChild(close);
			elements.tabPane.appendChild(tab);

		//	Activate
			// doPager(tab.data);
			tab.click();

		//	Track
			tabs.push(tab);
			currentTab=tab;

		function doTab(event) {
			if(currentTab!==undefined) currentTab.classList.remove('selected');
			currentTab=this;
			currentTab.classList.add('selected');
			doPager(this.data);
		}
	}
/**	refreshTab
	================================================
	================================================ */

	function refreshTab(event) {
		var file=`${currentTab.data.path}/${currentTab.data.fileName}`;
		load(file).then(text=>currentTab.data.text=text).then(()=>currentTab.click());
	}

/**	closeTab
	================================================
	================================================ */

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
		if(event) event.stopPropagation();
	}

/**	doPager
	================================================

	================================================ */
	function doPager(data) {
		//	Prepare Document
			var br, major, minor;
			var headingsRE, headingMajor, headingMinor, RE;
			//	Heading Regular Expressions:
				var breaks=settings.languages[data.language].breaks;
				var literals=/[-\/\\^$*+.()|[\]{}]/g;
			//	Breaks
				if(Array.isArray(breaks.major)) {
					major=[];
					breaks.major.forEach((value,i)=>major[i]=value.replace(literals,'\\$&'));
					major=major.join('|');
				}
				else major=breaks.major.replace(literals,'\\$&');
				if(breaks.minor) {
					if(Array.isArray(breaks.minor)) {
						minor=[];
						breaks.minor.forEach((value,i)=>minor[i]=value.replace(literals,'\\$&'));
						minor=minor.join('|');
					}
					else minor=breaks.minor.replace(literals,'\\$&');
				}
				else minor=null;
				data.br=`${major}\\s+|${minor}\\s+`;
				//	Break Regular Expressions

					headingsRE=new RegExp(`(?:\\n\\s*)(?=${data.br})`);
					headingsRE=new RegExp(`(?:\\n)(?=\\s*(${data.br}))`);

					headingMajor=new RegExp(`^(\\s*)(${major})\\s+(.*?)\\r?\\n`);
					headingMinor=new RegExp(`^(\\s*)(${minor})\\s+(.*?)\\r?\\n`);

					//	Special Case: Markdown

						if(data.language=='markdown') {
							headingsRE=/(?:\n)(?=##?[^#])/;
							headingMajor=/^(\s*)(##?[^#]*?)\s+(.*)/m;
						}

		//	(Re) Select Document
			elements.indexHeading.innerHTML=data.fileName;
			elements.footerHeading.innerHTML=`Breaks: ${data.br}`;

	//	Variables
		var selected=null;
		var title;

	//	Populate Index
		var items=data.text.split(headingsRE);
		elements.indexUL.innerHTML='';
		var nested=false, ul, previous=null;
		if(items.length>1) {
			var previous=undefined, selected=undefined;
			items.forEach(function(value,i) {

				var li=document.createElement('li');
				RE=value.match(headingMajor);

				if(RE && RE[3]) {
					nested=false;
					title=RE[3];
				}
				else {
					RE=value.match(headingMinor);
					if(RE && RE[3]) {
						//	Nesting
							if(!nested) {
								nested=true;
								elements.indexUL.appendChild(li);
								ul=document.createElement('ul');
								previous.appendChild(ul);
							}

						title=RE[3];
					}
					else title='';
				}
				if(!title.length) return;

				li.innerHTML=`<span>${title}</span>`;
				li.next=li.previous=undefined;
				if(previous) {
					previous.next=li;
					li.previous=previous;
				}
				previous=li;

//				var thing=value.split(/\r?\n/).forEach((v,i,a)=>a[i]=v.replace(new RegExp(`^${RE[1]}`),''));
				if(RE[1]) {
					var lines=value.split(/\r?\n/);
					var indent=new RegExp(`^${RE[1]}`);
					lines.forEach((v,i,a)=>a[i]=v.replace(indent,''));
					value=lines.join('\n');
				}

				li.onclick=loadItem.bind(li,data,value,title,i);
				if(nested) ul.appendChild(li);
				else elements.indexUL.appendChild(li);
				if(i==data.item) selected=li;
				previous=li;

				if(!selected) selected=li;
			});



			if(selected) selected.click();
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

			if(selected) selected.classList.remove('selected');
			selected=this;
			selected.classList.add('selected');
			data.item=i;
			showItem(item,title,doHighlight);
			event.stopPropagation();
		}
		function showItem(item,title,doHighlight) {
			elements.footerFile.innerHTML=`${data.path}/${data.fileName}`;
			elements.footerLanguage.innerHTML=`Language: ${data.language}`;
			elements.iframeBody.classList.remove('markdown');
			var language=['js','javascript','sql','php'].indexOf(data.language)>-1;
			elements.codeElement.textContent=item;

			elements.codeElement.classList.forEach(className=>{if(className.startsWith('language-')) elements.codeElement.classList.remove(className);});
			elements.codeElement.classList.add(`language-${data.language}`);
			lineNumbers.style.display='block';
			elements.codeElement.style.display='block';
			elements.mdElement.style.display='none';
			elements.iframeCSS.href='';

			if(language && doHighlight) elements.codeElement.innerHTML=Prism.highlight(item, Prism.languages[data.language], data.language);
			else if(data.language=='markdown' && doHighlight) {
				var div=document.createElement('div');
				var innerHTML=marked(item,{baseUrl: `${data.path}/${data.fileName}`, renderer});
				div.innerHTML=innerHTML;
				var h2=div.querySelector('h1,h2');
				div.id=h2.id;
				h2.id='';
				div.className=h2.className;
				div.classList.add(h2.tagName.toLowerCase());
				h2.removeAttribute('id');
				h2.removeAttribute('class');
//				innerHTML=innerHTML.replace(/(<h.*>.*<\/h.>)([\s\S]*)/g,'$1\n<div>$2</div>');
				elements.mdElement.innerHTML=div.outerHTML;
				elements.iframeBody.classList.add('markdown');
				lineNumbers.style.display='none';
				elements.codeElement.style.display='none';
				elements.mdElement.style.display='block';

				elements.iframeCSS.href=`${data.css}`;
			}
//				elements.iframeCSS.href=`${data.css}`;

			document.title=documentTitle+': '+data.fileName+' — '+title;
//			elements.h1.innerHTML=documentTitle+': '+data.fileName+' — '+title;
			elements.contentHeading.innerHTML=title;
			elements.codeElement.resetLineNumbers();

		}
	}
	function zoom(direction) {
		switch(direction) {
			case -1:
				codeFontSize.size/=1.25;
				break;
			case 1:
				codeFontSize.size*=1.25;
				break;
			default:
				codeFontSize.size=originalCodeFontSize;
				break;
		}
		document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content').style.setProperty('--font-size',`${codeFontSize.size}${codeFontSize.units}`);

//		jx.setLineNumbers(elements.codeElement,lineNumbers);
//		elements.codeElement.resetLineNumbers();
	}

	zoom(0);



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
				break;
			case 'locate':
				break;
			case 'special':
		}
	});

	function pathDetails(uri) {
		uri=normalize(uri);
		var path, fileName, extension, css;

		path=uri.split('/');
		fileName=path.pop();
		path=path.join('/');
		extension=fileName.split('.').pop();
		css='';
		if(extensions[extension]=='markdown') css=`${path}/${fileName.replace(/\..*$/,'')}/styles.css`;

		return {path,fileName,extension,css};
	}

	function openFile(pathName,remember=false) {
		var {path,fileName,extension,css}=pathDetails(pathName);
		return fsp.stat(css).catch(()=>css='')
		.then(()=>load(`${path}/${fileName}`))
		.then(data=> {
			addDocument(data,extensions[extension],fileName,path,css);
		})
		.then(()=>{
			if(!remember) return;
			if(!files.includes(pathName)) {
				files.push(pathName);
				fs.promises.writeFile(filesJSON,JSON.stringify(files));
			}
		})
		.catch(error=>{console.log(error);});
	}

	function openURL(url,remember=false) {
		var data;
		var promise, cancelled=false;

		var {path,fileName,extension,css}=pathDetails(url);

//		fetch('https://pager.internotes.net/content/mssql-techniques.sql')
		promise=fetch(url)
		.then(response=>{
			if(!response.ok) throw new Error(`Oh Dear. The file ${url} is not available.`);
			else return response.text();
		})
		.catch((error)=>{
			dialog.showMessageBox({
				buttons: ['OK'],
				message: `Oh Dear. The URL ${url} appears to be unavailable.`
			});
			console.log(error);
			cancelled=true;
			files=files.filter(value=>value!=url);
			fsp.writeFile(filesJSON,JSON.stringify(files));

		})
		.then((text)=>{
			if(cancelled) return;
			data=text;
		})
		.then(()=>{
			if(cancelled) return;
			fetch(css).catch(()=>css='');
		})
		.then((text)=>{
			if(cancelled) return;
			addDocument(data,extensions[extension],fileName,path,css);
		})
		.then(()=>{
			if(cancelled || !remember) return;
			if(!files.includes(url)) {
				files.push(url);
				fs.promises.writeFile(filesJSON,JSON.stringify(files));
			}
		});
		return promise;
	}

	function save() {
		var file=`${currentTab.data.path}/${currentTab.data.fileName}`;
		if(!file) return;
		var text=currentTab.data.text.trim()+'\n';
		if(platform=='win32') text=text.split(/\r?\n/).join('\r\n');
		elements.mainContent.blur();
		fsp.writeFile(file,text)
		.then(()=>console.log('ok'))
		.catch(error=>console.log(error));
	}

	ipcRenderer.on('MENU',(event,data,more)=>{
		switch(data) {
			case 'NEW':

				break;
			case 'OPEN':
				if(dialog.showOpenDialog.then)
					dialog.showOpenDialog({
						title: 'Title',
						defaultPath: localStorage.getItem('defaultPath')||'/nfs/html/internotes.net/pager/content'
					})
					.then(result=> {
						if(result.canceled) return;
						localStorage.setItem('defaultPath',path);
						openFile(result.filePaths[0],true);
					});
				else
					dialog.showOpenDialog({
						title: 'Title',
						defaultPath: localStorage.getItem('defaultPath')||'/nfs/html/internotes.net/pager/content'
					},result=> {
						if(result===undefined) return;
						localStorage.setItem('defaultPath',path);
						openFile(result[0],true);
					});
				break;
			case 'URL':
				var url=ipcRenderer.sendSync('prompt',{
						message: 'Enter a URL:',
						pattern: 'https?://.+',
						value: 'https://',
//						value: 'https://pager.internotes.net/content/mssql-techniques.sql',
						error: 'URL must begin with http:// or https://'
					});
				if(url) openURL(url,true);
				break;
			case 'ZOOM':
				zoom(more);
				break;
			case 'LOAD':
				refreshTab();
				break;
			case 'CLOSE':
				closeTab.call(currentTab);
				break;
			case 'HIGHLIGHT':
				elements.formControl.elements['show-highlight'].checked=more;
				currentItem.click();
				break;
			case 'SAVE':
				save();
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
