/*	scripts.internotes.net
	================================================
	Mark Simon
	================================================ */

	'use strict';

/*	JavaScript Utility Functions
	================================================
	A mixed collection of useful funcions,
	wrapped inside a jx object.

	jx.transition=function(element,properties,values,callback);
	jx.toggleTransition=function(element,properties,values,callback);
	jx.draggable=function(element,only);
	jx.say=function(message[,id[,cssText]]);
	jx.centreElement=function(element,hide);
	jx.parseOptions=function(data,defaults);
	jx.animate=function(container,defaults);
	jx.allowTab=function(element,spaces);

	String.prototype.sprintf();

	================================================ */

	var jx={};

/*	CSS Transition
	================================================ */

	jx.transition=function(element,properties,values,callback) {
		properties=properties.split(/\s+/);
		var	property=properties[0],
			duration=properties[1]===undefined?'1000ms':properties[1],
			easing=properties[2],
			delay=properties[3];
		values=values.split(/\s*-\s*/);
		if(!values[1]) values.unshift('');
		var	start=values[0]||window.getComputedStyle(element)[property],
			end=values[1];

		element.style.transition='none';
		element.style[property]=start;
		element.offsetHeight;
		element.style.transition=property+' '+duration;
		element.style[property]=end;
		if(callback) element.ontransitionend=callback.bind(element);
	};

/*	Toggle CSS Transition
	================================================ */

	jx.toggleTransition=function(element,properties,values,callback) {
		properties=properties.split(/\s+/);
		var	property=properties[0],
			duration=properties[1]===undefined?'1000ms':properties[1],
			easing=properties[2],
			delay=properties[3];
		values=values.split(/\s*-\s*/);
		if(!values[1]) values.unshift('');
		var	start=values[0]||window.getComputedStyle(element)[property],
			end=values[1];

		if(!element.data) element.data={
			property:property,
			endValue:end,
			startValue:start,
			duration: duration,
			state: false
		};
		element.style.transition='none';
		element.style[property]=element.data.state?element.data.endValue:element.data.startValue;
		element.offsetHeight;
		element.style.transition=property+' '+duration;
		element.style[property]=element.data.state?element.data.startValue:element.data.endValue;
		element.data.state=!element.data.state;
		if(callback) element.ontransitionend=callback.bind(element);
	};

/*	Draggable
	================================================ */

	jx.draggable=function(element,only,handles) {
		if(!jx.draggable.elements) jx.draggable.elements=[];
		jx.draggable.elements.push(element);

		var cursor, opacity;

		if(window.getComputedStyle(element).position!='absolute')
			element.style.position='fixed';
		if(handles) handles.forEach(function(handle) {
			handle.addEventListener('mousedown',drag);
		});
		else element.addEventListener('mousedown',drag);
		function drag(event) {
			if(only && this!=event.target) return;
			event.preventDefault();
			var handle=this;
			handle.addEventListener('mouseleave',release);

			if(jx.draggable.elements.length>1) {
				var current=jx.draggable.elements.indexOf(this);
				Array.prototype.push.apply(jx.draggable.elements,jx.draggable.elements.splice(current,1));
				for(var i=0;i<jx.draggable.elements.length;i++) jx.draggable.elements[i].style.zIndex=i;
			}

			var container=element.getBoundingClientRect();
			//	Undo CSS centring
				this.style.margin=0;
				this.style.left=container.left+'px';
				this.style.top=container.top+'px';

			var start={x: event.clientX, y: event.clientY};
			document.addEventListener('mousemove',move);
			document.addEventListener('mouseup',release);
			cursor=window.getComputedStyle(element).cursor;
			opacity=window.getComputedStyle(element).opacity;
			element.style.cursor='move';
			element.style.opacity=opacity/2;
			element.style.opacity=0.5;
//			jx.transition(element,'opacity 200ms',opacity+'-'+opacity/2,2000);
			function move(event) {
				element.style.left=event.clientX-start.x+container.left+'px';
				element.style.top=event.clientY-start.y+container.top+'px';
			}
			function release(event) {
				document.removeEventListener('mousemove',move);
				document.removeEventListener('mouseup',release);
				handle.removeEventListener('mouseleave',release);
				element.style.cursor=cursor;
				element.style.opacity=opacity;
				element.style.opacity=1;
//				jx.transition(element,'opacity 200ms',opacity/2+'-'+opacity);
			}

		}
	};

/*	Say
	================================================ */

	jx.say=function(message,id,cssText) {
		var div=document.createElement('div');
		if(id) div.setAttribute('id',id);
		if(cssText===undefined)
			div.style.cssText='width: 200px; height: 200px; overflow: auto; position: fixed; right: 20px; top: 20px; white-space: pre-wrap; border: thin solid #666; box-shadow: 4px 4px 4px #666; padding: .5em; font-family: monospace;';
		jx.draggable(div);
		document.body.appendChild(div);
		jx.say=function(message) {
			div.textContent+=message+'\n';
		};
		jx.say(message);
	};


	jx.centreElement=function(element,hide) {
		element.style.position='fixed';	//	 Just in case
		element.style.display='block';

		element.style.left =
			(window.innerWidth - element.offsetWidth)/2 + 'px';
		element.style.top =
			(window.innerHeight - element.offsetHeight)/2 + 'px';

		if(hide) element.style.display='none';
	};

/*	Parse Query String
	================================================
	================================================ */

	jx.parseQueryString=function(string) {
    	if(!string) return {};
    	var data={};
    	string=string.split(/&|;| /);
    	string.forEach(function(value) {
    		value=value.split('=');
    		if(value[1]===undefined) value[1]=true;
    		data[value[0]]=value[1];
		});
		return data;
	};

/*	Parse Options
	================================================
	================================================ */

	jx.parseOptions=function(data,defaults) {
		if(!data) return {};
		data=(data).split(/[,;]\s*/);
		var i=data.length;

		var options=JSON.parse(JSON.stringify(defaults||{}));
		while(i--) {
			var option=data[i].split(/[=:]\s*/);
			if(option[1]===undefined) option[1]=true;
			options[option[0]]=option[1];
		}
		return options;
	};


/*	Animate Strip
	================================================
	================================================ */

	jx.animate=function(container,defaults) {
		defaults=defaults||{"orientation": "horizontal", "frames": 1, "speed": 10, "start": false, "click": true };
		var running, options, doit, counter=0, position;

		options=jx.parseOptions(container.getAttribute('data-options'),defaults);
		options.delay=1000/options.speed;
		var img=container.querySelector('img');

		img.onload=function() {
			var width=img.width;
			var height=img.height;

			if(options.orientation=='vertical') {
				height/=options.frames;
				doit=function() {
					img.style.marginTop=-1*height*(counter++%options.frames)+'px';
				};
			}
			else {
				width/=options.frames;
				doit=function() {
					img.style.marginLeft=-1*width*(counter++%options.frames)+'px';
				};
			}

			container.style.width=width+'px';
			container.style.height=height+'px';
			container.style.overflow='hidden';

//					if(options.click) container.addEventListener('click',run);
			if(options.click) {
				container.addEventListener('mousedown',function(event) {
					position={x: event.clientX, y: event.clientY };
				});
				container.addEventListener('mouseup',function(event) {
					if(Math.abs(position.x-event.clientX)<4 && Math.abs(position.y-event.clientY)<4) run();
				});
			}

			if(options.start) run();
		};
		function run () {
			if(running) running=window.clearInterval(running);
			else running=window.setInterval(doit,options.delay);
		}
		return container;
	};

	jx.cssAnimate=function(container) {
		//	https://stackoverflow.com/a/43904152/1413856
		var style=document.createElement('style');
		document.head.appendChild(style);
		var cssAnimate=function(container) {
			var img=container.querySelector('img');
			var keyFrames='@keyframes run { from	{ margin-left: 0; } to		{ margin-left: -2456px; } }';
			img.style.animation='run 1s steps(8) infinite';
			style.sheet.insertRule(keyFrames,style.sheet.length);
			return style.sheet.length;
		};
		cssAnimate(container);
	};

/*	Allow Tab in Text Area
	================================================
	jx.allowTab(element[,spaces]);

	element	DOM Element
	[spaces]	Optional Number of spaces to substitute;
				Otherwise it will be a true tab
	================================================ */
	jx.allowTab=function(element,spaces) {
		element.addEventListener('keydown',handleTab);
		function handleTab(event) {
			if(event.keyCode==9) {
				var tab='\t', len=1;
				var start=this.selectionStart;
				if(spaces) {
					var rowStart=start==0?0:this.value.lastIndexOf('\n',start-1)+1;
					len=spaces-(start-rowStart)%spaces;
					tab=' '.repeat(len);
				}
				this.value=this.value.substring(0,start)+tab+this.value.substring(this.selectionEnd);
				this.setSelectionRange(start+len,start+len);
				event.preventDefault();	//	done
			}
		}
	};

/*	Allow Stretching
	================================================
	see: https://jsfiddle.net/internotes/b2qfy3ec/88/
	jx.resize(span[,property]);
	================================================ */

	jx.resize=function(span,onmouseup) {
		var previous=span.previousElementSibling;
		var next=span.nextElementSibling;
		span.addEventListener('mousedown',stretch);
		function stretch(event) {
			//	var	width=parseInt(getComputedStyle(element).getPropertyValue(property));
			var	width=parseInt(getComputedStyle(previous).width);
			var x=event.clientX;
			document.addEventListener('mousemove',goHorizontal);
			document.addEventListener('mouseup',stop);
			function goHorizontal(event) {
				//	element.style.setProperty(property,width+event.clientX-x+'px');
				previous.style.width=width+event.clientX-x+'px';
				previous.style.pointerEvents=next.style.pointerEvents='none';
			}
			function stop(event) {
				document.removeEventListener('mousemove',goHorizontal);
				document.removeEventListener('mouseup',stop);
				previous.style.pointerEvents=next.style.pointerEvents='auto';
				if(onmouseup) onmouseup(parseInt(getComputedStyle(previous).width));
			}
		}
	};


	jx.stretch=function(element,edge) {
		edge.addEventListener('mousedown',stretch);
		function stretch(event) {
//			var box=element.getBoundingClientRect();
			var	width=parseInt(window.getComputedStyle(element).width);
			var x=event.clientX;
			document.addEventListener('mousemove',goHorizontal);
			document.addEventListener('mouseup',stop);

			// edge.addEventListener('mouseout',function(event) {
			// 	console.log('too far');
			// 	document.removeEventListener('mousemove',goHorizontal);
			// 	document.removeEventListener('mouseup',stop);
			// });

			function goHorizontal(event) {
//console.log(element.offsetWidth)
				element.style.width=width+event.clientX-x+'px';
			}
			function stop(event) {
				document.removeEventListener('mousemove',goHorizontal);
				document.removeEventListener('mouseup',stop);
			}
		}
		return;

		element.addEventListener('mousedown',start);

		function start(event) {
			var box=element.getBoundingClientRect();
			var	height=parseInt(window.getComputedStyle(element).height);
			var	width=parseInt(window.getComputedStyle(element).width);
			var go=undefined;
			var y=event.clientY;
			var x=event.clientX;
			if(box.bottom-y<=bottom) go=goVertical;
			else if(box.right-x<=right) go=goHorizontal;
			if(go) {
				document.addEventListener('mousemove',go);
				document.addEventListener('mouseup',stop);
			}
			function goVertical(event) {
				element.style.height=height+event.clientY-y+'px';
			}
			function goHorizontal(event) {
				element.style.width=width+event.clientX-x+'px';
			}
			function stop(event) {
				document.removeEventListener('mousemove',go);
				document.removeEventListener('mouseup',stop);
				go=undefined;
			}
		}
	};

/*	Allow Stretching
	================================================
	jx.findInTextarea(string,textarea);
	================================================ */

	jx.findInTextarea=function(string,textarea,start,caseSensitive) {
		if(!string || !textarea) return;
		if(start===undefined) start=0;
		var position = caseSensitive?textarea.value.indexOf(string,start):textarea.value.toLowerCase().indexOf(string.toLowerCase(),start);
		// var position=textarea.value.search(new RegExp(string,'i'),start);
		if(position>=0) {
			textarea.selectionEnd = textarea.selectionStart = position;
			textarea.blur();
			textarea.focus();
			textarea.selectionEnd = position+string.length;
		}
		return position;
	};

/*	Useful, but not part of the Package
	================================================
	var i=0, args=arguments;
	return this.replace(/%s/g,function() { return args[i++] });
	================================================ */

	String.prototype.sprintf=function() {
		if(!arguments.length) return this;
		var string=this, arg;

		if(typeof(arg=arguments[0])=='object') string=string.replace(/(\[(.*?)\])/g,function(a,b,c){
			return arg[c];
		});
		else for(var i=0;i<arguments.length;i++) string=string.replace(/%s/,arguments[i]);
		return string;
	};


	if(!String.prototype.jschars)
	String.prototype.jschars=function() {
		return this.trim().replace(/\r?\n|\t/g,function(value) {
			switch(value) {
				case '\r\n':
				case '\n':
					return '\\n';
				case '\t':
					return '\\t';
			}
		});
	};

	if(!String.prototype.normaliseBR)
	String.prototype.normaliseBR=function(br) {
		if(!br) br='\n';
		return this.replace(/\r?\n/g,br);
	};

/*	DOM
	================================================
	DOM Manipulation Functions
	================================================ */

	var DOM={
		//	Returns an element or true array of elements
			select: function(selector) {
				return document.querySelector(selector);
			},
			selectAll: function(selector,nodeList) {
				var nodes=document.querySelectorAll(selector);
				return nodeList ?  nodes : Array.prototype.slice.call(nodes);
			},

		//	Create an element or an array of elements
			element: function(html) {
				var div=document.createElement('div');
				div.innerHTML=html;
				return div.firstElementChild;
			},
			elements: function(html,nodeList) {
				var div=document.createElement('div');
				div.innerHTML=html;
				return nodeList ? div.childNodes : Array.prototype.slice.call(div.childNodes);
			},


		/*	Combined Version
			================================================
			insertBefore: function(newElement,element) {
				if(newElement instanceof Element) element.parentNode.insertBefore(newElement,element);
				else if(typeof newElement == 'string') element.insertAdjacentHTML('beforebegin', newElement);
			},
			================================================ */

		//	Add element to or around another
			prefix: function(newElement,element) {
				element.parentNode.insertBefore(newElement,element);
			},
			prepend: function(newElement,element) {
				element.insertBefore(newElement,element.childNodes[0]);
			},
			append: function(newElement,element) {
				element.appendChild(newElement);
			},
			affix: function(newElement,element) {
				element.parentNode.insertBefore(newElement, element.nextSibling);
			},

		//	Add html to or around another element
			prefixHTML: function(html,element) {
				element.insertAdjacentHTML('beforebegin', html);
			},
			prependHTML: function(html,element) {
				element.insertAdjacentHTML('afterbegin', html);
			},
			appendHTML: function(html,element) {
				element.insertAdjacentHTML('beforeend', html);
			},
			affixHTML: function(html,element) {
				element.insertAdjacentHTML('afterend', html);
			},

		//	Toggle Attribute

			toggleAttribute: function(element,attribute,value) {
				if(!element || !attribute) return;
				if(value===undefined) value=true;
				if(!element.hasAttribute(attribute)) element.setAttribute(attribute,value);
				else element.removeAttribute(attribute);
			},

			radio: function(elements,attribute,allOff) {
				var selected=null;
				for(var i=0;i<elements.length; i++) elements[i].onclick=doit;
				function doit() {
					if(this==selected) {
						if(allOff) selected=this.removeAttribute(attribute);
						return;
					}
					if(selected) selected.removeAttribute(attribute);
					selected=this;
					selected.setAttribute(attribute,true);
				}
			},

			checkbox: function(elements,attribute,anywhere) {
				for(var i=0;i<elements.length; i++) elements[i].onclick=anywhere?doitAnywhere:doit;
				function doit(event) {
					if(!this.hasAttribute(attribute)) {
						this.setAttribute(attribute,true);
					}
					else this.removeAttribute(attribute);
				}
				function doitAnywhere(event) {
					var selected=null;
					if(!this.hasAttribute(attribute)) {
						this.setAttribute(attribute,true);
						document.body.addEventListener('click',clickOff,false);
						selected=this;
						event.stopPropagation();
					}
					else this.removeAttribute(attribute);
					function clickOff() {
						selected.removeAttribute(attribute);
						selected=null;
						document.body.removeEventListener('click',clickOff);
					}
				}
			},

		//	Wrapping Content

			wrap: function(element,wrapper) {
				element.parentNode.insertBefore(wrapper, element);
				wrapper.appendChild(element);
				return wrapper;
			},

			wrapAll: function(elements, wrapper) {
				elements[0].parentNode.insertBefore(wrapper, elements[0]);
				for(var i=0;i<elements.length;i++) wrapper.appendChild(elements[i]);
				return wrapper;
			},
			unwrap: function(element,totally) {
				var parent=element.parentNode;
				parent.parentNode.insertBefore(element,parent);
				if(totally) parent.parentNode.removeChild(parent);
				return element;
			},

		//	Empty Element

			empty: function(element) {
				element.innerHTML='';
			},

		//	Scroll Position

			scrollPosition: function() {
				return {
					left: window.pageXOffset || document.documentElement.scrollLeft,
					top: window.pageYOffset || document.documentElement.scrollTop
				};
			},

		//	Bounding Rectangle

			boundingRect: function(element,documentRelative) {
				var rect=element.getBoundingClientRect();
				var pos=DOM.scrollPosition();
				var scrollLeft=documentRelative?pos.left:0;
				var scrollTop=documentRelative?pos.top:0;
				return {
					'x':			rect.left-scrollLeft,
					'y':			rect.top-scrollTop,
					'width':		rect.right-rect.left,
					'height':		rect.bottom-rect.top,
					'left':			rect.left-scrollLeft,
					'top':			rect.top-scrollTop,
					'right':		rect.right-scrollLeft,
					'bottom':		rect.bottom-scrollTop,
					'scrollLeft':	pos.left,
					'scrollTop':	pos.top,
				};
			},

		//	Ajax

			get: function(url,callback,query) {
				var xhr=new XMLHttpRequest();
				if(query) url+='?'+query.replace(/^\?/,'');
				xhr.open('get',url,true);
				xhr.onload=function() {
					if(callback) callback(this.responseText);
				};
				xhr.send(null);
			},
			loadHTML: function(element,url,query) {
				this.get(url,function(data) {
					element.innerHTML=data;
				},query);
			},
			loadText: function(element,url,query) {
				this.get(url,function(data) {
					element.textContent=data;
				},query);
			},

		//	Add Event Listeners

			listen: function(element,listener,fn,capture) {
				element.addEventListener(listener,fn,capture);
			},
			listenAll: function(elements,listener,fn,capture) {
				for(var i=0;i<elements.length; i++)
					elements[i].addEventListener(listener,fn,capture);
			},

		//	Get Siblings without white space nodes
		//	See https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM

			isIgnorable: function(element) {
				return element.nodeType==8 || element.nodeType==3 && !(/[^\t\n\r ]/.test(element.textContent));
			},

			previousSibling: function(element) {
				while (element = element.previousSibling)
					if(!this.isIgnorable(element)) return element;
				return null;
			},

			nextSibling: function(element) {
				while (element = element.nextSibling)
					if(!this.isIgnorable(element)) return element;
				return null;
			},

			lastChild: function(element) {
				var child=element.lastChild;
				while (child) {
					if (!this.isIgnorable(child)) return child;
					child = child.previousSibling;
				}
				return null;
			},

			firstChild: function(element) {
				var child=element.firstChild;
				while (child) {
					if (!this.isIgnorable(child)) return child;
					child = child.nextSibling;
				}
				return null;
			},

	};


	jx.popup=function(element,button,options) {
		if(!options) options={};
		options={
			backgroundStyle: options.backgroundStyle || 'background-color: black; opacity: .3; position: fixed; top: 0; left: 0; width: 100%; height: 100%;',
			backgroundId: options.backgroundId || 'background',
			escape: !!options.escape,
		};
		var background=document.createElement('div');
		background.style.cssText=options.backgroundStyle;
		background.id=options.backgroundId;
		background.onclick=hide;
		document.body.appendChild(background);

		if(button) {
			button=document.querySelector(button);
			button.onclick=show;
		}

		background.style.zIndex=1;
		element.style.zIndex=2;

		hide();
		function show() {
			element.style.display=background.style.display='block';
			// element.style.width=element.offsetWidth+'px';
			// element.style.height=element.offsetHeight+'px';
			// element.style.top=element.style.right=element.style.bottom=element.style.left=0;
			if(options.escape) document.addEventListener('keyup',escape,false);
		}
		function hide() {
			element.style.display=background.style.display='none';
			if(options.escape) document.removeEventListener('keyup',escape,false);
		}
		function escape(e) {
			if(e.keyCode==27) hide();
		}
		return show;
	};


	jx.addLineNumbers = function(element, highlight) {
		let lineNumbers = document.createElement('div');
		return jx.setLineNumbers(element, lineNumbers, highlight);
	};
	jx.setLineNumbers = function(element, lineNumbers, highlight) {
		let styles = ['line-height','font-family','padding-top','padding-bottom','font-size'];
		let computedStyles = window.getComputedStyle(element);
		styles.forEach(style => {
			lineNumbers.style[style] = computedStyles[style];
		});
		lineNumbers.classList.add('line-numbers');
		element.insertAdjacentElement('beforebegin',lineNumbers);

		element.resetLineNumbers = function(highlight) {
			let lines = element.textContent.split(/\r?\n/);
//			lineNumbers.textContent = Array.from({length: lines.length},(v,i) => i+1).join('\n');
//			lineNumbers.innerHTML = `<span>${Array.from({length: lines.length},(v,i) => i+1).join('</span><span>')}</span>`;

			let domFragment = document.createDocumentFragment();
			let regex = highlight ? RegExp(`^.*${highlight}$`) : undefined;

			lines.forEach((v,k) => {
				var span = document.createElement('span');
				span.textContent = k+1;
				if(regex && v.match(regex)) span.classList.add('highlight');
				domFragment.appendChild(span);
			});

			lineNumbers.replaceChildren();
			lineNumbers.appendChild(domFragment);

			let styles = ['line-height','font-family','padding-top','padding-bottom','font-size'];
			let computedStyles = window.getComputedStyle(element);
			styles.forEach(style => {
				lineNumbers.style[style] = computedStyles[style];
			});
		};
		return lineNumbers;
	};
	jx.contentEditable=(element,intercept)=>{
		element.contentEditable=true;
		if(!intercept) return;
		function handleKeys(event) {
			var keys=['Tab','Enter'];
			if(!keys.includes(event.key)) return true;
			switch(event.key) {
		        case 'Tab':
					element.ownerDocument.execCommand('insertText',false,'\t');
					return false;
		        case 'Enter':
					element.ownerDocument.execCommand('insertLineBreak',false,'\n');
					return false;
			}
		}
		element.onkeydown=handleKeys;
	};

	jx.Rearrangeable=function(direction='h',className='dragover') {
		var element;
		this.add=function(e) {
			e.draggable=true;

			e.addEventListener('dragstart',this.dragstart.bind(this),false);
			e.addEventListener('dragenter',this.dragenter.bind(this),false);
			e.addEventListener('dragover',this.dragover.bind(this),false);
			e.addEventListener('dragleave',this.dragleave.bind(this),false);
			e.addEventListener('drop',this.drop.bind(this),false);
			e.addEventListener('dragend',this.dragend.bind(this),false);
		};
		this.highlight=function(element,which) {
			if(which=='before') element.classList.add(`${className}-before`);
			else element.classList.remove(`${className}-before`);
			if(which=='after') element.classList.add(`${className}-after`);
			else element.classList.remove(`${className}-after`);
		};

		//	Element
			this.dragstart=function(event) {
				var target=event.currentTarget;
				this.element=target;
				event.dataTransfer.effectAllowed='move';
				//	event.dataTransfer.setData('text/html',this.outerHTML);
				target.classList.add(`${className}-start`);
			};
			this.drag=function(event) {
				var target=event.currentTarget;
			};
			this.dragend=function(event) {
				var target=event.currentTarget;
				this.highlight(target);
				target.classList.remove(`${className}-start`);
			};

		//	Target
			this.dragenter=function(event) {
				var target=event.currentTarget;
			};
			this.dragover=function(event) {
				var target=event.currentTarget;
				event.preventDefault();
				event.dataTransfer.dropEffect='move';
				if(direction=='v') {
					if(event.clientY<(target.getBoundingClientRect().top+target.getBoundingClientRect().bottom)/2) this.highlight(turrentTarget,'before');
					else this.highlight(target,'after');
				}
				else {
					if(event.clientX<(target.getBoundingClientRect().left+target.getBoundingClientRect().right)/2) this.highlight(target,'before');
					else this.highlight(target,'after');
				}
			};
			this.dragleave=function(event) {
				var target=event.currentTarget;
				this.highlight(target);
			};
			this.drop=function(event) {
				var target=event.currentTarget;
				event.stopPropagation();
				if(this.element!=target) {
					if(target.classList.contains(`${className}-before`)) {
						target.insertAdjacentElement('beforebegin',this.element);
					}
					else if(target.classList.contains(`${className}-after`)) {
						target.insertAdjacentElement('afterend',this.element);
					}
				}
				this.highlight(target);
			};
	};

	jx.rearrangeable=(elements,direction='h',className='dragover')=>{
		var element;
		elements.forEach(e=>{draggable(e);});
		function draggable(e) {
			e.draggable=true;

			e.addEventListener('dragstart',dragstart,false);
			e.addEventListener('dragenter',dragenter,false);
			e.addEventListener('dragover',dragover,false);
			e.addEventListener('dragleave',dragleave,false);
			e.addEventListener('drop',drop,false);
			e.addEventListener('dragend',dragend,false);
		}

		function highlight(element,which) {
			if(which=='before') element.classList.add(`${className}-before`);
			else element.classList.remove(`${className}-before`);
			if(which=='after') element.classList.add(`${className}-after`);
			else element.classList.remove(`${className}-after`);
		}

		//	Element
			function dragstart(event) {
				element=this;
				event.dataTransfer.effectAllowed='move';
				//	event.dataTransfer.setData('text/html',this.outerHTML);
				this.classList.add(`${className}-start`);
			}
			function drag(event) {

			}
			function dragend(event) {
				highlight(this);
				this.classList.remove(`${className}-start`);
			}

		//	Target
			function dragenter(event) {

			}
			function dragover(event) {
				event.preventDefault();
				event.dataTransfer.dropEffect='move';
				if(direction=='v') {
					if(event.clientY<(this.getBoundingClientRect().top+this.getBoundingClientRect().bottom)/2) highlight(this,'before');
					else highlight(this,'after');
				}
				else {
					if(event.clientX<(this.getBoundingClientRect().left+this.getBoundingClientRect().right)/2) highlight(this,'before');
					else highlight(this,'after');
				}
			}
			function dragleave(event) {
				highlight(this);
			}
			function drop(event) {
				event.stopPropagation();
				if(element!=this) {
					if(this.classList.contains(`${className}-before`)) {
						this.insertAdjacentElement('beforebegin',element);
					}
					else if(this.classList.contains(`${className}-after`)) {
						this.insertAdjacentElement('afterend',element);
					}
				}
				highlight(this);
			}
	};

	class JSONFile {
		constructor(file) {
			this.file = file;
		}
		init(file) {
			if(file) this.file = file;
			return fsp.stat(this.file)
			.catch(() => fsp.writeFile(this.file,'{}'))
	//		.then(() => fsp.writeFile(this.file,'{"Testingit": "one two"}'))
			.then(() => fsp.readFile(this.file))
			.then(json => {
				this.data = JSON.parse(json);
			});
		}
		clear() {
			this.data = {};
			return fsp.writeFile(this.file,'{}');
		}
		read() {
			fsp.readFile(this.file)
			.then(json => {
				this.data = JSON.parse(json);
			});
		}
		write(data, clear) {
			if(clear) this.data = data;
			else for(let k in data) this.data[k] = data[k];
	//		fsp.readFile(this.file)
			return fsp.writeFile(this.file,JSON.stringify(this.data));
		}
	}


//	Export
	module.exports = {jx, DOM, JSONFile};
