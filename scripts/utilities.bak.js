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
//alert(callback)
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

	jx.draggable=function(element,only) {
		if(!jx.draggable.elements) jx.draggable.elements=[];
		jx.draggable.elements.push(element);

		if(window.getComputedStyle(element).position!='absolute')
			element.style.position='fixed';
		element.addEventListener('mousedown',drag);
		function drag(event) {
			if(only && this!=event.target) return;
			event.preventDefault()

			element=this;

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
			var cursor=window.getComputedStyle(element).cursor;
			var opacity=window.getComputedStyle(element).opacity;
			element.style.cursor='move';
//			element.style.opacity=opacity/2;

//			jx.transition(element,'opacity 200ms',opacity+'-'+opacity/2,2000);
			jx.transition(element,'opacity 200ms',opacity+'-'+opacity/2);

			function move(event) {
				element.style.left=event.clientX-start.x+container.left+'px';
				element.style.top=event.clientY-start.y+container.top+'px';
			}
			function release(event) {
				document.removeEventListener('mousemove',move);
				document.removeEventListener('mouseup',release);
				element.style.cursor=cursor;
				element.style.opacity=opacity;

				jx.transition(element,'opacity 200ms',opacity/2+'-'+opacity);
			}
		}
	}

/*	Say
	================================================ */

	jx.say=function(message,id,cssText) {
		var div=document.createElement('div');
		if(id) div.setAttribute('id',id);
		if(cssText===undefined)
			div.style.cssText='width: 200px; height: 200px;\
				overflow: auto; position: fixed;\
				right: 20px; top: 20px; white-space: pre-wrap;\
				border: thin solid #666;\
				box-shadow: 4px 4px 4px #666;\
				padding: .5em; font-family: monospace;';
		jx.draggable(div);
		document.body.appendChild(div);
		jx.say=function(message) {
			div.textContent+=message+'\n';
		}
		jx.say(message);
	}


	jx.centreElement=function(element,hide) {
		element.style.position='fixed';	//	 Just in case
		element.style.display='block';

		element.style.left =
			(window.innerWidth - element.offsetWidth)/2 + 'px';
		element.style.top =
			(window.innerHeight - element.offsetHeight)/2 + 'px';

		if(hide) element.style.display='none';
	};

/*	Parse Options
	================================================
	================================================ */

	jx.parseOptions=function(data,defaults) {
		if(!data) return {};
		data=(data).split(/[,;]\s*/);
		var i=data.length;

		var options=JSON.parse(JSON.stringify(defaults||{}, null, '\t'));
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
		var running, options, doit, counter=0;

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
				}
			}
			else {
				width/=options.frames;
				doit=function() {
					img.style.marginLeft=-1*width*(counter++%options.frames)+'px';
				}
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
		}
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
		cssAnimate=function(container) {
			var img=container.querySelector('img');
			var keyFrames='@keyframes run { from	{ margin-left: 0; } to		{ margin-left: -2456px; } }';
			img.style.animation='run 1s steps(8) infinite';
			style.sheet.insertRule(keyFrames,style.sheet.length);
			return style.sheet.length;
		}
		cssAnimate(container);
	}

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
					tab=' '.repeat(len)
				}
				this.value=this.value.substring(0,start)+tab+this.value.substring(this.selectionEnd);
				this.setSelectionRange(start+len,start+len);
				event.preventDefault();	//	done
			}
		}
	};

/*	Allow Stretching
	================================================
	jx.allowTab(element[,spaces]);
	================================================ */

	jx.stretch=function(element,right,bottom) {
		element.addEventListener('mousedown',start);

		function start(event) {
			var box=element.getBoundingClientRect();
			var	height=parseInt(window.getComputedStyle(element).height);
			var	width=parseInt(window.getComputedStyle(element).width);
			var go=undefined;
			var y=event.clientY;
			var x=event.clientX;
			if(bottom && box.bottom-y<=bottom) go=goVertical;
			else if(right && box.right-x<=right) go=goHorizontal;
			if(go) {
				document.addEventListener('mousemove',go);
				document.addEventListener('mouseup',stop);
			}
			function goVertical(event) {
				element.style.height=height+event.clientY-y+'px';
				if(event.shiftKey) element.style.height='';
			}
			function goHorizontal(event) {
				element.style.width=width+event.clientX-x+'px';
				if(event.shiftKey) element.style.width='';
			}
			function stop(event) {
				document.removeEventListener('mousemove',go);
				document.removeEventListener('mouseup',stop);
				go=undefined;
			}
		}
	}


/*	Useful, but not part of the Package
	================================================
	var i=0, args=arguments;
	return this.replace(/%s/g,function() { return args[i++] });
	================================================ */

	String.prototype.sprintf=function() {
		var string=this;
		for(var i=0;i<arguments.length;i++) string=string.replace(/%s/,arguments[i]);
		return string;
	};
