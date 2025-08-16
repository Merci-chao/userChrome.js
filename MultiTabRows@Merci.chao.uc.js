"use strict";
// ==UserScript==
// @name           Multi Tab Rows (MultiTabRows@Merci.chao.uc.js)
// @version        3.2.1
// @author         Merci chao
// @namespace      https://github.com/Merci-chao/userChrome.js#multi-tab-rows
// @supportURL     https://github.com/Merci-chao/userChrome.js#changelog
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js
// @downloadURL    https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js
// ==/UserScript==

try {
if (gBrowser?._initialized) {
	setup();
	let tc = gBrowser.tabContainer;
	if (gBrowser.pinnedTabsContainer)
		tc.arrowScrollbox
				.prepend(...tc.visibleTabs.slice(0, gBrowser.pinnedTabCount));
	tc.uiDensityChanged();
	tc._handleTabSelect(true);
	tc._invalidateCachedTabs();
	tc._updateInlinePlaceHolder();
} else
	addEventListener("DOMContentLoaded", () => {
		try { setup() } catch(e) { alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e) }
	}, {once: true});

function setup() {
const [START, END, LEFT, RIGHT, START_PC, END_PC, DIR] = RTL_UI ?
		["right", "left", "end", "start", "100%", "0%", -1] : ["left", "right", "start", "end", "0%", "100%", 1];
const EPSILON = .001;

class Rect {
	constructor(start, y, width = 0, height = 0, widthRoundingDiff = 0, heightRoundingDiff = 0) {
		assign(this, {start, y, width, height, widthRoundingDiff, heightRoundingDiff, visible: start != null && y != null});
	}

	#start; #y;

	#pos(n) {
		let v = n == "y" ? this.#y : this.#start;
		if (v == null)
			console.error("Can't access position of a hidden or disconnected element", this.element);
		return v ?? 0;
	}

	get start() { return this.#pos("start") }
	set start(v) { this.#start = v }

	get end() { return this.start + this.width * DIR }
	set end(v) { this.width = (v - this.start) * DIR }

	get x() { return this[LEFT] }
	set x(v) { this[LEFT] = v }

	get right() { return this[RIGHT] }
	set right(v) { this[RIGHT] = v }

	get left() { return this.x }
	set left(v) { this.x = v }

	get y() { return this.#pos("y") }
	set y(v) { this.#y = v }

	get top() { return this.y }
	set top(v) { this.y = v }

	get bottom() { return this.y + this.height }
	set bottom(v) { this.height = v - this.y }

	clone() {
		return assign(new Rect(this.#start, this.#y), this);
	}
}

const appVersion = parseInt(Services.appinfo.version);

{
	let {prefs} = Services;
	let pref = "sidebar.verticalTabs";
	try {
		if (prefs.getBoolPref(pref)) {
			prefs.setBoolPref(pref, false);
			restartFirefox();
			return;
		}
		prefs.lockPref(pref);

		$$("#toolbar-context-toggle-vertical-tabs, #context_toggleVerticalTabs, #sidebar-context-menu-enable-vertical-tabs")
				.forEach(e => e.disabled = true);
	} catch(e) {}
}

const CLOSING_THE_ONLY_TAB = Symbol("closingTheOnlyTab");

const win7 = matchMedia("(-moz-platform: windows-win7)").matches;
const win8 = matchMedia("(-moz-platform: windows-win8)").matches;
const accentColorInTitlebarMQ = matchMedia("(-moz-windows-accent-color-in-titlebar)");
let micaEnabled;
let mica;
let defaultDarkTheme, defaultAutoTheme, defaultTheme;

const root = document.documentElement;

let console, debug;

const prefBranchStr = "userChromeJS.multiTabRows@Merci.chao.";

if (!Services.prefs.getPrefType(prefBranchStr + "checkUpdate"))
	Services.prefs.setIntPref(prefBranchStr + "tabsUnderControlButtons", 0);

let prefs;
{
	const createDefaultPrefs = () => {
		try {
			micaEnabled = Services.prefs.getBoolPref("widget.windows.mica");
		} catch (e) {
			micaEnabled = false;
		}
		mica = micaEnabled && defaultAutoTheme && !accentColorInTitlebarMQ.matches;

		return {
			maxTabRows: 4,
			rowStartIncreaseFrom: parseInt(getComputedStyle(root).minWidth),
			rowIncreaseEvery: 200,
			spaceAfterTabs: 40,
			spaceAfterTabsOnMaximizedWindow: 40,
			spaceBeforeTabs: 40,
			spaceBeforeTabsOnMaximizedWindow: 0,
			hideEmptyPlaceholderWhenScrolling: true,
			gapAfterPinned: 12,
			tabsbarItemsAlign: "start",
			linesToScroll: 1,
			linesToDragScroll: 1,
			thinScrollbar: true,
			scrollbarTrackColor: "auto",
			scrollbarThumbColor: "auto",
			dynamicThemeImageSize: false,
			tabsUnderControlButtons: 2,
			debugMode: 0,
			floatingBackdropClip: win7 || win8 ? defaultTheme : mica,
			floatingBackdropBlurriness: appVersion > 116 ? 5 : null,
			floatingBackdropOpacity: appVersion > 116 && !mica ? 25 : 75,
			compactControlButtons: !win7 && !win8 ? false : null,
			hideAllTabs: $("#alltabs-button")?.getAttribute("removable") == "false" ? false : null,
			checkUpdate: 1,
			checkUpdateFrequency: 1,
			// inlinePinnedTabs: false,
			dragToGroupTabs: gBrowser.tabGroups ? true : null,
			dynamicMoveOverThreshold: gBrowser.tabGroups ? true : null,
			nativeWindowStyle: appVersion > 130 ? false : null,
			animationDuration: +getComputedStyle(root).getPropertyValue("--tab-dragover-transition").match(/\d+|$/)[0] || 200,
			autoCollapse: false,
			autoCollapseDelayExpanding: 50,
			autoCollapseDelayCollapsing: 200,
			// autoCollapseCurrentRowStaysTop: false,
			hideDragPreview: 1,
			tabsAtBottom: appVersion > 132 ? 0 : null,
			tabMaxWidth: 225,
			hideScrollButtonsWhenDragging: false,
			scrollButtonsSize: 10,
			justifyCenter: 0,
		};
	};

	const setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
			value != null && branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
	const getPrefs = (branch, data) => Object.fromEntries(Object.entries(data)
			.filter(([name, value]) => value != null)
			.map(([name, value]) => [name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));

	updateThemeStatus();
	loadPrefs();
	updatePrefsDependency(true);

	Object.keys(prefs).forEach(n => Services.prefs.addObserver(prefBranchStr + n, onPrefChange));
	let observedBrowserPrefs = [
		"extensions.activeThemeID",
		"browser.toolbars.bookmarks.visibility",
		"browser.tabs.tabMinWidth",
		"browser.tabs.groups.enabled",
		"browser.tabs.dragDrop.moveOverThresholdPercent",
		"layout.css.has-selector.enabled",
		"browser.toolbars.bookmarks.visibility",
		"widget.windows.mica",
	];
	for (let p of observedBrowserPrefs)
		Services.prefs.addObserver(p, onPrefChange);
	accentColorInTitlebarMQ.onchange = () => onPrefChange(null, null, "-moz-windows-accent-color-in-titlebar");

	addEventListener("unload", e => {
		if (e.target != document) return;
		Object.keys(prefs).forEach(n => Services.prefs.removeObserver(prefBranchStr + n, onPrefChange));
		for (let p of observedBrowserPrefs)
			Services.prefs.removeObserver(p, onPrefChange);
	}, true);

	function loadPrefs() {
		prefs = createDefaultPrefs();
		setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), prefs);
		prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), prefs);
		let needUpdateStyle;
		if (prefs.maxTabRows < 2)
			prefs.tabsUnderControlButtons = 0;
		if (prefs.floatingBackdropClip)
			prefs.floatingBackdropOpacity = 75;
		if (prefs.autoCollapse)
			prefs.tabsUnderControlButtons = 0;
		if (prefs.autoCollapse) {
			prefs.rowIncreaseEvery = 0;
			prefs.rowStartIncreaseFrom = 0;
		}
		prefs.animationDuration = Math.min(Math.max(prefs.animationDuration, 0), prefs.debugMode ? Infinity : 1000);
		try {
			if (Services.prefs.getIntPref("browser.tabs.dragDrop.moveOverThresholdPercent") <= 50)
				prefs.dynamicMoveOverThreshold = false;
		} catch(e) {}
	}

	function onPrefChange(pref, type, name) {
		if (window.MultiTabRows_updatingPref) return;

		console.log(name);

		if (name == "extensions.activeThemeID")
			updateThemeStatus();

		let browsers = [...Services.wm.getEnumerator("navigator:browser")];

		for (let win of browsers)
			win.MultiTabRows_updatingPref = true;

		updatePrefsDependency(false);
		loadPrefs();
		updatePrefsDependency(true);

		for (let win of browsers)
			delete win.MultiTabRows_updatingPref;

		//since locking the prefs makes them back to the default value,
		//load again to make sure using the values shown in about:config
		loadPrefs();

		switch(name.replace(prefBranchStr, "")) {
			case "browser.toolbars.bookmarks.visibility":
				updateNavToolboxNetHeight();
				setStyle();
				break;
			case "debugMode":
				setDebug();
				setStyle();
				break;
			case "hideAllTabs":
				toggleAllTabsButton();
				//force the new tab button to be position absolute
				tabsBar.removeAttribute("has-items-post-tabs");
				tabContainer._updateInlinePlaceHolder();
				break;
			case "autoCollapse":
			case "tabsUnderControlButtons":
			case "layout.css.has-selector.enabled":
				setStyle();
				tabsBar.toggleAttribute("tabs-hide-placeholder",
						tabContainer.overflowing && prefs.tabsUnderControlButtons < 2);
				tabContainer._updateInlinePlaceHolder();
				scrollbox.dispatchEvent(new Event("overflow"));
				break;
			case "thinScrollbar":
				setStyle();
				updateScrollbarWidth();
				tabContainer._updateInlinePlaceHolder();
				break;
			case "rowStartIncreaseFrom":
			case "rowIncreaseEvery":
			case "gapAfterPinned":
				setStyle();
				tabContainer._updateInlinePlaceHolder();
				break;
			case "tabMaxWidth":
			case "browser.tabs.tabMinWidth":
				setTimeout(() => {
					setStyle();
					tabContainer.uiDensityChanged();
					tabContainer._updateCloseButtons();
				}, 100);
				break;
			case "compactControlButtons":
				setStyle();
				updateNavToolboxNetHeight();
				break;
			case "maxTabRows":
				setStyle();
				scrollbox.dispatchEvent(new Event("overflow"));
				break;
			case "justifyCenter":
				setStyle();
				tabContainer._positionPinnedTabs();
				break;
			case "checkUpdate":
			case "checkUpdateFrequency":
			case "autoCollapseCurrentRowStaysTop":
			case "browser.tabs.groups.enabled":
			case "browser.tabs.dragDrop.moveOverThresholdPercent":
				break;
			default:
				setStyle();
		}
	}

	function updatePrefsDependency(enbale) {
		let singleRow = prefs.maxTabRows < 2;
		let nativeDragToGroup;
		try {
			nativeDragToGroup = Services.prefs.getBoolPref("browser.tabs.groups.enabled") &&
					Services.prefs.getIntPref("browser.tabs.dragDrop.moveOverThresholdPercent") > 50;
		} catch(e) {}
		lock("rowStartIncreaseFrom", singleRow || prefs.autoCollapse);
		lock("rowIncreaseEvery", singleRow || prefs.autoCollapse);
		lock("hideEmptyPlaceholderWhenScrolling", singleRow || prefs.tabsUnderControlButtons < 2 || prefs.tabsAtBottom);
		lock("tabsbarItemsAlign", singleRow || prefs.tabsUnderControlButtons == 2 || prefs.autoCollapse);
		lock("dynamicThemeImageSize", singleRow || defaultTheme || prefs.autoCollapse);
		lock("tabsUnderControlButtons", singleRow || prefs.autoCollapse);
		lock("floatingBackdropClip", singleRow || prefs.tabsUnderControlButtons < 2);
		lock("floatingBackdropBlurriness",
				prefs.floatingBackdropOpacity >= 100 || prefs.floatingBackdropClip ||
				singleRow || prefs.tabsUnderControlButtons < 2 || mica || prefs.nativeWindowStyle);
		lock("floatingBackdropOpacity", prefs.floatingBackdropClip || singleRow || prefs.tabsUnderControlButtons < 2);
		lock("checkUpdateFrequency", !prefs.checkUpdate);
		lock("nativeWindowStyle", !defaultTheme);
		lock("dynamicMoveOverThreshold", !nativeDragToGroup || !prefs.dragToGroupTabs);
		lock("dragToGroupTabs", !nativeDragToGroup);

		for (let p of ["After", "Before"])
			for (let o of ["", "OnMaximizedWindow"])
				lock(`space${p}Tabs${o}`, prefs.tabsAtBottom);

		let supportsHas = true;
		try { supportsHas = Services.prefs.getBoolPref("layout.css.has-selector.enabled") } catch(e) {}
		let noAutoCollapse = !supportsHas || singleRow;
		lock("autoCollapse", noAutoCollapse);
		for (let p of ["DelayCollapsing", "DelayExpanding", "CurrentRowStaysTop"])
			lock("autoCollapse" + p, noAutoCollapse || !prefs.autoCollapse);

		function lock(name, toLock) {
			try {
				Services.prefs[enbale && toLock ? "lockPref" : "unlockPref"](prefBranchStr + name);
			} catch(e) {
				if (prefs.debug)
					console.warn(e);
			}
		}
	}
}

setDebug();

if (prefs.checkUpdate && (Date.now() / 1000 - prefs.checkUpdate) / 60 / 60 / 24 >= Math.max(prefs.checkUpdateFrequency, 1)) {
	Services.prefs.setIntPref(prefBranchStr + "checkUpdate", Date.now() / 1000);
	(async () => {
		let getVer = code => (code.match(/^\/\/\s*@version\s+(.+)$/mi) || [])[1];
		let localScript = await (await fetch(new Error().stack.match(/(?<=@).+?(?=:\d+:\d+$)/m)[0])).text();
		let updateURL = localScript.match(/^\/\/\s*@updateURL\s+(.+)$/mi)[1];
		let downloadURL = "https://github.com/Merci-chao/userChrome.js";
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
				message: `Multi Tab Rows version ${remote} is released. Would you want to view it now?`,
				later: "Remind Tomorrow",
				never: `Stop checking when selecting "No" (strongly not recommended)`,
				link: "#changelog",
			},
			ja: {
				title: "アップデート通知",
				message: `Multi Tab Rows（多段タブ）の新バージョン ${remote} がリリースされました。今すぐ表示しますか？`,
				later: "明日再通知する",
				never: "「いいえ」を選択すると、今後のチェックを停止します（※非推奨）",
				link: "/blob/main/README.jp.md#変更履歴",
			},
		};
		l10n = l10n[Services.locale.appLocaleAsLangTag.split("-")[0]] || l10n.en;
		switch (p.confirmEx(window, l10n.title, l10n.message,
				buttons, "", l10n.later, "", l10n.never, dontAsk)) {
			case 0:
				openURL(downloadURL + l10n.link);
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

console.time("setup");

const tabsBar = document.getElementById("TabsToolbar");
const {tabContainer} = gBrowser, {arrowScrollbox} = tabContainer, {scrollbox} = arrowScrollbox;
const slot = $("slot", scrollbox);

const dropToPinSupported = tabContainer.constructor.toString().includes("#updateTabStylesOnDrag");

let tabHeight = 0;
let tabMinWidth = 0;
let newTabButtonWidth = 0;
let scrollbarWidth = 0;
let animatingLayout;

let fakeScrollbar = document.createXULElement("box");
fakeScrollbar.part = "fake-scrollbar";
fakeScrollbar.style.overflowY = "scroll";
//get the scrollbar width first in case the used scrollbar is squeezed in weird case
function updateScrollbarWidth() {
	document.body.appendChild(fakeScrollbar);
	fakeScrollbar.style.scrollbarWidth = prefs.thinScrollbar ? "thin" : "";
	promiseDocumentFlushed(() => {}).then(() => {
		scrollbarWidth = fakeScrollbar.getBoundingClientRect().width - fakeScrollbar.clientWidthDouble;
		let visualWidth = getScrollbar(fakeScrollbar).clientWidthDouble;
		arrowScrollbox.shadowRoot.appendChild(fakeScrollbar);
		tabsBar.style.setProperty("--tabs-scrollbar-visual-width", visualWidth + "px");
		if (tabsBar.style.getPropertyValue("--tabs-scrollbar-width"))
			tabsBar.style.setProperty("--tabs-scrollbar-width", scrollbarWidth + "px");
		//avoid the transition of the scrollbar on windows 11
		promiseDocumentFlushed(() => {}).then(() => getScrollbar(fakeScrollbar).style.opacity = 1);
	});
}
updateScrollbarWidth();

let mainStyle = document.body.appendChild(document.createElement("style"));

setStyle();

function setStyle() {
//fx 115 doesn't support CSS cascade so use some variables to save code
let _, context, condition, x, y;
let floatingButtonStyle;
const {rowStartIncreaseFrom: rSIF, rowIncreaseEvery: rIE, maxTabRows: maxRows} = prefs;
const singleRow = maxRows < 2 ? "screen" : `(max-width: ${rSIF + rIE - EPSILON}px)`;
const multiRows = `(min-width: ${rSIF + rIE}px)`;
const twoOrLessRows = maxRows < 3 ? "screen" : `(max-width: ${rSIF + rIE * 2 - EPSILON}px)`;
const visible = `:not([hidden], [closing])`;
const lastTab = `:is(
	#tabbrowser-arrowscrollbox > tab:nth-last-child(2 of ${visible}),
	tab-group:not([collapsed]):nth-last-child(2 of ${visible}) >
			:nth-last-child(1 of :is(tab${visible}, .tab-group-label-container)),
	tab-group[collapsed]:nth-last-child(2 of ${visible}) > :is(
		:not([hasactivetab]) > .tab-group-label-container,
		[hasactivetab]:not([hasmultipletabs]) > [selected],
		[hasactivetab][hasmultipletabs] > .tab-group-overflow-count-container
	)
)`;
const adjacentNewTab = "#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button";
const dropOnItems = ":is(#home-button, #downloads-button, #bookmarks-menu-button, #personal-bookmarks)";
const dropOnItemsExt = "#TabsToolbar[tabs-dragging-ext] :is(#new-tab-button, #new-window-button)";
const menubarAutoHide = appVersion > 142 ? "[autohide]" : "[autohide=true]";
const shownMenubar = `#toolbar-menubar:is(:not([inactive]), :not(${menubarAutoHide}))`;
const tempMenubar = `#toolbar-menubar${menubarAutoHide}:not([inactive])`;
const hiddenMenubar = `#toolbar-menubar${menubarAutoHide}[inactive]`;
const topMostTabsBar = prefs.tabsAtBottom ?
		"#TabsToolbar:not(#TabsToolbar)" :
		`:root:is([tabsintitlebar], [customtitlebar]) ${hiddenMenubar} + #TabsToolbar`;
const nonTopMostTabsBar = prefs.tabsAtBottom ?
		"#TabsToolbar" :
		`#TabsToolbar:is(#toolbar-menubar:not(${menubarAutoHide}) + *, :root:not([tabsintitlebar], [customtitlebar]) *)`;
const hidePlaceHolder = "[customizing], [tabs-hide-placeholder]";
const showPlaceHolder = `:not(${hidePlaceHolder})`;
const tbDraggingHidePlaceHolder = ":is([tabs-dragging], [movingtab]):not([moving-positioned-tab])";
const staticPreTabsPlaceHolder = ":is([tabs-scrolledtostart], [pinned-tabs-wraps-placeholder])";
const autoHideBookmarksBar = Services.prefs.getStringPref("browser.toolbars.bookmarks.visibility") == "newtab";
const preTabsButtons = `:is(
	:root:not([privatebrowsingmode], [firefoxviewhidden]) :is(toolbarbutton, toolbarpaletteitem),
	:root[privatebrowsingmode]:not([firefoxviewhidden]) :is(toolbarbutton:not(#firefox-view-button), toolbarpaletteitem:not(#wrapper-firefox-view-button))
)`;

mainStyle.innerHTML = `
:root {
	--max-tab-rows: 1;
}

${[...Array(maxRows).keys()].slice(1).map(i => `
	@media (min-width: ${rSIF + rIE * i}px) {
		:root { --max-tab-rows: ${i + 1}; }
	}
`).join("\n")}

#navigator-toolbox {
	--tabs-moving-max-z-index: 0;
}

${_="#TabsToolbar"} {
	position: relative;
	--nav-toolbox-padding-top: 0px;
	--tabs-padding-top: 0px;
	--tabs-margin-top: 0px;
	--tabs-top-space: calc(var(--tabs-margin-top) + var(--tabs-padding-top));
	--space-before-tabs: ${prefs.spaceBeforeTabs}px;
	--space-after-tabs: ${prefs.spaceAfterTabs}px;
	--tabs-scrollbar-width: 0px;
	--tabs-scrollbar-visual-width: 0px;
	--tabs-item-opacity-transition: ${getComputedStyle($("[part=overflow-end-indicator]", arrowScrollbox.shadowRoot))
			.transition.match(/\d.+|$/)[0] || ".15s"};
	--tabs-placeholder-border-color: ${getComputedStyle(tabContainer).getPropertyValue("--tabstrip-inner-border")
			.match(/(?<=\dpx \w+ ).+|$/)[0] || "color-mix(in srgb, currentColor 25%, transparent)"};
	--tabs-placeholder-shadow: var(--tab-selected-shadow,
			${gBrowser.selectedTab && getComputedStyle($(".tab-background", gBrowser.selectedTab)).boxShadow || "none"});
	--tabs-placeholder-border-width: 1px;
	--tabs-placeholder-border: var(--tabs-placeholder-border-width) solid var(--tabs-placeholder-border-color);
	--tabs-placeholder-border-radius: ${prefs.floatingBackdropClip && prefs.tabsUnderControlButtons == 2 ? 0 : "var(--tab-border-radius)"};
	--tabs-placeholder-blurriness: ${prefs.floatingBackdropBlurriness}px;
	--tabs-placeholder-backdrop: ${!prefs.floatingBackdropClip && prefs.floatingBackdropBlurriness && prefs.floatingBackdropOpacity < 100 && !mica && !prefs.nativeWindowStyle ?
			`blur(var(--tabs-placeholder-blurriness))` : "none"};
	--tabs-placeholder-background-color: var(${appVersion == 115 ?
			(win7 && defaultDarkTheme ? "--tab-icon-overlay-fill"
					: (win8 && defaultTheme ? "--tab-selected-bgcolor, var(--lwt-selected-tab-background-color)"
							: "--lwt-accent-color")) :
			"--toolbox-bgcolor, var(--toolbox-non-lwt-bgcolor, var(--lwt-accent-color, var(--tab-selected-bgcolor, var(--lwt-selected-tab-background-color))))"});
}

${prefs.tabsAtBottom ? `
	#navigator-toolbox:not([tabs-hidden]) > #nav-bar > .titlebar-buttonbox-container {
		display: flex;
	}

	${_} {
		order: 1;
		z-index: 1;
	}

	#PersonalToolbar {
		${autoHideBookmarksBar || prefs.tabsAtBottom == 1 ? `
			order: 2;
		` : ``}

		${_}[movingtab] ~ & {
			pointer-events: none;

			${dropOnItems} {
				pointer-events: auto;
			}
		}
	}

	#nav-bar, #PersonalToolbar {
		background: inherit;
		color: var(--toolbox-textcolor);
		z-index: calc(var(--tabs-moving-max-z-index) + 2);

		:root[lwtheme] {
			background: none;
		}

		&:-moz-window-inactive {
			color: var(--toolbox-textcolor-inactive);
		}

		:root:is([tabsintitlebar], [customtitlebar]) & {
			&, #urlbar:popover-open {
				will-change: opacity;
				transition: opacity var(--inactive-window-transition);

				&:-moz-window-inactive {
					opacity: var(--inactive-titlebar-opacity);
				}
			}
		}
	}

	${_} :is(.titlebar-buttonbox-container, .titlebar-spacer, .private-browsing-indicator-with-label),
	#nav-bar .private-browsing-indicator-label {
		display: none;
	}

	:root[privatebrowsingmode=temporary] #navigator-toolbox #nav-bar .private-browsing-indicator-with-label {
		display: flex;
	}
` : ``}

@media (prefers-reduced-motion: reduce) {
	${_} {
		--tabs-item-opacity-transition: 0s;
	}
}

:root[sizemode=maximized] ${_} {
	--space-before-tabs: ${prefs.spaceBeforeTabsOnMaximizedWindow}px;
	--space-after-tabs: ${prefs.spaceAfterTabsOnMaximizedWindow}px;
}

${prefs.nativeWindowStyle ? `
	:root,
	${prefs.tabsAtBottom ? `
		#navigator-toolbox > toolbar${autoHideBookmarksBar ? ":not(#PersonalToolbar)" : ""},
	` : ``}
	#navigator-toolbox {
		background-color: transparent !important;
		border-top-color: transparent !important;
	}
` : ``}

${win7 || win8 ? `
	/*refer to browser-aero.css and browser-aero.css*/
	@media (-moz-windows-classic: 0) {
		${_=":root[sizemode=normal] " + hiddenMenubar + " + #TabsToolbar"} {
			--tabs-margin-top: 1px;
		}
	}
	${win7 ? `
		${_} {
			--tabs-padding-top: 4px;
		}
	` : ``}

	${!defaultTheme ? `
		${_} {
			--nav-toolbox-padding-top: 1px;
		}
	` : ``}
` : ``}

${_="#TabsToolbar .titlebar-spacer[type=pre-tabs]"} {
	width: var(--space-before-tabs);
}

${prefs.spaceBeforeTabsOnMaximizedWindow ? `
	:root[sizemode=maximized] ${_} {
		display: flex;
	}
` : ""}

#TabsToolbar .titlebar-spacer[type=post-tabs] {
	width: var(--space-after-tabs);
}

${prefs.compactControlButtons || win7 || win8 ? `
	.titlebar-buttonbox-container {
		align-self: start !important;
		height: auto !important;
	}

	:root:is([tabsintitlebar], [customtitlebar]) #navigator-toolbox:not([tabs-hidden]) > #toolbar-menubar${menubarAutoHide} {
		min-height: 0;
	}
` : ""}

#TabsToolbar-customization-target {
	align-items: ${prefs.tabsbarItemsAlign};
}

#TabsToolbar > :not(${_=".toolbar-items, .toolbarbutton-1"}) {
	align-self: stretch;
	height: calc(var(--tab-height) + var(--tabs-top-space));
	max-height: calc(var(--tab-height) + var(--tabs-top-space));
}

#TabsToolbar > :is(${_}) {
	margin-top: var(--tabs-top-space);
}

#TabsToolbar > .titlebar-buttonbox-container,
#TabsToolbar .toolbarbutton-1 {
	height: calc(var(--tab-height) - var(--tabs-navbar-shadow-size, 0px)); /*fx 115*/
}

#TabsToolbar #TabsToolbar-customization-target > :not(#tabbrowser-tabs, .toolbarbutton-1) {
	height: var(--tab-height);
	max-height: var(--tab-height);
}

${!prefs.autoCollapse ? `
	${adjacentNewTab} {
		align-self: end;
	}
` : ``}

${_="#tabbrowser-tabs"} {
	--gap-after-pinned: ${prefs.gapAfterPinned}px;
	--tab-animation: ${prefs.animationDuration}ms ${debug > 1 ? "ease" : "var(--animation-easing-function)"};
	--tab-max-width: max(${prefs.tabMaxWidth}px, var(--calculated-tab-min-width, 0));
	--tabstrip-padding: 0px;
	--tabstrip-border-width: 0px;
	--tabstrip-border-color: transparent;
	--tabstrip-border: var(--tabstrip-border-width) solid var(--tabstrip-border-color);
	--tabstrip-size: calc(var(--tabstrip-padding) * 2 + var(--tabstrip-border-width));
	${appVersion < 132 ? `
		--tab-overflow-clip-margin: 2px;
		--tab-inline-padding: 8px;
	` : ``}

	--tab-overflow-pinned-tabs-width: 0px;
	padding-inline-start: calc(var(--tab-overflow-pinned-tabs-width) + var(--tabstrip-padding)) !important;
}

${preTabsButtons} ~ ${_} {
	--tabstrip-padding: 2px;
}

${prefs.autoCollapse ? `
	#navigator-toolbox,
	#navigator-toolbox :has(${_}) {
		z-index: calc(1/0) !important;
		position: relative !important;
	}

	${context=`:root:not([style*="--tab-scroll-rows: 1;"])`} ${_}:not(:hover, [dragging]) {
		height: var(--tab-height);
	}

	${context} ${_} :is(tab, tab-group > *) {
		--adjacent-newtab-button-adjustment: 0px !important;
	}

	${context} #TabsToolbar {
		max-height: calc(var(--tab-height) + var(--tabs-padding-top) + var(--tabs-margin-top));
		align-items: start;
	}

	${context} #TabsToolbar:has(${_}:is(:hover, [dragging])) {
		opacity: 1 !important;
	}

	${_} {
		/*ensure the transitionstart/end will be fired*/
		--transition-delay-after: ${Math.max(prefs.autoCollapseDelayCollapsing, 1)}ms;
		--transition-delay-before: ${Math.max(prefs.autoCollapseDelayExpanding, 1)}ms;
		will-change: margin-bottom, height;
		height: var(--tab-height);
		outline: 1px solid transparent !important;
	}

	:root:not([multitabrows-applying-style]) ${_} {
		transition: var(--tab-animation) var(--transition-delay-after);
		transition-property: background-color, height, margin-bottom, outline,
				border-color, box-shadow, border-radius, color, text-shadow;
	}

	${context} ${_}:is(:hover, [dragging]) {
		margin-bottom: calc((var(--tab-scroll-rows) - 1) * var(--tab-height) * -1);
		height: calc(var(--tab-scroll-rows) * var(--tab-height));
		padding-bottom: 0;
		outline: 1px solid var(--arrowpanel-border-color) !important;
		border-color: transparent;
		background-color: var(--toolbar-field-focus-background-color);
		box-shadow: 0 2px 14px rgba(0, 0, 0, 0.13);
		border-radius: var(--toolbarbutton-border-radius);
		border-start-end-radius: 0;
		border-end-end-radius: 0;
		transition-delay: var(--transition-delay-before);
		color: var(--toolbar-field-focus-color);
		text-shadow: none;
	}

	${context} ${_}:is(:hover, [dragging]) #tabbrowser-arrowscrollbox {
		transition: scrollbar-color var(--tab-animation) var(--transition-delay-before);
		scrollbar-color: currentColor
				color-mix(in oklab, currentColor 20%, var(--toolbar-field-focus-background-color));
	}

	${context} .tab-background {
		--lwt-header-image: none;
	}

	${context} ${_} :is(.tab-content:is([selected], [multiselected]), .tab-group-overflow-count) {
		transition: color var(--tab-animation) var(--transition-delay-after);
	}

	${context} ${_}:is(:hover, [dragging])
			:is(.tab-content:is([selected], [multiselected]), .tab-group-overflow-count) {
		transition-delay: var(--transition-delay-before);
		color: inherit;
	}

	${context} ${_}[temp-open] #tabbrowser-arrowscrollbox::part(scrollbox) {
		padding-bottom: var(--temp-open-padding, 0px);
	}

	@media (-moz-overlay-scrollbars) {
		${context} #TabsToolbar:not([tabs-scrollbar-hovered]) ${_}:is(:hover, [dragging]) {
			border-start-end-radius: var(--toolbarbutton-border-radius);
			border-end-end-radius: var(--toolbarbutton-border-radius);
		}
	}

	${context} ${_}[has-temp-scrollbar]:not(:is([tabmousedown], [dragging])[overflow])
			#tabbrowser-arrowscrollbox::part(scrollbox) {
		overflow-y: scroll;
	}

	${context} ${_}:is(:hover, [dragging], [has-temp-scrollbar]) #tabs-newtab-button {
		display: none;
	}

	${context} ${_}[hasadjacentnewtabbutton] ~ #new-tab-button {
		display: flex;
	}
` : ``}

/*ui.prefersReducedMotion = 1*/
@media (prefers-reduced-motion: reduce) {
	#tabbrowser-tabs {
		--tab-animation: 0s;
	}
}

${_="#tabbrowser-arrowscrollbox"}[orient] {
	position: relative;
	min-width: 1px; /*fx143+*/
	scrollbar-color:
			${
				prefs.scrollbarThumbColor == "auto" ?
				(
					root.style.getPropertyValue("--toolbarbutton-icon-fill") ?
					"var(--toolbarbutton-icon-fill)" :
					"var(--toolbar-color)"
				) :
				prefs.scrollbarThumbColor
			}
			${
				prefs.scrollbarTrackColor == "auto" ?
				(
					win7 && defaultDarkTheme ?
					"var(--tab-icon-overlay-fill)" :
					"var(--toolbar-bgcolor)"
				) :
				prefs.scrollbarTrackColor
			};
}

/*ensure the new tab button won't be wrapped to the new row in any case*/
${(() => {
	let css = `
		${CSS.supports("selector(:has(*))") ? `
			${_}:has(
				.tabbrowser-tab:is(
					${_} > *
				):nth-child(
					1 of :not([hidden])
				):nth-last-child(
					1 of :not([hidden], ${_}-periphery)
				)
			)::part(items-wrapper) {
				flex-wrap: nowrap;
			}
		` : `
			/*do not limit the box width when [positionpinnedtabs] as it needs to let the box
			  be narrow enough to trigger the deactivation of positioning*/
			#tabbrowser-tabs[hasadjacentnewtabbutton]:not([positionpinnedtabs]) ${_} {
				/*list out all possible things in case they are shown and their size is non zero*/
				min-width: calc(var(--tabstrip-size) + var(--calculated-tab-min-width) + var(--new-tab-button-width) + var(--tabs-scrollbar-width)) !important;
			}
		`}
	`;
	return prefs.tabsUnderControlButtons ? `
		@media ${singleRow} {
			${css}
		}
	` : css;
})()}

${!CSS.supports("selector(:has(*))") ? `
	@media ${singleRow} {
		/*in single row mode, they are wrapped to new line once the box overflows,
		  hide them to underflow the box*/
		${_}[overflowing]::part(items-wrapper)::before,
		${_}[overflowing]::part(items-wrapper)::after,
		${_}[overflowing] #tabbrowser-arrowscrollbox-periphery {
			visibility: collapse;
		}
	}
` : ``}

/*do not limit the box width when [positionpinnedtabs]*/
#tabbrowser-tabs:not([positionpinnedtabs])[overflow] ${_} {
	min-width: calc(var(--calculated-tab-min-width) + var(--tabs-scrollbar-width)) !important;
}

.tab-drop-indicator {
	transition: transform var(--tab-animation);
	z-index: calc(1/0);
}

/*use the start and end indicators for the hint of left and right edges when moving multiple tabs*/
${_}::part(overflow-start-indicator),
${_}::part(overflow-end-indicator) {
	opacity: 0;
	visibility: visible;
	pointer-events: none;
	width: 7px;
	background-image: radial-gradient(ellipse at bottom,
					  rgba(0,0,0,0.1) 0%,
					  rgba(0,0,0,0.1) 7.6%,
					  rgba(0,0,0,0) 87.5%);
	background-repeat: no-repeat;
	background-position: -3px;
	border-left: .5px solid rgba(255,255,255,.2);
	position: relative;
	border-bottom: .5px solid transparent;
	z-index: calc(var(--tabs-moving-max-z-index) + 4);
	margin-inline: ${RTL_UI ? ".5px -7.5px" : "-.5px -6.5px"};
}

${_}::part(overflow-end-indicator) {
	margin-inline: ${RTL_UI ? "-6.5px -.5px" : "-7.5px .5px"} !important;
}

#tabbrowser-tabs:not([dragging])[overflow] ${_}::part(overflow-end-indicator) {
	translate: calc(var(--tabs-scrollbar-width) * -1 * ${DIR});
}

${context="#tabbrowser-tabs:is([multirows], [overflow])[movingtab]:not([moving-positioned-tab], [moving-single-tab], [animate-finishing])"}
		${_}::part(overflow-start-indicator),
${context}
		${_}::part(overflow-end-indicator) {
	opacity: 1;
}

#tabbrowser-tabs[positionpinnedtabs] ${_}::part(overflow-start-indicator) {
	translate: calc(var(--gap-after-pinned) * ${DIR});
}

/*display the up and down buttons at the top and bottom edges for scrolling while dragging*/
${_}::part(scrollbutton-up),
${_}::part(scrollbutton-down) {
	--border: 1px;
	--height: min(${prefs.scrollButtonsSize}px, var(--tab-height) / 2);
	/*the 15px is hardcoded in tabs.css*/
	--extra-drag-space: -15px;
	position: absolute;
	inset-inline: 0 var(--tabs-scrollbar-width);
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
	padding: 0 !important;
	opacity: 0 !important;
	pointer-events: none;
	height: max(var(--height), var(--border) * 2);
	border: var(--tabs-placeholder-border) !important;
	border-radius: calc(var(--tabs-placeholder-border-radius) / 2);
	backdrop-filter: blur(var(--tabs-placeholder-blurriness));
	background: color-mix(in srgb, var(--tabs-placeholder-border-color) 50%, transparent) !important;
	align-items: safe center;
}

${context=":root:not([multitabrows-applying-style])"} ${_}::part(scrollbutton-up),
${context} ${_}::part(scrollbutton-down) {
	transition: opacity var(--tabs-item-opacity-transition);
}

${_}[highlight]::part(scrollbutton-down) {
	--color: var(--attention-dot-color, var(--tab-attention-icon-color));
	opacity: 1 !important;
	background: var(--color) !important;
}

${_}[highlight]::part(scrollbutton-down-icon) {
	color: var(--color);
	filter: invert(1) grayscale(1);
}

${_}::part(scrollbutton-up-icon),
${_}::part(scrollbutton-down-icon) {
	rotate: calc(90deg * ${DIR});
	margin: -4px 0;
	object-fit: none;
}

${_}::part(scrollbutton-up)::before,
${_}::part(scrollbutton-down)::before {
	content: "";
	position: absolute;
	inset: 0;
}

@media ${singleRow} {
	${_}::part(scrollbutton-up),
	${_}::part(scrollbutton-down) {
		--height: min(${prefs.scrollButtonsSize}px * 4 / 5, var(--tab-height) / 3);
	}
}

${_}::part(scrollbutton-up)::before,
${_}::part(scrollbutton-down)::before {
	top: var(--extra-drag-space);
}

${_}::part(scrollbutton-down) {
	bottom: 0;
	scale: 1 -1;
}

${_}::part(scrollbutton-down-icon) {
	transform: none;
}

${context="#tabbrowser-tabs[positionpinnedtabs]"} ${_}::part(scrollbutton-up),
${context} ${_}::part(scrollbutton-down) {
	margin-inline-start: var(--gap-after-pinned);
	z-index: calc(1/0);
}

${context="#tabbrowser-tabs[overflow][dragging]:not([moving-positioned-tab])"}
		${_}:not([lockscroll]):not([scrolledtostart])::part(scrollbutton-up),
${context}
		${_}:not([lockscroll]):not([scrolledtoend])::part(scrollbutton-down) {
	pointer-events: auto;
	${!prefs.hideScrollButtonsWhenDragging ? `
		opacity: 1 !important;
	` : ``}
}

${_}::part(scrollbox) {
	align-items: start;
	overflow: hidden auto;
	max-height: calc(var(--tab-height) * var(--max-tab-rows));
	scroll-snap-type: both mandatory;
	${prefs.thinScrollbar ? `
		scrollbar-width: thin;
` : ""}
}

${!prefs.inlinePinnedTabs ? `
	#tabbrowser-tabs[positionpinnedtabs] ${_}::part(scrollbox) {
		/*padding cause inconsistent width result*/
		padding-inline: 0 !important;
		margin-inline-start: var(--gap-after-pinned);
	}
` : ``}

/*avoid the native drag scroll behavior*/
#tabbrowser-tabs${condition="[overflow]:is([dragging], [tabmousedown])"} ${_}::part(scrollbox) {
	overflow-y: hidden;
}

#tabbrowser-tabs:not(${condition}) ${_}::part(fake-scrollbar) {
	visibility: collapse;
}

${_}::part(fake-scrollbar) {
	height: calc(var(--tab-height) * var(--tab-rows));
	width: calc(var(--tabs-scrollbar-width) + 1px);
	margin-inline-start: -1px;
}

${_}::part(fake-scrollbar)::before {
	content: "";
	height: calc(var(--slot-height) + var(--temp-open-padding, 0px));
	width: 1px;
}

${_}::part(items-wrapper) {
	flex-wrap: wrap;
	min-height: var(--slot-height, var(--tab-height));
	min-width: var(--slot-width, 1px); /*ensure it is visible and able to make the scrollbox overflow*/
	align-items: end;
	align-content: start;
	transition: padding-bottom var(--tab-animation);
	/*fx115*/
	display: flex;
	flex: 1 0 0;
}

${prefs.justifyCenter ? `
	${prefs.justifyCenter == 1 ? "#tabbrowser-tabs:not([multirows], [overflow])" : ""}
	${_}::part(items-wrapper) {
			justify-content: safe center;
	}
` : ``}

/*avoid any weird stuff going out of bounds and causing the scrollbox to overflow*/
${_}:not([scrollsnap])::part(items-wrapper),
/*when dragging tab outside the boundary, it makes the slot not expand*/
#tabbrowser-tabs[movingtab] ${_}::part(items-wrapper) {
	overflow: hidden;
}

#tabbrowser-tabs[animate-finishing] ${_}::part(items-wrapper) {
	pointer-events: none;
}

${_=".tabbrowser-tab"}, .tab-group-label-container, .tab-group-overflow-count-container {
	/*snap to end but not start as the first row may be occupied by the inline placeholder*/
	scroll-snap-align: end;
	margin-inline-end: var(--adjacent-newtab-button-adjustment, 0px) !important;
}

#tabbrowser-tabs[orient] .tab-group-overflow-count-container {
	height: var(--tab-height);
	margin-inline-end: var(--adjacent-newtab-button-adjustment, 0px) !important;
	-moz-window-dragging: no-drag;

	[movingtab] tab-group[collapsed][hasmultipletabs][hasactivetab] > & {
		display: flex;
	}

	&::after {
		inset-inline-end: var(--group-line-padding) !important;
	}

	.tab-group-overflow-count {
		height: inherit;
		padding-inline-end: calc(var(--space-small) + var(--group-line-padding));
		align-content: center;
	}
}

[positionpinnedtabs] ${_}[pinned] {
	position: absolute !important; /*fx141*/
	top: 0;
	inset-inline-start: 0;
	z-index: 1;
}

${_}:not([pinned])[fadein] {
	max-width: var(--tab-max-width);
	/*make the animate smoother when opening/closing tab*/
	padding: 0;
}

/* fx143+ win over the fx default rule*/
#tabbrowser-tabs[orient] tab-group[movingtabgroup][collapsed][hasactivetab] > ${_}[visuallyselected] {
	max-width: var(--tab-max-width) !important;
	min-width: var(--calculated-tab-min-width) !important;
}

${_}:not([pinned])::before, ${_}:not([pinned])::after {
	content: "";
	width: var(--tab-overflow-clip-margin);
	flex-shrink: 0;
}

${_}[closing],
#tabbrowser-tabs[orient] tab-group[collapsed] > ${_}[closing] {
	max-width: .1px !important;
    min-width: .1px !important;
	margin-inline-start: -.1px !important;
}

${_}[closing] .tab-stack {
	overflow: hidden;
}

${_}:not([pinned]) .tab-content {
	padding: 0;
}

${_}:not([pinned]) .tab-content::before,
${_}:not([pinned]) .tab-content::after {
	content: "";
	width: var(--tab-inline-padding);
	flex-shrink: 0;
}

/* for tabs with audio button, fix the size and display the button like pinned tabs */
#tabbrowser-tabs[orient] ${_}[fadein]:is([muted], [soundplaying], [activemedia-blocked]):not([pinned]) {
	min-width: var(--calculated-tab-min-width);

	&[mini-audio-button] {
		&:has(.tab-icon-image:not([src], [crashed], [sharing], [pictureinpicture], [busy])) .tab-icon-overlay {
			display: none;
		}

		&:has(.tab-icon-image:is([src], [crashed], [sharing], [pictureinpicture], [busy])) {
			--tab-icon-end-margin: 5.5px;

			.tab-audio-button {
				display: none !important;
			}
		}
	}
}

#tabbrowser-tabs:not([movingtab]) ${_} {
	transition: none;
}

#tabbrowser-tabs[orient] .tab-group-overflow-count-container:is(
	[animate-shifting],
	[movingtabgroup] > *
) {
	--width-rounding-diff: 0px;
	--height-rounding-diff: 0px;

	.tab-group-overflow-count {
		margin-left: var(--width-rounding-diff);
		margin-top: var(--height-rounding-diff);
		padding-right: calc(var(--space-small) - var(--width-rounding-diff) + ${RTL_UI ? "0px" : "var(--group-line-padding)"});
	}

	&::after {
		right: calc(${RTL_UI ? "0px" : "var(--group-line-padding)"} - var(--width-rounding-diff)) !important;
	}
}

/*firefox bug, :active doesn't work on dragging*/
#tabbrowser-tabs[movingtab]:not([moving-tabgroup]) ${_}[fadein][selected]:not([animate-shifting]),
#tabbrowser-tabs[movingtab] [movingtabgroup] > :not([animate-shifting]) {
	transition: none !important;
}

#tabbrowser-tabs:not([movingtab]) tab-group .tabbrowser-tab[fadein] {
	transition: none;
}

/*firefox bug, transition is still set on grouped tabs*/
@media (prefers-reduced-motion: reduce) {
	tab-group .tabbrowser-tab {
		transition: none !important;
	}
}

[animate-shifting] .tab-content {
	overflow: hidden;
}

[animate-shifting] :is(.tab-stack, .tab-group-line) {
	will-change: margin-inline-end;
}

[animate-shifting=start] {
	--x: 0px;
	--y: 0px;
	--w: 0px;
	z-index: 1;
	transition: none !important;
	translate: var(--x) var(--y);

	& .tab-group-line,
	&:is(.tab-group-label-container, .tab-group-overflow-count-container)::after {
		translate: calc(var(--x) * -1) calc(var(--y) * -1) -1px;
		margin-inline-end: var(--w);
	}
}

[animate-shifting=start] .tab-stack {
	margin-inline-end: calc(var(--w) * -1);
}

[movingtabgroup] > :is(.tab-group-label-container, tab, .tab-group-overflow-count-container),
#tabbrowser-tabs:not([moving-tabgroup], [moving-pinned-tab]) .tabbrowser-tab:not([pinned]):is([selected], [multiselected]):is(
	[movingtab] *,
	[animate-shifting]
),
[moving-pinned-tab] .tabbrowser-tab[pinned]:is([selected], [multiselected]) {
	--translate-x: 0px;
	--translate-y: 0px;
	transform: translate(var(--translate-x), calc(var(--translate-y) + var(--scroll-top, 0px)));

	.tab-group-line,
	&:is(.tab-group-label-container, .tab-group-overflow-count-container)::after {
		transform: translate3d(calc(var(--translate-x) * -1), calc(var(--translate-y) * -1 - var(--scroll-top, 0px)), -1px);
	}

	&:is(.tab-group-label-container, .tab-group-overflow-count-container) {
		transform-style: preserve-3d;
	}
}

.tabbrowser-tab:is(
	:is(:not([collapsed]), [toggling]) > *,
	[collapsed][hasactivetab] > [selected],
	[closing]
):is(
	#tabbrowser-tabs[movingtab]:not([moving-tabgroup], [moving-pinned-tab]) :is([selected], [multiselected]),
	[movingtabgroup] > *,
	[animate-shifting]
) {
	--width-rounding-diff: 0px;
	--height-rounding-diff: 0px;

	overflow: visible;

	.tab-background {
		transform-style: preserve-3d;
	}

	#tabbrowser-tabs[orient] & .tab-group-line {
		/*add 1px more to advoid any gap due to missing the compenstate for rounding offset*/
		/*generally it should be handled but it is difficult to guarantee*/
		tab-group:not([fadein]) & {
			inset-inline-start: calc(-1 * var(--tab-overflow-clip-margin) - 1px);
		}

		/*preserve-3d makes the positioning origin shifted*/
		inset-block-end: calc(var(--tab-group-line-toolbar-border-distance) - var(--tab-block-margin));
	}
}

${condition= `.tabbrowser-tab:is(
	:is(:not([collapsed]), [toggling]) > *,
	[hasactivetab] > [selected]
):is(
	#tabbrowser-tabs[movingtab]:not([moving-tabgroup], [moving-pinned-tab]) :is([selected], [multiselected]),
	[movingtabgroup] > *,
	[animate-shifting]
)`} .tab-stack > * {
	margin-right: calc(var(--width-rounding-diff) * -1) !important;
	margin-bottom: calc(var(--height-rounding-diff) * -1) !important;
	transform-style: preserve-3d;
}

${condition} .tab-background {
	margin-bottom: calc(var(--tab-block-margin) - var(--height-rounding-diff)) !important;
}

${condition} .tab-label-container {
	margin-bottom: var(--height-rounding-diff) !important;
}

[animate-shifting=run],
[animate-shifting=run] :is(.tab-stack, .tab-group-line),
[animate-shifting=run]:is(.tab-group-label-container, .tab-group-overflow-count-container)::after {
	transition: var(--tab-animation) !important;
	transition-property: none !important;
}

[animate-shifting=run] {
	transition-property: translate !important;
}

[animate-shifting=run] :is(.tab-stack, .tab-group-line) {
	transition-property: translate, margin-inline !important;
}

[animate-shifting=run]:is(.tab-group-label-container, .tab-group-overflow-count-container)::after {
	transition-property: translate !important;
}

[animate-finishing] [movingtabgroup]
		[animate-shifting=run],
[animate-finishing] [movingtabgroup]
		[animate-shifting=run]:is(.tab-group-label-container, .tab-group-overflow-count-container)::after,
#tabbrowser-tabs:not([movingtab]) :not(tab-group[toggling]) > [animate-shifting=run] {
	--transition-property: translate, transform;
	transition-property: var(--transition-property) !important;

	tab-group[fadein] & {
		--transition-property: translate !important;
	}

	& .tab-group-line {
		transition-property: var(--transition-property), margin-inline !important;
	}
}

tab-group[toggling] {
	pointer-events: none;

	.tabbrowser-tab {
		transition-property: translate !important;

		tab-group[collapsed] &:not([hasactivetab] > [selected]) {
			.tab-stack {
				overflow: hidden;
			}

			.tab-group-line {
				visibility: collapse;
			}
		}

		tab-group:not([collapsed]) &,
		[collapsed][hasactivetab] > &[selected] {
			overflow: visible;
		}

		/*TODO group line expands and shrinks a little when expanding group*/
	}
}

/*firefox bug*/
.tab-group-line {
	/*last tab in group is not defined properly*/
	#tabbrowser-tabs[orient] & {
		${_}:not(:has(~ tab:not([hidden])), [hasactivetab][hasmultipletabs][collapsed] > [selected]) > .tab-stack > .tab-background > & {
			inset-inline-end: 0;
			border-start-end-radius: calc(var(--tab-group-line-thickness) / 2);
			border-end-end-radius: calc(var(--tab-group-line-thickness) / 2);
		}
	}

	#tabbrowser-tabs[movingtab] ${_}:is([selected], [multiselected]) > .tab-stack > .tab-background > & {
		--dragover-tab-group-color: var(--tab-group-color);
		--dragover-tab-group-color-invert: var(--tab-group-color-invert);

		/* the color of the multiselected active tab is overrided by the inverted one */
		tab-group[collapsed] & {
			background-color: var(--tab-group-line-color);
		}

		${_}:has(~ tab:not([hidden])) & {
			border-radius: 0;
		}

		${_}:not(:has(~ tab:not([hidden]))) & {
			border-start-start-radius: 0;
			border-end-start-radius: 0;
		}
	}
}

#tabbrowser-tabs:is([movingtab-createGroup], [movingtab-group]) [pinned] .tab-background[multiselected] {
	outline: var(--tab-outline);
	outline-color: var(--focus-outline-color);
	outline-offset: var(--tab-outline-offset);
}

/*make moving pinned tabs above the selected normal tabs*/
#tabbrowser-tabs[moving-positioned-tab] > #tabbrowser-arrowscrollbox >
		${_}[pinned]:is([selected], [multiselected]) {
	z-index: 3;
}


@media ${prefs.tabsUnderControlButtons == 2 ? multiRows : "screen"} {
	${context=`#TabsToolbar:not([customizing])
			#tabbrowser-tabs:not([ignore-newtab-width])${prefs.tabsUnderControlButtons < 2 ? ":not([overflow])" : ""}[hasadjacentnewtabbutton]`}
					${lastTab},
	${context} :is(${lastTab}, tab-group:has(${lastTab})) ~ [closing] {
		--adjacent-newtab-button-adjustment: var(--new-tab-button-width);

		/*shift tabs to prevent the animation run at wrong position*/
		tab-group[collapsed] & {
			& ~ :nth-child(1 of .tabbrowser-tab:not([hidden], [closing])) {
				margin-inline-start: calc(var(--new-tab-button-width) * -1) !important;
			}

			& ~ :nth-last-child(1 of .tabbrowser-tab:not([hidden], [closing])) {
				margin-inline-end: var(--new-tab-button-width) !important;
			}
		}

		/*TODO emtpy group?*/
	}

	${context} :is(${lastTab}, tab-group:has(${lastTab})) ~ [closing] {
		margin-inline-start: calc(var(--new-tab-button-width) * -1 - .1px) !important;

		tab-group[collapsed] &:not(
			:nth-child(1 of .tabbrowser-tab:not([hidden])),
			:nth-last-child(1 of .tabbrowser-tab:not([hidden]))
		) {
			--adjacent-newtab-button-adjustment: 0px;
			margin-inline-start: -.1px !important;
		}
	}
}

#tabbrowser-tabs[forced-overflow] ${lastTab} {
	--adjacent-newtab-button-adjustment: var(--forced-overflow-adjustment) !important;
}


/*move the margin-start to the last pinned, so that the first normal tab won't
  have a weird margin on the left when it is wrapped to new row. these importants are necessary here */
#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
		${_}:nth-child(1 of :not([pinned], [hidden])) {
	margin-inline-start: 0 !important;
}

#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
		:nth-last-child(1 of [pinned]:not([hidden])):not(:nth-last-child(1 of :is(${_}:not([hidden], [closing]), tab-group))) {
	margin-inline-end: var(--gap-after-pinned) !important;
}

/*exclude the pinned tabs since they may have the attribute when newly pinned*/
${context="#tabbrowser-tabs[closebuttons=activetab]"}[orient] ${_}:not([pinned])[closebutton] .tab-close-button:not([selected]),
/*fx 115*/
${context} > #tabbrowser-arrowscrollbox > ${_}:not([pinned])[closebutton] > .tab-stack > .tab-content > .tab-close-button:not([selected=true]) {
	display: flex;
}

/*bug fix for fx*/
:root[uidensity=touch] #tabbrowser-tabs[orient]
		${_}:not([pinned], [fadein]) {
	max-width: .1px;
	min-width: .1px;
}

#tabbrowser-tabs${condition="[ignore-newtab-width]"}:not([overflow]) #tabbrowser-arrowscrollbox-periphery {
	margin-inline-end: calc(var(--new-tab-button-width) * -1);
}

${condition}:not([multirows]) #tabs-newtab-button {
	visibility: hidden;
}

#tabbrowser-tabs:not(${condition}) #tabs-newtab-button {
	margin-inline-start: calc(var(--new-tab-button-width) * -1) !important;
}

.closing-tabs-spacer {
	transition: none !important;
}

/*add [id] to win over the default rule*/
#tabbrowser-tabs[orient] > #pinned-drop-indicator[id] {
	--background-opacity: 50%;
	display: flex;
	width: var(--tab-min-height);
	height: var(--tab-min-height);
	align-items: center;
	position: absolute;
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
	top: 0;
	inset-inline-start: calc(var(--pre-tabs-items-width) + var(--tabstrip-size));
	margin: var(--tab-block-margin) var(--tab-overflow-clip-margin);
	padding-inline: var(--space-small);
	opacity: 0;
	transition: var(--tabs-item-opacity-transition) !important;
	transition-property: opacity, box-shadow, background-color !important;
	pointer-events: none;
	border-radius: var(--border-radius-small);
	background: color-mix(in srgb, color-mix(in oklab, currentColor 12%, var(--toolbox-bgcolor)) var(--background-opacity), transparent);
	backdrop-filter: blur(1px);

	[tabs-scrolledtostart] &[visible] {
		opacity: 1;
	}

	&[interactive] {
		--background-opacity: 100%;
		box-shadow: var(--tab-selected-shadow);
	}
}

tab-group {
	--group-line-padding: 3px;
}

#tabbrowser-tabs[orient] .tab-group-label-container {
	height: var(--tab-height);
	padding-inline: var(--group-line-padding);
	margin-inline-start: 0;

	tab-group:is(:not([collapsed]), [hasactivetab]) & {
		/* fx143+ win over the fx default rule*/
		&[class][class]::after {
			height: var(--tab-group-line-thickness);
			inset: auto 0 var(--tab-group-line-toolbar-border-distance) var(--group-line-padding);
			border-start-start-radius: 1px;
			border-end-start-radius: 1px;

			pointer-events: none;
		}

		tab-group:not(:has(.tabbrowser-tab:not([hidden]))) &::after {
			inset-inline-end: var(--group-line-padding);
		}
	}
}

.tab-group-label {
	&::before {
		content: "";
		display: block;
		position: absolute;
		inset: 0;
		-moz-window-dragging: no-drag;
	}

	:is([animate-shifting], [movingtabgroup]) & {
		margin-right: calc(var(--width-rounding-diff) * -1);

		&:not([overflow]) {
			text-overflow: clip;
		}

		&::after {
			content: "";
			margin-right: var(--width-rounding-diff);
		}
	}
}

${prefs.tabsUnderControlButtons ? `
	:root {
		--multirows-background-position: var(--lwt-background-alignment);
	}

	:root[lwtheme-image] {
		--multirows-background-position: right top, var(--lwt-background-alignment);
	}

	/*the backdrop-filter breaks if the tabs toolbar doesn't have a opaque background and
	  the window inactive opacity is applying*/
	:root:is([tabsintitlebar], [customtitlebar]) :is(#titlebar, .browser-titlebar) {
		background: inherit;
	}

	:root:is([tabsintitlebar], [customtitlebar])[lwtheme] #navigator-toolbox {
		background-attachment: fixed;
		background-position: var(--multirows-background-position);
	}

	${_="#TabsToolbar"} {
		--post-tabs-clip-reserved: 0px;
		--scrollbar-clip-reserved: 0px;
		--control-box-reserved-height: 0px;
		--control-box-reserved-width: 0px;
		--control-box-margin-end: 0px;
		--control-box-radius-start: 0px;
		--control-box-radius-end: 0px;
		--control-box-clip-scrollbar: ${mica ? "0px" : "var(--control-box-reserved-height)"};
		--control-box-clip-scrollbar-reserved: var(--scrollbar-clip-reserved);
		/*3px is calculated from --box-shadow-tab*/
		--tab-shadow-size: var(--tab-selected-shadow-size, var(--tab-shadow-max-size, 3px));
	}

	@media (-moz-overlay-scrollbars) {
		${_}[tabs-scrollbar-hovered] {
			--scrollbar-clip-reserved: var(--tabs-scrollbar-visual-width);
		}
	}

	${mica ? `
		@media not (-moz-overlay-scrollbars) {
			${_}:has(.titlebar-close:not(:hover)) {
				--control-box-clip-scrollbar-reserved: var(--tabs-scrollbar-visual-width);
			}
		}
	` : ``}

	${_}[tabs-scrolledtostart] {
		--post-tabs-clip-reserved: calc(var(--tab-shadow-size) - var(--tab-overflow-clip-margin, 2px));
	}

	${_}:-moz-window-inactive {
		--tabs-placeholder-background-color: var(${appVersion == 115 ?
				(win7 && defaultDarkTheme ? "--tab-icon-overlay-fill"
						: (win8 && defaultTheme ? "--tab-selected-bgcolor, var(--lwt-selected-tab-background-color)"
								: "--lwt-accent-color-inactive, var(--lwt-accent-color)")) :
				"--toolbox-bgcolor-inactive, var(--toolbox-non-lwt-bgcolor-inactive, var(--lwt-accent-color-inactive, var(--tab-selected-bgcolor, var(--lwt-selected-tab-background-color))))"});
	}

	${micaEnabled && accentColorInTitlebarMQ.matches && defaultAutoTheme || prefs.nativeWindowStyle ? `
		${_} {
			--tabs-placeholder-background-color: ActiveCaption;
		}
		${_}:-moz-window-inactive {
			--tabs-placeholder-background-color: InactiveCaption;
		}
	` : ``}

	${mica ? `
		/*the colors should be replaced by variables (if exist)*/
		${_} {
			--tabs-placeholder-background-color: #DADADA;
		}
		${_}:-moz-window-inactive {
			--tabs-placeholder-background-color: #E8E8E8;
		}
		@media (prefers-color-scheme: dark) {
			${_} {
				--tabs-placeholder-background-color: #0A0A0A;
			}
			${_}:-moz-window-inactive {
				--tabs-placeholder-background-color: #202020;
			}
		}
	` : ``}

	${_ += showPlaceHolder}[tabs-dragging] .titlebar-buttonbox-container {
		pointer-events: none;
	}

	${_} #TabsToolbar-customization-target {
		align-items: start;
	}

	/*shift the post items to make them not cover the scrollbar, when there are no inline control buttons*/
	${nonTopMostTabsBar}[tabs-overflow] {
		padding-inline-end: var(--tabs-scrollbar-width);
	}

	@media ${multiRows} {
		/*raise the items to cover the placeholder*/
		${context=`${_}:not(${condition=tbDraggingHidePlaceHolder})`} >
				:not(.toolbar-items),
		${context}
				#TabsToolbar-customization-target > :not(#tabbrowser-tabs) {
			z-index: calc(var(--tabs-moving-max-z-index) + 2);
		}

		/*raise the tabs to cover the items when dragging*/
		${context = _ + condition} #tabbrowser-tabs {
			z-index: 1;
		}

		/*raise the items that can be dropped on to cover the tabs when dragging*/
		${context} ${_=dropOnItems},
		${dropOnItemsExt} {
			z-index: calc(var(--tabs-moving-max-z-index) + 2);
		}

		${context}:not([tabs-scrolledtostart]) :is(${_}, ${dropOnItemsExt}:not(${adjacentNewTab})):is(#tabbrowser-tabs ~ *, #TabsToolbar:not([pinned-tabs-wraps-placeholder]) *)
				:is(.toolbarbutton-1 .toolbarbutton-icon, .toolbarbutton-badge-stack, #PlacesToolbar) {
			${floatingButtonStyle = `
				border-radius: var(--tab-border-radius);
				box-shadow: var(--tabs-placeholder-shadow), inset 0 0 0 var(--tabs-placeholder-border-width) var(--tabs-placeholder-border-color);
				backdrop-filter: blur(var(--tabs-placeholder-blurriness));
				background-color: color-mix(in srgb, var(--tabs-placeholder-background-color) ${prefs.floatingBackdropOpacity}%, transparent);
				transition: var(--tabs-item-opacity-transition) !important;
				transition-property: box-shadow, backdrop-filter, border-radius, background-color !important;
			`}
		}

		${context} .tabs-placeholder:not(${staticPreTabsPlaceHolder} #tabs-placeholder-pre-tabs) {
			opacity: 0;
			/*collapse the placeholders to make more rows can be scroll*/
			visibility: collapse;
			transition: var(--tabs-item-opacity-transition);
			transition-property: visibility, opacity;
		}

		/*hide items pre tabs when dragging*/
		${context}${condition=`:not(${staticPreTabsPlaceHolder})`} >
				:not(${_=".toolbar-items"}, ${_} ~ *),
		${context}${condition}
				#TabsToolbar-customization-target >
						:not(${_="#tabbrowser-tabs"}, ${_} ~ *, ${dropOnItems}, ${dropOnItemsExt}),
		/*hide items post tabs when dragging*/
		${context}${condition=":not([tabs-scrolledtostart])"} >
				.toolbar-items ~ *,
		${context}${condition}
				#tabbrowser-tabs ~ :not(${_=adjacentNewTab}, ${dropOnItems}, ${dropOnItemsExt}),
		/*hide adjacent new tab button when dragging*/
		${context}:not([tabs-scrolledtoend], [tabs-dragging-ext]) ${_} {
			opacity: 0 !important;
			transition: opacity var(--tabs-item-opacity-transition);
		}

		${win7 || win8 ? `
			/*buggy when applying transition*/
			${context} .titlebar-buttonbox-container {
				transition: none !important;
			}
		` : ``}

		#TabsToolbar${showPlaceHolder} ${preTabsButtons} ~ ${_="#tabbrowser-tabs"} {
			${!prefs.justifyCenter ? `
				--tabstrip-border-color: var(--tabs-placeholder-border-color);
			` : ``}
			--tabstrip-border-width: var(--tabs-placeholder-border-width);
			border-inline-start: 0;
			padding-inline-start: var(--tab-overflow-pinned-tabs-width) !important;
			margin-inline-start: 0;
		}

		#TabsToolbar${showPlaceHolder} ${_} {
			margin-inline: calc(var(--pre-tabs-items-width) * -1) calc(var(--post-tabs-items-width) * -1) !important;
		}
	}

	${win7 || win8 ? (()=>{
		//there are two buttonbox, get the visible one
		let box = $(`toolbar:not(${menubarAutoHide}) .titlebar-buttonbox`, gNavToolbox);
		let width, height;
		if (box.clientHeightDouble)
			({height, width} = getRect(box, {box: "margin"}));
		else {
			//as long as the title bar is not shown...
			let s = box.style, ps = box.parentNode.style;
			s.visibility = ps.visibility = "collapse";
			s.display = ps.display = "flex";
			({height, width} = getRect(box, {box: "margin"}));
			s.display = s.visibility = ps.display = ps.visibility = "";
		}
		let	normal = root.getAttribute("sizemode") == "normal";
		//the box is 2px less in height and 4px more in width when maximized
		return `
			${_=topMostTabsBar} {
				--control-box-reserved-height: ${height + (normal ? 0 : 2)}px;
				--control-box-reserved-width: ${width - (normal ? 0 : 4)}px;
			}
			[sizemode=maximized]${_} {
				--control-box-reserved-height: ${height - (normal ? 2 : 0)}px;
				--control-box-reserved-width: ${width + (normal ? 4 : 0)}px;
			}

			${win7 || win8 ? `
				@media (-moz-windows-compositor) {
					[sizemode=maximized]${_} {
						--control-box-margin-end: 3px;
					}

					${win7 ? `
						${_} {
							--control-box-radius-start: 3px;
							--control-box-radius-end: 1px;
						}

						[sizemode=maximized]${_} {
							--control-box-radius-end: 3px;
						}
					` : ``}
				}
			` : ``}
		`;
	})() : ``}

	${prefs.floatingBackdropClip && prefs.tabsUnderControlButtons == 2 ? `
		${context="#TabsToolbar"+showPlaceHolder}:not(${tbDraggingHidePlaceHolder}) ${_="#tabbrowser-tabs"} {
			clip-path: polygon(
				${START_PC} ${y="var(--tab-height)"},
				var(--top-placeholder-clip,
					var(--pre-tabs-clip,
						${x=`calc(${START_PC} + (var(--pre-tabs-items-width) + var(--tabstrip-padding)) * ${DIR})`} ${y},
						${x} ${y="calc(var(--tabs-top-space) * -1)"}
					),
					${x=`calc(${END_PC} - (var(--post-tabs-items-width) - var(--post-tabs-clip-reserved)) * ${DIR})`} ${y},
					${x} ${y="var(--tab-height)"},
					${x=`calc(${END_PC} - var(--scollbar-clip-width, (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved))) * ${DIR})`} ${y}
				),
				${x} ${y=`calc(var(--control-box-reserved-height) - var(--tabs-top-space))`},
				${x=`calc(${END_PC} - (var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
				${x=`calc(${END_PC} - var(--control-box-margin-end) * ${DIR})`} calc(var(--control-box-reserved-height) - var(--tabs-top-space) - var(--control-box-radius-end)),
				${x} 0,
				${x=END_PC} 0,
				${x} 100%,
				var(--new-tab-clip, ${x} 100%),
				${START_PC} 100%
			);
		}

		${context}:not(${tbDraggingHidePlaceHolder})[tabs-scrolledtostart] ${_} {
			--scollbar-clip-width: var(--tabs-scrollbar-visual-width);
		}

		${prefs.hideEmptyPlaceholderWhenScrolling ? `
			${context}[tabs-is-first-visible] ${_} {
				--pre-tabs-clip: ${START_PC} calc(var(--tabs-top-space) * -1);
			}
		` : ``}

		${context}:not([tabs-scrolledtoend]) ${_}[overflow][hasadjacentnewtabbutton] {
			--new-tab-clip:
				${x=`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR})`} 100%,
				${x} ${y=`calc(100% - var(--tab-height))`},
				${x=`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--new-tab-button-width)) * ${DIR})`} ${y},
				${x} 100%;
		}
	` : `
		${win7 || win8 ? `
			/*Clip the control buttons*/
			@media not ${singleRow} {
				${topMostTabsBar}${showPlaceHolder}:not(${tbDraggingHidePlaceHolder})
						#tabbrowser-tabs[overflow] {
					clip-path: polygon(
						${x=START_PC} 100%,
						${x} ${y="calc(var(--tabs-top-space) * -1)"},
						${x=`calc(${END_PC} - var(--control-box-reserved-width) * ${DIR})`} ${y},
						${x} ${y="calc(var(--control-box-reserved-height) - var(--tabs-top-space) - var(--control-box-radius-start))"},
						${x=`calc(${END_PC} - (var(--control-box-reserved-width) - var(--control-box-radius-start)) * ${DIR})`} ${y="calc(var(--control-box-reserved-height) - var(--tabs-top-space))"},
						${x=`calc(${END_PC} - (var(--control-box-clip-scrollbar-reserved) + var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
						${x=`calc(${END_PC} - (var(--control-box-clip-scrollbar-reserved) + var(--control-box-margin-end)) * ${DIR})`} ${y="calc(var(--control-box-reserved-height) - var(--tabs-top-space) - var(--control-box-radius-end))"},
						${x} ${y="calc(var(--tabs-top-space) * -1)"},
						${x=END_PC} ${y},
						${x} 100%
					);
				}
			}
		` : ``}
	`}

	${win7 || win8 ? `
		/*Clip the scrollbar when dragging*/
		${topMostTabsBar}${showPlaceHolder}${tbDraggingHidePlaceHolder}${defaultTheme ? "" : "[tabs-scrolledtostart]"}
				#tabbrowser-tabs[overflow] {
			clip-path: polygon(
				${x=START_PC} 100%,
				${x} ${y="calc(var(--tabs-top-space) * -1)"},
				${x=`calc(${END_PC} - var(--tabs-scrollbar-width) * ${DIR})`} ${y},
				${x} ${y="calc(var(--control-box-reserved-height) - var(--tabs-top-space))"},
				${x=`calc(${END_PC} - (var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
				${x=`calc(${END_PC} - var(--control-box-margin-end) * ${DIR})`} ${y="calc(var(--control-box-reserved-height) - var(--tabs-top-space) - var(--control-box-radius-end))"},
				${x} ${y="calc(var(--tabs-top-space) * -1)"},
				${x=END_PC} ${y},
				${x} 100%
			);
		}

		/*clip the background of post tabs placeholder so that when the control box clip is canceled when dragging,
		  placeholder does not cover the control box until fadeout is complete*/
		${!prefs.floatingBackdropClip ? `
			${topMostTabsBar}${showPlaceHolder} .tabs-placeholder::before {
				--controlbox-clip-path: polygon(
					${x=START_PC} 100%,
					${x} 0%,
					${x=`calc(${END_PC} - (var(--control-box-reserved-width) - var(--tabs-scrollbar-width)) * ${DIR})`} 0%,
					${x} ${y="calc(var(--control-box-reserved-height) - var(--control-box-adjustment, 0px) - var(--control-box-radius-start))"},
					${x=`calc(${END_PC} - (var(--control-box-reserved-width) - var(--tabs-scrollbar-width) - var(--control-box-radius-start)) * ${DIR})`} ${y="calc(var(--control-box-reserved-height) - var(--control-box-adjustment, 0px))"},
					${x=END_PC} ${y},
					${x} 100%
				);
			}

			${defaultTheme ? `
				.tabs-placeholder::before {
					--control-box-adjustment: 1px;
				}
			` : ``}
		` : ``}
	` : ``}

	${win8 && defaultDarkTheme ? `
		#TabsToolbar:not([tabs-scrolledtostart])${prefs.floatingBackdropClip ?
						tbDraggingHidePlaceHolder : showPlaceHolder}
				:is(
					#TabsToolbar:not(${condition="[pinned-tabs-wraps-placeholder]"}) ${_="#personal-bookmarks"},
					#TabsToolbar${condition} #tabbrowser-tabs ~ ${_}
				) .toolbarbutton-text {
			color: var(--lwt-tab-text);
		}
	` : ``}

	#TabsToolbar[has-items-pre-tabs][positionpinnedtabs]:not([tabs-hide-placeholder], [pinned-tabs-wraps-placeholder], [tabs-is-first-visible])
			#tabbrowser-arrowscrollbox[scrolledtostart]::part(overflow-start-indicator) {
		clip-path: inset(calc(var(--tab-height) + var(--tabs-placeholder-border-width)) 0 0 0);
	}

	${_="#tabbrowser-arrowscrollbox::part(items-wrapper)"}::before,
	${_}::after {
		content: "";
		pointer-events: none;
		flex-shrink: 0;
	}

	/*Set no height set for the post-tabs placeholder to let it not occupy an empty row,
	  such as when closing the only tab in the second row, tabs in the first row are locking size
	  and the placeholder is wrapped to the second row alone.*/
	${_}::before {
		height: var(--tab-height);
	}

	${context=`#TabsToolbar:is(${hidePlaceHolder})`} ${_}::before,
	${context} ${_}::after {
		display: none;
	}

	${context="#TabsToolbar:not([pinned-tabs-wraps-placeholder])"} ${_}::before {
		border-inline-end: var(--tabstrip-border);
		padding-inline-end: var(--tabstrip-padding);
		margin-inline-end: calc(var(--tabstrip-padding) + var(--tabstrip-border-width) * ${1 - 1 / devicePixelRatio});
	}

	${context}[tabs-multirows] ${_}::before {
		border-bottom: var(--tabstrip-border);
		margin-bottom: calc(var(--tabstrip-border-width) / -${devicePixelRatio});
		border-end-end-radius: var(--tabs-placeholder-border-radius);
	}

	${context="#TabsToolbar:not([tabs-hide-placeholder])"} ${_}::before {
		width: var(--pre-tabs-items-width);
	}

	${prefs.inlinePinnedTabs ? `
		${context}[positionpinnedtabs] ${_}::before {
			height: var(--last-pinned-tab-bottom, var(--tab-height));
			width: var(--last-pinned-tab-end, 0px);
		}
	` : `
		${context}[positionpinnedtabs] ${_}::before {
			width: calc(var(--pre-tabs-items-width) - var(--tab-overflow-pinned-tabs-width) - var(--gap-after-pinned));
		}
	`}

	${context} ${_}::after {
		width: calc(var(--post-tabs-items-width) - var(--tabs-scrollbar-width));
	}

	${_=".tabs-placeholder"} {
		--clip-shadow: calc(var(--tab-shadow-size) * -1);
		box-sizing: content-box;
		height: var(--tab-height);
		position: absolute;
		z-index: calc(var(--tabs-moving-max-z-index) + 1);
		box-shadow: var(--tabs-placeholder-shadow);
		border: var(--tabs-placeholder-border);
		backdrop-filter: var(--tabs-placeholder-backdrop);
		transition: var(--tabs-item-opacity-transition);
		transition-property: box-shadow, backdrop-filter, border-color, opacity;
	}

	#TabsToolbar[tabs-scrolledtostart] ${_} {
		transition-property: box-shadow, backdrop-filter, border-color, opacity, height, margin-top;
	}

	${prefs.floatingBackdropOpacity && !prefs.floatingBackdropClip ? `
		${_}::before {
			--controlbox-clip-path: none;
			content: "";
			width: 100%;
			height: 100%;
			opacity: ${prefs.floatingBackdropOpacity / 100};
			border-radius: inherit;
			background-color: var(--tabs-placeholder-background-color);
			transition: var(--inactive-window-transition, var(--tabs-item-opacity-transition));
			transition-property: background-color, opacity;
		}

		:root[lwtheme] ${_}::before {
			background-size: auto var(--multirows-background-size);
			background-attachment: fixed;
			background-position: var(--multirows-background-position);
			background-image: var(--lwt-additional-images);
			background-repeat: var(--lwt-background-tiling);
		}

		:root[lwtheme-image] ${_}::before {
			background-image: var(--lwt-header-image), var(--lwt-additional-images);
			background-repeat: no-repeat, var(--lwt-background-tiling);
		}

		#tabs-placeholder-pre-tabs::before {
			padding-inline-end: var(--tabstrip-padding);
			margin-inline-end: calc(var(--tabstrip-padding) * -1);
		}

		#TabsToolbar${staticPreTabsPlaceHolder} #tabs-placeholder-pre-tabs::before {
			opacity: 0;
		}

		#tabs-placeholder-post-tabs::before {
			clip-path: var(--controlbox-clip-path);
		}
	` : ``}

	#tabs-placeholder-pre-tabs {
		inset-inline-start: 0;
		width: var(--pre-tabs-items-width);
		padding-inline-end: var(--tabstrip-padding);
		/*by default, the margin end will be -1 to cancel out the border*/
		margin-inline-end: calc(var(--tabstrip-padding) + var(--tabstrip-border-width) - var(--tabs-placeholder-border-width));
		border-top-width: 0;
		border-inline-start: 0;
		border-color: var(--tabstrip-border-color);
		border-top-color: transparent;
		border-end-end-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(var(--clip-shadow) ${RTL_UI ? 0 : "var(--clip-shadow)"} var(--clip-shadow) ${RTL_UI ? "var(--clip-shadow)" : 0});
	}

	#TabsToolbar:not([pinned-tabs-wraps-placeholder], [tabs-scrolledtostart]) #tabs-placeholder-pre-tabs {
		border-color: var(--tabs-placeholder-border-color);
	}

	${prefs.hideEmptyPlaceholderWhenScrolling ? `
		${context="#TabsToolbar[tabs-is-first-visible]"} #tabs-placeholder-pre-tabs {
			visibility: hidden;
		}

		${context}:not([has-items-pre-tabs]) #tabs-placeholder-pre-tabs {
			/*collapse it so that its width is zero since it has a border*/
			visibility: collapse;
		}

		${context} .titlebar-spacer[type=pre-tabs] {
			visibility: hidden;
		}
	` : ``}

	${_="#tabs-placeholder-post-tabs"} {
		inset-inline-end: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--post-tabs-items-width) - var(--tabs-scrollbar-width) - var(--scrollbar-clip-reserved));
		border-top-width: 0;
		border-inline-end: 0;
		border-end-start-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(var(--clip-shadow) ${RTL_UI ? "var(--clip-shadow)" : 0} var(--clip-shadow) ${RTL_UI ? 0 : "var(--clip-shadow)"});
	}

	[multirow-pinned-tabs] ${_} {
		visibility: collapse;
	}

	#TabsToolbar[tabs-scrolledtostart] :is(${_}, #tabs-placeholder-pre-tabs) {
		pointer-events: none;
	}

	${context = prefs.tabsAtBottom ? "#TabsToolbar" : `${shownMenubar} + #TabsToolbar`}
			${_=`:is(#TabsToolbar:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs, #tabs-placeholder-post-tabs)`} {
		border-top-width: var(--tabs-placeholder-border-width);
		border-top-color: var(--tabs-placeholder-border-color);
	}

	${context}${condition="[tabs-scrolledtostart]"} ${_} {
		border-top-color: transparent;
	}

	${context}:not(${condition}, ${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs {
		border-start-end-radius: var(--tabs-placeholder-border-radius);
	}

	${context} #tabs-placeholder-post-tabs {
		border-start-start-radius: var(--tabs-placeholder-border-radius);
	}

	#tabs-placeholder-new-tab-button {
		--clip-bottom: 0;
		bottom: 0;
		inset-inline-end: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--new-tab-button-width) - var(--scrollbar-clip-reserved));
		border-inline-end: 0;
		border-bottom-width: 0;
		border-start-start-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(var(--clip-shadow) ${RTL_UI ? "var(--clip-shadow)" : 0} var(--clip-bottom) ${RTL_UI ? 0 : "var(--clip-shadow)"});
	}

	${prefs.tabsAtBottom && !(prefs.tabsAtBottom == 2 && !autoHideBookmarksBar) ? `
		#TabsToolbar:has(~ #PersonalToolbar:not([collapsed=true], [collapsed=""])) #tabs-placeholder-new-tab-button {
			--clip-bottom: var(--clip-shadow);
			border-end-start-radius: var(--tabs-placeholder-border-radius);
			border-bottom-width: var(--tabs-placeholder-border-width);
			border-bottom-color: var(--tabs-placeholder-border-color);
			height: calc(var(--tab-height) - var(--tabs-placeholder-border-width));
		}
	` : ``}

	${_="#TabsToolbar"}${staticPreTabsPlaceHolder} #tabs-placeholder-pre-tabs {
		box-shadow: none;
		backdrop-filter: none;
	}

	${!prefs.tabsAtBottom ? `
		${hiddenMenubar} + * :is(
			${_}:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs,
			#tabs-placeholder-post-tabs
		) {
			height: calc(var(--tab-height) + var(--tabs-padding-top) + var(--nav-toolbox-padding-top));
			margin-top: calc((var(--tabs-padding-top) + var(--nav-toolbox-padding-top)) * -1);
		}
	` : ``}

	${prefs.tabsAtBottom ? `` : `:not(${hiddenMenubar}) +`} #TabsToolbar :is(
		${_}:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs,
		#tabs-placeholder-post-tabs
	) {
		height: calc(
			var(--tab-height) +
			var(--tabs-padding-top) +
			var(--nav-toolbox-padding-top) -
			${prefs.floatingBackdropClip ? "0px" : "var(--tabs-placeholder-border-width)"} * 2
		);
	}

	${_}:not([tabs-hide-placeholder], [pinned-tabs-wraps-placeholder]) #tabbrowser-arrowscrollbox[overflowing]::part(items-wrapper)::before,
	${_}[tabs-scrolledtostart] #tabs-placeholder-post-tabs,
	${_}[tabs-scrolledtoend] #tabs-placeholder-new-tab-button {
		opacity: 0;
	}

	${_}:not([has-items-pre-tabs]) #tabs-placeholder-pre-tabs,
	${_}:not([has-items-post-tabs]) #tabs-placeholder-post-tabs,
	#tabbrowser-tabs:not([hasadjacentnewtabbutton]) #tabs-placeholder-new-tab-button,
	${_}:is(${hidePlaceHolder}, :not([tabs-overflow])) .tabs-placeholder {
		visibility: collapse;
	}

	${context=`${_}:hover #tabbrowser-arrowscrollbox:not(:hover)`} *,
	${context} ::before,
	${context} ::after {
		-moz-window-dragging: drag !important;
	}

	@media ${singleRow} {
		${_} .tabs-placeholder {
			visibility: collapse;
		}
	}

	${prefs.inlinePinnedTabs ? `
		#tabs-placeholder-pre-tabs {
			width: calc(100% - var(--tabs-scrollbar-visual-width));
			height: var(--last-pinned-tab-bottom) !important;
			clip-path: polygon(
				${START_PC} 0,
				${x=`calc(${END_PC} - (var(--tabs-scrollbar-visual-width) - var(--tabstrip-padding)) * ${DIR})`} 0,
				${x} ${y="calc(100% - var(--tab-height))"},
				${x="var(--last-pinned-tab-end)"} ${y},
				${x} 100%,
				${START_PC} 100%
			);
		}
	` : ``}

	${maxRows > 1 ? `
		@media ${multiRows} {
			${_=adjacentNewTab} {
				position: absolute;
				bottom: 0;
				inset-inline-end: 0;
			}

			#TabsToolbar:not([tabs-hide-placeholder])[tabs-overflow] ${_} {
				inset-inline-end: var(--tabs-scrollbar-width);
			}

			${prefs.tabsUnderControlButtons < 2 ? `
				${context=`:is(
					:root:not([privatebrowsingmode=temporary]) #toolbar-menubar:not(${menubarAutoHide}) + #TabsToolbar,
					:root:not([tabsintitlebar], [customtitlebar])
				)`} ${prefs.tabsbarItemsAlign == "end" ? `
					${_}
				` : `
					#new-tab-button:nth-child(1 of #tabbrowser-tabs[hasadjacentnewtabbutton] ~ :not([hidden=true], [collapsed=true])):nth-last-child(1 of :not([hidden=true], [collapsed=true]))
				`} {
					position: static;
					align-self: end;
					order: 2;
				}
			` : ``}
		}

		${prefs.tabsUnderControlButtons < 2 && prefs.tabsbarItemsAlign == "center" && maxRows > 1 ? `
			@media ${multiRows} and ${twoOrLessRows} {
				${context} ${_} {
					position: static;
					align-self: end;
					order: 2;
				}
			}
		` : ``}
	` : ``}

	/*when overflowing and there are only 2 rows and there is items after tabs,
	  force to show the adjacent new tab button as static*/
	@media ${twoOrLessRows} {
		${context="#TabsToolbar[has-items-post-tabs]"+showPlaceHolder}
				${adjacentNewTab} {
			position: static;
			align-self: start;
		}

		${context}${tbDraggingHidePlaceHolder}[tabs-scrolledtostart] ${adjacentNewTab} {
			opacity: 1 !important;
		}

		/*hide it when moving tab, since it is excluded in the previous rule because of adjacent*/
		${context}${tbDraggingHidePlaceHolder}:not([tabs-scrolledtostart], [tabs-dragging-ext])
				${adjacentNewTab} {
			opacity: 0 !important;
		}

		@media ${multiRows} {
			:is(
				#TabsToolbar[tabs-dragging-ext][has-items-post-tabs]:not([tabs-scrolledtostart]),
				#TabsToolbar[tabs-dragging-ext]:not([has-items-post-tabs], [tabs-scrolledtoend]),
			) ${adjacentNewTab}
					.toolbarbutton-icon {
				${floatingButtonStyle}
			}
		}

		/*always display the inline new tab button in case lacking of it causes underflow*/
		${context} ${_="#tabbrowser-tabs[hasadjacentnewtabbutton]"} #tabs-newtab-button {
			display: flex !important;
		}

		${context} ${_} #tabs-placeholder-new-tab-button {
			visibility: collapse;
		}

		${prefs.floatingBackdropClip ? `
			${context}:not(${tbDraggingHidePlaceHolder}) ${_}[multirows][overflow] {
				--new-tab-clip: ${END_PC} 100%;
			}
		` : ``}
	}

	@media not ${twoOrLessRows} {
		#TabsToolbar[tabs-dragging-ext]:not([tabs-scrolledtoend]) ${adjacentNewTab}
				.toolbarbutton-icon {
			${floatingButtonStyle}
		}
	}
` : "" /*prefs.tabsUnderControlButtons*/}

${!prefs.autoCollapse && prefs.maxTabRows > 1 ? `
	:root {
		--multirows-background-size: max(
			var(--nav-toolbox-net-height) + var(--tab-height) * ${prefs.dynamicThemeImageSize ? "var(--tab-rows)" : maxRows},
			var(--lwt-background-image-natural-height, 0px)
		);
	}

	${win7 || win8 ? `:root,` : ``}
	#navigator-toolbox {
		background-size: auto var(--multirows-background-size) !important;
	}

	${appVersion < 121 ? `
		#TabsToolbar #firefox-view-button[open] > .toolbarbutton-icon:-moz-lwtheme,
		#tabbrowser-tabs:not([movingtab]) > #tabbrowser-arrowscrollbox > .tabbrowser-tab > .tab-stack > .tab-background:is([selected=true], [multiselected=true]):-moz-lwtheme {
			background-size: auto 100%, auto 100%, auto var(--multirows-background-size) !important;
		}
		.tabbrowser-tab[animate-shifting] .tab-background:-moz-lwtheme {
			background-image: none !important;
		}
	` : ``}
` : ``}

${debug && debug < 3 ? `
	${_="#tabbrowser-tabs"} {
		background: rgba(0,255,255,.2);
		box-shadow: 0 -5px rgba(0,255,0,.5);
	}
	${_}[ignore-newtab-width] {
		outline: 5px solid lime;
	}
	${_}:hover {
		clip-path: none !important;
	}
	${_=":is(.tabbrowser-tab, .tab-group-label-container, .tab-group-overflow-count-container)"}[style*=min-width] {
		background: rgba(0,255,0,.2);
	}
	${_}[style*=max-width] {
		background: rgba(255,0,0,.2);
	}
	${_}[elementIndex]::before {
		content: attr(elementIndex);
		height: 0;
	}
	${_}[pinned][elementIndex]::before {
		position: absolute;
	}
	${_}[style*=transform] {
		background: rgba(255,0,255,.2);
	}
	${_} {
		box-shadow: 0 0 0 1px inset rgba(128,128,128,.5);
		position: relative;
	}
	${_=`:is(${_}, .tab-group-label)`}[test-drop-before] {
		background: red !important;
	}
	${_}[test-drop-before=true] {
		background: blue !important;
	}
	${_}[test-drop-overlap] {
		outline: 2px dotted lime !important;
	}
	.tab-background {
		opacity: .7;
	}
	.closing-tabs-spacer {
		outline: 5px solid orangered;
		background: rgba(255, 255, 0, .5);
		height: var(--tab-height);
	}
	${_="#tabbrowser-arrowscrollbox"}::part(items-wrapper)::before,
	${_}::part(items-wrapper)::after {
		background: rgba(0, 255, 0, .5);
		align-self: stretch;
	}

	${_}[scrollsnap] {
		outline: 4px solid rgba(255,0,255,.5);
	}

	${_}::part(fake-scrollbar) {
		scrollbar-color: var(--toolbarbutton-icon-fill) orange;
	}

	${_}[style*="--slot-height"] {
		outline: 3px solid orange;
	}
` : ""}
${debug > 1 ? `
	#TabsToolbar {
		--tabs-item-opacity-transition: 1s ease;
	}

	${debug == 2 ? `
		#tabbrowser-tabs, #tabbrowser-arrowscrollbox {
			clip-path: none !important;
		}

		#TabsToolbar[movingtab]::before,
		#TabsToolbar[movingtab]::after,
		${_="#tabbrowser-tabs[movingtab]"} #tabbrowser-arrowscrollbox::before,
		${_} #tabbrowser-arrowscrollbox::after,
		${_}::before,
		${_}::after {
			--line: 1px solid rgba(0, 192, 192, .75);
			content: "";
			position: fixed;
			z-index: 5;
			pointer-events: none;
		}
		${_} #tabbrowser-arrowscrollbox::before,
		${_}::before {
			top: min(max(var(--drag-y, 0px), 0px), 100vh);
			width: 100vw;
			border-top: var(--line);
		}
		${_} #tabbrowser-arrowscrollbox::after,
		${_}::after {
			left: min(max(var(--drag-x, 0px), 0px), 100vw);
			height: 100vh;
			border-left: var(--line);
		}
		${_} #tabbrowser-arrowscrollbox::before {
			top: var(--drag-tran-y, 0px);
			--line: 1px solid rgba(192, 0, 192, .75);
		}
		${_} #tabbrowser-arrowscrollbox::after {
			left: var(--drag-tran-x, 0px);
			--line: 1px solid rgba(192, 0, 192, .75);
		}
		${_="#TabsToolbar[movingtab]"}::before,
		${_}::after {
			border: var(--line);
			left: min(max(var(--drag-x, 0px) - var(--drag-width) / 2, 0px), 100vw);
			top: min(max(var(--drag-y, 0px) - var(--tab-height) / 2, 0px), 100vh);
			height: var(--tab-height);
			width: var(--drag-width);
		}
		${_}::after {
			border-color: rgba(192, 0, 192, .75);
			--drag-width: var(--drag-tran-width);
		}
	` : ``}
` : ``}
`;
root.setAttribute("multitabrows-applying-style", "");
requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("multitabrows-applying-style")));
}

{
	let observer = new ResizeObserver(() => root.style.setProperty("--nav-toolbox-height",
			gNavToolbox.getBoundingClientRect().height + "px"));

	function onLwtChange() {
		root.style.removeProperty("--multirows-background-position");
		let cs = getComputedStyle(gNavToolbox);

		let bgImgs = [...cs.backgroundImage.matchAll(/(?<=url\(").+?(?="\))/g)].flat();
		Promise.all(bgImgs.map(src => new Promise(rs => {
			let img = new Image();
			img.onload = () => rs(img.height || 0);
			img.onerror = () => rs(0);
			img.src = src;
		}))).then(heights => root.style.setProperty("--lwt-background-image-natural-height",
				Math.max(0, ...heights) + "px"));

		let bgPos = cs.backgroundPosition;
		let hasChanged;
		bgPos = bgPos.split(", ").map(s => {
			s = s.split(" ");
			if (s[1] != "0%" && s[1].includes("%")) {
				hasChanged = true;
				s[1] = `calc(${s[1].replace(/calc\(|\)/g, "")
						.replace(/\d+%/g, m => "(var(--nav-toolbox-height) - var(--multirows-background-size)) * " +
								parseFloat(m) / 100)})`;
			}
			return s.join(" ");
		});
		if (hasChanged)
			root.style.setProperty("--multirows-background-position", bgPos);
		else
			root.style.removeProperty("--nav-toolbox-height");
		observer[hasChanged ? "observe" : "unobserve"](gNavToolbox);
	}
	addEventListener("windowlwthemeupdate", onLwtChange, true);
	onLwtChange();
}

/** hack slot **/
{
	slot.part.add("items-wrapper");
}

/** hack scrollbox **/
{
	//the scrollbar is regenerated in some situations, ensure it is well set
	let scrollbar;
	scrollbox.addEventListener("mouseenter", function(e) {
		if (e.target != this) return;
		if (!scrollbar?.isConnected)
			if (scrollbar = getScrollbar(this)) {
				scrollbar.style.MozWindowDragging = "no-drag";
				scrollbar.addEventListener("click", this._ensureSnap, true);
				scrollbar.addEventListener("mouseover", e => {
					scrollbar.style.MozWindowDragging = "no-drag";
					tabsBar.setAttribute("tabs-scrollbar-hovered", "");
				}, true);
				scrollbar.addEventListener("mouseout", e => {
					scrollbar.style.MozWindowDragging = "";
					tabsBar.removeAttribute("tabs-scrollbar-hovered");
				}, true);
			} else
				return;
		//prevent the scrollbar fade in/out when clicking on tabs on windows 11
		scrollbar.style.opacity = 1;
	}, true);
	scrollbox.addEventListener("mouseleave", function(e) {
		if (e.target != this) return;
		if (!scrollbar?.isConnected)
			scrollbar = getScrollbar(this);
		if (scrollbar)
			scrollbar.style.opacity = "";
	}, true);

	let ensureSnapDelay = Services.prefs.getIntPref("general.smoothScroll.mouseWheel.durationMaxMS");
	let snapTimeout;
	//ensure to snap well when clicking on the scrollbar
	scrollbox._ensureSnap = function() {
		//if it's already scrolled to the edge and click on the up / down button,
		//the scrollend event will not be dispatched
		//wait a while and check if there is no scroll, then remove the attribute
		let remainder = this.scrollTop % tabHeight;
		if (remainder) {
			console.log("snap", remainder);
			arrowScrollbox.removeAttribute("scrollsnap");
			clearTimeout(snapTimeout);
			snapTimeout = setTimeout(() => {
				arrowScrollbox.setAttribute("scrollsnap", "");
				snapTimeout = setTimeout(() => {
					arrowScrollbox.removeAttribute("scrollsnap");
					delete arrowScrollbox._isScrolling;
				});
			}, ensureSnapDelay);
		} else
			arrowScrollbox.removeAttribute("scrollsnap");
	};

	//control the scroll behavior and speed
	let {scrollBy} = scrollbox;
	let lockDragScroll;
	scrollbox.scrollBy = function(arg) {
		if (typeof arg == "object") {
			//ensure the scrolling performs one by one when dragging tabs
			if (new Error().stack.match(/^on_dragover@/m)) {
				if (arrowScrollbox._isScrolling || lockDragScroll)
					return;
				if (gReduceMotion)
					lockDragScroll = setTimeout(() => lockDragScroll = null,
							Services.prefs.getIntPref("general.smoothScroll.durationToIntervalRatio") * 2);

				//the scrolling is reversed as the box is marked as horizontal, reverse it back
				arg.top = Math.sign(arg.top) * tabHeight * restrictScroll(prefs.linesToDragScroll) * DIR;

				if (!gReduceMotion)
					arg.behavior = "smooth";
			}
		}
		return scrollBy.apply(this, arguments);
	};

	Object.defineProperty(scrollbox, "scrollbarWidth", {
		get: function() {return this.scrollTopMax ? scrollbarWidth : 0},
		configurable: true,
	});

	//the overflow and underflow events may not be handled / triggered correctly
	//ensure everything is set right
	tabContainer.removeAttribute("overflow");
	arrowScrollbox.removeAttribute("overflowing");

	//overwrite the action of the original listener
	scrollbox.addEventListener("overflow", onFlowChange);
	scrollbox.addEventListener("underflow", onFlowChange);

	function onFlowChange(e) {
		if (e.originalTarget != this || animatingLayout)
			return;

		console.time(`scrollbox ${e.type} ${e.detail}`);

		let overflow = !!this.scrollTopMax;
		assign(tabsBar.style, {"--tabs-scrollbar-width": overflow ? scrollbarWidth + "px" : ""});

		//don't consider it can overflow if there is only one tab,
		//in case the new tab button is wrapped in extreme case and cause overflow
		overflow &&= getNodes().length > 1;

		let toggleAttr = overflow ? "setAttribute" : "removeAttribute";
		arrowScrollbox[toggleAttr]("overflowing", true, true);
		tabContainer[toggleAttr]("overflow", true);

		tabsBar.toggleAttribute("tabs-overflow", overflow);
		tabsBar.toggleAttribute("tabs-hide-placeholder", overflow && prefs.tabsUnderControlButtons < 2);

		console.timeLog(`scrollbox ${e.type} ${e.detail}`, "update status");
		console.log({type: e.type, overflow});

		//overflow may fired when moving tab then locking the slot
		if (overflow) {
			if (!tabContainer.hasAttribute("movingtab")) {
				tabContainer._unlockTabSizing({instant: true});
				tabContainer._handleTabSelect(true);
			}
		} else
			for (let tab of gBrowser._removingTabs)
				gBrowser.removeTab(tab);

		document.getElementById("tab-preview-panel")?.[toggleAttr]("rolluponmousewheel", true);

		tabContainer._updateInlinePlaceHolder();
		tabContainer._updateCloseButtons();

		console.timeEnd(`scrollbox ${e.type} ${e.detail}`);
	}
}

/** hack arrowScrollbox **/
{
	//fx 115, reset the cache in case the script is load after the box is overflowed
	delete arrowScrollbox._startEndProps;

	if (!("overflowing" in arrowScrollbox)) //fx 115
		Object.defineProperty(arrowScrollbox, "overflowing", {
			get: function() {return this.hasAttribute("overflowing")},
			configurable: true,
		});

	$$("[id^=scrollbutton-]", arrowScrollbox.shadowRoot).forEach(btn => btn.icon.part.add(btn.id + "-icon"));

	let {getAttribute, removeAttribute, toggleAttribute, setAttribute, dispatchEvent,
			on_wheel, on_scroll, on_scrollend} = arrowScrollbox;

	//Take charge and not let the ResizeObserver in the constructor of MozArrowScrollbox do anything stupid about
	//the determination of overflow and event dispatching.
	//When the window is expanded and the box changes from being forced to be in one row, to being able to be in multi-rows,
	//the block may bounce very violently
	arrowScrollbox.dispatchEvent = function({type}) {
		return ["overflow", "underflow"].includes(type) ? false : dispatchEvent.apply(this, arguments);
	};

	arrowScrollbox._canScrollToElement = ele => {
		return !isTab(ele) ||
				(ele.visible ?? !ele.hidden) &&
						!(ele.pinned && tabContainer.hasAttribute("positionpinnedtabs"));
	};

	if (arrowScrollbox.on_overflow)
		arrowScrollbox.on_underflow = arrowScrollbox.on_overflow = () => {};

	//Make it think it's vertical and save a lot of modifications.
	//Do not modify the attribute directly as it breaks the layout.
	arrowScrollbox.getAttribute = function(n) {
		if (n == "orient") return "vertical";
		return getAttribute.call(this, n);
	};

	//add a secret parameter to let us through
	arrowScrollbox.removeAttribute = function(n, forced) {
		if (["scrolledtostart", "scrolledtoend", "overflowing"].includes(n) && !forced)
			return;
		if (["scrolledtostart", "scrolledtoend"].includes(n))
			tabsBar.removeAttribute("tabs-" + n);
		removeAttribute.apply(this, arguments);
	};
	arrowScrollbox.setAttribute = function(n, v, forced) {
		if (["scrolledtostart", "scrolledtoend", "overflowing"].includes(n) && !forced)
			return;
		if (["scrolledtostart", "scrolledtoend"].includes(n))
			tabsBar.toggleAttribute("tabs-" + n, true);
		setAttribute.apply(this, arguments);
	};
	arrowScrollbox.toggleAttribute = function(n, v, forced) {
		if (["scrolledtostart", "scrolledtoend", "overflowing"].includes(n) && !forced)
			return this.hasAttribute(n);
		if (["scrolledtostart", "scrolledtoend"].includes(n))
			tabsBar.toggleAttribute("tabs-" + n, v);
		return toggleAttribute.apply(this, arguments);
	};

	//override the orignal function of fx 115
	//ignore #updateScrollButtonsDisabledState as it is private,
	//[scrolledtostart] and [scrolledtoend] have been taken charge so don't bother
	arrowScrollbox._updateScrollButtonsDisabledState = function() {
		let {scrollTop} = scrollbox;
		this[!scrollTop ? "setAttribute" : "removeAttribute"]("scrolledtostart", true, true);
		this[scrollTop == scrollbox.scrollTopMax ? "setAttribute" : "removeAttribute"]("scrolledtoend", true, true);
	};

	arrowScrollbox.on_scroll = function(e) {
		if (e.target != scrollbox) return;
		on_scroll.apply(this, arguments);
		let {scrollTop, scrollTopMax, _lastScrollTop} = scrollbox;
		console.log("scrolling", scrollTop, _lastScrollTop);
		if (tabContainer.matches("[tabmousedown], [dragging]")) {
			fakeScrollbar.scrollTop = scrollTop;
			if (tabContainer.hasAttribute("dragging") && !tabContainer.hasAttribute("moving-positioned-tab"))
				this.style.setProperty("--scroll-top", scrollTop + "px");
		}

		if (scrollTop != _lastScrollTop && scrollTopMax && scrollTopMax >= _lastScrollTop && this.overflowing) {
			if (!this._stopScrollSnap)
				this.setAttribute("scrollsnap", "");
		} else
			//1. toggling the css overflow property
			//2. shrinking the box height that can't scroll that much anymore
			//3. underflow after unlocking the slot size
			//these cases will cause a scroll event with no scrollend afterward
			//clear the _isScrolling to prevent incorrect determine
			delete this._isScrolling;

		if (appVersion > 130)
			this._updateScrollButtonsDisabledState();

		scrollbox._lastScrollTop = scrollTop;
	};

	arrowScrollbox.on_scrollend = function(e) {
		if (e.target != scrollbox) return;
		on_scrollend.apply(this, arguments);
		scrollbox._ensureSnap();
		console.log(e.type);
	};

	let minWheelDelta = Infinity;
	arrowScrollbox.on_wheel = function(e) {
		if (this._isScrolling || !this.overflowing)
			return;
		let {deltaY} = e;
		minWheelDelta = Math.min(minWheelDelta, Math.abs(deltaY));
		scrollbox.scrollBy({
			top: Math.round(deltaY / minWheelDelta) * tabHeight * restrictScroll(prefs.linesToScroll),
			behavior: gReduceMotion ? "instant" : "smooth",
		});
		e.stopPropagation();
		e.preventDefault();
	};
	if (appVersion < 131) {
		arrowScrollbox.removeEventListener("wheel", on_wheel);
		arrowScrollbox.addEventListener("wheel", arrowScrollbox.on_wheel);
	}

	let _lockScroll, _lockScrollPending;
	Object.defineProperty(arrowScrollbox, "lockScroll", {
		get: function() {return this.hasAttribute("lockscroll")},
		set: function(v) {
			if (this.lockScroll == v) return;
			_lockScroll = !!v;
			let update = () => this.toggleAttribute("lockscroll", _lockScroll);
			if (!this._isScrolling)
				update();
			else if (!_lockScrollPending) {
				_lockScrollPending = true;
				scrollbox.addEventListener("scrollend", function f(e) {
					if (e.target != this) return;
					this.removeEventListener("scrollend", f, true);
					_lockScrollPending = false;
					update();
				}, true);
			}
		},
		configurable: true,
	});
}

//some workaround with full screen
{
	let gNavToolboxResizeObserver = new ResizeObserver(e => {
		if (FullScreen._isChromeCollapsed) {
			gNavToolbox.style.marginTop = -gNavToolbox.getBoundingClientRect().height + "px";
		} else {
			FullScreen.hideNavToolbox();
			FullScreen.showNavToolbox();
		}
	});
	let {toggle} = FullScreen;
	FullScreen.toggle = function() {
		gNavToolboxResizeObserver[window.fullScreen ? "observe" : "unobserve"](tabContainer);
		return toggle.apply(this, arguments);
	};
}

//heck MozTabbrowserTabGroup
let groupProto = customElements.get("tab-group")?.prototype;
if (groupProto) {
	let CLICKED_BY_MOUSE = Symbol("clickedByMouse");
	let elementIndexOpd = {
		set: function(v) {
			let p = this.parentNode;
			p.setAttribute("elementIndex", p.elementIndex = v);
			let {group} = this;
			group.overflowCountLabel?.parentNode.setAttribute("elementIndex", v + group.visibleTabs.length + .5);
		},
		get: function() { return this.parentNode.elementIndex },
		configurable: true,
	};
	let onLabelFlowChange = function(e) {
		this.toggleAttribute("overflow", e.type == "overflow");
	};
	let textContentOpd = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
	let overflowCountContentOpd = {
		set: function(v) {
			if (tabContainer.hasAttribute("movingtab") && this.closest("tab-group").collapsed)
				return;
			textContentOpd.set.call(this, v);
		},
		get: textContentOpd.get,
		configurable: true,
	};

	new MutationObserver(list => {
		for (let ent of list)
			if (ent.type == "childList")
				for (let n of ent.addedNodes)
					if (n.tagName == "tab-group") {
						let label = n.labelElement;
						let idx = label.elementIndex;
						Object.defineProperty(label, "elementIndex", elementIndexOpd);
						assign(label, {
							elementIndex: idx,
							scrollIntoView,
						});
						assign(label.parentNode, {scrollIntoView});
						for (let e of ["overflow", "underflow"])
							label.addEventListener(e, onLabelFlowChange);
						if (n.overflowCountLabel)
							Object.defineProperty(n.overflowCountLabel, "textContent", overflowCountContentOpd);
					}
	}).observe(arrowScrollbox, {childList: true});

	let {ungroupTabs, remove, dispatchEvent, toggleAttribute, on_click} = groupProto;
	let opd = Object.getOwnPropertyDescriptors(groupProto);

	Object.defineProperties(groupProto, {
		label: {
			set: function(v) {
				if (this.isConnected && new Error().stack.match(/^#setMlGroupLabel@/m))
					animateLayout(() => opd.label.set.call(this, v));
				else
					opd.label.set.call(this, v);
			},
			get: opd.label.get,
			configurable: true,
		},
		collapsed: {
			set: function(v) {
				if (new Error().stack.match(/^#expandGroupOnDrop@/m))
					return;

				if (!this.isConnected || !!v == this.collapsed) {
					opd.collapsed.set.call(this, v);
					return;
				}

				let nodes = getNodes({newTabButton: true});
				let oc = this.isShowingOverflowCount && this.overflowCountLabel.parentNode;
				if (v) {
					if (this[CLICKED_BY_MOUSE] || tabContainer.hasAttribute("movingtab"))
						tabContainer._lockTabSizing(this.labelElement);
				} else {
					nodes = nodes.filter(n => n != oc);
					nodes.push(...this.nonHiddenTabs);
				}

				this.togglingAnimation = animateLayout(async () => {
					this.setAttribute("toggling", "");
					opd.collapsed.set.call(this, v);
					if (v && oc) {
						tabContainer._keepTabSizeLocked = true;
						return oc;
					}
				}, {
					nodes: this.hasAttribute("movingtabgroup") ?
						nodes.filter(n => n != this.firstChild) :
						nodes,
				}).then(() => {
					this.removeAttribute("toggling");
					delete this.togglingAnimation;
					if (v && oc)
						delete tabContainer._keepTabSizeLocked;
				});
			},
			get: opd.collapsed.get,
			configurable: true,
		},
		visibleTabs: {
			get: function() { return this.tabs.filter(t => t.visible) },
			configurable: true,
		},
		nonHiddenTabs: {
			get: function() { return this.tabs.filter(t => !t.hidden) },
			configurable: true,
		},
		isBeingDragged: {
			set: function(v) {
				//the attribute is handled all by this script
				if (new Error().stack.match(/^#setIsDraggingTabGroup@/m))
					return;
				this.toggleAttribute("movingtabgroup", v);
			},
			get: function() { return this.hasAttribute("movingtabgroup") },
			configurable: true,
		},
		hasActiveTab: {
			set: function(v) {
				if (this.collapsed && tabContainer.hasAttribute("movingtab"))
					return;
				opd.hasActiveTab?.set.call(this, v);
			},
			get: opd.hasActiveTab?.get,
			configurable: true,
		},
		isShowingOverflowCount: {
			get: function() { return this.collapsed && this.hasActiveTab && this.hasAttribute("hasmultipletabs") },
			configurable: true,
		},
	});

	groupProto.on_click = function(e) {
		if (e.inputSource == MouseEvent.MOZ_SOURCE_MOUSE)
			this[CLICKED_BY_MOUSE] = true;
		on_click.apply(this, arguments);
		delete this[CLICKED_BY_MOUSE];
	};

	groupProto.ungroupTabs = function() {
		animateLayout(() => ungroupTabs.apply(this, arguments),
				{nodes: getNodes({newTabButton: true}).filter(t => t != this.firstChild)});
	};

	groupProto.remove = function() {
		if (tabContainer.hasAttribute("movingtab"))
			return;
		this.removingAnimation = animateLayout(() => {
			remove.call(this);
			tabContainer._invalidateCachedTabs();
			tabContainer._updateInlinePlaceHolder();
		}, {nodes: getNodes({newTabButton: true}).filter(t => t != this.firstChild)})
				.then(() => delete this.removingAnimation);
	};

	groupProto.dispatchEvent = function(e) {
		if (e.type == "TabGroupRemoved" && tabContainer.hasAttribute("movingtab"))
			return false;
		return dispatchEvent.apply(this, arguments);
	};

	groupProto.isTabVisibleInGroup = function(tab) {
		return !this.collapsed || tab.selected;
	};

	groupProto.toggleAttribute = function(n) {
		if (n == "hasmultipletabs" && this.collapsed && tabContainer.hasAttribute("movingtab"))
			return this.hasAttribute(n);
		return toggleAttribute.apply(this, arguments);
	};
}

//heck MozTabbrowserTab
{
	let tabProto = customElements.get("tabbrowser-tab").prototype;
	if ("elementIndex" in tabProto) {
		let opd = Object.getOwnPropertyDescriptor(tabProto, "elementIndex");
		Object.defineProperty(tabProto, "elementIndex", {
			set: function(v) {
				opd.set.call(this, v);
				this.setAttribute("elementIndex", v);
			},
			get: opd.get,
			configurable: true,
		});

		Object.defineProperty(tabProto, "groupLine", {
			get: function() {
				return this._groupLine ??= $(".tab-group-line", this);
			},
			configurable: true,
		});
	}

	Object.defineProperty(tabProto, "stack", {
		get: function() {
			return this._stack ??= $(".tab-stack", this);
		},
		configurable: true,
	});

	assign(tabProto, {scrollIntoView});
}

{
	tabContainer.addEventListener("TabGroupUpdate", function(e) {
		gBrowser.tabGroupMenu.panel.hasAttribute("panelopen") && e.target.labelElement.scrollIntoView();
	});

	//auto collapse
	{
		for (let e of ["transitionstart", "transitionend"])
			tabContainer.addEventListener(e, onTransition);

		function onScrollend(e) {
			if (e.target != this || this.scrollTop > (tabContainer._scrollRows - 1) * tabHeight)
				return;
			assign(tabContainer.style, {"--temp-open-padding": ""});
			this.removeEventListener("scrollend", onScrollend);
		}

		function onTransition(e) {
			let start = e.type == "transitionstart";
			if (prefs.autoCollapse && e.target == this && e.pseudoElement == "" &&
					e.propertyName == "margin-bottom") {
				let showing = this.matches(":hover, [dragging]");
				this.toggleAttribute("animating-collapse", start);
				if (start == showing) {
					let urlBar = $("#urlbar");
					if (urlBar.hasAttribute("popover"))
						urlBar[(start ? "hide" : "show") + "Popover"]();
					this.toggleAttribute("has-temp-scrollbar", showing && getRowCount(true) <= maxTabRows());

					if (prefs.autoCollapseCurrentRowStaysTop) {
						this.toggleAttribute("temp-open", showing);
						if (start) {
							let scroll = this._scrollRows * tabHeight - slot.clientHeight + scrollbox.scrollTop;
							if (scroll) {
								let maxScroll = scrollbox.scrollTopMax;
								assign(this.style, {"--temp-open-padding": scroll + "px"});
								scrollbox.addEventListener("scrollend", onScrollend);
							}
						} else {
							assign(this.style, {"--temp-open-padding": ""});
							scrollbox.removeEventListener("scrollend", onScrollend);
						}
					}
				}
			}
		}
	}

	const [
		DRAGOVER_GROUPTARGET, MOVINGTAB_GROUP, CLEAR_DRAG_OVER_GROUPING_TIMER,
		TRIGGER_DRAG_OVER_GROUPING, DRAG_OVER_GROUPING_TIMER,
	] = appVersion > 142 ? [
		"dragover-groupTarget", "movingtab-group", "_clearDragOverGroupingTimer",
		"triggerDragOverGrouping", "_dragOverGroupingTimer",
	] : [
		"dragover-createGroup", "movingtab-createGroup", "_clearDragOverCreateGroupTimer",
		"triggerDragOverCreateGroup", "_dragOverCreateGroupTimer",
	];

	if (!tabContainer._getDragTargetTab) {
		let MozTabbrowserTabs = customElements.get("tabbrowser-tabs");
		[
			"#getDropIndex", "#setDragOverGroupColor", "#"+TRIGGER_DRAG_OVER_GROUPING,
		].forEach(n => exposePrivateMethod(MozTabbrowserTabs, n));
		tabContainer._getDragTargetTab = tabContainer._getDragTarget;
		delete tabContainer._getDragTarget;
		tabContainer._rtlMode = RTL_UI;
	}

	let {
		startTabDrag, on_dragover, on_dragend, on_drop, on_dragleave,
		_animateTabMove, _unlockTabSizing, _updateCloseButtons,
		_handleTabSelect, uiDensityChanged,
	} = tabContainer;
	const FINISH_ANIMATE_TAB_MOVE = tabContainer.finishAnimateTabMove ? "finishAnimateTabMove" : "_finishAnimateTabMove";
	let finishAnimateTabMove = tabContainer[FINISH_ANIMATE_TAB_MOVE];
	let passingByTimeout;

	if (!("overflowing" in tabContainer))
		Object.defineProperty(tabContainer, "overflowing", {
			get: function() {return this.hasAttribute("overflow")},
			configurable: true,
		});

	//clear the cache in case the script is loaded with delay
	tabContainer._pinnedTabsLayoutCache = null;

	arrowScrollbox.before(...["pre-tabs", "post-tabs", "new-tab-button"].map(n =>
			tabContainer["_placeholder" + n.replace(/(?:^|-)(\w)/g, (m,w) => w.toUpperCase())] =
					Object.assign(document.createXULElement("hbox"), {
						id: "tabs-placeholder-" + n,
						className: "tabs-placeholder",
					})));
	//sometimes double clicking on the spaces doesn't perform the window maximizing/restoring, don't know why
	$$(".titlebar-spacer, .tabs-placeholder").forEach(ele => ele.addEventListener("dblclick", ondblclick, true));
	function ondblclick(e) {
		if (e.buttons) return;
		switch (windowState) {
			case STATE_MAXIMIZED: restore(); break;
			case STATE_NORMAL: maximize(); break;
		}
	}

	let {pinnedTabsContainer} = gBrowser;
	if (pinnedTabsContainer) {
		{
			let {contains} = pinnedTabsContainer;
			assign(pinnedTabsContainer, {
				appendChild: function(tab) {
					arrowScrollbox.insertBefore(tab, [...arrowScrollbox.children].find(t => !t.pinned));
				},
				insertBefore: function(...args) {
					arrowScrollbox.insertBefore(...args);
				},
				contains: function(node) {
					return new Error().stack.match(/^on_drop@/m) ?
						!!node?.closest("#tabbrowser-arrowscrollbox .tabbrowser-tab[pinned]") :
						contains.apply(this, arguments);
				},
			});
		}

		{
			let {contains} = arrowScrollbox;
			assign(arrowScrollbox, {
				prepend: function(...tabs) {
					let firstNormal = [...arrowScrollbox.children].find(t => !t.pinned && !tabs.includes(t));
					tabs.forEach(tab => arrowScrollbox.insertBefore(tab, firstNormal));
				},
				contains: function(node) {
					return new Error().stack.match(/^on_drop@/m) ?
						!!node?.closest("#tabbrowser-arrowscrollbox :is(tab-group, .tabbrowser-tab:not([pinned]))") :
						contains.apply(this, arguments);
				},
			});
		}
	}

	//the original function modifies --tab-overflow-pinned-tabs-width and cause undesired size changing of the slot,
	//which will cause weird bouncing of the scroll position,
	//plus the positioning is not the same logic, thus rewrite it and not wrap it.
	tabContainer._positionPinnedTabs = function(numPinned = gBrowser.pinnedTabCount) {
		if (this._hasTabTempMaxWidth || !numPinned && !this._lastNumPinned
				|| appVersion < 132 && new Error().stack.match(/^_initializeArrowScrollbox\/<@/m))
			return;

		if (prefs.inlinePinnedTabs) {
			let pinnedTabs = gBrowser.visibleTabs.slice(0, numPinned);
			let positioned = false;

			if (numPinned) {
				let overflowing = !!scrollbox.scrollTopMax;
				let maxRows = maxTabRows();

				if (overflowing && maxRows > 1) {
					let tabWidth = getRect(pinnedTabs[0]).width;
					let slotWidth = getRect(slot).width;
					let {preTabsItemsSize = 0, postTabsItemsSize = 0, tabsStartSeparator = 0} = lastLayoutData || {};
					let firstRowCount = Math.floor((slotWidth - preTabsItemsSize - postTabsItemsSize - tabsStartSeparator) / tabWidth);
					let otherRowsCount = Math.floor(slotWidth / tabWidth);
					if (firstRowCount + otherRowsCount * (maxRows - 1) >= numPinned) {
						pinnedTabs.slice(0, firstRowCount).forEach((t, i) =>
								assign(t.style, {
									marginTop: 0,
									marginInlineStart: preTabsItemsSize + tabsStartSeparator + i * tabWidth + "px",
								}));
						pinnedTabs.slice(firstRowCount).forEach((t, i) => assign(t.style, {
							marginTop: (0 | i / otherRowsCount + 1) * tabHeight + "px",
							marginInlineStart: i % otherRowsCount * tabWidth + "px",
						}));
						let lastPinnedS = pinnedTabs.at(-1).style;
						assign(this.style, {
							"--last-pinned-tab-bottom": parseFloat(lastPinnedS.marginTop) + tabHeight + "px",
							"--last-pinned-tab-end": parseFloat(lastPinnedS.marginInlineStart) + tabWidth + "px",
						});
						this.toggleAttribute("multirow-pinned-tabs", numPinned > firstRowCount);
						positioned = true;
					}
				}
			}

			if (!positioned) {
				for (let t of pinnedTabs)
					assign(t.style, {marginTop: "", marginInlineStart: ""});
				assign(this.style, {
					"--last-pinned-tab-bottom": "",
					"--last-pinned-tab-end": "",
				});
			}

			this.toggleAttribute("positionpinnedtabs", positioned);
			tabsBar.toggleAttribute("positionpinnedtabs", positioned);
			// tabsBar.toggleAttribute("pinned-tabs-wraps-placeholder", !!wrapPlaceholder);
			this.toggleAttribute("haspinnedtabs", numPinned);
		} else {
			console.trace();

			console.time("_positionPinnedTabs - calculation");

			let width, rows, maxRows, columns, spacers, preTabsItemsSize, wrapPlaceholder;
			let gap = prefs.gapAfterPinned;

			let layoutData = this._pinnedTabsLayoutCache;
			let uiDensity = root.getAttribute("uidensity");
			if (!layoutData || layoutData.uiDensity != uiDensity)
				layoutData = this._pinnedTabsLayoutCache = {
					uiDensity,
					scrollStartOffset: gap,
				};

			let forcedOverflow = this.hasAttribute("forced-overflow");
			let isPositioned = this.hasAttribute("positionpinnedtabs") && !forcedOverflow;
			let tabs = getNodes();
			let pinnedTabs = tabs.slice(0, numPinned);
			let lastTab = tabs.at(-1);
			// //not using arrowScrollbox.overflowing in case it is not updated in time
			// let overflowing = !!scrollbox.scrollTopMax;
			let {overflowing} = this;
			let floatPinnedTabs = numPinned && tabs.length > numPinned && overflowing && !prefs.autoCollapse;
			let {tabsUnderControlButtons} = prefs;
			if (this._isCustomizing)
				tabsUnderControlButtons = 0;

			if (floatPinnedTabs) {
				width = (layoutData.width ||= getRect(tabs[0]).width);
				preTabsItemsSize = getRect(this._placeholderPreTabs, {box: "margin"}).width;
				rows = getRowCount();
				maxRows = maxTabRows();
				if (rows > 1) {
					if (tabsUnderControlButtons == 2) {
						spacers = Math.ceil(preTabsItemsSize / width);
						if (spacers && spacers == numPinned - 1)
							spacers++;
					} else
						spacers = 0;
					columns = Math.ceil(numPinned <= spacers * (rows - 1) ? numPinned / (rows - 1) : (numPinned + spacers) / rows);
					if (tabsUnderControlButtons == 2)
						spacers = Math.min(columns, spacers);
				} else {
					columns = numPinned;
					spacers = 0;
				}
				let boxWidth = getRect(this, {box: "padding"}).width;
				floatPinnedTabs = pointDelta(
					columns * width + gap + tabMinWidth + this.newTabButton.clientWidth +
							getRect(this._placeholderPostTabs, {box: "content", checkVisibility: true}).width +
							scrollbox.scrollbarWidth,
					boxWidth
				) <= 0;
				wrapPlaceholder = floatPinnedTabs && pointDelta(columns * width + gap, preTabsItemsSize) >= 0;
			}

			console.timeEnd("_positionPinnedTabs - calculation");

			console.time("_positionPinnedTabs - update");

			if (this._lastNumPinned != numPinned) {
				this.toggleAttribute("haspinnedtabs", numPinned);
				this._lastNumPinned = numPinned;
				this._handleTabSelect(true);
			}

			if (!isPositioned && floatPinnedTabs)
				//not sure why the !important is required, it is overrided by some unknown rule
				assign(slot.style, {minHeight: tabHeight * (maxRows + 1) + "px !important"});

			this.removeAttribute("forced-overflow");
			this.style.removeProperty("--forced-overflow-adjustment");

			this.toggleAttribute("positionpinnedtabs", floatPinnedTabs);
			tabsBar.toggleAttribute("positionpinnedtabs", floatPinnedTabs);
			tabsBar.toggleAttribute("pinned-tabs-wraps-placeholder", !!wrapPlaceholder);

			if (floatPinnedTabs) {
				this.style.setProperty("--tab-overflow-pinned-tabs-width", columns * width + "px");

				if (!isPositioned) {
					let lastTabRect = getRect(lastTab);
					//case 1:
					//tabContainer clientWidth 909, 2 pinned tabs, no new tab button, tUCB 0
					//case 2:
					//outerWidth 1306, 3 buttons pre tabs, 1 button post tabs,
					//--pre-tabs-items-width: 160px; --post-tabs-items-width: 218px;
					//2 pinned tabs, total 61 tabs, no new tab button, tUCB 2
					if (pointDelta(lastTabRect.bottom, getRect(slot).bottom) < 0) {
						let lastRowSize = 0;
						for (let i = tabs.length - 1; i > -1; i--) {
							let r = getRect(tabs[i]);
							if (pointDelta(lastTabRect.y, r.y))
								break;
							lastRowSize += isTab(tabs[i]) ? tabMinWidth : r.width;
						}
						this.setAttribute("forced-overflow", "");
						let adjacentNewTab = this.hasAttribute("hasadjacentnewtabbutton");
						let adj = Math.max(
							adjacentNewTab ? newTabButtonWidth : 0,
							getRect(scrollbox).width - lastRowSize + 1,
						);
						assign(this.style, {"--forced-overflow-adjustment": adj + "px"});
						if (debug)
							console.warn("positionpinnedtabs makes underflow!", {
								numPinned, adjacentNewTab, maxRows, lastRowSize,
								outerWidth, adj, lastLayoutData,
							});
					}
				}

				slot.style.minHeight = "";

				pinnedTabs.forEach((tab, i) => {
					i += spacers + Math.max(columns - numPinned, 0);
					assign(tab.style, {
						marginInlineStart: -((columns - i % columns) * width) + "px",
						marginTop: Math.floor(i / columns) * tabHeight + "px",
					});
				});

				console.log(`_positionPinnedTabs`, true, {isPositioned, columns, spacers, numPinned, overflowing, overflowAttr: this.hasAttribute("overflow")});
			} else if (isPositioned || forcedOverflow) {
				console.log(`_positionPinnedTabs: false, overflowing: ${overflowing}, overflowAttr: ${this.hasAttribute("overflow")}`);

				for (let tab of pinnedTabs)
					assign(tab.style, {marginTop: "", marginInlineStart: ""});
				this.style.removeProperty("--tab-overflow-pinned-tabs-width");
			}

			console.timeEnd("_positionPinnedTabs - update");
		}
	};

	//remove the margin when unpinned, as the modified _positionPinnedTabs does not handle the normal tabs,
	//which are handled in the original function.
	//the rest of clean up is done by gBrowser.unpinTab()
	tabContainer.addEventListener("TabUnpinned", e => e.target.style.marginTop = "");

	//mark down the position information first in case the tab is moved away before the dragover kicks off,
	//e.g. scrollIntoView
	//TODO: test on touch device
	{
		["mousedown", "touchstart"].forEach(n => tabContainer.addEventListener(n, down, true));
		["mouseup", "touchend"].forEach(n => tabContainer.addEventListener(n, up, true));

		function down(e) {
			if (e.type == "mousedown" && e.button || e.type == "touchstart" && e.touches.length > 1)
				return;
			let tab = this._getDragTargetTab(e);
			if (tab) {
				let {screenX, screenY} = e;
				let oriNodeRect = getRect(tab);
				this._lastMouseDownData = {
					tab,
					atTabXPercent: (screenX - tab.screenX) / oriNodeRect.width,
					screenX,
					screenY,
					oriScreenX: screenX,
					oriScreenY: screenY,
					oriNodeRect,
				};
				this.setAttribute("tabmousedown", "");
				fakeScrollbar.style.setProperty("--slot-height", slot.clientHeightDouble + "px");
				fakeScrollbar.scrollTop = scrollbox.scrollTop;
				//mouseup will not be fired in many cases, but mouseleave always will
				//TODO: touch event may have similar problem
				this.addEventListener("mouseleave", function f(e) {
					if (e.target != this) return;
					this.removeEventListener("mouseleave", f, true);
					up.call(this, e);
				}, true);
			}
		}

		function up(e) {
			if (e.type == "mouseup" && e.button ||
					e.type == "touchend" && e.touches.length ||
					!this._lastMouseDownData)
				return;
			delete this._lastMouseDownData;
			//in a rare case the tabContainer bounces when opening a tab group
			//however it can only be reproduced in a very specific situation but seems random
			//wrapping it with rAF seems help but can't verify
			requestAnimationFrame(() => {
				this.removeAttribute("tabmousedown");
				fakeScrollbar.style.removeProperty("--slot-height");
			});
		}
	}

	tabContainer.startTabDrag = function(e, tab, opt) {
		let draggingTab = isTab(tab);
		//don't execute the original #moveTogetherSelectedTabs, which can't be replaced
		let useCustomGrouping = tab.multiselected && !gReduceMotion;
		if (useCustomGrouping) {
			this._groupSelectedTabs(tab);
			tab.removeAttribute("multiselected");
		} else if (!draggingTab && !opt?.fromTabList) {
			//set the attribute early to prevent the selected tab is applied the transform.
			//in such case, the tab will be affect with the visual extra width in until the attribute perform
			this.setAttribute("moving-tabgroup", "");
			tab.group.setAttribute("movingtabgroup", "");
		}

		if (!opt?.fromTabList &&
				(prefs.hideDragPreview == (draggingTab ? 2 : 1) || prefs.hideDragPreview == 3)) {
			tab.style.visibility = "hidden";
			requestAnimationFrame(() => tab.style.visibility = "");
			let dt = e.dataTransfer;
			dt.updateDragImage = dt.setDragImage = () => {};
		}

		pauseStyleAccess(() => startTabDrag.apply(this, arguments));
		(draggingTab ? tab : tab.parentNode).removeAttribute("dragtarget");

		let {pinned, _dragData} = tab;

		//if it is from tab list, there is no mouse down data
		let data = this._lastMouseDownData;
		if (data) {
			assign(_dragData, data);

			//handle the case that the tab has been shifted after mousedown
			let nR = getRect(tab), oR = data.oriNodeRect;
			_dragData.oriScreenX += Math.round(nR.x - oR.x + (nR.width - oR.width) * _dragData.atTabXPercent);
			_dragData.oriScreenY += Math.round(nR.y - oR.y);
		}

		assign(_dragData, {
			pinned: !!pinned,
			draggingTab,
			movingPositionPinned: pinned && this.hasAttribute("positionpinnedtabs"),
		});

		delete this._lastMouseDownData;
		fakeScrollbar.style.removeProperty("--slot-height");

		//fix the movingTabs as the original is told that there is no multiselect
		if (useCustomGrouping) {
			_dragData.movingTabs = gBrowser.selectedTabs.filter(t => t.pinned == pinned);
			if (tab._groupData) {
				_dragData._groupData = tab._groupData;
				delete tab._groupData;
			}
			tab.setAttribute("multiselected", true);
		}
	};

	//since the original _groupSelectedTabs will modify the transform property
	//and cause improper transition animation,
	//rewite the whole _groupSelectedTabs and not execute the original one
	tabContainer._groupSelectedTabs = function(draggedTab) {
		console.time("_groupSelectedTabs");

		let groupData = new Map();
		let {pinned} = draggedTab;
		let {selectedTabs} = gBrowser;
		let visibleTabs = getNodes();
		let pos = item => isTab(item) ? item["elementIndex" in item ? "elementIndex" : "_tPos"]
				: item.firstChild.elementIndex;
		let animate = !gReduceMotion;

		let tranInfos = [];

		let pinnedTabs = [], normalTabs = [];
		for (let t of selectedTabs)
			(t.pinned ? pinnedTabs : normalTabs).push(t);
		[
			[pinnedTabs, pinned ? draggedTab : pinnedTabs.at(-1)],
			[normalTabs, pinned ? normalTabs[0] : draggedTab],
		].forEach(([tabs, centerTab]) => {
			if (!centerTab) return;

			let _tPos = pos(centerTab);
			let centerIdx = visibleTabs.indexOf(centerTab);
			let centerIdxInTabs = tabs.indexOf(centerTab);
			let basedIdx = centerIdx - centerIdxInTabs;
			let basedPos = _tPos - centerIdxInTabs;
			tabs.forEach((movingTab, i) => {
				if (movingTab == centerTab) {
					if (movingTab != draggedTab)
						groupData.set(movingTab, {});
				} else {
					groupData.set(movingTab, {});
					addAnimationData(movingTab, basedIdx + i, basedPos + i, centerIdx, pos(movingTab) < _tPos, centerTab);
				}
			});
		});

		function addAnimationData(movingTab, newIndex, newPos, centerIdx, beforeCenter, centerTab) {
			let oldIndex = visibleTabs.indexOf(movingTab);
			if (oldIndex == newIndex)
				return;

			let data = groupData.get(movingTab);
			assign(data, {
				indexShift: newIndex - oldIndex,
				newPos,
				centerTab,
				beforeCenter,
			});

			let lowerIndex = Math.min(oldIndex, centerIdx);
			let higherIndex = Math.max(oldIndex, centerIdx);

			for (let i = lowerIndex + 1; i < higherIndex; i++) {
				let middle = visibleTabs[i];

				if ((middle.pinned || false) != movingTab.pinned)
					break;

				if (middle.multiselected)
					continue;

				let data = groupData.get(middle);
				if (!data || !("indexShift" in data))
					groupData.set(middle, data = {indexShift: 0});

				data.indexShift += beforeCenter ? -1 : 1;
			}
		}

		if (animate)
			visibleTabs.forEach((tab, i) => {
				if (groupData.get(tab)?.indexShift)
					tranInfos.push({t: tab, r: getRect(tab)});
			});

		let tabIndex = selectedTabs.indexOf(draggedTab);

		for (let i = 0; i < tabIndex; i++)
			moveTab(i);
		for (let i = selectedTabs.length - 1; i > tabIndex; i--)
			moveTab(i);

		function moveTab(i) {
			let t = selectedTabs[i];
			let data = groupData.get(t);
			let tabIndex = data.newPos;
			if (tabIndex)
				//use moveTabs here to save the effort of implementing movTab on fx115
				gBrowser[data.beforeCenter ? "moveTabsBefore" : "moveTabsAfter"]([t], data.centerTab);
		}

		if (animate)
			draggedTab._groupData = tranInfos;

		console.log(tranInfos);

		console.timeEnd("_groupSelectedTabs");
	};

	tabContainer.on_dragover = function(e) {
		//in case the ctrl is released before the animation is done
		if (this.hasAttribute("animate-finishing"))
			return;

		if (["", "none"].includes(this.getDropEffectForTabDrag(e))) {
			on_dragover.apply(this, arguments);
			return;
		}

		let dt = e.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let draggingTab = isTab(draggedTab);
		let sameWindow = draggedTab?.ownerDocument == document;
		let copy = dt.dropEffect == "copy";
		let animate = draggedTab && sameWindow && !copy;

		tabsBar.toggleAttribute("tabs-dragging-ext", !animate);

		if (!this.hasAttribute("dragging")) {
			console.time("on_dragover - setup");
			this.removeAttribute("tabmousedown");
			this.setAttribute("dragging", "");
			tabsBar.setAttribute("tabs-dragging", "");

			this.lockSlotSize();
			gBrowser.addEventListener("mousemove", this);
			addEventListener("mouseout", this);

			arrowScrollbox.lockScroll = true;
			clearTimeout(passingByTimeout);
			passingByTimeout = setTimeout(() => {
				arrowScrollbox.lockScroll = false;
				if (this.hasAttribute("multirows")) {
					let panel = document.getElementById("customizationui-widget-panel");
					if (panel) {
						let panelRect = getRect(panel), tabsRect = getRect(this);
						if (!(pointDelta(panelRect.bottom, tabsRect.y) <= 0
								|| pointDelta(panelRect.y, tabsRect.bottom) >= 0
								|| pointDeltaH(panelRect.end, tabsRect.start) <= 0
								|| pointDeltaH(panelRect.start, tabsRect.end) >= 0))
							panel.hidePopup();
					}
				}
			}, this._dragOverDelay || 350);
			fakeScrollbar.scrollTop = scrollbox.scrollTop;

			if (animate) {
				//set the attribute early to prevent the placeholders hide during moving pinned tabs together
				let movingPinned = !!draggedTab?.pinned;
				let movingPositionPinned = movingPinned && this.hasAttribute("positionpinnedtabs");
				this.toggleAttribute("moving-pinned-tab", movingPinned);
				this.toggleAttribute("moving-positioned-tab", movingPositionPinned);
				tabsBar.toggleAttribute("moving-positioned-tab", movingPositionPinned);
			}

			console.timeEnd("on_dragover - setup");
		}

		let ind = this._tabDropIndicator;

		console.time("original on_dragover");

		let hidden;
		Object.defineProperties(ind, {
			//when copying tab in the same window,
			//the original on_dragover hide the indicator (modify DOM), measure arrowScrollbox,
			//and show the indicator (modify DOM again), cause serious reflow problem and terribly lag.
			hidden: {set: v => hidden = v, configurable: true},
			//ignore the transform setting
			style: {get: () => ({}), configurable: true},
		});

		try {
			on_dragover.apply(this, arguments);
		} finally {
			delete ind.hidden;
			delete ind.style;
		}

		console.timeEnd("original on_dragover");

		let target = this._getDragTargetTab(e);
		const movingTab = this.hasAttribute("movingtab");
		const updatePinState = sameWindow && dropToPinSupported && !copy &&
				draggingTab && target &&
				draggedTab.pinned != target.pinned;

		if (updatePinState)
			hidden = false;

		switch (e.originalTarget) {
			case arrowScrollbox._scrollButtonUp:
			case arrowScrollbox._scrollButtonDown:
				hidden = true;
		}

		if (hidden != null)
			ind.hidden = hidden;

		if (hidden) {
			if (movingTab)
				ind.style.transform = "";
			return;
		}

		console.time("on_dragover - update indicator");

		const numPinned = gBrowser.pinnedTabCount;
		const nodes = getNodes({onlyFocusable: true});
		const firstNonPinned = nodes[numPinned];

		let idx = this._getDropIndex(e);
		let lastNode = nodes.at(-1);
		let lastIdx = indexOf(lastNode);

		console.debug("drag ind", idx, target);

		if (movingTab) {
			if (updatePinState) {
				if (draggedTab.pinned)
					target = firstNonPinned;
				else {
					target = nodes[numPinned - 1];
					this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
					this._setDragOverGroupColor(null);
					delete draggedTab._dragData.shouldCreateGroupOnDrop;
				}
				idx = numPinned;
			}
		} else {
			if (isTabGroupLabel(draggedTab)) {
				if (target?.pinned)
					idx = numPinned;
				else {
					let {group} = target || {};
					if (group)
						if (idx <= (group.visibleTabs.at(-1) || group.labelElement).elementIndex)
							idx = (target = group.labelElement).elementIndex;
						else
							target = nodes[idx];
				}
			} else if (draggedTab?._dragData.fromTabList && sameWindow && !copy) {
				if (draggedTab.pinned) {
					if (!dropToPinSupported) {
						lastNode = nodes[lastIdx = numPinned - 1];
						if (!target?.pinned)
							idx = numPinned;
					}
				} else if (!target)
					idx = lastIdx + 1;
				else if (!dropToPinSupported && target.pinned)
					idx = numPinned;
			} else if (target?.pinned && (!draggedTab || sameWindow))
				//dragging external thing or copying tabs
				idx = numPinned;

			if (idx == numPinned ||
					/*there may be hidden tabs before non pinned*/
					idx == firstNonPinned?._tPos)
				target = firstNonPinned;
		}

		if (idx > lastIdx || !target)
			target = lastNode;

		if (target) {
			let targetRect = getRect(elementToMove(target), {translated: false});
			let boxRect = getRect(arrowScrollbox);
			let x = targetRect[idx != indexOf(target) ? "end" : "start"] - boxRect.start;
			let boxHalf = boxRect.height / 2;
			let y = Math.max(Math.min((targetRect.y + targetRect.height / 2) - (boxRect.y + boxHalf), boxHalf), -boxHalf);
			let {style} = ind;
			if (!style.transform) {
				style.transition = "none";
				requestAnimationFrame(() => requestAnimationFrame(() => style.transition = ""));
			}
			style.transform = `translate(calc(${x}px + 50% * ${DIR}), ${y}px)`;
		} else
			ind.hidden = true;

		function indexOf(e) {
			return e.elementIndex ?? e._tPos;
		}

		console.timeEnd("on_dragover - update indicator");
	};

	//since the original _animateTabMove will modify the transform property and cause improper transition animation,
	//rewite the whole _animateTabMove and not execute the original one
	tabContainer._animateTabMove = function(e) {
		const tabGroupsEnabled = gBrowser._tabGroupsEnabled;
		const dragToGroupTabs = prefs.dragToGroupTabs && tabGroupsEnabled;
		const draggedTab = e.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);
		const {_dragData} = draggedTab;
		const {
			pinned, recursion, draggingTab, movingTabs, movingPositionPinned,
			lastScreenX, lastScreenY, oriScreenX, oriScreenY,
		} = _dragData;

		if (oriScreenX == null) {
			//fx 143 bug, may be due to the group preview-panel
			console.error("Try to drag without mousedown data!");
			return;
		}

		const TIMER = "_animateTabMove" + (recursion ? "_recursion" : "");
		console.time(TIMER);

		const {screenX: eX, screenY: eY} = e;
		const scrollOffset = movingPositionPinned ? 0 : scrollbox.scrollTop;

		//the animate maybe interrupted and restart, don't initialize again
		if (lastScreenX == null) {
			let numPinned = gBrowser.pinnedTabCount;

			//set boxTop before updating nodes
			let movingNodes;
			if (draggingTab)
				movingNodes = movingTabs;
			else {
				let {group} = draggedTab;
				movingNodes = [draggedTab.parentNode];
				if (group.hasActiveTab) {
					//in case there is actually no visible tabs (firefox bug)
					movingNodes.push(...group.visibleTabs);
					if (group.hasAttribute("hasmultipletabs"))
						movingNodes.push(group.overflowCountLabel.parentNode);
				}
			}
			assign(_dragData, {
				boxTop: getRect(scrollbox).y,
				movingNodes,
			});

			updateNodeRects();

			let {tabs, _groupData} = _dragData;

			let moveOverThreshold = tabGroupsEnabled ?
					Math.min(1, Math.max(0, Services.prefs.getIntPref("browser.tabs.dragDrop.moveOverThresholdPercent") / 100)) :
					.5;
			let groupThreshold = 1 - moveOverThreshold;
			if (!dragToGroupTabs)
				moveOverThreshold = .5;

			assign(_dragData, {
				scrollPos: movingPositionPinned ? 0 : scrollOffset,
				numPinned,
				moveOverThreshold,
				groupThreshold,
				draggedNode: elementToMove(draggedTab),
				createGroupDelay: dragToGroupTabs &&
						Services.prefs.getIntPref("browser.tabs.dragDrop.createGroup.delayMS"),
			});

			if (_groupData) {
				let newRects = _groupData.map(({t}) => getRect(t));
				_groupData.forEach(({t, r}, i) => animateShifting(t, r, newRects[i]));
				delete _dragData._groupData;
			}

			console.timeLog(TIMER, "init");
			console.log(_dragData);
		}

		let {numPinned, movingNodes} = _dragData;

		if (!tabsBar.hasAttribute("movingtab")) {
			if (draggingTab)
				InspectorUtils.addPseudoClassLock(draggedTab, ":hover");
			else {
				//the attribute may be removed when finishAnimateTabMove has fired after ctrl was pressed
				this.setAttribute("moving-tabgroup", "");
				draggedTab.group.setAttribute("movingtabgroup", "");
			}
			this.setAttribute("movingtab", true);
			gNavToolbox.setAttribute("movingtab", true);
			tabsBar.setAttribute("movingtab", "");
			if (draggingTab && !draggedTab.multiselected)
				this.selectedItem = draggedTab;
			arrowScrollbox.style.setProperty("--scroll-top", scrollOffset + "px");
			this.toggleAttribute("moving-single-tab", movingNodes.length == 1);
			this.pinnedDropIndicator?.toggleAttribute("visible", draggingTab && !numPinned);

			//these three has set at on_dragover early but they will removed when the dragging is paused
			let positionPinned = pinned && this.hasAttribute("positionpinnedtabs");
			this.toggleAttribute("moving-pinned-tab", pinned);
			this.toggleAttribute("moving-positioned-tab", positionPinned);
			tabsBar.toggleAttribute("moving-positioned-tab", positionPinned);
		}

		if (!_dragData.needsUpdate && eX == lastScreenX && eY == lastScreenY
				&& !arrowScrollbox._isScrolling) {
			console.timeEnd(TIMER);
			return;
		}
		delete _dragData.needsUpdate;

		console.debug(`animate tab move, recursion=${recursion}`, eX, eY);

		let {
			moveForward,
			nodes, nodeRects,
			atTabXPercent,
			boxTop,
			moveOverThreshold, groupThreshold, createGroupDelay,
			draggedNode,
		} = _dragData;

		let dirX = Math.sign(eX - (lastScreenX ?? oriScreenX));

		assign(_dragData, {lastScreenX: eX, lastScreenY: eY});

		let tranX, tranY, rTranX, rTranY, currentRow;
		let firstRect, lastRect, draggedRect, firstMovingRect, lastMovingRect;

		console.timeLog(TIMER, "before shift moving");
		shiftMovingNodes();
		console.timeLog(TIMER, "after shift moving");

		if (arrowScrollbox._isScrolling) {
			_dragData.needsUpdate = true;
			console.timeEnd(TIMER);
			return;
		}

		function shiftMovingNodes() {
			rTranX = tranX = eX - _dragData.oriScreenX;
			rTranY = tranY = eY - _dragData.oriScreenY;

			firstRect = rect(nodes[0]);
			lastRect = rect(nodes.at(-1));
			draggedRect = rect(draggedNode);
			firstMovingRect = rect(movingNodes[0]);
			lastMovingRect = rect(movingNodes.at(-1));

			let scrollChange = scrollOffset - _dragData.scrollPos;

			currentRow = Math.min(Math.max(
					Math.floor((draggedRect.y + draggedRect.height / 2 + tranY + scrollOffset + scrollChange - boxTop) / tabHeight),
					firstRect.row),
					lastRect.row);

			let rects = [...nodeRects.values()];
			let firstRectInCurrentRow = rects.find(r => r.row == currentRow);
			let lastRectInCurrentRow = rects.findLast(r => r.row == currentRow);

			rTranX -= Math.min(pointDeltaH(draggedRect.start + rTranX, firstRectInCurrentRow.start), 0) * DIR;
			rTranX += Math.min(pointDeltaH(lastRectInCurrentRow.end, draggedRect.end + rTranX), 0) * DIR;

			console.debug("restrict tranX", rTranX - tranX, currentRow, firstRectInCurrentRow, lastRectInCurrentRow, rects);

			if (firstMovingRect.row == firstRect.row ||
					currentRow - draggedRect.row + firstMovingRect.row == firstRect.row) {
				if (currentRow < draggedRect.row && firstMovingRect.row == firstRect.row)
					rTranX -= pointDeltaH(firstMovingRect.start + rTranX, firstRect.start) * DIR;
				//don't restrict in the cases the node is placed to the end of previous row
				//instead of the location of dragging over typically when dragging a unnammed tab group to the row start
				else if (currentRow == draggedRect.row)
					rTranX -= Math.min(pointDeltaH(firstMovingRect.start + rTranX, firstRect.start), 0) * DIR;
				rTranY -= Math.min(pointDelta(firstMovingRect.y + rTranY + scrollChange, firstRect.y), 0);
			} else if (pointDeltaH(firstMovingRect.start + rTranX, firstRect.start, true) < 0)
				rTranY -= Math.min(pointDelta(firstMovingRect.y + rTranY + scrollChange, firstRect.bottom), 0);

			if (lastMovingRect.row == lastRect.row ||
					currentRow - draggedRect.row + lastMovingRect.row == lastRect.row) {
				if (currentRow > draggedRect.row && lastMovingRect.row == lastRect.row)
					rTranX -= pointDeltaH(lastMovingRect.end + rTranX, lastRect.end) * DIR;
				else if (currentRow == draggedRect.row)
					rTranX += Math.min(pointDeltaH(lastRect.end, lastMovingRect.end + rTranX), 0) * DIR;
				rTranY += Math.min(pointDelta(lastRect.y, lastMovingRect.y + rTranY + scrollChange), 0);
			} else if (pointDeltaH(lastMovingRect.end + rTranX, lastRect.end, true) > 0)
				rTranY += Math.min(pointDelta(lastRect.y, lastMovingRect.bottom + rTranY + scrollChange), 0);

			console.debug("restrict tranY", rTranY - tranY, currentRow, draggedRect.row, lastMovingRect.row, lastRect.row);

			let movingUp = rTranY + scrollOffset < _dragData.scrollPos;
			if (!movingPositionPinned) {
				let p = _dragData.scrollPos;
				tranY -= p;
				rTranY -= p;
			}

			let maxZIndex = 0;
			movingNodes.forEach((node, i, a) => {
				let {row} = _dragData.nodeRects.get(node);
				let zIndex = 2 + (rTranX > 0 != RTL_UI ? a.length - i : i) + (movingUp ? row : lastRect.row - row) * a.length;
				maxZIndex = Math.max(maxZIndex, zIndex);
				let style = {
					"--translate-x": rTranX ? rTranX + "px" : "",
					"--translate-y": rTranY ? rTranY + "px" : "",
					zIndex,
				};
				assign(node.style, style);
				if (isTabGroupLabelContainer(node) && _dragData.expandGroupOnDrop)
					for (let t of node.parentNode.nonHiddenTabs.filter(t => !t.visible))
						assign(t.style, style);
			});
			assign(gNavToolbox.style, {"--tabs-moving-max-z-index": maxZIndex});

			tabContainer.pinnedDropIndicator?.toggleAttribute("interactive",
					movingNodes[0] == nodes[0] && rTranX - tranX > firstRect.width * groupThreshold);
		}

		const cursorMovingForward = dirX ? dirX == DIR : (moveForward ?? eY >= oriScreenY);
		const rowChange = currentRow - (_dragData.currentRow ?? rect(draggedNode).row);
		assign(_dragData, {currentRow});

		switch (Math.sign(rowChange)) {
			case -1: moveForward = false; break;
			case 1: moveForward = true; break;
			default: moveForward = cursorMovingForward;
		}

		let groupOfDraggedNode = draggedTab[draggingTab ? "group" : "parentNode"];

		let draggingGroupAtGroup;
		let leader = movingNodes.at(moveForward ? -1 : 0);
		let leaderRect = rect(leader);

		leaderRect.start += tranX;
		leaderRect.y += tranY + scrollOffset;

		let previousNode, previousOverlap;
		let dropAfterElement, dropBeforeElement;
		let overlapBefore = false, overlapAfter = false;

		let tabsBeforeMoving = nodes.slice(0, nodes.indexOf(movingNodes[0]));
		let tabsAfterMoving = nodes.slice(nodes.indexOf(movingNodes.at(-1)) + 1);

		let leaderCenterY = leaderRect.y + leaderRect.height / 2;

		if (firstMovingRect.row == firstRect.row && currentRow < draggedRect.row)
			dropBeforeElement = tabsBeforeMoving[0];
		else if (lastMovingRect.row == lastRect.row && currentRow > draggedRect.row)
			dropAfterElement = tabsAfterMoving.at(-1);
		else {
			leaderCenterY = Math.min(Math.max(leaderCenterY, firstRect.y), lastRect.bottom - 1);

			let prv, nxt;
			let row = nodes.flatMap((t, i) => {
				if (nxt) return [];
				let r = rect(t);
				if (pointDelta(r.y, leaderCenterY) <= 0 && pointDelta(leaderCenterY, r.bottom) < 0) {
					if (!prv) {
						let [tabBeforeRow, tab2ndBeforeRow] = movingNodes.includes(nodes[i - 1]) ?
								[tabsBeforeMoving.at(-1), tabsBeforeMoving.at(-2)] :
								[nodes[i - 1], nodes[i - 2]];
						if (!moveForward && leader != draggedNode && i) {
							let edge = r.start - leaderRect.width * DIR;
							prv = [
								{t: tab2ndBeforeRow, r: {start: -Infinity * DIR, end: edge, width: Infinity}},
								{t: tabBeforeRow, r: {start: edge, end: r.start, width: leaderRect.width}},
							];
						} else
							prv = [{t: tabBeforeRow, r: {start: -Infinity * DIR, end: r.start, width: Infinity}}];
					} if (i == nodes.length - 1)
						nxt = [{t: null, r: {start: r.end, end: Infinity * DIR, width: Infinity}}];
					return movingNodes.includes(t) ? [] : {t, r};
				}
				if (prv) {
					let [tabAfterRow, tab2ndAfterRow] = movingNodes.includes(t) ?
							[tabsAfterMoving[0], tabsAfterMoving[1]] :
							[t, nodes[i + 1]];
					let prvR = rect(nodes[i - 1]);
					if (moveForward && leader != draggedNode) {
						let edge = prvR.end + leaderRect.width * DIR;
						nxt = [
							{t: tabAfterRow, r: {start: prvR.end, end: edge, width: leaderRect.width}},
							{t: tab2ndAfterRow, r: {start: edge, end: Infinity * DIR, width: Infinity}},
						];
					} else
						nxt = [{t: tabAfterRow, r: {start: prvR.end, end: Infinity * DIR, width: Infinity}}];
				}
				return [];
			});

			//out of slot
			if (!prv) {
				console.timeEnd(TIMER);
				return;
			}

			console.debug("target row", prv, row, nxt, moveForward);

			[...prv, ...row, ...nxt][moveForward ? "findLast" : "find"](({t, r}, i, row) => {
				let passing = calcPassing(r);
				let rPassing = calcPassing(r, rTranX - tranX);

				//forced to use .5 when rowChange since the dragged tab may be moved to a place
				//that is not passing enough over the threshould
				let threshold = recursion || rowChange ||
						prefs.dynamicMoveOverThreshold && (
							pinned ||
							!draggingTab ||
							groupOfDraggedNode == (t?.closest("tab-group") || false) && !(
								!moveForward &&
								_dragData.groupOfLastAction != groupOfDraggedNode &&
								!groupOfDraggedNode.isShowingOverflowCount &&
								groupOfDraggedNode.visibleTabs.at(-1) == movingNodes.at(-1)
							) ||
							t?.matches(".tab-group-overflow-count-container") ||
							isTabGroupLabelContainer(t) &&
									t.parentNode[appVersion > 142 ? "isShowingOverflowCount" : "collapsed"] ||
							moveForward && t?.matches("tab-group:not([collapsed]) .tab-group-label-container") &&
									(!_dragData.groupOfLastAction || _dragData.groupOfLastAction == t.parentNode)
						) ?
					.5 : moveOverThreshold;

				if (rPassing > threshold) {
					if (!i && !moveForward) {
						dropBeforeElement = row[1].t;
						dropAfterElement = t;
					} else if (i == row.length - 1 && moveForward) {
						dropBeforeElement = t;
						dropAfterElement = row.at(-2).t;
					} else {
						let prv = row[i + (moveForward ? 1 : -1)];
						[dropAfterElement, dropBeforeElement] = moveForward ? [t, prv?.t] : [prv?.t, t];
					}

					if (draggingTab && !pinned)
						if (moveForward)
							overlapAfter = previousOverlap;
						else
							overlapBefore = previousOverlap;
					return true;
				}

				previousOverlap = passing > groupThreshold;
			});

			if (!draggingTab) {
				let group = dropBeforeElement?.matches("tab-group > tab, .tab-group-overflow-count-container") &&
						dropBeforeElement.closest("tab-group");
				if (group) {
					draggingGroupAtGroup = true;
					if (cursorMovingForward) {
						dropAfterElement =
							group.isShowingOverflowCount ?
							group.overflowCountLabel.parentNode :
							group.tabs.findLast(t => t.visible) || group.firstChild;
						dropBeforeElement = nodes.slice(nodes.indexOf(dropAfterElement) + 1)
								.find(t => t != draggedNode);
					} else {
						dropBeforeElement = group.firstChild;
						dropAfterElement = nodes.slice(0, nodes.indexOf(dropBeforeElement))
								.findLast(t => t != draggedNode);
					}
				}
			}

			function calcPassing(r, shift = 0) {
				return Math.max(moveForward ?
					pointDeltaH(leaderRect.end + shift, r.start) :
					pointDeltaH(r.end, leaderRect.start + shift)
				, 0) / Math.min(r.width, leaderRect.width);
			}
		}

		if (debug) {
			cleanUpDragDebug();
			console.log({dropAfterElement, dropBeforeElement, overlapAfter, overlapBefore});
			dropBeforeElement?.setAttribute("test-drop-before", true);
			dropAfterElement?.setAttribute("test-drop-before", false);
			dropBeforeElement?.toggleAttribute("test-drop-overlap", overlapAfter);
			dropAfterElement?.toggleAttribute("test-drop-overlap", overlapBefore);
		}

		//use drop before in general to prevent unintended grouping, switch to drop after otherwise
		let dropBefore = !!dropBeforeElement;
		let dropElement = dropBeforeElement || dropAfterElement;

		if (draggingTab && !pinned) {
			if (dragToGroupTabs)
				this[CLEAR_DRAG_OVER_GROUPING_TIMER]();

			let overlapTarget = overlapBefore && dropAfterElement ||
					overlapAfter && dropBeforeElement;
			let overlappingTab = isTab(overlapTarget);
			if (
				overlappingTab && !overlapTarget.group ||
				appVersion > 142 && isTabGroupLabelContainer(overlapTarget) &&
						overlapTarget.parentNode.collapsed && draggedTab.group != overlapTarget.parentNode
			) {
				if (dragToGroupTabs)
					this[DRAG_OVER_GROUPING_TIMER] = setTimeout(
						() => {
							let args = [overlappingTab ? overlapTarget : overlapTarget.firstChild];
							if (appVersion > 142) {
								_dragData[
									overlappingTab ? "shouldCreateGroupOnDrop" : "shouldDropIntoCollapsedTabGroup"
								] = true;
								this._setDragOverGroupColor(
									overlappingTab ? _dragData.tabGroupCreationColor : overlapTarget.parentNode.color
								);
							} else
								args.unshift(_dragData);
							this["_"+TRIGGER_DRAG_OVER_GROUPING](...args);
						},
						createGroupDelay,
					);
				if (overlapBefore) {
					dropBefore = false;
					dropElement = dropAfterElement;
				}
			} else {
				this.removeAttribute(MOVINGTAB_GROUP);
				this.removeAttribute("movingtab-addToGroup");
				$(`[${DRAGOVER_GROUPTARGET}]`)?.removeAttribute(DRAGOVER_GROUPTARGET);
				delete _dragData.shouldCreateGroupOnDrop;
				delete _dragData.shouldDropIntoCollapsedTabGroup;

				let afterOpenGroup = dropAfterElement?.closest("tab-group:not([collapsed]:not([hasactivetab]))");
				if (afterOpenGroup)
					if (!dropBefore && (overlapAfter || !overlapBefore && !draggedNode.group))
						dropElement = afterOpenGroup;
					else if (overlapBefore && afterOpenGroup != dropBeforeElement?.closest("tab-group")
							|| !overlapAfter && draggedNode.group == afterOpenGroup) {
						dropElement = dropAfterElement;
						dropBefore = false;
					}
			}
		}

		if (isTabGroupLabelContainer(dropElement)) {
			let group = dropElement.parentNode;
			dropElement = dropBefore || group.collapsed && !group.hasActiveTab ? group : $("slot", group);
		} else if (!dropBefore && dropElement?.matches(".tab-group-overflow-count-container"))
			dropElement = dropElement.parentNode;

		let shouldMove = dropElement && Object.entries({dropBefore, dropElement}).some(([k, v]) => _dragData[k] != v);
		if (debug)
			console.log({shouldMove, dropBefore, dropElement});
		assign(_dragData, {dropElement, dropBefore, moveForward});

		// if (false)
		//TODO: ignore the cases that won't actually move, especially on the first round
		if (shouldMove) {
			console.timeLog(TIMER, "before move");

			animateLayout(async () => {
				let oldVisualRects = !recursion &&
						new Map(movingNodes.map(t => {
							let r = getVisualRect(t);
							r.y += scrollOffset;
							return [t, r];
						}));

				gBrowser[dropBefore ? "moveTabsBefore" : "moveTabsAfter"](movingTabs, dropElement);
				console.timeLog(TIMER, "moved");

				if (rowChange && !_dragData.tabSizeUnlocked) {
					await this._unlockTabSizing({unlockSlot: false});
					_dragData.tabSizeUnlocked = true;
				}

				//the slot may expand due to the rearrangement
				this.lockSlotSize();

				assign(animatingLayout, {shouldUpdatePlacholder: false});
				this._updateInlinePlaceHolder();
				updateNodeRects();

				let newNodeRects = _dragData.nodeRects;

				let oldDraggedR = nodeRects.get(draggedNode);
				let newDraggedR = newNodeRects.get(draggedNode);
				let p = _dragData.atTabXPercent;
				let widthDelta = newDraggedR.width - oldDraggedR.width;
				let resizeShift = widthDelta * p;

				_dragData.oriScreenX += Math.round(newDraggedR.x - oldDraggedR.x + resizeShift);
				_dragData.oriScreenY += Math.round(newDraggedR.y - oldDraggedR.y);

				if (recursion)
					return;

				_dragData.groupOfLastAction = groupOfDraggedNode;

				if (rowChange && !draggingGroupAtGroup && !pinned) {
					assign(_dragData, {
						needsUpdate: true,
						moveForward: !moveForward,
						recursion: true,
					});

					this._animateTabMove(e);
					assign(_dragData, {
						moveForward,
						recursion: null,
					});

					newNodeRects = _dragData.nodeRects;
					newDraggedR = newNodeRects.get(draggedNode);
				}

				({nodes, nodeRects} = _dragData);
				shiftMovingNodes();

				if (animatingLayout) {
					if (RTL_UI)
						resizeShift = widthDelta * (p - 1);
					for (let t of movingNodes) {
						let oldVR = oldVisualRects.get(t);
						let newR = newNodeRects.get(t).clone();

						oldVR.start -= oldDraggedR.start - resizeShift;
						oldVR.y -= oldDraggedR.y;
						newR.start -= newDraggedR.start;
						newR.y -= newDraggedR.y;

						animatingLayout.rects.set(t, oldVR);
						animatingLayout.newRects.set(t, newR);
					}
				}
			}, {nodes});
		}

		console.timeEnd(TIMER);

		function rect(node) {
			let r = nodeRects.get(node).clone();
			r.y -= scrollOffset;
			return r;
		}

		function updateNodeRects() {
			let nodes = getNodes({pinned});
			let nodeRects = new Map(nodes.map(n => {
				let r = getRect(n);
				r.y += scrollOffset;
				r.row = Math.round(pointDelta(r.y, _dragData.boxTop, true) / tabHeight);
				return [n, r];
			}));
			for (let node of _dragData.movingNodes) {
				let r = nodeRects.get(node);
				assign(node.style, {
					"--width-rounding-diff": r.widthRoundingDiff + "px",
					"--height-rounding-diff": r.heightRoundingDiff + "px",
				});
			}
			assign(_dragData, {nodes, nodeRects});
		}
	};

	function cleanUpDragDebug() {
		if (!debug) return;
		$$("[test-drop-before]").forEach(e => e.removeAttribute("test-drop-before"));
		$$("[test-drop-overlap]").forEach(e => e.removeAttribute("test-drop-overlap"));
		getNodes().forEach(t => t.style.outline = t.style.boxShadow = "");
	};

	tabContainer.on_dragleave = function(e) {
		on_dragleave.apply(this, arguments);

		if (e.target == this && prefs.dragToGroupTabs && gBrowser._tabGroupsEnabled) {
			this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
			this.removeAttribute(MOVINGTAB_GROUP);
			$(`[${DRAGOVER_GROUPTARGET}]`)?.removeAttribute(DRAGOVER_GROUPTARGET);
		}

		let target = event.relatedTarget;
		while (target && target != this)
			target = target.parentNode;
		if (!target)
			postDraggingCleanup();
	};

	tabContainer.on_dragend = function(e) {
		pauseStyleAccess(() => on_dragend.apply(this, arguments), e.target);
		postDraggingCleanup();
	};

	tabContainer.on_drop = function(event) {
		let dt = event.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let {_dragData} = draggedTab || {};
		if (_dragData)
			if (_dragData.shouldDropIntoCollapsedTabGroup)
				_dragData.dropElement = _dragData.dropElement.labelElement;
			else if (!_dragData.shouldCreateGroupOnDrop)
				delete _dragData.dropElement;

		pauseStyleAccess(() => on_drop.apply(this, arguments), draggedTab);

		postDraggingCleanup();
	};

	tabContainer[FINISH_ANIMATE_TAB_MOVE] = function() {
		let draggingTab, movingNodes, _dragData, rectsBeforeCreateGroup;
		let {selectedTab} = gBrowser;
		//_animateTabMove is not triggered when copying tab at first, i.e. pressing ctrl before dragging tab
		//thus chack the `movingtab` of tabs bar instead
		if (tabsBar.hasAttribute("movingtab") && !this.hasAttribute("animate-finishing")) {
			//mark down the translated tabs and perform a restoring animate
			if (!(draggingTab = !this.hasAttribute("moving-tabgroup"))) {
				movingNodes	= $$(`[movingtabgroup] > :not(
					slot,
					tab[hidden],
					:not([hasactivetab], [hasmultipletabs]) > .tab-group-overflow-count-container
				)`, this);
				({_dragData} = movingNodes[0].firstChild);
			} else {
				({_dragData} = selectedTab);
				({movingNodes} = _dragData);
				if (_dragData.shouldCreateGroupOnDrop && !_dragData.dropElement.group)
					rectsBeforeCreateGroup = getNodes({newTabButton: true})
							.map(t => [t, getRect(t, {translated: true})]);
				else if (movingNodes[0].pinned != _dragData.pinned) {
					//_positionPinnedTabs() won't be called when moving tabs so call it explicitly
					this._positionPinnedTabs();
					this._updateInlinePlaceHolder();
				}
			}

			for (let [ele, as] of [
				[this, ["moving-pinned-tab", "moving-positioned-tab", "moving-single-tab", "moving-tabgroup"]],
				[tabsBar, ["movingtab", "moving-positioned-tab"]],
				[this.pinnedDropIndicator, ["visible", "interactive"]],
			])
				for (let a of as)
					ele?.removeAttribute(a);
		}

		finishAnimateTabMove.apply(this, arguments);

		if (prefs.dragToGroupTabs && gBrowser._tabGroupsEnabled)
			this[CLEAR_DRAG_OVER_GROUPING_TIMER]();

		if (movingNodes?.length) {
			this.setAttribute("animate-finishing", "");
			assign(arrowScrollbox.style, {"--scroll-top": ""});

			_dragData.needsUpdate = true;

			(async () => {
				try {
					if (rectsBeforeCreateGroup)
						//wait a little bit to let the group be created first
						await 0;

					//no group created if the dragging is canceled
					let {group} = movingNodes[0];
					if (rectsBeforeCreateGroup && group) {
						//new group sometimes causes the positioned pinned tabs messing up,
						//not sure why but update it again can help
						this._positionPinnedTabs();

						let newRects = rectsBeforeCreateGroup.map(([t]) => getRect(t));
						let label = group.firstChild;
						group.setAttribute("fadein", "");
						movingNodes.forEach(node => {
							assign(node.style, {
								"--translate-x": "",
								"--translate-y": "",
							});
						});
						label.setAttribute("animate-shifting", "start");
						requestAnimationFrame(() => label.setAttribute("animate-shifting", "run"));
						await Promise.all(rectsBeforeCreateGroup.map(([t, r], i) => animateShifting(t, r, newRects[i])))
								.then(() => {
									group.removeAttribute("fadein");
									label.removeAttribute("animate-shifting");
								});
					} else {
						this._keepTabSizeLocked = true;

						if (_dragData.shouldDropIntoCollapsedTabGroup)
							await animateLayout(async () => {
								//wait for the hasActiveTab stuff update
								await 0;
								this._updateInlinePlaceHolder();
							}, {rects: new Map(movingNodes.map(node => {
								node.setAttribute("animate-shifting", "run");
								let r = getVisualRect(node, true);
								node.removeAttribute("animate-shifting");
								assign(node.style, {
									"--translate-x": "",
									"--translate-y": "",
								});
								return [node, r];
							}))});
						else
							await Promise.all(movingNodes.map(node => {
								let s = node.style;
								if (["--translate-x", "--translate-y"].every(p => !s.getPropertyValue(p)))
									return;
								node.setAttribute("animate-shifting", "run");
								assign(s, {
									"--translate-x": "",
									"--translate-y": "",
								});
								return waitForAnimation(node, {property: "transform"})
										.then(() => node.removeAttribute("animate-shifting"));
							}));

						delete this._keepTabSizeLocked;

						if (!draggingTab) {
							let group = movingNodes[0].parentNode;
							group.removeAttribute("movingtabgroup");

							if (_dragData.expandGroupOnDrop) {
								if (group.nonHiddenTabs.length) {
									group.collapsed = false;
									await group.togglingAnimation;
								} else
									await this._unlockTabSizing({unlockSlot: false});
							}
						}
					}

					if (gBrowser.tabGroups) {
						await Promise.all(gBrowser.tabGroups.map(async g => {
							if (!g.tabs[0]) {
								g.dispatchEvent(new CustomEvent("TabGroupRemoved", {bubbles: true}));
								g.remove();
								await g.removingAnimation;
							} else {
								if (g.hasActiveTab && selectedTab.group != g)
									await animateLayout(() => {
										//activate the #tabChangeObserver
										g.appendChild(g.tabs.at(-1));
										//update the [hasactivetab] explicitly as
										//the observer isn't called instantly
										g.hasActiveTab = false;
									}, {animate: g.isShowingOverflowCount});
								else if (g.hasActiveTab == false && selectedTab.group == g)
									g.hasActiveTab = true;
							}
						}));
					}

					for (let node of getNodes()) {
						//the dragged tab may be unselected thus clear all tabs for safety
						InspectorUtils.clearPseudoClassLocks(node, ":hover");
						assign(node.style, {
							zIndex: "",
							"--width-rounding-diff": "",
							"--height-rounding-diff": "",
						});
					}

					(draggingTab ? selectedTab : movingNodes[0]).scrollIntoView();
				} finally {
					this.removeAttribute("animate-finishing");
					assign(gNavToolbox.style, {"--tabs-moving-max-z-index": ""});
				}
			})();
		}
	};

	function postDraggingCleanup() {
		clearTimeout(passingByTimeout);
		tabContainer._tabDropIndicator.style.transform = "";
		arrowScrollbox.lockScroll = false;
		for (let [ele, attrs] of [
			[tabContainer, ["tabmousedown", "dragging"]],
			[tabsBar, ["tabs-dragging", "tabs-dragging-ext", "movingtab"]],
		])
			for (let a of attrs)
				ele?.removeAttribute(a);

		cleanUpDragDebug();
	}

	//replace the original function with modified one
	tabContainer._notifyBackgroundTab = function(tab) {
		if (tab.pinned && this.hasAttribute("positionpinnedtabs") ||
				!(tab.visible ?? !tab.hidden) ||
				!this.overflowing)
			return;

		this._lastTabToScrollIntoView = tab;
		if (this._backgroundTabScrollPromise)
			return;

		this._backgroundTabScrollPromise = promiseDocumentFlushed(() => {
			let selectedTab = this.selectedItem;
			return [
				this._lastTabToScrollIntoView,
				this.arrowScrollbox.scrollClientRect,
				this._lastTabToScrollIntoView.getBoundingClientRect(),
				!selectedTab.pinned && selectedTab.getBoundingClientRect(),
			];
		}).then(([tabToScrollIntoView, scrollRect, tabRect, selectedRect]) => {
			delete this._backgroundTabScrollPromise;
			if (this._lastTabToScrollIntoView != tabToScrollIntoView) {
				this._notifyBackgroundTab(this._lastTabToScrollIntoView);
				return;
			}
			delete this._lastTabToScrollIntoView;
			if (scrollRect.y <= tabRect.y && tabRect.bottom <= scrollRect.bottom)
				return;

			if (this.arrowScrollbox.smoothScroll) {
				if (
					!selectedRect ||
					Math.max(tabRect.bottom - selectedRect.y, selectedRect.bottom - tabRect.y) <= scrollRect.height
				) {
					arrowScrollbox.ensureElementIsVisible(tabToScrollIntoView);
					return;
				}

				//try to copy normal tab to the pinned tab side will make the new tab be placed at front
				//the original function always scroll down
				let edge = tabRect.y > selectedRect.y ? "top" : "bottom";
				arrowScrollbox.scrollByPixels(selectedRect[edge] - scrollRect[edge]);
			}

			let ele = this._animateElement;
			if (!ele.hasAttribute("highlight")) {
				ele.setAttribute("highlight", "");
				setTimeout(() => ele.removeAttribute("highlight"), 1000);
			}
		});
	};

	tabContainer._updateCloseButtons = function() {
		if (new Error().stack.match(/^handleResize@/m))
			return;
		if (!this._closeButtonsUpdatePending && !animatingLayout)
			requestAnimationFrame(() => requestAnimationFrame(() => {
				let {_tabClipWidth} = this;
				for (let tab of gBrowser.visibleTabs) {
					let {width} = windowUtils.getBoundsWithoutFlushing(tab);
					let {pinned} = tab;
					tab.toggleAttribute("closebutton", !pinned && pointDelta(width, _tabClipWidth) > 0);
					if (appVersion > 136) {
						tab.toggleAttribute("mini-audio-button", !pinned && width < 100);
						tab.overlayIcon.toggleAttribute("pinned", pinned || width < 100);
					}
				}
			}));
		_updateCloseButtons.apply(this, arguments);
	};
	tabContainer.addEventListener("TabMove", function({target: tab}) {
		if (!tab.pinned)
			this._updateCloseButtons();

		if (gBrowser.pinnedTabsContainer && !this.hasAttribute("movingtab"))
			this._updateInlinePlaceHolder();
	}, true);

	let placeholderStyle = document.body.appendChild(document.createElement("style"));
	let lastLayoutData = null;

	tabContainer._updateInlinePlaceHolder = function(numPinned = gBrowser.pinnedTabCount) {
		if (animatingLayout?.shouldUpdatePlacholder)
			return;

		if (!tabMinWidth) {
			this.uiDensityChanged();
			return;
		}

		console.time("_updateInlinePlaceHolder");

		//ensure the elementIndex is set for all tabs
		let nodes = getNodes();
		if (!nodes[0]) {
			console.timeEnd("_updateInlinePlaceHolder");
			return;
		}

		tabsBar.toggleAttribute("tabs-is-first-visible",
				this.matches(":nth-child(1 of :not([hidden=true], [collapsed=true]))"));

		//not using this.overflowing in case it is not updated in time
		let overflowing = !!scrollbox.scrollTopMax;

		let onlyUnderflow = prefs.tabsUnderControlButtons < 2
		if (overflowing && onlyUnderflow
				|| innerWidth < prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery
				|| this._isCustomizing
				|| !prefs.tabsUnderControlButtons) {
			if (lastLayoutData) {
				placeholderStyle.innerHTML = "";
				tabsBar.style.removeProperty("--pre-tabs-items-width");
				tabsBar.style.removeProperty("--post-tabs-items-width");
				tabsBar.removeAttribute("has-items-pre-tabs");
				tabsBar.removeAttribute("has-items-post-tabs");
				lastLayoutData = null;
			}
			console.timeEnd("_updateInlinePlaceHolder");
			this._positionPinnedTabs(numPinned);
			return;
		}

		let winRect = getRect(root, {box: "margin"});
		let tabsRect = getRect(this, {box: "margin"});
		let overflowSize = Math.min(tabsRect.width, 0); //adjustment for extreme cases, e.g. too many buttons in tabs bar
		let preTabsItemsSize = pointDeltaH(tabsRect.start, winRect.start) - overflowSize;
		let postTabsItemsSize = pointDeltaH(winRect.end, tabsRect.end) + overflowSize;
		let {scrollbarWidth} = scrollbox;

		assign(tabsBar.style, {
			"--pre-tabs-items-width": preTabsItemsSize + "px",
			"--post-tabs-items-width": postTabsItemsSize + "px",
		});
		tabsBar.toggleAttribute("has-items-pre-tabs", preTabsItemsSize);
		//there is an extra padding after tabs for shifting the items to not cover the scrollbar
		tabsBar.toggleAttribute("has-items-post-tabs", pointDelta(postTabsItemsSize, onlyUnderflow ? 0 : scrollbarWidth) > 0);

		console.timeLog("_updateInlinePlaceHolder", "update pre/post tabs items width");

		if (!this.hasAttribute("movingtab") || this.hasAttribute("moving-positioned-tab"))
			this._positionPinnedTabs(numPinned);

		let adjacentNewTab = !overflowing && this.hasAttribute("hasadjacentnewtabbutton");
		let positionPinned = this.hasAttribute("positionpinnedtabs");
		let winWidth = winRect.width;
		let winMaxWidth = Math.max(screen.width - screen.left + 8, winWidth + tabMinWidth);
		let winMinWidth = parseInt(getComputedStyle(root).minWidth);
		let pinnedWidth = numPinned && !positionPinned ? getRect(nodes[0]).width : 0;
		let firstStaticWidth = pinnedWidth || tabMinWidth;
		let pinnedGap = prefs.gapAfterPinned;
		let pinnedReservedWidth = positionPinned ?
				parseFloat(this.style.getPropertyValue("--tab-overflow-pinned-tabs-width")) + pinnedGap : 0;

		let inlinePreTabCS = getComputedStyle(slot, "::before");

		let tabsStartSeparator = Math.round(parseFloat(inlinePreTabCS.marginInlineEnd)
				+ parseFloat(inlinePreTabCS.borderInlineEndWidth) + parseFloat(inlinePreTabCS.paddingInlineEnd));

		let base = Math.max(preTabsItemsSize + tabsStartSeparator, pinnedReservedWidth) + postTabsItemsSize;

		console.timeLog("_updateInlinePlaceHolder", "gather all info");

		console.trace();

		lastLayoutData = {
			preTabsItemsSize, postTabsItemsSize, tabsStartSeparator, base, firstStaticWidth, scrollbarWidth,
			adjacentNewTab, newTabButtonWidth, pinnedWidth, numPinned, winMinWidth, winMaxWidth, tabMinWidth,
		};

		onlyUnderflow = onlyUnderflow ? ":not([overflow])" : "";
		let css = `
			@media (max-width: ${base + firstStaticWidth + (adjacentNewTab ? newTabButtonWidth : 0) - EPSILON}px) {
				${prefs.floatingBackdropClip ? `
					#tabbrowser-tabs${onlyUnderflow} {
						--top-placeholder-clip:
								${START_PC} var(--tab-height),
								calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR}) var(--tab-height);
					}
				` : ``}
				#TabsToolbar:not([tabs-hide-placeholder]) #tabbrowser-tabs[multirows]${onlyUnderflow}
						#tabbrowser-arrowscrollbox::part(items-wrapper)::before {
					width: calc(100% - var(--tabstrip-size)) !important;
					margin-inline-end: 0;
					border-inline-end-width: 0;
					border-end-end-radius: 0;
					padding-inline-end: var(--tabstrip-size);
				}
				#tabs-placeholder-pre-tabs {
					--tabstrip-padding: 0;
					width: calc(100vw - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)));
					border-inline-end-width: 0;
					border-radius: 0;
					clip-path: inset(0 0 var(--clip-shadow) 0);
				}
				#tabs-placeholder-pre-tabs::before {
					clip-path: var(--controlbox-clip-path);
				}
				${prefs.hideEmptyPlaceholderWhenScrolling ? `
					#TabsToolbar[tabs-is-first-visible] #tabs-placeholder-pre-tabs {
						visibility: visible;
					}
				` : ``}
				#tabs-placeholder-post-tabs {
					visibility: collapse;
				}
				#tabbrowser-tabs[multirows]${onlyUnderflow} #tabbrowser-arrowscrollbox::part(items-wrapper)::after
						{visibility: collapse}
				#tabbrowser-tabs${onlyUnderflow} #tabbrowser-arrowscrollbox
						:is(.tabbrowser-tab, .tab-group-label-container, .tab-group-overflow-count-container, #tabbrowser-arrowscrollbox-periphery)
								{order: 2}
			}
		`;

		if ("elementIndex" in nodes[0]) {
			let lastIdx = nodes.at(-1).getAttribute("elementIndex");
			let prvIdx;
			for (
				let i = positionPinned ? numPinned : 0;
				pointDelta(base, winMaxWidth) <= 0 && i < nodes.length;
				i++
			) {
				let node = nodes[i];
				let idx = node.getAttribute("elementIndex");
				let width = isTab(node) ?
					(
						i < numPinned ?
						pinnedWidth :
						parseFloat(node.style.maxWidth) || tabMinWidth
					) :
					getRect(node).width;

				if (!i)
					base += width + (numPinned == 1 ? pinnedGap : 0);
				else {
					let nodeSelector = `:is(
						:not([collapsed]) > .tabbrowser-tab:not([closing], [hidden]),
						.tab-group-label-container,
						[collapsed][hasactivetab] [selected],
						[collapsed][hasactivetab][hasmultipletabs] .tab-group-overflow-count-container
					)`;
					css += `
						@media (min-width: ${base}px) and (max-width: ${(base += width) - EPSILON}px) {
							${i < numPinned ? "" : nodeSelector}[elementIndex="${prvIdx}"] {
								& ~ :not(tab-group[collapsed] > tab:not([selected])), tab-group:has(&) ~ * {
									&, tab-group& > * {
										order: 2;
									}
								}
							}
						}
					`;

					if (i == numPinned - 1 && idx != lastIdx)
						css += `
							@media (min-width: ${base}px) and (max-width: ${(base += pinnedGap) - EPSILON}px) {
								.tabbrowser-tab:nth-last-child(1 of [pinned]:not([hidden])) {--gap-after-pinned: 0px}
								.tabbrowser-tab ~ :not([pinned]) {&, tab-group& > * {order: 2}}
							}
						`;

					if (adjacentNewTab && idx == lastIdx)
						css += `
							@media (min-width: ${base}px) and (max-width: ${base + newTabButtonWidth - EPSILON}px) {
								#tabbrowser-tabs:not([ignore-newtab-width]) ${nodeSelector}[elementIndex="${prvIdx}"] {
									& ~ :not(tab-group[collapsed] > tab:not([selected])), tab-group:has(&) ~ * {
										&, tab-group& > * {
											order: 2;
										}
									}
								}
							}
						`;
				}

				prvIdx = idx;
			}
			console.log(css);
		} else {
			if (adjacentNewTab)
				css += `
					@media (max-width: ${base + firstStaticWidth + newTabButtonWidth - EPSILON}px) {
						.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])),
						.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])) ~ *
							{order: 2}
					}
				`;
			if (pinnedWidth) {
				base += pinnedWidth;

				//wrap pinned tabs
				for (let i = 1; i < numPinned; i++) {
					let min = base, max = (base += pinnedWidth) - EPSILON;
					if (pointDelta(max, winMinWidth) >= 0)
						css += `
							@media (min-width: ${min}px) and (max-width: ${max}px) {
								.tabbrowser-tab:nth-child(${i} of :not([hidden])):not(:nth-last-child(1 of .tabbrowser-tab:not([hidden]))) ~ * {order: 2}
							}
						`;
				}
				//remove the gap after pinned to prevent the last pinned being wrapped, and force all non-pinned to wrap
				css += `
					@media (min-width: ${base}px) and (max-width: ${base + pinnedGap - EPSILON}px) {
						.tabbrowser-tab:nth-last-child(1 of [pinned]:not([hidden])) {--gap-after-pinned: 0px}
						.tabbrowser-tab[pinned] ~ :not([pinned]) {order: 2}
					}
				`;
				//wrap the last pinned tab adjacent with new tab
				if (adjacentNewTab)
					css += `
						@media (min-width: ${base}px) and (max-width: ${base + newTabButtonWidth - EPSILON}px) {
							.tabbrowser-tab[pinned]:nth-last-child(2 of .tabbrowser-tab:not([hidden])) ~ * {order: 2}
						}
					`;
				base += pinnedGap;
			}

			for (let i = 0; pointDelta(base, winMaxWidth) <= 0; i++) {
				if (!i && !numPinned) {
					base += tabMinWidth;
					continue;
				}

				//wrap normal tabs
				css += `
					@media (min-width: ${base}px) and (max-width: ${(base += tabMinWidth) - EPSILON}px) {
						.tabbrowser-tab:nth-child(${numPinned + i} of :not([hidden], [closing])):not(:nth-last-child(1 of .tabbrowser-tab:not([hidden], [closing]))) ~ * {order: 2}
					}
				`;
				//wrap the last normal tab adjacent with new tab
				if (adjacentNewTab && pointDelta(base, winMaxWidth) <= 0)
					css += `
						@media (min-width: ${base}px) and (max-width: ${base + newTabButtonWidth - EPSILON}px) {
							.tabbrowser-tab:nth-child(${numPinned + i} of :not([hidden], [closing])):nth-last-child(2 of .tabbrowser-tab:not([hidden], [closing])) ~ * {order: 2}
						}
					`;
			}
		}

		if (placeholderStyle.innerHTML != css)
			placeholderStyle.innerHTML = css;

		console.timeEnd("_updateInlinePlaceHolder");
	};

	for (let n of [
		"TabOpen", "TabClose",
		"TabHide", "TabShow",
		"TabGroupCreate",
		"TabGroupExpand", "TabGroupCollapse", "TabGroupUpdate",
		"TabPinned", "TabUnpinned",
	])
		tabContainer.addEventListener(n, updateElementIndex);

	if (groupProto && "hasActiveTab" in groupProto)
		tabContainer.addEventListener("TabSelect", function(e) {
			if (gReduceMotion || !prefs.animationDuration)
				return;
			let {target} = e;
			let {previousTab} = e.detail;
			let pGroup = previousTab.group;
			let tGroup = target.group;
			if (pGroup?.collapsed && pGroup.hasActiveTab ||
					tGroup?.collapsed && !tGroup.hasActiveTab) {
				select(previousTab, target);
				if (animatingLayout) {
					/*it doesn't look that better to perform a animation if the duration is short*/
					/*it is acceptable to have no animation for the tab in closed group*/
					// if (new Error().stack.match(/^removeTab@/m) &&
							// !animatingLayout.nodes.includes(target)) {
						// animatingLayout.nodes.push(target);
						// animatingLayout.rects.set(target, getVisualRect(target));
						// select(target, previousTab);
						// animatingLayout.newRects.set(target, getVisualRect(target));
					// } else
						// //TODO: handle add tab
						select(target, previousTab);
				} else
					animateLayout(async () => {
						select(target, previousTab);
						pGroup?.setAttribute("toggling", "");
						tGroup?.setAttribute("toggling", "");
						//wait for the hasActiveTab update
						await 0;
					}, {
						//bypassing the cache since the elementIndex is dirty at this moment
						//and needs to keep dirty, otherwise the inline placeholder will be wrong positioned
						nodes: [...new Set([...getNodes({newTabButton: true, bypassCache: true}), target, previousTab])],
					}).then(() => {
						pGroup?.removeAttribute("toggling");
						tGroup?.removeAttribute("toggling");
					});

				function select(to, from) {
					for (let [t, v] of [[from, false], [to, true]])
						for (let a of ["visuallyselected", "selected"])
							t[v ? "setAttribute" : "removeAttribute"](a, v);
				}
			}
		});

	function updateElementIndex() {
		if (animatingLayout)
			return;
		this._invalidateCachedTabs();
		this.removeAttribute("forced-overflow");
		assign(this.style, {"--forced-overflow-adjustment": ""});

		//2 rAFs are required when adding tab and underflow -> overflow
		requestAnimationFrame(() => requestAnimationFrame(() => this._updateInlinePlaceHolder()));
	}

	tabContainer.addEventListener("TabGroupUpdate", function(e) {
		this._unlockTabSizing();
	});

	tabContainer._handleTabSelect = function() {
		if (
			arrowScrollbox._isScrolling ||
			this.hasAttribute("movingtab") ||
			this.hasAttribute("dragging") ||
			//it's so stupid that there is a resize listener added but it does not check the event target
			//it causes _handleTabSelect to be called unexpectedly whenever a browser view resizes
			new Error().stack.match(/^handleResize@/m)
		)
			return;

		console.trace();
		_handleTabSelect.apply(this, arguments);
	};

	tabContainer._lockTabSizing = function(actionNode) {
		//stop the original startTabDrag from locking the tabs when dragging a open tab group
		//currently only startTabDrag call this without parameter
		if (!actionNode || gBrowser[CLOSING_THE_ONLY_TAB] || isSlotJustifyCenter())
			return;

		console.time("_lockTabSizing");

		let nodes = getNodes({
			pinned: false,
			//be careful don't touch the ariaFocusableItems since it will update the elementIndex attribute when closing tab
			//and there will be two nodes with the same number, one is the closing tab and the other is the following node,
			//placeholder will be freaked out in this case
			bypassCache: "ariaFocusableItems" in this && new Error().stack.match(/^removeTab@/m),
		});
		let lock = false;

		if (nodes.length) {
			let collapsingGroup = !isTab(actionNode) && actionNode.group;
			if (collapsingGroup) {
				actionNode = actionNode.parentNode;
				nodes = nodes.filter(n => !collapsingGroup.tabs.includes(n));
			}

			let lastNode = nodes.at(-1);
			let actionNodeRect = getRect(actionNode);
			//dont use tab.elementIndex since it will access ariaFocusableItems
			//getAttribute() is "" on fx 115 so use || instead of ??
			let closingLastTab = !collapsingGroup &&
					+(actionNode.getAttribute("elementIndex") || actionNode._tPos) >
							+(lastNode.getAttribute("elementIndex") || lastNode._tPos);

			if (closingLastTab) {
				if (pointDelta(getRect(lastNode).y, actionNodeRect.y) < 0 ||
						actionNode.group?.collapsed) {
					this._closingTabsSpacer.style.width = 0;
					this.removeAttribute("using-closing-tabs-spacer");
					this.removeAttribute("ignore-newtab-width");

					if (this.overflowing) {
						this.lockSlotSize();
						lock = true;
					}
				} else {
					let slotRect = getRect(slot);
					let space = pointDeltaH(slotRect.end, actionNodeRect.end);
					if (slotRect.y == actionNodeRect.y)
						space -= lastLayoutData?.postTabsItemsSize ?? 0;
					if (this.hasAttribute("hasadjacentnewtabbutton"))
						space -= newTabButtonWidth;
					this._closingTabsSpacer.style.width = space + "px";
					this.setAttribute("using-closing-tabs-spacer", true);
					this.removeAttribute("ignore-newtab-width");
					lock = true;
				}

				for (let node of nodes)
					node.style.minWidth = node.style.maxWidth = "";
			} else {
				let currentRow = new Map();
				let rowStartIndex, rowStartPos, firstNodeInNextRow;
				loop: for (let i in nodes) {
					let node = nodes[i];
					if (node == actionNode && !collapsingGroup)
						continue;
					let r = getRect(node);
					switch (Math.sign(pointDelta(r.y, actionNodeRect.y))) {
						case 1:
							firstNodeInNextRow = node;
							break loop;
						case 0:
							rowStartIndex ??= i;
							rowStartPos ??= Math[RTL_UI ? "max" : "min"](r.start, actionNodeRect.start);
							currentRow.set(node, r.width);
					}
				}

				let lockLastTab;
				if (this.hasAttribute("hasadjacentnewtabbutton")) {
					let slotR = getRect(slot);
					let rowWidth = pointDeltaH(slotR.end, rowStartPos);
					if (actionNodeRect.y + scrollbox.scrollTop == slotR.y)
						rowWidth -= lastLayoutData?.postTabsItemsSize ?? 0;
					let totalMinWidth = 0, totalVisualWidth = 0, lastNodeWidth;
					for (let node of nodes.slice(rowStartIndex)) {
						let {width} = getRect(node);
						totalMinWidth += isTab(node) ? tabMinWidth : width;
						totalVisualWidth += width;
						if (node == lastNode)
							lastNodeWidth = width;
					}

					let canFitIn = pointDelta(totalMinWidth + newTabButtonWidth, rowWidth) <= 0;
					if (canFitIn && isTab(firstNodeInNextRow) && firstNodeInNextRow == lastNode) {
						let width = collapsingGroup ?
								currentRow.entries().find(([n, w]) => isTab(n))?.[1] :
								actionNodeRect.width;
						if (width) {
							//as the width of tab with audio-button is restricted to the same with normal tab,
							//here is safe to assume the width upcoming last tab in row.
							currentRow.set(firstNodeInNextRow, width);
							totalVisualWidth += width - lastNodeWidth;
							lockLastTab = true;
						}
					}

					let visuallyNotFitIn = pointDelta(totalVisualWidth + newTabButtonWidth, rowWidth) > 0;
					this.toggleAttribute("ignore-newtab-width", canFitIn && visuallyNotFitIn);
				}

				for (let node of (collapsingGroup && !lockLastTab ? nodes.slice(0, nodes.indexOf(actionNode) + 1) : nodes))
					if (node != actionNode || node == collapsingGroup?.firstChild) {
						let width = currentRow.get(node);
						node.style.minWidth = node.style.maxWidth = width ? width + "px" : "";
					}

				let movingTab = this.hasAttribute("movingtab");
				if (collapsingGroup && movingTab || this.overflowing)
					this.lockSlotSize(movingTab);

				this.removeAttribute("using-closing-tabs-spacer");
				this._closingTabsSpacer.style.width = "";
				lock = true;
			}
		}

		let action = lock ? "add" : "remove";
		gBrowser[`${action}EventListener`]("mousemove", this);
		window[`${action}EventListener`]("mouseout", this);
		this._hasTabTempMaxWidth = lock;

		console.timeEnd("_lockTabSizing");
	};

	tabContainer.lockSlotSize = function() {
		let {style} = arrowScrollbox;
		let rect = getRect(slot);
		for (let p of ["width", "height"])
			style.setProperty(`--slot-${p}`, rect[p] + "px");
	};

	tabContainer._unlockTabSizing = async function({instant, unlockSlot = true} = {}) {
		if (new Error().stack.match(/^(#expandGroupOnDrop|on_TabGroupCollapse)@/m) ||
				this._keepTabSizeLocked)
			return;

		if (unlockSlot) {
			console.time("_unlockTabSizing - general");

			//the slot can only shrink in height so only handle underflowing
			if (!instant && this.overflowing) {
				scrollbox.style.setProperty("overflow-y", "scroll", "important");
				this.style.setProperty("--tabs-scrollbar-width", scrollbarWidth + "px");
			}
			gBrowser.removeEventListener("mousemove", this);
			removeEventListener("mouseout", this);

			console.timeEnd("_unlockTabSizing - general");

			await this.unlockSlotSize(instant);
		}

		await animateLayout(async () => {
			if (this._hasTabTempMaxWidth) {
				for (let node of getNodes({pinned: false}))
					node.style.maxWidth = node.style.minWidth = "";
				delete this._hasTabTempMaxWidth;
				this.removeAttribute("ignore-newtab-width");
			}

			this.removeAttribute("using-closing-tabs-spacer");
			this._closingTabsSpacer.style.width = "";

			if (unlockSlot) {
				scrollbox.style.overflowY = "";
				this.style.removeProperty("--tabs-scrollbar-width");
			}
		}, {animate: !instant});
	};

	tabContainer.unlockSlotSize = async function(instant) {
		let oldHeight;
		if (!instant)
			oldHeight = slot.clientHeight - scrollbox.scrollTopMax + scrollbox.scrollTop;

		let {overflowing} = this;
		assign(arrowScrollbox.style, {"--slot-height": "", "--slot-width": ""});

		if (instant) return;

		let delta = pointDelta(oldHeight, slot.clientHeight);
		if (delta <= 0) return;

		let {smoothScroll} = arrowScrollbox;
		arrowScrollbox.smoothScroll = false;

		assign(slot.style, {
			transition: "none !important",
			paddingBottom: delta + "px",
		});
		scrollbox.scrollTop += delta;

		//not sure if this is necessary
		await promiseDocumentFlushed(() => {});
		await new Promise(rs => requestAnimationFrame(rs));

		assign(arrowScrollbox, {smoothScroll});

		assign(slot.style, {transition: "", paddingBottom: ""});
		await waitForAnimation(slot, {property: "padding-bottom"});
	};

	tabContainer.uiDensityChanged = function() {
		uiDensityChanged.apply(this, arguments);

		console.time("uiDensityChanged");

		let {newTabButton} = this;
		newTabButton.style.setProperty("display", "flex", "important");
		newTabButtonWidth = getRect(newTabButton).width;
		newTabButton.style.display = "";

		root.style.setProperty("--tab-height", (tabHeight = getRect(gBrowser.selectedTab).height) + "px");
		tabsBar.style.setProperty("--new-tab-button-width", newTabButtonWidth + "px");

		let minWidthPref = this._tabMinWidthPref;
		let extraWidth = root.getAttribute("uidensity") == "touch" ?
				(appVersion > 136 ? 10 : Math.max(86 - minWidthPref, 0)) :
				0;
		this.style.setProperty("--calculated-tab-min-width",
				(tabMinWidth = minWidthPref + extraWidth) + "px");

		console.timeEnd("uiDensityChanged");

		updateNavToolboxNetHeight();
		this._updateInlinePlaceHolder();
	};

	function pauseStyleAccess(callback, element) {
		let proto = (element?.ownerGlobal || window).XULElement.prototype;
		let oriStyle = Object.getOwnPropertyDescriptor(proto, "style");
		let dummy = {};

		Object.defineProperty(proto, "style", {
			get: function() {
				return new Error().stack.match(/^#(resetTabsAfterDrop|updateTabStylesOnDrag)@/m) ?
						dummy : oriStyle.get.call(this);
			},
			configurable: true,
		});

		try {
			callback();
		} finally {
			Object.defineProperty(proto, "style", oriStyle);
		}
	}
}

{
	if (!("pinnedTabCount" in gBrowser))
		Object.defineProperty(gBrowser, "pinnedTabCount", {
			get: function() {return this._numPinnedTabs},
			configurable: true,
		});

	let {
		addTab, removeTab, pinTab, unpinTab, pinMultiSelectedTabs,
		_updateTabBarForPinnedTabs, createTabsForSessionRestore,
	} = gBrowser;

	gBrowser.addTab = function(uri, o) {
		let tab;
		try {
			animateLayout(() => (tab = addTab.call(this, uri, assign(o, {skipAnimation: true}))),
					{animate: !o?.skipAnimation});
		} catch(e) {
			console.error(e);
		}
		return tab;
	};

	gBrowser.removeTab = function(tab, o) {
		let nodes = getNodes();
		if (nodes.length == 1 && nodes[0] == tab)
			this[CLOSING_THE_ONLY_TAB] = true;

		if (animatingLayout || !o?.animate || !this.visibleTabs.includes(tab) || gReduceMotion)
			removeTab.call(this, tab, assign(o, {animate: false}));
		else
			animateLayout(() => {
				let oldOrder = getComputedStyle(tab)?.order;
				removeTab.apply(this, arguments);
				if (!tab.closing || !tab.isConnected) {
					assign(animatingLayout, {cancel: true});
					return;
				}
				tab.setAttribute("fadein", true);
				tab.setAttribute("closing", "");
				assign(animatingLayout, {shouldUpdatePlacholder: false});
				tabContainer._updateInlinePlaceHolder();
				//the closing tab is stuck at the row end
				//and need to be translated manually to make it happen at the right place.
				//currently closing multiple tabs is not handled since the tabs are closed from rear to front
				//and it's unable to know if the tab will be placed at the previous row end
				//if all closing tabs become zero width
				if (animatingLayout) {
					let r = animatingLayout.rects.get(tab);
					let newR = getRect(tab);
					if (pointDelta(r.y, newR.y) || getComputedStyle(tab)?.order != oldOrder) {
						let wrongStart = newR.start, wrongY = newR.y;
						let {nodes} = animatingLayout;
						let nxtNode = nodes[nodes.indexOf(tab) + 1];
						newR = (nxtNode ? getRect(nxtNode) : r).clone();
						tab.style.transform = `translate(${newR.start - wrongStart}px, ${newR.y - wrongY}px)`;
						newR.width = 0;
					}
					animatingLayout.newRects.set(tab, newR);
				}
			}, {nodes: getNodes({newTabButton: true, includeClosing: true})})
				.then(() => {
					if (!tab.closing)
						return;
					tab.removeAttribute("fadein");
					tab.dispatchEvent(assign(new Event("transitionend", {bubbles: true}), {propertyName: "max-width"}));
					console.debug("removed", tab);
				});

		delete this[CLOSING_THE_ONLY_TAB];
	};

	gBrowser.pinTab = function(tab) {
		if (tab.pinned || tab == FirefoxViewHandler.tab)
			return pinTab.apply(this, arguments);

		let s = tab.style;
		animateLayout(() => {
			pinTab.apply(this, arguments);
			//pinned tab with a negative margin inline end stack will shrink
			//thus set a min width to prevent
			s.minWidth = getRect(tab).width + "px";
		}).then(() => {
			//here is executed after pinMultiSelectedTabs.apply() if pinning multi tabs
			//the min-width is handled there thus dont bother
			if (!new Error().stack.match(/^pinMultiSelectedTabs@/m))
				s.minWidth = "";
		});
	};

	gBrowser.unpinTab = function(tab) {
		animateLayout(() => unpinTab.apply(this, arguments), {animate: tab.pinned});
	};

	gBrowser.pinMultiSelectedTabs = function() {
		animateLayout(() => pinMultiSelectedTabs.apply(this, arguments))
				.then(() => this.selectedTabs.forEach(tab => tab.style.minWidth = ""));
	};

	if (gBrowser.pinnedTabsContainer)
		gBrowser._updateTabBarForPinnedTabs = function() {
			_updateTabBarForPinnedTabs.apply(this, arguments);
			if (!animatingLayout)
				tabContainer._positionPinnedTabs();
		};

	if (!gBrowser.moveTabsAfter)
		assign(gBrowser, {
			moveTabsAfter: function(tabs, {_tPos}) {
				this.moveTabsBefore(tabs, {_tPos: _tPos + 1});
			},
			moveTabsBefore: function(tabs, {_tPos}) {
				let forwardCount = 0;
				for (let i in tabs) {
					let t = tabs[i];
					this.moveTabTo(t, t._tPos < _tPos ? _tPos - 1 : _tPos + forwardCount++);
				}
			},
		});

	gBrowser.createTabsForSessionRestore = function() {
		let r;
		try {
			animatingLayout = {};
			try {
				r = createTabsForSessionRestore.apply(this, arguments);
			} finally {
				animatingLayout = null;
			}
			tabContainer._updateInlinePlaceHolder();
		} catch(e) {
			console.error(e);
		} finally {
			return r;
		}
	};
}

for (let [o, fs] of [
	[gBrowser, [
		"unpinMultiSelectedTabs",
		"moveTabsToStart",
		"moveTabsToEnd",
		"moveTabBackward",
		"moveTabForward",
		"addTabGroup",
	]],
	[TabContextMenu, [
		"ungroupTabs",
		["duplicateSelectedTabs", 1],
		"moveTabsToGroup",
	]],
	[window.SessionWindowUI || window, [
		["undoCloseTab", 1],
	]],
])
	for (let f of fs) {
		let [name, countChange] = [f].flat();
		let func = o[name];
		if (func)
			o[name] = function() {
				let r, oldNodes;
				animateLayout(() => {
					if (countChange)
						oldNodes = getNodes();
					r = func.apply(this, arguments);
					if (oldNodes)
						return getNodes().filter(n => !oldNodes.includes(n));
					return r;
				});
				return r;
			};
		else
			console.warn(`${name} is not found`);
	}

let tabsResizeObserver = new ResizeObserver(entries => {
	console.time("tabContainer ResizeObserver");

	//the underflow event isn't always fired, here we refer to the ResizeObserver in the constructor of MozArrowScrollbox
	let {scrollTopMax} = scrollbox;

	let multiRowsPreviously = tabContainer.hasAttribute("multirows");
	let count = getRowCount(), scrollCount = Math.min(getRowCount(true), maxTabRows());
	tabsBar.toggleAttribute("tabs-multirows", count > 1);
	tabContainer.toggleAttribute("multirows", count > 1);
	tabContainer._scrollRows = scrollCount;
	assign(root.style, {
		"--tab-rows": count,
		"--tab-scroll-rows": scrollCount,
	});

	if (count == 1 && multiRowsPreviously && prefs.justifyCenter == 1)
		tabContainer._unlockTabSizing();

	arrowScrollbox._updateScrollButtonsDisabledState();

	console.timeEnd("tabContainer ResizeObserver");

	if (arrowScrollbox.overflowing == !!scrollTopMax)
		tabContainer._updateInlinePlaceHolder();

	requestAnimationFrame(() => {
		tabContainer._updateCloseButtons();
		if (prefs.autoCollapse)
			tabContainer._handleTabSelect(true);
	});
});

for (let box of [tabContainer, slot])
	tabsResizeObserver.observe(box);

document.getElementById("toolbar-menubar").addEventListener("toolbarvisibilitychange", updateNavToolboxNetHeight, true);

arrowScrollbox._updateScrollButtonsDisabledState();
if ("hideAllTabs" in prefs)
	toggleAllTabsButton();

//the original scrollIntoView always scroll to ensure the tab is on the first visible row,
//for instance, when scrolling the box and the cursor touch the selected tab, will cause an annoying bouncing,
//fix it to be ensuring the tab is in view, if it already is, do nothing.
//use getRect() instead of getBoundingClientRect(), since when dragging tab too fast the box will scroll to half row
//because _handleTabSelect will try to scroll the translated position into view
function scrollIntoView({behavior} = {}) {
	let rect = getRect(this);
	let boxRect = getRect(scrollbox);
	let {scrollbarWidth} = scrollbox;
	if (!tabsBar.hasAttribute("tabs-hide-placeholder") && tabContainer.overflowing) {
		let preTabs = getRect(tabContainer._placeholderPreTabs, {box: "content", checkVisibility: true});
		let postTabs = getRect(tabContainer._placeholderPostTabs, {box: "content", checkVisibility: true});
		let newTab = getRect(tabContainer._placeholderNewTabButton, {box: "content", checkVisibility: true});
		if (!(prefs.hideEmptyPlaceholderWhenScrolling && tabsBar.hasAttribute("tabs-is-first-visible"))
				&& preTabs.width && pointDelta(rect.y, preTabs.bottom) < 0 && pointDeltaH(rect.start, preTabs.end) < 0)
			boxRect.y += tabHeight;
		else if (postTabs.width && pointDelta(rect.y, postTabs.bottom) < 0 && pointDeltaH(rect.end, postTabs.start) > 0)
			boxRect.y += tabHeight;
		else if (newTab.width && pointDelta(rect.bottom, newTab.y) > 0 && pointDeltaH(rect.end, newTab.start) > 0)
			boxRect.height -= tabHeight;
	}
	let top = rect.y - boxRect.y;
	let bottom = rect.bottom - boxRect.bottom;
	if (top >= 0 && bottom <= 0) return;

	//prevent scrollsnap from causing bouncing
	if (behavior != "instant" && !gReduceMotion) {
		let done;
		arrowScrollbox._stopScrollSnap = true;
		scrollbox.addEventListener("scrollend", f, true);
		setTimeout(() => {
			if (done) return;
			cleanUp();
			console.warn("scrollend is not fired");
		}, 2000);
		function f(e) {
			if (e.target != this) return;
			cleanUp();
		}
		function cleanUp() {
			done = true;
			scrollbox.removeEventListener("scrollend", f, true);
			delete arrowScrollbox._stopScrollSnap;
		}
	}
	scrollbox.scrollTo({
		top: scrollbox.scrollTop + (top < 0 ? top : bottom),
		behavior,
	});
}

function isSlotJustifyCenter() {
	return prefs.justifyCenter == 2 ||
			prefs.justifyCenter == 1 && !tabContainer.matches("[multirows], [overflow]");
}

function isTab(e) {
	return !!(e?.tagName == "tab");
}

function isTabGroupLabel(e) {
	return !!e?.classList?.contains("tab-group-label");
}

function isTabGroupLabelContainer(e) {
	return !!e?.classList?.contains("tab-group-label-container");
}

function elementToMove(item) {
	return isTabGroupLabel(item) ? item.parentNode : item;
}

function getNodes({pinned, newTabButton, bypassCache, includeClosing, onlyFocusable = false} = {}) {
	let nodes;
	if (bypassCache || includeClosing) {
		nodes = $$(`
			:not([collapsed]) > tab:not([hidden]),
			[collapsed][hasactivetab] > tab[selected],
			.tab-group-label-container
		`, arrowScrollbox);
		if (!includeClosing)
			nodes = nodes.filter(n => !n.closing);
	} else {
		nodes = tabContainer.ariaFocusableItems?.map(t => isTab(t) ? t : t.parentNode);
		if (!nodes)
			nodes = gBrowser.visibleTabs.slice();
	}
	if (!onlyFocusable && gBrowser.tabGroups?.[0])
		nodes.some((n, i) => {
			if (!isTabGroupLabelContainer(n)) return;
			let group = n.parentNode;
			if (group.isShowingOverflowCount) {
				nodes.splice(i + group.visibleTabs.length + 1, 0, group.overflowCountLabel.parentNode);
				return true;
			}
		});

	if (pinned != null) {
		let num = gBrowser.pinnedTabCount;
		nodes = nodes.slice(pinned ? 0 : num, pinned ? num : undefined);
	}
	if (newTabButton) {
		let btn = tabContainer.newTabButton;
		if (btn.checkVisibility({checkVisibilityCSS: true}))
			nodes.push(btn);
	}
	return nodes;
}

function toggleAllTabsButton() {
	document.getElementById("alltabs-button").hidden = prefs.hideAllTabs;
}

function getRowCount(allRows) {
	return Math.max(Math.round(getRect(allRows ? slot : scrollbox, {box: "content"}).height / tabHeight), 1);
}

function maxTabRows() {
	return +getComputedStyle(scrollbox).getPropertyValue("--max-tab-rows");
}

function getScrollbar(box, orient = "vertical") {
	return InspectorUtils.getChildrenForNode(box, true, false)
			.find(e => e.matches(`scrollbar:is(
				${orient == "vertical" ? "[vertical]" : ":not([orient])"},
				[orient=${orient}]
			)`));
}

function updateNavToolboxNetHeight() {
	console.time("updateNavToolboxNetHeight");
	let menubar = document.getElementById("toolbar-menubar");
	let personalbar = document.getElementById("PersonalToolbar");
	let menubarAutoHide = menubar.hasAttribute("autohide");
	let countPersonalbar = Services.prefs.getStringPref("browser.toolbars.bookmarks.visibility") != "never";
	let personalbarCollapsed = personalbar.collapsed;

	if (menubarAutoHide)
		menubar.removeAttribute("inactive");
	if (countPersonalbar && personalbarCollapsed) {
		personalbar.style.transition = "none";
		personalbar.collapsed = false;
	}

	let netHeight = gNavToolbox.getBoundingClientRect().height - scrollbox.clientHeight;
	if (!countPersonalbar && !personalbarCollapsed)
		netHeight -= personalbar.getBoundingClientRect().height;
	root.style.setProperty("--nav-toolbox-net-height", netHeight + "px");

	if (menubarAutoHide)
		menubar.setAttribute("inactive", true);
	if (countPersonalbar && personalbarCollapsed) {
		personalbar.collapsed = true;
		requestAnimationFrame(() => {
			let shouldShow = !personalbar.collapsed;
			if (shouldShow)
				personalbar.collapsed = true;
			requestAnimationFrame(() => requestAnimationFrame(() => {
				personalbar.style.transition = "";
				if (shouldShow)
					personalbar.collapsed = false;
			}));
		});
	}
	console.timeEnd("updateNavToolboxNetHeight");
}

function restrictScroll(lines) {
	let rows = getRowCount(), param = {checkVisibility: true, noFlush: true};
	if (getRect(tabContainer._placeholderPostTabs, param).width
			|| getRect(tabContainer._placeholderPreTabs, param).width)
		rows--;
	if (getRect(tabContainer._placeholderNewTabButton, param).width)
		rows--;
	return Math.max(Math.min(lines, rows), 1);
}

function updateThemeStatus() {
	let id = Services.prefs.getStringPref("extensions.activeThemeID");
	defaultTheme = ["", "default-theme@mozilla.org", "firefox-compact-light@mozilla.org", "firefox-compact-dark@mozilla.org"]
			.includes(id);
	defaultDarkTheme = id == "firefox-compact-dark@mozilla.org";
	defaultAutoTheme = ["", "default-theme@mozilla.org"].includes(id);
}

function pointDelta(a, b = 0, round) {
	if (round) {
		a = Math.round(a);
		b = Math.round(b);
	}
	let delta = a - b;
	return Math.abs(delta) < .02 ? 0 : delta;
}

function pointDeltaH(a, b = 0, round) {
	return pointDelta(a, b, round) * DIR;
}

function setDebug() {
	debug = prefs.debugMode;
	if (debug)
		({console} = window);
	else {
		let f = () => {};
		let {error, warn} = window.console;
		console = {error, warn};
		for (let n of ["log", "debug", "trace", "timeLog", "timeEnd", "time"])
			console[n] = f;
	}
}

function exposePrivateMethod(element, method, context) {
	if (typeof element == "string")
		element = customElements.get(element);
	let newMethod = method.replace("#", "_");
	if (newMethod in element.prototype)
		return;
	let relatedMehtods = new Set();
	let code = element.toString().match(new RegExp(`(?<=\\s+)${method}.+|$`, "s"))[0];
	let idx = 0, parenthesesIdx = 0, argPartDone;
	code = code.substr(0, [...code].findIndex(c => {
		if (argPartDone)
			switch(c) {
				case "{": idx++; break;
				case "}": if (!--idx) return true;
			}
		else
			switch(c) {
				case "(":
					parenthesesIdx++;
					break;
				case ")":
					if (!argPartDone && !--parenthesesIdx)
						argPartDone = true;
					break;
			}
	}) + 1).replace(/\bthis\s*\.\s*(#[\w\s]+)(\()?/gs, (match, property, bracket = "") => {
		if (bracket)
			relatedMehtods.add(property);
		return "this._" + property.substr(1) + bracket;
	}).substr(method.length);
	if (code)
		try {
			let f;
			try {
				eval(`${context}; f = function ${newMethod} ${code};`);
			} catch(e) {
				let {prefs} = Services;
				let csp = "security.allow_unsafe_dangerous_privileged_evil_eval";
				if (prefs.getPrefType(csp) == prefs.PREF_BOOL && !prefs.getBoolPref(csp)) {
					prefs.unlockPref(csp);
					prefs.setBoolPref(csp, true);
					restartFirefox();
				} else
					throw e;
			}
			element.prototype[newMethod] = f;
			relatedMehtods.forEach(m => exposePrivateMethod(element, m, context));
		} catch(e) {
			alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack,method].join("\n"));
		}
}

function restartFirefox() {
	let s = Components.classes["@mozilla.org/toolkit/app-startup;1"]
			.getService(Components.interfaces.nsIAppStartup);
	s.quit(s.eAttemptQuit | s.eRestart);
}

async function animateLayout(action, {nodes, rects, newRects, animate = true} = (animatingLayout || {})) {
	let recursion = !!animatingLayout;
	animate &&= !gReduceMotion && !recursion && !!prefs.animationDuration;

	let tabs, cancel, shouldUpdatePlacholder = true, slotRect;

	if (animate) {
		slotRect = getRect(slot, {box: "content"});
		nodes ||= getNodes({newTabButton: true});
		rects ||= new Map();
		newRects ||= new Map();

		for (let n of nodes)
			if (!rects.has(n))
				rects.set(n, getVisualRect(n));

		animatingLayout = {nodes, rects, newRects, shouldUpdatePlacholder};
		if (debug)
			animatingLayout.trace = new Error();
	}

	let {overflowing} = tabContainer;
	try {
		tabs = action();
		if (tabs instanceof Promise)
			tabs = await tabs;
	} finally {
		if (animate) {
			({cancel, shouldUpdatePlacholder} = animatingLayout);
			animatingLayout = null;
		}
	}

	if (overflowing != !!scrollbox.scrollTopMax)
		scrollbox.dispatchEvent(new Event(overflowing ? "overflow" : "underflow"));
	else if (shouldUpdatePlacholder)
		tabContainer._updateInlinePlaceHolder();

	tabContainer._updateCloseButtons();

	if (animate && !cancel) {
		console.log("animate layout");
		console.trace();
		return new Promise(rs => requestAnimationFrame(async () => {
			for (let n of nodes)
				if (!newRects.has(n))
					newRects.set(n, getRect(n));

			if (tabs && (tabs = [tabs].flat()).length &&
					tabs.every(t => t?.matches?.(".tabbrowser-tab, .tab-group-label-container, .tab-group-overflow-count-container"))) {
				if (tabs[0].closing) {
					//TODO: handle closing tabs
				} else {
					await tabContainer._unlockTabSizing({instant: true, unlockSlot: false});

					nodes = nodes.concat(tabs);
					for (let t of tabs)
						if (!newRects.has(t))
							newRects.set(t, getRect(t));

					let start, y;
					//TODO: not use getNodes()
					let newNodes = getNodes();
					let prvR = rects.get(newNodes[newNodes.indexOf(tabs[0]) - 1]);
					let nxt = newNodes[newNodes.lastIndexOf(tabs.at(-1)) + 1];
					let nxtR = rects.get(nxt);
					let nxtNewR = newRects.get(nxt);
					let newSlotRect = getRect(slot, {box: "content"});
					let newRowStartPoint = isSlotJustifyCenter() ?
							newSlotRect.start + newSlotRect.width / 2 * DIR : newSlotRect.start;
					for (let t of tabs) {
						let r;
						let newR = newRects.get(t);
						if (prvR && !pointDelta(prvR.y - slotRect.y, newR.y - newSlotRect.y)) {
							r = prvR.clone();
							r.start = r.end;
						} else if (nxtR && !pointDelta(nxtR.y - slotRect.y, newR.y - newSlotRect.y))
							r = nxtR.clone();
						else {
							r = newR.clone();
							if (!nxtNewR || pointDelta(nxtNewR.y, newR.y))
								r.start = newRowStartPoint;
						}
						r.y += newSlotRect.y - slotRect.y;
						r.width = 0;
						rects.set(t, r);
					}
				}
			}
			Promise.all(nodes.map(n => animateShifting(n, rects.get(n), newRects.get(n)))).then(rs);
		}));
	}
}

function getVisualRect(n, translated = "translate") {
	let r = getRect(n, {translated});
	if (isTab(n))
		r.width -= parseFloat(getComputedStyle(n.stack)?.marginInlineEnd) || 0;
	return r;
}

const ANIMATE_REQUEST = Symbol("animateRequest");
async function animateShifting(t, oR, nR) {
	if (gReduceMotion || !t.isConnected || !oR.visible || !nR.visible || !prefs.animationDuration)
		return t;

	let {start: oS, y: oY, width: oW} = oR;
	let {start: nS, y: nY, width: nW, widthRoundingDiff, heightRoundingDiff} = nR;

	let {style} = t;
	let s = pointDelta(oS, nS), y = pointDelta(oY, nY), w = pointDelta(oW, nW);
	let {abs} = Math;
	if (abs(s) < 1 && abs(y) < 1 && (abs(w) < 1 || !isTab(t))) {
		if (t.hasAttribute("animate-shifting"))
			assign(style, {
				"--width-rounding-diff": widthRoundingDiff + "px",
				"--height-rounding-diff": heightRoundingDiff + "px",
			});
		return t;
	}

	let id = debug && Math.random() * 10000 | 0;

	console.debug(t, id, {oS, oY, oW, nS, nY, nW});

	let to = [nS, nY, nW];
	if (t[ANIMATE_REQUEST]?.every((v, i) => abs(v - to[i]) < 1)) {
		await animateDone();
		console.debug(t, id, "previous animate done");
		return t;
	}
	t[ANIMATE_REQUEST] = to;

	t.setAttribute("animate-shifting", "start");
	assign(style, {
		"--x": s + "px",
		"--y": y + "px",
		"--w": w + "px",
		"--width-rounding-diff": widthRoundingDiff + "px",
		"--height-rounding-diff": heightRoundingDiff + "px",
	});

	await new Promise(rs => requestAnimationFrame(rs));

	t.setAttribute("animate-shifting", "run");
	assign(style, {"--x": "", "--y": "", "--w": ""});

	let {eventType} = await animateDone();
	console.debug(eventType, t, id);

	t.removeAttribute("animate-shifting");
	if (["--translate-x", "--translate-y"].every(p => !style.getPropertyValue(p)))
		assign(style, {"--width-rounding-diff": "", "--height-rounding-diff": ""});

	delete t[ANIMATE_REQUEST];

	return t;

	function animateDone() {
		return waitForAnimation(t, abs(s) >= 1 || abs(y) >= 1 ?
				undefined : {property: ["margin-left", "margin-right"], target: t.stack});
	}
}

let LAST_ANIMATION = Symbol("lastAnimation");
async function waitForAnimation(node, {
	event = "transitionend",
	property = "translate",
	duration = prefs.animationDuration + 100,
	pseudoElement = "",
	target = node,
} = {}) {
	if (gReduceMotion || !prefs.animationDuration)
		return {node, eventType: "transitionend"};

	if (!node?.isConnected)
		return {node, eventType: "disconnect"};

	let promise = node[LAST_ANIMATION] = new Promise(rs => {
		event = [event].flat();
		property = [property].flat();
		for (let e of event)
			target.addEventListener(e, handler);

		let timeout = setTimeout(() => {
			if (!node.isConnected) {
				done("disconnect");
				return;
			}

			done("timeout");
		}, duration);

		function done(eventType) {
			clearTimeout(timeout);
			if (node[LAST_ANIMATION] == promise) {
				if (eventType == "timeout") {
					let debugInfo = [];
					if (debug) {
						let cs = getComputedStyle(target);
						debugInfo = [node, property, property.map(p => cs[p]),
								[cs.transitionProperty, cs.transitionDuration, cs.transitionTimingFunction]];
					}
					console.error(`Animation of ${node.tagName} is interrupted`, ...debugInfo);
				}
				delete node[LAST_ANIMATION];
			}
			for (let e of event)
				target.removeEventListener(e, handler);
			Promise.resolve(node[LAST_ANIMATION]).then(() => rs({node, eventType}));
		};

		function handler(e) {
			if (e.type.startsWith("transition") && !property.includes(e.propertyName) ||
					e.originalTarget != target || e.pseudoElement != pseudoElement)
				return;
			done(e.type);
		}
	});
	return promise;
}

/*
return the position based on screenX and screenY, not compatible with scale and rotate

box: refer to `getBoxQuads`
translated: return the translated box
scroll: return the scroll size
checkVisibility: if visibility is collapse, then size = 0, end = start
noFlush: using getBoundsWithoutFlushing instead
*/
//DIR = RTL_UI ? -1 : 1, root = document.documentElement, EPSILON = .001, START = RTL_UI ? "right" : "left", END = RTL_UI ? "left" : "right";
function getRect(ele, {box, translated, checkVisibility, scroll, noFlush} = {}) {
	let cs;
	if (
		!ele?.isConnected ||
		//in some weird cases, the cs is null
		["none", "contents", undefined].includes((cs = getComputedStyle(ele instanceof Element ? ele : ele.parentNode))?.display)
	) {
		let r = new Rect();
		if (debug)
			r.element = ele;
		return r;
	}
	if (box && noFlush)
		throw new Error("box argument is not supported when using noFlush");
	let r;
	if (noFlush)
		r = windowUtils.getBoundsWithoutFlushing(ele);
	else if (r = ele.getBoxQuads({box})[0]) {
		//dont use the DOMQuad.getBounds() since it can't handle negative size
		let {p1, p3} = r;
		r = new DOMRect(p1.x, p1.y, p3.x - p1.x, p3.y - p1.y);
	}
	if (!r) {
		console.warn("Can't get bounds of element");
		console.debug(ele);
		return new Rect();
	}
	let {round} = Math;
	let {e: t1x, f: t1y} = new DOMMatrixReadOnly(cs.transform);
	let [t2x, t2y] = [...[...cs.translate.matchAll(/-?\d+(?:\.[\de-]+)?/g)].flat().map(v => +v), 0, 0].slice(0, 2);
	let tx = t1x + t2x;
	let ty = t1y + t2y;
	let {[START]: start, y, width, height} = r;
	let widthRoundingDiff = round(r.right - tx) - round(r.x - tx) - width;
	let heightRoundingDiff = round(r.bottom - ty) - round(y - ty) - height;

	let includeTransform, includeTranslate;
	if (!translated || typeof translated == "boolean")
		includeTransform = includeTranslate = translated;
	else if (Array.isArray(translated)) {
		includeTransform = translated.includes("transform");
		includeTranslate = translated.includes("translate");
	} else {
		includeTransform = translated == "transform";
		includeTranslate = translated == "translate";
	}
	if (!includeTransform) {
		start -= t1x;
		y -= t1y;
	}
	if (!includeTranslate) {
		start -= t2x;
		y -= t2y;
	}

	if (checkVisibility && cs.visibility == "collapse")
		width = height = 0;
	else if (scroll) {
		width += ele.scrollWidth - ele.clientWidth;
		height += ele.scrollHeight - ele.clientHeight;
	}

	return new Rect(
		start + root.screenX,
		y + root.screenY,
		width, height,
		widthRoundingDiff, heightRoundingDiff,
	);
}

function assign(o, p) {
	if (!o) return {...p};
	if (o instanceof CSSStyleDeclaration) {
		for (let [k, v] of Object.entries(p)) {
			let isVar = k.startsWith("--");
			if (v != "" && v != null) {
				let important;
				v = (v + "").replace(/\s*!\s*important\s*$/i, r => (important = "important") && "");
				if (isVar)
					o.setProperty(k, v, important);
				else if (important) {
					k = k.replace(/[A-Z]/g, c => c.replace(/[A-Z]/g, c => "-" + c.toLowerCase()));
					o.setProperty(k, v, important);
				} else
					o[k] = v;
			} else if (isVar)
				o.removeProperty(k);
			else
				o[k] = v;
		}
		return o;
	}
	return Object.assign(o, p);
}

function $(s, scope) {
	return (scope || document).querySelector(s);
}

function $$(s, scope) {
	return [...(scope || document).querySelectorAll(s)];
}

console.timeEnd("setup");
} //end function setup()

} catch(e) {alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e)}
