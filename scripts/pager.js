/**	Document Pager
	================================================
	================================================ */

	'use strict';

/**	Drag & Drop … ?
	================================================ */

	document.ondragover = document.ondrop = (event) => {
		// console.log('dragover | drop');
		// event.preventDefault();
	};

	document.body.ondrop = (event) => {
		// console.log(JSON.stringify(event.dataTransfer.files[0].path));
		// //		openPath(event.dataTransfer.files[0].path.toString());
		// event.preventDefault();
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
	const { ipcRenderer, shell, remote } = electron;
	const {app,BrowserWindow,dialog,Menu,MenuItem}=remote;
	const focusedWindow=BrowserWindow.getFocusedWindow();
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
	const eol = process.platform === 'win32' ? '\r\n' : '\n';
	const os=require('os');

/**	Extensions
	================================================
	`${data.path}/${data.fileName}`
	image(string href, string title, string text)
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

/**	Pager
	================================================
	================================================ */

//	Globals
	var settings,languages,extensions;
	var documentTitle;

	var home=`${app.getPath('home')}/.document-pager`;
	var languagesJSON=`${home}/languages.json`;
	var filesJSON=`${home}/files.json`, files={}, pseudoFiles=[];
	var stateJSON=`${home}/state.json`, state={};

	var rearrangeableTabs=new jx.Rearrangeable('h','tabgroup');

//	Main
	init();

	function init() {

		//	Toggle Documents Headings
			var li=document.querySelectorAll('nav#documents>ul>li');
			var documentsTab=undefined;
			function doDocumentsTab(event) {
				if(this!=event.target) return;

				if(this==documentsTab) this.classList.toggle('open');
				else {
				    if(documentsTab) documentsTab.classList.remove('open');
				    documentsTab=this;
				    documentsTab.classList.add('open');
				}

				state['documents-toggle']=this.id;
				updateState();
			}
			li.forEach(i=>{
				i.onclick=doDocumentsTab;
			});


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
					pseudoFiles.push(path.join(cwd, '/README.md'));
					return openFile(path.join(cwd, '/README.md'));
				})

			//	Files
				.then(()=>fs.promises.stat(filesJSON))
				.catch(()=>fs.promises.writeFile(filesJSON,`{"current":[],"recent":[],"favorites":[]}${eol}`))
				.then(()=>fs.promises.readFile(filesJSON))
				.then(data=>{
					files=JSON.parse(data);
					//	Current Files
						if(files.current) files.current.forEach(v=>{
							openFile(v);
						});
					//	Recent Files List
						updateDocuments();
				})

			//	State
				.then(()=>fs.promises.stat(stateJSON))
				.catch(()=>fs.promises.writeFile(stateJSON,`{"show-documents":false,"documents-width":120,"index-width":120}${eol}`))
				.then(()=>fs.promises.readFile(stateJSON))
				.then(data=>{
					state=JSON.parse(data);
					//	Documents Pane
						document.querySelector('main').classList.toggle('show-documents',state['documents-width']);
						if(state['documents-width']) document.querySelector('nav#documents').style.width=`${state['documents-width']}px`;
						if(state['documents-toggle']) document.querySelector(`li#${state['documents-toggle']}`).classList.add('open');
					//	Index
						if(state['index-width']) document.querySelector('div#index').style.width=`${state['index-width']}px`;
				})
		;



		if(DEVELOPMENT)
			promise
//			.then(()=>openURL('https://pager.internotes.net/content/mssql-techniques.sql',true))
			.then(()=>{
				pseudoFiles.push(path.join(cwd, 'data/exercises.sql'));
				return openFile(path.join(cwd, 'data/exercises.sql'));
			})
			.then(()=>tabs[0].click())
//			.then(()=>console.log('hello'))
			;
	}

	//	get Tab Number
		function getTab(fileName) {
			var result= {
				index: -1,
				tab: null,
				pathName: null
			};
			if (tabs.length) tabs.forEach((tab,index)=> {
				var pathName;
				if((pathName=`${tab.data.path}/${tab.data.fileName}`)==fileName) {
					result={index,tab,pathName};
				}
			});
			return result;
		}

	//	State
		function updateState() {
			fs.promises.writeFile(stateJSON,JSON.stringify(state));
		}


	//	files.json
		//	data={action, pathName}
		function updateFiles(data) {
			switch(data.action) {
				case 'add':
					if(!files.current.includes(data.pathName))  files.current.push(data.pathName);
					if(!files.recent.includes(data.pathName))  files.recent.push(data.pathName);
					if(files.recent.length>16) files.recent.shift();
					break;
				case 'remove':
					files.current=files.current.filter(value=>value!=data.pathName);
					break;
				case 'favorite':
					if(!files.favorites.includes(data.pathName))  files.favorites.push(data.pathName);
					break;
				case 'unfavorite':
					files.favorites=files.favorites.filter(value=>value!=data.pathName);
					break;
			}
			fs.promises.writeFile(filesJSON,JSON.stringify(files));
			updateDocuments();
		}


	//	Documents Lists
		function updateDocuments() {
			let open=elements.documents.querySelector('li#documents-open>ul');
			open.innerHTML='';
			let recent=elements.documents.querySelector('li#documents-recent>ul');
			recent.innerHTML='';
			let favorites=elements.documents.querySelector('li#documents-favourite>ul');
			favorites.innerHTML='';
			//	Recent Files
				if(files.recent) {
					files.recent.forEach(v=>{
						let li=document.createElement('li');
						let name=path.basename(v);
						li.innerHTML=`<a href="doit:open:${v}">${name}</a>`;
						recent.appendChild(li);
					});
				}
			//	Current Files
				pseudoFiles.forEach(v=>{
					let li=document.createElement('li');
					let name=path.basename(v);
					li.innerHTML=`<a href="doit:click:${v}">${name}</a>`;
					open.appendChild(li);
				});
				if(files.current) {
					files.current.forEach(v=>{
						let li=document.createElement('li');
						let name=path.basename(v);
						li.innerHTML=`<a href="doit:click:${v}">${name}</a>`;
						open.appendChild(li);
					});
				}
			//	favorite Files
				if(files.favorites) {
					files.favorites.forEach(v=>{
						let li=document.createElement('li');
						let name=path.basename(v);
						li.innerHTML=`<a href="doit:open:${v}">${name}</a>`;
						favorites.appendChild(li);
					});
				}
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
				main: document.querySelector('main'),
				documents: document.querySelector('nav#documents'),
			//	Index
				indexDiv: document.querySelector('div#index'),
				indexHeading: document.querySelector('div#index>h2'),
				indexUL: document.querySelector('div#index>ul'),
				resizeIndex: document.querySelector('div#pager>span#resize-index'),
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
			//	Full Screen
				fullCSS: document.querySelector('link#full-css'),
		};

		codeFontSize=getComputedStyle(document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content')).getPropertyValue('--font-size');
		codeFontSize=codeFontSize.match(/((\d*)(\.\d+)?)([a-z]+)/);
		codeFontSize={size: codeFontSize[1], units: codeFontSize[4]};
		originalCodeFontSize=codeFontSize.size;

	//	Adjust Elements
		//	jx.stretch(elements.indexDiv,elements.resizeIndex);
		//	jx.resize(elements.pager,'--index-width',elements.resizeIndex);
		document.querySelectorAll('span.resize').forEach(span=>{
			jx.resize(span,width=>{
				state['documents-width']=parseInt(getComputedStyle(elements.documents).width);
				state['index-width']=parseInt(getComputedStyle(elements.indexDiv).width);
				updateState();
			});
		});

		lineNumbers=jx.addLineNumbers(elements.codeElement);
		elements.codeElement.resetLineNumbers();

		elements.formControl.elements['show-highlight'].onclick=function(event) {
			currentItem.click();
		};
		elements.formControl.elements['zoom-larger'].onclick=zoom.bind(null,1);
		elements.formControl.elements['zoom-smaller'].onclick=zoom.bind(null,-1);
		elements.formControl.elements['zoom-default'].onclick=zoom.bind(null,0);

		elements.formControl.elements['show-documents'].onclick=function(event){
			elements.main.classList.toggle('show-documents',this.checked);
			state['show-documents']=this.checked;
			updateState();
		};
		elements.main.classList.toggle('show-documents',elements.formControl.elements['show-documents'].checked);

		function doFullScreenKeys(event,input) {
			if(input.type!=='keyUp') return;
			switch(input.key) {
		        case 'Escape':
		            elements.fullCSS.disabled=true;
						focusedWindow.webContents.off('before-input-event',doFullScreenKeys);
		            break;
		        case 'ArrowRight':
					elements.nextButton.click();
		            break;
		        case 'ArrowLeft':
					elements.previousButton.click();
		            break;
		        case 'ArrowUp':
					elements.indexUL.firstElementChild.click();
		            break;
		        case 'ArrowDown':
					elements.indexUL.lastElementChild.click();
		            break;
		    }
		}
		elements.formControl.elements['full-screen'].onclick=function (event) {
			elements.fullCSS.disabled=false;
			focusedWindow.webContents.on('before-input-event',doFullScreenKeys);
		};

		jx.contentEditable(elements.codeElement,true);
		elements.codeElement.onblur=event=>{
			console.log('blur');
		};

		elements.mdElement.addEventListener('click',event=>{
			if (event.target.href && event.target.href.match(/^https?:\/\//)) {
				event.preventDefault();
				require('electron').shell.openExternal(event.target.href);
			}
		});

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
			close.onclick=closeTab.bind(tab,tab);
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
//			jx.rearrangeable(document.querySelectorAll('ul#tabs>li'));
			rearrangeableTabs.add(tab);

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

	function closeTab(tab,event) {

		tabs=tabs.filter(value=>value!=tab);
		var path=`${this.data.path}/${this.data.fileName}`;
		updateFiles({'action': 'remove', 'pathName': `${this.data.path}/${this.data.fileName}`});

		var sibling=this.previousElementSibling||this.nextElementSibling||undefined;
		elements.tabPane.removeChild(this);
		if(tab==currentTab) {
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

				function toggleHeading(event) {
				    if(this!==event.target) return;
					if(event.shiftKey) {
						var open=this.parentElement.classList.contains('open');
						headingItems.forEach(i=>{
							i.classList.toggle('open',!open);
						});
				    }
				    else this.parentElement.classList.toggle('open');
				}


	//	Populate Index
		var items=data.text.split(headingsRE);
		elements.indexUL.innerHTML='';
		var nested=false, ul, previous=null;
		var headingItems=[];
		if(items.length>1) {
			var previous=undefined, selected=undefined;
			items.forEach(function(value,i) {

				var li=document.createElement('li');
				RE=value.match(headingMajor);

				if(RE && RE[3]) {	//	Major Heading
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

								previous.classList.add('open');
								var button=document.createElement('button');
									button.innerHTML='›';
									button.onclick=toggleHeading;
								previous.insertAdjacentElement('afterbegin',button);

								ul=document.createElement('ul');
								previous.appendChild(ul);
							}

						title=RE[3];
					}
					else title='';
				}
				if(!title.length) return;

				li.insertAdjacentHTML('beforeend',`<span>${title}</span>`);
				li.next=li.previous=undefined;
				if(previous) {
					previous.next=li;
					li.previous=previous;
				}
				previous=li;

				headingItems.push(li);


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

				// innerHTML=innerHTML.replace(/<img(.*?)src="(.*)"(.*?)>/g,function(match,p1,p2,p3,offset,string) {
				// 	if (p2.match(/^https?:\/\//)) return string;
				// 	else return `<img${p1}src="${currentTab.data.path}/${currentTab.data.fileName.replace(/\.[^.]*$/,'')}/${p2.replace(/^\//,'')}"${p3}>`;
				// });

				innerHTML=innerHTML.replace(/<img(.*?)src="(.*)"(.*?)>/g,function(match,p1,p2,p3,offset,string) {
					if (p2.match(/^https?:\/\//)) return string;
					else return `<img${p1}src="${currentTab.data.path}/${p2.replace(/^\//,'')}"${p3}>`;
				});

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

	function pathDetails(uri) {
		uri=normalize(uri);
		var path, fileName, extension, css;

		path=uri.split('/');
		fileName=path.pop();
		path=path.join('/');
		extension=fileName.split('.').pop();
		css='';
		// if(extensions[extension]=='markdown') css=`${path}/${fileName.replace(/\..*$/,'')}/styles.css`;
		//	if(extensions[extension]=='markdown') css=`${path}/styles.css`;
		if(extensions[extension]=='markdown') css=`${path}/${fileName.replace(/\..*$/,'')}.css`;

		return {path,fileName,extension,css};
	}

	function openFile(fileName,remember=false) {
		var {index,tab}=getTab(fileName);
		if(index>-1) {
			tab.click();
			return;
		}
console.log(fileName);
		var result=null;
		if(fileName.match(/^https?:\/\//)) result=openURL(fileName,remember);
		else result=openPath(fileName,remember);
		return result;

		function openPath(pathName,remember=false) {
			return fsp.stat(pathName)
			.then(()=>{
				var {path,fileName,extension,css}=pathDetails(pathName);
				return fsp.stat(css).catch(()=>css='')
				.then(()=>load(`${path}/${fileName}`))
				.then(data=> {
					addDocument(data,extensions[extension],fileName,path,css);
				})
				.then(()=>{
					updateDocuments();
					if(!remember) return;
					updateFiles({'action':'add',pathName});
					// if(!files.current.includes(pathName))  files.current.push(pathName);
					// if(!files.recent.includes(pathName))  files.recent.push(pathName);
					// if(files.recent.length>16) files.recent.shift();
					// fs.promises.writeFile(filesJSON,JSON.stringify(files));
				})
				.catch(error=>{console.log(error);});
			})
			.catch(error=>{
				//	Error
					dialog.showMessageBox({
						buttons: ['OK'],
						message: `Oh Dear. The File ${pathName} appears to have disappeared.`
					});
					console.log(`Error: The File ${pathName} appears to have disappeared.`);

				//	Remove from Current & Recent
					files.current=files.current.filter(value=>value!=pathName);
					files.recent=files.recent.filter(value=>value!=pathName);
					fsp.writeFile(filesJSON,JSON.stringify(files));
			});
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
				files.current=files.current.filter(value=>value!=url);
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
				if(!files.current.includes(url)) {
					files.current.push(url);
					fs.promises.writeFile(filesJSON,JSON.stringify(files));
				}
			});
			return promise;
		}
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

//	IPC

	ipcRenderer.on('DOIT',(event,action,data,more)=>{
		switch(action) {
			case 'open':
				openFile(data,true);
				break;
			case 'message':
				footerMessage(data);
				break;
			case 'click':
				var {index,tab}=getTab(data);
				tabs[index].click();
				break;
			case 'locate':
				break;
			case 'special':
		}
	});

	ipcRenderer.on('MENU',(event,data,more)=>{
console.log(data);
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
				if(url) openFile(url,true);
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
			case 'DOCUMENTS':
				elements.formControl.elements['show-documents'].click();
				break;
			case 'FAVOURITE':
				updateFiles({'action':'favorite','pathName':`${currentTab.data.path}/${currentTab.data.fileName}`});
				break;
			case 'UNFAVOURITE':
				updateFiles({'action':'unfavorite','pathName':`${currentTab.data.path}/${currentTab.data.fileName}`});
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
