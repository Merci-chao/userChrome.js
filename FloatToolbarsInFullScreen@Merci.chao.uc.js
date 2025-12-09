// ==UserScript==
// @name           Float Toolbars in Full Screen
// @description    Float the toolbars over the page in full screen mode, instead of making the web page jumpy when the toolbars showing / hiding.
// @version        2025-08-16
// @author         Merci chao
// @homepageURL    https://github.com/Merci-chao/userChrome.js#float-toolbars-in-full-screen
// @changelogURL   https://github.com/Merci-chao/userChrome.js#changelog-4
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/FloatToolbarsInFullScreen@Merci.chao.uc.js
// ==/UserScript==

try {
const SCRIPT_NAME = "Float Toolbars in Full Screen";
const SCRIPT_FILE_NAME = "FloatToolbarsInFullScreen@Merci.chao.uc.js";

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
		let getVer = code => code?.match(/^\/\/\s*@version\s+(.+?)\s*$/mi)?.[1];
		let localFileURI = new Error().stack.match(/(?<=@).+?(?=:\d+:\d+$)/m)[0];
		let localFilePath = decodeURI(localFileURI.replace(/^file:\/\/\/|\?.*$/g, "")).replaceAll("/", "\\");
		let localScript = await (await fetch(localFileURI)).text();
		let updateURL = localScript.match(/^\/\/\s*@updateURL\s+(.+?)\s*$/mi)[1];
		let homeURL = "https://github.com/Merci-chao/userChrome.js";
		let remoteScript = (await (await fetch(updateURL)).text()).trim();
		let local = getVer(localScript);
		let remote = getVer(remoteScript);
		if (
			!remote ||
			remote.localeCompare(local, undefined, {numeric: true}) <= 0
		)
			return;

		let l10n = {
			en: {
				message: `${SCRIPT_NAME} (${SCRIPT_FILE_NAME}) version ${remote} is released.`,
				update: "Update Now",
				updateKey: "N",
				download: "Update Manually",
				downloadKey: "M",
				changelog: "Changelog",
				changelogKey: "C",
				later: "Remind Tomorrow",
				laterKey: "R",
				link: "#changelog-4",
				done: `${SCRIPT_NAME} has been updated to version ${remote}. You may restart Firefox to apply.`,
				error: `Failed to apply the update of ${SCRIPT_NAME} version ${remote}. Please ensure the file is not read-only or locked by another program:`,
			},
			ja: {
				message: `${SCRIPT_NAME}（${SCRIPT_FILE_NAME}）の新バージョン ${remote} がリリースされました。`,
				update: "今すぐ更新",
				updateKey: "N",
				download: "手動で更新",
				downloadKey: "M",
				changelog: "変更履歴",
				changelogKey: "C",
				later: "明日再通知する",
				laterKey: "R",
				link: "/blob/main/README.jp.md#変更履歴-4",
				done: `${SCRIPT_NAME} ${remote} を更新しました。Firefox を再起動すると変更が有効になります。`,
				error: `${SCRIPT_NAME} バージョン ${remote} の更新処理に失敗しました。ファイルが読み取り専用でないこと、または他のプログラムによってロックされていないことを確認してください：`,
			},
		};
		l10n = l10n[Services.locale.appLocaleAsLangTag.split("-")[0]] || l10n.en;

		showNotification(
			l10n.message,
			[
				{
					label: l10n.update,
					accessKey: l10n.updateKey,
					callback: install,
					primary: true,
				},
				{
					label: l10n.download,
					accessKey: l10n.downloadKey,
					callback: showChangelog,
				},
				{
					label: l10n.later,
					accessKey: l10n.laterKey,
					callback: () => Services.prefs.setIntPref(
						prefBranchStr + "checkUpdate",
						Date.now() / 1000 - (Math.max(prefs.checkUpdateFrequency, 1) - 1) * 24 * 60 * 60,
					),
				},
			],
			"chrome://browser/skin/update-badge.svg",
		);

		async function showNotification(label, buttons, icon) {
			let box = await gNotificationBox.appendNotification(
				"multitabrows",
				{
					label,
					priority: gNotificationBox.PRIORITY_INFO_HIGH,
				},
				buttons,
				true,
			);
			if (icon) {
				let node = box.shadowRoot.querySelector(".icon");
				let color = "var(--panel-banner-item-update-supported-bgcolor)";
				node.src = icon;
				Object.assign(node.style, {
					fill: color,
					color,
				});
				node.style.setProperty("--message-bar-icon-url", `url(${icon})`);
			}
		}

		function install() {
			try {
				/*global FileUtils*/
				let fos = FileUtils.openFileOutputStream(
					FileUtils.File(localFilePath),
					FileUtils.MODE_WRONLY | FileUtils.MODE_TRUNCATE,
				);
				let converter = Cc["@mozilla.org/intl/converter-output-stream;1"]
					.createInstance(Ci.nsIConverterOutputStream);
				converter.init(fos, "UTF-8");
				converter.writeString(remoteScript);
				converter.close();

				//Delay a bit to make the installation feel like it's actually running
				setTimeout(() => showNotification(
					l10n.done,
					[
						{
							label: l10n.changelog,
							accessKey: l10n.changelogKey,
							callback: showChangelog,
						},
					],
				), 500);
			} catch(e) {
				Services.prompt.alert(window, l10n.title, [l10n.error, localFilePath, e.message].join("\n\n"));
				return true;
			}
		}

		function showChangelog() {
			openURL(homeURL + l10n.link);
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
