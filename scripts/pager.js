/*	Document Pager
	================================================
	================================================ */
	'use strict';
//	window.onerror=function(message,url,line) {
//		alert('Error: '+message+'\n'+url+': '+line);
//	};

//	Development
	const {DEVELOPMENT}=require('../settings.js');

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

	// function openDialog() {
	// 	dialog.showOpenDialog({
	// 		title: tabs[tab].title,
	// 		defaultPath: tabs[tab].path
	// 	},function(filePaths){
	// 		tabs[tab].path=filePaths.toString();
	// 		load(tab);
	// 	});
	// }

//	Environment

	var platform=process.platform;
	var os=require('os');

/*	Pager
	================================================
	================================================ */

//	Globals
	var settings;
	var documentTitle;

//	Main
	main();


//			var elements=document.querySelectorAll('[data-load]');
//			var promise=Promise.resolve();
//			if(elements) elements.forEach(element=>promise=promise.then(()=>get(element.dataset.load)).then(data=>element.innerHTML=data));



	function main() {
		load(path.join(__dirname, '../settings.json'))
		.then(data=>settings=JSON.parse(data))
		.then(()=>documentTitle=settings.headings.title+' '+settings.version)
//		.then(()=>load({path: 'data/exercises.sql', language: 'sql'}))
		.then(()=>load('data/exercises.sql'))
//		.then(data=>console.log(data))
		.then((data)=>addDocument(data,'sql','exercises.sql'))
//.then(()=>console.log(JSON.stringify(settings)))
		;
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
			//	Content
				contentDiv: document.querySelector('div#content'),
				contentHeading: document.querySelector('div#content>h2'),
				divContentPre: document.querySelector('div#content>pre'),
				codeElement: document.querySelector('div#content>pre>code'),
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

//	Add Document
	function addDocument(text,language,fileName) {
		var tab=document.createElement('li');
			tab.textContent=fileName;
			tab.data={text: text, language: language, fileName: fileName, item: 0, highlighted: 1 };
			tab.onclick=doTab;
		var close=document.createElement('button');
			close.innerHTML='✖️';
			close.onclick=closeTab.bind(tab);
		var refresh=document.createElement('button');
			refresh.innerHTML='↻';
			refresh.onclick=refreshTab.bind(tab);
		//	Add to DOM
			tab.appendChild(close);
//					tab.insertAdjacentElement('afterbegin',refresh);
			elements.tabPane.appendChild(tab);

		//	Activate
			tab.click();

		function doTab(event) {
			if(currentTab!==undefined) currentTab.classList.remove('selected');
			currentTab=this;
			doPager(this.data);
			currentTab.classList.add('selected');
		}
		function closeTab(event) {
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
		function refreshTab(event) {

		}
	}

	function doPager(data) {
console.log(`function doPager(${data.fileName})`);
	//	Adjust Environment
		elements.indexHeading.innerHTML=data.fileName;

	//	Variables
		var selected=null;
		var headingsRE, headingRE;

	//	Heading Regular Expressions(Hard Code for Now):
		var breaks=settings.breaks[data.language]||settings.breaks['*']||'##';
		elements.footerHeading.innerHTML=`Breaks: ${breaks}`;
		var special=/[-\/\\^$*+?.()|[\]{}]/g;
		var special=/[-\/\\^$*+.()|[\]{}]/g;
		breaks=breaks.replace(special,'\\$&');
		headingsRE=new RegExp('(?:\\n)(?='+breaks+')');
		headingRE=new RegExp(breaks+'\\s*(.*?)\\r?\\n');
	//	Populate Index
		var items=data.text.split(headingsRE);
		elements.indexUL.innerHTML='';
		if(items.length>1) {
			var previous=undefined, selected=undefined;
			items.forEach(function(value,i) {
				var li=document.createElement('li');
				var RE=value.match(headingRE);
				var title=RE?value.match(headingRE)[1]:'';
				li.innerHTML=title;
				li.next=li.previous=undefined;
				if(previous) {
					previous.next=li;
					li.previous=previous;
				}
				previous=li;
				li.onclick=loadItem.bind(li,data,value,title,i);
				elements.indexUL.appendChild(li);
				if(i==data.item) selected=li;
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
		}
		function showItem(item,title,doHighlight) {
			elements.footerLanguage.innerHTML=`Language: ${data.language}`;
			elements.codeElement.classList.remove('markdown');
			var language=['js','javascript','sql','php'].indexOf(data.language)>-1;
			elements.codeElement.innerHTML=item;
			if(language && doHighlight) elements.codeElement.innerHTML=Prism.highlight(item, Prism.languages[data.language], data.language);
			else if(data.language=='md' && doHighlight) {
				elements.codeElement.innerHTML=marked(item);
				elements.codeElement.classList.add('markdown')
			}
			document.title=documentTitle+': '+data.fileName+' — '+title;
			elements.h1.innerHTML=documentTitle+': '+data.fileName+' — '+title;
			elements.contentHeading.innerHTML=title;
		}
		function setHighlightButton() {
			elements.highlightButton.classList.toggle('highlight',!elements.highlightButton.doHighlight);
			elements.highlightButton.innerHTML=!elements.highlightButton.doHighlight?'Highlight':'Raw';
		}
	}

//	IPC

	ipcRenderer.on('DOIT',(event,action,data,more)=>{
		switch(action) {
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
						defaultPath: '/nfs/html/internotes.net/pager/content'
					},
					function(path) {
						path=normalize(path[0]);
						var fileName=path.split('/').pop();
						var language=fileName.split('.').pop();
						load(path)
						.then(function(data) {
							addDocument(data,language,fileName);
					});
					}
				);	//	.then(data=>console.log(data))
				break;
			case 'LOAD':
				load(tab);
				break;
			case 'SAVE':
//				save();
				break;
			case 'SAVEAS':
//				saveAs();
				break;

			case 'FIND':
				find();
				break;
			case 'FINDAGAIN':
				findAgain();
				break;
			case 'ABOUT':
				doAbout('about');
				break;
			case 'INSTRUCTIONS':
				doAbout('instructions');
				break;
			case 'MISC':
				break;
		}
	});

//	alert('end');
