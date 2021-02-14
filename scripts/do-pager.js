/*	Pager
	================================================
	================================================ */

	'use strict';
	window.onerror=function(message,url,line) {
		alert('Error: '+message+'\n'+url+': '+line);
	};
	document.addEventListener('DOMContentLoaded',init,false);
	function init() {
		var xhr=new XMLHttpRequest();
		xhr.overrideMimeType("text/plain");	//	otherwise assumed to be XML, causing a reported error
		xhr.onload=function() {
//			pager(JSON.parse(this.responseText));
		};
		xhr.onerror=function() { };
		xhr.open('get','settings.json',true);	//	true=async
		xhr.send(null);

		function get(url) {
			return new Promise((resolve, reject) => {
				var xhr = new XMLHttpRequest();
				xhr.overrideMimeType("text/plain");	//	otherwise assumed to be XML, causing a reported error
				xhr.open('GET', url);
				xhr.onload = () => resolve(xhr.response);
				xhr.onerror = () => reject(xhr.statusText);
				xhr.send();
			});
		}
		//	Load Element
			function loadContent2(element,url) {
				var xhr=new XMLHttpRequest();
				xhr.overrideMimeType("text/plain");	//	otherwise assumed to be XML, causing a reported error
				xhr.onload=function() {
					element.innerHTML=this.responseText;
				};
				xhr.onerror=function() { };
				xhr.open('get',url,true);	//	true=async
				xhr.send(null);
			}
			function loadContent(element,url) {
				var xhr=new XMLHttpRequest();
				xhr.overrideMimeType("text/plain");	//	otherwise assumed to be XML, causing a reported error
				xhr.onload=function() {
					element.innerHTML=this.responseText;
				};
				xhr.onerror=function() { };
				xhr.open('get',url,true);	//	true=async
				xhr.send(null);
			}

		//	Load Elements

//			var elements=document.querySelectorAll('[data-load]');
//			if(elements) elements.forEach(element=>loadContent(element,element.getAttribute('data-load')));

			var elements=document.querySelectorAll('[data-load]');
			var promise=Promise.resolve();
			if(elements) elements.forEach(element=>promise=promise.then(()=>get(element.dataset.load)).then(data=>element.innerHTML=data));
			promise.then(()=>get('settings.json')).then(data=>pager(JSON.parse(data)));
	}


	function pager(settings) {
		//	Constants
			var documentTitle=settings.headings.title+' '+settings.version;
		//	Elements
			//	Header
				var h1=document.querySelector('h1');
				var formControl=document.querySelector('form#control');
			//	Main
				var tabPane=document.querySelector('ul#tabs');
				var pager=document.querySelector('div#pager');
			//	Index
				var indexDiv=document.querySelector('div#index');
				var indexHeading=document.querySelector('div#index>h2');
				var indexUL=document.querySelector('div#index>ul');
			//	Content
				var contentDiv=document.querySelector('div#content');
				var contentHeading=document.querySelector('div#content>h2');
				var divContentPre=document.querySelector('div#content>pre');
				var codeElement=document.querySelector('div#content>pre>code');
				var highlightButton=document.querySelector('button#highlight');
				var smallerButton=document.querySelector('button#smaller');
				var defaultButton=document.querySelector('button#default');
				var largerButton=document.querySelector('button#larger');
				var previousButton=document.querySelector('button#previous');
				var nextButton=document.querySelector('button#next');
			//	Footer
				var footerLanguage=document.querySelector('span#footer-language');
				var footerHeading=document.querySelector('span#footer-heading');

		//	Arrow Keys
			document.onkeydown=function(event) {
				switch(event.key) {
					case 'ArrowUp':
					case 'Up':
						previous.click();
						break;
					case 'ArrowDown':
					case 'Down':
						next.click();
						break;
				}
			}

		//	About
			var about=document.querySelector('aside#about');
			var background=document.createElement('div');
				background.id='about-background';
				document.body.appendChild(background);
			jx.draggable(about);

		//	Document Tabs
			var currentTab;
			var currentItem;
			var tabs=[];

		//	Add Document
			function addDocument(text,language,fileName) {
				var tab=document.createElement('li');
					tab.textContent=fileName;
					tab.data={text: text, language: language, fileName: fileName, item: 0, highlighted: 1 };;
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
					tabPane.appendChild(tab);

				//	Activate
					tab.click();

				function doTab(event) {
					if(currentTab!==undefined) currentTab.classList.remove('selected');
					currentTab=this;
					doPager(this.data)
					currentTab.classList.add('selected');
				}
				function closeTab(event) {
					var sibling=this.previousElementSibling||this.nextElementSibling||undefined;
					tabPane.removeChild(this);
					currentTab=undefined;
					if(sibling) sibling.click();
					else {
						indexUL.innerHTML='';
						codeElement.innerHTML='';
						document.title=documentTitle;
						h1.innerHTML=settings.headings.h1+' '+settings.version;
						contentHeading.innerHTML=settings.headings.content;
						indexHeading.innerHTML=settings.headings.index;

						contentDiv.classList.add('empty');
					}
					event.stopPropagation();
				}
				function refreshTab(event) {

				}
			}

		//	Raw Button
			highlightButton.doHighlight=formControl.elements['show-highlight'].checked;
			function setHighlightButton() {
//				highlightButton.classList.toggle('highlight',currentTab.data.highlighted)
//				highlightButton.innerHTML=currentTab.data.highlighted?'Highlight':'Raw';
				highlightButton.classList.toggle('highlight',!highlightButton.doHighlight)
				highlightButton.innerHTML=!highlightButton.doHighlight?'Highlight':'Raw';
			}
			highlightButton.onclick=function(event) {
				var e = new Event('click');
				e.altKey = !highlightButton.doHighlight == !formControl.elements['show-highlight'].checked;
				currentTab.data.li.dispatchEvent(e);
			}

		//	Control Form
			//	About
				formControl.elements['about'].onclick=function showAbout() {
					about.style.display=background.style.display='block';
				};
				background.onclick=function hide() {
					about.style.display=background.style.display='none';
				};
			//	Upload
				formControl.elements['upload'].addEventListener('change',function(event) {
					upload(this.files,addDocument);
				});
				function upload(files,addDocument) {
					var reader=new FileReader();
					var fileName=files[0].name;

					var language=fileName.split('.').pop();

					reader.onload=function(event) {
						addDocument(event.target.result,language,fileName,reader);
					};
					reader.readAsText(files[0])
				}
			//	Show Highlight
				formControl.elements['show-highlight'].onchange=syntaxHighlight;
				function syntaxHighlight(event) {
					document.querySelector('p#raw-message').innerHTML=
						formControl.elements['show-highlight'].checked?
							'<span class="key">option / alt</span> for Raw Data':
							'<span class="key">option / alt</span> for Highlighted Data';
					document.querySelector('label[for="control-show-highlight"]').innerHTML=formControl.elements['show-highlight'].checked?'Highlighted':'Raw';
					highlightButton.innerHTML=formControl.elements['show-highlight'].checked?'Raw':'Highlighted';
					highlightButton.doHighlight=!formControl.elements['show-highlight'].checked;
					if(currentItem) currentItem.click();
				}
				syntaxHighlight();

		//	Drag & Drop
			var dropzone=document.querySelector('label[for="upload-file"]');
				dropzone.addEventListener('dragenter', dragenter, false);
				dropzone.addEventListener('dragover', dragover, false);
				dropzone.addEventListener('drop', drop, false);

			function dragenter(e) {
			  e.stopPropagation();
			  e.preventDefault();
			}
			function dragover(e) {
			  e.stopPropagation();
			  e.preventDefault();
			}

			function drop(e) {
			  e.stopPropagation();
			  e.preventDefault();
			  upload(e.dataTransfer.files,addDocument);
			}

//		formControl.elements['upload'].click();

		//	UI

			jx.stretch(indexDiv,20,0);

			var codeFontSize=parseInt(getComputedStyle(divContentPre,null).getPropertyValue('--font-size').trim());
			var fontSize=codeFontSize;
			smallerButton.onclick=function(event) {
				fontSize/=1.25;
				divContentPre.style.setProperty('--font-size',fontSize+'em');
			};
			defaultButton.onclick=function(event) {
				fontSize=codeFontSize;
				divContentPre.style.setProperty('--font-size','');
			};
			largerButton.onclick=function(event) {
				fontSize*=1.25;
				divContentPre.style.setProperty('--font-size',fontSize+'em');
			};

		//	Additional Prism Langage Aliases

			Prism.languages.js=Prism.languages.javascript;
			Prism.languages.md=Prism.languages.markdown;

		//	Process Query String
			var qs=window.location.search.substr(1);
			if(qs) {
				var query={};
				qs.split('&').forEach(function(value) {
					var q=value.split('=');
					query[q[0]]=q[1]===undefined?true:q[1];
				});
				if(query.file) doAjax(query,addDocument);
			}

		//	Preload
//			doAjax({file: 'about.txt'},addDocument);
			doAjax({file: 'about.md'},addDocument);
//			doAjax({file: 'exercises.sql'},addDocument);
//			doAjax({file: 'mssql-techniques.sql'},addDocument);

		//	Pager
			function doPager(data) {
				//	Adjust Environment
					indexHeading.innerHTML=data.fileName;

				//	Variables
					var selected=null;
					var headingsRE, headingRE;

				//	Heading Regular Expressions(Hard Code for Now):
					var breaks=settings.breaks[data.language]||settings.breaks['*']||'##';
					footerHeading.innerHTML=breaks;
					var special=/[-\/\\^$*+?.()|[\]{}]/g;
					var special=/[-\/\\^$*+.()|[\]{}]/g;
					breaks=breaks.replace(special,'\\$&');
					headingsRE=new RegExp('(?:\\n)(?='+breaks+')');
					headingRE=new RegExp(breaks+'\\s*(.*?)\\r?\\n');

				//	Populate Index
					var items=data.text.split(headingsRE);
					indexUL.innerHTML='';
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
							indexUL.appendChild(li);
							if(i==data.item) selected=li;
						});
						selected.click();
					}
					else showItem(data.text,data.fileName,true);

				//	Not Empty
					contentDiv.classList.remove('empty');

				//	Load Content
					function loadItem(data,item,title,i,event) {
						previousButton.onclick=nextButton.onclick=null;
						var p=this.previous;
						if(p) {
							previousButton.onclick=function(event) { p.click(); };
						}
						var n=this.next;
						if(n) {
							nextButton.onclick=function(event) { n.click(); };
						}

						var doHighlight=formControl.elements['show-highlight'].checked?!event.altKey:event.altKey;
						currentItem=data.li=this;
						highlightButton.doHighlight=doHighlight;
						setHighlightButton();
						if(selected) selected.classList.remove('selected');
						selected=this;
						selected.classList.add('selected');
						data.item=i;
						showItem(item,title,doHighlight);
					}
					function showItem(item,title,doHighlight) {
						footerLanguage.innerHTML=data.language;
						codeElement.classList.remove('markdown');
						var language=['js','javascript','sql','php'].indexOf(data.language)>-1;
						codeElement.innerHTML=item;
						if(language && doHighlight) codeElement.innerHTML=Prism.highlight(item, Prism.languages[data.language], data.language);
						else if(data.language=='md' && doHighlight) {
							codeElement.innerHTML=marked(item);
							codeElement.classList.add('markdown');
						}
						document.title=documentTitle+': '+data.fileName+' — '+title;
						h1.innerHTML=documentTitle+': '+data.fileName+' — '+title;
						contentHeading.innerHTML=title;
					}
			}

			function doAjax(query,callback) {
				//	Language
					if(!query.language) query.language=query.file.split('.').pop();
				//	Variables
					var xhr=new XMLHttpRequest();

				//	Generate Links
					xhr.open('get','https://pager.internotes.net/content/'+query.file,true);	//	true=async
					xhr.overrideMimeType("text/plain");	//	otherwise assumed to be XML, causing a reported error
					xhr.onload=function() {
						callback(this.responseText,query.language,query.file);
					};
					xhr.onerror=function() { }
					xhr.send(null);
			}
	}
