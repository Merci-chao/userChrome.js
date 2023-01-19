if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

function FloatToolbarsInFullScreen(window) {
	Object.assign(this, {
		window,
		transitionEndListener: null,
		mouseOverNavToolbox: false,
		originalFunctions: {},
	});
	
	this.bind();
}

FloatToolbarsInFullScreen.prototype = {
	bind() {
		let {window, originalFunctions} = this, {FullScreen, gNavToolbox, document} = window;
		let docElt = document.documentElement;
		let contentDeck = document.getElementById("appcontent");
		
		if (window.fullScreen)
			window.fullScreen = false;
			
		window[FloatToolbarsInFullScreen.SYMBOL] = this;
		
		["showNavToolbox", "hideNavToolbox", "toggle", "getMouseTargetRect",
				"_setPopupOpen", "setAutohide"].forEach(fn =>
				originalFunctions[fn] = FullScreen[fn]);
				
		let mouseEventHandler = {
			handleEvent: e => {
				if (e.target == e.currentTarget)
					switch(e.type) {
						case "mouseenter":
							this.mouseOverNavToolbox = true;
							break;
						case "mouseleave":
							this.mouseOverNavToolbox = false;
							break;
					}
			},
		};
		
		document.body.appendChild(document.createElement("style")).innerHTML = `
			#navigator-toolbox[data-float-in-fullscreen-ready] {
				z-index: 2147483647 !important;
				position: relative !important;
				background-image: var(--lwt-additional-images) !important;
				background-color: var(--lwt-accent-color, ActiveCaption);
				background-attachment: fixed;
			}
			
			#main-window[lwtheme-image] #navigator-toolbox[data-float-in-fullscreen-ready] {
				background-image: var(--lwt-header-image) !important;
			}
			
			#navigator-toolbox[data-float-in-fullscreen-ready]:-moz-window-inactive {
				background-color: var(--lwt-accent-color, InactiveCaption);
			}
			
			:root[sizemode="fullscreen"] :is(.titlebar-min, .titlebar-restore, .titlebar-close) {
				display: -moz-box !important;
			}
		`;
		
		FullScreen.toggle = () => {
			let {fullScreen} = window;
			if (fullScreen) {
				gNavToolbox.setAttribute("data-float-in-fullscreen-ready", true);
			} else {
				gNavToolbox.removeAttribute("data-float-in-fullscreen-ready");
				this.mouseOverNavToolbox = false;
			}
			["mouseenter", "mouseleave"].forEach(e =>
					gNavToolbox[fullScreen ? "addEventListener" : "removeEventListener"](e, mouseEventHandler, true));
			
			originalFunctions.toggle.call(FullScreen);
		};
		
		FullScreen.showNavToolbox = trackMouse => {
			let {fullScreen} = window;
			
			contentDeck.style.marginTop = fullScreen ? `-${gNavToolbox.getBoundingClientRect().height}px` : "";
			
			originalFunctions.showNavToolbox.call(FullScreen, trackMouse);
			
			Object.assign(contentDeck.style, {
				transitionDelay: "",
				transitionDuration: "",
				transitionProperty: "",
				transitionTimingFunction: "",
			});
			if (fullScreen)
				window.setTimeout(() => {
					if (!gNavToolbox.hasAttribute("fullscreenShouldAnimate"))
						contentDeck.style.marginTop =  `-${gNavToolbox.getBoundingClientRect().height}px`;
				});
			FullScreen.fullScreenToggler.style.display = "";
			gNavToolbox.style.pointerEvents = "";
			gNavToolbox.removeEventListener("transitionend", this.transitionEndListener, true);
		};
		
		FullScreen.getMouseTargetRect = () => {
			let rect = Object.assign({}, originalFunctions.getMouseTargetRect.call(FullScreen));
			rect.top += gNavToolbox.getBoundingClientRect().height;
			return rect;
		};
		
		FullScreen._setPopupOpen = aEvent => {
			if (aEvent.type == "popuphidden")
				window.setTimeout(() => {
					if (document.querySelector(":-moz-any(menu,button,toolbarbutton)[open]:not([hidden]), [panelopen]:not([hidden]), panel[animate=open]:not([hidden])"))
						return;
					FullScreen._isPopupOpen = false;
					if (!this.mouseOverNavToolbox)
						originalFunctions._setPopupOpen.call(FullScreen, aEvent);
				}, 50);
			else
				originalFunctions._setPopupOpen.call(FullScreen, aEvent);
		};
		
		FullScreen.hideNavToolbox = aAnimate => {
			if (this.mouseOverNavToolbox
					|| document.querySelector(":-moz-any(menu,button,toolbarbutton)[open]:not([hidden]), [panelopen]:not([hidden]), panel[animate=open]:not([hidden])"))
				return;
				
			if (contentDeck.style.marginTop)
				aAnimate = false;

			let toHide = !FullScreen._isChromeCollapsed;

			originalFunctions.hideNavToolbox.call(FullScreen, aAnimate);
			
			if (toHide)
				if (aAnimate) {
					let {
						transitionDelay,
						transitionDuration,
						transitionTimingFunction
					} = window.getComputedStyle(gNavToolbox);
					
					Object.assign(contentDeck.style, {
						transitionDelay,
						transitionDuration,
						transitionProperty: "margin-top",
						transitionTimingFunction,
						marginTop: "",
					});
					
					gNavToolbox.style.pointerEvents = "none";
					FullScreen.fullScreenToggler.style.display = "none";
					
					this.transitionEndListener = e => {
						if (e.target != e.currentTarget)
							return;
						
						gNavToolbox.removeEventListener("transitionend", this.transitionEndListener, true);
						
						Object.assign(contentDeck.style, {
							transitionDelay: "",
							transitionDuration: "",
							transitionProperty: "",
							transitionTimingFunction: "",
						});
						gNavToolbox.style.pointerEvents = "";
						FullScreen.fullScreenToggler.style.display = "";
					};
					gNavToolbox.addEventListener("transitionend", this.transitionEndListener, true);
				} else if (FullScreen.navToolboxHidden) {
					Object.assign(contentDeck.style, {
						transitionDuration: "",
						marginTop: "",
					});
				}
		};
		
		FullScreen.setAutohide = () => {
			if (Services.prefs.getBoolPref("browser.fullscreen.autohide"))
				contentDeck.style.marginTop = "";
			originalFunctions.setAutohide.call(FullScreen);
		};
	},
};

FloatToolbarsInFullScreen.SYMBOL = Symbol("FloatToolbarsInFullScreen");

new FloatToolbarsInFullScreen(window);


})()} catch(e) {alert(e);console.error(e)}
