"use strict";
if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

let REVERSE = false;
try {REVERSE = Services.prefs.getBoolPref("extensions.SemiFullScreen@Merci.chao.reverse")} catch(e) {}

function SemiFullScreen(window) {
	Object.assign(this, {
		window,
		
		on: false,
		normalSizeBefore: false,
		shift: false,
		alt: false,
		
		originalFullScreen: null,
		styleElt: null,
		hideToolboxTimeout: null,
	});
	
	this.bind();
}

SemiFullScreen.prototype = {
	HANDLED_EVENTS: ["keydown", "keyup", "deactivate"],
	
	LAZY_HANDLED_EVENTS: ["mouseleave", "mouseenter", "sizemodechange"],
	
	bind() {
		let {window} = this;
		window[SemiFullScreen.SYMBOL] = this;
		this.HANDLED_EVENTS.forEach(e => window.addEventListener(e, this, false));
		
		this.originalFullScreen = Object.getOwnPropertyDescriptor(window, "fullScreen");
		
		Object.defineProperty(window, "fullScreen", {
			get: () => this.on || this.originalFullScreen.get.call(this.window),
			
			set: val => {
				let {window} = this, {FullScreen, document} = window,
						root = document.documentElement;
				let handled = true;
				
				if (val != window.fullScreen)
					if (this.on) {
						this.on = false;
						this.normalSizeBefore && window.restore();
						this.styleElt.remove();
						this.styleElt = null;
						root.removeAttribute("semi-fullscreen-transparent");
						if (this.hideToolboxTimeout) {
							window.clearTimeout(this.hideToolboxTimeout);
							this.hideToolboxTimeout = null;
						}
						this.LAZY_HANDLED_EVENTS.forEach(e => window.removeEventListener(e, this, true));
					} else if (val && !this.shift) {
						let pip = this.alt == REVERSE;
						this.on = true;
						this.normalSizeBefore = !root.matches("[sizemode=maximized]");
						if (!this.normalSizeBefore)
							pip = false;
						if (!pip)
							window.maximize();
						
						if (/firefox-compact-(light|dark)@mozilla\.org/.test(Services.prefs.getCharPref("extensions.activeThemeID")))
							root.setAttribute("semi-fullscreen-transparent", true);
						
						let borderWidth =  pip && navigator.oscpu.startsWith("Windows NT 1") ?
								0 : (window.outerWidth - root.clientWidth) / 2;
						let style = `
							:root {
								--semi-fullscreen-border-width: ${borderWidth}px;
							}
							
							:root:is([sizemode=maximized], [semi-fullscreen-transparent]) #titlebar {
								margin-top: calc(0px - var(--semi-fullscreen-border-width)) !important;
							}
							
							:root:is([sizemode=maximized], [semi-fullscreen-transparent]) {
								margin-top: var(--semi-fullscreen-border-width) !important;
							}
							
							:root:is([sizemode=maximized], [semi-fullscreen-transparent]) #fullscr-toggler {
								top: var(--semi-fullscreen-border-width) !important;
							}
							
							:root:is([sizemode=maximized], [semi-fullscreen-transparent]) {
								height: calc(100vh - var(--semi-fullscreen-border-width)) !important;
							}
							
							@media not (-moz-platform: windows-win7) {
								@media not (-moz-platform: windows-win8) {
									.titlebar-buttonbox {
										appearance: none !important;
									}
								}
							}
							
							@media (-moz-windows-default-theme) {
								@media (-moz-windows-compositor) {
									.titlebar-buttonbox {
										width: 0;
									}
									
									@media (-moz-platform: windows-win8) {
										.titlebar-buttonbox {
											height: 20px;
										}
									}
								
									@media (-moz-platform: windows-win7) {
										.titlebar-buttonbox {
											height: 18px;
										}
									}
								}
							}
							
							.titlebar-button {
								display: -moz-box;
							}
						`;
						if (pip)
							style += `
								@media (-moz-windows-compositor) {
									@media not (-moz-platform: windows-win7) {
										@media not (-moz-platform: windows-win8) {
											@media (-moz-windows-default-theme) {
												@media (-moz-windows-accent-color-in-titlebar) {
													#fullscr-toggler {
														background: -moz-accent-color;
														display: block !important;
													}
													#fullscr-toggler:-moz-window-inactive {
														background: rgb(57,57,57);
													}
												}
											}
										}
									}
								}
								
								:root:root[inFullscreen] .titlebar-spacer {
									display: -moz-box;
								}
							`;
						this.styleElt = document.body.appendChild(document.createElement("style"));
						this.styleElt.innerHTML = style;
						
						this.LAZY_HANDLED_EVENTS.forEach(e => window.addEventListener(e, this, true));
					} else {
						this.originalFullScreen.set.call(window, val);
						handled = false;
					}
				
				if (handled)
					this.window.dispatchEvent(new window.Event("fullscreen", {bubbles: true, cancelable: true}));
			},
			
			configurable: true,
			enumerable: true,
		});
	},
	
	handleEvent(e) {
		let {type, key, shiftKey, altKey, clientY, target} = e, {window} = this;
		switch (type) {
			case "keydown":
				switch (key) {
					case "Shift":
						this.shift = true;
						break;
					case "Alt":
						this.alt = true;
						break;
					case "F11":
						if (shiftKey || altKey)
							window.BrowserFullScreen();
						break;
				}
				break;
			case "keyup":
				switch (key) {
					case "Shift":
						this.shift = false;
						break;
					case "Alt":
						this.alt = false;
						break;
				}
				break;
			case "sizemodechange":
				if (this.on)
					if (window.windowState == window.STATE_NORMAL)
						window.fullScreen = false;
					else if (window.windowState == window.STATE_MAXIMIZED)
						setTimeout(() => {
							this.normalSizeBefore = false;
							window.fullScreen = false;
						}, 100);
				break;
			case "deactivate":
				this.shift = false;
				break;
			case "mouseenter": {
				if (this.hideToolboxTimeout) {
					window.clearTimeout(this.hideToolboxTimeout);
					this.hideToolboxTimeout = null;
				}
				break;
			} case "mouseleave": {
				let {document} = window, {documentElement} = document;
				if (target == documentElement) {
					if (FullScreen.navToolboxHidden)
						if (clientY < (window.outerWidth - documentElement.clientWidth) / 2 + 2)
							FullScreen._fullScrToggler.dispatchEvent(new window.Event("mouseover"));
					if (!FullScreen.navToolboxHidden)
						this.hideToolboxTimeout = window.setTimeout(() => {
							window.FullScreen.hideNavToolbox();
						}, 800);
				}
				break;
			}
		}
	},
};

SemiFullScreen.SYMBOL = Symbol("SemiFullScreen");

new SemiFullScreen(window);

})()} catch(e) {alert(e);console.error(e)}
