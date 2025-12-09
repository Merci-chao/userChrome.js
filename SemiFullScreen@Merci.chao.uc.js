"use strict";
// ==UserScript==
// @name           Semi-Full Screen
// @description    Full screen with keeping your task bar visible, or hide the toolbars when not maximized (picture-in-picture).
// @version        2025-08-24
// @author         Merci chao
// @homepageURL    https://github.com/Merci-chao/userChrome.js#semi-full-screen--picture-in-picture-mode
// @changelogURL   https://github.com/Merci-chao/userChrome.js#changelog-3
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/SemiFullScreen@Merci.chao.uc.js
// ==/UserScript==

try {(() => {
const SCRIPT_NAME = "Semi-Full Screen";
const SCRIPT_FILE_NAME = "SemiFullScreen@Merci.chao.uc.js";

let prefs;
let prefBranchStr = "extensions.SemiFullScreen@Merci.chao.";
{
	let defPrefs = {
		reverse: false,
		checkUpdate: 1,
		checkUpdateFrequency: 7,
		autoHideToolbarDelay: 1000,
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
				link: "#changelog-3",
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
				link: "/blob/main/README.jp.md#変更履歴-3",
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
			/*global openURL*/
			openURL(homeURL + l10n.link);
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
					} else if (val && !this.shift) {
						let pip = this.ctrl == prefs.reverse;
						this.on = true;
						this.normalSizeBefore = !root.matches("[sizemode=maximized]");
						if (!this.normalSizeBefore)
							pip = false;
						if (!pip)
							window.maximize();

						let win1x = navigator.oscpu.startsWith("Windows NT 1");
						let borderWidth =  pip && win1x ?
								0 : (window.outerWidth - root.clientWidth) / 2;
						let _;
						let style = `
							${!win1x ? `
								:root {
									--semi-fullscreen-border-width: ${borderWidth}px;
								}

								${_=`:root[tabsintitlebar]:is([sizemode=maximized], :not([lwtheme-image]))`} {
									margin-top: var(--semi-fullscreen-border-width) !important;
									height: calc(100vh - var(--semi-fullscreen-border-width)) !important;
								}

								${_} #titlebar {
									margin-top: calc(var(--semi-fullscreen-border-width) * -1) !important;
								}

								${_} #fullscr-toggler {
									top: var(--semi-fullscreen-border-width) !important;
								}
							` : ``}

							:root[sizemode=normal] #navigator-toolbox[tabs-hidden] #nav-bar .titlebar-spacer {
								display: flex !important;
							}
						`;
						if (pip && document.getElementById("TabsToolbar").screenY < document.getElementById("nav-bar").screenY)
							style += `
								#fullscr-toggler,
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
						}, prefs.autoHideToolbarDelay);
				}
				break;
			}
		}
	},
};

SemiFullScreen.SYMBOL = Symbol("SemiFullScreen");

new SemiFullScreen(window);

})()} catch(e) {alert(e);console.error(e)}
