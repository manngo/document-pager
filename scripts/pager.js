/**	Document Pager
	================================================
	================================================ */

	'use strict';

/**	Generic
	================================================ */

	const iterableProperties = {
		enumerable: false,
		value: function * () {
			for(let key in this) if(this.hasOwnProperty(key)) yield this[key];
		}
	};

	function dbug(message) {
		let error = new Error();
		let [dummy, file, line, column] = [...error.stack.matchAll(/\n *at (.*?) \(.*:(.*?):(.*)\)/g)][1];
		let info = `${file}: ${line}`;
		console.log(info, message ? message : '');
	}

	function fixPath(path) {
		return path.replaceAll(/\\/g, '/');
	}

/**	settings.js
	================================================ */

	const {DEVELOPMENT, cwd} = require('../settings.js');

/**	Requires
	================================================
	================================================ */

	const electron = require('electron');
	const { ipcRenderer } = electron;

	const path = require('path');
	const fsp = require('fs').promises;

	//	Others
		const {jx, DOM, JSONFile} = require('../scripts/utilities.js');
		const { openZip } = require('../scripts/dozip.js');

	var { home } = JSON.parse(ipcRenderer.sendSync('init'));
	var settingsDir = `${home}/.document-pager`;

/**	Environment
	================================================ */

	const platform = process.platform;
	const eol = process.platform === 'win32' ? '\r\n' : '\n';
	const os = require('os');

/**	Marked
	================================================
	`${data.filePath}/${data.fileName}`
	image(string href, string title, string text)
	================================================ */

	const marked = require('marked');
	const markedRenderer = new marked.Renderer();
	markedRenderer.paragraph = function(tokens) {
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

/**	Pager
	================================================
	================================================ */

//	Globals
	let settings = {}, languages = {}, extensions = {}, pending = [];
	var documentTitle;

	let userData = {
		languages: {
			path: `${settingsDir}/languages.json`,
			data: {},
		},
		files: {
			path: `${settingsDir}/files.json`,
			data: {},
			async write() {
				for(let section in userData.files.data) userData.files.data[section].forEach(f => {
					f.title = f.title ?? path.basename(f.path);
				});
				fsp.writeFile(userData.files.path, JSON.stringify(userData.files.data, null, '\t'));
			},
		},
		state: {
			path: `${settingsDir}/state.json`,
			data: {},
			async write() {
				fsp.writeFile(userData.state.path, JSON.stringify(userData.state.data, null, '\t'));
			},
		},
	};

	var pseudoFiles = [];

	var rearrangeableTabs = new jx.Rearrangeable('h', 'tabgroup');
	var zipFiles = {};

//	Components

	function toggleDocumentHeadings() {
		let li = document.querySelectorAll('nav#documents>ul>li');
		let documentsTab = undefined;
		function doDocumentsTab(event) {
			if(this != event.target) return;

			if(this == documentsTab) this.classList.toggle('open');
			else {
				if(documentsTab) documentsTab.classList.remove('open');
				documentsTab = this;
				documentsTab.classList.add('open');
			}

			userData.state.data['documents-toggle'] = this.id;
			userData.state.write();
		}
		li.forEach(i => {
			i.onclick = doDocumentsTab;
		});
	}

//	Main
	init();

	async function init() {
		toggleDocumentHeadings();

		//	Default Settings
			settings = await fsp.readFile(path.join(cwd, '/settings.json'), 'utf-8');
			settings = JSON.parse(settings);

		//	Home Directory
			try { await fsp.stat(settingsDir); }
			catch { await fsp.mkdir(settingsDir); }

		//	Languages
			try { await fsp.stat(userData.languages.path); }
			catch { await fsp.writeFile(userData.languages.path,'{}'); }

			languages = await fsp.readFile(userData.languages.path, 'utf-8');
			languages = JSON.parse(languages);
			Object.keys(languages).forEach(l => {
				settings.languages[l] = languages[l];
			});

			//extensions = {};
			Object.keys(settings.languages).forEach(l => {
				settings.languages[l].extensions.forEach(e => {extensions[e] = l; });
			});

		//	Details
			let documentTitle = `${settings.headings.title} ${settings.version}`;

		//	About
			pseudoFiles.push({path: path.join(cwd, '/README.md'), title: 'About …'});
//			openFile(path.join(cwd, '/README.md'), {title: 'About …'});

		//	Files
			try {
				await fsp.stat(userData.files.path);
				let files = await fsp.readFile(userData.files.path, 'utf-8');
				userData.files.data = JSON.parse(files);
				//	Fix paths (still?)
					for(let section in userData.files.data) userData.files.data[section].forEach(f => {
						f.path = fixPath(f.path);
					});
			}
			catch {
				userData.files.data = {"current": [], "recent": [], "favourites": []};
				userData.files.write();
			}

			updateFiles();

		//	Current Files
			if(pseudoFiles) pseudoFiles.forEach(v => {
				openFile(v.path, {title: v.title});
			});
			if(userData.files.data.current) userData.files.data.current.forEach(v => {
				openFile(v.path, {title: v.title});
			});

		//	Recent Files List

			updateDocuments();

		//	State
			try {
				await fsp.stat(userData.state.path);
				let state = await fsp.readFile(userData.state.path, 'utf-8');
				userData.state.data = JSON.parse(state);
				userData.state.data['index-open-all'] = !!userData.state.data['index-open-all'];
				userData.state.data['content-ruled'] = !!userData.state.data['content-ruled'];
				//	For now, default path:
					if(!userData.state.data['default-path']) userData.state.data['default-path'] = home;
				//	Documents Pane
					document.querySelector('main').classList.toggle('show-documents', userData.state.data['documents-width']);
					if(userData.state.data['documents-width']) document.querySelector('nav#documents').style.width = `${userData.state.data['documents-width']}px`;
					if(userData.state.data['documents-toggle']) document.querySelector(`li#${userData.state.data['documents-toggle']}`).classList.add('open');
					document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content').classList.toggle('ruled',!!userData.state.data['content-ruled']);
				//	Index
					if(userData.state.data['index-width']) document.querySelector('div#index').style.width=`${userData.state.data['index-width']}px`;
			}
			catch {
				userData.state.data = {
					"show-documents": false,
					"documents-width": 120,
					"index-width": 120,
					"default-path": home,
					"index-open-all": false,
					"content-ruled": true,
				};
 dbug('no state');
				await userData.state.write();
			}

		//	Theme
			try {
				await fsp.stat(`${settingsDir}/content.css`);
				document.querySelector('div#content>iframe').contentWindow.document.querySelector('head').insertAdjacentHTML('beforeend',`<link rel="stylesheet" href="${settingsDir}/content.css">`);
			}
			catch {
				console.log('no content.css');
			}

		//	open pending files
			pending.forEach(p => {
				openFile(p, {remember: true});
			});


		document.addEventListener('keydown', event => {
			if(event.altKey && event.key=='Alt') {
				event.preventDefault();
			//	console.log('alt');
			}
		});

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
				if((pathName = `${tab.data.filePath}/${tab.data.fileName}`) == fileName) {
					result = {index, tab, pathName};
				}
			});
			return result;
		}

	//	Update files.json
		//	data={action, pathName}
		function updateFiles(data) {
			let file;
			if(data) switch(data.action) {
				case 'add-current':
					if(!userData.files.data.current.map(f => f.path).includes(data.pathName))
						userData.files.data.current.push({path: data.pathName, title: data.title});
					break;
				case 'remove-current':
					userData.files.data.current = userData.files.data.current.filter(value => value.path != data.pathName);
					break;
				case 'add-recent':
					if(!userData.files.data.recent.map(f => f.path).includes(data.pathName))
						userData.files.data.recent.push({path: data.pathName, title: data.title});
					if(userData.files.data.recent.length > 16) userData.files.data.recent.shift();
					break;
				case 'remove-recent':
					userData.files.data.recent = userData.files.data.recent.filter(value => value.path != data.pathName);
					break;
				case 'add-favourite':
					if(!userData.files.data.favourites.map(f => f.path).includes(data.pathName))
						userData.files.data.favourites.push({path: data.pathName, title: data.title});
					break;
				case 'remove-favourite':
					userData.files.data.favourites = userData.files.data.favourites.filter(value => value.path != data.pathName);
					break;
				case 'change-title':
					currentTab.data.title = data.title;
					if(file = userData.files.data.current.filter(f => f.path == data.pathName)[0]) file.title = data.title;
					if(file = userData.files.data.recent.filter(f => f.path == data.pathName)[0]) file.title = data.title;
					if(file = userData.files.data.favourites.filter(f => f.path == data.pathName)[0]) file.title = data.title;
					elements.indexHeading.innerHTML = data.title &&  data.title!=data.fileName ? `${data.title}<span>${data.fileName}</span>` : data.fileName;

					updateDocuments();

					break;
			}

			userData.files.write();

			updateDocuments();
		}

	//	Documents Lists
		function updateDocuments() {
			let sections = {
				open: elements.documents.querySelector('li#documents-open>ul'),
				recent: elements.documents.querySelector('li#documents-recent>ul'),
				favourites: elements.documents.querySelector('li#documents-favourite>ul'),
			};

			sections['open'].innerHTML = '';
			sections['recent'].innerHTML = '';
			sections['favourites'].innerHTML = '';

			//	Add File to Nav Panel
				function addFile(section, file, action=undefined, close=false) {
					let li = document.createElement('li');
				//	let { filepath, title } = { filepath: file.path, title: `${file.title}${file.title==path.basename(file.path) ? '' : `<br>${path.basename(file.path)}`}` };
					let text = `${file.title}${file.title==path.basename(file.path) ? '' : `<br>${path.basename(file.path)}`}`;
					li.innerHTML = close ? `${text}<button>×</button>` : text;;
					li.href = file.path;
					li.title = file.title;
					li.section = section;

					li.onclick = action;
					sections[section].appendChild(li);
				}

			//	Open Pseudo Files
				pseudoFiles.forEach(v => {
					addFile('open', v, doCurrent, false);
//					let li=document.createElement('li');
//					let name=path.basename(v);
//					li.innerHTML=`<a href="doit:click:${v}">${name}</a>`;
//					sections['open'].appendChild(li);
				});

			//	Add Other Files
				userData.files.data.current?.forEach(v => {
					addFile('open', v, doCurrent, false);
				});
				userData.files.data.recent?.forEach(v => {
					addFile('recent', v, doFile, true);
				});
				userData.files.data.favourites?.forEach(v => {
					addFile('favourites', v, doFile, true);
				});

				function doCurrent(event) {
					console.log(event);
					var href = this.href;
					var {index, tab} = getTab(href);
					tabs[index].click();
				}

				function doFile(event) {
					console.log(event);
					let [pathName, title] = [event.currentTarget.href, event.currentTarget.title];
					switch(event.target.nodeName) {
						case 'button':
						case 'BUTTON':
						//	let index = files[section]
							userData.files.data[event.currentTarget.section] = userData.files.data[event.currentTarget.section].filter(f => f.path != pathName);
							userData.files.write();
							break;
						default:
							openFile(pathName, { remember: true, title });
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
//				h1: document.querySelector('h1'),
				formControl: document.querySelector('form#control'),
			//	Main
				tabPane: document.querySelector('ul#tabs'),
				pager: document.querySelector('div#pager'),
				main: document.querySelector('main'),
				documents: document.querySelector('nav#documents'),
			//	Index
				indexDiv: document.querySelector('div#index'),
				indexHeading: document.querySelector('div#index h2'),
				indexUL: document.querySelector('div#index>ul'),
				resizeIndex: document.querySelector('div#pager>span#resize-index'),
			//	Content
				contentDiv: document.querySelector('div#content'),
				contentHeading: document.querySelector('div#content>h2'),
//				divContentPre: document.querySelector('div#content>pre'),
				iframe: document.querySelector('div#content>iframe').contentWindow,
				iframeCSS: document.querySelector('div#content>iframe').contentWindow.document.querySelector('link#additional-css'),
				iframeBody: document.querySelector('div#content>iframe').contentWindow.document.querySelector('body'),
				mainContent: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content'),
				codeElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content>div>code'),
				mdElement: document.querySelector('div#content>iframe').contentWindow.document.querySelector('div#main-content>div>div.md'),
//				highlightButton: document.querySelector('button#highlight'),
//				smallerButton: document.querySelector('button#smaller'),
//				defaultButton: document.querySelector('button#default'),
//				largerButton: document.querySelector('button#larger'),
				//	previousButton: document.querySelector('button#previous'),
				//	nextButton: document.querySelector('button#next'),
			//	Footer
				footerFile: document.querySelector('span#footer-file'),
				footerMessage: document.querySelector('span#footer-message'),
				footerLanguage: document.querySelector('span#footer-language'),
				footerHeading: document.querySelector('span#footer-heading'),
			//	Full Screen
				fullCSS: document.querySelector('link#full-css'),
		};
		document.body.classList.add(process.platform);

		codeFontSize = getComputedStyle(document.querySelector('div#content>iframe').contentWindow.document.querySelector('html')).getPropertyValue('--font-size');
		codeFontSize = codeFontSize.match(/((\d*)(\.\d+)?)([a-z]+)/);
		codeFontSize = { size: codeFontSize[1], units: codeFontSize[4] };
		originalCodeFontSize = codeFontSize.size;

	//	Adjust Elements
		//	jx.stretch(elements.indexDiv,elements.resizeIndex);
		//	jx.resize(elements.pager,'--index-width',elements.resizeIndex);
		document.querySelectorAll('span.resize').forEach(span=>{
			jx.resize(span, width => {
				userData.state.data['documents-width'] = parseInt(getComputedStyle(elements.documents).width);
				userData.state.data['index-width'] = parseInt(getComputedStyle(elements.indexDiv).width);
				userData.state.write();
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
			userData.state.data['show-documents']=this.checked;
			userData.state.write();
		};
		elements.main.classList.toggle('show-documents', elements.formControl.elements['show-documents'].checked);

		elements.formControl.elements['full-screen'].onclick = event => {
			elements.fullCSS.disabled = false;
			document.addEventListener('keyup', doFullScreenKeys);
//			focusedWindow.webContents.on('before-input-event',doFullScreenKeys);
		};

		function doFullScreenKeys(event) {
		//	console.log(event.key);
			switch(event.key) {
				case 'Escape':
					elements.fullCSS.disabled = true;
					document.removeEventListener('keyup', doFullScreenKeys);
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

	function addDocument(text, {language, fileName, filePath, css, extension, title, zip=undefined}) {
		var tab = document.createElement('li');
			// var css='';
			tab.innerHTML = `<span>${title ?? fileName}</span>`;
			// if(language=='markdown') var css=`${filePath}/${fileName.replace(/\..*$/,'')}/styles.css`;

			tab.data = {text, language, fileName, filePath, title: '?', item: 0, highlighted: 1 , css, extension, indexStatus: [], zip};
//			tab.data.docTitle = title;
//	dbug('do I need docTitle?')
			tab.data.title = title;
			tab.onclick = doTab;

		var close = document.createElement('button');
			close.innerHTML = '×';
			close.onclick = closeTab.bind(tab,tab);
			close.className = 'tab-close';

//		var refresh = document.createElement('button');
//			refresh.innerHTML = '↻';
//			refresh.onclick = refreshTab.bind(tab);
//			refresh.className = 'tab-refresh';

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
				event.preventDefault();
			//	let thisTitle = event.target;
			//	let thisTitle = event.currentTarget.closest('li').querySelector('span');
				let thisTab = event.currentTarget;
				let thisTitle = thisTab.querySelector('span');
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
					if(event.altKey) event.preventDefault();
					if(event.key=='Enter') {
						event.preventDefault();
						thisTitle.onblur = undefined;
						thisTitle.contentEditable = false;
					//	console.log(thisTab);
						if(!thisTitle.textContent) thisTitle.textContent = content;
						else updateFiles({
							action: 'change-title',
							pathName: `${thisTab.data.filePath}/${thisTab.data.fileName}`,
							title: thisTitle.textContent,
							fileName: thisTab.data.fileName,
						});
					}
					else if(event.key=='Escape') {
						event.preventDefault();
						thisTitle.onblur = undefined;
						thisTitle.contentEditable = false;
						thisTitle.textContent = content;
					}
				}
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

	function refreshTab(css=false) {
		if(css) {
			//	link.href = `${link.href.replace(/\?[^?]*$/, ``)}?${Math.random()}`;
			if(elements.iframeCSS) elements.iframeCSS.href = `${currentTab.data.css}?${Math.random()}`;
			currentTab.click();
		}
		else {
			fsp.readFile(`${currentTab.data.filePath}/${currentTab.data.fileName}`, 'utf-8')
			.then(text => { currentTab.data.text = text; })
			.then(() => { currentTab.click(); });
		}
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
		var path = `${this.data.filePath}/${this.data.fileName}`;
		//	var path=`${tab.data.filePath}/${tab.data.fileName}`;
		updateFiles({'action': 'remove-current', 'pathName': `${this.data.filePath}/${this.data.fileName}`});

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
							headingsRE = /(?:\n)(?=#{1,4}[^#])/;
						//	headingMajor = /^(\s*)(##[^#]*?)\s+(.*)/m;
							headingMajor = /^(\s*)(#[^#]*?)\s+(.*)/m;
							headingMinor = /^(\s*)(#{2,4}[^#]*?)\s+(.*)/m;
							headingMiniscule = /^(\s*)(####[^#]*?)\s+(.*)/m;
						}

		//	Document Info Footer
			elements.indexHeading.innerHTML = data.title &&  data.title!=data.fileName ? `${data.title}<span>${data.fileName}</span>` : data.fileName;
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
			let items;
			if(data.language == 'markdown') {
				let text = data.text.replaceAll(/\r?\n/g, '\n')
				text = text.replaceAll(/(\n)([ \t]*)```(.*?)\n([\s\S]*?)\n(\2*)```/g, (match, p1, p2, p3) => {
					match = match.replace(/\n/g, '¶');
					return match;
				});
				items = text.split(headingsRE);
			}
			else items = data.text.split(headingsRE);

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
									if(userData.state.data['index-open-all']) previous.classList.add('open');
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
					li.next = li.previous = undefined;
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
					value = value.replaceAll(/¶/g, '\n');
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

		//	elements.previousButton.onclick = elements.nextButton.onclick = null;
		//	let p, n;
		//	if(p = event.currentTarget.previous) elements.previousButton.onclick = event => {
		//			p.click();
		//		};
		//	if(n = event.currentTarget.next) elements.nextButton.onclick = event=> {
		//			n.click();
		//		};

			var doHighlight = elements.formControl.elements['show-highlight'].checked ? event.altKey : !event.altKey;
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
			elements.footerFile.title = elements.footerFile.innerHTML = `${data.filePath}/${data.fileName}`;
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

				//	var innerHTML=marked.parse(item,{baseUrl: `${data.filePath}/${data.fileName}`, renderer});
					var innerHTML = marked.parse(item);

					innerHTML = innerHTML.replace(/<img(.*?)src="(.*?)"(.*?)>/g, (match, p1, p2, p3, offset, string) => {
						if (p2.match(/^https?:\/\//) || p2.startsWith('/') || p2.match(/^[A-Z]:\//))
							return `<img${p1}src="${p2}"${p3}>`;
						else {
							if(data.zip) {
								return `<img${p1}src="${zipFiles[data.zip].directory[`${zipFiles[data.zip].root}/${p2}`].blobURL}"${p3}>`;
							}
							else return `<img${p1}src="${currentTab.data.filePath}/${p2.replace(/^\//,'')}"${p3}>`;
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

					var h2 = div.querySelector('h1, h2, h3, h4');
					div.id = h2.id;
					h2.id = '';
					div.className=h2.className;
					div.classList.add(h2.tagName.toLowerCase());
					h2.removeAttribute('id');
					h2.removeAttribute('class');
					elements.mdElement.innerHTML = div.outerHTML;
					elements.iframeBody.classList.add('markdown');

					//	var open=null;
					elements.iframeBody.querySelectorAll('li').forEach(li => {
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

			document.title = `${data.docTitle}${data.docTitle!=data.fileName ? ` | ${data.fileName}` : ''} - ${title}`;
			document.title = `${data.title}${data.title!=data.fileName ? ` | ${data.fileName}` : ''} - ${title}`;
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
		if(!uri) return undefined;
		uri = fixPath(path.normalize(uri));
		var filePath, fileName, extension, css;

		filePath = uri.split('/');
		fileName = filePath.pop();
		filePath = filePath.join('/');
		extension = fileName.split('.').pop();

		css = '';
		if(extensions[extension] == 'markdown') css = `${filePath}/${fileName.replace(/\..*$/,'')}.css`;

		return { filePath, fileName, extension, css};
	}

	function openFile(fileName, {remember=false, title}) {
		fileName = fixPath(fileName);
		var {index, tab} = getTab(fileName);
		if(index > -1) {		//	already open
			tab.click();
			return;
		}

		var result = null;
		if(fileName.match(/^https?:\/\//)) result = openURL(fileName, remember);
		else result = openPath(fileName, {remember, title});
		return result;

		function virtualDocument(pathName) {
			var { filePath, fileName, extension, css } = pathDetails(pathName);
			fsp.stat(pathName)
			.then(() => fps.readFile(`${filePath}/${fileName}`, 'utf-8'))
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
					addDocument(data, {language: extensions['md'], fileName, filePath, css: '', extension: 'md'});
				});
			});
		}

		async function zipDocument(pathName, title) {
			let { filePath, fileName, extension, css } = pathDetails(pathName);
			//	let zip, directory, data, root;
			zipFiles[pathName] = await openZip(pathName);
			let { zip, directory, root } = zipFiles[pathName];
			if(!directory[`${root}/${root}.md`]) {
dbug('zip does not include md file');
				return;
			}
			let data = await directory[`${root}/${root}.md`].file.buffer();
			data = data.toString();
			css = await directory[`${root}/${root}.css`].blobURL;
			addDocument(data, {language: extensions['md'], fileName, filePath, css, extension: 'md', zip: pathName, title});

			updateDocuments();

			if(!remember) return;
			updateFiles({'action': 'add-current', pathName, title});
			updateFiles({'action': 'add-recent', pathName, title});
		}

		function openPath(pathName, {remember=false, title}) {
			let { filePath, fileName, extension, css } = pathDetails(pathName);
			if(extension == 'dpf') return virtualDocument(pathName);

			if(['zip', 'mdzip'].includes(extension)) return zipDocument(pathName, title);
			if(extension in extensions === false) {
dbug(`invalid path extension: ${extension}`)
				return;
			};

			title = title ?? fileName;
			return fsp.stat(pathName)
			.then(() => {
				return fsp.stat(css)
				.catch(() => { css = ''; })
				.then(() => fsp.readFile(`${filePath}/${fileName}`, 'utf-8'))
				.then(data => {
					addDocument(data, {language: extensions[extension], fileName, filePath, css, extension, title});
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
					.then(() => {
						console.log(`Error: The File ${pathName} appears to have disappeared.`);
						//	Remove from Current & Recent
							userData.files.data.current = userData.files.data.current.filter(value => value != pathName);
							userData.files.data.recent = userData.files.data.recent.filter(value => value != pathName);
							userData.files.write();
					});
			});
		}

		function openURL(url,remember=false) {
			var data;
			var promise, cancelled=false;

			var { filePath, fileName, extension, css } = pathDetails(url);
			if(extension in extensions === false) {
dbug(`invalid url extension: ${extension}`)
				return;
			};

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
					cancelled = true;
					userData.files.data.current = userData.files.data.current.filter(value=>value!=url);
					fsp.writeFile(userData.files.path, JSON.stringify(userData.files.data, null, '\t'));
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
				addDocument(data, {language: extensions[extension], fileName, filePath, css, extension});
			})
			.then(()=>{
				if(cancelled || !remember) return;
				if(!userData.files.data.current.includes(url)) {
					userData.files.data.current.push(url);
					fsp.writeFile(userData.files.path, JSON.stringify(userData.files.data, null, '\t'));
				}
			});
			return promise;
		}
	}

	function save() {
		var file = `${currentTab.data.filePath}/${currentTab.data.fileName}`;
		if(!file) return;
		var text = currentTab.data.text.trim()+'\n';
		if(platform == 'win32') text = text.split(/\r?\n/).join('\r\n');
		elements.mainContent.blur();
		fsp.writeFile(file, text)
		.then(() => console.log('ok'))
		.catch(error => console.log(error));
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

	ipcRenderer.on('CLOG', (event, data, more) => {
		dbug(data);
	});

	ipcRenderer.on('DOIT', (event, action, data, more) => {
//	dbug(action)
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

	ipcRenderer.on('open-file-paths', (event, result) => {
		if(result.canceled) return;
		var pd = pathDetails(result.filePaths[0]);
		localStorage.setItem('defaultPath',pd.path);
		userData.state.data['default-path'] = pd.path;
		userData.state.write();
		result.filePaths.forEach(f => {
			openFile(fixPath(f), {remember: true});
		});
		//	openFile(result.filePaths[0],true);
//	console.log(result);
	});

	ipcRenderer.on('LOADCSS', () => {
		refreshTab(true);
	});

	ipcRenderer.on('DROPPED', (event, data) => {	//	files dropped on startup
		pending.push(data);
	});
	ipcRenderer.on('DROP', (event, data) => {		//	files dropped after startup
		openFile(data, {remember: true});
	});

	ipcRenderer.on('MENU', (event, data, more) => {
//	console.log(data);
		switch(data) {
			case 'NEW':

				break;
			case 'OPEN':
					console.log(userData.state.data);
					console.log(userData.state.data['default-path']);
					ipcRenderer.send('open-file',{
						title: 'Title',
						//	defaultPath: localStorage.getItem('defaultPath')
						defaultPath: userData.state.data['default-path'],
						properties: ['openFile', 'multiSelections']
					});
					ipcRenderer.on('open-file-paths?',(event,result)=>{
						if(result.canceled) return;
						var pd = pathDetails(result.filePaths[0]);
						localStorage.setItem('defaultPath',pd.path);
						userData.state.data['default-path'] = pd.path;
						userData.state.write();
						result.filePaths.forEach(f=>{
							openFile(f, {remember: true});
						});
console.log(result);
					});

				break;
			case 'URL':
				var url = ipcRenderer.sendSync('prompt',{
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
//			case 'LOADCSS':
//				refreshTab(true);
//				break;
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
				updateFiles({'action':'add-favourite','pathName':`${currentTab.data.filePath}/${currentTab.data.fileName}`, 'title':currentTab.data.title});
				break;
			case 'UNFAVOURITE':
				updateFiles({'action':'remove-favourite','pathName':`${currentTab.data.filePath}/${currentTab.data.fileName}`});
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
