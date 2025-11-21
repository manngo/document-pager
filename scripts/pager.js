/**	Document Pager
	================================================
	================================================ */

	'use strict';

	const { openZip } = require('../scripts/dozip.js');

	function dbug(message) {
		let error = new Error();
		let [dummy, file, line, column] = [...error.stack.matchAll(/\n *at (.*?) \(.*:(.*?):(.*)\)/g)][1];
		let info = `${file}: ${line}`;
		console.log(info, message ? message : '');
	}

dbug();
dbug('hello');

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

	const {DEVELOPMENT,cwd} = require('../settings.js');

/**	Generic
	================================================ */

	const iterableProperties = {
		enumerable: false,
		value: function * () {
			for(let key in this) if(this.hasOwnProperty(key)) yield this[key];
		}
	};
dbug(51)
/**	Requires
	================================================ */

	const electron = require('electron');
	const { ipcRenderer } = electron;



	ipcRenderer.on('debug-data', (event,result) => {
		console.log(result);
	});

	var { home } = JSON.parse(ipcRenderer.sendSync('init'));
	var settingsDir = `${home}/.document-pager`;

	const path = require('path');
	const fs = require('fs');
	const fsp = fs.promises;
	const normalize = require('normalize-path');
	const temp=require('temp').track();

	//	Others
		const {jx, DOM, JSONFile} = require('../scripts/utilities.js');
		const marked = require('marked');

/**	Environment
	================================================ */

	const platform = process.platform;
	const eol = process.platform === 'win32' ? '\r\n' : '\n';
	const os = require('os');

/**	Extensions
	================================================
	`${data.path}/${data.fileName}`
	image(string href, string title, string text)
	================================================ */

	var renderer = new marked.Renderer();
	renderer.paragraph = function(tokens) {
		let pattern = /^(#+)(.*?)(\.(.*?))?(\s+(.*?))?$/;
		let text = tokens.text;
		let parts = text.match(pattern);
		if(parts) {
			let id = parts[2]?` id="${parts[2]}"`:'';
			let className = parts[4]?` class="${parts[4]}"`:'';
			let level = parts[1].length;
			letcontent = parts[6]||'';
			return `<h${level}${id}${className}>${content}</h${level}>`;
		}
		else return marked.parse(text);
	};

/**	Support Functions
	================================================
	================================================ */

/**	Pager
	================================================
	================================================ */

//	Globals
	var settings, languages, extensions;
	var documentTitle;

	var languagesJSON = `${settingsDir}/languages.json`;
	var filesJSON = `${settingsDir}/files.json`, files = {}, pseudoFiles = [];
	var stateJSON = `${settingsDir}/state.json`, state={};

	var rearrangeableTabs = new jx.Rearrangeable('h', 'tabgroup');
	var zipFiles = {};
dbug('before init')
//	Main
	init();
dbug('after init')
	function init() {

		//	Toggle Documents Headings
			var li = document.querySelectorAll('nav#documents>ul>li');
			var documentsTab = undefined;
			function doDocumentsTab(event) {
				if(this != event.target) return;

				if(this == documentsTab) this.classList.toggle('open');
				else {
					if(documentsTab) documentsTab.classList.remove('open');
					documentsTab = this;
					documentsTab.classList.add('open');
				}

				state['documents-toggle'] = this.id;
				updateState();
			}
			li.forEach(i => {
				i.onclick = doDocumentsTab;
			});
dbug('before promise')
		//	Settings
			var promise=

			//	Default Settings
				fsp.readFile(path.join(cwd, '/settings.json'), 'utf-8')
				.then(data => {
					settings = JSON.parse(data);
				})

			//	Home Directory
				.then(() => fsp.stat(settingsDir))
				.catch(() => { fsp.mkdir(settingsDir); })

			//	Languages
				.then(() => fsp.stat(languagesJSON))
				.catch(() => fsp.writeFile(languagesJSON,'{}'))
				.then(() => fsp.readFile(languagesJSON))
				.then(data => {
					languages = JSON.parse(data);
					Object.keys(languages).forEach(l => {
						settings.languages[l] = languages[l];
/*
						if(!settings.languages[l]) settings.languages[l] = languages[l];
						else {
							settings.languages[l] = languages[l];
							if(languages[l].extensions) languages[l].extensions.forEach(ext => settings.languages[l].extensions.push(ext));
							if(languages[l].breaks) {
								if(languages[l].breaks.major) {
									if(!settings.languages[l].breaks.major) settings.languages[l].breaks.major = [];
									languages[l].breaks.major.forEach(br => settings.languages[l].breaks.major.push(br));
								}
								if(languages[l].breaks.minor) {
									if(!settings.languages[l].breaks.minor) settings.languages[l].breaks.minor = [];
									languages[l].breaks.minor.forEach(br => settings.languages[l].breaks.minor.push(br));
								}
							}

						}
*/
				});

					extensions = {};
					Object.keys(settings.languages).forEach(l => {
						settings.languages[l].extensions.forEach(e => {extensions[e] = l; });
					});
				})

			//	Details
				.then(() => {documentTitle = `${settings.headings.title} ${settings.version}`;})

			//	About
				.then(() => {
					pseudoFiles.push(path.join(cwd, '/README.md'));
					return openFile(path.join(cwd, '/README.md'), {title: 'About …'});
				})

			//	Files
				.then(() => fs.promises.stat(filesJSON))
				.catch((error) => fs.promises.writeFile(filesJSON, `{"current": [], "recent": [], "favourites": []}${eol}`))
				.then(() => fs.promises.readFile(filesJSON))
				.then(data => {
					try {
						files = JSON.parse(data);
					} catch(error) {
						files = {"current": [], "recent": [], "favourites": []};
					}
					//	Migrate files JSON
						files.current = files.current.map(f => {
							return typeof f == 'string' ? {path: f, title: path.basename(f)} : f;
						});
						files.recent = files.current.map(f => {
							return typeof f == 'string' ? {path: f, title: path.basename(f)} : f;
						});
						files.favourites = files.current.map(f => {
							return typeof f == 'string' ? {path: f, title: path.basename(f)} : f;
						});

						updateFiles();
					//	Current Files
						if(files.current) files.current.forEach(v => {
							openFile(v.path, {title: v.title});
						});
					//	Recent Files List
						updateDocuments();
				})

			//	State
				.then(() => fs.promises.stat(stateJSON))
				.catch(error => {
dbug(error)
					fs.promises.writeFile(stateJSON,`{"show-documents":false,"documents-width":120,"index-width":120,"default-path":"${home}","index-open-all":false, "content-ruled":true}${eol}`)
				})
				.then(() => fs.promises.readFile(stateJSON))
				.catch(() => {dbug('no state');})
				.then(data => {
					state = JSON.parse(data);
					state['index-open-all'] = !!state['index-open-all'];
					state['content-ruled'] = !!state['content-ruled'];
					//	For now, default path:
						if(!state['default-path']) state['default-path'] = home;
					//	Documents Pane
						document.querySelector('main').classList.toggle('show-documents', state['documents-width']);
						if(state['documents-width']) document.querySelector('nav#documents').style.width = `${state['documents-width']}px`;
						if(state['documents-toggle']) document.querySelector(`li#${state['documents-toggle']}`).classList.add('open');
						document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content').classList.toggle('ruled',!!state['content-ruled']);
					//	Index
						if(state['index-width']) document.querySelector('div#index').style.width=`${state['index-width']}px`;
				})
				.catch(() => {dbug('no data');})

			//	Theme
			.then(() => fs.promises.stat(`${settingsDir}/content.css`))
			.catch(() => { console.log('no content.css'); })
			.then(() => {
				console.log('content.css');
				document.querySelector('div#content>iframe').contentWindow.document.querySelector('head').insertAdjacentHTML('beforeend',`<link rel="stylesheet" href="${settingsDir}/content.css">`);
			})
		;
		//	End Settings


		if(DEVELOPMENT)
			promise
			.then(() => {
				pseudoFiles.push(path.join(cwd, 'data/exercises.sql'));
				return openFile(path.join(cwd, 'data/exercises.sql'), {});
			})
			.then(() => tabs[0].click())
			;
	}	//	End init()

	//	get Tab Number
		function getTab(fileName) {
			var result = {
				index: -1,
				tab: null,
				pathName: null
			};
			if (tabs.length) tabs.forEach((tab,index) => {
				var pathName;
				if((pathName = `${tab.data.path}/${tab.data.fileName}`) == fileName) {
					result = {index, tab, pathName};
				}
			});
			return result;
		}

	//	Update state.json
		function updateState() {
			fs.promises.writeFile(stateJSON, JSON.stringify(state), null, '\t');
		}

	//	Update files.json
		//	data={action, pathName}
		function updateFiles(data) {
			if(data) switch(data.action) {
				case 'add-current':
				//	if(!files.current.includes(data.pathName)) files.current.push(data.pathName);
					if(!files.current.map(f => f.path).includes(data.pathName))
						files.current.push({path: data.pathName, title: data.title});
					break;
				case 'remove-current':
					files.current = files.current.filter(value => value.path != data.pathName);
					break;
				case 'add-recent':
				//	if(!files.recent.includes(data.pathName)) files.recent.push(data.pathName);
					if(!files.recent.map(f => f.path).includes(data.pathName))
						files.recent.push({path: data.pathName, title: data.title});
					if(files.recent.length>16) files.recent.shift();
					break;
				case 'remove-recent':
					files.recent = files.recent.filter(value => value.path != data.pathName);
					break;
				case 'add-favourite':
				//	if(!files.favourites.includes(data.pathName)) files.favourites.push(data.pathName);
					if(!files.favourites.map(f => f.path).includes(data.pathName))
						files.favourites.push({path: data.pathName, title: data.title});
					break;
				case 'remove-favourite':
					files.favourites = files.favourites.filter(value => value.path != data.pathName);
					break;
				case 'change-title':
				//	files.favourites = files.favourites.filter(value => value != data.pathName);
					files.current.filter(f => f.path == data.pathName)[0].title = data.title;
					files.recent.filter(f => f.path == data.pathName)[0].title = data.title;
					files.favourites.filter(f => f.path == data.pathName)[0].title = data.title;
					break;
			}

			fs.promises.writeFile(filesJSON,JSON.stringify(files, null, '\t'));
			updateDocuments();
		}

	//	Documents Lists
		function updateDocuments() {
			let open = elements.documents.querySelector('li#documents-open>ul');
			open.innerHTML = '';
			let recent = elements.documents.querySelector('li#documents-recent>ul');
			recent.innerHTML = '';
			let favourites = elements.documents.querySelector('li#documents-favourite>ul');
			favourites.innerHTML = '';

			//	Recent Files
				if(files.recent) {
					files.recent.forEach(v => {
						let li = document.createElement('li');
						let {filepath, title} = {filepath: v.path, title: `${v.title}${v.title==path.basename(v.path) ? '' : ` - ${path.basename(v.path)}`}`};

						li.innerHTML = `${title}<button>×</button>`;
						li.href = filepath;
						li.onclick = doRecent;

						recent.appendChild(li);
					});
				}

				function doRecent(event) {
					console.log(event);
					var href = this.href;
					switch(event.target.nodeName) {
						case 'button':
						case 'BUTTON':
							updateFiles({'action':'remove-recent','pathName':href});
							break;
						default:
							openFile(href, {remember: true});
					}
				}

			//	Current Files
				pseudoFiles.forEach(v=>{
					let li=document.createElement('li');
					let name=path.basename(v);
					li.innerHTML=`<a href="doit:click:${v}">${name}</a>`;
					open.appendChild(li);
				});

				if(files.current) {
					files.current.forEach(v => {
						let {filepath, title} = {filepath: v.path, title: `${v.title}${v.title==path.basename(v.path) ? '' : ` - ${path.basename(v.path)}`}`};

						let li = document.createElement('li');
						li.innerHTML = title;
						li.href = filepath;
						li.onclick = doCurrent;
						open.appendChild(li);
					});
				}

				function doCurrent(event) {
					console.log(event);
					var href = this.href;
					var {index,tab}=getTab(href);
					tabs[index].click();
				}

			//	favourite Files
				if(files.favourites) {
					files.favourites.forEach(v => {
						let li=document.createElement('li');
						let {filepath, title} = {filepath: v.path, title: `${v.title}${v.title==path.basename(v.path) ? '' : ` - ${path.basename(v.path)}`}`};

						li.innerHTML=`${title}<button>×</button>`;
						li.href = filepath;
						li.onclick = doFavourite;
						favourites.appendChild(li);
					});
				}

				function doFavourite(event) {
					console.log(event);
					var href = this.href;
					switch(event.target.nodeName) {
						case 'button':
						case 'BUTTON':
							updateFiles({'action':'remove-favourite','pathName':href});
							break;
						default:
							openFile(href, {remember: true});
					}
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
		var elements = {
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
				codeElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content>div>code'),
				mdElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content>div>div.md'),
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

//		codeFontSize = getComputedStyle(document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content')).getPropertyValue('--font-size');
		codeFontSize = getComputedStyle(document.querySelector('div#content>iframe').contentWindow.document.querySelector('html')).getPropertyValue('--font-size');
		codeFontSize = codeFontSize.match(/((\d*)(\.\d+)?)([a-z]+)/);
		codeFontSize = {size: codeFontSize[1], units: codeFontSize[4]};
		originalCodeFontSize = codeFontSize.size;

	//	Adjust Elements
		//	jx.stretch(elements.indexDiv,elements.resizeIndex);
		//	jx.resize(elements.pager,'--index-width',elements.resizeIndex);
		document.querySelectorAll('span.resize').forEach(span=>{
			jx.resize(span, width => {
				state['documents-width'] = parseInt(getComputedStyle(elements.documents).width);
				state['index-width'] = parseInt(getComputedStyle(elements.indexDiv).width);
				updateState();
			});
		});

		lineNumbers = jx.addLineNumbers(elements.codeElement);
		elements.codeElement.resetLineNumbers();

		elements.formControl.elements['show-highlight'].onclick = event => {
			currentItem.click();
		};
		//	elements.formControl.elements['zoom-larger'].onclick=zoom.bind(null,1);
		//	elements.formControl.elements['zoom-smaller'].onclick=zoom.bind(null,-1);
		//	elements.formControl.elements['zoom-default'].onclick=zoom.bind(null,0);

		elements.formControl.elements['show-documents'].onclick = event => {
			elements.main.classList.toggle('show-documents',this.checked);
			state['show-documents']=this.checked;
			updateState();
		};
		elements.main.classList.toggle('show-documents', elements.formControl.elements['show-documents'].checked);

		elements.formControl.elements['full-screen'].onclick = event => {
			elements.fullCSS.disabled=false;
			document.addEventListener('keyup',doFullScreenKeys);
//			focusedWindow.webContents.on('before-input-event',doFullScreenKeys);
		};

		function doFullScreenKeys(event) {
		//	console.log(event.key);
			switch(event.key) {
				case 'Escape':
					elements.fullCSS.disabled=true;
					document.removeEventListener('keyup',doFullScreenKeys);
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

		jx.contentEditable(elements.codeElement, true);
		elements.codeElement.onblur = event => {
		//	console.log('blur');
		};

		elements.mdElement.addEventListener('click', event => {
			if (event.target.href && event.target.href.match(/^https?:\/\//)) {
				event.preventDefault();
				require('electron').shell.openExternal(event.target.href);
			}
		});

/*
		function something(event,input) {
			if(input.type!=='keyUp') return;
			switch(input.key) {
				case 'Escape':
					elements.fullCSS.disabled=true;
//						focusedWindow.webContents.off('before-input-event',doFullScreenKeys);
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
*/
		var index = document.querySelector('div#index');
		index.tabIndex=1;
		index.onkeydown = event => {
			//	console.log(event.key);
			var selected = index.querySelector('li.selected');
			var group = index.querySelector('div#index>ul>li.selected');
			//	console.log(selected);
			//	console.log(group);
			switch (event.key) {
				case 'ArrowDown':
					var next = selected.nextElementSibling;
					if(next) {
						next.click();
						next.scrollIntoViewIfNeeded(false);
					}
					break;
				case 'ArrowUp':
					var next = selected.previousElementSibling;
					if(next) {
						next.click();
						next.scrollIntoViewIfNeeded(false);
					}
					else {
						var grandParent = selected.parentNode.parentNode;
						if(grandParent.tagName == 'LI') grandParent.click();
					}
					break;
				case 'ArrowRight':
					if(group) {
						group.classList.add('open');
						group.querySelector('li').click();
					}
					break;
				case 'ArrowLeft':
					if(group) group.classList.remove('open');
					else {
						var grandParent = selected.parentNode.parentNode;
						grandParent.click();
					}
					break;
			}

		};

/**	Add Document
	================================================
	elements.iframeCSS.href=`${data.css}`;
	fs.stat
	================================================ */

	function addDocument(text, {language, fileName, path, css, extension, title, zip=undefined}) {
		var tab = document.createElement('li');
			// var css='';
			tab.innerHTML = `<span>${title ?? fileName}</span>`;
			// if(language=='markdown') var css=`${path}/${fileName.replace(/\..*$/,'')}/styles.css`;

			tab.data = {text, language, fileName, path, item: 0, highlighted: 1 , css, extension, indexStatus: [], zip};
			tab.onclick = doTab;

		var close = document.createElement('button');
			close.innerHTML = '×';
			close.onclick = closeTab.bind(tab,tab);
			close.className = 'tab-close';
		var refresh = document.createElement('button');
			refresh.innerHTML = '↻';
			refresh.onclick = refreshTab.bind(tab);
			refresh.className = 'tab-refresh';

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
			if(event.altKey) {
				let thisTitle = event.target;
				let thisTab = event.currentTarget;
				let content = thisTitle.textContent;
				thisTitle.contentEditable = 'plaintext-only';

				var range = document.createRange();
				var selection = window.getSelection();
				range.setStart(thisTitle, 0);
				range.setEnd(thisTitle, thisTitle.childNodes.length);
				selection.removeAllRanges();
				selection.addRange(range);

				thisTitle.onblur = event => {
					event.preventDefault();
					thisTitle.textContent = content;
					thisTitle.contentEditable = false;
					thisTitle.onblur = undefined;
				};

				thisTitle.onkeydown = event => {
					if(event.key=='Enter') {
						event.preventDefault();
						thisTitle.onblur = undefined;
						thisTitle.contentEditable = false;
					//	console.log(thisTab);
						if(!thisTitle.textContent) thisTitle.textContent = content;
						else updateFiles({'action': 'change-title', pathName: `${thisTab.data.path}/${thisTab.data.fileName}`, title: thisTitle.textContent});
					}
					else if(event.key=='Escape') {
						event.preventDefault();
						thisTitle.onblur = undefined;
						thisTitle.contentEditable = false;
						thisTitle.textContent = content;
					}
				}

dbug();
			}
			else {
				if(currentTab !== undefined) currentTab.classList.remove('selected');
				currentTab = event.currentTarget;
				currentTab.classList.add('selected');
				doPager(event.currentTarget.data);
			}
		}
	}

/**	refreshTab
	================================================
	================================================ */

	function refreshTab(event) {
		fsp.readFile(`${currentTab.data.path}/${currentTab.data.fileName}`, 'utf-8')
		.then(text => { currentTab.data.text = text; })
		.then(() => { currentTab.click(); });
	}

/**	closeTab
	================================================
	================================================ */

	function closeTab(tab, event) {
		if(!this) return;
		let zip = tab.data.zip;
		if (zip) for(let f in zipFiles[tab.data.zip].directory) {
			URL.revokeObjectURL(zipFiles[zip].directory[f].blobURL);
		}

		tabs = tabs.filter(value => value != tab);
		var path = `${this.data.path}/${this.data.fileName}`;
		//	var path=`${tab.data.path}/${tab.data.fileName}`;
		updateFiles({'action': 'remove-current', 'pathName': `${this.data.path}/${this.data.fileName}`});

		var sibling = this.previousElementSibling || this.nextElementSibling || undefined;
		//	var sibling=tab.previousElementSibling||tab.nextElementSibling||undefined;
		elements.tabPane.removeChild(this);
		//	elements.tabPane.removeChild(tab);
//		if(tab==currentTab) {
			currentTab = undefined;
			if(sibling) sibling.click();
			else {
				elements.indexUL.innerHTML = '';
				elements.codeElement.innerHTML = '';
				document.title = documentTitle;
//				elements.h1.innerHTML=settings.headings.h1+' '+settings.version;
				elements.contentHeading.innerHTML = settings.headings.content;
				elements.indexHeading.innerHTML = settings.headings.index;

				elements.contentDiv.classList.add('empty');
			}
//		}
		event?.stopPropagation();
	}

/**	doPager
	================================================
	Executed when tab is clicked.
	================================================ */
	function doPager(data) {
		//	Document Breaks
			var br, major, minor, highlight;
			var headingsRE, headingMajor, headingMinor, headingMiniscule, RE;
			//	Heading Regular Expressions:
				var breaks = settings.languages[data.language].breaks;
				var literals = /[-\/\\^$*+.()|[\]{}]/g;
				var lineHighlight = settings.languages[data.language].highlight;
			//	Breaks
				if(Array.isArray(breaks.major)) {
					major = [];
					breaks.major.forEach((value, i) => {
						major[i] = value.replace(literals,'\\$&');
					});
					major = major.join('|');
				}
				else major = breaks.major.replace(literals,'\\$&');
				if(breaks.minor) {
					if(Array.isArray(breaks.minor)) {
						minor = [];
						breaks.minor.forEach((value,i) => {
							minor[i] = value.replace(literals,'\\$&');
						});
						minor = minor.join('|');
					}
					else minor = breaks.minor.replace(literals,'\\$&');
				}
				else minor = null;

				data.br = `${major}\\s+|${minor}\\s+`;
				data.br = `[\\r\\n]${major}\\s+|${minor}[^\\S\\r\\n]+`;	//	data.br = '[\\r\\n]\\/\\*\\*\\s+|\\/\\*[^\\S\\r\\n]+'
				//	Break Regular Expressions

//					headingsRE=new RegExp(`(?:\\n\\s*)(?=${data.br})`);
//					headingsRE=new RegExp(`(?:\\n)(?=\\s*(${data.br}))`);
					headingsRE = new RegExp(`(?:\\n)(?=(?:${minor}|${major}))`);
					//	headingsRE = new Regexp(`(?:\\n)`)	//	/(?:\n)(?=(?:\/\*|\/\*\*))/

					headingMajor = new RegExp(`^(\\s*)(${major})\\s+(.*?)\\r?\\n`);
					headingMinor = new RegExp(`^(\\s*)(${minor})\\s+(.*?)\\r?\\n`);

					//	Special Case: Markdown

						if(data.language == 'markdown') {
							headingsRE = /(?:\n)(?=#{1,3}[^#])/;
							headingMajor = /^(\s*)(##[^#]*?)\s+(.*)/m;
							headingMajor = /^(\s*)(#[^#]*?)\s+(.*)/m;
							headingMinor = /^(\s*)(#{2,3}[^#]*?)\s+(.*)/m;
							headingMiniscule = /^(\s*)(###[^#]*?)\s+(.*)/m;
						}

		//	Document Info Footer
			elements.indexHeading.innerHTML = data.fileName;
			elements.footerHeading.innerHTML = `Breaks: ${data.br}`;

		//	Variables
			let selected = null;
			let title;

		//	Toggle Heading
			function toggleHeading(event) {
				//	if(this !== event.target) return;
				if(event.shiftKey) {
					var open = event.target.parentElement.classList.contains('open');
					headingItems.forEach(i => {
						i.classList.toggle('open',!open);
					});
				}
				else event.target.parentElement.classList.toggle('open');

				//	Save Index Status
					data.indexStatus = [];

					let ul = elements.indexUL.querySelectorAll('li');
					ul.forEach(li => {
						data.indexStatus.push(Array.from(li.classList));
					});
			}

		//	Populate Index
			elements.indexUL.innerHTML = '';
			let nested=false, ul, previous=null;
			let headingItems = [];
			let items = data.text.split(headingsRE);

			if(items.length>1) {
				let previous = undefined, selected = undefined;
				items.forEach((value,i) => {
					let li = document.createElement('li');

					RE = value.match(headingMajor);
					if(RE && RE[3]) {		//	Major Heading
						nested = false;
						title = RE[3];
					}
					else {
						RE = value.match(headingMinor);
						if(RE && RE[3]) {	//	Nesting
							if(!nested) {
								nested = true;
								elements.indexUL.appendChild(li);

								if(previous) {
									if(state['index-open-all']) previous.classList.add('open');
									var button = document.createElement('button');
										button.innerHTML = '›';
										button.onclick = toggleHeading;

									previous.insertAdjacentElement('afterbegin',button);

									previous.ondblclick = toggleHeading;

									ul = document.createElement('ul');
									previous.appendChild(ul);
								}
							}
							title = RE[3];
						}
						else title = '';
					}

					if(!title.length) return;

					li.insertAdjacentHTML('beforeend', `<span>${title}</span>`);
					if(data.language == 'markdown' && value.match(headingMiniscule)) li.classList.add('subtitle');
					li.next=li.previous = undefined;
					if(previous) {
						previous.next = li;
						li.previous = previous;
					}
					previous = li;
					headingItems.push(li);

//					var thing=value.split(/\r?\n/).forEach((v,i,a)=>a[i]=v.replace(new RegExp(`^${RE[1]}`),''));
					if(RE[1]) {
						var lines = value.split(/\r?\n/);
						var indent = new RegExp(`^${RE[1]}`);
						lines.forEach((v, i, a) => {
							a[i] = v.replace(indent, '');
						});
						value = lines.join('\n');
					}

					li.data = data;
					li.item = value;
					li.title = title;
					li.i = i;

//					li.onclick = loadItem.bind(li,data,value,title,i);
					li.onclick = loadItem;


					if(nested) ul?.appendChild(li);
					else elements.indexUL.appendChild(li);
					if(i == data.item) selected = li;
					previous = li;

					if(!selected) selected = li;
				});

				if(data.indexStatus.length) {
					let ul = elements.indexUL.querySelectorAll('li');

					ul.forEach(li => {
						let shift = data.indexStatus.shift();
						shift.forEach(className => {
							li.classList.add(className);
						});
					});
				}

				if(selected) selected.click();
			}
			else showItem(data.text, data.fileName, true);

	//	Not Empty
		elements.contentDiv.classList.remove('empty');

	//	Load Content - when heading selected
		function loadItem(event) {
			event.stopPropagation();

			let data = event.currentTarget.data;
			let item = event.currentTarget.item;
			let title = event.currentTarget.title;
			let i = event.currentTarget.i;

			elements.previousButton.onclick = elements.nextButton.onclick = null;
			let p, n;
			if(p = event.currentTarget.previous) elements.previousButton.onclick = event => {
					p.click();
				};
			if(n = event.currentTarget.next) elements.nextButton.onclick = event=> {
					n.click();
				};

			var doHighlight = elements.formControl.elements['show-highlight'].checked?!event.altKey:event.altKey;
			currentItem = data.li = event.currentTarget;

			if(selected) selected.classList.remove('selected');
			selected = event.currentTarget;
			selected.classList.add('selected');
			data.item = i;

			showItem(item, title, doHighlight);
		}

		function prepareItem() {

		}

		async function showItem(item, title, doHighlight) {
			elements.footerFile.innerHTML = `${data.path}/${data.fileName}`;
			elements.footerLanguage.innerHTML = `Language: ${data.language}`;
			elements.iframeBody.classList.remove('markdown');

			var language = ['js', 'javascript', 'sql', 'php'].indexOf(data.language)>-1;
			elements.codeElement.textContent = item;

			elements.codeElement.classList.forEach(className => {
				if(className.startsWith('language-')) elements.codeElement.classList.remove(className);
			});
			elements.codeElement.classList.add(`language-${data.language}`);
			lineNumbers.style.display='block';
			elements.codeElement.style.display = 'block';
			elements.mdElement.style.display = 'none';
			elements.iframeCSS.href = '';

			if(data.language && doHighlight) {
				if(data.language != 'markdown') {
					elements.codeElement.innerHTML = Prism.highlight(item, Prism.languages[data.language], data.language);
				}
				else {
					var div=document.createElement('div');

				//	var innerHTML=marked.parse(item,{baseUrl: `${data.path}/${data.fileName}`, renderer});
					var innerHTML = marked.parse(item);

					innerHTML = innerHTML.replace(/<img(.*?)src="(.*?)"(.*?)>/g, (match, p1, p2, p3, offset, string) => {
						if (p2.match(/^https?:\/\//) || p2.startsWith('/') || p2.match(/^[A-Z]:\//))
							return `<img${p1}src="${p2}"${p3}>`;
						else {
							if(data.zip) {
							//	let blobData = await zipFiles[data.zip].directory[`${zipFiles[data.zip].root}/${p2}`].file.buffer();
							//	let blob = new Blob([blobData], { type: 'image/png' });
							//	let blobURL = URL.createObjectURL(blob);

						//		return `<img${p1}src="blob:do-zip:${data.zip}:${p2.replace(/^\//,'')}"${p3}>`;		//	data = data.replaceAll(/src="(?!https?:)(.*)"/g, 'src="do-zip:zipfile-tba$1"');
								return `<img${p1}src="${zipFiles[data.zip].directory[`${zipFiles[data.zip].root}/${p2}`].blobURL}"${p3}>`;
							}
						//	if(data.zip) return `<img${p1}src="${data.zip}:${p2.replace(/^\//,'')}"${p3}>`;		//	data = data.replaceAll(/src="(?!https?:)(.*)"/g, 'src="do-zip:zipfile-tba$1"');
							else return `<img${p1}src="${currentTab.data.path}/${p2.replace(/^\//,'')}"${p3}>`;
						}
					});

					div.innerHTML = innerHTML;

	//				var doEtc = false;	if(doEtc)
					div.querySelectorAll('pre').forEach(pre=>{
						var code = pre.querySelector('code');
						var html = code.textContent;
						var language = code.className.match(/\blanguage-(.*)\b/);
						if(language) {
							language = language[1];
							code.innerHTML=Prism.highlight(html, Prism.languages[language], language);
						}
					});

					var h2 = div.querySelector('h1,h2,h3');
					div.id=h2.id;
					h2.id='';
					div.className=h2.className;
					div.classList.add(h2.tagName.toLowerCase());
					h2.removeAttribute('id');
					h2.removeAttribute('class');
					elements.mdElement.innerHTML=div.outerHTML;
					elements.iframeBody.classList.add('markdown');

					//	var open=null;
					elements.iframeBody.querySelectorAll('li').forEach(li=>{
						li.addEventListener('click',function(event) {
							this.classList.toggle('selected');
							event.stopPropagation();
						},false);
						if(li.querySelector('ul'))
							li.addEventListener('click',function(event) {
								if(event.shiftKey) {
									this.classList.toggle('open');
									return;
								}
								[...this.parentNode.children].forEach(li=>{
									if(li==event.target) li.classList.toggle('open');
									else li.classList.remove('open');
								});

								//	event.stopPropagation();
							},false);
					});

					lineNumbers.style.display='none';
					elements.codeElement.style.display='none';
					elements.mdElement.style.display='block';

					elements.iframeCSS.href=`${data.css}`;


				}
			}

//				elements.iframeCSS.href=`${data.css}`;

			document.title=documentTitle+': '+data.fileName+' — '+title;
//			elements.h1.innerHTML=documentTitle+': '+data.fileName+' — '+title;
			elements.contentHeading.innerHTML=title;
			elements.codeElement.resetLineNumbers(lineHighlight);

		}
	}

	function zoom(direction) {
		switch(direction) {
			case -1:
				codeFontSize.size /= 1.25;
				break;
			case 1:
				codeFontSize.size *= 1.25;
				break;
			default:
				codeFontSize.size = originalCodeFontSize;
				break;
		}
	//	document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content').style.setProperty('--font-size',`${codeFontSize.size}${codeFontSize.units}`);
		document.querySelector('div#content>iframe').contentWindow.document.querySelector('html').style.setProperty('--font-size',`${codeFontSize.size}${codeFontSize.units}`);
		elements.codeElement.resetLineNumbers();
	}

	zoom(0);

	function footerMessage(message) {
		elements.footerMessage.textContent=message;
	}

	function pathDetails(uri) {
		uri = normalize(uri);
		var path, fileName, extension, css;

		path = uri.split('/');
		fileName = path.pop();
		path = path.join('/');
		extension = fileName.split('.').pop();
		css = '';
		// if(extensions[extension]=='markdown') css=`${path}/${fileName.replace(/\..*$/,'')}/styles.css`;
		//	if(extensions[extension]=='markdown') css=`${path}/styles.css`;
		if(extensions[extension] == 'markdown') css = `${path}/${fileName.replace(/\..*$/,'')}.css`;

		return { path, fileName, extension, css};
	}

	function openFile(fileName, {remember=false, title}) {
		var {index, tab} = getTab(fileName);
		if(index>-1) {
			tab.click();
			return;
		}

		var result = null;
		if(fileName.match(/^https?:\/\//)) result = openURL(fileName, remember);
		else result = openPath(fileName, {remember, title});
		return result;

		function virtualDocument(pathName) {
			var { path, fileName, extension, css } = pathDetails(pathName);
			fsp.stat(pathName)
			.then(() => fps.readFile(`${path}/${fileName}`, 'utf-8'))
			.then(data => {
				data = JSON.parse(data);
				var md = [];
				fetch(data.data.url)
				.then(response => response.json())
				.then(images => {
					images.forEach(image => {
						md.push(`#\t${image.title}`);
						md.push(`![${image.title}](https://javascript101.webcraft101.com/images/slides/${image.src})`);
					});
					data = md.join('\n\n');
				//	{language, fileName, path, css, extension, title, zip=undefined}
					addDocument(data, {language: extensions['md'], fileName, path, css: '', extension: 'md'});
				//	addDocument(data, extensions['md'], fileName, path, '', 'md');
				});
			});
		}

		async function zipDocument(pathName, title) {
			let { path, fileName, extension, css } = pathDetails(pathName);
			//	let zip, directory, data, root;
			zipFiles[pathName] = await openZip(pathName);
			let { zip, directory, root } = zipFiles[pathName];
			let data = await directory[`${root}/${root}.md`].file.buffer();
			data = data.toString();
			//	![Paintings JOIN Artists](images/6-2-paintings-inner-join-artists.png)


		//	css = await directory[`${root}/${root}.css`].file.buffer();
		//	css = css.toString();

			css = await directory[`${root}/${root}.css`].blobURL;

		//	{language, fileName, path, css, extension, title, zip=undefined}
			addDocument(data, {language: extensions['md'], fileName, path, css, extension: 'md', zip: pathName, title});
		//	addDocument(data, extensions['md'], fileName, path, css, 'md', pathName);
			updateDocuments();
			if(!remember) return;
			updateFiles({'action': 'add-current', pathName});
			updateFiles({'action': 'add-recent', pathName});
		}

		function openPath(pathName, {remember=false, title}) {
			let { path, fileName, extension, css } = pathDetails(pathName);
			if(extension == 'dpf') return virtualDocument(pathName);
			if(extension == 'zip') return zipDocument(pathName, title);
			return fsp.stat(pathName)
			.then(() => {
//				var {path,fileName,extension,css}=pathDetails(pathName);
				return fsp.stat(css)
				.catch(() => { css = ''; })
				.then(() => fsp.readFile(`${path}/${fileName}`, 'utf-8'))
				.then(data => {
				//	{language, fileName, path, css, extension, title, zip=undefined}
					addDocument(data, {language: extensions[extension], fileName, path, css, extension, title});
				//	addDocument(data, extensions[extension], fileName, path, css, extension);
				})
				.then(() => {
					updateDocuments();
					if(!remember) return;
					updateFiles({'action': 'add-current', pathName, title});
					updateFiles({'action': 'add-recent', pathName, title});
				})
				.catch(error => { console.log(error); });
			})
			.catch(error=>{
				//	Error
					ipcRenderer.invoke('message-box',{
						buttons: ['OK'],
						message: `Oh Dear. The File ${pathName} appears to have disappeared.`
					})
					.then(()=>{
						console.log(`Error: The File ${pathName} appears to have disappeared.`);
						//	Remove from Current & Recent
							files.current=files.current.filter(value=>value!=pathName);
							files.recent=files.recent.filter(value=>value!=pathName);
							fs.promises.writeFile(filesJSON, JSON.stringify(files, null, '\t'));
					});
			});
		}

		function openURL(url,remember=false) {
			var data;
			var promise, cancelled=false;

			var { path, fileName, extension, css } = pathDetails(url);

	//		fetch('https://pager.internotes.net/content/mssql-techniques.sql')
			promise=fetch(url)
			.then(response=>{
				if(!response.ok) throw new Error(`Oh Dear. The file ${url} is not available.`);
				else return response.text();
			})
			.catch((error)=>{
				ipcRenderer.invoke('message-box',{
					buttons: ['OK'],
					message: `Oh Dear. The URL ${url} appears to be unavailable.`
				})
				.then(()=>{
					console.log(error);
					cancelled=true;
					files.current=files.current.filter(value=>value!=url);
					fs.promises.writeFile(filesJSON,JSON.stringify(files, null, '\t'));
				});
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
			//	{language, fileName, path, css, extension, title, zip=undefined}
				addDocument(data, {language: extensions[extension], fileName, path, css, extension});
			//	addDocument(data,extensions[extension],fileName,path,css,extension);
			})
			.then(()=>{
				if(cancelled || !remember) return;
				if(!files.current.includes(url)) {
					files.current.push(url);
					fs.promises.writeFile(filesJSON,JSON.stringify(files, null, '\t'));
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

	function printPage() {
		elements.iframe.print();
	}

	function printDocument() {
		let printWindow;
		let content = elements.iframe.document.querySelector('div#main-content');
		while(content.children.length>1) content.lastChild.remove();
		elements.indexUL.querySelectorAll('li').forEach(li => {
			let div = document.createElement('div');
			div.innerHTML = '<code class="language-none">Content</code>';
			content.append(div);
			let code = div.querySelector('code');
			code.innerHTML = Prism.highlight(li.item, Prism.languages[currentTab.data.language], currentTab.data.language);
			jx.addLineNumbers(code);
			code.resetLineNumbers();
			code.classList.add(`language-${currentTab.data.language}`);
		});
		content.children[0].style['display'] = 'none';
		elements.iframe.print();
		elements.iframe.addEventListener('afterprint', event => {
			console.log('finished printing');
			while(content.children.length>1) content.lastChild.remove();
			content.children[0].style['display'] = '';
		});
	}

//	IPC

ipcRenderer.on('DO-ZIP', async (event, zipfile, path) => {
//	ipcRenderer.on('file', async (event, zipfile, path) => {
	console.log(`${zipfile} : ${path}`);
	let data = await zipFiles[zipfile].directory[`${zipFiles[zipfile].root}/${path}`].file.buffer();
//	let blob = new Blob(data, { type: 'image/png' });

//	let reader = new FileReader();
//	reader.readAsDataURL(blob);
//	data = reader.result;

//	return data;
	let blob = new Blob([data], { type: 'image/png' });
	return blob;
//	let url = URL.createObjectURL(blob);
//	return url;
});

	ipcRenderer.on('CLOG', (event, data, more) => {
		console.log(data);
	});

	ipcRenderer.on('DOIT', (event, action, data, more) => {
		switch(action) {
			case 'open':
				openFile(data, {remember: true});
				break;
			case 'message':
				footerMessage(data);
				break;
			case 'click':
				var {index,tab} = getTab(data);
				tabs[index].click();
				break;
			case 'locate':
				break;
			case 'special':
		}
	});

	ipcRenderer.on('open-file-paths',(event,result)=>{
		if(result.canceled) return;
		var pd = pathDetails(result.filePaths[0]);
		localStorage.setItem('defaultPath',pd.path);
		state['default-path'] = pd.path;
		updateState();
		result.filePaths.forEach(f=>{
			openFile(f, {remember: true});
		});
		//	openFile(result.filePaths[0],true);
console.log(result);
	});

	ipcRenderer.on('MENU', (event, data, more) => {
console.log(data);
		switch(data) {
			case 'NEW':

				break;
			case 'OPEN':
					console.log(state);
					console.log(state['default-path']);
					ipcRenderer.send('open-file',{
						title: 'Title',
						//	defaultPath: localStorage.getItem('defaultPath')
						defaultPath: state['default-path']
					});
					ipcRenderer.on('open-file-paths?',(event,result)=>{
						if(result.canceled) return;
						var pd = pathDetails(result.filePaths[0]);
						localStorage.setItem('defaultPath',pd.path);
						state['default-path'] = pd.path;
						updateState();
						result.filePaths.forEach(f=>{
							openFile(f, {remember: true});
						});
console.log(result);
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
				if(url) openFile(url, {remember: true});
				break;
			case 'ZOOM':
				zoom(more);
				break;
			case 'LOAD':
				refreshTab();
				break;
			case 'PRINTPAGE':
				printPage();
				break;
			case 'PRINTDOCUMENT':
				printDocument();
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
				updateFiles({'action':'add-favourite','pathName':`${currentTab.data.path}/${currentTab.data.fileName}`});
				break;
			case 'UNFAVOURITE':
				updateFiles({'action':'remove-favourite','pathName':`${currentTab.data.path}/${currentTab.data.fileName}`});
				break;

			case 'FIND':
//				find();
				break;
			case 'FINDAGAIN':
//				findAgain();
				break;
			case 'INFO':
				openFile(path.join(cwd, '/README.md'), {title: 'About …'});
				break;
			case 'MISC':
				break;
		}
	});
