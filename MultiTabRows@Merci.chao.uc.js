"use strict";
// ==UserScript==
// @name           Multi Tab Rows (MultiTabRows@Merci.chao.uc.js)
// @description    Make Firefox support multiple rows of tabs.
// @author         Merci chao
// @version        3.6.0.1
// @compatible     firefox 115, 144-146
// @namespace      https://github.com/Merci-chao/userChrome.js#multi-tab-rows
// @changelog      https://github.com/Merci-chao/userChrome.js#changelog
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js
// ==/UserScript==

/* global
   gBrowser, RTL_UI, Services, Cc, Ci, promiseDocumentFlushed,
   gNavToolbox, gReduceMotion, FullScreen, TAB_DROP_TYPE, InspectorUtils, windowUtils,
*/
if (!document.documentElement.matches("[chromehidden~=location][chromehidden~=toolbar]"))
try {
if (gBrowser?._initialized) {
	setup();
	let tc = gBrowser.tabContainer;
	if (gBrowser.pinnedTabsContainer)
		tc.arrowScrollbox.prepend(...tc.visibleTabs.slice(0, gBrowser.pinnedTabCount));
	tc.uiDensityChanged();
	tc._handleTabSelect(true);
	tc._invalidateCachedTabs();
	tc._updateInlinePlaceHolder();
} else
	addEventListener("DOMContentLoaded", () => {
		try { setup() }
		catch(e) { alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e) }
	}, {once: true});

function setup() {
const [START,   END,     LEFT,    RIGHT,   START_PC, END_PC, DIR] = RTL_UI
   ? ["right", "left",  "end",   "start", "100%",   "0%",    -1]
   : ["left",  "right", "start", "end",   "0%",     "100%",  1];
//it should be .0001 but it seems enough currently
const EPSILON = .001;

class Rect {
	/**
	 * @param {number} [start]
	 * @param {number} [y]
	 */
	constructor(start, y, width = 0, height = 0, widthRoundingDiff = 0, heightRoundingDiff = 0) {
		assign(this, {
			start, y, width, height, widthRoundingDiff, heightRoundingDiff,
			visible: start != null && y != null,
		});
	}

	/** @type {(number|undefined)} */
	#start;
	/** @type {(number|undefined)} */
	#y;

	/**
	 * @param {("start"|"y")} n
	 * @returns {number}
	 */
	#pos(n) {
		let v = n == "y" ? this.#y : this.#start;
		if (v == null)
			window.console.error("Can't access position of a hidden or disconnected element", this.element);
		return v ?? 0;
	}

	/** @returns {number} */
	get start() { return this.#pos("start") }
	/** @param {number} v */
	set start(v) { this.#start = v }

	/** @returns {number} */
	get end() { return this.start + this.width * DIR }
	/** @param {number} v */
	set end(v) { this.width = (v - this.start) * DIR }

	/** @returns {number} */
	get x() { return this[LEFT] }
	/** @param {number} v */
	set x(v) { this[LEFT] = v }

	/** @returns {number} */
	get right() { return this[RIGHT] }
	/** @param {number} v */
	set right(v) { this[RIGHT] = v }

	/** @returns {number} */
	get left() { return this.x }
	/** @param {number} v */
	set left(v) { this.x = v }

	/** @returns {number} */
	get y() { return this.#pos("y") }
	/** @param {number} v */
	set y(v) { this.#y = v }

	/** @returns {number} */
	get top() { return this.y }
	/** @param {number} v */
	set top(v) { this.y = v }

	/** @returns {number} */
	get bottom() { return this.y + this.height }
	/** @param {number} v */
	set bottom(v) { this.height = v - this.y }

	/** @returns {Rect} */
	clone() {
		return assign(new Rect(this.#start, this.#y), this);
	}

	/** @param {Rect} rect */
	relativeTo(rect, clone = true) {
		let r = clone ? this.clone() : this;
		if (this.visible && rect.visible) {
			r.start -= rect.start;
			r.y -= rect.y;
		}
		return r;
	}
}

const tabsBar = $("#TabsToolbar");
const {tabContainer} = gBrowser, {arrowScrollbox} = tabContainer, {scrollbox} = arrowScrollbox;
const slot = $("slot", scrollbox);

const emptyFunc = () => {};

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
	// eslint-disable-next-line no-unused-vars
	} catch(e) { /* empty */ }
}

const CLOSING_THE_ONLY_TAB = Symbol("closingTheOnlyTab");
const TEMP_SHOW_CONDITIONS = ":hover, [dragging], [temp-open][has-popup-open]";

const win7 = matchMedia("(-moz-platform: windows-win7)").matches;
const win8 = matchMedia("(-moz-platform: windows-win8)").matches;
const accentColorInTitlebarMQ = matchMedia("(-moz-windows-accent-color-in-titlebar)");

let micaEnabled = false,
	mica = false,
	defaultDarkTheme = false,
	defaultAutoTheme = false,
	defaultTheme = false,
	bgImgTheme = false;

const root = document.documentElement;

const dragToPinSupported =
	window.TabDragAndDrop ||
	tabContainer.constructor.toString().includes("#updateTabStylesOnDrag");

/** @type {(Console|null)} */
let console;
let debug = false;

const prefBranchStr = "userChromeJS.multiTabRows@Merci.chao.";

// if (!Services.prefs.getPrefType(prefBranchStr + "checkUpdate"))
// 	Services.prefs.setIntPref(prefBranchStr + "tabsUnderControlButtons", 0);

/** @type {Object} */
let prefs;
{
	const createDefaultPrefs = () => ({
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
		autoCollapseDelayExpanding: 100,
		autoCollapseDelayCollapsing: 400,
		// autoCollapseCurrentRowStaysTop: false,
		hideDragPreview: 1,
		tabsAtBottom: appVersion > 132 ? 0 : null,
		tabMaxWidth: 225,
		hideScrollButtonsWhenDragging: false,
		scrollButtonsSize: 10,
		justifyCenter: 0,
		checkUpdateAutoApply: 0,
		pinnedTabsFlexWidth: false,
		pinnedTabsFlexWidthIndicator: false,
		animateTabMoveMaxCount: 30,
		hidePinnedDropIndicator: $("#pinned-drop-indicator") ? false : null,
		disableDragToPinOrUnpin: dragToPinSupported ? false : null,
	});

	const setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
		value != null &&
		branch[`set${{string: "String", number: "Int", boolean: "Bool"}[typeof value]}Pref`](name, value)
	);
	const getPrefs = (branch, data) => Object.fromEntries(
		Object.entries(data).filter(([, value]) => value != null)
			.map(([name, value]) => [name, branch[`get${{string: "String", number: "Int", boolean: "Bool"}[typeof value]}Pref`](name)])
	);

	updateThemeStatus();
	loadPrefs();

	Object.keys(prefs).forEach(n => Services.prefs.addObserver(prefBranchStr + n, onPrefChange));
	let observedBrowserPrefs = [
		"extensions.activeThemeID",
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

	function loadPrefs(defaultPrefs = createDefaultPrefs()) {
		setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defaultPrefs);
		prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defaultPrefs);

		let singleRow = prefs.maxTabRows < 2;
		let nativeDragToGroup = getPref("browser.tabs.groups.enabled", "Bool", false) &&
			getPref("browser.tabs.dragDrop.moveOverThresholdPercent", "Int", 0) > 50;

		let supportsHas = getPref("layout.css.has-selector.enabled", "Bool", true);
		let noAutoCollapse = !supportsHas || singleRow;

		lock(["linesToScroll", "linesToDragScroll"], singleRow);
		lock("nativeWindowStyle", bgImgTheme);
		lock("autoCollapse", noAutoCollapse);
		lock(
			["autoCollapseDelayCollapsing", "autoCollapseDelayExpanding", "autoCollapseCurrentRowStaysTop"],
			!prefs.autoCollapse,
		);
		lock(
			["rowStartIncreaseFrom", "rowIncreaseEvery"],
			singleRow || prefs.autoCollapse,
			0,
		);
		lock("dynamicThemeImageSize", singleRow || !bgImgTheme || prefs.autoCollapse);
		lock("tabsUnderControlButtons", singleRow || prefs.autoCollapse, 0);
		lock("floatingBackdropClip", singleRow || prefs.tabsUnderControlButtons < 2);
		lock("floatingBackdropOpacity", singleRow || prefs.tabsUnderControlButtons < 2 || prefs.floatingBackdropClip, 75);
		lock("hideEmptyPlaceholderWhenScrolling", singleRow || prefs.tabsUnderControlButtons < 2 || prefs.tabsAtBottom);
		lock("tabsbarItemsAlign", singleRow || prefs.tabsUnderControlButtons == 2 || prefs.autoCollapse);
		lock(
			"floatingBackdropBlurriness",
			(
				prefs.floatingBackdropOpacity >= 100 || prefs.floatingBackdropClip ||
				singleRow || prefs.tabsUnderControlButtons < 2 || mica || prefs.nativeWindowStyle
			),
		);
		lock(["checkUpdateFrequency", "checkUpdateAutoApply"], !prefs.checkUpdate);
		lock("dragToGroupTabs", !nativeDragToGroup || !prefs.animateTabMoveMaxCount);
		lock(
			"dynamicMoveOverThreshold",
			(
				!nativeDragToGroup || !prefs.dragToGroupTabs ||
				!prefs.animateTabMoveMaxCount ||
				getPref("browser.tabs.dragDrop.moveOverThresholdPercent", "Int", 0) <= 50
			),
			false,
		);
		lock(
			["spaceAfterTabs", "spaceAfterTabsOnMaximizedWindow", "spaceBeforeTabs", "spaceBeforeTabsOnMaximizedWindow"],
			prefs.tabsAtBottom,
		);
		lock("hidePinnedDropIndicator", prefs.disableDragToPinOrUnpin, true);
		lock("pinnedTabsFlexWidthIndicator", !prefs.pinnedTabsFlexWidth);

		prefs.animationDuration = Math.min(Math.max(prefs.animationDuration, 0), prefs.debugMode ? Infinity : 1000);
		if (gNavToolbox.hasAttribute("tabs-hidden"))
			prefs.tabsUnderControlButtons = 0;

		/**
		 * @param {string|Array<string>} name
		 * @param {boolean} toLock
		 * @param {*} [defaultValue]
		 */
		function lock(name, toLock, defaultValue) {
			if (toLock)
				if (Array.isArray(name))
					name.forEach(n => lock(n, true, defaultValue));
				else if (name in prefs) {
					Services.prefs.lockPref(prefBranchStr + name);
					prefs[name] = defaultValue ?? defaultPrefs[name];
				}
		}
	}

	/**
	 * @param {string} pref
	 * @param {string} type
	 * @param {string} name
	 */
	async function onPrefChange(pref, type, name) {
		if (window.MultiTabRows_updatingPref) return;

		console?.log(name);

		switch (name) {
			case "extensions.activeThemeID":
				//wait for the theme fully applied when installing
				if (isCalledBy("install", "updateAddonDisabledState"))
					await new Promise(rs => addEventListener("windowlwthemeupdate", function f() {
						if (!isCalledBy("load")) return;
						removeEventListener("windowlwthemeupdate", f);
						rs();
					}));
			// eslint-disable-next-line no-fallthrough
			case "-moz-windows-accent-color-in-titlebar":
			case "widget.windows.mica":
				updateThemeStatus();
		}

		let browsers = [...Services.wm.getEnumerator("navigator:browser")];

		for (let win of browsers)
			win.MultiTabRows_updatingPref = true;

		let defaultPrefs = createDefaultPrefs();

		for (let [name, value] of Object.entries(defaultPrefs))
			if (value != null)
				Services.prefs.unlockPref(prefBranchStr + name);

		loadPrefs(defaultPrefs);

		for (let win of browsers)
			delete win.MultiTabRows_updatingPref;

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
			case "pinnedTabsFlexWidth":
			case "layout.css.has-selector.enabled":
				setStyle();
				tabsBar.toggleAttribute(
					"tabs-hide-placeholder",
					tabContainer.overflowing && prefs.tabsUnderControlButtons < 2,
				);
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
			case "tabsAtBottom":
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
			case "checkUpdateAutoApply":
			case "autoCollapseCurrentRowStaysTop":
			case "browser.tabs.groups.enabled":
			case "browser.tabs.dragDrop.moveOverThresholdPercent":
			case "animateTabMoveMaxCount":
			case "hidePinnedDropIndicator":
				break;
			default:
				setStyle();
		}
	}
}

setDebug();

if (prefs.checkUpdate && (Date.now() / 1000 - prefs.checkUpdate) / 60 / 60 / 24 >= Math.max(prefs.checkUpdateFrequency, 1)) {
	Services.prefs.setIntPref(prefBranchStr + "checkUpdate", Date.now() / 1000);
	(async () => {
		let auto = prefs.checkUpdateAutoApply;
		let getVer = code => code?.match(/^\/\/\s*@version\s+(.+?)\s*$/mi)?.[1]
			.replace(/((\d+\.\d+\.\d+)\.\d+)/, auto < 3 ? "$2" : "$1")
			.replace(/(\.0)+$/, "");
		let localFileURI = new Error().stack.match(/(?<=@).+?(?=:\d+:\d+$)/m)[0];
		let localFilePath = decodeURI(localFileURI.replace(/^file:\/\/\/|\?.*$/g, "")).replaceAll("/", "\\");
		let localScript = await (await fetch(localFileURI)).text();
		let updateURL = localScript.match(/^\/\/\s*@updateURL\s+(.+?)\s*$/mi)[1];
		let homeURL = "https://github.com/Merci-chao/userChrome.js";
		let remoteScript = (await (await fetch(updateURL)).text()).trim();
		let local = getVer(localScript);
		let remote = getVer(remoteScript);
		let compatible = remoteScript?.match(/^\/\/\s*@compatible\s+firefox\s*(.+?)\s*$/mi)?.[1]
			?.split(/\s*,\s*/).map(v => v.split(/\s*-\s*/));
		if (
			!remote ||
			remote.localeCompare(local, undefined, {numeric: true}) <= 0 ||
			(
				appVersion < compatible?.at(-1).at(-1) &&
				!compatible.some(([min, max]) => max ? min <= appVersion && appVersion <= max : appVersion == min)
			)
		)
			return;

		let p = Services.prompt;
		let l10n = {
			en: {
				title: "MultiTabRows@Merci.chao.uc.js",
				message: `Multi Tab Rows version ${remote} is released. Would you want to ${auto ? "apply" : "view"} it now?`,
				later: "Remind Tomorrow",
				apply: `Update the script file directly`,
				link: "#changelog",
				done: `Multi Tab Rows has been updated to version ${remote}. You may restart Firefox to apply.`,
				error: `Failed to apply the update of Multi Tab Rows version ${remote}. Please ensure the file is not read-only or locked by another program:`,
				changelog: "Changelog",
			},
			ja: {
				title: "MultiTabRows@Merci.chao.uc.js",
				message: `Multi Tab Rows（多段タブ）の新バージョン ${remote} がリリースされました。今すぐ${auto ? "更新" : "表示"}しますか？`,
				later: "明日再通知する",
				apply: "スクリプトファイルを直接更新",
				link: "/blob/main/README.jp.md#変更履歴",
				done: `Multi Tab Rows ${remote} を更新しました。Firefox を再起動すると変更が有効になります。`,
				error: `Multi Tab Rows バージョン ${remote} の更新処理に失敗しました。ファイルが読み取り専用でないこと、または他のプログラムによってロックされていないことを確認してください：`,
				changelog: "変更履歴",
			},
		};
		l10n = l10n[Services.locale.appLocaleAsLangTag.split("-")[0]] || l10n.en;

		let buttons =
			p.BUTTON_POS_0 * p.BUTTON_TITLE_YES
			+ p.BUTTON_POS_1 * p.BUTTON_TITLE_IS_STRING
			+ p.BUTTON_POS_2 * p.BUTTON_TITLE_NO;
		if (auto) {
			if (auto > 1)
				install();
			else
				switch (p.confirmEx(window, l10n.title, l10n.message, buttons, "", l10n.later, "", "", {})) {
					case 0: install(); break;
					case 1: setTomorrow(); break;
				}
		} else {
			let apply = {};
			switch (p.confirmEx(
				window, l10n.title, l10n.message, buttons,
				"", l10n.later, "",
				l10n.apply, apply,
			)) {
				case 0:
					if (apply.value)
						install();
					else
						showChangeLog();
					break;
				case 1: setTomorrow(); break;
			}
		}

		function setTomorrow() {
			Services.prefs.setIntPref(
				prefBranchStr + "checkUpdate",
				Date.now() / 1000 - (Math.max(prefs.checkUpdateFrequency, 1) - 1) * 24 * 60 * 60,
			);
		}

		function showChangeLog() {
			/*global openURL*/
			openURL(homeURL + l10n.link);
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
				if (auto < 3 && p.confirmEx(
					window, l10n.title, l10n.done,
					(
						p.BUTTON_POS_0 * p.BUTTON_TITLE_OK
						+ p.BUTTON_POS_1 * p.BUTTON_TITLE_IS_STRING
					),
					"", l10n.changelog, "", "", {},
				))
					showChangeLog();
			} catch(e) {
				p.alert(window, l10n.title, [l10n.error, localFilePath, e.message].join("\n\n"));
			}
		}
	})();
}

console?.time("setup");

const [
	DRAGOVER_GROUPTARGET,          MOVINGTAB_GROUP,             CLEAR_DRAG_OVER_GROUPING_TIMER,
	TRIGGER_DRAG_OVER_GROUPING,    DRAG_OVER_GROUPING_TIMER,
] = appVersion > 142 ? [
	"dragover-groupTarget",       "movingtab-group",           "_clearDragOverGroupingTimer",
	"triggerDragOverGrouping",    "_dragOverGroupingTimer",
] : [
	"dragover-createGroup",       "movingtab-createGroup",     "_clearDragOverCreateGroupTimer",
	"triggerDragOverCreateGroup", "_dragOverCreateGroupTimer",
];

let tabHeight = 0;
let tabMinWidth = 0;
let newTabButtonWidth = 0;
let scrollbarWidth = 0;
/** @type {Object|null} */
let animatingLayout;

let fakeScrollbar = document.createXULElement("box");
fakeScrollbar.part = "fake-scrollbar";
fakeScrollbar.style.overflowY = "scroll";
//get the scrollbar width first in case the used scrollbar is squeezed in weird case
async function updateScrollbarWidth() {
	document.body.appendChild(fakeScrollbar);
	fakeScrollbar.style.scrollbarWidth = prefs.thinScrollbar ? "thin" : "";
	await promiseDocumentFlushed(emptyFunc);
	scrollbarWidth = fakeScrollbar.getBoundingClientRect().width - fakeScrollbar.clientWidthDouble;
	let visualWidth = getScrollbar(fakeScrollbar).clientWidthDouble;
	arrowScrollbox.shadowRoot.appendChild(fakeScrollbar);
	tabsBar.style.setProperty("--tabs-scrollbar-visual-width", visualWidth + "px");
	if (tabsBar.style.getPropertyValue("--tabs-scrollbar-width"))
		tabsBar.style.setProperty("--tabs-scrollbar-width", scrollbarWidth + "px");
	//avoid the transition of the scrollbar on windows 11
	await promiseDocumentFlushed(emptyFunc);
	getScrollbar(fakeScrollbar).style.opacity = 1;
}
updateScrollbarWidth();

let mainStyle = document.body.appendChild(document.createElement("style"));

setStyle();

function setStyle() {
//fx 115 doesn't support CSS cascade so use some variables to save code
let _, __, context, condition, x, y;
let floatingButtonStyle;
const {rowStartIncreaseFrom: rSIF, rowIncreaseEvery: rIE, maxTabRows: maxRows} = prefs;
const singleRow = maxRows < 2 ? "screen" : `(max-width: ${rSIF + rIE - EPSILON}px)`;
const multiRows = `(min-width: ${rSIF + rIE}px)`;
const twoOrLessRows = maxRows < 3 ? "screen" : `(max-width: ${rSIF + rIE * 2 - EPSILON}px)`;
const visible = `:not([hidden], [closing])`;
const lastNode = `:is(
	#tabbrowser-arrowscrollbox > .tabbrowser-tab:nth-last-child(2 of ${visible}),
	tab-split-view-wrapper:nth-last-child(2 of ${visible}),
	tab-group:not([collapsed]):nth-last-child(2 of ${visible}) >
		:nth-last-child(1 of :is(.tabbrowser-tab${visible}, .tab-group-label-container)),
	tab-group[collapsed]:nth-last-child(2 of ${visible}) > :is(
		:not([hasactivetab]) > .tab-group-label-container,
		[hasactivetab]:not([hasmultipletabs]) > .tabbrowser-tab[selected],
		[hasactivetab][hasmultipletabs] > .tab-group-overflow-count-container
	)
)`;
const adjacentNewTab = "#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button";
const dropOnItems = ":is(#home-button, #downloads-button, #bookmarks-menu-button, #personal-bookmarks):not([moving-tabgroup] *)";
const dropOnItemsExt = "#TabsToolbar[tabs-dragging-ext] :is(#new-tab-button, #new-window-button)";
const menubarAutoHide = appVersion > 142 ? "[autohide]" : "[autohide=true]";
const shownMenubar = `#toolbar-menubar:not(:root[inFullscreen] *):is(:not([inactive]), :not(${menubarAutoHide}))`;
const hiddenMenubar = `#toolbar-menubar:is(${menubarAutoHide}[inactive], :root[inFullscreen] *)`;
const CUSTOM_TITLEBAR = appVersion > 134 ? "customtitlebar" : "tabsintitlebar";
const topMostTabsBar = prefs.tabsAtBottom
	? "#TabsToolbar:not([id])"
	: `:root[${CUSTOM_TITLEBAR}] ${hiddenMenubar} + #TabsToolbar`;
const nonTopMostTabsBar = prefs.tabsAtBottom
	? "#TabsToolbar"
	: `#TabsToolbar:is(
		:root:not([inFullscreen]) #toolbar-menubar:not(${menubarAutoHide}) + *,
		:root:not([${CUSTOM_TITLEBAR}]) *
	)`;
const hidePlaceHolder = "[customizing], [tabs-hide-placeholder]";
const showPlaceHolder = `:not(${hidePlaceHolder})`;
const tbDraggingHidePlaceHolder = ":is([tabs-dragging], [movingtab]):not([moving-positioned-tab])";
const staticPreTabsPlaceHolder = ":is([tabs-scrolledtostart], [pinned-tabs-wraps-placeholder])";
const autoHideBookmarksBar = getPref("browser.toolbars.bookmarks.visibility", "String") == "newtab";
const preTabsButtons = `:is(
	:root:not([privatebrowsingmode], [firefoxviewhidden]) :is(toolbarbutton, toolbarpaletteitem),
	:root[privatebrowsingmode]:not([firefoxviewhidden]) :is(toolbarbutton:not(#firefox-view-button), toolbarpaletteitem:not(#wrapper-firefox-view-button))
)`;

const borderSnapping = size => CSS.supports("flex", "round(1)")
	//https://drafts.csswg.org/css-values-4/#snap-a-length-as-a-border-width
	? `calc(
		max( /*at least 1 device px, or 0 if size <= 0*/
			round( /*round down to integer*/
				down,
				${size} * var(--device-pixel-ratio), /*covert to device px*/
				1px
			),
			min( /*will only be 1px (size > 0), or NaN (size <= 0) which forces the final result to be 0px*/
				max(${size}, 0px) / 0, /*will only be Infinity or NaN*/
				1px
			)
		)
		/ var(--device-pixel-ratio) /*covert back to css px*/
	)`
	//fallback to approximation
	: `calc(${size} / var(--device-pixel-ratio))`;

const outlineOffsetSnapping = size =>
	[1, 2].includes(getPref("layout.css.outline-offset.snapping", "Int"))
		? size
		: borderSnapping(size);

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
	--tabs-item-opacity-transition: ${
		getComputedStyle($("[part=overflow-end-indicator]", arrowScrollbox.shadowRoot))
			.transition.match(/\d.+|$/)[0] ||
		".15s"
	};
	--tabs-placeholder-border-color: ${
		getComputedStyle(tabContainer).getPropertyValue("--tabstrip-inner-border")
			.match(/(?<=\dpx \w+ ).+|$/)[0] ||
		"color-mix(in srgb, currentColor 25%, transparent)"
	};
	--tabs-placeholder-shadow: var(--tab-selected-shadow, ${
		gBrowser.selectedTab && getComputedStyle($(".tab-background", gBrowser.selectedTab)).boxShadow ||
		"none"
	});
	--tabs-placeholder-border-width: 1px;
	--tabs-placeholder-border: var(--tabs-placeholder-border-width) solid var(--tabs-placeholder-border-color);
	--tabs-placeholder-border-radius: ${
		prefs.floatingBackdropClip && prefs.tabsUnderControlButtons == 2
			? 0
			: "var(--tab-border-radius)"
	};
	--tabs-placeholder-blurriness: ${prefs.floatingBackdropBlurriness}px;
	--tabs-placeholder-backdrop: ${
		(
			!prefs.floatingBackdropClip &&
			prefs.floatingBackdropBlurriness &&
			prefs.floatingBackdropOpacity < 100 &&
			!mica &&
			!prefs.nativeWindowStyle
		)
			? `blur(var(--tabs-placeholder-blurriness))`
			: "none"
	};
	--tabs-placeholder-background-color: var(${
		appVersion == 115
			? (
				win7 && defaultDarkTheme
					? "--tab-icon-overlay-fill"
					: (
						win8 && defaultTheme
							? "--tab-selected-bgcolor, var(--lwt-selected-tab-background-color)"
							: "--lwt-accent-color"
					)
			)
			: "--toolbox-bgcolor, var(--toolbox-non-lwt-bgcolor, var(--lwt-accent-color, var(--tab-selected-bgcolor, var(--lwt-selected-tab-background-color))))"
	});
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
		${prefs.tabsAtBottom == 1 ? `
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
		border-top: 0;
		background: none;
		color: var(--toolbox-textcolor);
		z-index: calc(var(--tabs-moving-max-z-index) + 2);

		:root:not([lwtheme-image]) {
			background-color: inherit;
		}

		&:-moz-window-inactive {
			color: var(--toolbox-textcolor-inactive);
		}

		:root[${CUSTOM_TITLEBAR}] & {
			&, #urlbar:popover-open {
				will-change: opacity;
				/*override the --ext-theme-background-transition*/
				transition: var(--inactive-window-transition) !important;
				transition-property: opacity, background-color !important;

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

	:root[${CUSTOM_TITLEBAR}] #navigator-toolbox:not([tabs-hidden]) > #toolbar-menubar${menubarAutoHide} {
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
	--group-line-padding: ${gBrowser.tabGroups ? "3px" : "0px"};
	--group-label-max-width: ${gBrowser.tabGroups ? "10em" : "0px"};
	--tab-animation: ${prefs.animationDuration}ms ${debug > 1 ? "ease" : "var(--animation-easing-function)"};
	--calculated-tab-min-width: 0px;
	--tab-max-width: max(${prefs.tabMaxWidth}px, var(--calculated-tab-min-width));
	--max-item-width: max(
		var(--calculated-tab-min-width),
		var(--group-label-max-width) + var(--group-line-padding) * 2
	);
	--tabstrip-padding: 0px;
	--tabstrip-border-width: 0px;
	--tabstrip-border-color: transparent;
	--tabstrip-border: var(--tabstrip-border-width) solid var(--tabstrip-border-color);
	--tabstrip-separator-size: calc(var(--tabstrip-padding) * 2 + var(--tabstrip-border-width));
	${appVersion < 132 ? `
		--tab-overflow-clip-margin: 2px;
		--tab-inline-padding: 8px;
	` : ``}
	--tab-overflow-pinned-tabs-width: 0px;
	--extra-drag-space: 15px; /*hardcoded in tabs.css*/
	position: relative;
	padding-inline-start: var(--tabstrip-padding) !important;
}

${preTabsButtons} ~ ${_} {
	--tabstrip-padding: 2px;
}

${prefs.autoCollapse ? `
	${__="#navigator-toolbox"},
	${__} :has(${_}) {
		z-index: calc(1/0) !important;
		position: relative !important;
	}

	${context=`:root:not([style*="--tab-scroll-rows: 1;"])`} ${_}:not(${TEMP_SHOW_CONDITIONS}) {
		height: var(--tab-height);
	}

	${context} ${_} :is(tab, tab-group > *) {
		--adjacent-newtab-button-adjustment: 0px !important;
	}

	${context} #TabsToolbar {
		max-height: calc(var(--tab-height) + var(--tabs-padding-top) + var(--tabs-margin-top));
		align-items: start;
	}

	${context} #TabsToolbar:has(${_}:is(${TEMP_SHOW_CONDITIONS})) {
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
		transition-property:
			background-color, height, margin-bottom, outline,
			border-color, box-shadow, border-radius, color, text-shadow;
	}

	${context} ${_}:is(${TEMP_SHOW_CONDITIONS}) {
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
		-moz-window-dragging: no-drag;
	}

	${context} ${_}:is(${TEMP_SHOW_CONDITIONS}) #tabbrowser-arrowscrollbox {
		transition: scrollbar-color var(--tab-animation) var(--transition-delay-before);
		scrollbar-color:
			currentColor
			color-mix(in oklab, currentColor 20%, var(--toolbar-field-focus-background-color));
	}

	${context} .tab-background {
		--lwt-header-image: none;
	}

	${context} ${_} ${__=":is(.tab-content:is([selected], [multiselected]), .tab-group-overflow-count)"} {
		transition: color var(--tab-animation) var(--transition-delay-after);
	}

	${context} ${_}:is(${TEMP_SHOW_CONDITIONS}) ${__} {
		transition-delay: var(--transition-delay-before);
		color: inherit;
	}

	${context} ${_}[temp-open] #tabbrowser-arrowscrollbox::part(scrollbox) {
		padding-bottom: var(--temp-open-padding, 0px);
	}

	@media (-moz-overlay-scrollbars) {
		${context} #TabsToolbar:not([tabs-scrollbar-hovered]) ${_}:is(${TEMP_SHOW_CONDITIONS}) {
			border-start-end-radius: ${__="var(--toolbarbutton-border-radius)"};
			border-end-end-radius: ${__};
		}
	}

	${context} ${_}[has-temp-scrollbar]:not(:is([tabmousedown], [dragging])[overflow])
		#tabbrowser-arrowscrollbox::part(scrollbox)
	{
		overflow-y: scroll;
	}

	${context} ${_}:is(${TEMP_SHOW_CONDITIONS}, [has-temp-scrollbar]) #tabs-newtab-button {
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
			prefs.scrollbarThumbColor == "auto"
				? (
					root.style.getPropertyValue("--toolbarbutton-icon-fill")
						? "var(--toolbarbutton-icon-fill)"
						: "var(--toolbar-color)"
				)
				: prefs.scrollbarThumbColor
		}
		${
			prefs.scrollbarTrackColor == "auto"
				? (
					win7 && defaultDarkTheme
						? "var(--tab-icon-overlay-fill)"
						: "var(--toolbar-bgcolor)"
				)
				: prefs.scrollbarTrackColor
		};
}

/*ensure the new tab button won't be wrapped to the new row in any case*/
${(() => {
	let css = `
		${CSS.supports("selector(:has(*))") ? `
			${_}:has(
				> .tabbrowser-tab:nth-child(
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
				min-width: calc(var(--tabstrip-separator-size) + var(--max-item-width) + var(--new-tab-button-width) + var(--tabs-scrollbar-width)) !important;
			}
		`}
	`;
	return prefs.tabsUnderControlButtons ? `
		@media ${singleRow} {
			${css}
		}
	` : css;
})()}

@media ${singleRow} {
	/*in single row mode, they are wrapped to new line once the box overflows,
		hide them to underflow the box*/
	${_}${__="[overflowing]::part(items-wrapper)"}::before,
	${_}${__}::after,
	${_}[overflowing] #tabbrowser-arrowscrollbox-periphery {
		visibility: collapse;
	}
}

/*do not limit the box width when [positionpinnedtabs]*/
#tabbrowser-tabs:not([positionpinnedtabs])[overflow] ${_} {
	min-width: calc(var(--max-item-width) + var(--tabs-scrollbar-width)) !important;
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
	background-image: radial-gradient(
		ellipse at bottom,
		rgba(0,0,0,0.1) 0%,
		rgba(0,0,0,0.1) 7.6%,
		rgba(0,0,0,0) 87.5%
	);
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

${prefs.tabsUnderControlButtons < 2 || !getPref("widget.windows.overlay-scrollbars.enabled", "Bool") ? `
	/*
	 the dragover may not be fired when dragging out happened too fast, thus check the movingtab on
	 TabsToolbar to ensure the indicators show after [moving-single-tab] is set properly
	*/
	${context = `#TabsToolbar[movingtab] #tabbrowser-tabs:is(
		${prefs.tabsUnderControlButtons && !win7 && !win8 ? "" : "[multirows],"}
		[overflow]
	):not(
		[moving-positioned-tab],
		[moving-single-tab]${gBrowser.tabGroups ? "[moving-tabgroup]" : ""},
		[movingtab-finishing]
	)`}
		${_}::part(overflow-start-indicator),
	${context} ${_}::part(overflow-end-indicator) {
		opacity: 1;
	}
` : ``}

/*display the up and down buttons at the top and bottom edges for scrolling while dragging*/
${_}::part(scrollbutton-up),
${_}::part(scrollbutton-down) {
	--border: 1px;
	--height: min(${prefs.scrollButtonsSize}px, var(--tab-height) / 2);
	position: absolute;
	inset-inline: 0;
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
	padding: 0 !important;
	opacity: 0 !important;
	pointer-events: none;
	height: max(var(--height), var(--border) * 2 / var(--device-pixel-ratio));
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
	padding: 0;
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
	top: calc(var(--extra-drag-space) * -1);
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
	z-index: calc(1/0);
}

${context="#tabbrowser-tabs[overflow][dragging]:not([moving-positioned-tab])"}
	${_}:not([lockscroll]):not([scrolledtostart])::part(scrollbutton-up),
${context}
	${_}:not([lockscroll]):not([scrolledtoend])::part(scrollbutton-down)
{
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
	box-sizing: border-box;
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

[positionpinnedtabs] ${_}::part(items-wrapper) {
	padding-inline-start: calc(var(--tab-overflow-pinned-tabs-width) + var(--gap-after-pinned));
}

${prefs.justifyCenter ? `
	${prefs.justifyCenter == 1 ? "#tabbrowser-tabs:not([multirows], [overflow])" : ""}
		${_}::part(items-wrapper)
	{
		justify-content: safe center;
	}
` : ``}

/*avoid any weird stuff going out of bounds and causing the scrollbox to overflow*/
${_}:not([scrollsnap])::part(items-wrapper),
/*when dragging tab outside the boundary, it makes the slot not expand*/
#tabbrowser-tabs[movingtab] ${_}::part(items-wrapper) {
	overflow: hidden;
}

${condition="#tabbrowser-tabs[movingtab-finishing]"} {
	-moz-window-dragging: no-drag;
}

${condition} ${_} {
	pointer-events: none;
}

tab-group {
	--line-overlap-length: 1px;
}

${_=".tabbrowser-tab"}, .tab-group-label-container, .tab-group-overflow-count-container {
	/*snap to end but not start as the first row may be occupied by the inline placeholder*/
	scroll-snap-align: end;
	margin-inline-end: var(--adjacent-newtab-button-adjustment, 0px) !important;

	/*override the position:absolute of the fx rule*/
	&[dragtarget] {
		position: relative !important;
	}
}

.tab-group-label-container::after,
.tab-group-overflow-count-container::after {
	z-index: -1;
}

#tabbrowser-tabs[movingtab] > #tabbrowser-arrowscrollbox > ${_}:is([selected], [multiselected]) {
	/*override the rule that prevents the drop indicator display next to the dragged tab when pressing ctrl (fx115)*/
	pointer-events: auto;
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

${_} {
	height: var(--tab-height, auto);
}

/* [class][class]: win over the default rule */
${_}${condition = prefs.pinnedTabsFlexWidth ? "[class][class]" : ":not([pinned])"} {
	/*make the animate smoother when opening/closing tab*/
	padding: 0;
}

${_}${condition}[fadein] {
	max-width: var(--tab-max-width);
}

${prefs.pinnedTabsFlexWidth ? `
	${_}[pinned] {
		--tab-icon-end-margin: inherit;
		--tab-label-mask-size: ${appVersion < 130 ? 2 : 1}em !important;
		flex: 100 100;
		min-width: var(--tab-min-width-pref, var(--tab-min-width));
	}

	[pinned]:is(
		.tab-throbber,
		.tab-icon-pending,
		.tab-icon-image,
		.tab-sharing-icon-overlay,
		.tab-icon-overlay
	) {
		margin-inline-end: var(--tab-icon-end-margin, 5.5px);
	}

	.tab-icon-stack:not(
		[muted], [soundplaying], [activemedia-blocked]
	) .tab-icon-image[pinned]:not([src]) {
		display: none;
	}
` : ``}

/* fx143+ win over the fx default rule*/
#tabbrowser-tabs[orient] tab-group[movingtabgroup][collapsed][hasactivetab] > ${_}[visuallyselected] {
	max-width: var(--tab-max-width) !important;
	min-width: var(--calculated-tab-min-width) !important;
}

${_}${condition}::before,
${_}${condition}::after {
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

${_}${condition} .tab-content {
	padding: 0;
}

${_}${condition} .tab-content::before,
${_}${condition} .tab-content::after {
	content: "";
	width: var(--tab-inline-padding);
	flex-shrink: 0;
}

${prefs.pinnedTabsFlexWidthIndicator ? `
	${_}${condition} .tab-content[pinned]::after {
		transform: scaleX(${-1 * DIR});
		width: 12px;
		height: 100%;
		background:
			url(chrome://browser/skin/pin-12.svg)
			center calc(var(--tab-block-margin) * 2) / contain
			no-repeat
			content-box;
		fill: currentColor;
		-moz-context-properties: fill;
		/*it's flipped so always use left instead of inline-start*/
		padding-left: var(--tab-block-margin);
	}
` : ``}

${prefs.pinnedTabsFlexWidth && appVersion < 139 ? ["ltr", "rtl"].map(dir => `
	${__=".tab-label-container[textoverflow]"}[labeldirection=${dir}],
	${__}:not([labeldirection]):-moz-locale-dir(${dir}) {
		direction: ${dir};
		mask-image: linear-gradient(to ${dir == "ltr" ? "left" : "right"}, transparent, black var(--tab-label-mask-size));
	}
`).join("\n") : ``}

/* for tabs with audio button, fix the size and display the button like pinned tabs */
#tabbrowser-tabs[orient] ${_}[fadein]:is(
	[muted], [soundplaying], [activemedia-blocked]
)${prefs.pinnedTabsFlexWidth ? "[fadein]" : ":not([pinned])"} {
	min-width: var(--calculated-tab-min-width);

	&:is([mini-audio-button]) {
		&:has(.tab-icon-image:not(${__ = "[src], [crashed], [sharing], [pictureinpicture], [busy]"}))
			.tab-icon-overlay
		{
			display: none;
		}

		&:has(.tab-icon-image:is(${__})) {
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
	.tab-group-overflow-count {
		margin-left: var(--width-rounding-diff);
		margin-top: var(--height-rounding-diff);
		padding-right: calc(var(--space-small) - var(--width-rounding-diff) + ${RTL_UI ? "0px" : "var(--group-line-padding)"});
	}

	&::after {
		right: calc(${RTL_UI ? "0px" : "var(--group-line-padding)"} - var(--width-rounding-diff)) !important;
	}
}

/*use [selected] instead of :active as it doesn't work on dragging*/
#tabbrowser-tabs[movingtab]:not([moving-tabgroup]) ${_}[fadein][selected]:not([animate-shifting]),
#tabbrowser-tabs[movingtab] [movingtabgroup] > :not([animate-shifting]) {
	transition: none !important;
}

#tabbrowser-tabs:not([movingtab]) tab-group ${_}[fadein] {
	transition: none;
}

/*bug #1985441*/
@media (prefers-reduced-motion: reduce) {
	tab-group ${_} {
		transition: none !important;
	}
}

[animate-shifting] .tab-content {
	overflow: hidden;
}

[animate-shifting] .tab-stack {
	will-change: margin-inline-end;

	.tab-group-line {
		width: calc(var(--l) + var(--line-overlap-length) + var(--width-rounding-diff));
	}
}

[animate-shifting],
[movingtabgroup] > * {
	--width-rounding-diff: 0px;
	--height-rounding-diff: 0px;
}

[animate-shifting=start] {
	--x: 0px;
	--y: 0px;
	--w: 0px;
	z-index: 1;
	transition: none !important;
	translate: var(--x) var(--y);

	.tab-group-line,
	&:is(.tab-group-label-container, .tab-group-overflow-count-container)::after {
		translate: calc(var(--x) * -1) calc(var(--y) * -1) -1px;
	}
}

[animate-shifting=start] .tab-stack {
	margin-inline-end: calc(var(--w) * -1);
}

[moving-tabgroup] tab-group[movingtabgroup] > *,
${_}${condition = `:is([selected], [multiselected]):is(
	[movingtab] #tabbrowser-tabs:not([moving-tabgroup], [moving-pinned-tab])
		${_}:not([pinned]):not([collapsed] > :not([selected]):not([animate-shifting])),
	[moving-pinned-tab] ${_}[pinned]
)`} {
	--translate-x: 0px;
	--translate-y: var(--scroll-top, 0px) * -1;
	transform: translate(var(--translate-x), calc(var(--translate-y) + var(--scroll-top, 0px)));

	/* exclude the [movingtab-finishing] state since there is a position problem of the group line
	   when drag-to-group happens before the resizing of dragged tab finished (only the dragged one),
	   generally only happens in debug mode. adding the condition somehow fix the problem, but it seems only a workaround.
	 */
	#tabbrowser-tabs:not([movingtab-finishing]) & .tab-group-line,
	&:is(.tab-group-label-container, .tab-group-overflow-count-container)::after {
		transform: translate3d(${__="calc(var(--translate-x) * -1), calc(var(--translate-y) * -1 - var(--scroll-top, 0px))"}, -1px);
	}

	tab-group & .tab-group-label-hover-highlight {
		transform: translate(${__});

		.tab-group-label {
			transform: translate(var(--translate-x), calc(var(--translate-y) + var(--scroll-top, 0px)));
		}
	}
}

[movingtabgroup][collapsed] .tab-group-label-hover-highlight {
	background-color: ${__="var(--tab-hover-background-color)"};
	box-shadow: 0 0 0 var(--tab-group-label-highlight-radius, 2px) ${__};
}

${condition= `${_}:is(
	${condition},
	[movingtabgroup] > [selected],
	[animate-shifting]
)`} {
	--width-rounding-diff: 0px;
	--height-rounding-diff: 0px;

	overflow: visible;

	.tab-background {
		transform-style: preserve-3d;
	}

	#tabbrowser-tabs[orient] & .tab-group-line {
		/*add 1px more to advoid any gap due to missing the compenstate for rounding offset*/
		/*generally it should be handled but it is difficult to guarantee*/
		inset-inline-end: calc(-1 * var(--tab-overflow-clip-margin) - var(--line-overlap-length));

		/*preserve-3d makes the positioning origin shifted*/
		inset-block-end: calc(var(--tab-group-line-toolbar-border-distance) - var(--tab-block-margin));
	}
}

${condition} .tab-stack > * {
	margin-right: calc(var(--width-rounding-diff) * -1) !important;
	margin-bottom: calc(var(--height-rounding-diff) * -1) !important;
}

${condition} .tab-background {
	margin-bottom: calc(var(--tab-block-margin) - var(--height-rounding-diff)) !important;
}

${condition} .tab-label-container {
	margin-bottom: var(--height-rounding-diff) !important;
}

.tab-group-label-container:is(
	[animate-shifting],
	[movingtabgroup] > *
)::after {
	inset-inline-end: calc(var(--line-overlap-length) * -1) !important;
}

${__ = "[animate-shifting=run]"},
${__} :is(.tab-stack, .tab-group-line),
${__}:is(.tab-group-label-container, .tab-group-overflow-count-container)::after,
[movingtabgroup] ${__} :is(
	${__=".tab-group-label-hover-highlight"},
	${__} .tab-group-label
) {
	transition: var(--tab-animation) !important;
	transition-property: translate !important;

	&${_} {
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

[animate-shifting=run] .tab-stack {
	transition-property: margin-inline-end !important;

	.tab-group-line {
		transition-property: translate !important;
	}
}

${__="[movingtab-finishing] [animate-shifting=run]"},
${__} .tab-group-line,
${__}:is(.tab-group-label-container, .tab-group-overflow-count-container)::after,
[movingtab-finishing] [movingtabgroup] [animate-shifting=run] :is(
	${__=".tab-group-label-hover-highlight"},
	${__} .tab-group-label
) {
	transition-property: translate, transform !important;
}

/*firefox bug*/
tab-group .tab-group-line {
	/*bug #1990744*/
	#tabbrowser-tabs[orient] & {
		${_}:not(
			:has(~ tab:not([hidden], [closing])),
			[hasactivetab][hasmultipletabs][collapsed] > [selected]
		) > .tab-stack > .tab-background > & {
			--line-overlap-length: 0px;
			--indent: ${appVersion > 144 ? "calc(var(--tab-border-radius) / 2)" : "0px"};
			inset-inline-end: var(--indent) !important; /*override the --line-overlap-length setting*/
			border-start-end-radius: ${__="calc(var(--tab-group-line-thickness) / 2)"};
			border-end-end-radius: ${__};

			[animate-shifting] & {
				width: calc(var(--l) + var(--line-overlap-length) - var(--tab-overflow-clip-margin) - var(--indent) + var(--width-rounding-diff));
			}
		}
	}

	#tabbrowser-tabs[movingtab] ${_}:is([selected], [multiselected]) > .tab-stack > .tab-background > & {
		${__="--dragover-tab-group-color"}: var(--tab-group-color);
		${__}-invert: var(--tab-group-color-invert);

		/* the color of the multiselected active tab is overrided by the inverted one */
		tab-group[collapsed] & {
			background-color: var(--tab-group-line-color);
		}

		/*bug #1990744*/
		${_}:has(~ tab:not([hidden], [closing])) & {
			border-radius: 0;
		}

		/*bug #1990744*/
		${_}:not(:has(~ tab:not([hidden], [closing]))) & {
			border-start-start-radius: 0;
			border-end-start-radius: 0;
		}
	}
}

/*
  prevent the original rules display the line when:
  1. when dragging normal tabs with pinned tab selected
  2. the [movingtab-group] had presented
  3. a tiny bit of line (the overlap length?) is visible during collapsing a group
*/
:is(
	tab[pinned],
	#tabbrowser-arrowscrollbox > tab,
	tab-group[collapsed] tab:not([selected])
) .tab-group-line {
	display: none !important;
}

#tabbrowser-tabs[${MOVINGTAB_GROUP}] [pinned] .tab-background[multiselected] {
	outline: var(--tab-outline);
	outline-color: var(--focus-outline-color);
	outline-offset: calc(${outlineOffsetSnapping("var(--outline-width)")} * -1);
}

/*make moving pinned tabs above the selected normal tabs*/
#tabbrowser-tabs[moving-positioned-tab] > #tabbrowser-arrowscrollbox >
	${_}[pinned]:is([selected], [multiselected])
{
	z-index: 3;
}

@media ${prefs.tabsUnderControlButtons == 2 ? multiRows : "screen"} {
	${context=`#TabsToolbar:not([customizing])
		#tabbrowser-tabs:not([ignore-newtab-width])${prefs.tabsUnderControlButtons < 2 ? ":not([overflow])" : ""}[hasadjacentnewtabbutton]`}
		${lastNode},
	${context} :is(${lastNode}, tab-group:has(> ${lastNode})) ~ [closing] {
		--adjacent-newtab-button-adjustment: ${__="var(--new-tab-button-width)"};

		/*shift tabs to prevent the animation run at wrong position*/
		tab-group[collapsed] & {
			& ~ :nth-child(1 of tab:not([hidden], [closing])) {
				margin-inline-start: calc(${__} * -1) !important;
			}

			& ~ :nth-last-child(1 of tab:not([hidden], [closing])) {
				margin-inline-end: ${__} !important;
			}
		}

		/*TODO emtpy group?*/
	}

	${context} :is(${lastNode}, tab-group:has(> ${lastNode})) ~ [closing] {
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

#tabbrowser-tabs[forced-overflow] ${lastNode} {
	--adjacent-newtab-button-adjustment: var(--forced-overflow-adjustment) !important;
}

/*
  move the margin-start to the last pinned, so that the first normal tab won't
  have a weird margin on the left when it is wrapped to new row. the important is necessary here.
  the [first-visible-unpinned-tab] is for fx 115 as it may not be updated in time and cause weird layout animation.
*/
${context = `#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
	${_}:is(:nth-child(1 of :not([pinned], [hidden])), [first-visible-unpinned-tab])`}
{
	margin-inline-start: 0 !important;
}

${context}[closing] {
	margin-inline-start: -.1px !important;
}

#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
	:nth-last-child(1 of [pinned]:not([hidden])):not(:nth-last-child(1 of :is(${_}:not([hidden], [closing]), tab-group)))
{
	margin-inline-end: var(--gap-after-pinned) !important;
}

/*exclude the pinned tabs since they may have the attribute when newly pinned*/
${context = "#tabbrowser-tabs[closebuttons=activetab]"}[orient]
	${_}:not([pinned])[closebutton] .tab-close-button:not([selected]),
/*fx 115*/
${context} > #tabbrowser-arrowscrollbox > ${_}:not([pinned])[closebutton] >
	.tab-stack > .tab-content > .tab-close-button:not([selected=true])
{
	display: flex;
}

${_}:not([pinned]):not([closebutton]) .tab-close-button:not([selected]) {
	display: none;
}

/*bug fix for fx 115*/
:root[uidensity=touch] #tabbrowser-tabs[orient] ${_}:not([pinned], [fadein]) {
	max-width: .1px;
	min-width: .1px;
}

/*bug #1985190*/
#tabbrowser-tabs .tab-background[class][class] {
	--outline-width: calc(var(--tab-outline-offset, -1px) * -1);
	outline-offset: calc(${outlineOffsetSnapping("var(--outline-width)")} * -1);
}

.tab-background[multiselected][selected],
[${MOVINGTAB_GROUP}] tab:not([pinned]) .tab-background:is([multiselected], [selected]) {
	--tab-outline-offset: -2px;
}

#tabbrowser-tabs${condition="[ignore-newtab-width]"}:not([overflow]) #tabbrowser-arrowscrollbox-periphery {
	margin-inline-end: calc(var(--new-tab-button-width) * -1);
}

${condition}:not([multirows]) #tabs-newtab-button {
	visibility: hidden;
}

@media ${prefs.tabsUnderControlButtons == 2 ? multiRows : "screen"} {
	#tabbrowser-tabs:not(${condition}) #tabs-newtab-button {
		margin-inline-start: calc(var(--new-tab-button-width) * -1) !important;
	}
}

/*test for animating the new tab button when switching between overflow and underflow*/
/*
#tabbrowser-arrowscrollbox-periphery {
	position: static;
}

#TabsToolbar:not([customizing])
	#tabbrowser-tabs[overflow][hasadjacentnewtabbutton]:not([dragging], [movingtab-finishing])
	#tabs-newtab-button
{
	display: flex;
	position: absolute;
	bottom: 0;
	inset-inline-end: var(--tabs-scrollbar-width);
	z-index: 1;
}

#TabsToolbar:not([customizing]):not([tabs-dragging-ext])
	#tabbrowser-tabs[overflow][hasadjacentnewtabbutton] ~ #new-tab-button
{
	filter: opacity(0);
}

#TabsToolbar:not([customizing])
	#tabbrowser-tabs[overflow][hasadjacentnewtabbutton]:not([dragging], [movingtab-finishing]) ~ #new-tab-button
{
	visibility: hidden;
}
*/

.closing-tabs-spacer {
	transition: none !important;
}

/*add [id] to win over the default rule*/
#tabbrowser-tabs[orient] > #pinned-drop-indicator[id] {
	display: flex;
	align-items: center;
	position: absolute;
	top: 0;
	inset-inline-start: calc(var(--pre-tabs-items-width) + var(--tabstrip-separator-size));
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
	width: ${__="var(--tab-min-height)"};
	height: ${__};
	padding: 0;
	margin: var(--tab-block-margin) var(--tab-overflow-clip-margin);
	border-radius: var(--border-radius-small);
	outline-offset: calc(${outlineOffsetSnapping("1px")} * -1);
	background: var(--tab-hover-background-color);
	backdrop-filter: blur(var(--tabs-placeholder-blurriness));
	opacity: 0;
	transition: var(--tabs-item-opacity-transition) !important;
	transition-property: opacity, box-shadow, background-color !important;
	pointer-events: none;

	&[visible] {
		opacity: 1;
	}

	[tabs-multirows]:not([has-items-pre-tabs]) &,
	[multirows] > &:not([forFirstRow]) {
		top: calc(var(--tab-height) * var(--preserved-row, 0));
		inset-inline-start: 0;
		height: calc(var(--tab-min-height) + var(--tab-height) * (var(--tab-rows) - 1 - var(--preserved-row, 0)));

		[has-items-pre-tabs][tabs-scrolledtostart] & {
			--preserved-row: 1;
		}
	}

	&[interactive] {
		background: var(--tab-selected-bgcolor);
		box-shadow: var(--tab-selected-shadow);
	}
}

#pinned-drop-indicator-icon {
	filter: ${__="drop-shadow(0 0 1px light-dark(transparent, black))"} ${__};
}

#tabbrowser-tabs[orient] .tab-group-label-container {
	height: var(--tab-height);
	padding-inline: var(--group-line-padding);
	margin-inline-start: 0;

	/* fx143+ win over the fx default rule*/
	tab-group:is(:not([collapsed]), [hasactivetab]) &[class][class] {
		&::after {
			height: var(--tab-group-line-thickness);
			bottom: var(--tab-group-line-toolbar-border-distance);
			inset-inline: var(--group-line-padding) 0;
			border-start-start-radius: 1px;
			border-end-start-radius: 1px;
			pointer-events: none;
		}

		/*bug #1990744*/
		&:not(:has(~ tab:not([hidden], [closing])))::after {
			inset-inline-end: var(--group-line-padding) !important;
			border-start-end-radius: ${__="calc(var(--tab-group-line-thickness) / 2)"};
			border-end-end-radius: ${__};
		}
	}
}

.tab-group-label {
	max-width: var(--group-label-max-width);

	/*bug #1985445*/
	&::before {
		content: "";
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

	/*bug #1985190*/
	tab-group[collapsed] > .tab-group-label-container & {
		outline-offset: calc(${outlineOffsetSnapping("1px")} * -1);
	}
}

${prefs.tabsUnderControlButtons ? `
	:root {
		--multirows-background-position: ${__="var(--lwt-background-alignment)"};
	}

	:root[lwtheme-image] {
		--multirows-background-position: right top, ${__};
	}

	/*the backdrop-filter breaks if the tabs toolbar doesn't have a opaque background and
	  the window inactive opacity is applying*/
	:root[${CUSTOM_TITLEBAR}] :is(#titlebar, .browser-titlebar) {
		background: inherit;
		transition-property: opacity, background-color;
	}

	:root[${CUSTOM_TITLEBAR}][lwtheme] #navigator-toolbox {
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

	${_}[tabs-scrolledtostart] {
		--post-tabs-clip-reserved: calc(var(--tab-shadow-size) - var(--tab-overflow-clip-margin, 2px));
	}

	${_}:-moz-window-inactive {
		--tabs-placeholder-background-color: var(${
			appVersion == 115
				? (
					win7 && defaultDarkTheme
						? "--tab-icon-overlay-fill"
						: (
							win8 && defaultTheme
								? "--tab-selected-bgcolor, var(--lwt-selected-tab-background-color)"
								: "--lwt-accent-color-inactive, var(--lwt-accent-color)"
						)
				)
				: "--toolbox-bgcolor-inactive, var(--toolbox-non-lwt-bgcolor-inactive, var(--lwt-accent-color-inactive, var(--tab-selected-bgcolor, var(--lwt-selected-tab-background-color))))"
		});
	}

	${micaEnabled && accentColorInTitlebarMQ.matches && defaultAutoTheme || prefs.nativeWindowStyle ? `
		${_} {
			${__="--tabs-placeholder-background-color"}: ActiveCaption;
		}
		${_}:-moz-window-inactive {
			${__}: InactiveCaption;
		}
	` : ``}

	${mica ? `
		${_}, ${_}:-moz-window-inactive {
			/*color from measuring the color of tabs bar when disabling the mica effect and enabling widget.windows.mica*/
			--tabs-placeholder-background-color: light-dark(#E8E8E8, #202020);
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
			#TabsToolbar-customization-target > :not(#tabbrowser-tabs)
		{
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

		${context}:not([tabs-scrolledtostart]) :is(
			${_},
			${dropOnItemsExt}:not(${adjacentNewTab})
		):is(#tabbrowser-tabs ~ *, #TabsToolbar:not([pinned-tabs-wraps-placeholder]) *)
			:is(.toolbarbutton-1:not(#PlacesChevron) .toolbarbutton-icon, .toolbarbutton-badge-stack, #PlacesToolbar)
		{
			${floatingButtonStyle = `
				border-radius: var(--tab-border-radius);
				box-shadow:
					var(--tabs-placeholder-shadow),
					inset 0 0 0 var(--tabs-placeholder-border-width) var(--tabs-placeholder-border-color);
				backdrop-filter: blur(var(--tabs-placeholder-blurriness));
				background-color: color-mix(
					in srgb,
					var(--tabs-placeholder-background-color) ${prefs.floatingBackdropOpacity}%,
					transparent
				);
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
			padding-inline-start: 0 !important;
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
			--top-placeholder-clip:
				${START_PC} ${y="calc(var(--tabs-top-space) * -1)"},
				calc(${END_PC} - var(--scollbar-clip-width, (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved))) * ${DIR}) ${y};
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
		#TabsToolbar:not([tabs-scrolledtostart])${prefs.floatingBackdropClip ? tbDraggingHidePlaceHolder : showPlaceHolder}
			:is(
				#TabsToolbar:not(${condition="[pinned-tabs-wraps-placeholder]"}) ${_="#personal-bookmarks"},
				#TabsToolbar${condition} #tabbrowser-tabs ~ ${_}
			)
			.toolbarbutton-text
		{
			color: var(--lwt-tab-text);
		}
	` : ``}

	#TabsToolbar[has-items-pre-tabs][positionpinnedtabs]:not(
		[tabs-hide-placeholder], [pinned-tabs-wraps-placeholder], [tabs-is-first-visible]
	)
		#tabbrowser-arrowscrollbox[scrolledtostart]::part(overflow-start-indicator)
	{
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
		margin-inline-end: calc(
			var(--tabstrip-padding) + var(--tabstrip-border-width) - ${borderSnapping("var(--tabstrip-border-width)")}
		);
	}

	${context}[tabs-multirows] ${_}::before {
		border-bottom: var(--tabstrip-border);
		margin-bottom: calc(${borderSnapping("var(--tabstrip-border-width)")} * -1);
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
		clip-path: inset(
			var(--clip-shadow)
			${RTL_UI ? 0 : "var(--clip-shadow)"}
			var(--clip-shadow)
			${RTL_UI ? "var(--clip-shadow)" : 0}
		);
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
		clip-path: inset(
			var(--clip-shadow)
			${RTL_UI ? "var(--clip-shadow)" : 0}
			var(--clip-shadow)
			${RTL_UI ? 0 : "var(--clip-shadow)"}
		);
	}

	[multirow-pinned-tabs] ${_} {
		visibility: collapse;
	}

	#TabsToolbar[tabs-scrolledtostart] :is(${_}, #tabs-placeholder-pre-tabs) {
		pointer-events: none;
	}

	${_="#tabs-placeholder-new-tab-button"} {
		--clip-bottom: 0;
		bottom: 0;
		inset-inline-end: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--new-tab-button-width) - var(--scrollbar-clip-reserved));
		border-inline-end: 0;
		border-bottom-width: 0;
		border-start-start-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(
			var(--clip-shadow)
			${RTL_UI ? "var(--clip-shadow)" : 0}
			var(--clip-bottom)
			${RTL_UI ? 0 : "var(--clip-shadow)"}
		);
	}

	#tabbrowser-tabs[movingtab] ${_} {
		bottom: var(--extra-drag-space);
	}

	${!prefs.floatingBackdropClip ? `
		${context = prefs.tabsAtBottom ? "#TabsToolbar" : `${shownMenubar} + #TabsToolbar`}
			${_=`:is(#TabsToolbar:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs, #tabs-placeholder-post-tabs)`}
		{
			border-top-width: var(--tabs-placeholder-border-width);
			border-top-color: var(--tabs-placeholder-border-color);
		}

		${context}${condition="[tabs-scrolledtostart]"} ${_} {
			border-top-color: transparent;
		}

		${context}:not(${condition}, ${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs {
			border-start-end-radius: ${__="var(--tabs-placeholder-border-radius)"};
		}

		${context} #tabs-placeholder-post-tabs {
			border-start-start-radius: ${__};
		}

		${prefs.tabsAtBottom == 1 ? `
			:root:not([inFullscreen]) #TabsToolbar:has(~ #PersonalToolbar:not([collapsed=true], [collapsed=""]))
				#tabs-placeholder-new-tab-button
			{
				--clip-bottom: var(--clip-shadow);
				border-end-start-radius: ${__};
				border-bottom-width: var(--tabs-placeholder-border-width);
				border-bottom-color: var(--tabs-placeholder-border-color);
				height: calc(var(--tab-height) - var(--tabs-placeholder-border-width));
			}
		` : ``}
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
			var(--tab-height)
			+ var(--tabs-padding-top)
			+ var(--nav-toolbox-padding-top)
			- ${prefs.floatingBackdropClip ? "0px" : "var(--tabs-placeholder-border-width)"} * 2
		);
	}

	${_}:not([tabs-hide-placeholder], [pinned-tabs-wraps-placeholder])
		#tabbrowser-arrowscrollbox[overflowing]::part(items-wrapper)::before,
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
					:root:not([${CUSTOM_TITLEBAR}])
				)`} ${prefs.tabsbarItemsAlign == "end" ? `
					${_}
				` : `
					#new-tab-button:nth-child(
						1 of #tabbrowser-tabs[hasadjacentnewtabbutton] ~ :not([hidden=true], [collapsed=true])
					):nth-last-child(1 of :not([hidden=true], [collapsed=true]))
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
		${context="#TabsToolbar[has-items-post-tabs]"+showPlaceHolder} ${adjacentNewTab} {
			position: static;
			align-self: start;
		}

		${context}${tbDraggingHidePlaceHolder}[tabs-scrolledtostart] ${adjacentNewTab} {
			opacity: 1 !important;
		}

		/*hide it when moving tab, since it is excluded in the previous rule because of adjacent*/
		${context}${tbDraggingHidePlaceHolder}:not([tabs-scrolledtostart], [tabs-dragging-ext])
			${adjacentNewTab}
		{
			opacity: 0 !important;
		}

		@media ${multiRows} {
			:is(
				#TabsToolbar[tabs-dragging-ext][has-items-post-tabs]:not([tabs-scrolledtostart]),
				#TabsToolbar[tabs-dragging-ext]:not([has-items-post-tabs], [tabs-scrolledtoend]),
			) ${adjacentNewTab} .toolbarbutton-icon
			{
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
			.toolbarbutton-icon
		{
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
		:root[lwtheme-image] :is(
			#firefox-view-button > .toolbarbutton-icon,
			.tab-background
		) {
			--lwt-header-image: none !important;
		}
	` : ``}
` : ``}

${debug && debug < 3 ? `
	${_="#tabbrowser-tabs"} {
		background: rgba(0,255,255,.2);
		box-shadow: 0 -5px rgba(0,255,0,.5);
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
		content: attr(elementIndex) !important;
		height: .001px;
	}
	${!prefs.pinnedTabsFlexWidth ? `
		${_}[pinned][elementIndex]::before {
			position: absolute;
		}
	` : ``}
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

	[ignore-newtab-width] ${_} {
		outline: 3px lime;
		outline-style: dashed !important;
	}

	${_}[style*="--slot-height"] {
		outline: 3px solid orange;
	}
` : ""}
${debug > 1 ? `
	:root {
		--inactive-window-transition: 2s ease;
	}
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
rAF(2).then(() => root.removeAttribute("multitabrows-applying-style"));
}

{
	let observer = new ResizeObserver(() =>
		root.style.setProperty("--nav-toolbox-height", gNavToolbox.getBoundingClientRect().height + "px")
	);

	function onLwtChange() {
		root.style.removeProperty("--multirows-background-position");
		let cs = getComputedStyle(gNavToolbox);

		let bgImgs = [...cs.backgroundImage.matchAll(/(?<=url\(").+?(?="\))/g)].flat();
		Promise.all(bgImgs.map(src => new Promise(rs => {
			let img = new Image();
			img.onload = () => rs(img.height || 0);
			img.onerror = () => rs(0);
			img.src = src;
		}))).then(heights =>
			root.style.setProperty("--lwt-background-image-natural-height", Math.max(0, ...heights) + "px")
		);

		let bgPos = cs.backgroundPosition;
		let hasChanged;
		bgPos = bgPos.split(", ").map(s => {
			s = s.split(" ");
			if (s[1] != "0%" && s[1].includes("%")) {
				hasChanged = true;
				s[1] = `calc(${
					s[1]
						.replace(/calc\(|\)/g, "")
						.replace(
							/\d+%/g,
							m => "(var(--nav-toolbox-height) - var(--multirows-background-size)) * " + parseFloat(m) / 100,
						)
				})`;
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
		if (
			e.target != this ||
			scrollbar?.isConnected ||
			!(scrollbar = getScrollbar(this))
		)
			return;

		scrollbar.addEventListener("click", () => this._ensureSnap(), true);
		for (let eType of ["mouseover", "mouseout"])
			scrollbar.addEventListener(eType, () => {
				let out = eType == "mouseout";
				scrollbar.style.MozWindowDragging = out ? "" : "no-drag";
				tabsBar.toggleAttribute("tabs-scrollbar-hovered", !out);
			}, true);
	}, true);

	let ensureSnapDelay = getPref("general.smoothScroll.mouseWheel.durationMaxMS", "Int");
	let snapTimeout;
	//ensure to snap well when clicking on the scrollbar
	scrollbox._ensureSnap = function() {
		//if it's already scrolled to the edge and click on the up / down button,
		//the scrollend event will not be dispatched
		//wait a while and check if there is no scroll, then remove the attribute
		let remainder = this.scrollTop % tabHeight;
		if (remainder) {
			console?.log("snap", remainder);
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
			if (isCalledBy("on_dragover")) {
				if (arrowScrollbox._isScrolling || lockDragScroll)
					return;
				if (gReduceMotion)
					lockDragScroll = setTimeout(
						() => lockDragScroll = null,
						getPref("general.smoothScroll.durationToIntervalRatio", "Int") * 2,
					);

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

		console?.time(`scrollbox ${e.type} ${e.detail}`);

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

		delete arrowScrollbox._isScrolling;

		console?.timeLog(`scrollbox ${e.type} ${e.detail}`, "update status");
		console?.log({type: e.type, overflow});

		//overflow may fired when moving tab then locking the slot
		if (overflow) {
			if (!tabContainer.hasAttribute("movingtab")) {
				tabContainer._unlockTabSizing({instant: true});
				tabContainer._handleTabSelect(true);
			}
		} else
			for (let tab of gBrowser._removingTabs)
				gBrowser.removeTab(tab);

		$("#tab-preview-panel")?.[toggleAttr]("rolluponmousewheel", true);

		tabContainer._updateInlinePlaceHolder();
		tabContainer._updateCloseButtons();

		console?.timeEnd(`scrollbox ${e.type} ${e.detail}`);
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

	let {
		getAttribute, removeAttribute, toggleAttribute, setAttribute, dispatchEvent,
		on_wheel, on_scroll, on_scrollend,
	} = arrowScrollbox;

	//Take charge and not let the ResizeObserver in the constructor of MozArrowScrollbox do anything stupid about
	//the determination of overflow and event dispatching.
	//When the window is expanded and the box changes from being forced to be in one row, to being able to be in multi-rows,
	//the block may bounce very violently
	arrowScrollbox.dispatchEvent = function({type}) {
		return ["overflow", "underflow"].includes(type) ? false : dispatchEvent.apply(this, arguments);
	};

	arrowScrollbox._canScrollToElement = ele => {
		return (
			!isTab(ele) ||
			(
				(ele.visible ?? !ele.hidden) &&
				!(ele.pinned && tabContainer.hasAttribute("positionpinnedtabs"))
			)
		);
	};

	arrowScrollbox.instantScroll = function(scrollTop) {
		let {smoothScroll} = this;
		this.smoothScroll = false;
		assign(scrollbox, {scrollTop});
		assign(this, {smoothScroll});
	};

	if (arrowScrollbox.on_overflow)
		arrowScrollbox.on_underflow = arrowScrollbox.on_overflow = emptyFunc;

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
		console?.log("scrolling", {scrollTop, scrollTopMax, _lastScrollTop});
		if (tabContainer.matches("[tabmousedown], [dragging], [movingtab]")) {
			fakeScrollbar.scrollTop = scrollTop;
			if (tabContainer.matches(":is([dragging], [movingtab]):not([moving-positioned-tab])"))
				this.style.setProperty("--scroll-top", scrollTop + "px");
		}

		if (
			scrollTop != _lastScrollTop && scrollTopMax && scrollTopMax >= _lastScrollTop &&
			this.overflowing && !this.lockScroll
		) {
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
		console?.log(e.type);
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
	let gNavToolboxResizeObserver = new ResizeObserver(() => {
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

//hack MozTabbrowserTabGroup
let groupProto = customElements.get("tab-group")?.prototype;
if (groupProto) {
	let CLICKED_BY_MOUSE = Symbol("clickedByMouse");
	let elementIndexOpd = {
		set: function(v) {
			let {group} = this;
			let container = group.labelContainerElement;
			container.setAttribute("elementIndex", container.elementIndex = v);
			group.overflowContainer?.setAttribute("elementIndex", v + group.visibleTabs.length + .5);
		},
		get: function() { return this.group.labelContainerElement.elementIndex },
		configurable: true,
	};
	let onLabelFlowChange = function(e) {
		this.toggleAttribute("overflow", e.type == "overflow");
	};

	let {ungroupTabs, remove, dispatchEvent, on_click, addTabs} = groupProto;
	let opd = Object.getOwnPropertyDescriptors(groupProto);

	let properties = {
		label: {
			set: function(v) {
				if (this.isConnected && isCalledBy("#setMlGroupLabel"))
					rAF(tabContainer.hasAttribute("movingtab-finishing") ? 2 : 0)
						.then(() => animateLayout(() => opd.label.set.call(this, v)));
				else
					opd.label.set.call(this, v);
			},
			get: opd.label.get,
			configurable: true,
		},
		collapsed: {
			set: function(v) {
				if (isCalledBy("[_#]expandGroupOnDrop"))
					return;

				if (!this.isConnected || !!v == this.collapsed) {
					opd.collapsed.set.call(this, v);
					return;
				}

				let nodes = getNodes({newTabButton: true, includeClosing: true});
				let oc = this.isShowingOverflowCount && this.overflowContainer;
				if (v) {
					if (this[CLICKED_BY_MOUSE] || tabContainer.hasAttribute("movingtab"))
						tabContainer._lockTabSizing(this.labelElement);
				} else {
					nodes = nodes.filter(n => n != oc);
					nodes.push(...this.nonHiddenTabs);
				}

				this.togglingAnimation = animateLayout(async () => {
					opd.collapsed.set.call(this, v);
					this.setAttribute("toggling", v ? "collapse" : "expand");
					//clean up locking in case it wasn't cleaned as the group is collapsed
					for (let t of this.tabs)
						t.style.minWidth = "";
					if (!v)
						tabContainer.removeAttribute("ignore-newtab-width");
					else if (oc) {
						tabContainer._keepTabSizeLocked = true;
						return oc;
					}
				}, {
					nodes: v && isCalledBy("startTabDrag")
						? nodes.filter(n =>
							n != this.labelContainerElement
							// !this.contains(n)
						)
						: nodes,
				}).then(() => {
					delete this.togglingAnimation;
					this.removeAttribute("toggling");
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
				if (isCalledBy("[_#]setIsDraggingTabGroup"))
					return;
				this.toggleAttribute("movingtabgroup", v);
			},
			get: function() { return this.hasAttribute("movingtabgroup") },
			configurable: true,
		},
		isShowingOverflowCount: {
			get: function() { return this.overflowContainer?.checkVisibility({visibilityProperty: true}) },
			configurable: true,
		},
	};
	if (!("labelContainerElement" in groupProto))
		properties.labelContainerElement = {
			get: function() { return this._labelContainerElement ??= $(".tab-group-label-container", this) },
			configurable: true,
		};
	if ("overflowCountLabel" in groupProto && !("overflowContainer" in groupProto))
		properties.overflowContainer = {
			get: function() { return this._overflowContainer ??= $(".tab-group-overflow-count-container", this) },
			configurable: true,
		};
	Object.defineProperties(groupProto, properties);

	new MutationObserver(list => {
		for (let ent of list)
			if (ent.type == "childList")
				for (let n of ent.addedNodes)
					if (n.tagName == "tab-group")
						initGroup(n);
	}).observe(arrowScrollbox, {childList: true});

	gBrowser.tabGroups.forEach(initGroup);

	/** @param {MozTabbrowserTabGroup} g */
	function initGroup(g) {
		let label = g.labelElement;
		let idx = label.elementIndex;
		Object.defineProperty(label, "elementIndex", elementIndexOpd);
		assign(label, {
			elementIndex: idx,
			scrollIntoView,
		});
		assign(g.labelContainerElement, {scrollIntoView});
		for (let e of ["overflow", "underflow"])
			label.addEventListener(e, onLabelFlowChange);
	}

	groupProto.on_click = function(e) {
		if (e.inputSource == MouseEvent.MOZ_SOURCE_MOUSE)
			this[CLICKED_BY_MOUSE] = true;
		on_click.apply(this, arguments);
		delete this[CLICKED_BY_MOUSE];
	};

	groupProto.ungroupTabs = function() {
		animateLayout(
			() => ungroupTabs.apply(this, arguments),
			{nodes: getNodes({newTabButton: true, includeClosing: true}).filter(t => t != this.labelContainerElement)},
		);
	};

	groupProto.addTabs = function(tabs) {
		let run = () => addTabs.apply(this, arguments);
		if (isCalledBy("on_drop"))
			run();
		else
			animateLayout(() => {
				if (tabs[0]?.ownerGlobal != window) {
					let oldTabs = this.tabs;
					tabs[0].container.animateLayout(run);
					return this.tabs.filter(t => !oldTabs.includes(t));
				} else
					run();
			});
	};

	groupProto.remove = function() {
		if (tabContainer.hasAttribute("movingtab"))
			return;
		this.removingAnimation = animateLayout(() => {
			remove.call(this);
			tabContainer._invalidateCachedTabs();
		}, {
			nodes: getNodes({newTabButton: true, includeClosing: true}).filter(t => t != this.labelContainerElement),
		}).then(() => delete this.removingAnimation);
	};

	groupProto.dispatchEvent = function(e) {
		if (e.type == "TabGroupRemoved" && tabContainer.hasAttribute("movingtab"))
			return false;
		return dispatchEvent.apply(this, arguments);
	};

	groupProto.isTabVisibleInGroup = function(tab) {
		return !this.collapsed || tab.selected;
	};

	groupProto.refreshState = async function() {
		let {hasActiveTab} = this;
		if (hasActiveTab == null) return;

		let isSelectedGroup = gBrowser.selectedTab.group == this;
		if (hasActiveTab || isSelectedGroup)
			await animateLayout(async () => {
				if (this.tabs[0])
					this.appendChild(this.tabs.at(-1));
				let totalCount = this.nonHiddenTabs.length;
				this.hasActiveTab = isSelectedGroup;
				this.toggleAttribute("hasmultipletabs", totalCount > 1);
				if (isSelectedGroup) {
					let overflowCount = totalCount - this.visibleTabs.length;
					this.overflowCountLabel.textContent = overflowCount
						? await gBrowser.tabLocalization.formatValue(
							"tab-group-overflow-count",
							{tabCount: overflowCount},
						)
						: "";
				}
			});
	};
}

//hack MozTabbrowserTab
let tabProto = customElements.get("tabbrowser-tab").prototype;
{
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
	}

	Object.defineProperty(tabProto, "stack", {
		get: function() {
			return this._stack ??= $(".tab-stack", this);
		},
		configurable: true,
	});

	assign(tabProto, {scrollIntoView});
}

//hack tabDragAndDrop
{
	let HANDLE;
	if (window.TabDragAndDrop) {
		/*global TabDragAndDrop*/
		eval(`
			let {console} = window;
			window.TabDragAndDrop = ${TabDragAndDrop.toString().replace(/(^(\s+([gs]et\s+)?)|this.)(#)/mg, "$1_")};
		`);
		(tabContainer.tabDragAndDrop = assign(new window.TabDragAndDrop(tabContainer), {
			_updateTabStylesOnDrag: emptyFunc,
			_resetTabsAfterDrop: emptyFunc,
			_moveTogetherSelectedTabs: emptyFunc,
		})).init();

		HANDLE = "handle";
	} else {
		assign(tabContainer, {
			tabDragAndDrop: tabContainer,
			_pinnedDropIndicator: tabContainer.pinnedDropIndicator,
		});

		if (!tabContainer._getDragTargetTab) {
			let MozTabbrowserTabs = customElements.get("tabbrowser-tabs");
			[
				"#getDropIndex", "#setDragOverGroupColor", "#"+TRIGGER_DRAG_OVER_GROUPING,
			].forEach(n => exposePrivateMethod(MozTabbrowserTabs, n));
			tabContainer._rtlMode = RTL_UI;
		}

		HANDLE = "on";
	}

	const {tabDragAndDrop} = tabContainer;
	const {
		startTabDrag,
		[`${HANDLE}_dragover`]: handle_dragover,
		[`${HANDLE}_dragend`]: handle_dragend,
		[`${HANDLE}_drop`]: handle_drop,
		[`${HANDLE}_dragleave`]: handle_dragleave,
	} = tabDragAndDrop;

	tabDragAndDrop._getDragTargetTab ??= tabDragAndDrop._getDragTarget;

	const FINISH_ANIMATE_TAB_MOVE = tabDragAndDrop.finishAnimateTabMove
		? "finishAnimateTabMove"
		: "_finishAnimateTabMove";
	const finishAnimateTabMove = tabDragAndDrop[FINISH_ANIMATE_TAB_MOVE];

	tabDragAndDrop.createMouseDownData = function(e, tab) {
		let {x, y} = e;
		let rect = getRect(elementToMove(tab));
		return {
			atTabXPercent: (x - rect.x) / rect.width,
			oriX: x,
			oriY: y,
			oriNodeRect: rect,
			tab, x, y,
		};
	};

	tabDragAndDrop.startTabDrag = function(e, tab, opt) {
		let draggingTab = isTab(tab);
		let {pinned} = tab;
		let {selectedTabs} = gBrowser;

		//on fx115, ctrl click on another tab and start dragging, the clicked tab won't be [selected],
		//the _dragData is set on it but the data is expected to be bound on [selected] thus things go messed up
		//it is also the fix for bug #1987160
		if (draggingTab && !tab.selected && !opt?.fromTabList) {
			tabContainer.selectedItem = tab;
			for (let t of [...selectedTabs, tab])
				gBrowser.addToMultiSelectedTabs(t);
			({selectedTabs} = gBrowser);
		}

		let movingTabs = draggingTab ? selectedTabs.filter(t => t.pinned == pinned) : [tab];
		let stopAnimateTabMove;

		if (movingTabs.length > prefs.animateTabMoveMaxCount) {
			opt = assign(opt, {fromTabList: true});
			stopAnimateTabMove = true;
		}

		let useCustomGrouping = tab.multiselected;
		let {removeFromMultiSelectedTabs} = gBrowser;
		if (useCustomGrouping) {
			this._groupSelectedTabs(tab);
			if (this._moveTogetherSelectedTabs)
				//prevent the pinned tabs being unslected when dragging normal tabs, or vice versa
				gBrowser.removeFromMultiSelectedTabs = emptyFunc;
			else
				//prevent the excecution of #moveTogetherSelectedTabs or _groupSelectedTabs
				//it also prevents the unselecting as above
				tab.removeAttribute("multiselected");
		} else if (!draggingTab && !opt?.fromTabList) {
			//set the attribute early to prevent the selected tab from applying the transform
			tabContainer.setAttribute("moving-tabgroup", "");
			gNavToolbox.setAttribute("moving-tabgroup", "");
			tab.group.setAttribute("movingtabgroup", "");
		}

		if (prefs.hideDragPreview == (draggingTab ? 2 : 1) || prefs.hideDragPreview == 3) {
			let dt = e.dataTransfer;
			dt.setDragImage(document.createElement("div"), 0, 0);
			dt.updateDragImage = dt.setDragImage = emptyFunc;
		}

		pauseStyleAccess(() => startTabDrag.call(this, e, tab, opt), tab, "#updateTabStylesOnDrag");

		(draggingTab ? tab : tab.group.labelContainerElement).removeAttribute("dragtarget");

		let {_dragData} = tab;

		//if it is from tab list, there is no mouse down data
		let data =
			tabContainer._lastMouseDownData ||
			//in case the mouse down data is missing, e.g. something pops up and triggers
			//the mouseleave to delete the data
			!opt?.fromTabList && this.createMouseDownData(e, tab);
		assign(_dragData, data);

		assign(_dragData, {
			stopAnimateTabMove,
			pinned: !!pinned,
			draggingTab,
			movingPositionPinned: pinned && tabContainer.hasAttribute("positionpinnedtabs"),
		});

		delete tabContainer._lastMouseDownData;
		tabContainer._hideFakeScrollbar();

		//fix the movingTabs as the original is told that there is no multiselect
		if (useCustomGrouping) {
			assign(_dragData, {movingTabs});
			tab.setAttribute("multiselected", true);
			assign(gBrowser, {removeFromMultiSelectedTabs});
		}
	};

	//since the original _groupSelectedTabs will modify the transform property
	//and cause improper transition animation,
	//rewite the whole _groupSelectedTabs and not execute the original one
	tabDragAndDrop._groupSelectedTabs = function(draggedTab) {
		console?.time("_groupSelectedTabs");

		let groupData = new Map();
		let {pinned} = draggedTab;
		let {selectedTabs} = gBrowser;
		let visibleTabs = getNodes({onlyFocusable: true});
		let pos = item => item.elementIndex ?? item._tPos;

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
					addAnimationData(
						movingTab,
						basedIdx + i,
						basedPos + i,
						centerIdx,
						pos(movingTab) < _tPos,
						centerTab,
					);
				}
			});
		});

		/**
		 * @param {MozTabbrowserTab} movingTab
		 * @param {number} newIndex
		 * @param {number} newPos
		 * @param {number} centerIdx
		 * @param {boolean} beforeCenter
		 * @param {MozTabbrowserTab} centerTab
		 */
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

				if (!!middle.pinned != movingTab.pinned)
					break;

				if (middle.multiselected)
					continue;

				let data = groupData.get(middle);
				if (!data || !("indexShift" in data))
					groupData.set(middle, data = {indexShift: 0});

				data.indexShift += beforeCenter ? -1 : 1;
			}
		}

		let tabIndex = selectedTabs.indexOf(draggedTab);
		let hasGrouped;
		animateLayout(() => {
			for (let i = 0; i < tabIndex; i++)
				moveTab(i);
			for (let i = selectedTabs.length - 1; i > tabIndex; i--)
				moveTab(i);
			if (!hasGrouped)
				assign(animatingLayout, {shouldUpdatePlacholder: false, cancel: true});
		});

		console?.timeEnd("_groupSelectedTabs");

		function moveTab(i) {
			let t = selectedTabs[i];
			let data = groupData.get(t);
			let tabIndex = data.newPos;
			if (tabIndex && tabIndex != pos(t)) {
				gBrowser[data.beforeCenter ? "moveTabsBefore" : "moveTabsAfter"]([t], data.centerTab);
				hasGrouped = true;
			}
		}
	};

	tabDragAndDrop[`${HANDLE}_dragover`] = function(e) {
		//workaround with fx bug:
		//the dragleave won't be fired if it happens before dragover is called twice
		if (this._dragoverTimeout)
			clearTimeout(this._dragoverTimeout);
		else
			this._dragoverTimeout = setTimeout(
				() => tabContainer.dispatchEvent(new Event("dragleave")),
				200, //generally the next dragover will be fired within 100ms
			);

		//in case the ctrl is released before the animation is done
		if (tabContainer.hasAttribute("movingtab-finishing"))
			return;

		if (["", "none"].includes(this.getDropEffectForTabDrag(e))) {
			handle_dragover.apply(this, arguments);
			return;
		}

		let dt = e.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let draggingTab = isTab(draggedTab);
		let sameWindow = draggedTab?.ownerGlobal == window;
		let copy = dt.dropEffect == "copy";
		let animate = draggedTab && sameWindow && !copy && !draggedTab._dragData.fromTabList;

		tabsBar.toggleAttribute("tabs-dragging-ext", !animate);

		if (!tabContainer.hasAttribute("dragging")) {
			console?.time("on_dragover - setup");
			tabContainer.setAttribute("dragging", "");
			tabsBar.setAttribute("tabs-dragging", "");

			tabContainer.lockSlotSize();
			gBrowser.addEventListener("mousemove", tabContainer);
			addEventListener("mouseout", tabContainer);

			arrowScrollbox.lockScroll = true;
			clearTimeout(this._passingByTimeout);
			this._passingByTimeout = setTimeout(() => {
				arrowScrollbox.lockScroll = false;
				let panel = $(":is(#customizationui-widget-panel, #appMenu-popup)[panelopen]");
				if (panel) {
					let panelRect = getRect(panel), tabsRect = getRect(tabContainer);
					if (isOverlapping(panelRect, tabsRect))
						panel.hidePopup();
				}
			}, tabContainer._dragOverDelay || getPref("browser.tabs.dragDrop.selectTab.delayMS", "Int", 350));
			fakeScrollbar.scrollTop = scrollbox.scrollTop;

			if (animate) {
				//set the attribute early to prevent the placeholders hide during moving pinned tabs together
				let movingPinned = !!draggedTab?.pinned;
				let movingPositionPinned = movingPinned && tabContainer.hasAttribute("positionpinnedtabs");
				tabContainer.toggleAttribute("moving-pinned-tab", movingPinned);
				tabContainer.toggleAttribute("moving-positioned-tab", movingPositionPinned);
				tabsBar.toggleAttribute("moving-positioned-tab", movingPositionPinned);
			}

			console?.timeEnd("on_dragover - setup");
		}

		let ind = this._tabDropIndicator;

		console?.time("original on_dragover");

		let hidden;
		Object.defineProperties(ind, {
			//when copying tab in the same window,
			//the original on_dragover hide the indicator (modify DOM), measure arrowScrollbox,
			//and show the indicator (modify DOM again), cause serious reflow problem and terribly lag.
			// eslint-disable-next-line no-setter-return
			hidden: {set: v => hidden = v, configurable: true},
			//ignore the transform setting
			style: {get: () => ({}), configurable: true},
		});

		try {
			handle_dragover.apply(this, arguments);
		} finally {
			delete ind.hidden;
			delete ind.style;
		}

		console?.timeEnd("original on_dragover");

		let target = this._getDragTargetTab(e);
		const movingTab = tabContainer.hasAttribute("movingtab");
		const updatePinState = sameWindow && dragToPinSupported && !copy &&
			draggingTab && target && !prefs.disableDragToPinOrUnpin &&
			draggedTab.pinned != !!target.pinned;

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

		console?.time("on_dragover - update indicator");

		const numPinned = gBrowser.pinnedTabCount;
		const nodes = getNodes({onlyFocusable: true});
		const firstNonPinned = nodes[numPinned];

		let idx = this._getDropIndex(e);
		let lastNode = nodes.at(-1);
		let lastIdx = indexOf(lastNode);

		console?.debug("drag ind", idx, target);

		if (movingTab) {
			if (updatePinState) {
				if (draggedTab.pinned)
					target = firstNonPinned;
				else {
					target = nodes[numPinned - 1];
					tabContainer.removeAttribute(MOVINGTAB_GROUP);
					tabContainer.removeAttribute("movingtab-addToGroup");
					this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
					this._setDragOverGroupColor(null);
					delete draggedTab._dragData.shouldCreateGroupOnDrop;
				}
				idx = numPinned;
			}
		} else {
			//dragging a group
			if (isTabGroupLabel(draggedTab)) {
				//dragging to pinned area
				if (target?.pinned)
					idx = numPinned;
				//dragging to normal area
				else {
					let {group} = target || {};
					//handle group over group
					if (group)
						//will drop before
						if (idx <= (group.visibleTabs.at(-1) || group.labelElement).elementIndex)
							idx = (target = group.labelElement).elementIndex;
						//will drop after
						else
							target = nodes[idx];
				}
			}
			//copy as a pinned tab is always disallowed
			else if (target?.pinned && copy)
				idx = numPinned;
			//handle moving tab to the same window
			else if (draggedTab?._dragData.fromTabList && sameWindow && !copy) {
				//dragging a pinned tab
				if (draggedTab.pinned) {
					if (!dragToPinSupported || !target) {
						//limit the drop range
						lastNode = nodes[lastIdx = numPinned - 1];
						if (!target?.pinned)
							idx = numPinned;
					}
				}
				//dragging a normal tab at void
				else if (!target)
					idx = lastIdx + 1;
				//dragging a normal tab to pinned area but can't pin
				else if (!dragToPinSupported && target.pinned)
					idx = numPinned;
			}
			//dragging external thing or copying tabs to pinned area
			else if (target?.pinned && (!draggedTab || sameWindow))
				idx = numPinned;

			//handle all cases which will drop as first normal
			if (
				idx == numPinned ||
				/*there may be hidden tabs before non pinned*/
				idx == firstNonPinned?._tPos
			)
				if (
					!draggedTab ||
					!(dragToPinSupported && target?.pinned) && sameWindow ||
					copy ||
					draggedTab && !sameWindow && !draggedTab.pinned
				)
					target = firstNonPinned;
				//pinned tab won't be adopted as a first non-pinned
				else if (!sameWindow && draggedTab?.pinned && numPinned && !target?.pinned)
					target = nodes[numPinned - 1];
		}

		//handle out of drop range
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
				rAF(2).then(() => style.transition = "");
			}
			style.transform = `translate(calc(${x}px + 50% * ${DIR}), ${y}px)`;
		} else
			ind.hidden = true;

		function indexOf(e) {
			return e.elementIndex ?? e._tPos;
		}

		console?.timeEnd("on_dragover - update indicator");
	};

	//since the original _animateTabMove will modify the transform property and cause improper transition animation,
	//rewite the whole _animateTabMove and not execute the original one
	tabDragAndDrop._animateTabMove = function(e) {
		const tabGroupsEnabled = gBrowser._tabGroupsEnabled;
		const dragToGroupTabs = prefs.dragToGroupTabs && tabGroupsEnabled;
		const draggedTab = e.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);
		const {_dragData} = draggedTab;
		let {
			pinned, recursion, draggingTab, movingTabs, movingPositionPinned,
			lastX, lastY, oriX, oriY,
		} = _dragData;
		const pinDropInd = draggingTab && !prefs.hidePinnedDropIndicator ? this._pinnedDropIndicator : null;

		if (draggingTab && dragToPinSupported && !prefs.disableDragToPinOrUnpin) {
			let dragOverTarget = this._getDragTargetTab(e);
			if (dragOverTarget && !!dragOverTarget.pinned != pinned)
				return;
		}

		const TIMER = "_animateTabMove" + (recursion ? "_recursion" : "");
		console?.time(TIMER);

		/* prototype of drag to pin/unpin */
		// if (!prefs.disableDragToPinOrUnpin) {
		// 	let dragOverTarget = this._getDragTargetTab(e);
		// 	if (draggingTab && dragOverTarget && !!dragOverTarget.pinned != pinned) {
		// 		for (let t of movingTabs)
		// 			gBrowser[pinned ? "unpinTab" : "pinTab"](t);
		// 		// gBrowser[pinned ? "moveTabsBefore" : "moveTabsAfter"](movingTabs, dragOverTarget);
		// 		pinned = !pinned;
		// 		movingPositionPinned = pinned && tabContainer.hasAttribute("positionpinnedtabs");
		// 		assign(_dragData, {pinned, movingPositionPinned});
		// 		lastX = null;
		// 		tabsBar.removeAttribute("movingtab");
		// 	}
		// }

		const {x, y} = e;
		const scrollOffset = movingPositionPinned ? 0 : scrollbox.scrollTop;

		//the animate maybe interrupted and restart, don't initialize again
		if (lastX == null) {
			let draggedNode = elementToMove(draggedTab);
			let numPinned = gBrowser.pinnedTabCount;

			let movingNodes;
			if (draggingTab)
				movingNodes = movingTabs;
			else {
				let {group} = draggedTab;
				movingNodes = [group.labelContainerElement];
				if (group.hasActiveTab) {
					//in case there is actually no visible tabs (firefox bug)
					movingNodes.push(...group.visibleTabs);
					if (group.isShowingOverflowCount)
						movingNodes.push(group.overflowContainer);
				}
			}
			//set boxTop before updating nodes
			assign(_dragData, {
				boxTop: getRect(scrollbox).y,
				movingNodes,
			});

			updateNodeRects();

			//handle the case that the tab has been shifted after mousedown
			let nR = getRect(draggedNode), oR = _dragData.oriNodeRect;
			oriX = (_dragData.oriX += Math.round(nR.x - oR.x + (nR.width - oR.width) * _dragData.atTabXPercent));
			oriY = (_dragData.oriY += Math.round(nR.y - oR.y));

			let moveOverThreshold = tabGroupsEnabled
				? Math.min(1, Math.max(0, getPref("browser.tabs.dragDrop.moveOverThresholdPercent", "Int") / 100))
				: .5;
			let groupThreshold = 1 - moveOverThreshold;

			assign(_dragData, {
				scrollPos: movingPositionPinned ? 0 : scrollOffset,
				numPinned,
				moveOverThreshold,
				groupThreshold,
				draggedNode,
				createGroupDelay: dragToGroupTabs && getPref("browser.tabs.dragDrop.createGroup.delayMS", "Int"),
			});

			console?.timeLog(TIMER, "init");
			console?.log(_dragData);
		}

		let {numPinned, movingNodes, draggedNode} = _dragData;

		if (!tabsBar.hasAttribute("movingtab")) {
			InspectorUtils.addPseudoClassLock(draggedNode, ":hover");
			if (!draggingTab) {
				//the attribute may be removed when finishAnimateTabMove has fired after ctrl was pressed
				tabContainer.setAttribute("moving-tabgroup", "");
				gNavToolbox.setAttribute("moving-tabgroup", "");
				draggedTab.group.setAttribute("movingtabgroup", "");
				//in case the group is open after pressing ctrl
				draggedTab.group.collapsed = true;
			}
			tabContainer.setAttribute("movingtab", true);
			gNavToolbox.setAttribute("movingtab", true);
			tabsBar.setAttribute("movingtab", "");
			if (draggingTab && !draggedTab.multiselected)
				tabContainer.selectedItem = draggedTab;
			arrowScrollbox.style.setProperty("--scroll-top", scrollOffset + "px");
			tabContainer.toggleAttribute("moving-single-tab", movingNodes.length == 1);

			//these three has set at on_dragover early but they will removed when the dragging is paused
			let positionPinned = pinned && tabContainer.hasAttribute("positionpinnedtabs");
			tabContainer.toggleAttribute("moving-pinned-tab", pinned);
			tabContainer.toggleAttribute("moving-positioned-tab", positionPinned);
			tabsBar.toggleAttribute("moving-positioned-tab", positionPinned);
		}

		if (!_dragData.needsUpdate && x == lastX && y == lastY && !arrowScrollbox._isScrolling) {
			console?.timeEnd(TIMER);
			return;
		}
		delete _dragData.needsUpdate;

		console?.debug(`animate tab move, recursion=${recursion}`, x, y);

		let {
			moveForward,
			nodes, nodeRects,
			boxTop,
			moveOverThreshold, groupThreshold, createGroupDelay,
		} = _dragData;

		const deltaX = x - (lastX ?? oriX);
		const deltaY = y - (lastY ?? oriY);
		let dirX = Math.sign(deltaX);

		assign(_dragData, {lastX: x, lastY: y});

		let tranX, tranY, rTranX, rTranY, currentRow;

		let firstMovingIdx, lastMovingIdx,
			firstRect, lastRect, draggedRect, firstMovingRect, lastMovingRect;

		console?.timeLog(TIMER, "before shift moving");
		let shiftMovingNodes = () => {
			rTranX = tranX = x - _dragData.oriX;
			rTranY = tranY = y - _dragData.oriY;

			firstMovingIdx = nodes.indexOf(movingNodes[0]);
			lastMovingIdx = nodes.indexOf(movingNodes.at(-1));
			draggedRect = rect(draggedNode);
			//in case some nodes are collapsed
			nodes.find(n => firstRect = rect(n));
			nodes.findLast(n => lastRect = rect(n));
			movingNodes.find(n => firstMovingRect = rect(n));
			movingNodes.findLast(n => lastMovingRect = rect(n));

			let scrollChange = scrollOffset - _dragData.scrollPos;

			currentRow = Math.min(
				Math.max(
					Math.floor((draggedRect.y + draggedRect.height / 2 + tranY + scrollOffset + scrollChange - boxTop) / tabHeight),
					firstRect.row,
				),
				lastRect.row,
			);

			let rects = [...nodeRects.values()];
			let firstRectInCurrentRow = rects.find(r => r.row == currentRow);
			let lastRectInCurrentRow = rects.findLast(r => r.row == currentRow);

			let precedingNode = nodes[firstMovingIdx - 1];
			let followingNode = nodes[lastMovingIdx + 1];
			let precedingGroup = precedingNode?.closest("tab-group");
			let followingGroup = followingNode?.closest("tab-group");
			let extraShiftStart = getExtraShiftSpace(true);
			let extraShiftEnd = getExtraShiftSpace(false);

			rTranX -= Math.min(pointDeltaH(draggedRect.start + rTranX, firstRectInCurrentRow.start - extraShiftStart), 0) * DIR;
			rTranX += Math.min(pointDeltaH(lastRectInCurrentRow.end + extraShiftEnd, draggedRect.end + rTranX), 0) * DIR;

			console?.debug("restrict tranX", rTranX - tranX, currentRow, firstRectInCurrentRow, lastRectInCurrentRow, rects);

			if (
				firstMovingRect.row == firstRect.row ||
				currentRow - draggedRect.row + firstMovingRect.row == firstRect.row
			) {
				if (
					(draggingTab || nodes[0] == movingNodes[0]) &&
					currentRow < draggedRect.row && firstMovingRect.row == firstRect.row
				)
					rTranX -= pointDeltaH(firstMovingRect.start + rTranX, firstRect.start) * DIR;
				//don't restrict in the cases the node is placed to the end of previous row
				//instead of the location of dragging over typically when dragging a unnammed tab group to the row start
				else if (currentRow == draggedRect.row)
					rTranX -= Math.min(pointDeltaH(firstMovingRect.start + rTranX, firstRect.start), 0) * DIR;
				rTranY -= Math.min(pointDelta(firstMovingRect.y + rTranY + scrollChange, firstRect.y), 0);
			} else if (pointDeltaH(firstMovingRect.start + rTranX, firstRect.start, true) < 0)
				rTranY -= Math.min(pointDelta(firstMovingRect.y + rTranY + scrollChange, firstRect.bottom), 0);

			if (
				lastMovingRect.row == lastRect.row ||
				currentRow - draggedRect.row + lastMovingRect.row == lastRect.row
			) {
				if (
					(draggingTab || nodes.at(-1) == movingNodes.at(-1)) &&
					currentRow > draggedRect.row && lastMovingRect.row == lastRect.row
				)
					rTranX -= pointDeltaH(lastMovingRect.end + rTranX, lastRect.end + extraShiftEnd) * DIR;
				else if (currentRow == draggedRect.row)
					rTranX += Math.min(pointDeltaH(lastRect.end + extraShiftEnd, lastMovingRect.end + rTranX), 0) * DIR;
				rTranY += Math.min(pointDelta(lastRect.y, lastMovingRect.y + rTranY + scrollChange), 0);
			} else if (pointDeltaH(lastMovingRect.end + rTranX, lastRect.end, true) > 0)
				rTranY += Math.min(pointDelta(lastRect.y, lastMovingRect.bottom + rTranY + scrollChange), 0);

			rTranX -= Math.min(pointDeltaH(draggedRect.start + rTranX, rects.find(r => r.row == draggedRect.row).start - extraShiftStart), 0) * DIR;
			rTranX += Math.min(pointDeltaH(rects.findLast(r => r.row == draggedRect.row).end + extraShiftEnd, draggedRect.end + rTranX), 0) * DIR;

			console?.debug("restrict tranY", rTranY - tranY, currentRow, draggedRect.row, lastMovingRect.row, lastRect.row);

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
					"--translate-x": rTranX + "px",
					"--translate-y": rTranY + "px",
					zIndex,
				};
				assign(node.style, style);
				if (_dragData.expandGroupOnDrop && isTabGroupLabelContainer(node))
					for (let t of node.parentNode.nonHiddenTabs)
						if (t.hasAttribute("animate-shifting") && !t.visible)
							assign(t.style, style);
			});
			assign(gNavToolbox.style, {"--tabs-moving-max-z-index": maxZIndex});

			if (pinDropInd && !numPinned) {
				pinDropInd.toggleAttribute("forFirstRow", currentRow == firstRect.row && firstRect.y == boxTop);
				let r = getRect(pinDropInd);
				let interactive = isOverlapping(r, new Rect(x, y));
				if (!pinDropInd.hasAttribute("visible"))
					if (!interactive && pointDeltaH(rTranX, tranX) < r.width)
						this._clearPinnedDropIndicatorTimer();
					else if (!this._pinnedDropIndicatorTimeout) {
						this._pinnedDropIndicatorTimeout = setTimeout(
							() => pinDropInd.setAttribute("visible", ""),
							getPref("browser.tabs.dragDrop.pinInteractionCue.delayMS", "Int", 350),
						);
						this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
					}
				pinDropInd.toggleAttribute("interactive", interactive);
			}

			/**
			 * @param {boolean} backward
			 */
			function getExtraShiftSpace(backward) {
				if (!draggingTab || pinned)
					return 0;
				let {group} = draggedTab;
				let target = backward ? precedingNode : followingNode;
				let targetGroup = backward ? precedingGroup : followingGroup;
				let originalGroup = _dragData.groupOfLastAction;
				return (
					//ignore the case of at the middle of a group
					!(group && precedingGroup == followingGroup) &&
					(
						//can drag out of current group
						(
							group &&
							!backward &&
							group == precedingGroup
						) ||
						//just dragged into/out of the preceding group
						(
							precedingGroup &&
							originalGroup != group &&
							(precedingGroup == group || precedingGroup == originalGroup) &&
							//not dragged out of a group with overflow count previously
							!(precedingGroup.collapsed && precedingGroup.nonHiddenTabs[0])
						) ||
						//can group with target
						(
							!group &&
							(
								isTab(target)
									? dragToGroupTabs || targetGroup
									: (
										targetGroup &&
										(
											targetGroup.collapsed
												? dragToGroupTabs && appVersion > 142
												: backward
										)
									)
							)
						)
					)
				)
					? (backward ? firstMovingRect : lastMovingRect).width * groupThreshold * DIR
					: 0;
			}
		};
		shiftMovingNodes();
		console?.timeLog(TIMER, "after shift moving");

		if (arrowScrollbox._isScrolling) {
			_dragData.needsUpdate = true;
			updateRestrictedShfit();
			console?.timeEnd(TIMER);
			return;
		}

		const cursorMovingForward = dirX ? dirX == DIR : (moveForward ?? y >= oriY);
		const rowChange = currentRow - (_dragData.currentRow ?? rect(draggedNode).row);
		assign(_dragData, {currentRow});

		switch (Math.sign(rowChange)) {
			case -1: moveForward = false; break;
			case 1: moveForward = true; break;
			default: moveForward = cursorMovingForward;
		}

		let groupOfDraggedNode = draggedTab.group;

		let draggingGroupAtGroup;
		let leaderRect;
		//in case some nodes are collapsed
		let leader = movingNodes[moveForward ? "findLast" : "find"](n => (leaderRect = rect(n)).width);

		leaderRect.start += tranX;
		leaderRect.y += tranY + scrollOffset;

		let previousOverlap;
		let dropAfterElement, dropBeforeElement;
		let overlapBefore = false, overlapAfter = false;

		let tabsBeforeMoving = nodes.slice(0, firstMovingIdx);
		let tabsAfterMoving = nodes.slice(lastMovingIdx + 1);

		let leaderCenterY = leaderRect.y + leaderRect.height / 2;

		if (
			firstMovingRect.row == firstRect.row &&
			currentRow < draggedRect.row &&
			(draggingTab || !cursorMovingForward)
		) {
			dropBeforeElement = tabsBeforeMoving[0];
			console?.debug("move to first");
		} else if (
			lastMovingRect.row == lastRect.row &&
			currentRow > draggedRect.row &&
			(draggingTab || cursorMovingForward)
		) {
			dropAfterElement = tabsAfterMoving.at(-1);
			console?.debug("move to last");
		}
		else {
			leaderCenterY = Math.min(Math.max(leaderCenterY, firstRect.y), lastRect.bottom - 1);

			let prv, nxt;
			let row = nodes.flatMap((t, i) => {
				if (nxt) return [];
				let r = rect(t);
				//ignore the nodes with 0 width, e.g. tabs moved together into the active collapsed group
				if (!r.width) return [];

				if (pointDelta(r.y, leaderCenterY) <= 0 && pointDelta(leaderCenterY, r.bottom) < 0) {
					if (!prv) {
						let [tabBeforeRow, tab2ndBeforeRow] = movingNodes.includes(nodes[i - 1])
							? [tabsBeforeMoving.at(-1), tabsBeforeMoving.at(-2)]
							: [nodes[i - 1], nodes[i - 2]];
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
					let [tabAfterRow, tab2ndAfterRow] = movingNodes.includes(t)
						? [tabsAfterMoving[0], tabsAfterMoving[1]]
						: [t, nodes[i + 1]];
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
				updateRestrictedShfit();
				console?.timeEnd(TIMER);
				return;
			}

			console?.debug(
				"target row", "start",
				{
					x, y, tranX, tranY, rTranX, rTranY, prv,
					row, nxt, moveForward, leaderCenterY, leader, nodeRects, currentRow,
				},
			);

			[...prv, ...row, ...nxt][moveForward ? "findLast" : "find"](({t, r}, i, row) => {
				let passing = calcPassing(r);
				let rPassing = calcPassing(r, rTranX - tranX);

				//forced to use .5 when rowChange since the dragged tab may be moved to a place
				//that is not passing enough over the threshould
				let threshold =
					(
						recursion ||
						rowChange ||
						(
							!dragToGroupTabs &&
							(
								_dragData.groupOfLastAction == groupOfDraggedNode ||
								moveForward && _dragData.groupOfLastAction == t?.closest("tab-group")
							)
						) ||
						(
							prefs.dynamicMoveOverThreshold &&
							(
								pinned ||
								!draggingTab ||
								(
									groupOfDraggedNode == (t?.closest("tab-group") || false) &&
									!(
										!moveForward &&
										_dragData.groupOfLastAction != groupOfDraggedNode &&
										!groupOfDraggedNode.isShowingOverflowCount &&
										groupOfDraggedNode.visibleTabs.at(-1) == movingNodes.at(-1)
									)
								) ||
								t?.matches(".tab-group-overflow-count-container") ||
								(
									isTabGroupLabelContainer(t) &&
									t.parentNode[appVersion > 142 ? "isShowingOverflowCount" : "collapsed"]
								) ||
								(
									moveForward &&
									t?.matches("tab-group:not([collapsed]) .tab-group-label-container") &&
									(!_dragData.groupOfLastAction || _dragData.groupOfLastAction == t.parentNode)
								)
							)
						)
					)
						? .5
						: moveOverThreshold;

				console?.debug("target row", {rPassing, passing, t, r, leaderRect, threshold});

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
				let group =
					dropBeforeElement?.matches("tab-group > tab, .tab-group-overflow-count-container") &&
					dropBeforeElement.closest("tab-group");
				if (group) {
					draggingGroupAtGroup = true;
					if (cursorMovingForward) {
						dropAfterElement = group.isShowingOverflowCount
							? group.overflowContainer
							: group.tabs.findLast(t => t.visible) || group.labelContainerElement;
						dropBeforeElement =
							nodes.slice(nodes.indexOf(dropAfterElement) + 1)
								.find(t => !movingNodes.includes(t));
					} else {
						dropBeforeElement = group.labelContainerElement;
						dropAfterElement =
							nodes.slice(0, nodes.indexOf(dropBeforeElement))
								.findLast(t => !movingNodes.includes(t));
					}
				}
			}

			/** @param {Rect} r */
			function calcPassing(r, shift = 0) {
				return (
					Math.max(
						(
							moveForward
								? pointDeltaH(leaderRect.end + shift, r.start)
								: pointDeltaH(r.end, leaderRect.start + shift)
						),
						0,
					)
					/ Math.min(r.width, leaderRect.width)
				);
			}
		}

		if (debug) {
			cleanUpDragDebug();
			console?.log({dropAfterElement, dropBeforeElement, overlapAfter, overlapBefore});
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

			let overlapTarget =
				overlapBefore && dropAfterElement ||
				overlapAfter && dropBeforeElement;
			let overlappingTab = isTab(overlapTarget);
			if (
				!rowChange &&
				!recursion &&
				!pinDropInd?.hasAttribute("interactive") &&
				(
					overlappingTab && !overlapTarget.group ||
					(
						appVersion > 142 &&
						isTabGroupLabelContainer(overlapTarget) &&
						overlapTarget.parentNode.collapsed && draggedTab.group != overlapTarget.parentNode
					)
				)
			) {
				if (dragToGroupTabs)
					this[DRAG_OVER_GROUPING_TIMER] = setTimeout(
						() => {
							let args = [overlappingTab ? overlapTarget : overlapTarget.parentNode.labelElement];
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
				tabContainer.removeAttribute(MOVINGTAB_GROUP);
				tabContainer.removeAttribute("movingtab-addToGroup");
				$(`[${DRAGOVER_GROUPTARGET}]`)?.removeAttribute(DRAGOVER_GROUPTARGET);
				delete _dragData.shouldCreateGroupOnDrop;
				delete _dragData.shouldDropIntoCollapsedTabGroup;

				let afterOpenGroup = dropAfterElement?.closest("tab-group:not([collapsed]:not([hasactivetab]))");
				if (afterOpenGroup)
					if (!dropBefore && (overlapAfter || !overlapBefore && !draggedNode.group))
						dropElement = afterOpenGroup;
					else if (
						overlapBefore && afterOpenGroup != dropBeforeElement?.closest("tab-group") ||
						!overlapAfter && draggedNode.group == afterOpenGroup
					) {
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
		console?.log({shouldMove, dropBefore, dropElement});
		assign(_dragData, {dropElement, dropBefore, moveForward});

		// if (false)
		//TODO: ignore the cases that won't actually move, especially on the first round
		if (shouldMove) {
			console?.timeLog(TIMER, "before move");

			animateLayout(async () => {
				let oldVisualRects =
					!recursion &&
					new Map(movingNodes.map(t => {
						let r = getVisualRect(t);
						r.y += scrollOffset;
						return [t, r];
					}));

				gBrowser[dropBefore ? "moveTabsBefore" : "moveTabsAfter"](movingTabs, dropElement);
				groupOfDraggedNode?.refreshState();
				console?.timeLog(TIMER, "moved");

				if (rowChange && !_dragData.tabSizeUnlocked) {
					await tabContainer._unlockTabSizing({unlockSlot: false});
					_dragData.tabSizeUnlocked = true;
				}

				tabContainer._updateInlinePlaceHolder();
				//the slot may expand due to the rearrangement
				tabContainer.lockSlotSize();

				updateNodeRects();

				let newNodeRects = _dragData.nodeRects;

				let oldDraggedR = nodeRects.get(draggedNode);
				let newDraggedR = newNodeRects.get(draggedNode);
				let p = _dragData.atTabXPercent;
				let widthDelta = pointDelta(newDraggedR.width, oldDraggedR.width);

				_dragData.oriX += Math.round(newDraggedR.x - oldDraggedR.x + widthDelta * p);
				_dragData.oriY += Math.round(newDraggedR.y - oldDraggedR.y);

				if (recursion) {
					assign(_dragData, {widthDelta});
					return;
				}

				_dragData.groupOfLastAction = groupOfDraggedNode;

				if (rowChange && !draggingGroupAtGroup) {
					let recurse = moveForward => {
						assign(_dragData, {
							needsUpdate: true,
							moveForward,
							recursion: true,
						});
						this._animateTabMove(e);

						if (_dragData.widthDelta)
							({widthDelta} = _dragData);
					};
					recurse(!moveForward);

					/*
					  in some extreme cases, the dragged tab can't fit in the target row before recursing,
					  it is considered to squeeze the tabs to the end, but the widen tabs may not fully occupy the row,
					  and the outcome usually doesn't show as intentded. recursing once again generally fixes it.
					*/
					if (_dragData.widthDelta)
						recurse(!moveForward);

					if (!pinned || prefs.pinnedTabsFlexWidth)
						//recurse once again to ensure a better outcome
						recurse(moveForward);

					assign(_dragData, {
						recursion: null,
						widthDelta: null,
						forcedMoveToEdge: null,
					});

					newNodeRects = _dragData.nodeRects;
					newDraggedR = newNodeRects.get(draggedNode);
				}

				({nodes, nodeRects} = _dragData);

				let {restrictedShiftX: prvRX, restrictedShiftY: prvRY} = _dragData;

				shiftMovingNodes();
				updateRestrictedShfit();

				if (animatingLayout) {
					let shiftX = rowChange
						? (
							widthDelta * (RTL_UI ? p - 1 : p)
							+ (
								prvRX != null
									? _dragData.restrictedShiftX - prvRX - deltaX
									: 0
							)
						)
						: 0;
					let shiftY = rowChange
						? (
							prvRY != null
								? _dragData.restrictedShiftY - prvRY - deltaY
								: 0
						)
						: 0;

					for (let t of movingNodes) {
						let oldVR = oldVisualRects.get(t).relativeTo(oldDraggedR, false);
						let newR = newNodeRects.get(t).relativeTo(newDraggedR);

						oldVR.start += shiftX;
						oldVR.y += shiftY;
						newR.relative = true;

						animatingLayout.rects.set(t, oldVR);
						animatingLayout.newRects.set(t, newR);
					}
				}
			}, {
				nodes: [...nodes, tabContainer.newTabButton],
				shouldUpdatePlacholder: false,
				animate: !recursion,
			});
		} else
			updateRestrictedShfit();

		console?.timeEnd(TIMER);

		/**
		 * @param {Element} node
		 * @returns {Rect}
		 */
		function rect(node) {
			let r = nodeRects.get(node).clone();
			r.y -= scrollOffset;
			return r;
		}

		function updateNodeRects() {
			let {movingNodes} = _dragData;
			let nodes = getNodes({pinned});

			//in case some moving nodes go hidden, e.g. dragging into
			//a collapsed overflow group and the multiselected tabs go hidden
			let replaced;
			nodes = nodes.flatMap(n =>
				movingNodes.includes(n)
					? (
						replaced
							? []
							: (replaced = true, movingNodes)
					)
					: n
			);

			let nodeRects = new Map(nodes.map(n => {
				let r = getRect(n);
				r.y += scrollOffset;
				r.row = Math.round(pointDelta(r.y, _dragData.boxTop, true) / tabHeight);
				return [n, r];
			}));
			for (let node of movingNodes) {
				let r = nodeRects.get(node);
				assign(node.style, {
					"--width-rounding-diff": r.widthRoundingDiff + "px",
					"--height-rounding-diff": r.heightRoundingDiff + "px",
				});
			}
			assign(_dragData, {nodes, nodeRects});
		}

		function updateRestrictedShfit() {
			if (recursion) return;
			assign(_dragData, {
				restrictedShiftX: tranX - rTranX,
				restrictedShiftY: tranY - rTranY,
			});
		}
	};

	tabDragAndDrop._clearPinnedDropIndicatorTimer ??= function() {
		if (this._pinnedDropIndicatorTimeout) {
			clearTimeout(this._pinnedDropIndicatorTimeout);
			this._pinnedDropIndicatorTimeout = null;
		}
    };

	function cleanUpDragDebug() {
		if (!debug) return;
		$$("[test-drop-before]").forEach(e => e.removeAttribute("test-drop-before"));
		$$("[test-drop-overlap]").forEach(e => e.removeAttribute("test-drop-overlap"));
		getNodes().forEach(t => t.style.outline = t.style.boxShadow = "");
	};

	tabDragAndDrop[`${HANDLE}_dragleave`] = function(e) {
		handle_dragleave.apply(this, arguments);

		let target = e.relatedTarget;
		while (target && target != tabContainer)
			target = target.parentNode;
		if (!target)
			this._postDraggingCleanup();
	};

	tabDragAndDrop[`${HANDLE}_dragend`] = function(e) {
		pauseStyleAccess(() => handle_dragend.apply(this, arguments), e.target, "#resetTabsAfterDrop");
		this._postDraggingCleanup();
	};

	tabDragAndDrop[`${HANDLE}_drop`] = function(event) {
		let dt = event.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let sameWindow = draggedTab?.ownerGlobal == window;
		let {_dragData} = draggedTab || {};
		let useIndicatorToMove = _dragData?.stopAnimateTabMove || _dragData?.fromTabList;
		let moveTabTo;
		if (_dragData) {
			if (_dragData.shouldDropIntoCollapsedTabGroup)
				_dragData.dropElement = _dragData.dropElement.labelElement;
			else if (!_dragData.shouldCreateGroupOnDrop)
				delete _dragData.dropElement;

			if (useIndicatorToMove) {
				if (
					sameWindow &&
					dt.dropEffect == "move" &&
					_dragData.movingTabs.includes(
						(tabContainer.ariaFocusableItems ?? gBrowser.visibleTabs)[this._getDropIndex(event)]
					)
				) {
					({moveTabTo} = gBrowser);
					gBrowser.moveTabTo = emptyFunc;
				}
			}
		}

		let run = () => pauseStyleAccess(() => handle_drop.apply(this, arguments), draggedTab, "#resetTabsAfterDrop");
		if (draggedTab && !sameWindow)
			animateLayout(() => {
				let nodes = getNodes({onlyFocusable: true});
				draggedTab.container.animateLayout(run);
				return getNodes({onlyFocusable: true}).filter(n => !nodes.includes(n));
			});
		else
			run();

		if (moveTabTo)
			assign(gBrowser, {moveTabTo});

		if (_dragData) {
			if (useIndicatorToMove) {
				//animate of drag to pin/unpin is handled by the corresponding functions
				if (_dragData.pinned != !!_dragData.movingTabs[0].pinned) {
					//for drag to pin: the minWidth is removed by finishAnimateTabMove in general
					//but the function won't be called when no animate move
					if (!_dragData.pinned)
						rAF(2).then(() => _dragData.movingTabs.forEach(async t => {
							await waitForAnimate(t);
							t.style.minWidth = "";
						}));
				}
			} else if (!sameWindow) {
				//copying tabs
				if (draggedTab.isConnected)
					//add back the _dragData for finishAnimateTabMove on dragend
					assign(draggedTab, {_dragData});
			}
		}

		this._postDraggingCleanup();
	};

	tabDragAndDrop[FINISH_ANIMATE_TAB_MOVE] = async function() {
		//_animateTabMove is not triggered when copying tab at first, i.e. pressing ctrl before dragging tab
		//thus chack the [movingtab] of tabs bar instead to identify whether the animate has performed
		let finishing = tabContainer.hasAttribute("movingtab-finishing");
		let movingTabGroup = !finishing && tabContainer.hasAttribute("moving-tabgroup");
		//the dragover would not be triggered and marked as moving when dragging out of the window so fast
		let moving = movingTabGroup || !finishing && tabsBar.hasAttribute("movingtab");

		let movingNodes, _dragData, rectsBeforeDrop, draggingToPin, draggedGroup;
		let {selectedTab} = gBrowser;
		if (moving) {
			//mark down the translated tabs and perform a restoring animate
			if (movingTabGroup) {
				movingNodes	= $$(`[movingtabgroup] > :not(
					slot,
					tab[hidden],
					[collapsed] tab:not([selected]),
					:not([hasactivetab], [hasmultipletabs]) > .tab-group-overflow-count-container
				)`, arrowScrollbox);
				draggedGroup = movingNodes[0].parentNode;
				({_dragData} = draggedGroup.labelElement);
			} else {
				({_dragData} = selectedTab);
				//in case the data has been deleted
				if (_dragData && ({movingNodes} = _dragData))
					if (
						(
							_dragData.shouldCreateGroupOnDrop && !_dragData.dropElement.group ||
							_dragData.shouldDropIntoCollapsedTabGroup
						) &&
						isCalledBy("on_drop")
					)
						rectsBeforeDrop = new Map(
							getNodes({newTabButton: true}).map(t => [t, getVisualRect(t, true)])
						);
					else if (movingNodes[0].pinned != _dragData.pinned)
						//handle the animation by pinTab and unpinTab
						draggingToPin = true;
			}

			this._clearPinnedDropIndicatorTimer();
		}

		finishAnimateTabMove.apply(this, arguments);

		if (moving)
			try {
				if (prefs.dragToGroupTabs && gBrowser._tabGroupsEnabled)
					this[CLEAR_DRAG_OVER_GROUPING_TIMER]();

				//in case some unexpected scenarios
				movingNodes ??= [];

				if (draggingToPin) {
					refreshGroups();
					rAF(2).then(() => Promise.all(movingNodes.map(waitForAnimate)))
						.then(() => movingNodes.forEach(n => n.style.minWidth = ""));
				} else if (movingNodes[0]) {
					tabContainer.setAttribute("movingtab-finishing", "");
					_dragData.needsUpdate = true;

					if (rectsBeforeDrop)
						//wait a little bit to let the group settle
						await 0;

					let noTransform = {"--translate-x": "", "--translate-y": ""};

					//no group created if the dragging is canceled
					let {group} = movingNodes[0];
					if (rectsBeforeDrop && group) {
						for (let n of movingNodes)
							assign(n.style, noTransform);
						await animateLayout(async () => {
							await Promise.all([
								refreshGroups(),
								tabContainer._unlockTabSizing({unlockSlot: false}),
							]);
						}, {
							nodes: [...rectsBeforeDrop.keys()],
							rects: rectsBeforeDrop,
						});
					} else {
						tabContainer._keepTabSizeLocked = true;

						await Promise.all(movingNodes.map(async n => {
							n.setAttribute("animate-shifting", "run");
							await rAF();
							assign(n.style, noTransform);
							await waitForAnimate(n);
							n.removeAttribute("animate-shifting");
						}));

						if (draggedGroup && _dragData.expandGroupOnDrop) {
							for (let t of draggedGroup.nonHiddenTabs)
								assign(t.style, noTransform);
							/*
							  the tabs in group occasionally bounce when the group opens
							  it may be a racing of animation but can't figure how
							  adding a timeout somehow solved the problem
							*/
							setTimeout(async () => {
								draggedGroup.collapsed = false;
								await draggedGroup.togglingAnimation;
								delete tabContainer._keepTabSizeLocked;
								movingNodes[0].scrollIntoView();
							});
						} else
							delete tabContainer._keepTabSizeLocked;

						await refreshGroups();
						draggedGroup?.removeAttribute("movingtabgroup");
					}
				}
			} finally {
				for (let [ele, as] of [
					[tabDragAndDrop._pinnedDropIndicator, ["visible", "interactive"]],
					[tabContainer, [
						"moving-pinned-tab", "moving-positioned-tab", "moving-single-tab",
						"moving-tabgroup", "movingtab-finishing",
					]],
					[tabsBar, ["movingtab", "moving-positioned-tab"]],
					[gNavToolbox, ["moving-tabgroup"]],
				])
					for (let a of as)
						ele?.removeAttribute(a);

				assign(arrowScrollbox.style, {"--scroll-top": ""});

				let style = {
					zIndex: "",
					"--width-rounding-diff": "",
					"--height-rounding-diff": "",
					"--translate-x": "",
					"--translate-y": "",
				};
				//in case there are some moving hidden nodes
				for (let node of new Set([...getNodes(), ...movingNodes])) {
					//the dragged tab may be unselected thus clear all tabs for safety
					InspectorUtils.clearPseudoClassLocks(node, ":hover");
					assign(node.style, style);
				}
				if (!tabContainer.overflowing && !tabContainer._keepTabSizeLocked)
					tabContainer.unlockSlotSize();
				assign(gNavToolbox.style, {"--tabs-moving-max-z-index": ""});
				if (!_dragData.expandGroupOnDrop)
					(movingTabGroup ? movingNodes[0] : selectedTab)?.scrollIntoView();
			}

		function refreshGroups() {
			return gBrowser.tabGroups && Promise.all(gBrowser.tabGroups.map(async g => {
				if (!g.tabs[0]) {
					g.dispatchEvent(new CustomEvent("TabGroupRemoved", {bubbles: true}));
					g.remove();
					await g.removingAnimation;
				} else
					await g.refreshState();
			}));
		}
	};

	tabDragAndDrop._postDraggingCleanup = function() {
		if (prefs.dragToGroupTabs && gBrowser._tabGroupsEnabled) {
			this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
			tabContainer.removeAttribute(MOVINGTAB_GROUP);
			$(`[${DRAGOVER_GROUPTARGET}]`)?.removeAttribute(DRAGOVER_GROUPTARGET);
		}
		clearTimeout(this._dragoverTimeout);
		delete this._dragoverTimeout;
		this._clearPinnedDropIndicatorTimer();
		this._pinnedDropIndicator?.removeAttribute("interactive");
		clearTimeout(this._passingByTimeout);
		this._tabDropIndicator.style.transform = "";
		arrowScrollbox.lockScroll = false;
		for (let [ele, attrs] of [
			[tabContainer, ["tabmousedown", "dragging"]],
			[tabsBar, ["tabs-dragging", "tabs-dragging-ext"]],
		])
			for (let a of attrs)
				ele?.removeAttribute(a);

		cleanUpDragDebug();
	};

	/**
	 * @param {{(): void}} callback
	 * @param {Element} [element]
	 * @param {string} caller
	 */
	function pauseStyleAccess(callback, element, caller) {
		if (window.TabDragAndDrop || !dragToPinSupported) {
			callback();
			return;
		}

		let proto = (element?.ownerGlobal || window).XULElement.prototype;
		let oriStyle = Object.getOwnPropertyDescriptor(proto, "style");
		let dummy = {};

		Object.defineProperty(proto, "style", {
			get: function() {
				return isCalledBy(caller) ? dummy : oriStyle.get.call(this);
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

//hack tabContainer
{
	const {
		_updateCloseButtons, _handleTabSelect, uiDensityChanged,
	} = tabContainer;

	if (!("overflowing" in tabContainer))
		Object.defineProperty(tabContainer, "overflowing", {
			get: function() {return this.hasAttribute("overflow")},
			configurable: true,
		});

	//clear the cache in case the script is loaded with delay
	tabContainer._pinnedTabsLayoutCache = null;

	arrowScrollbox.before(
		...["pre-tabs", "post-tabs", "new-tab-button"].map(n =>
			tabContainer["_placeholder" + n.replace(/(?:^|-)(\w)/g, (m, w) => w.toUpperCase())] =
				Object.assign(document.createXULElement("hbox"), {
					id: "tabs-placeholder-" + n,
					className: "tabs-placeholder",
				})
		)
	);
	//sometimes double clicking on the spaces doesn't perform the window maximizing/restoring, don't know why
	$$(".titlebar-spacer, .tabs-placeholder").forEach(ele => ele.addEventListener("dblclick", ondblclick, true));
	function ondblclick(e) {
		if (e.buttons) return;
		/* global windowState, STATE_MAXIMIZED, STATE_NORMAL, restore, maximize */
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
				appendChild: function(node) {
					return arrowScrollbox.insertBefore(node, [...arrowScrollbox.children].find(t => !t.pinned));
				},
				insertBefore: function(node, child) {
					return child
						? arrowScrollbox.insertBefore(node, child)
						: this.appendChild(node);
				},
				contains: function(node) {
					return isCalledBy("on_drop")
						? (
							prefs.disableDragToPinOrUnpin
								? false
								: !!node?.closest("#tabbrowser-arrowscrollbox .tabbrowser-tab[pinned]")
						)
						: contains.apply(this, arguments);
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
					return isCalledBy("on_drop", "scrollIntoView")
						? (
							prefs.disableDragToPinOrUnpin
								? false
								: !!node?.closest("#tabbrowser-arrowscrollbox :is(tab-group, .tabbrowser-tab:not([pinned]))")
						)
						: contains.apply(this, arguments);
				},
			});
		}
	}

	//workaround with bug #1994643
	{
		tabContainer.addEventListener("TabGroupLabelHoverStart", function(e) {
			let {group} = e.target;
			if (!group.collapsed || !this._showTabGroupHoverPreview)
				return;

			let opener = this.previewPanel.panelOpener;
			group._ensurePreviewTimeout = setTimeout(() => {
				if (
					group.hasAttribute("previewpanelactive") ||
					this.hasAttribute("movingtab") ||
					!group.collapsed
				)
					return;

				opener.setZeroDelay();
				if (this.showTabGroupPreview)
					this.showTabGroupPreview(group);
				else
					this.on_TabGroupLabelHoverStart(e);
				delete group._ensurePreviewTimeout;
			}, opener._prefPreviewDelay ?? this.previewPanel._prefPreviewDelay);
		});

		tabContainer.addEventListener("TabGroupLabelHoverEnd", function(e) {
			let {group} = e.target;
			clearTimeout(group._ensurePreviewTimeout);
			delete group._ensurePreviewTimeout;
		});
	}

	//the original function modifies --tab-overflow-pinned-tabs-width and cause undesired size changing of the slot,
	//which will cause weird bouncing of the scroll position,
	//plus the positioning is not the same logic, thus rewrite it and not wrap it.
	tabContainer._positionPinnedTabs = function(numPinned = gBrowser.pinnedTabCount) {
		if (
			this._hasTabTempMaxWidth || !numPinned && !this._lastNumPinned ||
			//it seems this checking is no necessary anymore but there's no harm to keep it
			appVersion < 132 && isCalledBy("_initializeArrowScrollbox/<")
		)
			return;

		if (prefs.inlinePinnedTabs) {
			let pinnedTabs = gBrowser.visibleTabs.slice(0, numPinned);
			let positioned = false;

			if (numPinned) {
				let overflowing = !!scrollbox.scrollTopMax;
				let maxRows = maxTabRows();

				if (overflowing && maxRows > 1) {
					let tabWidth = getRect(pinnedTabs[0]).width;
					let slotWidth = getRect(slot, {box: "content"}).width;
					let {preTabsItemsSize = 0, postTabsItemsSize = 0, tabsStartSeparator = 0} = lastLayoutData || {};
					let firstRowCount = Math.floor((slotWidth - preTabsItemsSize - postTabsItemsSize - tabsStartSeparator) / tabWidth);
					let otherRowsCount = Math.floor(slotWidth / tabWidth);
					if (firstRowCount + otherRowsCount * (maxRows - 1) >= numPinned) {
						pinnedTabs.slice(0, firstRowCount).forEach((t, i) =>
							assign(t.style, {
								marginTop: 0,
								marginInlineStart: preTabsItemsSize + tabsStartSeparator + i * tabWidth + "px",
							})
						);
						pinnedTabs.slice(firstRowCount).forEach((t, i) =>
							assign(t.style, {
								marginTop: (0 | i / otherRowsCount + 1) * tabHeight + "px",
								marginInlineStart: i % otherRowsCount * tabWidth + "px",
							})
						);
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
			console?.trace();

			console?.time("_positionPinnedTabs - calculation");

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
			//not using arrowScrollbox.overflowing in case it is not updated in time
			let overflowing = !!scrollbox.scrollTopMax;
			let {_lastScrollTop} = scrollbox;
			let floatPinnedTabs =
				numPinned && tabs.length > numPinned && overflowing &&
				!prefs.autoCollapse && !prefs.pinnedTabsFlexWidth;
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
					columns = Math.ceil(
						numPinned <= spacers * (rows - 1)
							? numPinned / (rows - 1)
							: (numPinned + spacers) / rows
					);
					if (tabsUnderControlButtons == 2)
						spacers = Math.min(columns, spacers);
				} else {
					columns = numPinned;
					spacers = 0;
				}
				let boxWidth = getRect(this, {box: "padding"}).width;
				floatPinnedTabs = pointDelta(
					(
						columns * width + gap + tabMinWidth + this.newTabButton.clientWidth
						+ getRect(this._placeholderPostTabs, {box: "content", checkVisibility: true}).width
						+ scrollbox.scrollbarWidth
					),
					boxWidth,
				) <= 0;
				wrapPlaceholder = floatPinnedTabs && pointDelta(columns * width + gap, preTabsItemsSize) >= 0;
			}

			console?.timeEnd("_positionPinnedTabs - calculation");

			console?.time("_positionPinnedTabs - update");

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
					let slotRect = getRect(slot, {box: "content"});
					//case 1:
					//tabContainer clientWidth 909, 2 pinned tabs, no new tab button, tUCB 0
					//case 2:
					//outerWidth 1306, 3 buttons pre tabs, 1 button post tabs,
					//--pre-tabs-items-width: 160px; --post-tabs-items-width: 218px;
					//2 pinned tabs, total 61 tabs, no new tab button, tUCB 2
					if (pointDelta(lastTabRect.bottom, slotRect.bottom) < 0) {
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
							slotRect.width - lastRowSize + 1,
						);
						assign(this.style, {"--forced-overflow-adjustment": adj + "px"});
						arrowScrollbox.instantScroll(_lastScrollTop);
						console?.warn("positionpinnedtabs causes underflow!", {
							numPinned, adjacentNewTab, maxRows, lastRowSize,
							outerWidth, adj, lastLayoutData,
						});
					}
				}

				slot.style.minHeight = "";

				pinnedTabs.forEach((tab, i) => {
					i += spacers + Math.max(columns - numPinned, 0);
					assign(tab.style, {
						insetInlineStart: i % columns * width + "px",
						top: Math.floor(i / columns) * tabHeight + "px",
					});
				});

				console?.log(`_positionPinnedTabs`, true, {
					isPositioned, columns, spacers, numPinned, overflowing, overflowAttr: this.hasAttribute("overflow")
				});
			} else if (isPositioned || forcedOverflow) {
				console?.log(`_positionPinnedTabs: false, overflowing: ${overflowing}, overflowAttr: ${this.hasAttribute("overflow")}`);

				for (let tab of pinnedTabs)
					assign(tab.style, {top: "", insetInlineStart: ""});
				this.style.removeProperty("--tab-overflow-pinned-tabs-width");

				if (!overflowing && scrollbox.scrollTopMax) {
					console?.warn("un-positionpinnedtabs cause overflow!");
					queueMicrotask(() => scrollbox.dispatchEvent(new Event("overflow")));
				}
			}

			console?.timeEnd("_positionPinnedTabs - update");
		}
	};

	//remove the position when unpinned, as the modified _positionPinnedTabs does not handle the normal tabs,
	//which are handled in the original function.
	//the rest of clean up is done by gBrowser.unpinTab()
	tabContainer.addEventListener("TabUnpinned", e => assign(e.target.style, {top: "", insetInlineStart: ""}));

	//mark down the position information first in case the tab is moved away before the dragover kicks off,
	//e.g. scrollIntoView
	//TODO: test on touch device
	{
		let up = function(e) {
			if (e.button) return;
			if (this._lastMouseDownData) {
				delete this._lastMouseDownData;
				/*
				  in a rare case the tabContainer bounces when opening a tab group,
				  however it can only be reproduced in a very specific situation but seems random.
				  wrapping it with rAF seems help but can't verify.
				*/
				rAF().then(() => this._hideFakeScrollbar());
			}
			removeEventListener("mouseup", up, true);
		}.bind(tabContainer);

		tabContainer.addEventListener("mousedown", function(e) {
			let tab;
			if (e.button || !(tab = this.tabDragAndDrop._getDragTargetTab(e)))
				return;
			this._lastMouseDownData = this.tabDragAndDrop.createMouseDownData(e, tab);
			this._showFakeScrollbar();
			//the registered listeners won't be removed when dragend but doing a normal click
			addEventListener("mouseup", up, true);
		}, true);
	}

	tabContainer._showFakeScrollbar = function() {
		let slotHeight = getRect(slot).height;
		this.setAttribute("tabmousedown", "");
		fakeScrollbar.style.setProperty("--slot-height", slotHeight + "px");
		fakeScrollbar.scrollTop = scrollbox.scrollTop;
	};

	/*
	  there is a critical point that overflow w/ scrollbar but underflow w/o scrollbar:
	  --pre-tabs-items-width: 136.75px; (zoom control, no pre tabs space)
	  --post-tabs-items-width: 298px; (3 buttons)
	  --tabs-scrollbar-visual-width: 8px;
	  outerWidth=881, 3 rows, 1 unnamed group on 2nd row and 2 on 3rd row.
	  add a tab to overflow, there will be 2 tabs on the 4th row.
	  close the last tab w/ mouse will cause wierd ani, click on any tab cause underflow.
	  currently lock slot when hidding the fake bar to prevent.
	  it is necessary to not using instant to let it reflows once.
	*/
	tabContainer._hideFakeScrollbar = function() {
		let {overflowing} = this;
		if (overflowing)
			this.lockSlotSize();
		fakeScrollbar.style.removeProperty("--slot-height");
		this.removeAttribute("tabmousedown");
		if (overflowing && !this._hasTabTempMaxWidth)
			this.unlockSlotSize();
	};

	tabContainer._refreshAllGroups = async function() {
		let groups = gBrowser.tabGroups;
		if (groups)
			await Promise.all(groups.map(g => g.refreshState()));
	};

	//replace the original function with modified one
	tabContainer._notifyBackgroundTab = function(tab) {
		if (
			tab.pinned && this.hasAttribute("positionpinnedtabs") ||
			!(tab.visible ?? !tab.hidden) ||
			!this.overflowing
		)
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

	let _closeButtonsUpdatePending;
	tabContainer._updateCloseButtons = function() {
		if (!animatingLayout && !_closeButtonsUpdatePending && !isCalledBy("handleResize")) {
			_closeButtonsUpdatePending = true;
			rAF(2).then(() => {
				console?.time("_updateCloseButtons");
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
				_closeButtonsUpdatePending = false;
				console?.timeEnd("_updateCloseButtons");
			});
		}
		_updateCloseButtons.apply(this, arguments);
	};
	tabContainer.addEventListener("TabMove", function() {
		if (!this.hasAttribute("movingtab") && !this.hasAttribute("dragging"))
			this._refreshAllGroups();
	}, true);

	let placeholderStyle = document.body.appendChild(document.createElement("style"));
	let lastLayoutData = null;

	tabContainer._updateInlinePlaceHolder = function(numPinned = gBrowser.pinnedTabCount) {
		if (animatingLayout?.shouldUpdatePlacholder)
			return;

		if (!tabMinWidth) {
			this.uiDensityChanged();
			//uiDensityChanged will call _updateInlinePlaceHolder thus return now
			return;
		}

		console?.time("_updateInlinePlaceHolder");

		//ensure the elementIndex is set for all tabs
		let nodes = getNodes();
		if (!nodes[0]) {
			console?.timeEnd("_updateInlinePlaceHolder");
			return;
		}

		let isFirst = true;
		// eslint-disable-next-line no-cond-assign
		for (let prv = this; prv = prv.previousSibling;)
			if (prv.checkVisibility({
				checkVisibilityCSS: true,
				contentVisibilityAuto: true,
			})) {
				isFirst = false;
				break;
			}

		//not using this.overflowing in case it is not updated in time
		let overflowing = !!scrollbox.scrollTopMax;
		let onlyUnderflow = prefs.tabsUnderControlButtons < 2;

		tabsBar.toggleAttribute("tabs-is-first-visible", isFirst);

		if (
			overflowing && onlyUnderflow ||
			innerWidth < prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery ||
			this._isCustomizing ||
			!prefs.tabsUnderControlButtons
		) {
			if (lastLayoutData) {
				placeholderStyle.innerHTML = "";
				tabsBar.style.removeProperty("--pre-tabs-items-width");
				tabsBar.style.removeProperty("--post-tabs-items-width");
				tabsBar.removeAttribute("has-items-pre-tabs");
				tabsBar.removeAttribute("has-items-post-tabs");
				lastLayoutData = null;
			}
			console?.timeEnd("_updateInlinePlaceHolder");
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

		console?.timeLog("_updateInlinePlaceHolder", "update pre/post tabs items width");

		if (!this.hasAttribute("movingtab") || this.hasAttribute("moving-positioned-tab"))
			this._positionPinnedTabs(numPinned);

		let adjacentNewTab = !overflowing && this.hasAttribute("hasadjacentnewtabbutton");
		let positionPinned = this.hasAttribute("positionpinnedtabs");
		let winWidth = winRect.width;
		let winMaxWidth = Math.max(screen.width - screen.left + 8, winWidth + tabMinWidth);
		let winMinWidth = parseInt(getComputedStyle(root).minWidth);
		let firstUnpinned = nodes[numPinned];
		let pinnedWidth = numPinned && !positionPinned
			? (
				prefs.pinnedTabsFlexWidth
					? tabMinWidth
					: getRect(nodes[0]).width
			)
			: 0;
		let firstStaticWidth = pinnedWidth || (isTab(firstUnpinned) ? tabMinWidth : getRect(firstUnpinned).width);
		let pinnedGap = prefs.gapAfterPinned;
		let pinnedReservedWidth = positionPinned
			? parseFloat(this.style.getPropertyValue("--tab-overflow-pinned-tabs-width")) + pinnedGap
			: 0;

		let inlinePreTabCS = getComputedStyle(slot, "::before");

		let tabsStartSeparator =
			Math.round(parseFloat(inlinePreTabCS.marginInlineEnd)
			+ parseFloat(inlinePreTabCS.borderInlineEndWidth)
			+ parseFloat(inlinePreTabCS.paddingInlineEnd));

		let base = Math.max(preTabsItemsSize + tabsStartSeparator, pinnedReservedWidth) + postTabsItemsSize;

		console?.timeLog("_updateInlinePlaceHolder", "gather all info");

		console?.trace();

		lastLayoutData = {
			preTabsItemsSize, postTabsItemsSize, tabsStartSeparator, base, firstStaticWidth, scrollbarWidth,
			adjacentNewTab, newTabButtonWidth, pinnedWidth, numPinned, winMinWidth, winMaxWidth, tabMinWidth,
		};

		onlyUnderflow = onlyUnderflow ? ":not([overflow])" : "";

		const decimals = -Math.log10(EPSILON);
		let css = [`
			@media (max-width: ${fixed(base + firstStaticWidth + (adjacentNewTab ? newTabButtonWidth : 0) - EPSILON)}px) {
				${prefs.floatingBackdropClip ? `
					#tabbrowser-tabs${onlyUnderflow} {
						--top-placeholder-clip:
							${START_PC} var(--tab-height),
							calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR}) var(--tab-height);
					}
				` : ``}
				#TabsToolbar:not([tabs-hide-placeholder]) #tabbrowser-tabs[multirows]${onlyUnderflow}
					#tabbrowser-arrowscrollbox::part(items-wrapper)::before
				{
					width: calc(100% - var(--tabstrip-separator-size)) !important;
					margin-inline-end: 0;
					border-inline-end-width: 0;
					border-end-end-radius: 0;
					padding-inline-end: var(--tabstrip-separator-size);
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
				#tabbrowser-tabs[multirows]${onlyUnderflow} #tabbrowser-arrowscrollbox::part(items-wrapper)::after {
					visibility: collapse;
				}
				#tabbrowser-tabs${onlyUnderflow} #tabbrowser-arrowscrollbox
					:is(
						.tabbrowser-tab,
						.tab-group-label-container,
						.tab-group-overflow-count-container,
						#tabbrowser-arrowscrollbox-periphery
					)
				{
					order: 2;
				}
			}
		`];

		if ("elementIndex" in tabProto) {
			let lastIdx = nodes.at(-1).getAttribute("elementIndex");
			let prvIdx;
			for (
				let i = positionPinned ? numPinned : 0;
				pointDelta(base, winMaxWidth) <= 0 && i < nodes.length;
				i++
			) {
				let node = nodes[i];
				let idx = node.getAttribute("elementIndex");
				let width = isTab(node)
					? (
						i < numPinned && !prefs.pinnedTabsFlexWidth
							? pinnedWidth
							: parseFloat(node.style.maxWidth) || tabMinWidth
					)
					: getRect(node).width;

				console?.debug("node width", width, node, idx);

				if (!i)
					base += width + (numPinned == 1 ? pinnedGap : 0);
				else {
					let nodeSelector = `:is(
						:not([collapsed]) > .tabbrowser-tab:not([closing], [hidden]),
						.tab-group-label-container,
						[collapsed][hasactivetab] > .tabbrowser-tab[selected],
						[collapsed][hasactivetab][hasmultipletabs] > .tab-group-overflow-count-container
					)`;
					css.push(`
						@media (min-width: ${fixed(base)}px) and (max-width: ${fixed((base += width) - EPSILON)}px) {
							#tabbrowser-tabs:not(:not([multirows])[ignore-newtab-width])
							${i < numPinned ? "" : nodeSelector}[elementIndex="${prvIdx ?? idx - 1}"] {
								--line-overlap-length: 0px;

								& ~ :not(tab-group[collapsed] > .tabbrowser-tab:not([selected])),
								tab-group:has(> &) ~ * {
									&, tab-group& > * {
										order: 2;
									}
								}
							}
						}
					`);

					if (i == numPinned - 1 && idx != lastIdx)
						css.push(`
							@media (min-width: ${fixed(base)}px) and (max-width: ${fixed((base += pinnedGap) - EPSILON)}px) {
								.tabbrowser-tab:nth-last-child(1 of [pinned]:not([hidden])) {
									--gap-after-pinned: 0px;
								}
								.tabbrowser-tab ~ :not([pinned]) {
									&, tab-group& > * {
										order: 2;
									}
								}
							}
						`);

					if (adjacentNewTab && idx == lastIdx)
						css.push(`
							@media (min-width: ${fixed(base)}px) and (max-width: ${fixed(base + newTabButtonWidth - EPSILON)}px) {
								#tabbrowser-tabs:not([ignore-newtab-width]) ${nodeSelector}[elementIndex="${prvIdx ?? idx - 1}"] {
									--line-overlap-length: 0px;

									& ~ :not(tab-group[collapsed] > .tabbrowser-tab:not([selected])),
									tab-group:has(> &) ~ * {
										&, tab-group& > * {
											order: 2;
										}
									}
								}
							}
						`);
				}

				prvIdx = idx;
			}
		} else {
			if (adjacentNewTab)
				css.push(`
					@media (max-width: ${fixed(base + firstStaticWidth + newTabButtonWidth - EPSILON)}px) {
						.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])),
						.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])) ~ * {
							order: 2;
						}
					}
				`);
			if (pinnedWidth) {
				base += pinnedWidth;

				//wrap pinned tabs
				for (let i = 1; i < numPinned; i++) {
					let min = base, max = (base += pinnedWidth) - EPSILON;
					if (pointDelta(max, winMinWidth) >= 0)
						css.push(`
							@media (min-width: ${fixed(min)}px) and (max-width: ${fixed(max)}px) {
								#tabbrowser-tabs:not(:not([multirows])[ignore-newtab-width])
								.tabbrowser-tab:nth-child(${i} of :not([hidden])):not(:nth-last-child(1 of .tabbrowser-tab:not([hidden]))) ~ * {
									order: 2;
								}
							}
						`);
				}
				//remove the gap after pinned to prevent the last pinned being wrapped, and force all non-pinned to wrap
				css.push(`
					@media (min-width: ${fixed(base)}px) and (max-width: ${fixed(base + pinnedGap - EPSILON)}px) {
						.tabbrowser-tab:nth-last-child(1 of [pinned]:not([hidden])) {
							--gap-after-pinned: 0px;
						}
						.tabbrowser-tab[pinned] ~ :not([pinned]) {
							order: 2;
						}
					}
				`);
				//wrap the last pinned tab adjacent with new tab
				if (adjacentNewTab)
					css.push(`
						@media (min-width: ${fixed(base)}px) and (max-width: ${fixed(base + newTabButtonWidth - EPSILON)}px) {
							.tabbrowser-tab[pinned]:nth-last-child(2 of .tabbrowser-tab:not([hidden])) ~ * {
								order: 2;
							}
						}
					`);
				base += pinnedGap;
			}

			for (let i = 0; pointDelta(base, winMaxWidth) <= 0; i++) {
				if (!i && !numPinned) {
					base += tabMinWidth;
					continue;
				}

				//wrap normal tabs
				css.push(`
					@media (min-width: ${fixed(base)}px) and (max-width: ${fixed((base += tabMinWidth) - EPSILON)}px) {
						#tabbrowser-tabs:not(:not([multirows])[ignore-newtab-width])
						.tabbrowser-tab:nth-child(
							${numPinned + i} of :not([hidden], [closing])
						):not(:nth-last-child(1 of tab:not([hidden], [closing]))) ~ * {
							order: 2;
						}
					}
				`);
				//wrap the last normal tab adjacent with new tab
				if (adjacentNewTab && pointDelta(base, winMaxWidth) <= 0)
					css.push(`
						@media (min-width: ${fixed(base)}px) and (max-width: ${fixed(base + newTabButtonWidth - EPSILON)}px) {
							.tabbrowser-tab:nth-child(
								${numPinned + i} of :not([hidden], [closing])
							):nth-last-child(2 of tab:not([hidden], [closing])) ~ * {
								order: 2;
							}
						}
					`);
			}
		}

		css = css.join("");
		console?.debug(css);
		if (placeholderStyle.innerHTML != css)
			placeholderStyle.innerHTML = css;

		console?.timeEnd("_updateInlinePlaceHolder");

		/** @param {number} num */
		function fixed(num) {
			return +num.toFixed(decimals);
		}
	};

	for (let n of [
		"TabOpen", "TabClose",
		"TabHide", "TabShow",
		"TabGroupCreate",
		"TabGroupExpand", "TabGroupCollapse",
		"TabPinned", "TabUnpinned",
	])
		tabContainer.addEventListener(n, updateElementIndex);

	tabContainer.addEventListener("TabGroupUpdate", function(e) {
		this.removeAttribute("forced-overflow");
		assign(this.style, {"--forced-overflow-adjustment": ""});
		this._updateInlinePlaceHolder();
		this._unlockTabSizing({instant: true});
		gBrowser.tabGroupMenu.panel.hasAttribute("panelopen") && e.target.labelElement.scrollIntoView();
	});

	if (groupProto && "hasActiveTab" in groupProto)
		tabContainer.addEventListener("TabSelect", function(e) {
			let {target} = e;
			let {previousTab} = e.detail;
			let pGroup = previousTab.group;
			let tGroup = target.group;
			if (
				pGroup?.collapsed && pGroup.hasActiveTab ||
				tGroup?.collapsed && !tGroup.hasActiveTab
			) {
				select(previousTab, target);
				if (animatingLayout) {
					/*it doesn't look that better to perform a animation if the duration is short*/
					/*it is acceptable to have no animation for the tab in closed group*/
					// if (isCalledBy("removeTab") &&
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
						//wait for the hasActiveTab update
						await 0;
					}, {
						//bypassing the cache since the elementIndex is dirty at this moment
						//and needs to keep dirty, otherwise the inline placeholder will be wrong positioned
						nodes: [...new Set([
							...getNodes({newTabButton: true, bypassCache: true, includeClosing: true}),
							target,
							previousTab,
						])],
					});

				/**
				 * @param {MozTabbrowserTab} to
				 * @param {MozTabbrowserTab} from
				 */
				function select(to, from) {
					for (let [t, v] of [[from, false], [to, true]])
						for (let a of ["visuallyselected", "selected"])
							t[v ? "setAttribute" : "removeAttribute"](a, v);
				}
			}
		});

	/** @this {MozTabbrowserTabs} */
	function updateElementIndex() {
		if (animatingLayout)
			return;
		this._invalidateCachedTabs();
		this.removeAttribute("forced-overflow");
		assign(this.style, {"--forced-overflow-adjustment": ""});

		//2 rAFs are required when adding tab and underflow -> overflow
		rAF(2).then(() => this._updateInlinePlaceHolder());
	}

	tabContainer._handleTabSelect = function() {
		if (
			arrowScrollbox._isScrolling ||
			this.hasAttribute("movingtab") ||
			this.hasAttribute("dragging") ||
			//it's so stupid that there is a resize listener added but it does not check the event target
			//it causes _handleTabSelect to be called unexpectedly whenever a browser view resizes
			isCalledBy("handleResize")
		)
			return;

		console?.trace();
		_handleTabSelect.apply(this, arguments);
	};

	tabContainer._lockTabSizing = function(actionNode) {
		//stop the original startTabDrag from locking the tabs when dragging a open tab group
		//currently only startTabDrag call this without parameter
		if (!actionNode || gBrowser[CLOSING_THE_ONLY_TAB] || isSlotJustifyCenter())
			return;

		console?.time("_lockTabSizing");

		let nodes = getNodes({
			pinned: prefs.pinnedTabsFlexWidth && null,
			//be careful don't touch the ariaFocusableItems since it will update the elementIndex attribute when closing tab
			//and there will be two nodes with the same number, one is the closing tab and the other is the following node,
			//placeholder will be freaked out in this case
			bypassCache: "ariaFocusableItems" in this && isCalledBy("removeTab"),
		});
		let lock = false;

		if (nodes[0]) {
			let collapsingGroup = !isTab(actionNode) && actionNode.group;
			let overflowContainer;
			if (collapsingGroup) {
				let {hasActiveTab} = collapsingGroup;
				actionNode = collapsingGroup.labelContainerElement;
				//include the active tab and the overflow container, which will display later
				nodes = nodes.filter(n => !collapsingGroup.tabs.includes(n) || hasActiveTab && n.selected);
				if (hasActiveTab) {
					let {selectedTab} = gBrowser;
					if (selectedTab.group == collapsingGroup && collapsingGroup.hasAttribute("hasmultipletabs")) {
						({overflowContainer} = collapsingGroup);
						//set at absolute to not interrupt the layout
						assign(overflowContainer.style, {display: "flex", position: "absolute"});
						nodes.splice(nodes.indexOf(selectedTab) + 1, 0, overflowContainer);
					}
				}
			}

			let lastNode = nodes.at(-1);
			let actionNodeRect = getRect(actionNode);
			//dont use tab.elementIndex since it will access ariaFocusableItems
			//getAttribute() is "" on fx 115 so use || instead of ??
			let closingLastTab =
				!collapsingGroup &&
				(
					+(actionNode.getAttribute("elementIndex") || actionNode._tPos) >
					+(lastNode.getAttribute("elementIndex") || lastNode._tPos)
				);

			if (closingLastTab) {
				if (
					pointDelta(getRect(lastNode).y, actionNodeRect.y) < 0 ||
					actionNode.group?.collapsed
				) {
					this._clearSpacer();
					this.removeAttribute("ignore-newtab-width");

					if (this.overflowing) {
						this.lockSlotSize();
						lock = true;
					}
				} else {
					let slotRect = getRect(slot, {box: "content"});
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
					if (node == actionNode && !collapsingGroup || node == overflowContainer)
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

				//calculate whether tabs will fit in the last row after unlocking, ignore the new tab when yes.
				//no need to do this when moving tab, since _lockTabSizing is only called by temp-collapsing
				//a group when moving tab, the locked state is temporary thus don't bother.
				if (this.hasAttribute("hasadjacentnewtabbutton") && !this.hasAttribute("movingtab")) {
					let slotR = getRect(slot, {box: "content"});
					let rowWidth = pointDeltaH(slotR.end, rowStartPos);
					if (actionNodeRect.y + scrollbox.scrollTop == slotR.y)
						rowWidth -= lastLayoutData?.postTabsItemsSize ?? 0;
					let totalMinWidth = 0, totalVisualWidth = 0, lastNodeWidth;
					let hasPinned, hasNonPinned;
					for (let node of nodes.slice(rowStartIndex)) {
						let {width} = getRect(node);
						totalMinWidth += isTab(node) ? tabMinWidth : width;
						totalVisualWidth += width;
						if (node == lastNode)
							lastNodeWidth = width;
						if (node.pinned)
							hasPinned = true;
						else
							hasNonPinned = true;
					}
					if (hasPinned && hasNonPinned) {
						let gap = prefs.gapAfterPinned;
						totalMinWidth += gap;
						totalVisualWidth += gap;
					}

					let canFitIn = pointDelta(totalMinWidth + newTabButtonWidth, rowWidth) <= 0;
					if (canFitIn && isTab(firstNodeInNextRow) && firstNodeInNextRow == lastNode) {
						let width = collapsingGroup
							? currentRow.entries().find(([n]) => isTab(n))?.[1]
							: actionNodeRect.width;
						if (width) {
							//as the width of tab with audio-button is restricted to the same with normal tab,
							//here is safe to assume the width upcoming last tab in row.
							currentRow.set(firstNodeInNextRow, width);
							totalVisualWidth += width - lastNodeWidth;
						}
					}

					let visuallyNotFitIn = pointDelta(totalVisualWidth + newTabButtonWidth, rowWidth) > 0;
					this.toggleAttribute("ignore-newtab-width", canFitIn && visuallyNotFitIn);
				}

				for (let node of (collapsingGroup ? nodes.slice(0, nodes.indexOf(actionNode) + 1) : nodes))
					if (node != actionNode || node == collapsingGroup?.labelContainerElement) {
						let width = currentRow.get(node);
						node.style.minWidth = node.style.maxWidth = width ? width + "px" : "";
					}

				let movingTab = this.hasAttribute("movingtab");
				if (collapsingGroup && movingTab || this.overflowing)
					this.lockSlotSize();

				assign(overflowContainer?.style, {display: "", position: ""});

				this._clearSpacer();
				lock = true;
			}
		} else
			this._clearSpacer();

		if (lock) {
			gBrowser.addEventListener("mousemove", this);
			addEventListener("mouseout", this);
		}
		this._hasTabTempMaxWidth = lock;

		console?.timeEnd("_lockTabSizing");
	};

	tabContainer._clearSpacer = function() {
		this.removeAttribute("using-closing-tabs-spacer");
		this._closingTabsSpacer.style.width = "";
	};

	tabContainer.lockSlotSize = function() {
		let {style} = arrowScrollbox;
		let rect = getRect(slot);
		for (let p of ["width", "height"])
			style.setProperty(`--slot-${p}`, rect[p] + "px");
	};

	tabContainer._unlockTabSizing = async function({instant, unlockSlot = true} = {}) {
		if (
			isCalledBy("([_#]expandGroupOnDrop|on_TabGroupCollapse)") ||
			this._keepTabSizeLocked
		)
			return;

		console?.trace();

		if (unlockSlot) {
			console?.time("_unlockTabSizing - general");

			//the slot can only shrink in height so only handle underflowing
			if (!instant && this.overflowing) {
				slot.style.minWidth = slot.style.maxWidth =
					arrowScrollbox.style.getPropertyValue("--slot-width") || getRect(slot).width + "px";
				scrollbox.style.setProperty("overflow-y", "scroll", "important");
				this.style.setProperty("--tabs-scrollbar-width", scrollbarWidth + "px");
			}
			gBrowser.removeEventListener("mousemove", this);
			removeEventListener("mouseout", this);

			console?.timeEnd("_unlockTabSizing - general");

			await this.unlockSlotSize(instant);
		}

		await animateLayout(async () => {
			if (this._hasTabTempMaxWidth) {
				for (let node of getNodes({pinned: prefs.pinnedTabsFlexWidth && null}))
					node.style.maxWidth = node.style.minWidth = "";
				delete this._hasTabTempMaxWidth;
			}

			this.removeAttribute("ignore-newtab-width");
			this.removeAttribute("using-closing-tabs-spacer");
			this._closingTabsSpacer.style.width = "";

			if (unlockSlot) {
				slot.style.minWidth = slot.style.maxWidth = "";
				scrollbox.style.overflowY = "";
				this.style.removeProperty("--tabs-scrollbar-width");
			}
		}, {animate: !instant && this._hasTabTempMaxWidth});
	};

	tabContainer.unlockSlotSize = async function(instant) {
		instant ||= !this.overflowing;

		let oldHeight;
		if (!instant)
			oldHeight = slot.clientHeight - scrollbox.scrollTopMax + scrollbox.scrollTop;

		assign(arrowScrollbox.style, {"--slot-height": "", "--slot-width": ""});

		if (instant) return;

		let delta = pointDelta(oldHeight, slot.clientHeight);
		if (delta <= 0) return;

		assign(slot.style, {
			transition: "none !important",
			paddingBottom: delta + "px",
		});
		arrowScrollbox.instantScroll(scrollbox.scrollTop + delta);

		await rAF();

		assign(slot.style, {transition: "", paddingBottom: ""});
		await waitForTransition(slot, "padding-bottom");
	};

	tabContainer.uiDensityChanged = function() {
		uiDensityChanged.apply(this, arguments);

		console?.time("uiDensityChanged");

		let {newTabButton} = this;
		newTabButton.style.setProperty("display", "flex", "important");
		newTabButtonWidth = getRect(newTabButton).width;
		newTabButton.style.display = "";

		assign(root.style, {"--tab-height": ""});
		root.style.setProperty("--tab-height", (tabHeight = +getRect(gBrowser.selectedTab).height.toFixed(4)) + "px");
		tabsBar.style.setProperty("--new-tab-button-width", newTabButtonWidth + "px");

		let minWidthPref = this._tabMinWidthPref;
		let extraWidth = root.getAttribute("uidensity") == "touch"
			? (appVersion > 136 ? 10 : Math.max(86 - minWidthPref, 0))
			: 0;
		this.style.setProperty("--calculated-tab-min-width", (tabMinWidth = minWidthPref + extraWidth) + "px");

		console?.timeEnd("uiDensityChanged");

		updateNavToolboxNetHeight();
		this._updateInlinePlaceHolder();
	};

	assign(tabContainer, {animateLayout});
}

//auto collapse
{
	for (let e of ["transitionstart", "transitionend"])
		tabContainer.addEventListener(e, onTransition);

	/**
	 * @param {Event} e
	 * @this {MozTabbrowserTabs.arrowScrollbox.scrollbox}
	 */
	function onScrollend(e) {
		if (e.target != this || this.scrollTop > (tabContainer._scrollRows - 1) * tabHeight)
			return;
		assign(tabContainer.style, {"--temp-open-padding": ""});
		this.removeEventListener("scrollend", onScrollend);
	}

	let shownPopups = new Set();

	/**
	 * @param {Event} e
	 * @this {ChromeWindow}
	 */
	function setPopupOpen(e) {
		if (e.target?.matches?.("menupopup, panel:not(#tab-preview-panel)")) {
			shownPopups[e.type =="popupshown" ? "add" : "delete"](e.target);
			tabContainer.toggleAttribute("has-popup-open", shownPopups.size);
		}
	}

	/**
	 * @param {Event} e
	 * @this {MozTabbrowserTabs}
	 */
	function onTransition(e) {
		let start = e.type == "transitionstart";
		if (
			prefs.autoCollapse && e.target == this && e.pseudoElement == "" &&
			e.propertyName == "margin-bottom"
		) {
			let showing = this.matches(TEMP_SHOW_CONDITIONS);
			this.toggleAttribute("animating-collapse", start);
			if (start == showing) {
				let urlBar = $("#urlbar");
				if (urlBar.hasAttribute("popover"))
					urlBar[(start ? "hide" : "show") + "Popover"]();
				this.toggleAttribute("has-temp-scrollbar", showing && getRowCount(true) <= maxTabRows());
				this.toggleAttribute("temp-open", showing);

				for (let n of ["popupshown", "popuphidden"])
					(showing ? addEventListener : removeEventListener)(n, setPopupOpen, true);

				if (prefs.autoCollapseCurrentRowStaysTop) {
					if (start) {
						let scroll = this._scrollRows * tabHeight - slot.clientHeight + scrollbox.scrollTop;
						if (scroll) {
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

{
	if (!("pinnedTabCount" in gBrowser))
		Object.defineProperty(gBrowser, "pinnedTabCount", {
			get: function() {return this._numPinnedTabs},
			configurable: true,
		});

	let {
		addTab, removeTab, pinTab, unpinTab, pinMultiSelectedTabs,
		_updateTabBarForPinnedTabs, createTabsForSessionRestore, addTabGroup,
		replaceTabsWithWindow, replaceGroupWithWindow,
	} = gBrowser;

	gBrowser.addTab = function(uri, o) {
		let tab;
		try {
			animateLayout(
				() => (tab = addTab.call(this, uri, assign(o, {skipAnimation: true}))),
				{animate: !o?.skipAnimation},
			);
		} catch(e) {
			window.console.error(e);
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
				tabContainer._updateInlinePlaceHolder();
				//the closing tab is stuck at the row end
				//and need to be translated manually to make it happen at the right place.
				//currently closing multiple tabs is not handled since the tabs are closed from rear to front
				//and it's unable to know if the tab will be placed at the previous row end
				//if all closing tabs become zero width
				if (animatingLayout) {
					let r = animatingLayout.rects.get(tab);
					let newR = getRect(tab);
					let {tabsRect} = animatingLayout;
					let newTabsRect = getRect(tabContainer);
					if (
						pointDelta(r.y - tabsRect.y, newR.y - newTabsRect.y) ||
						getComputedStyle(tab)?.order != oldOrder
					) {
						let wrongStart = newR.start, wrongY = newR.y;
						let {nodes} = animatingLayout;
						let nxtNode = nodes[nodes.indexOf(tab) + 1];
						if (nxtNode)
							newR = getRect(nxtNode);
						else {
							newR = r.clone();
							newR.start += newTabsRect.start - tabsRect.start;
							newR.y += newTabsRect.y - tabsRect.y;
						}
						tab.style.transform = `translate(${newR.start - wrongStart}px, ${newR.y - wrongY}px)`;
						newR.width = 0;
					}
					animatingLayout.newRects.set(tab, newR);
				}
			}, {
				nodes: getNodes({newTabButton: true, includeClosing: true}),
				shouldUpdatePlacholder: false,
			}).then(() => {
				if (!tab.closing)
					return;
				tab.removeAttribute("fadein");
				tab.dispatchEvent(assign(new Event("transitionend", {bubbles: true}), {propertyName: "max-width"}));
				console?.debug("removed", tab);
			});

		delete this[CLOSING_THE_ONLY_TAB];
	};

	gBrowser.pinTab = function(tab) {
		/*global FirefoxViewHandler*/
		if (tab.pinned || tab == FirefoxViewHandler.tab)
			return pinTab.apply(this, arguments);

		let s = tab.style;
		let pinningMultiTabs = isCalledBy("pinMultiSelectedTabs");
		let dropping = isCalledBy("on_drop");
		animateLayout(() => {
			pinTab.apply(this, arguments);
			//pinned tab with a negative margin inline end stack will shrink
			//thus set a min width to prevent
			if (!prefs.pinnedTabsFlexWidth)
				s.minWidth = getRect(tab).width + "px";
		}, {translated: dropping || undefined}).then(() => {
			//here is executed after pinMultiSelectedTabs.apply() if pinning multi tabs
			//the min-width is handled there thus dont bother
			if (!pinningMultiTabs && !dropping)
				s.minWidth = "";
		});
	};

	gBrowser.unpinTab = function(tab) {
		if (isCalledBy("restoreTab"))
			unpinTab.apply(this, arguments);
		else
			animateLayout(() => unpinTab.apply(this, arguments), {
				animate: tab.pinned,
				translated: isCalledBy("on_drop") || undefined,
			});
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

	if (addTabGroup)
		gBrowser.addTabGroup = function() {
			let run = () => addTabGroup.apply(this, arguments);
			if (isCalledBy("on_drop"))
				return run();
			let g;
			animateLayout(() => g = run());
			return g;
		};

	if (replaceGroupWithWindow)
		gBrowser.replaceGroupWithWindow = function(group) {
			let w;
			animateLayout(() => {
				for (let t of group.tabs)
					t.setAttribute("closing", "");
				w = replaceGroupWithWindow.apply(this, arguments);
			});
			//update before the group is actually removed
			group.addEventListener("TabGroupRemoved", () => tabContainer._updateInlinePlaceHolder());
			return w;
		};

	gBrowser.replaceTabsWithWindow = function(contextTab) {
		let w;
		let tabs = contextTab.multiselected ? this.selectedTabs : [contextTab];
		animateLayout(() => {
			w = replaceTabsWithWindow.apply(this, arguments);
			for (let t of tabs) {
				t.setAttribute("fadein", true);
				t.setAttribute("closing", "");
			}
		});
		return w;
	};

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
			window.console.error(e);
		} finally {
			// eslint-disable-next-line no-unsafe-finally
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
	]],
	/*global TabContextMenu*/
	[TabContextMenu, [
		"ungroupTabs",
		["duplicateSelectedTabs", 1],
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
						oldNodes = getNodes({onlyFocusable: true});
					r = func.apply(this, arguments);
					if (oldNodes)
						return getNodes({onlyFocusable: true}).filter(n => !oldNodes.includes(n));
					return r;
				});
				return r;
			};
		else
			console?.warn(`${name} is not found`);
	}

let tabsResizeObserver = new ResizeObserver(() => {
	console?.time("tabContainer ResizeObserver");

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

	//the underflow event isn't always fired, here we refer to the ResizeObserver in the constructor of MozArrowScrollbox
	let {scrollTopMax} = scrollbox;
	if (tabContainer.overflowing != !!scrollTopMax)
		scrollbox.dispatchEvent(new Event(scrollTopMax ? "overflow" : "underflow"));
	else
		rAF().then(() => {
			tabContainer._updateCloseButtons();
			if (prefs.autoCollapse)
				tabContainer._handleTabSelect(true);
		});

	console?.timeEnd("tabContainer ResizeObserver");

	tabContainer._unlockTabSizing({instant: true});
});

for (let box of [tabContainer, slot])
	tabsResizeObserver.observe(box);

$("#toolbar-menubar").addEventListener("toolbarvisibilitychange", updateNavToolboxNetHeight, true);

arrowScrollbox._updateScrollButtonsDisabledState();
if ("hideAllTabs" in prefs)
	toggleAllTabsButton();

observeDPRChange(() => root.style.setProperty("--device-pixel-ratio", devicePixelRatio));

/** @param {{():void}} callback */
function observeDPRChange(callback) {
	matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
		.addEventListener("change", () => observeDPRChange(callback), {once: true});
	callback();
}

/**
 * the original scrollIntoView always scroll to ensure the tab is on the first visible row,
 * for instance, when scrolling the box and the cursor touch the selected tab, will cause an annoying bouncing,
 * fix it to be ensuring the tab is in view, if it already is, do nothing.
 * use getRect() instead of getBoundingClientRect(), since when dragging tab too fast the box will scroll to half row
 * because _handleTabSelect will try to scroll the translated position into view
 * @this {Element}
 * @param {Object} [param0={}]
 * @param {("smooth"|"instant"|"auto")} param0.behavior
 */
function scrollIntoView({behavior} = {}) {
	if (!arrowScrollbox.overflowing || !arrowScrollbox.contains(this))
		return;
	let rect = getRect(this);
	let boxRect = getRect(scrollbox);
	if (!tabsBar.hasAttribute("tabs-hide-placeholder") && tabContainer.overflowing) {
		let preTabs = getRect(tabContainer._placeholderPreTabs, {box: "content", checkVisibility: true});
		let postTabs = getRect(tabContainer._placeholderPostTabs, {box: "content", checkVisibility: true});
		let newTab = getRect(tabContainer._placeholderNewTabButton, {box: "content", checkVisibility: true});
		if (
			!(prefs.hideEmptyPlaceholderWhenScrolling && tabsBar.hasAttribute("tabs-is-first-visible")) &&
			preTabs.width && pointDelta(rect.y, preTabs.bottom) < 0 && pointDeltaH(rect.start, preTabs.end) < 0
		)
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
			console?.warn("scrollend is not fired");
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
	return (
		prefs.justifyCenter == 2 ||
		prefs.justifyCenter == 1 && !tabContainer.matches("[multirows], [overflow]")
	);
}

/** @param {(Element|null)} e */
function isTab(e) {
	return !!(e?.tagName == "tab");
}

/** @param {(Element|null)} e */
function isTabGroupLabel(e) {
	return !!e?.classList?.contains("tab-group-label");
}

/** @param {(Element|null)} e */
function isTabGroupLabelContainer(e) {
	return !!e?.classList?.contains("tab-group-label-container");
}

/**
 * @param {Element} item
 * @returns {Element}
 */
function elementToMove(item) {
	return isTabGroupLabel(item) ? item.group.labelContainerElement : item;
}

/**
 * @param {Object} [param0]
 * @param {boolean} [param0.pinned]
 * @param {boolean} [param0.newTabButton]
 * @param {boolean} [param0.bypassCache]
 * @param {boolean} [param0.includeClosing]
 * @param {boolean} [param0.onlyFocusable]
 * @returns {Element[]}
 */
function getNodes({pinned, newTabButton, bypassCache, includeClosing, onlyFocusable} = {}) {
	let nodes;
	if (
		bypassCache ||
		(
			includeClosing &&
			(
				gBrowser._removingTabs.size ||
				gBrowser.tabGroups?.some(g => g.getAttribute("toggling") == "collapse")
			)
		)
	)
		//TODO: tab-split-view
		//using selector is fast than ariaFocusableItems w/o 1.5 times
		nodes = $$(`
			:not([collapsed]) > tab:not([hidden]),
			tab-group[collapsed][toggling=collapse] > tab:not([hidden]),
			tab-group[collapsed][hasactivetab] > tab[selected],
			.tab-group-label-container
		`, arrowScrollbox);
	else {
		nodes = tabContainer.ariaFocusableItems?.map(t => isTab(t) ? t : t.group.labelContainerElement);
		if (!nodes)
			nodes = gBrowser.visibleTabs.slice();
	}

	if (!includeClosing)
		nodes = nodes.filter(n => !n.closing && !n.hasAttribute("closing"));

	if (!pinned && !onlyFocusable) {
		let group = gBrowser.tabGroups?.find(g => g.isShowingOverflowCount);
		if (group)
			nodes.splice(
				nodes.findLastIndex(n => group == (isTabGroupLabelContainer(n) ? n.parentNode : n.group)) + 1,
				0,
				group.overflowContainer,
			);
	}

	if (pinned != null)
		nodes = nodes.filter(n => !!n.pinned == pinned);

	if (newTabButton) {
		let btn = tabContainer.newTabButton;
		if (btn.checkVisibility({checkVisibilityCSS: true}))
			nodes.push(btn);
	}
	return nodes;
}

function toggleAllTabsButton() {
	$("#alltabs-button").hidden = prefs.hideAllTabs;
}

/** @param {boolean} [allRows] */
function getRowCount(allRows) {
	if (!tabHeight)
		tabContainer.uiDensityChanged();
	return Math.max(Math.round(getRect(allRows ? slot : scrollbox, {box: "content"}).height / tabHeight) || 1, 1);
}

function maxTabRows() {
	return +getComputedStyle(scrollbox).getPropertyValue("--max-tab-rows");
}

/**
 * @param {Element} box
 * @param {("vertical"|"horizontal")} [orient]
 * @returns {Element}
 */
function getScrollbar(box, orient = "vertical") {
	return InspectorUtils.getChildrenForNode(box, true, false)
		.find(e => e.matches(`scrollbar:is(
			${orient == "vertical" ? "[vertical]" : ":not([orient])"},
			[orient=${orient}]
		)`));
}

function updateNavToolboxNetHeight() {
	console?.time("updateNavToolboxNetHeight");
	let menubar = $("#toolbar-menubar");
	let personalbar = $("#PersonalToolbar");
	let menubarAutoHide = menubar.hasAttribute("autohide");
	let countPersonalbar = getPref("browser.toolbars.bookmarks.visibility", "String") != "never";
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
		rAF().then(() => {
			let shouldShow = !personalbar.collapsed;
			if (shouldShow)
				personalbar.collapsed = true;
			rAF(2).then(() => {
				personalbar.style.transition = "";
				if (shouldShow)
					personalbar.collapsed = false;
			});
		});
	}
	console?.timeEnd("updateNavToolboxNetHeight");
}

/** @param {number} lines */
function restrictScroll(lines) {
	let rows = getRowCount(), param = {checkVisibility: true, noFlush: true};
	if (
		getRect(tabContainer._placeholderPostTabs, param).width ||
		getRect(tabContainer._placeholderPreTabs, param).width
	)
		rows--;
	if (getRect(tabContainer._placeholderNewTabButton, param).width)
		rows--;
	return Math.max(Math.min(lines, rows), 1);
}

function updateThemeStatus() {
	let id = getPref("extensions.activeThemeID", "String");
	defaultTheme = ["", "default-theme@mozilla.org", "firefox-compact-light@mozilla.org", "firefox-compact-dark@mozilla.org"]
		.includes(id);
	defaultDarkTheme = id == "firefox-compact-dark@mozilla.org";
	defaultAutoTheme = ["", "default-theme@mozilla.org"].includes(id);
	bgImgTheme = getComputedStyle(gNavToolbox).backgroundImage.includes("url(");
	micaEnabled = getPref("widget.windows.mica", "Bool", false);
	mica = micaEnabled && defaultAutoTheme && !accentColorInTitlebarMQ.matches;
}

/**
 * @param {number} a
 * @param {boolean} [round]
 */
function pointDelta(a, b = 0, round) {
	if (round) {
		a = Math.round(a);
		b = Math.round(b);
	}
	let delta = a - b;
	return Math.abs(delta) < .02 ? 0 : delta;
}

/**
 * @param {number} a
 * @param {boolean} [round]
 */
function pointDeltaH(a, b = 0, round) {
	return pointDelta(a, b, round) * DIR;
}

function setDebug() {
	// eslint-disable-next-line no-cond-assign
	({console} = (debug = prefs.debugMode) ? window : {});
}

/**
 * @param {(string|CustomElementConstructor)} element
 * @param {string} method
 * @param {string} [context]
 */
function exposePrivateMethod(element, method, context = "") {
	if (typeof element == "string")
		element = customElements.get(element);
	let newMethod = method.replace("#", "_");
	if (newMethod in element.prototype)
		return;
	let relatedMehtods = new Set();
	let code = element.toString().match(new RegExp(`(?<=\\s+)${method}.+|$`, "s"))[0];
	let idx = 0, parenthesesIdx = 0, argPartDone;
	code = code.slice(0, [...code].findIndex(c => {
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
		return "this._" + property.slice(1) + bracket;
	}).slice(method.length);
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
	let s = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
	s.quit(s.eAttemptQuit | s.eRestart);
}

/**
 * @param {{(): void|Promise<Element>|Array<Promise<Element>>}} action
 * @param {Object} [param1]
 * @param {Element[]} [param1.nodes]
 * @param {Map<Element, Rect>} [param1.rects]
 * @param {Map<Element, Rect>} [param1.newRects]
 * @param {boolean} [param1.includeClosing]
 * @param {(boolean|"transorm"|"translate"|Array<"transorm"|"translate">)} [param1.translated]
 * @param {boolean} [param1.animate]
 * @param {boolean} [param1.shouldUpdatePlacholder]
 */
async function animateLayout(
	action,
	{
		nodes, rects, newRects,
		translated, includeClosing  = true,
		animate = true,
		shouldUpdatePlacholder = true,
	} = (animatingLayout || {}),
) {
	let recursion = !!animatingLayout;
	animate &&= !recursion && !gReduceMotion && !!prefs.animationDuration;

	let deltaNodes, cancel, slotRect, tabsRect, scrollTop;

	if (animate) {
		({scrollTop} = scrollbox);
		tabsRect = getRect(tabContainer);
		slotRect = getRect(slot, {box: "content"});
		nodes ||= getNodes({newTabButton: true, includeClosing});
		rects ||= new Map();
		newRects ||= new Map();

		for (let n of nodes)
			if (!rects.has(n))
				rects.set(n, getVisualRect(n, translated));

		animatingLayout = {nodes, rects, newRects, shouldUpdatePlacholder, slotRect, tabsRect, scrollTop};
		if (debug)
			animatingLayout.trace = new Error();
	}

	let {overflowing} = tabContainer;
	try {
		deltaNodes = action?.();
		if (deltaNodes instanceof Promise)
			deltaNodes = await deltaNodes;
	} finally {
		if (animate) {
			({cancel, shouldUpdatePlacholder} = animatingLayout);
			animatingLayout = null;
		}
	}

	if (overflowing != !!scrollbox.scrollTopMax)
		scrollbox.dispatchEvent(new Event(overflowing ? "overflow" : "underflow"));
	else {
		if (shouldUpdatePlacholder)
			tabContainer._updateInlinePlaceHolder();
		tabContainer._updateCloseButtons();
	}

	if (animate && !cancel) {
		console?.log("animate layout");
		console?.trace();
		return new Promise(rs => requestAnimationFrame(async () => {
			for (let n of nodes)
				if (!newRects.has(n))
					newRects.set(n, getRect(n));

			if (
				deltaNodes &&
				(deltaNodes = [deltaNodes].flat().filter(n =>
					isTab(n) && (!n.pinned || prefs.pinnedTabsFlexWidth)
				).sort((a, b) => a._tPos - b._tPos))[0]
			) {
				if (deltaNodes[0].closing) {
					//TODO: handle closing tabs
				} else {
					await tabContainer._unlockTabSizing({instant: true, unlockSlot: false});

					nodes = nodes.concat(deltaNodes);
					for (let t of deltaNodes)
						if (!newRects.has(t))
							newRects.set(t, getRect(t));

					let newNodes = getNodes();
					let nxt = newNodes[newNodes.lastIndexOf(deltaNodes.at(-1)) + 1];
					let nxtR = rects.get(nxt);
					let nxtNewR = newRects.get(nxt);
					let newSlotRect = getRect(slot, {box: "content"});
					let newRowStartPoint =
						newSlotRect.start
						+ (
							isSlotJustifyCenter()
								? newSlotRect.width / 2 * DIR
								: 0
						);
					deltaNodes.forEach(t => {
						let r;
						let newR = newRects.get(t);
						let prv = newNodes[newNodes.indexOf(t) - 1];
						let prvNewR =
							newRects.get(prv) ||
							//the previous may be a newly added tab group label
							prv && getRect(prv);

						if (prvNewR && !pointDelta(prvNewR.y, newR.y)) {
							r = (rects.get(prv) || prvNewR).clone();
							r.start = r.end;
						} else if (nxtNewR && !pointDelta(nxtNewR.y, newR.y))
							r = nxtR.clone();
						else {
							r = newR.clone();
							r.start = newRowStartPoint;
						}
						r.y += scrollbox.scrollTop - scrollTop;
						r.width = 0;
						rects.set(t, r);
					});
				}
			}

			let newTabsRect = getRect(tabContainer);
			let run = () => Promise.all(nodes.map(n =>
				animateShifting(
					n,
					rects.get(n).relativeTo(tabsRect),
					newRects.get(n).relativeTo(newTabsRect),
				)
			)).then(rs);

			if (tabContainer.overflowing) {
				nodes = nodes.filter(n => {
					let nR = newRects.get(n);
					return (
						nR.relative ||
						isOverlapping(nR, newTabsRect) ||
						isOverlapping(rects.get(n), newTabsRect) ||
						deltaNodes?.includes(n)
					);
				});
				if (arrowScrollbox.hasAttribute("scrolledtoend")) {
					//workaround for a weird bug that the scrollbox may scroll up
					//when closing that only tab in the last row or collapsing a tab group with keyboard.
					//it seems not the case of overflow changing, resizing, scrollTop assign, scrollIntoView,
					//nor inline placeholder related.
					//it just happens when the css variables applied on the first tab on the second row when animateShifting().
					let {scrollTop} = scrollbox;
					run();
					if (scrollbox.scrollTop != scrollTop)
						arrowScrollbox.instantScroll(scrollTop);
				} else
					run();
			} else
				run();
		}));
	}
}

const ANIMATE_REQUEST = Symbol("animateRequest");
const APPLYING_ANIMATION = Symbol("applyingAnimation");

/**
 * @param {Element} t
 * @param {Rect} oR
 * @param {Rect} nR
 */
async function animateShifting(t, oR, nR) {
	if (gReduceMotion || !t.isConnected || !oR.visible || !nR.visible || !prefs.animationDuration)
		return t;

	let {start: oS, y: oY, width: oW} = oR;
	let {start: nS, y: nY, width: nW, widthRoundingDiff: wrd, heightRoundingDiff: hrd} = nR;

	let {style} = t;
	let s = pointDelta(oS, nS), y = pointDelta(oY, nY), w = pointDelta(oW, nW);
	let {abs} = Math;
	if (abs(s) < 1 && abs(y) < 1 && (abs(w) < 1 || !isTab(t))) {
		if (t.hasAttribute("animate-shifting"))
			assign(style, {
				"--width-rounding-diff": wrd + "px",
				"--height-rounding-diff": hrd + "px",
			});
		return t;
	}

	let to = [nS, nY, nW];
	if (t[ANIMATE_REQUEST]?.every((v, i) => abs(v - to[i]) < 1)) {
		await waitForAnimate(t);
		console?.debug(t, "previous animate done");
		return t;
	}
	t[ANIMATE_REQUEST] = to;

	// eslint-disable-next-line no-async-promise-executor
	await (t[APPLYING_ANIMATION] = new Promise(async rs => {
		t.setAttribute("animate-shifting", "start");
		assign(style, {
			"--x": s + "px",
			"--y": y + "px",
			"--w": w + "px",
			"--l": nW + "px",
			"--width-rounding-diff": wrd + "px",
			"--height-rounding-diff": hrd + "px",
		});

		await rAF();

		t.setAttribute("animate-shifting", "run");
		assign(style, {"--x": "", "--y": "", "--w": ""});

		rs();
	}));
	delete t[APPLYING_ANIMATION];

	await waitForAnimate(t);

	t.removeAttribute("animate-shifting");
	assign(style, {"--l": ""});
	if (["--translate-x", "--translate-y"].every(p => !style.getPropertyValue(p)))
		assign(style, {"--width-rounding-diff": "", "--height-rounding-diff": ""});

	delete t[ANIMATE_REQUEST];

	return t;
}

/** @param {Element} n */
async function waitForAnimate(n) {
	let anis = ["translate", "transform"].map(p => waitForTransition(n, p));
	if (n.stack)
		anis.push(waitForTransition(n.stack, `margin-${END}`));
	anis = await Promise.all(anis);
	if (anis.some(a => a) && !anis.every(a => a))
		//ensure there is no running animation
		await waitForAnimate(n);
}

/**
 * @param {Element} node
 * @param {string} property
 * @returns {Promise<Animation>}
 */
async function waitForTransition(node, property) {
	try {
		return await node.getAnimations().find(ani => ani.transitionProperty == property)?.finished;
	// eslint-disable-next-line no-unused-vars
	} catch(e) {
		await node[APPLYING_ANIMATION];
		return await waitForTransition(node, property);
	}
}

/**
 * @param {Rect} r1
 * @param {Rect} r2
 * @returns {boolean}
 */
function isOverlapping(r1, r2) {
	return (
		r1.visible && r2.visible &&
		pointDelta(r1.right, r2.x) > 0 && pointDelta(r1.x, r2.right) < 0 &&
		pointDelta(r1.bottom, r2.y) > 0 && pointDelta(r1.y, r2.bottom) < 0
	);
}

/**
 * @param {Element} n
 * @param {(boolean|"transorm"|"translate"|Array<"transorm"|"translate">)} [translated="translate"] return the translated box
 */
function getVisualRect(n, translated = "translate") {
	let r = getRect(n, {translated});
	if (isTab(n))
		r.width -= parseFloat(getComputedStyle(n.stack)?.marginInlineEnd) || 0;
	return r;
}

/**
 * @param {number} l left
 * @param {number} r right
 * @param {number} w width
 */
function roundingDiff(l, r, w) {
	let d = devicePixelRatio;
	return (Math.round(r * d) - Math.round(l * d)) / d - w;
}

/**
 * @remarks not compatible with scale and rotate
 * @param {(Node|null)} ele
 * @param {Object} [param1={}]
 * @param {("margin"|"border"|"padding"|"content")} [param1.box]
 * @param {(boolean|"transorm"|"translate"|Array<"transorm"|"translate">)} [param1.translated] return the translated box
 * @param {boolean} [param1.checkVisibility] if visibility is collapse, then size = 0, end = start
 * @param {boolean} [param1.scroll] return the scroll size
 * @param {boolean} [param1.noFlush] using getBoundsWithoutFlushing instead
 */
function getRect(ele, {box, translated, checkVisibility, scroll, noFlush} = {}) {
	let cs;
	if (
		!ele?.isConnected ||
		//in some weird cases, the cs is null
		["none", "contents", undefined].includes(
			(cs = getComputedStyle(ele instanceof Element ? ele : ele.parentNode))?.display
		)
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
	// eslint-disable-next-line no-cond-assign
	else if (r = ele.getBoxQuads({box})[0]) {
		//dont use the DOMQuad.getBounds() since it can't handle negative size
		let {p1, p3} = r;
		r = new DOMRect(p1.x, p1.y, p3.x - p1.x, p3.y - p1.y);
	}
	if (!r) {
		console?.warn("Can't get bounds of element");
		console?.debug(ele);
		return new Rect();
	}
	let {e: t1x, f: t1y} = new DOMMatrixReadOnly(cs.transform);
	let [t2x, t2y] = [...[...cs.translate.matchAll(/-?\d+(?:\.[\de-]+)?/g)].flat().map(v => +v), 0, 0].slice(0, 2);
	let tx = t1x + t2x;
	let ty = t1y + t2y;
	let {[START]: start, y, width, height} = r;
	let widthRoundingDiff = roundingDiff(r.x - tx, r.right - tx, width);
	let heightRoundingDiff = roundingDiff(y - ty, r.bottom - ty, height);

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

	return new Rect(start, y, width, height, widthRoundingDiff, heightRoundingDiff);
}

/**
 * @param {string} func
 * @param {string} [ignoreFunc]
 */
function isCalledBy(func, ignoreFunc) {
	let {stack} = new Error();
	let match = stack.match(new RegExp(`^${func}@`, "m"));
	if (match && stack.match(/^.+\*/m)?.index < match.index) {
		if (!ignoreFunc || !isCalledBy(ignoreFunc))
			window.console.error("Unsafe stack checking!", func, stack);
		return false;
	}
	return !!match;
}

async function rAF(times = 1) {
	while (times-- > 0)
		await new Promise(rs => requestAnimationFrame(rs));
}

/**
 * @param {string} name
 * @param {("Bool"|"Int"|"String")} type
 * @param {(number|boolean|string)} [fallback]
 * @returns {(number|boolean|string)}
 */
function getPref(name, type, fallback) {
	try {
		return Services.prefs[`get${type}Pref`](name);
	} catch {
		return fallback;
	}
}

/**
 * @param {(Object|CSSStyleDeclaration|null)} o object
 * @param {Object} [p] parameters
 * @returns {Object} a copy of `p` if `o` is `null`
 */
function assign(o, p) {
	if (!p) return o;
	if (!o) return {...p};
	if (!(o instanceof CSSStyleDeclaration))
		return Object.assign(o, p);
	for (let [k, v] of Object.entries(p)) {
		let isVar = k.startsWith("--");
		if (v != "" && v != null) {
			let i;
			// eslint-disable-next-line no-constant-binary-expression
			v = (v + "").replace(/\s*!\s*important\s*$/i, () => (i = "important") && "");
			if (isVar)
				o.setProperty(k, v, i);
			else if (i) {
				k = k.replace(/[A-Z]/g, c => "-" + c.toLowerCase());
				o.setProperty(k, v, i);
			} else
				o[k] = v;
		} else if (isVar)
			o.removeProperty(k);
		else
			o[k] = v;
	}
	return o;
}

/**
 * @param {string} selector
 * @param {(Element|Document)} [scope]
 */
function $(selector, scope = document) {
	return scope.querySelector(selector);
}

/**
 * @param {string} selector
 * @param {(Element|Document)} [scope]
 * @returns {Array<Element>}
 */
function $$(selector, scope = document) {
	return [...scope.querySelectorAll(selector)];
}

console?.timeEnd("setup");
} //end function setup()

} catch(e) {alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e)}
