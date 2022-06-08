/*
update 2022/06/08: update for fx 101
update 2022/04/29: now minimize then restore window won't exit the fullscreen state
*/
"use strict";
if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

let REVERSE = false;
try {REVERSE = Services.prefs.getBoolPref("extensions.SemiFullScreen@Merci.chao.reverse")} catch(e) {}

function SemiFullScreen(window) {
	Object.assign(this, {
		window,
		
		on: false,
		normalSizeBefore: false,
		previousSizeMode: null,
		shift: false,
		ctrl: false,
		
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
		[7,8].some(v => {
			if (window.matchMedia(`(-moz-platform: windows-win${v})`).matches) {
				window.document.documentElement.setAttribute("semi-fullscreen-win", v);
				return true;
			}
		});
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
						this.LAZY_HANDLED_EVENTS.forEach(e => window.removeEventListener(e, this, true));
						this.on = false;
						this.normalSizeBefore && window.restore();
						this.styleElt.remove();
						this.styleElt = null;
						this.previousSizeMode = null;
						this.clearHideToolboxTimeout();
						root.removeAttribute("semi-fullscreen-transparent");
					} else if (val && !this.shift) {
						let pip = this.ctrl == REVERSE;
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
							
							@media (-moz-platform: windows-win7), (-moz-platform: windows-win8) {
								:root[semi-fullscreen-transparent][semi-fullscreen-win='7'] #titlebar,
								:root[sizemode=maximized][semi-fullscreen-win='7'],
								:root[sizemode=maximized][semi-fullscreen-win='8'] #titlebar {
									margin-top: calc(0px - var(--semi-fullscreen-border-width)) !important;
								}
								
								:root:is([sizemode=maximized], [semi-fullscreen-transparent][semi-fullscreen-win='7']) {
									margin-top: var(--semi-fullscreen-border-width) !important;
								}
								
								:root:is([sizemode=maximized], [semi-fullscreen-transparent][semi-fullscreen-win='7']) #fullscr-toggler {
									top: var(--semi-fullscreen-border-width) !important;
								}
								
								:root:is([sizemode=maximized], [semi-fullscreen-transparent]) {
									height: calc(100vh - var(--semi-fullscreen-border-width)) !important;
								}
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
									@media (-moz-platform: windows-win8) {
										.titlebar-buttonbox {
											width: 0;
											height: 20px;
										}
									}
								
									@media (-moz-platform: windows-win7) {
										.titlebar-buttonbox {
											width: 0;
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
								
								:root[inFullscreen] .titlebar-spacer {
									display: block !important;
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
	
	clearHideToolboxTimeout() {
		if (this.hideToolboxTimeout) {
			window.clearTimeout(this.hideToolboxTimeout);
			this.hideToolboxTimeout = null;
		}
	},
	
	handleEvent(e) {
		let {type, key, shiftKey, ctrlKey, clientY, target} = e, {window} = this;
		switch (type) {
			case "keydown":
				switch (key) {
					case "Shift":
						this.shift = true;
						break;
					case "Control":
						this.ctrl = true;
						break;
					case "F11":
						if (shiftKey || ctrlKey)
							window.BrowserFullScreen();
						break;
				}
				break;
			case "keyup":
				switch (key) {
					case "Shift":
						this.shift = false;
						break;
					case "Control":
						this.ctrl = false;
						break;
				}
				break;
			case "sizemodechange":
				if (this.on && this.previousSizeMode != window.STATE_MINIMIZED) {
					if (window.windowState == window.STATE_NORMAL)
						window.fullScreen = false;
					else if (window.windowState == window.STATE_MAXIMIZED) {
						this.normalSizeBefore = false;
						window.fullScreen = false;
					}
				}
				this.previousSizeMode = window.windowState;
				break;
			case "deactivate":
				this.shift = this.ctrl = false;
				break;
			case "mouseenter": {
				this.clearHideToolboxTimeout();
				break;
			} case "mouseleave": {
				let {document} = window, {documentElement} = document;
				if (target == documentElement && window.gNavToolbox.style.pointerEvents != "none") {
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
