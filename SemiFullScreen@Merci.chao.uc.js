"use strict";
// ==UserScript==
// @name          Semi-Full Screen
// @version        2025-08-24
// @author         Merci chao
// @namespace      https://github.com/Merci-chao/userChrome.js#semi-full-screen--picture-in-picture-mode
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/SemiFullScreen@Merci.chao.uc.js
// @downloadURL    https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/SemiFullScreen@Merci.chao.uc.js
// ==/UserScript==

if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

let prefs;
let prefBranchStr = "extensions.SemiFullScreen@Merci.chao.";
{
	let defPrefs = {
		reverse: false,
		checkUpdate: 1,
		checkUpdateFrequency: 7,
	};

	let setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
			value != null && branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
	let getPrefs = (branch, data) => Object.fromEntries(Object.entries(data)
			.filter(([name, value]) => value != null)
			.map(([name, value]) => [name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));
	setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defPrefs);
	prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defPrefs);
}


if (prefs.checkUpdate && (Date.now() / 1000 - prefs.checkUpdate) / 60 / 60 / 24 >= Math.max(prefs.checkUpdateFrequency, 1)) {
	Services.prefs.setIntPref(prefBranchStr + "checkUpdate", Date.now() / 1000);
	(async () => {
		let getVer = code => (code.match(/^\/\/\s*@version\s+(.+)$/mi) || [])[1];
		let localScript = await (await fetch(new Error().stack.match(/(?<=@).+?(?=:\d+:\d+$)/m)[0])).text();
		let updateURL = localScript.match(/^\/\/\s*@updateURL\s+(.+)$/mi)[1];
		let downloadURL = localScript.match(/^\/\/\s*@downloadURL\s+(.+)$/mi)[1];
		let remoteScript = await (await fetch(updateURL)).text();
		let local = getVer(localScript);
		let remote = getVer(remoteScript);
		if (remote.localeCompare(local, undefined, {numeric: true}) <= 0) return;
		let p = Services.prompt;
		let buttons = p.BUTTON_POS_0 * p.BUTTON_TITLE_YES +
				p.BUTTON_POS_1 * p.BUTTON_TITLE_IS_STRING +
				p.BUTTON_POS_2 * p.BUTTON_TITLE_NO;
		let dontAsk = {};
		let l10n = {
			en: {
				title: "Update Notification",
				message: `Semi-Full Screen version ${remote} is released. Would you want to view it now?`,
				later: "Remind Tomorrow",
				never: `Stop checking when selecting "No" (strongly not recommended)`,
			},
		};
		l10n = l10n[Services.locale.appLocaleAsLangTag.split("-")[0]] || l10n.en;
		switch (p.confirmEx(window, l10n.title, l10n.message,
				buttons, "", l10n.later, "", l10n.never, dontAsk)) {
			case 0:
				openURL(downloadURL);
				break;
			case 1:
				Services.prefs.setIntPref(prefBranchStr + "checkUpdate",
						Date.now() / 1000 - (Math.max(prefs.checkUpdateFrequency, 1) - 1) * 24 * 60 * 60);
				break;
			case 2:
				if (dontAsk.value)
					Services.prefs.setIntPref(prefBranchStr + "checkUpdate", 0);
				break;
		}
	})();
}

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
						let pip = this.ctrl == prefs.reverse;
						this.on = true;
						this.normalSizeBefore = !root.matches("[sizemode=maximized]");
						if (!this.normalSizeBefore)
							pip = false;
						if (!pip)
							window.maximize();

						if (/(firefox-compact-(light|dark)|default-theme)@mozilla\.org|^$/.test(Services.prefs.getCharPref("extensions.activeThemeID")))
							root.setAttribute("semi-fullscreen-transparent", true);

						let borderWidth =  pip && navigator.oscpu.startsWith("Windows NT 1") ?
								0 : (window.outerWidth - root.clientWidth) / 2;
						let style = `
							:root {
								--semi-fullscreen-border-width: ${borderWidth}px;
							}

							@media (-moz-platform: windows-win7), (-moz-platform: windows-win8) {
								:root[semi-fullscreen-transparent] #titlebar:not([semi-fullscreen-win="8"] #navigator-toolbox:not([style*=margin-top]) *),
								:root[sizemode=maximized] {
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
								display: flex;
							}

							:root[sizemode=normal] #navigator-toolbox[tabs-hidden] #nav-bar .titlebar-spacer {
								display: flex !important;
							}
						`;
						if (pip && document.getElementById("TabsToolbar").screenY < document.getElementById("nav-bar").screenY)
							style += `
								#fullscr-toggler {
									display: flex !important;
								}

								:root[inFullscreen] #TabsToolbar .titlebar-spacer {
									display: flex !important;
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
							FullScreen.fullScreenToggler.dispatchEvent(new window.Event("mouseover"));
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
