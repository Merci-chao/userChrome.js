// ==UserScript==
// @name           Float Toolbars in Full Screen
// @version        2025-08-16
// @author         Merci chao
// @namespace      https://github.com/Merci-chao/userChrome.js#float-toolbars-in-full-screen
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/FloatToolbarsInFullScreen@Merci.chao.uc.js
// @downloadURL    https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/FloatToolbarsInFullScreen@Merci.chao.uc.js
// ==/UserScript==

try {

let prefBranchStr = "extensions.FloatToolbarsInFullScreen@Merci.chao.";
let defPrefs = {
	checkUpdate: 1,
	checkUpdateFrequency: 7,
};

let setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
		branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
let getPrefs = (branch, data) => Object.fromEntries(Object.entries(data).map(([name, value]) =>
		[name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));
setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defPrefs);
let prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defPrefs);


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
				message: `Float Toolbars in Full Screen version ${remote} is released. Would you want to view it now?`,
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

function FloatToolbarsInFullScreen() {
	Object.assign(this, {
		transitionEndListener: null,
		mouseOverNavToolbox: false,
		originalFunctions: {},
	});

	this.bind();
}

FloatToolbarsInFullScreen.prototype = {
	bind() {
		let {originalFunctions} = this;
		let docElt = document.documentElement;
		let contentDeck = document.getElementById("browser");

		if (fullScreen)
			fullScreen = false;

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
				z-index: calc(1/0) !important;
				position: relative !important;
			}

			:root[data-float-in-fullscreen-hide-bg],
			:root[data-float-in-fullscreen-hide-bg] #navigator-toolbox {
				background: none !important;
			}
		`;

		FullScreen.toggle = () => {
			if (fullScreen) {
				gNavToolbox.setAttribute("data-float-in-fullscreen-ready", true);
			} else {
				gNavToolbox.removeAttribute("data-float-in-fullscreen-ready");
				this.mouseOverNavToolbox = false;
				contentDeck.style.clipPath = "";
			}
			["mouseenter", "mouseleave"].forEach(e =>
					gNavToolbox[fullScreen ? "addEventListener" : "removeEventListener"](e, mouseEventHandler, true));

			docElt.toggleAttribute("data-float-in-fullscreen-hide-bg", fullScreen && needToHideBackground());

			originalFunctions.toggle.call(FullScreen);
		};

		FullScreen.showNavToolbox = trackMouse => {
			let {height} = gNavToolbox.getBoundingClientRect();
			Object.assign(contentDeck.style, fullScreen ?
					{
						marginTop: `-${height}px`,
						clipPath: `inset(${height}px 0 0 0)`,
					} :
					{
						marginTop: "",
						clipPath: "",
					});

			originalFunctions.showNavToolbox.call(FullScreen, trackMouse);

			Object.assign(contentDeck.style, {
				transitionDelay: "",
				transitionDuration: "",
				transitionProperty: "",
				transitionTimingFunction: "",
			});
			if (fullScreen)
				requestAnimationFrame(() => {
					if (!gNavToolbox.hasAttribute("fullscreenShouldAnimate")) {
						let {height} = gNavToolbox.getBoundingClientRect();
						Object.assign(contentDeck.style, {
							marginTop: `-${height}px`,
							clipPath: `inset(${height}px 0 0 0)`,
						});
					}
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
				setTimeout(() => {
					if (document.querySelector(":is(menu,button,toolbarbutton)[open]:not([hidden]), [panelopen]:not([hidden]), panel[animate=open]:not([hidden])"))
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
					|| document.querySelector(":is(menu,button,toolbarbutton)[open]:not([hidden]), [panelopen]:not([hidden]), panel[animate=open]:not([hidden])"))
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
					} = getComputedStyle(gNavToolbox);

					Object.assign(contentDeck.style, {
						transitionDelay,
						transitionDuration,
						transitionProperty: "margin-top",
						transitionTimingFunction,
						marginTop: "",
						clipPath: "",
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
						clipPath: "",
					});
				}
		};

		FullScreen.setAutohide = () => {
			originalFunctions.setAutohide.call(FullScreen);
			if (Services.prefs.getBoolPref("browser.fullscreen.autohide"))
				Object.assign(contentDeck.style, {marginTop: "", clipPath: ""});
			else
				//since the autohide is set via context menu, the hideNavToolbox may be called when the toolbox is trying to display
				//call the showNavToolbox again to fix some weird conflict
				FullScreen.showNavToolbox();
		};
	},
};

FloatToolbarsInFullScreen.SYMBOL = Symbol("FloatToolbarsInFullScreen");

new FloatToolbarsInFullScreen();

function needToHideBackground() {
	let micaPref = "widget.windows.mica";
	return Services.prefs.getPrefType(micaPref) &&
			Services.prefs.getBoolPref(micaPref) &&
			!matchMedia("(-moz-windows-accent-color-in-titlebar)").matches &&
			["default-theme@mozilla.org", ""].includes(Services.prefs.getStringPref("extensions.activeThemeID"));
}

} catch(e) {alert(["FloatToolbarsInFullScreen@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e)}

