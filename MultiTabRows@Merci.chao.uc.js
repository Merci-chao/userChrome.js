"use strict";
// ==UserScript==
// @name           Multi Tab Rows (MultiTabRows@Merci.chao.uc.js)
// @description    Make Firefox support multiple rows of tabs.
// @author         Merci chao
// @version        4.1.0.5
// @compatibility  Firefox 115, 145-147
// @homepageURL    https://github.com/Merci-chao/userChrome.js#multi-tab-rows
// @changelogURL   https://github.com/Merci-chao/userChrome.js#changelog
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js
// ==/UserScript==

/* global
   gBrowser, RTL_UI, Services, Cc, Ci, promiseDocumentFlushed,
   gURLBar, gNavToolbox, gReduceMotion, FullScreen, TAB_DROP_TYPE, InspectorUtils, windowUtils,
   gNotificationBox,
*/

const SCRIPT_NAME = "Multi Tab Rows";
const SCRIPT_FILE_NAME = "MultiTabRows@Merci.chao.uc.js";

if (document.documentElement.matches("[windowtype='navigator:browser']:not([chromehidden~=toolbar])"))
try {
if (gBrowser?._initialized) {
	if (setup()) {
		let tc = gBrowser.tabContainer;
		if (gBrowser.pinnedTabsContainer)
			tc.arrowScrollbox.prepend(...tc.visibleTabs.slice(0, gBrowser.pinnedTabCount));
		tc.uiDensityChanged();
		tc._handleTabSelect(true);
		tc._invalidateCachedTabs();
		tc._updateInlinePlaceHolder();
	}
} else
	addEventListener("DOMContentLoaded", () => {
		try { setup() }
		catch(e) { alert([SCRIPT_FILE_NAME,e,e.stack].join("\n"));console.error(e) }
	}, {once: true});

function setup() {
const [START,   END,     LEFT,    RIGHT,   START_PC, END_PC, DIR] = RTL_UI
   ? ["right", "left",  "end",   "start", "100%",   "0%",    -1]
   : ["left",  "right", "start", "end",   "0%",     "100%",  1];

//it should be .0001, but use lower precision to avoid rounding issues, especially with fractional DPR
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

	/**
	 * @param {Object} [param0={}]
	 * @param {("x"|"y")} [param0.axis]
	 * @param {boolean} [param0.toEnd]
	 */
	collapse({axis = "x", toEnd = true} = {}) {
		if (axis == "x") {
			if (toEnd)
				this.start = this.end;
			this.width = 0;
		} else if (axis == "y") {
			if (toEnd)
				this.y = this.bottom;
			this.height = 0;
		} else
			throw new Error(`Invalid axis: ${axis}`);
		return this;
	}

	/** @param {Rect} rect */
	relativeTo(rect, clone = true) {
		let r = clone ? this.clone() : this;
		if (this.visible && rect.visible) {
			r.start -= rect.start;
			r.y -= rect.y;
		}
		r.relative = true;
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
	let vTab = "sidebar.verticalTabs";
	let csp = "security.allow_unsafe_dangerous_privileged_evil_eval";
	try {
		let needRestart;

		if (getPref(vTab, "Bool")) {
			prefs.setBoolPref(vTab, false);
			needRestart = true;
		}

		if (prefs.getPrefType(csp)) {
			if (!prefs.getBoolPref(csp))
				prefs.unlockPref(csp);
			if (prefs.getBoolPref(csp)) {
				try {
					eval("");
				// eslint-disable-next-line no-unused-vars
				} catch (e) {
					let l10n = {
						en: `${SCRIPT_FILE_NAME}\n\nThe preference "${csp}" is locked to "false" by the script loader. Please modify or remove the corresponding restriction, or use another script loader.`,
						ja: `${SCRIPT_FILE_NAME}\n\n設定 "${csp}" はスクリプトローダーによって "false" ロックされています。該当する制限を修正または削除するか、別のスクリプトローダーを使用してください。`,
					};
					l10n = l10n[Services.locale.appLocaleAsLangTag.split("-")[0]] || l10n.en;
					alert(l10n);
					return;
				}
			} else {
				prefs.setBoolPref(csp, true);
				needRestart = true;
			}
		}

		if (needRestart) {
			restartFirefox();
			return;
		}

		try {
			prefs.lockPref(vTab);
		// eslint-disable-next-line no-unused-vars
		} catch (e) { /* empty */ }

		$$("#toolbar-context-toggle-vertical-tabs, #context_toggleVerticalTabs, #sidebar-context-menu-enable-vertical-tabs")
			.forEach(e => e.disabled = true);
	} catch (e) {
		alert([SCRIPT_FILE_NAME,e,e.stack].join("\n"));
	}
}

const CLOSING_THE_ONLY_TAB = Symbol("closingTheOnlyTab");
const TEMP_SHOW_CONDITIONS = `:is(
	:hover:not(:-moz-window-inactive),
	[temp-open][has-popup-open],
	[dragging]
):not([urlbar-view-open] #tabbrowser-tabs)`;
const MENUBAR_AUTOHIDE = appVersion > 142 ? "[autohide]" : "[autohide=true]";

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

const FX_USING_PRIVATE_SET_STYLE = tabContainer.constructor.toString()
	.includes("#updateTabStylesOnDrag");
const NATIVE_DRAG_TO_PIN = !!(window.TabDragAndDrop || FX_USING_PRIVATE_SET_STYLE);
const TAB_GROUP_SUPPORT = "tabGroups" in gBrowser;
const SPLIT_VIEW_SUPPORT = "addTabSplitView" in gBrowser;
const TAB_CONTENT_HEIGHT = [36, 29, 41];
const [
	VIEW_MIN_WIDTH,
	TAB_BLOCK_MARGIN,
	TAB_INLINE_PADDING,
	TAB_INLINE_MARGIN,
	ANIMATE_DURATION,
] = (() => {
	let cs = getComputedStyle(root);
	return [
		["min-width"],
		["--tab-block-margin"],
		["--tab-inline-padding", 8],
		["--tab-overflow-clip-margin", 2],
	].map(([p, d]) => parseFloat(cs.getPropertyValue(p)) || d)
		.concat(
			+cs.getPropertyValue("--tab-dragover-transition").match(/\d+|$/)[0] || 200
		);
})();

/** @type {(Console|null)} */
let console;
let debug = false;

const prefBranchStr = "userChromeJS.multiTabRows@Merci.chao.";

// if (!Services.prefs.getPrefType(prefBranchStr + "checkUpdate"))
// 	Services.prefs.setIntPref(prefBranchStr + "tabsUnderControlButtons", 0);

/** @type {Object} */
let prefs;
const createDefaultPrefs = () => ({
	maxTabRows: 4,
	rowStartIncreaseFrom: VIEW_MIN_WIDTH,
	rowIncreaseEvery: 200,
	spaceAfterTabs: 40,
	spaceAfterTabsOnMaximizedWindow: 40,
	spaceBeforeTabs: 40,
	spaceBeforeTabsOnMaximizedWindow: 0,
	hideEmptyPlaceholderWhenScrolling: true,
	gapAfterPinned: appVersion < 143 ? 12 : 0,
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
	dragToGroupTabs: TAB_GROUP_SUPPORT ? true : null,
	dynamicMoveOverThreshold: TAB_GROUP_SUPPORT ? true : null,
	nativeWindowStyle: appVersion > 130 ? false : null,
	animationDuration: ANIMATE_DURATION,
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
	disableDragToPinOrUnpin: appVersion < 142,
	dragStackPreceding: true,
	privateBrowsingIconOnNavBar: $("#private-browsing-indicator-with-label") ? null : false,
	tabContentHeight:
		TAB_CONTENT_HEIGHT[getPref("browser.uidensity", "Int")] ||
		TAB_CONTENT_HEIGHT[0],
	tabVerticalMargin: TAB_BLOCK_MARGIN,
	tabHorizontalPadding: TAB_INLINE_PADDING,
	tabHorizontalMargin: TAB_INLINE_MARGIN,
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
	"browser.tabs.dragDrop.moveOverThresholdPercent",
	"browser.tabs.dragDrop.multiselectStacking",
	"browser.tabs.groups.enabled",
	"browser.tabs.inTitlebar",
	"browser.tabs.tabMinWidth",
	"browser.toolbars.bookmarks.visibility",
	"browser.uidensity",
	"extensions.activeThemeID",
	"layout.css.has-selector.enabled",
	"toolkit.tabbox.switchByScrolling",
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

	let maxMove = prefs.animateTabMoveMaxCount;
	let moveOverThreshold = getPref("browser.tabs.dragDrop.moveOverThresholdPercent", "Int", 0);
	let singleRow = prefs.maxTabRows < 2;
	let nativeDragToGroup = moveOverThreshold > 50 && getPref("browser.tabs.groups.enabled", "Bool", false);

	let supportsHas = getPref("layout.css.has-selector.enabled", "Bool", true);
	let noAutoCollapse = !supportsHas || singleRow;

	lock("linesToDragScroll", singleRow);
	lock("linesToScroll", singleRow || getPref("toolkit.tabbox.switchByScrolling", "Bool"));
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
	lock("tabsbarItemsAlign", singleRow || prefs.tabsUnderControlButtons >= 2 || prefs.autoCollapse);
	lock(
		"floatingBackdropBlurriness",
		(
			prefs.floatingBackdropOpacity >= 100 || prefs.floatingBackdropClip ||
			singleRow || prefs.tabsUnderControlButtons < 2 || mica || prefs.nativeWindowStyle
		),
	);
	lock(["checkUpdateFrequency", "checkUpdateAutoApply"], !prefs.checkUpdate);
	lock("dragToGroupTabs", !nativeDragToGroup || !maxMove, false);
	lock(
		"dynamicMoveOverThreshold",
		!prefs.dragToGroupTabs || moveOverThreshold <= 50,
		false,
	);
	lock("hideDragPreview", !maxMove);
	lock("privateBrowsingIconOnNavBar", prefs.tabsAtBottom);
	lock("hidePinnedDropIndicator", prefs.disableDragToPinOrUnpin || !maxMove, true);
	lock("pinnedTabsFlexWidthIndicator", !prefs.pinnedTabsFlexWidth);
	lock("dragStackPreceding", !getPref("browser.tabs.dragDrop.multiselectStacking", "Bool") || maxMove < 2);
	lock(
		["spaceAfterTabs", "spaceAfterTabsOnMaximizedWindow", "spaceBeforeTabs", "spaceBeforeTabsOnMaximizedWindow"],
		!getPref("browser.tabs.inTitlebar", "Int") || $(`#toolbar-menubar:not(${MENUBAR_AUTOHIDE})`),
		0,
	);
	lock(
		"hideEmptyPlaceholderWhenScrolling",
		(
			prefs.tabsUnderControlButtons < 2 ||
			prefs.tabsAtBottom ||
			!prefs.spaceBeforeTabs && !prefs.spaceBeforeTabsOnMaximizedWindow
		),
	);

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

	name = name.replace(prefBranchStr, "");

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

	for (let [n, v] of Object.entries(defaultPrefs))
		if (v != null)
			Services.prefs.unlockPref(prefBranchStr + n);

	loadPrefs(defaultPrefs);

	for (let win of browsers)
		delete win.MultiTabRows_updatingPref;

	switch (name) {
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
		case "tabHorizontalMargin":
		case "tabHorizontalPadding":
			delete tabContainer._pinnedTabsLayoutCache;
		// eslint-disable-next-line no-fallthrough
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
		case "tabVerticalMargin":
			setStyle();
		// eslint-disable-next-line no-fallthrough
		case "tabContentHeight":
			tabContainer.uiDensityChanged();
			break;
		case "checkUpdate":
		case "checkUpdateFrequency":
		case "checkUpdateAutoApply":
		case "autoCollapseCurrentRowStaysTop":
		case "animateTabMoveMaxCount":
		case "hidePinnedDropIndicator":
		case "dragStackPreceding":
		case "browser.tabs.groups.enabled":
		case "browser.tabs.dragDrop.moveOverThresholdPercent":
		case "browser.tabs.inTitlebar":
		case "menubar-autohide-change":
			break;
		case "toolkit.tabbox.switchByScrolling":
			tabContainer.switchByScrolling = getPref("toolkit.tabbox.switchByScrolling", "Bool");
			break;
		case "browser.tabs.dragDrop.multiselectStacking":
			tabContainer.tabDragAndDrop.__proto__.multiselectStacking =
				getPref(name, "Bool");
			break;
		default:
			setStyle();
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
		let compatibility = remoteScript?.match(/^\/\/\s*@compatibility\s+firefox\s*(.+?)\s*$/mi)?.[1]
			?.split(/\s*,\s*/).map(v => v.split(/\s*-\s*/));
		if (
			!remote ||
			remote.localeCompare(local, undefined, {numeric: true}) <= 0 ||
			(
				appVersion < compatibility?.at(-1).at(-1) &&
				!compatibility.some(([min, max]) => max ? min <= appVersion && appVersion <= max : appVersion == min)
			)
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
				restart: "Restart Now",
				restartKey: "R",
				link: "#changelog",
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
				restart: "今すぐ再起動",
				restartKey: "R",
				link: "/blob/main/README.jp.md#変更履歴",
				done: `${SCRIPT_NAME} ${remote} を更新しました。Firefox を再起動すると変更が有効になります。`,
				error: `${SCRIPT_NAME} バージョン ${remote} の更新処理に失敗しました。ファイルが読み取り専用でないこと、または他のプログラムによってロックされていないことを確認してください：`,
			},
		};
		l10n = l10n[Services.locale.appLocaleAsLangTag.split("-")[0]] || l10n.en;

		if (auto > 1)
			install();
		else
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
				let node = $(".icon", box.shadowRoot);
				let color = "var(--panel-banner-item-update-supported-bgcolor)";
				node.src = icon;
				style(node, {
					fill: color,
					color,
					"--message-bar-icon-url": `url(${icon})`,
				});
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
				if (auto < 3)
					//Delay a bit to make the installation feel like it's actually running
					setTimeout(() => showNotification(
						l10n.done,
						[
							{
								label: l10n.changelog,
								accessKey: l10n.changelogKey,
								callback: showChangelog,
							},
							{
								label: l10n.restart,
								accessKey: l10n.restartKey,
								callback: restartFirefox,
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
let splitViewMinWidth = 0;
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
	style(tabsBar, {"--tabs-scrollbar-visual-width": visualWidth + "px"});
	if (getStyle(tabsBar, "--tabs-scrollbar-width"))
		style(tabsBar, {"--tabs-scrollbar-width": scrollbarWidth + "px"});
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
const visible = `:not([hidden], [closing], [stacking])`;
const lastNode = `[last-inflow-node]`;
const adjacentNewTab = "#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button";
const dropOnItems = ":is(#home-button, #downloads-button, #bookmarks-menu-button, #personal-bookmarks):not([moving-tabgroup] *)";
const dropOnItemsExt = "#TabsToolbar[tabs-dragging-ext] :is(#new-tab-button, #new-window-button)";
const shownMenubar = `#toolbar-menubar:not(:root[inFullscreen] *):is(:not([inactive]), :not(${MENUBAR_AUTOHIDE}))`;
const hiddenMenubar = `#toolbar-menubar:is(${MENUBAR_AUTOHIDE}[inactive], :root[inFullscreen] *)`;
const CUSTOM_TITLEBAR = appVersion > 134 ? "customtitlebar" : "tabsintitlebar";
const topMostTabsBar = prefs.tabsAtBottom
	? "#TabsToolbar:not([id])"
	: `:root[${CUSTOM_TITLEBAR}] ${hiddenMenubar} + #TabsToolbar`;
const nonTopMostTabsBar = prefs.tabsAtBottom
	? "#TabsToolbar"
	: `#TabsToolbar:is(
		:root:not([inFullscreen]) #toolbar-menubar:not(${MENUBAR_AUTOHIDE}) + *,
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
const showAudioButton = "[muted], [soundplaying], [activemedia-blocked]";

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
	--tab-block-margin: ${Math.min(Math.max(prefs.tabVerticalMargin, 0), TAB_BLOCK_MARGIN * 3)}px;
	--tab-inline-padding: ${Math.min(Math.max(prefs.tabHorizontalPadding, 0), TAB_INLINE_PADDING * 3)}px;
	--tab-pinned-inline-padding: 2px;
	--tab-overflow-clip-margin: ${Math.min(Math.max(prefs.tabHorizontalMargin, 0), TAB_INLINE_MARGIN * 3)}px;
	--tab-group-label-height: min(max(1.5em, var(--tab-min-height) - 14px), var(--tab-min-height));
	--tab-group-line-thickness: clamp(1px, var(--tab-block-margin) - 1px, 2px);
	--tab-group-line-toolbar-border-distance: clamp(0px, var(--tab-block-margin) - var(--tab-group-line-thickness) - 1px, 1px);
}

${[...Array(maxRows).keys()].slice(1).map(i => `
	@media (min-width: ${rSIF + rIE * i}px) {
		:root { --max-tab-rows: ${i + 1}; }
	}
`).join("\n")}

${!win7 && !win8 || appVersion == 115 && matchMedia("(-moz-windows-compositor)").matches ? `
	/*make the title bar able to be narrower on 115*/
	:root[tabsintitlebar][sizemode] #titlebar {
		appearance: none;
	}

	#TabsToolbar > .titlebar-buttonbox-container {
		margin-bottom: 0;
	}
` : ``}

#navigator-toolbox {
	--tabs-moving-max-z-index: 0;
	--space-before-tabs: ${prefs.spaceBeforeTabs}px;
	--space-after-tabs: ${prefs.spaceAfterTabs}px;
}

:root[sizemode=maximized] #navigator-toolbox {
	--space-before-tabs: ${prefs.spaceBeforeTabsOnMaximizedWindow}px;
	--space-after-tabs: ${prefs.spaceAfterTabsOnMaximizedWindow}px;
}

${_="#TabsToolbar"} {
	position: relative;
	--nav-toolbox-padding-top: 0px;
	--tabs-padding-top: 0px;
	--tabs-margin-top: 0px;
	--tabs-top-space: calc(var(--tabs-margin-top) + var(--tabs-padding-top));
	--tabs-scrollbar-width: 0px;
	--tabs-scrollbar-visual-width: 0px;
	--tabs-item-opacity-transition: ${
		getComputedStyle($("[part=overflow-end-indicator]", arrowScrollbox.shadowRoot))
			.transition.match(/\d.+|$/)[0] ||
		".15s"
	};
	--tabs-placeholder-border-color: ${
		getStyle(tabContainer, "--tabstrip-inner-border", true)
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
		prefs.floatingBackdropClip && prefs.tabsUnderControlButtons >= 2
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

	/*ensure the newtab button has a consistent size*/
	--newtab-button-outer-padding: 2px;
	--newtab-button-inner-padding: calc((var(--tab-min-height) - 16px) / 2);
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
		${prefs.tabsAtBottom == 1
			? `order: 2;`
			: ``}

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

	${_} :is(.titlebar-buttonbox-container, .titlebar-spacer) {
		display: none;
	}

	:root[${CUSTOM_TITLEBAR}] #toolbar-menubar${MENUBAR_AUTOHIDE} ~ #nav-bar .titlebar-spacer[class] {
		display: flex;
	}

	#notifications-toolbar {
		order: 2;
	}
` : ``}

${prefs.tabsAtBottom || prefs.privateBrowsingIconOnNavBar ? `
	${_} .private-browsing-indicator-with-label,
	#nav-bar .private-browsing-indicator-label {
		display: none;
	}

	:root[privatebrowsingmode=temporary] #navigator-toolbox #nav-bar .private-browsing-indicator-with-label {
		display: flex;
		margin-inline-end: 12px;
	}
` : ``}

@media (prefers-reduced-motion: reduce) {
	${_} {
		--tabs-item-opacity-transition: 0s;
	}
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

${_=".titlebar-spacer[type=pre-tabs]"} {
	width: var(--space-before-tabs);
}

${prefs.spaceBeforeTabsOnMaximizedWindow ? `
	:root[sizemode=maximized][${CUSTOM_TITLEBAR}] ${_} {
		display: flex;
	}
` : ""}

.titlebar-spacer[type=post-tabs] {
	width: var(--space-after-tabs);
}

${prefs.compactControlButtons || win7 || win8 ? `
	.titlebar-buttonbox-container {
		align-self: start !important;
		height: auto !important;
	}

	:root[${CUSTOM_TITLEBAR}] #navigator-toolbox:not([tabs-hidden]) > #toolbar-menubar${MENUBAR_AUTOHIDE} {
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

${adjacentNewTab} {
	--toolbarbutton-outer-padding: var(--newtab-button-outer-padding);
	--toolbarbutton-inner-padding: var(--newtab-button-inner-padding);
	align-self: end;
}

${_="#tabbrowser-tabs"} {
	--gap-after-pinned: ${prefs.gapAfterPinned}px;
	--group-line-padding: ${TAB_GROUP_SUPPORT ? "3px" : "0px"};
	--group-label-max-width: ${TAB_GROUP_SUPPORT ? "10em" : "0px"};
	--tab-animation: ${prefs.animationDuration}ms ${debug > 1 ? "ease" : "var(--animation-easing-function)"};
	--calculated-tab-min-width: 0px;
	--tab-split-view-min-width: calc(var(--calculated-tab-min-width) * 2 + var(--tab-overflow-clip-margin) + 1px);
	--tab-max-width: max(${prefs.tabMaxWidth}px, var(--calculated-tab-min-width));
	--max-item-width: max(
		${SPLIT_VIEW_SUPPORT
			? `var(--tab-split-view-min-width),`
			: `var(--calculated-tab-min-width),`}
		var(--group-label-max-width) + var(--group-line-padding) * 2
	);
	--tabstrip-padding: 0px;
	--tabstrip-border-width: 0px;
	--tabstrip-border-color: transparent;
	--tabstrip-border: var(--tabstrip-border-width) solid var(--tabstrip-border-color);
	--tabstrip-separator-size: calc(var(--tabstrip-padding) * 2 + var(--tabstrip-border-width));
	--tab-overflow-pinned-tabs-width: 0px;
	--extra-drag-space: 15px; /*hardcoded in tabs.css*/
	position: relative;
	padding-inline-start: var(--tabstrip-padding) !important;
}

/*override the default rule for consistent handling*/
${_}[orient][movingtab] {
	padding-bottom: var(--extra-drag-space);
	margin-bottom: calc(var(--extra-drag-space) * -1);
}

${preTabsButtons} ~ ${_} {
	--tabstrip-padding: 2px;
}

${prefs.autoCollapse ? `
	#navigator-toolbox,
	#titlebar,
	#TabsToolbar,
	#TabsToolbar > .toolbar-items,
	#TabsToolbar-customization-target {
		z-index: calc(1/0) !important;
		position: relative !important;
	}

	${context=`:root:not([style*="--tab-scroll-rows: 1;"])`} ${_}:not(${TEMP_SHOW_CONDITIONS}) {
		height: var(--tab-height);
	}

	${context} ${_} :is(tab, tab-split-view-wrapper, tab-group > *) {
		margin-inline-end: 0 !important;
	}

	${context} #TabsToolbar {
		max-height: calc(var(--tab-height) + var(--tabs-padding-top) + var(--tabs-margin-top));
		align-items: start;
	}

	${context} #TabsToolbar:has(> .toolbar-items > .customization-target > ${_}${TEMP_SHOW_CONDITIONS}) {
		opacity: 1 !important;
	}

	${_} {
		--extra-drag-space: 0px;
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

	${context} ${_}${TEMP_SHOW_CONDITIONS} {
		margin-bottom: calc((var(--tab-scroll-rows) - 1) * var(--tab-height) * -1);
		height: calc(var(--tab-scroll-rows) * var(--tab-height));
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

	${context} ${_}${TEMP_SHOW_CONDITIONS} #tabbrowser-arrowscrollbox {
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

	${context} ${_}${TEMP_SHOW_CONDITIONS} ${__} {
		transition-delay: var(--transition-delay-before);
		color: inherit;
	}

	${context} ${_}[temp-open] #tabbrowser-arrowscrollbox::part(scrollbox) {
		padding-bottom: var(--temp-open-padding, 0px);
	}

	@media (-moz-overlay-scrollbars) {
		${context} #TabsToolbar:not([tabs-scrollbar-hovered]) ${_}${TEMP_SHOW_CONDITIONS} {
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
					getStyle(root, "--toolbarbutton-icon-fill")
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
			${_}:has(>
				:is(tab, tab-split-view-wrapper):nth-child(
					1 of :not([hidden], [stacking])
				):nth-last-child(
					1 of :not([hidden], [stacking], ${_}-periphery)
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
	${_}[overflowing] #tabs-newtab-button {
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
		[moving-single-tab]${TAB_GROUP_SUPPORT ? "[moving-tabgroup]" : ""},
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
	background: none;
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
	${!prefs.hideScrollButtonsWhenDragging
		? `opacity: 1 !important;`
		: ``}
}

${_}::part(scrollbox) {
	align-items: start;
	overflow: hidden auto;
	max-height: calc(var(--tab-height) * var(--max-tab-rows));
	scroll-snap-type: both mandatory;
	${prefs.thinScrollbar
		? `scrollbar-width: thin;`
		: ``}
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
	${prefs.justifyCenter == 1
		? "#tabbrowser-tabs:not([multirows], [overflow])"
		: ""}
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

${_} [size-locked] {
	min-width: var(--locked-size) !important;
	max-width: calc(var(--locked-size) + ${1/60}px) !important;
}

${_} [size-locked=accurate] {
	max-width: var(--locked-size) !important;
}

/* [id]: win over the default rule */
#tabbrowser-tabs[id][id][id][id][id][id][id][id] tab-group {
	--line-overlap-length: 0px;
	--line-indent: 0px;
	--line-border-radius: 0px;

	&[toggling] > :is(
		/*
		  prevent the preview menu from opening when collapsing the group.
		  when a tab on the next row is animating to the collapsing point,
		  a mouseover will be triggered and it tries to open the preview panel,
		  but for the hovered group label instead.
		*/
		.tab-group-label-container,

		/* in case the group line of overflow count covers the active tab */
		tab[selected],
		tab-split-view-wrapper[hasactivetab]
	) {
		z-index: 1;
	}

	&[collapsed]:not([stacked]) {
		&[movingtabgroup][hasactivetab] > tab[selected] {
			max-width: var(--tab-max-width) !important;
			min-width: var(--calculated-tab-min-width) !important;

			&[size-locked] {
				max-width: var(--locked-size) !important;
				min-width: var(--locked-size) !important;
			}
		}

		/*counter the change for bug #1986587*/
		& > tab:not([selected], [stacking]) {
			min-width: 0 !important;
			max-width: 0 !important;
		}
	}

	.tab-group-label-container::after,
	tab-split-view-wrapper::before,
	.tab-group-line {
		border-start-end-radius: var(--line-border-radius);
		border-end-end-radius: var(--line-border-radius);
	}

	${!prefs.autoCollapse ? `
		.tab-group-label-container::after,
		tab-split-view-wrapper::before,
		.tab-group-overflow-count-container::after {
			z-index: -1;
		}
	` : ``}

	[movetarget], [animate-shifting] {
		--line-overlap-length: 1px;
	}

	[animate-shifting=start] {
		.tab-group-line,
		tab-split-view-wrapper&::before,
		&.tab-group-label-container::after,
		&.tab-group-overflow-count-container::after {
			translate: calc(var(--x) * -1) calc(var(--y) * -1) -1px;
		}
	}

	.tab-group-label-container {
		padding-inline: var(--group-line-padding);

		[stacked] > &::after {
			display: none;
		}

		tab-group:is(:not([collapsed]), [hasactivetab]) &::after {
			height: var(--tab-group-line-thickness);
			bottom: var(--tab-group-line-toolbar-border-distance);
			inset-inline:
				var(--group-line-padding)
				calc(var(--line-indent) - var(--line-overlap-length));
			pointer-events: none;
		}

		tab-group[collapsed] & .tab-group-label-hover-highlight {
			padding-block: min(4px, (var(--tab-min-height) - var(--tab-group-label-height)) / 2);
		}

		.tab-group-label {
			max-width: var(--group-label-max-width);
			align-content: center;

			/*bug #1985445*/
			&::before {
				content: "";
				position: absolute;
				inset: 0;
				-moz-window-dragging: no-drag;
			}

			.tab-group-label-container:is([animate-shifting], [movetarget]) & {
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
			tab-group[collapsed] &:not(.tablist-keyboard-focus) {
				outline-offset: calc(${outlineOffsetSnapping("1px")} * -1);
			}

			/*bug #1995909
			#tabbrowser-tabs[tablist-has-focus] &.tablist-keyboard-focus {
				outline-offset: calc(${outlineOffsetSnapping("var(--focus-outline-offset)")} * -1);
			}*/
		}
	}

	tab-split-view-wrapper {
		:not([stacked]) > &:not(
			[stacking],
			tab-group[collapsed] > :not([hasactivetab])
		)::before {
			content: "";
			background-color: var(--tab-group-line-color);
			position: absolute;
			height: var(--tab-group-line-thickness);
			bottom: var(--tab-group-line-toolbar-border-distance);
			inset-inline:
				${RTL_UI ? "calc(0px - var(--width-rounding-diff, 0px))" : 0}
				calc(var(--line-indent) - var(--line-overlap-length) ${RTL_UI ? "" : "- var(--width-rounding-diff, 0px)"});
		}
	}

	& > tab {
		--preserve-3d-block-compensation: 0px;
		--line-outdent: var(--tab-overflow-clip-margin);

		.tab-background {
			:is([animate-shifting], [movetarget]) & {
				--preserve-3d-block-compensation: var(--tab-block-margin);
				transform-style: preserve-3d;
			}

			.tab-group-line {
				inset-inline-end: calc(
					var(--line-indent)
					- var(--line-outdent)
					- var(--line-overlap-length)
				);
				inset-block-end: calc(
					var(--tab-group-line-toolbar-border-distance)
					- var(--preserve-3d-block-compensation)
				);

				[animate-shifting] & {
					width: calc(
						var(--l)
						- var(--tab-overflow-clip-margin)
						- var(--line-indent)
						+ var(--line-outdent)
						+ var(--line-overlap-length)
						+ var(--width-rounding-diff)
					);
				}

				[movetarget] & {
					${__="--dragover-tab-group-color"}: var(--tab-group-color);
					${__}-invert: var(--tab-group-color-invert);

					tab-group[collapsed] & {
						/* the color of the multiselected active tab is overrided by the inverted one */
						background-color: var(--tab-group-line-color);

						tab-group[stacked] & {
							display: none;
						}
					}
				}

				/*override the rule that makes the lines of multiselected tabs invisible when dragging pinned tabs*/
				#tabbrowser-tabs[movingtab] & {
					${__="--dragover-tab-group-color"}: var(--tab-group-color);
					${__}-invert: var(--tab-group-color-invert);
				}
			}
		}
	}

	.tab-group-overflow-count-container {
		[collapsed][hasmultipletabs][hasactivetab] > & {
			display: flex;

			[stacked] > & {
				display: none;
			}
		}

		&::after {
			inset-inline-end: var(--group-line-padding) !important;
		}

		.tab-group-overflow-count {
			height: inherit;
			padding-inline-end: calc(var(--space-small) + var(--group-line-padding));
			align-content: center;
			padding-block: 0;
		}

		&:is([animate-shifting], [movetarget]) {
			.tab-group-overflow-count {
				margin-left: var(--width-rounding-diff);
				margin-top: var(--height-rounding-diff);
				padding-right: calc(var(--space-small) - var(--width-rounding-diff) + ${RTL_UI ? "0px" : "var(--group-line-padding)"});
			}

			&::after {
				right: calc(${RTL_UI ? "0px" : "var(--group-line-padding)"} - var(--width-rounding-diff)) !important;
			}
		}
	}

	/*bug #1990744*/
	& > :is(.tab-group-label-container, tab, tab-split-view-wrapper):not(
		:has(~ :is(tab, tab-split-view-wrapper)${visible}),
		[hasactivetab][hasmultipletabs][collapsed] > :is([selected], [hasactivetab])
	) {
		--line-overlap-length: 0px;
		--line-indent: ${appVersion > 144 ? "calc(var(--tab-border-radius) / 2)" : "0px"};
		--line-outdent: 0px;
		--line-border-radius: calc(var(--tab-group-line-thickness) / 2);

		&.tab-group-label-container {
			--line-indent: var(--group-line-padding);
		}

		tab-split-view-wrapper& {
			--line-indent: calc(var(--tab-border-radius) / 2 + var(--tab-overflow-clip-margin));
		}
	}

	&[stacked] > :is([hasactivetab], [selected]) {
		min-width: 0 !important;
		max-width: 0 !important;

		.tab-stack {
			overflow: hidden;
		}
	}
}

${_=".tabbrowser-tab"},
.tab-group-label-container,
.tab-group-overflow-count-container,
tab-split-view-wrapper {
	/*snap to end but not start as the first row may be occupied by the inline placeholder*/
	scroll-snap-align: end;
	margin: 0 !important;
	height: var(--tab-height, auto);
	-moz-window-dragging: no-drag;

	/*override the position:absolute of the fx rule*/
	&[dragtarget] {
		position: relative !important;
	}
}

/*override the rule that prevents the drop indicator display next to the dragged tab when pressing ctrl (fx115)*/
#tabbrowser-tabs[movingtab] > #tabbrowser-arrowscrollbox > ${_}:is([selected], [multiselected]) {
	pointer-events: auto;
}

[positionpinnedtabs] ${_}[pinned] {
	position: absolute !important; /*fx141+*/
	top: 0;
	inset-inline-start: 0;
	z-index: 1;
}

/* [class][class]: win over the default rule */
${_}${condition = prefs.pinnedTabsFlexWidth ? "[class][class]" : ":not([pinned])"} {
	/*make the animate smoother when opening/closing tab*/
	padding: 0;
}

#tabbrowser-tabs[orient] ${_}${condition}[fadein] {
	max-width: var(--tab-max-width);
	${__="min-width: var(--calculated-tab-min-width);"}

	:root[uidensity] &,
	&:is([muted], [soundplaying], [activemedia-blocked]) {
		${__}
	}
}

:is(
	${_},
	tab-split-view-wrapper
)[stacking] {
	position: absolute !important;
	top: calc(var(--stacking-top) - var(--scroll-top, 0px)) !important;
	inset-inline-start: var(--stacking-start) !important;
	opacity: var(--stacking-opacity);

	.tab-group-line {
		visibility: collapse;
	}
}

:is(
	${_},
	tab-split-view-wrapper
)[stacking=hidden] {
	visibility: hidden;
}

:is(
	${_}${prefs.pinnedTabsFlexWidth ? "" : ":not([pinned])"},
	tab-split-view-wrapper
)[stacking] {
	min-width: ${__="var(--stacking-size) !important"};
	max-width: ${__};
}

${_}[stacking]:not([stacking=hidden]) > .tab-stack,
${__="tab-split-view-wrapper[stacking]:not([stacking=hidden])"}::after,
${__} tab {
	transform: translateX(calc(
		(var(--focus-outline-width) + 1px)
		* var(--stacking-index)
		* ${DIR}
	));
}

/*
  currently there is no way to animate the appearance of tab/stack when stacking without affecting the group line.
  the transition is so short and not that noticable thus give up to do this
*/
/*
.tab-stack {
	--stacking-transition: opacity, transform;
	transition: var(--tab-animation) !important;
	transition-property: var(--stacking-transition) !important;
}
*/

${prefs.pinnedTabsFlexWidth ? `
	${_}[pinned] {
		--tab-label-mask-size: ${appVersion < 130 ? 2 : 1}em !important;
		flex: 100 100;
		min-width: var(--calculated-tab-min-width);
	}

	${_}[pinned]
		:is(
			.tab-throbber,
			.tab-icon-pending,
			.tab-icon-image,
			.tab-sharing-icon-overlay,
			.tab-icon-overlay
		)
	{
		margin-inline-end: var(--tab-icon-end-margin, 5.5px);

		tab:is(${showAudioButton}):not([mini-audio-button]) & {
			margin-inline-end: 2px;
		}
	}

	.tab-icon-image[pinned]:not([src]) {
		display: none;
	}
` : ``}

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
	overflow: clip;
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

#tabbrowser-tabs:not([secondarytext-unsupported]) .tab-label-container {
	height: min(2.7em, var(--tab-min-height));
}

:root[id] .tab-content[pinned] {
	padding-inline: calc(var(--tab-inline-padding) + var(--tab-pinned-inline-padding));
}

.tab-label {
	line-height: min(1em * var(--tab-label-line-height, 1.7), var(--tab-min-height));
}

.tab-close-button {
	padding-block: 0;
	object-fit: contain;
	height: min(24px, var(--tab-min-height));
}

.tab-icon-overlay:not([crashed])[pinned] {
	--size: max(min(var(--tab-min-height) - 6px, 16px), 12px);
	top: min(max(-7px, (16px - var(--tab-min-height)) / 2 + 2px), 0px);
	height: var(--size);
	width: var(--size);
}

.tab-audio-button::part(button) {
	--size: min(24px, var(--tab-min-height));
	--button-size-icon-small: var(--size);
	--button-min-height-small: var(--size);
}

#tabbrowser-tabs[id][id][id][id] tab-split-view-wrapper {
	--w: 0px;
	--width-rounding-diff: 0px;
	--splitview-width-rounding-diff: var(--width-rounding-diff);
	--splitview-outline-color: transparent;
	--splitview-outline-width: 1px;
	--splitview-background-color: transparent;
	--splitview-separator-color: var(--toolbarbutton-icon-fill);
	--splitview-tab-min-height: calc(var(--tab-min-height) - var(--tab-overflow-clip-margin) * 2);
	display: flex;
	align-items: center;
	position: relative;
	min-width: var(--tab-split-view-min-width);
	outline: 0;
	border-radius: 0;
	border: 0;
	padding: 0;
	background: none !important;

	&::after {
		--animate-width: calc(var(--w) + var(--width-rounding-diff));
		content: "";
		outline: var(--splitview-outline-width) solid var(--splitview-outline-color);
		outline-offset: calc(${outlineOffsetSnapping("var(--splitview-outline-width)")} * -1);
		background-color: var(--splitview-background-color);
		border-radius: var(--tab-border-radius);

		width: calc(100% - var(--tab-overflow-clip-margin) * 2 + var(--animate-width));
		height: calc(100% - var(--tab-block-margin) * 2);
		/*store the additional margin-inline-end size for calculating the current --w value*/
		min-height: calc(
			var(--tab-overflow-clip-margin)
			${__ = RTL_UI ? "+ var(--width-rounding-diff)" : ""}
			- var(--width-rounding-diff)
		);
		margin-inline:
			calc(-100% - var(--animate-width) + var(--tab-overflow-clip-margin))
			calc(0px - var(--animate-width) + var(--tab-overflow-clip-margin) ${__});
	}

	&[animate-shifting=run]::after {
		transition: var(--tab-animation);
		transition-property: width, margin-inline;
	}

	&[closing] {
		min-width: 0;
		max-width: 0;

		&::after {
			margin-inline-start: 0;
			width: 0;
			outline: 0;
			transition-property: margin-inline-end;
		}
	}

	&:is([hasactivetab], :has(> [multiselected])) {
		--splitview-background-color: var(--tab-hover-background-color);
		--splitview-separator-color: transparent;

		@media (forced-colors) {
			--splitview-outline-color: SelectedItem;
			--splitview-background-color: ButtonFace;
		}
	}

	&:not([hasactivetab]) {
		--splitview-outline-color: var(--tab-outline-color);

		tab-group[collapsed] & {
			max-height: var(--tab-height) !important;

			&[animate-shifting] {
				overflow: visible;
			}
		}

		&:hover {
			--splitview-background-color: var(--tab-hover-background-color);
			--splitview-outline-color: var(--tab-hover-outline-color);
		}
	}

	&:is(
		#tabbrowser-tabs[movingtab-group] &:is([dragover-groupTarget], [movetarget]),
		:not(:has(> :not([multiselected]))),
		[movetarget]:has(> [multiselected])
	) {
		--splitview-outline-color: var(--focus-outline-color);
		--splitview-background-color: var(--tab-selected-bgcolor);
		--splitview-separator-color: var(--splitview-outline-color);

		&:not([dragover-groupTarget])::after {
			box-shadow: var(--tab-selected-shadow);
		}

		#tabbrowser-tabs[movingtab-group] & {
			&[movetarget] {
				--splitview-outline-color: var(--dragover-tab-group-color);
				--splitview-outline-width: 2px;
			}

			&[dragover-groupTarget] {
				--splitview-outline-color: light-dark(var(--dragover-tab-group-color), var(--dragover-tab-group-color-pale));
				--splitview-background-color: light-dark(var(--dragover-tab-group-color-pale), var(--dragover-tab-group-color));
			}
		}

		&[hasactivetab] {
			--splitview-outline-width: 2px;
		}

		tab {
			.tab-background {
				visibility: hidden;
			}

			.tab-close-button {
				[hasactivetab] > tab:nth-last-child(1 of :not([closing])) & {
					display: flex;
				}

				tab:nth-last-child(2 of :not([closing])) & {
					display: none;
				}
			}

			[stacking] > & {
				z-index: 1;
			}
		}
	}

	tab[class][class][class][class] {
		--tab-overflow-clip-margin: inherit;
		border: 0;
		padding: 0;
		min-width: 0;
		scroll-snap-align: none;
		align-items: center;

		&:nth-last-child(2 of :not([closing]))::after {
			width: calc(var(--tab-overflow-clip-margin) / 2);
		}

		&:nth-child(2 of :not([closing])) {
			margin-inline-start: 1px !important;
			box-shadow:
				calc((var(--tab-block-margin) + var(--splitview-outline-width)) * ${-1 * DIR})
				0
				0
				calc(var(--tab-block-margin) * -1)
				var(--splitview-separator-color);

			tab-group[collapsed] :not([hasactivetab]) > & {
				box-shadow: none;
			}

			&::before {
				width: calc(var(--tab-overflow-clip-margin) / 2);
			}
		}

		&[closing] {
			&:first-child::after,
			&:last-child::before {
				width: 0;
			}
		}

		.tab-background {
			--tab-min-height: var(--splitview-tab-min-height);
			margin-block: calc(var(--tab-block-margin) + var(--tab-overflow-clip-margin));
			margin-inline: 0;

			tab[multiselected] & {
				outline-color: var(--focus-outline-color);
				background-color: var(--tab-selected-bgcolor);
			}

			tab:nth-child(1 of :not([closing])) & {
				margin-inline-start: var(--tab-overflow-clip-margin);
			}

			tab:nth-last-child(1 of :not([closing])) & {
				margin-inline-end: var(--tab-overflow-clip-margin);
			}
		}

		.tab-content {
			--tab-min-height: var(--splitview-tab-min-height);
			padding: 0;

			&::before, &::after {
				width: round(var(--space-medium), 1px);
			}
		}
	}
}

${prefs.pinnedTabsFlexWidth && appVersion < 139 ? ["ltr", "rtl"].map(dir => `
	${__=".tab-label-container[textoverflow]"}[labeldirection=${dir}],
	${__}:not([labeldirection]):-moz-locale-dir(${dir}) {
		direction: ${dir};
		mask-image: linear-gradient(to ${dir == "ltr" ? "left" : "right"}, transparent, black var(--tab-label-mask-size));
	}
`).join("\n") : ``}

/* for tabs with audio button, fix the size and display the button like pinned tabs */
#tabbrowser-tabs[orient] ${_}[fadein]:is(
	${showAudioButton}
)${prefs.pinnedTabsFlexWidth ? "[fadein]" : ":not([pinned])"} {
	&:is([mini-audio-button]) {
		&:not(${__ = "[image], [crashed], [sharing], [pictureinpicture], [busy]"})
			.tab-icon-overlay
		{
			display: none;
		}

		&:is(${__}) {
			--tab-icon-end-margin: 5.5px;

			.tab-audio-button {
				display: none !important;
			}
		}
	}
}

${_},
tab-split-view-wrapper,
.tab-group-label-container,
.closing-tabs-spacer {
	transition: none !important;
}

[movetarget],
[animate-shifting] {
	--width-rounding-diff: 0px;
	--height-rounding-diff: 0px;
}

[animate-shifting] > .tab-stack {
	will-change: margin-inline-end;
}

[animate-shifting] > .tab-stack > .tab-content {
	overflow: hidden;
}

[animate-shifting=start] {
	--x: 0px;
	--y: 0px;
	--w: 0px;
	z-index: 1;
	transition: none !important;
	translate: var(--x) var(--y);
}

[animate-shifting=start] > .tab-stack {
	margin-inline-end: calc(var(--w) * -1);
}

[movetarget] {
	--translate-x: 0px;
	--translate-y: var(--scroll-top, 0px) * -1;
	transform: translate(var(--translate-x), calc(var(--translate-y) + var(--scroll-top, 0px)));

	/* exclude the [movingtab-finishing] state since there is a position problem of the group line
	   when drag-to-group happens before the resizing of dragged tab finished (only the dragged one),
	   generally only happens in debug mode. adding the condition somehow fix the problem, but it seems only a workaround.
	 */
	#tabbrowser-tabs:not([movingtab-finishing]) & .tab-group-line,
	tab-split-view-wrapper&::before,
	&.tab-group-label-container::after,
	&.tab-group-overflow-count-container::after {
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

#tabbrowser-tabs[orient]
	${condition = `${_}:is([movetarget], [animate-shifting])`}
{
	overflow: visible;
}

${condition = `:not(tab-split-view-wrapper) > ` + condition}::${RTL_UI ? "before" : "after"} {
	margin-left: calc(var(--width-rounding-diff) * -1) !important;
}

${condition} .tab-stack > * {
	margin-bottom: calc(var(--height-rounding-diff) * -1) !important;
}

${condition} .tab-background {
	margin-bottom: calc(var(--tab-block-margin) - var(--height-rounding-diff)) !important;
}

${condition} .tab-content {
	margin-bottom: var(--height-rounding-diff) !important;
}

${__ = "[animate-shifting=run]"},
${__} :is(.tab-stack, .tab-group-line),
${__}:is(.tab-group-label-container, .tab-group-overflow-count-container)::after,
tab-split-view-wrapper${__}::before,
[movingtabgroup] ${__} :is(
	${__=".tab-group-label-hover-highlight"},
	${__} .tab-group-label
) {
	transition: var(--tab-animation) !important;
	transition-property: translate !important;

	tab& {
		tab-group[collapsed] > &:not([hasactivetab] > [selected])
			.tab-stack
		{
			overflow: hidden;
		}

		tab-group:not([collapsed]) &,
		[collapsed][hasactivetab]:not([stacked]) > &[selected] {
			overflow: visible;
		}
		/*TODO group line expands and shrinks a little when expanding group*/
	}
}

[animate-shifting=run] .tab-stack {
	transition-property: /*var(--stacking-transition),*/ margin-inline-end !important;

	.tab-group-line {
		transition-property: translate !important;
	}
}

${__="[movingtab-finishing] [animate-shifting=run]"},
${__} .tab-group-line,
${__}:is(tab-split-view-wrapper)::before,
${__}:is(.tab-group-label-container, .tab-group-overflow-count-container)::after,
[movingtab-finishing] [movingtabgroup] [animate-shifting=run] :is(
	${__=".tab-group-label-hover-highlight"},
	${__} .tab-group-label
) {
	transition-property: translate, transform !important;
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
	tab-group[collapsed] > tab:not([selected]),
	tab-group[stacked] > tab,
	tab-split-view-wrapper
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
	${_}[pinned][movetarget]
{
	z-index: 3;
}

${!prefs.autoCollapse ? `
	@media ${prefs.tabsUnderControlButtons >= 2 ? multiRows : "screen"} {
		${context=`#TabsToolbar:not([customizing])
			#tabbrowser-tabs:not([ignore-newtab-btn])${prefs.tabsUnderControlButtons < 2 ? ":not([overflow])" : ""}[hasadjacentnewtabbutton]`}
				${lastNode},
		${context} :is(${lastNode}, tab-group:has(> ${lastNode})) ~ [closing] {
			margin-inline-end: ${__ = "var(--new-tab-button-width)"} !important;

			/*shift tabs to prevent the animation run at wrong position*/
			tab-group[collapsed] > & {
				& ~ :nth-child(1 of :is(tab, tab-split-view-wrapper):not([hidden], [closing])) {
					margin-inline-start: calc(${__} * -1) !important;
				}

				& ~ :nth-last-child(1 of :is(tab, tab-split-view-wrapper):not([hidden], [closing])) {
					margin-inline-end: ${__} !important;
				}
			}

			/*TODO emtpy group?*/
		}

		${context} :is(${lastNode}, tab-group:has(> ${lastNode})) ~ [closing] {
			margin-inline-start: calc(var(--new-tab-button-width) * -1 - .1px) !important;

			tab-group[collapsed] > &:not(
				:nth-child(1 of :is(tab:not([hidden]), tab-split-view-wrapper)),
				:nth-last-child(1 of :is(tab:not([hidden]), tab-split-view-wrapper))
			) {
				margin-inline: -.1px 0 !important;
			}
		}
	}
` : ``}

#tabbrowser-tabs[forced-overflow] ${lastNode} {
	margin-inline-end: var(--forced-overflow-adjustment) !important;
}

/*
  move the margin-start to the last pinned, so that the first normal tab won't
  have a weird margin on the left when it is wrapped to new row. the important is necessary here.
  the [first-visible-unpinned-tab] is for fx 115 as it may not be updated in time and cause weird layout animation.
*/
#tabbrowser-tabs${context = `[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
	${_}:is(:nth-child(1 of :not([pinned], [hidden])), [first-visible-unpinned-tab])`}
{
	margin-inline-start: 0 !important;
}

#tabbrowser-tabs:not([hasadjacentnewtabbutton])${context}[closing] {
	margin-inline-start: -.1px !important;
}

#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
	:nth-last-child(
		1 of [pinned]:not([hidden], [stacking])
	):not(:nth-last-child(
		1 of :is(tab, tab-group, tab-split-view-wrapper)${visible}
	))
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

${condition="[ignore-newtab-btn]"}:not([overflow]) #tabbrowser-arrowscrollbox-periphery {
	margin-inline-end: calc(var(--new-tab-button-width) * -1);
}

#tabs-newtab-button {
	--toolbarbutton-outer-padding: var(--newtab-button-outer-padding);
	--toolbarbutton-inner-padding: var(--newtab-button-inner-padding);
}

[ignore-newtab-btn=singlerow] #tabs-newtab-button {
	mask-image: linear-gradient(to ${END}, black, transparent 67%);
}

${!prefs.autoCollapse ? `
	@media ${prefs.tabsUnderControlButtons >= 2 ? multiRows : "screen"} {
		#tabbrowser-tabs:not(${condition}) #tabs-newtab-button {
			margin-inline-start: calc(var(--new-tab-button-width) * -1) !important;
		}
	}
` : ``}

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
	#tabbrowser-tabs[overflow][hasadjacentnewtabbutton] ~
		#new-tab-button
{
	filter: opacity(0);
}

#TabsToolbar:not([customizing])
	#tabbrowser-tabs[overflow][hasadjacentnewtabbutton]:not([dragging], [movingtab-finishing]) ~
		#new-tab-button
{
	visibility: hidden;
}
*/

/*add [id] to win over the default rule*/
#tabbrowser-tabs[orient] > #pinned-drop-indicator[id] {
	display: flex;
	align-items: center;
	position: absolute;
	top: 0;
	inset-inline-start: calc(var(--pre-tabs-items-width) + var(--tabstrip-separator-size));
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
	width: calc(16px + (var(--tab-inline-padding) + var(--tab-pinned-inline-padding)) * 2);
	height: var(--tab-min-height);
	padding: 0;
	margin: var(--tab-block-margin) var(--tab-overflow-clip-margin);
	border-radius: var(--tab-border-radius);
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

[movingtab] #pinned-drop-indicator-icon {
	width: var(--size-item-small);
	height: var(--size-item-small);
	-moz-context-properties: fill;
	fill: currentColor;
	display: inline;
	filter: ${__="drop-shadow(0 0 1px light-dark(transparent, black))"} ${__};
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

	@media ${multiRows} {
		${prefs.tabsUnderControlButtons >= 2 ? `
			/*shift the post items to make them not cover the scrollbar, when there are no inline control buttons*/
			${nonTopMostTabsBar}[tabs-overflow] {
				padding-inline-end: var(--tabs-scrollbar-width);
			}
		` : ``}

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
		let box = $(`toolbar:not(${MENUBAR_AUTOHIDE}) .titlebar-buttonbox`, gNavToolbox);
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

	@media not ${singleRow} {
		${prefs.floatingBackdropClip && prefs.tabsUnderControlButtons >= 2 ? `
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
				${topMostTabsBar}${showPlaceHolder}:not(${tbDraggingHidePlaceHolder})
					#tabbrowser-tabs[overflow]
				{
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
			` : ``}
		`}
	}

	${win7 || win8 ? `
		/*Clip the scrollbar when dragging*/
		${topMostTabsBar}${showPlaceHolder}${tbDraggingHidePlaceHolder}${defaultTheme ? "" : "[tabs-scrolledtostart]"}
			#tabbrowser-tabs[overflow]
		{
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
		#tabbrowser-tabs:is([overflow], [positionpinnedtabs]) #tabbrowser-arrowscrollbox::part(items-wrapper)::before,
	${_}[tabs-scrolledtostart] #tabs-placeholder-post-tabs,
	${_}[tabs-scrolledtoend] #tabs-placeholder-new-tab-button {
		opacity: 0;
	}

	${_}:not([has-items-pre-tabs]) #tabs-placeholder-pre-tabs,
	${_}:not([has-items-post-tabs]) #tabs-placeholder-post-tabs,
	#tabbrowser-tabs:not([hasadjacentnewtabbutton]) #tabs-placeholder-new-tab-button,
	:is(${_}${hidePlaceHolder}, #tabbrowser-tabs:not([overflow], [positionpinnedtabs])) .tabs-placeholder {
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
					${!prefs.privateBrowsingIconOnNavBar ? `:root:not([privatebrowsingmode=temporary])` : ``}
						#toolbar-menubar:not(${MENUBAR_AUTOHIDE}) + #TabsToolbar,
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
			--toolbarbutton-outer-padding: inherit;
    		--toolbarbutton-inner-padding: inherit;
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

:root[multitabrows-applying-style] #navigator-toolbox,
:root[multitabrows-applying-style] #navigator-toolbox > toolbar {
	transition: none !important;
}

${debug && debug < 3 ? `
	${_="#tabbrowser-tabs"} {
		background: rgba(0,255,255,.2);
		box-shadow: 0 -5px rgba(0,255,0,.5);

		.tab-group-line {
			opacity: .75;
		}
	}
	${_}:hover {
		clip-path: none !important;
	}
	${_ = `#tabbrowser-tabs[orient][id][id]
			:is(
				.tabbrowser-tab, .tab-group-label-container,
				.tab-group-overflow-count-container, tab-split-view-wrapper
			)`}[style*=min-width] {
		background: rgba(0,255,0,.2) !important;
	}
	${_}:is([style*=max-width], [size-locked]) {
		background: rgba(255,0,0,.2) !important;
	}
	${_}:not(tab-split-view-wrapper)[elementIndex]::before {
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

	[ignore-newtab-btn] ${_} {
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
		style(root, {"--nav-toolbox-height": gNavToolbox.getBoundingClientRect().height + "px"})
	);

	function onLwtChange() {
		style(root, {"--multirows-background-position": ""});
		let cs = getComputedStyle(gNavToolbox);

		let bgImgs = [...cs.backgroundImage.matchAll(/(?<=url\(").+?(?="\))/g)].flat();
		Promise.all(bgImgs.map(src => new Promise(rs => {
			let img = new Image();
			img.onload = () => rs(img.height || 0);
			img.onerror = () => rs(0);
			img.src = src;
		}))).then(heights =>
			style(root, {"--lwt-background-image-natural-height": Math.max(0, ...heights) + "px"})
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
			style(root, {"--multirows-background-position": bgPos});
		else
			style(root, {"--nav-toolbox-height": ""});
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
			// eslint-disable-next-line no-cond-assign
			if (scrollbar = getScrollbar(this)) {
				scrollbar.addEventListener("click", () => this._ensureSnap(), true);
				for (let eType of ["mouseover", "mouseout"])
					scrollbar.addEventListener(eType, () => {
						let out = eType == "mouseout";
						scrollbar.style.MozWindowDragging = out ? "" : "no-drag";
						tabsBar.toggleAttribute("tabs-scrollbar-hovered", !out);
					}, true);
			} else
				return;

		//prevent the scrollbar fade in/out when clicking on tabs on windows 11
		scrollbar.style.opacity = 1;
	}, true);

	scrollbox.addEventListener("mouseleave", function(e) {
		if (e.target != this || !scrollbar?.isConnected)
			return;

		scrollbar.style.opacity = "";
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
			arrowScrollbox.scrollSnap = false;
			clearTimeout(snapTimeout);
			snapTimeout = setTimeout(() => {
				arrowScrollbox.scrollSnap = true;
				snapTimeout = setTimeout(() => {
					arrowScrollbox.scrollSnap = false;
					delete arrowScrollbox._isScrolling;
				});
			}, ensureSnapDelay);
		} else
			arrowScrollbox.scrollSnap = false;
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

	define(scrollbox, {
		scrollbarWidth: function() {
			return this.scrollTopMax ? scrollbarWidth : 0;
		},
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
		style(tabsBar, {"--tabs-scrollbar-width": overflow ? scrollbarWidth + "px" : ""});

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
			if (!tabContainer.isMovingTab) {
				tabContainer._unlockTabSizing({instant: true});
				tabContainer._handleTabSelect(true);
			}
		} else
			for (let tab of gBrowser._removingTabs)
				gBrowser.removeTab(tab);

		$$("#tab-preview-panel, #tabgroup-preview-panel").forEach(n => n[toggleAttr]("rolluponmousewheel", true));

		tabContainer._updateInlinePlaceHolder();
		tabContainer._updateCloseButtons();

		console?.timeEnd(`scrollbox ${e.type} ${e.detail}`);
	}
}

/** hack arrowScrollbox **/
{
	//fx 115, reset the cache in case the script is load after the box is overflowed
	delete arrowScrollbox._startEndProps;

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

	arrowScrollbox._canScrollToElement = function(n) {
		return (
			!isTab(n) ||
			(
				(n.visible ?? !n.hidden) &&
				!(n.pinned && tabContainer.positioningPinnedTabs)
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
				style(this, {"--scroll-top": scrollTop + "px"});
		}

		if (
			scrollTop != _lastScrollTop && scrollTopMax && scrollTopMax >= _lastScrollTop &&
			this.overflowing && !this.lockScroll
		) {
			if (!this._stopScrollSnap)
				this.scrollSnap = true;
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
		let {deltaY} = e;
		if (
			this._isScrolling ||
			!this.overflowing ||
			!deltaY ||
			tabContainer.switchByScrolling
		)
			return;
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
	define(arrowScrollbox, {
		//fx 115
		overflowing: {get: "overflowing"},

		lockScroll: {
			get: "lockscroll",
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
		},

		scrollSnap: "scrollsnap",
	}, false);
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

//hack MozTabSplitViewWrapper
const splitViewProto = customElements.get("tab-split-view-wrapper")?.prototype;
if (splitViewProto) {
	define(splitViewProto, {
		elementIndex: "dragAndDropElements" in tabContainer &&
			{
				get: function() {
					return +this.getAttribute("elementIndex");
				},
				set: function(v) {
					this.setAttribute("elementIndex", v);
				},
			},

		selected: function() {
			return this.hasActiveTab;
		},

		_tPos: function() {
			return this.visibleTabs[0]?._tPos;
		},

		multiselected: function() {
			let {selectedNodes: n} = gBrowser;
			return !!(n[1] && n.includes(this));
		},

		pinned: function() {
			return false;
		},

		stacking: {
			get: function() {
				return this.getAttribute("stacking") || false;
			},
			set: function(v) {
				this[v ? "setAttribute" : "removeAttribute"]("stacking", v);
			},
		},

		visible: function() {
			return this.group?.isTabVisibleInGroup(this) != false;
		},

		visibleTabs: function() {
			return this.tabs.filter(t => t.visible);
		},
	});

	/* #splitview-patch for fx 146*/
	define(splitViewProto, {
		group: function() {
			return this.tabs[0]?.group;
		},
	}, false);
	/******/

	let {reverseTabs} = splitViewProto;

	assign(splitViewProto, {
		reverseTabs: function() {
			animateLayout(() => reverseTabs.call(this), {nodes: this.tabs});
		},

		scrollIntoView,
	});
}

//hack MozTabbrowserTabGroup
const groupProto = customElements.get("tab-group")?.prototype;
if (groupProto) {
	const INITIALIZED = Symbol("initialized");
	const CLICKED_BY_MOUSE = Symbol("clickedByMouse");
	const elementIndexOpd = {
		set: function(v) {
			v = +v;
			let {group} = this;
			let container = group.labelContainerElement;
			container.setAttribute("elementIndex", container.elementIndex = v);
			group.overflowContainer?.setAttribute(
				"elementIndex",
				v + group[
					"dragAndDropElements" in tabContainer ? "visibleTabLikes" : "visibleTabs"
				].length + .5,
			);
		},
		get: function() { return this.group.labelContainerElement.elementIndex },
	};

	const {ungroupTabs, remove, dispatchEvent, on_click, addTabs} = groupProto;
	const opd = Object.getOwnPropertyDescriptors(groupProto);

	define(groupProto, {
		label: {
			get: opd.label.get,
			set: function(v) {
				if (this.isConnected && isCalledBy("#setMlGroupLabel"))
					rAF(tabContainer.isFinishingTabMove ? 2 : 0)
						.then(() => animateLayout(() => opd.label.set.call(this, v)));
				else
					opd.label.set.call(this, v);
			},
		},

		collapsed: {
			get: opd.collapsed.get,
			set: function(v) {
				if (isCalledBy("[_#]expandGroupOnDrop"))
					return;

				let dragging = v && isCalledBy("on_drag(start|over)");
				let willStack = dragging && tabContainer.tabDragAndDrop.multiselectStacking;

				if (
					!this.isConnected ||
					!!v == this.collapsed && (!willStack || this.togglingAnimation)
				) {
					opd.collapsed.set.call(this, v);
					return;
				}

				let nodes = getNodes({newTabButton: true, includeClosing: true});
				if (!v) {
					nodes = nodes.filter(n => n != this.overflowContainer);
					nodes.push(...this.nonHiddenTabLikes.filter(t => !t.visible));
				}

				this.togglingAnimation = animateLayout(async () => {
					if (!v)
						this.stacked = false;
					else if (this[CLICKED_BY_MOUSE] || tabContainer.isMovingTab) {
						tabContainer._lockTabSizing(this.labelElement);
						this.stacked = willStack;
					}

					opd.collapsed.set.call(this, v);

					this.setAttribute("toggling", v ? "collapse" : "expand");

					if (!v)
						tabContainer._unlockTabSizing();
					else if (!willStack && this.isShowingOverflowCount)
						return this.overflowContainer;
				}, {
					nodes: dragging
						? nodes.filter(n =>
							n != this.labelContainerElement
							// !this.contains(n)
						)
						: nodes,
				}).then(() => {
					delete this.togglingAnimation;
					this.removeAttribute("toggling");
				});
			},
		},

		visibleTabs: function() {
			return this.tabs.filter(t => t.visible);
		},

		nonHiddenTabs: function() {
			return this.tabs.filter(t => !t.hidden);
		},

		tabLikes: function() {
			return [...this.children].filter(isTabLike);
		},

		visibleTabLikes: function() {
			return this.tabLikes.filter(t => t.visible);
		},

		nonHiddenTabLikes: function() {
			return this.tabLikes.filter(t => !t.hidden);
		},

		isBeingDragged: {
			get: "movingtabgroup",
			set: function(v) {
				//the attribute is handled all by this script
				if (isCalledBy("[_#]setIsDraggingTabGroup"))
					return;
				this.toggleAttribute("movingtabgroup", !!v);
			},
		},

		isShowingOverflowCount: function() {
			return this.overflowContainer?.checkVisibility({visibilityProperty: true});
		},

		stacked: {
			get: "stacked",
			set: function(v) {
				v = !!v;
				if (v == this.stacked || !this.hasActiveTab)
					return;
				this.toggleAttribute("stacked", v);
				tabContainer._invalidateCachedTabs();
			},
		},
	});

	define(groupProto, {
		labelContainerElement: function() {
			return this._labelContainerElement ??= $(".tab-group-label-container", this);
		},

		overflowContainer: "overflowCountLabel" in groupProto &&
			function() {
				return this._overflowContainer ??= $(".tab-group-overflow-count-container", this);
			},
	}, false);

	assign(groupProto, {
		on_click: function(e) {
			if (e.inputSource == MouseEvent.MOZ_SOURCE_MOUSE)
				this[CLICKED_BY_MOUSE] = true;
			on_click.apply(this, arguments);
			delete this[CLICKED_BY_MOUSE];
		},

		ungroupTabs: function() {
			animateLayout(() => {
				let collapsedTabs = this.collapsed && !this.togglingAnimation
					? this.nonHiddenTabLikes.filter(t => !t.visible) //TODO splitview
					: null;
				ungroupTabs.apply(this, arguments);
				this.style.display = "none";
				tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
				return collapsedTabs;
			});
		},

		addTabs: function(tabs) {
			let run = () => addTabs.apply(this, arguments);
			if (isCalledBy("on_drop"))
				run();
			else
				animateLayout(() => {
					let showingOC = this.isShowingOverflowCount;
					if (tabs[0]?.ownerGlobal != window) {
						let oldTabs = this.tabLikes;
						tabs[0].container.animateLayout(run);
						return this.tabLikes.filter(t => !oldTabs.includes(t));
					} else
						run();
					this.refreshState();
					if (!showingOC && this.isShowingOverflowCount)
						return this.overflowContainer;
				});
		},

		remove: function() {
			if (tabContainer.isMovingTab)
				return;
			this.removingAnimation = animateLayout(() => {
				remove.call(this);
				tabContainer._invalidateCachedTabs();
			}, {
				nodes: getNodes({newTabButton: true, includeClosing: true}).filter(t => t != this.labelContainerElement),
			}).then(() => delete this.removingAnimation);
		},

		dispatchEvent: function(e) {
			if (e.type == "TabGroupRemoved" && tabContainer.isMovingTab)
				return false;
			return dispatchEvent.apply(this, arguments);
		},

		isTabVisibleInGroup: function(tab) {
			return !this.collapsed ||
				(asNode(tab).selected && !this.stacked);
		},

		refreshState: async function() {
			let {hasActiveTab} = this;
			if (hasActiveTab == null) return;

			let isSelectedGroup = gBrowser.selectedTab.group == this;
			if (hasActiveTab || isSelectedGroup) {
				let totalCount = this.nonHiddenTabs.length;
				let overflowCount = totalCount - this.visibleTabs.length;
				let hasMultipleTabs = this.collapsed
					? overflowCount > 0
					: totalCount > 1;
				let overflowCountText = overflowCount
					? gBrowser.tabLocalization.formatValue(
						"tab-group-overflow-count",
						{tabCount: overflowCount},
					)
					: "";

				if (
					hasActiveTab != isSelectedGroup ||
					this.hasAttribute("hasmultipletabs") != hasMultipleTabs ||
					isSelectedGroup && this.overflowCountLabel.textContent != (overflowCountText = await overflowCountText)
				)
					await animateLayout(() => {
						let {tabLikes, isShowingOverflowCount: overflowing} = this;
						if (tabLikes[0])
							this.appendChild(tabLikes.at(-1));
						this.hasActiveTab = isSelectedGroup;
						this.toggleAttribute("hasmultipletabs", hasMultipleTabs);
						this.overflowCountLabel.textContent = overflowCountText;
						if (!overflowing && this.isShowingOverflowCount)
							return this.overflowContainer;
					});
			}
		},
	});
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
		if (g[INITIALIZED])
			return;
		let label = g.labelElement;
		let idx = label.elementIndex;
		define(label, {elementIndex: elementIndexOpd});
		assign(label, {scrollIntoView});
		assign(g.labelContainerElement, {scrollIntoView});
		label.elementIndex = idx;
		for (let e of ["overflow", "underflow"])
			label.addEventListener(e, onLabelFlowChange);
		g[INITIALIZED] = true;
	}

	/** @param {Event} e */
	function onLabelFlowChange(e) {
		this.toggleAttribute("overflow", e.type == "overflow");
	}
}

//hack MozTabbrowserTab
const tabProto = customElements.get("tabbrowser-tab").prototype;
{
	let eleIdxOpd = Object.getOwnPropertyDescriptor(tabProto, "elementIndex");
	define(tabProto, {
		elementIndex: "elementIndex" in tabProto &&
			{
				get: eleIdxOpd.get,
				set: function(v) {
					eleIdxOpd.set.call(this, v);
					this.setAttribute("elementIndex", v);
					if (!("dragAndDropElements" in tabContainer)) {
						let {splitview} = this;
						if (this == splitview?.visibleTabs[0])
							splitview.setAttribute("elementIndex", v - .1);
					}
				},
			},

		stack: function() {
			return this._stack ??= $(".tab-stack", this);
		},

		stacking: {
			get: function() {
				return this.getAttribute("stacking") || false;
			},
			set: function(v) {
				this[v ? "setAttribute" : "removeAttribute"]("stacking", v);
			},
		},
	});

	assign(tabProto, {scrollIntoView});
}

/** hack tabDragAndDrop **/
let GET_DRAG_TARGET;
{
	let HANDLE;
	if (window.TabDragAndDrop) {
		/*global TabDragAndDrop*/
		let constructorString = TabDragAndDrop.toString().replace(/(^(\s+([gs]et\s+)?)|this.)(#)/mg, "$1_");

		/* #splitview-patch */
		constructorString = constructorString.replace(
			"let browser = isTab(tab) && tab.linkedBrowser;",
			"let browser = isTabLike(tab) && (tab.tabs?.[0] ?? tab).linkedBrowser;",
		).replace(
			"(isTab(sourceNode) || isTabGroupLabel(sourceNode))",
			"(isTabLike(sourceNode) || isTabGroupLabel(sourceNode))",
		).replace(
			"isTab(target) || isTabGroupLabel(target)",
			"isTabLike(target) || isTabGroupLabel(target)",
		).replace(
			/isTabGroupLabel\(dropElement\)\s+&&\s+isTab\(draggedTab\)/,
			"isTabGroupLabel(dropElement) && isTabLike(draggedTab)",
		);
		/******/

		eval(`
			let {console} = window;
			window.TabDragAndDrop = ${constructorString};
		`);

		assign(TabDragAndDrop.prototype, {
			_updateTabStylesOnDrag: emptyFunc,
			_resetTabsAfterDrop: emptyFunc,
			_moveTogetherSelectedTabs: emptyFunc,
		});

		(tabContainer.tabDragAndDrop = new TabDragAndDrop(tabContainer)).init();

		if (window.TabStacking)
			window.TabStacking = TabDragAndDrop;

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

	const dragDropProto = tabContainer.tabDragAndDrop.__proto__;

	const FINISH_ANIMATE_TAB_MOVE = dragDropProto.finishAnimateTabMove
		? "finishAnimateTabMove"
		: "_finishAnimateTabMove";

	GET_DRAG_TARGET = dragDropProto._getDragTarget
		? "_getDragTarget"
		: "_getDragTargetTab";

	const {
		[GET_DRAG_TARGET]: _getDragTarget,
		startTabDrag,
		[`${HANDLE}_dragover`]: handle_dragover,
		[`${HANDLE}_dragend`]: handle_dragend,
		[`${HANDLE}_drop`]: handle_drop,
		[`${HANDLE}_dragleave`]: handle_dragleave,
		[FINISH_ANIMATE_TAB_MOVE]: finishAnimateTabMove,
	} = dragDropProto;

	dragDropProto.multiselectStacking = getPref("browser.tabs.dragDrop.multiselectStacking", "Bool");

	dragDropProto.createMouseDownData = function(e, tab) {
		let {x, y} = e;
		let rect = getRect(asNode(tab));
		return {
			atTabXPercent: (x - rect.x) / rect.width,
			oriX: x,
			oriY: y,
			oriNodeRect: rect,
			tab, x, y,
		};
	};

	/* #splitview-patch */
	dragDropProto[GET_DRAG_TARGET] = function() {
		let target = _getDragTarget.apply(this, arguments);
		return target?.splitview ?? target;
	};
	/******/

	dragDropProto.startTabDrag = function(e, tab, opt) {
		let draggingTab = isTabLike(tab);
		let {pinned} = tab;
		let {selectedTabs, selectedNodes} = gBrowser;

		//on fx115, ctrl click on another tab and start dragging, the clicked tab won't be [selected],
		//the _dragData is set on it but the data is expected to be bound on [selected] thus things go messed up
		//it is also the fix for bug #1987160
		if (draggingTab && !tab.selected && !opt?.fromTabList) {
			tabContainer.selectedItem = tab;
			for (let t of [...selectedTabs, tab])
				gBrowser.addToMultiSelectedTabs(t);
			({selectedTabs} = gBrowser);
		}

		let movingTabs = draggingTab ? selectedNodes.filter(t => t.pinned == pinned) : [tab];
		let stopAnimateTabMove;

		if (movingTabs.length > prefs.animateTabMoveMaxCount) {
			//in case opt is null
			opt = assign(opt, {fromTabList: true});
			stopAnimateTabMove = true;
		}

		let useCustomGrouping = tab.multiselected;
		let {removeFromMultiSelectedTabs} = gBrowser;
		if (useCustomGrouping) {
			if (movingTabs[1])
				this._groupSelectedTabs(tab, movingTabs);

			if (this._moveTogetherSelectedTabs)
				//prevent the pinned tabs being unslected when dragging normal tabs, or vice versa
				gBrowser.removeFromMultiSelectedTabs = emptyFunc;
			else
				//prevent the excecution of #moveTogetherSelectedTabs or _groupSelectedTabs
				//it also prevents the unselecting as above
				tab.removeAttribute("multiselected");
		}

		if (prefs.hideDragPreview == (draggingTab ? 2 : 1) || prefs.hideDragPreview == 3) {
			let dt = e.dataTransfer;
			dt.setDragImage(document.createElement("div"), 0, 0);
			dt.updateDragImage = dt.setDragImage = emptyFunc;
		}

		nullifyNativeDragStyle(() => startTabDrag.call(this, e, tab, opt), tab, "#updateTabStylesOnDrag");

		(draggingTab ? tab : tab.group.labelContainerElement).removeAttribute("dragtarget");

		if (!draggingTab)
			tab.group.collapsed = true;

		let {_dragData} = tab;

		//if it is from tab list, there is no mouse down data
		let data =
			tabContainer._lastMouseDownData ||
			//in case the mouse down data is missing
			!opt?.fromTabList && this.createMouseDownData(e, tab);
		assign(_dragData, data);

		assign(_dragData, {
			stopAnimateTabMove,
			pinned: !!pinned,
			draggingTab,
			movingTabs,
			scrollPos: scrollbox.scrollTop, //fx115
			movingPositionPinned: pinned && tabContainer.positioningPinnedTabs,
		});

		delete tabContainer._lastMouseDownData;
		tabContainer._hideFakeScrollbar();

		//fix the movingTabs as the original is told that there is no multiselect
		if (useCustomGrouping) {
			if (isTab(tab))
				tab.setAttribute("multiselected", true);
			assign(gBrowser, {removeFromMultiSelectedTabs});
		}
	};

	//since the original _groupSelectedTabs will modify the transform property
	//and cause improper transition animation,
	//rewite the whole _groupSelectedTabs and not execute the original one
	dragDropProto._groupSelectedTabs = function(draggedTab, movingTabs) {
		console?.time("_groupSelectedTabs");

		let groupData = new Map();
		let {pinned} = draggedTab;
		let {selectedNodes} = gBrowser;
		let nodes = getNodes({onlyFocusable: true});
		let pinnedTabs = [], normalTabs = [];

		for (let t of selectedNodes)
			(t.pinned ? pinnedTabs : normalTabs).push(t);

		[
			[pinnedTabs, pinned ? draggedTab : pinnedTabs.at(-1)],
			[normalTabs, pinned ? normalTabs[0] : draggedTab],
		].forEach(([tabs, centerTab]) => {
			if (!centerTab) return;

			let _tPos = pos(centerTab);
			let centerIdx = nodes.indexOf(centerTab);
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
			let oldIndex = nodes.indexOf(movingTab);
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
				let middle = nodes[i];

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

		let tabIndex = selectedNodes.indexOf(draggedTab);
		let shouldGroup = selectedNodes.some(t => {
			let {newPos} = groupData.get(t) || {};
			return newPos > -1 && newPos != pos(t);
		});
		let run = () => {
			for (let i = 0; i < tabIndex; i++)
				moveTab(i);
			for (let i = selectedNodes.length - 1; i > tabIndex; i--)
				moveTab(i);
		};

		if (shouldGroup) {
			if (
				this.multiselectStacking &&
				(draggedTab == movingTabs[0] || !prefs.dragStackPreceding)
			)
				tabContainer._lockTabSizing(draggedTab, {stacking: true});
			animateLayout(run);
		} else
			run();

		console?.timeEnd("_groupSelectedTabs");

		/**
		 * @param {number} i
		 */
		function moveTab(i) {
			let t = selectedNodes[i];
			let data = groupData.get(t);
			let {newPos} = data;
			if (newPos > -1 && newPos != pos(t))
				gBrowser[data.beforeCenter ? "moveTabsBefore" : "moveTabsAfter"]([t], data.centerTab);
		}

		/**
		 * @param {(MozTabbrowserTab|MozTabSplitViewWrapper)} item
		 */
		function pos(item) {
			return isSplitViewWrapper(item)
				? item.tabs[0].elementIndex
				: item.elementIndex ?? item._tPos;
		}
	};

	dragDropProto[`${HANDLE}_dragover`] = function(e) {
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
		if (tabContainer.isFinishingTabMove)
			return;

		if (["", "none"].includes(this.getDropEffectForTabDrag(e))) {
			handle_dragover.apply(this, arguments);
			return;
		}

		let dt = e.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let draggingTab = isTab(draggedTab); /* TODO splitview support */
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
				let movingPositionPinned = movingPinned && tabContainer.positioningPinnedTabs;
				tabContainer.toggleAttribute("moving-pinned-tab", movingPinned);
				tabContainer.toggleAttribute("moving-positioned-tab", movingPositionPinned);
				tabsBar.toggleAttribute("moving-positioned-tab", movingPositionPinned);
			}

			console?.timeEnd("on_dragover - setup");
		}

		let ind = this._tabDropIndicator;

		console?.time("original on_dragover");

		let hidden;
		define(ind, {
			//when copying tab in the same window,
			//the original on_dragover hide the indicator (modify DOM), measure arrowScrollbox,
			//and show the indicator (modify DOM again), cause serious reflow problem and terribly lag.
			hidden: {set: v => hidden = v},
			//ignore the transform setting
			style: () => ({}),
		});

		try {
			handle_dragover.apply(this, arguments);
		} finally {
			delete ind.hidden;
			delete ind.style;
		}

		console?.timeEnd("original on_dragover");

		let target = this[GET_DRAG_TARGET](e);
		const {isMovingTab} = tabContainer;
		const allowToPin = draggingTab && !prefs.disableDragToPinOrUnpin;
		const updatePinState = sameWindow && !copy &&
			allowToPin && target &&
			draggedTab.pinned != !!target.pinned;
		const allowIndToPin = NATIVE_DRAG_TO_PIN && allowToPin;

		if (updatePinState)
			hidden = false;
		else
			delete draggedTab?._dragData?.newPinState;

		switch (e.originalTarget) {
			case arrowScrollbox._scrollButtonUp:
			case arrowScrollbox._scrollButtonDown:
				hidden = true;
		}

		if (hidden != null)
			ind.hidden = hidden;

		if (hidden) {
			if (isMovingTab)
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

		if (isMovingTab) {
			let {_dragData} = draggedTab;
			if (updatePinState) {
				let {pinned} = _dragData;
				if (pinned)
					target = firstNonPinned;
				else {
					target = nodes[numPinned - 1];
					tabContainer.removeAttribute(MOVINGTAB_GROUP);
					tabContainer.removeAttribute("movingtab-addToGroup");
					this[CLEAR_DRAG_OVER_GROUPING_TIMER]?.();
					this._setDragOverGroupColor?.(null);
					delete _dragData.shouldCreateGroupOnDrop;
				}
				idx = numPinned;
				_dragData.newPinState = !pinned;
			} else
				delete _dragData.newPinState;
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
					if (!allowIndToPin || !target) {
						//limit the drop range
						lastNode = nodes[lastIdx = numPinned - 1];
						if (!target?.pinned)
							idx = numPinned;
					}
				}
				//dragging a node at void
				else if (!target)
					idx = lastIdx + 1;
				//dragging a node to pinned area but can't pin
				else if (!allowIndToPin && target.pinned)
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
					!(allowIndToPin && target?.pinned) && sameWindow ||
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

	dragDropProto._animateTabMove = function(e) {
		const tabGroupsEnabled = gBrowser._tabGroupsEnabled;
		const dragToGroupTabs = prefs.dragToGroupTabs && tabGroupsEnabled;
		const draggedTab = e.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);
		const {_dragData} = draggedTab;
		let {
			pinned, recursion, draggingTab, movingTabs, movingPositionPinned,
			lastX, lastY, oriX, oriY,
		} = _dragData;
		const pinDropInd = draggingTab && !prefs.hidePinnedDropIndicator && !movingTabs.some(t => !isTab(t)) /* TODO: splitview */
			? this._pinnedDropIndicator
			: null;

		const TIMER = "_animateTabMove" + (recursion ? "_recursion" : "");
		console?.time(TIMER);

		/* prototype of drag to pin/unpin */
		// if (!prefs.disableDragToPinOrUnpin) {
		// 	let dragOverTarget = this[GET_DRAG_TARGET](e);
		// 	if (draggingTab && dragOverTarget && !!dragOverTarget.pinned != pinned) {
		// 		for (let t of movingTabs)
		// 			gBrowser[pinned ? "unpinTab" : "pinTab"](t);
		// 		// gBrowser[pinned ? "moveTabsBefore" : "moveTabsAfter"](movingTabs, dragOverTarget);
		// 		pinned = !pinned;
		// 		movingPositionPinned = pinned && tabContainer.positioningPinnedTabs;
		// 		assign(_dragData, {pinned, movingPositionPinned});
		// 		lastX = null;
		// 		tabsBar.removeAttribute("movingtab");
		// 	}
		// }

		const {x, y} = e;
		const scrollPos = movingPositionPinned ? 0 : scrollbox.scrollTop;

		//the animate maybe interrupted and restart, don't initialize again
		if (lastX == null) {
			let draggedNode = asNode(draggedTab);
			let numPinned = gBrowser.pinnedTabCount;

			let movingNodes;
			if (draggingTab)
				movingNodes = movingTabs;
			else {
				let {group} = draggedTab;
				movingNodes = [group.labelContainerElement];
				if (group.hasActiveTab && !this.multiselectStacking) {
					//in case there is actually no visible tabs (firefox bug)
					movingNodes.push(...group.visibleTabLikes);
					if (group.isShowingOverflowCount)
						movingNodes.push(group.overflowContainer);
				}
			}
			//set boxTop before updating nodes
			assign(_dragData, {
				boxTop: getRect(scrollbox).y,
				lastScrollPos: scrollPos,
				movingNodes,
				draggedNode,
			});
			if (movingPositionPinned)
				_dragData.scrollPos = 0;

			let moveOverThreshold = tabGroupsEnabled
				? Math.min(1, Math.max(0, getPref("browser.tabs.dragDrop.moveOverThresholdPercent", "Int") / 100))
				: .5;
			let groupThreshold = 1 - moveOverThreshold;

			assign(_dragData, {
				numPinned,
				moveOverThreshold,
				groupThreshold,
				createGroupDelay: dragToGroupTabs && getPref("browser.tabs.dragDrop.createGroup.delayMS", "Int"),
			});

			console?.timeLog(TIMER, "init");
			console?.log(_dragData);
		}

		let {numPinned, movingNodes, draggedNode} = _dragData;

		let groupOfDraggedNode = draggedTab.group;
		let draggedGroup = !draggingTab ? groupOfDraggedNode : null;

		if (!tabsBar.hasAttribute("movingtab")) {
			assign(this, {_dragData});

			InspectorUtils.addPseudoClassLock(draggedNode, ":hover");
			if (draggedGroup) {
				//in case the group is open after pressing ctrl
				draggedGroup.collapsed = true;
				tabContainer.setAttribute("moving-tabgroup", "");
				gNavToolbox.setAttribute("moving-tabgroup", "");
				draggedGroup.setAttribute("movingtabgroup", "");
			}
			tabContainer.setAttribute("movingtab", true);
			gNavToolbox.setAttribute("movingtab", true);
			tabsBar.setAttribute("movingtab", "");
			if (draggingTab && !draggedTab.multiselected)
				tabContainer.selectedItem = draggedTab;
			style(arrowScrollbox, {"--scroll-top": scrollPos + "px"});
			tabContainer.toggleAttribute("moving-single-tab", !movingNodes[1]);

			//these three has set at on_dragover early but they will removed when the dragging is paused
			let positionPinned = pinned && tabContainer.positioningPinnedTabs;
			tabContainer.toggleAttribute("moving-pinned-tab", pinned);
			tabContainer.toggleAttribute("moving-positioned-tab", positionPinned);
			tabsBar.toggleAttribute("moving-positioned-tab", positionPinned);

			for (let n of
				(_dragData.expandGroupOnDrop || draggedGroup?.hasActiveTab && this.multiselectStacking)
					? [...movingNodes, ...draggedGroup.nonHiddenTabLikes]
					: movingNodes
			)
				n.setAttribute("movetarget", "");

			/* stack tabs */
			if (
				draggingTab &&
				movingTabs[1] &&
				this.multiselectStacking
			) {
				let draggedIdx = movingTabs.indexOf(draggedTab);
				let followingTabs = movingTabs.slice(draggedIdx + 1);

				if (followingTabs[0] || prefs.dragStackPreceding)
					_dragData.stacking = animateLayout(() => {
						//set it truthy first for the following code to determine
						_dragData.stacking = true;

						let precedingTabs = movingTabs.slice(0, draggedIdx);
						let stackPreceding = prefs.dragStackPreceding && precedingTabs[0];
						let leader = stackPreceding ? movingTabs[0] : draggedTab;
						style(tabContainer, {"--stacking-size": getRect(leader).width + "px"});

						/*
						  it's better to not lock when stacking in flow pinned tabs
						  since it looks weird that the tab in next row may sneak in.
						  and currently the placeholder logic on 115 doesn't work with wrapping locked tabs
						*/
						if (
							!pinned ||
							movingPositionPinned ||
							prefs.pinnedTabsFlexWidth ||
							//may want to ignore the new tabs button if there is only pinned tabs
							getNodes({onlyFocusable: true}).at(-1).pinned
						)
							tabContainer._lockTabSizing(leader, {stacking: true});

						if (stackPreceding)
							precedingTabs.reverse().forEach((t, i) => setStackingVar(t, i, true));
						followingTabs.forEach((t, i) => setStackingVar(t, i, false));

						if (movingPositionPinned)
							tabContainer._positionPinnedTabs();
						tabContainer._updateInlinePlaceHolder();
					}, {shouldUpdatePlacholder: false});

				/**
				 * @param {MozTabbrowserTab} t
				 * @param {number} i
				 * @param {boolean} preceding
				 */
				function setStackingVar(t, i, preceding) {
					let idx = i + 1;
					let opacity = 1 / Math.pow(2, idx);
					if (opacity < .05)
						opacity = 0;
					if (opacity) {
						t.stacking = preceding ? "preceding" : "following";
						style(t, {
							"--stacking-index": idx * (preceding ? -1 : 1),
							"--stacking-opacity": opacity,
						});
					} else
						t.stacking = "hidden";
				}
			}

			updateNodeRects();
			updateOriPos();
		}

		_dragData.lastScrollPos = scrollPos;

		if (!_dragData.needsUpdate && x == lastX && y == lastY && !arrowScrollbox._isScrolling) {
			console?.timeEnd(TIMER);
			return;
		}

		if (lastX != null && draggingTab && !prefs.disableDragToPinOrUnpin) {
			let dragOverTarget = this[GET_DRAG_TARGET](e);
			if (
				dragOverTarget &&
				!!dragOverTarget.pinned != pinned &&
				!isSplitViewWrapper(draggedTab) //TODO: splitview
			) {
				console?.timeEnd(TIMER);
				return;
			}
		}

		delete _dragData.needsUpdate;

		console?.debug(`animate tab move, recursion=${recursion}`, x, y);

		let {
			moveForward,
			nodes, nodeRects,
			boxTop,
			moveOverThreshold, groupThreshold, createGroupDelay,
		} = _dragData;

		let dirX = Math.sign(x - (lastX ?? oriX));

		assign(_dragData, {lastX: x, lastY: y});

		let tranX, tranY, rTranX, rTranY, cursorRow;

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
			let visibleNodes = nodes.filter(n => !n.stacking && rect(n)?.width);
			let rects = visibleNodes.map(n => rect(n));
			firstRect = rects[0];
			lastRect = rects.at(-1);
			movingNodes.find(n => !n.stacking && (firstMovingRect = rect(n)));
			movingNodes.findLast(n => !n.stacking && (lastMovingRect = rect(n)));

			let scrollChange = scrollPos - _dragData.scrollPos;

			cursorRow = Math.min(
				Math.max(
					Math.floor(
						(draggedRect.y + draggedRect.height / 2 + tranY + scrollPos + scrollChange - boxTop)
						/ tabHeight
					),
					firstRect.row,
				),
				lastRect.row,
			);

			let firstRectInCursorRow = rects.find(r => r.row == cursorRow);
			let lastRectInCursorRow = rects.findLast(r => r.row == cursorRow);

			let precedingNode = nodes[firstMovingIdx - 1];
			let followingNode = nodes[lastMovingIdx + 1];
			let precedingGroup = precedingNode?.closest("tab-group");
			let followingGroup = followingNode?.closest("tab-group");
			let extraShiftStart = getExtraShiftSpace(true);
			let extraShiftEnd = getExtraShiftSpace(false);

			rTranX -= Math.min(pointDeltaH(draggedRect.start + rTranX, firstRectInCursorRow.start - extraShiftStart), 0) * DIR;
			rTranX += Math.min(pointDeltaH(lastRectInCursorRow.end + extraShiftEnd, draggedRect.end + rTranX), 0) * DIR;

			console?.debug("restrict tranX", rTranX - tranX, cursorRow, firstRectInCursorRow, lastRectInCursorRow, rects);

			if (
				firstMovingRect.row == firstRect.row ||
				cursorRow - draggedRect.row + firstMovingRect.row == firstRect.row
			) {
				if (
					(draggingTab || nodes[0] == movingNodes[0]) &&
					cursorRow < draggedRect.row && firstMovingRect.row == firstRect.row
				)
					rTranX -= pointDeltaH(firstMovingRect.start + rTranX, firstRect.start) * DIR;
				//don't restrict in the cases the node is placed to the end of previous row
				//instead of the location of dragging over typically when dragging a unnammed tab group to the row start
				else if (cursorRow == draggedRect.row)
					rTranX -= Math.min(pointDeltaH(firstMovingRect.start + rTranX, firstRect.start), 0) * DIR;
				rTranY -= Math.min(pointDelta(firstMovingRect.y + rTranY + scrollChange, firstRect.y), 0);
			} else if (pointDeltaH(firstMovingRect.start + rTranX, firstRect.start, true) < 0)
				rTranY -= Math.min(pointDelta(firstMovingRect.y + rTranY + scrollChange, firstRect.bottom), 0);

			if (
				lastMovingRect.row == lastRect.row ||
				cursorRow - draggedRect.row + lastMovingRect.row == lastRect.row
			) {
				if (
					(draggingTab || nodes.at(-1) == movingNodes.at(-1)) &&
					cursorRow > draggedRect.row && lastMovingRect.row == lastRect.row
				)
					rTranX -= pointDeltaH(lastMovingRect.end + rTranX, lastRect.end + extraShiftEnd) * DIR;
				else if (cursorRow == draggedRect.row)
					rTranX += Math.min(pointDeltaH(lastRect.end + extraShiftEnd, lastMovingRect.end + rTranX), 0) * DIR;
				rTranY += Math.min(pointDelta(lastRect.y, lastMovingRect.y + rTranY + scrollChange), 0);
			} else if (pointDeltaH(lastMovingRect.end + rTranX, lastRect.end, true) > 0)
				rTranY += Math.min(pointDelta(lastRect.y, lastMovingRect.bottom + rTranY + scrollChange), 0);

			console?.debug("restrict tranY", rTranY - tranY, cursorRow, draggedRect.row, lastMovingRect.row, lastRect.row);

			let movingUp = rTranY + scrollPos < _dragData.scrollPos;
			if (!movingPositionPinned) {
				let p = _dragData.scrollPos;
				tranY -= p;
				rTranY -= p;
			}

			let maxZIndex = 0;
			let stackedIndex = 0;
			let draggedTabZIndex;
			movingNodes.forEach((node, i, a) => {
				let {row} = _dragData.nodeRects.get(node);
				let zIndex =
					2
					+ a.length
					+ (rTranX > 0 != RTL_UI ? a.length - i : i)
					+ (movingUp ? row : lastRect.row - row) * a.length;
				if (node == draggedTab)
					draggedTabZIndex = zIndex;
				else if (node.stacking)
					zIndex = draggedTabZIndex
						? draggedTabZIndex - ++stackedIndex
						: (
							prefs.dragStackPreceding
								? 2
								: zIndex
						);
				maxZIndex = Math.max(maxZIndex, zIndex);
				let transform = {
					"--translate-x": rTranX + "px",
					"--translate-y": rTranY + "px",
					zIndex,
				};
				style(node, transform);
				if (
					!draggingTab &&
					isTabGroupLabelContainer(node) &&
					draggedGroup.togglingAnimation
				)
					for (let t of draggedGroup.nonHiddenTabLikes)
						if (!t.visible)
							style(t, transform);
			});
			style(gNavToolbox, {"--tabs-moving-max-z-index": maxZIndex});

			if (pinDropInd && !numPinned) {
				pinDropInd.toggleAttribute("forFirstRow", cursorRow == firstRect.row && firstRect.y == boxTop);
				let r = getRect(pinDropInd, {box: "margin"});
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
								isTabLike(target)
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
		const rowChange = cursorRow - (_dragData.cursorRow ?? rect(draggedNode).row);
		assign(_dragData, {cursorRow});

		switch (Math.sign(rowChange)) {
			case -1: moveForward = false; break;
			case 1: moveForward = true; break;
			default: moveForward = cursorMovingForward;
		}

		let leader, leaderRect;
		if (_dragData.stacking && (moveForward || prefs.dragStackPreceding))
			leaderRect = rect(leader = draggedTab);
		else
			//in case some nodes are collapsed
			leader = movingNodes[moveForward ? "findLast" : "find"](n => (leaderRect = rect(n)).width);

		leaderRect.start += tranX;
		leaderRect.y += tranY + scrollPos;

		let previousOverlap;
		let dropAfterElement, dropBeforeElement;
		let overlapBefore = false, overlapAfter = false;

		let tabsBeforeMoving = nodes.slice(0, firstMovingIdx);
		let tabsAfterMoving = nodes.slice(lastMovingIdx + 1);

		let leaderCenterY = leaderRect.y + leaderRect.height / 2;

		if (
			firstMovingRect.row == firstRect.row &&
			cursorRow < draggedRect.row &&
			(draggingTab || !cursorMovingForward)
		) {
			dropBeforeElement = tabsBeforeMoving[0];
			console?.debug("move to first");
		} else if (
			lastMovingRect.row == lastRect.row &&
			cursorRow > draggedRect.row &&
			(draggingTab || cursorMovingForward)
		) {
			dropAfterElement = tabsAfterMoving.at(-1);
			console?.debug("move to last");
		}
		else {
			leaderCenterY = Math.min(Math.max(leaderCenterY, firstRect.y), lastRect.bottom - 1);

			let prv, nxt;
			let row = nodes.flatMap((t, i) => {
				let r;
				if (
					nxt ||
					t.stacking ||
					//ignore the nodes with 0 width, e.g. tabs moved together into the active collapsed group
					!(r = rect(t))?.width
				)
					return [];

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
					}

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

			if (!nxt)
				nxt = [{
					t: null,
					r: {
						start: rect(nodes.findLast(n => !n.stacking)).end,
						end: Infinity * DIR,
						width: Infinity,
					},
				}];

			console?.debug(
				"target row", "start",
				{
					x, y, tranX, tranY, rTranX, rTranY, prv,
					row, nxt, moveForward, leaderCenterY, leader, nodeRects, cursorRow,
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
										groupOfDraggedNode.visibleTabLikes.at(-1) == movingNodes.at(-1)
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
					dropBeforeElement?.matches("tab-group > :is(tab, tab-split-view-wrapper), .tab-group-overflow-count-container") &&
					dropBeforeElement.closest("tab-group");
				if (group)
					dropBeforeElement = dropAfterElement = null;
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
			let overlappingTab = isTabLike(overlapTarget);
			if (
				!rowChange &&
				!recursion &&
				!pinDropInd?.hasAttribute("interactive") &&
				(
					overlappingTab && !overlapTarget.group ||
					(
						appVersion > 142 &&
						isTabGroupLabelContainer(overlapTarget) &&
						overlapTarget.parentNode.collapsed && groupOfDraggedNode != overlapTarget.parentNode
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
				let collapsingTabsInDraggedGroup = !draggingTab && draggedGroup.togglingAnimation
					? draggedGroup.nonHiddenTabLikes.filter(t => !t.visible)
					: [];

				let oldVisualRects =
					!recursion &&
					new Map(
						[...movingNodes, ...collapsingTabsInDraggedGroup].map(t => {
							let r = getVisualRect(t);
							r.y += scrollPos;
							return [t, r];
						})
					);

				if (
					!rowChange &&
					!recursion &&
					_dragData.layoutLockedRow != firstMovingRect.row &&
					(!draggingTab || _dragData.stacking || movingNodes.length == 1)
				) {
					tabContainer._lockTabSizing(movingNodes.find(n => !n.stacking), {lockLayout: true});
					delete _dragData.cursorRowUnlocked;
					_dragData.layoutLockedRow = firstMovingRect.row;
				}

				gBrowser[dropBefore ? "moveTabsBefore" : "moveTabsAfter"](movingTabs, dropElement);
				groupOfDraggedNode?.refreshState();
				console?.timeLog(TIMER, "moved");

				if (rowChange && !_dragData.cursorRowUnlocked) {
					await tabContainer._unlockTabSizing({unlockSlot: false});
					_dragData.cursorRowUnlocked = true;
					delete _dragData.layoutLockedRow;
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

				if (rowChange) {
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
				_dragData.oriNodeRect = rect(draggedNode);

				let {restrictedShiftX: prvRX, restrictedShiftY: prvRY} = _dragData;

				shiftMovingNodes();
				updateRestrictedShfit();

				if (animatingLayout) {
					let shiftX = rowChange
						? (
							(prvRX == null ? 0 : _dragData.restrictedShiftX - prvRX)
							+ widthDelta * (RTL_UI ? p - 1 : p)
						)
						: 0;
					let shiftY = rowChange
						? (prvRY == null ? 0 : _dragData.restrictedShiftY - prvRY)
						: 0;

					for (let t of movingNodes) {
						let oldVR = oldVisualRects.get(t).relativeTo(oldDraggedR);
						let newR = newNodeRects.get(t).relativeTo(newDraggedR);

						oldVR.start += shiftX;
						oldVR.y += shiftY;

						animatingLayout.rects.set(t, oldVR);
						animatingLayout.newRects.set(t, newR);

						//in case the node is not a regular visible node,
						//e.g. tabs that moved together into a collapsed group
						if (!animatingLayout.nodes.includes(t))
							animatingLayout.nodes.push(t);
					}

					if (collapsingTabsInDraggedGroup[0]) {
						let newR = newDraggedR.clone().collapse().relativeTo(newDraggedR, false);
						for (let t of collapsingTabsInDraggedGroup) {
							animatingLayout.rects.set(t, oldVisualRects.get(t).relativeTo(oldDraggedR));
							animatingLayout.newRects.set(t, newR);
						}
					}
				}
			}, {
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
			r.y -= scrollPos;
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
				r.y += scrollPos;
				r.row = Math.round(pointDelta(r.y, _dragData.boxTop, true) / tabHeight);
				return [n, r];
			}));

			if (_dragData.stacking) {
				tabContainer.tabDragAndDrop.updateStackingInfo();
				let r = nodeRects.get(draggedTab);
				for (let tab of movingTabs)
					if (tab.stacking)
						nodeRects.set(tab, r);
			}

			for (let node of movingNodes) {
				let r = nodeRects.get(node);
				style(node, {
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

		function updateOriPos() {
			//handle the case that the tab has been shifted after mousedown
			let nR = getRect(_dragData.draggedNode), oR = _dragData.oriNodeRect;
			oriX = (_dragData.oriX += nR.x - oR.x + (nR.width - oR.width) * _dragData.atTabXPercent);
			oriY = (_dragData.oriY += nR.y - oR.y - _dragData.lastScrollPos + scrollPos);
			_dragData.oriNodeRect = nR;
		}
	};

	dragDropProto._clearPinnedDropIndicatorTimer ??= function() {
		if (this._pinnedDropIndicatorTimeout) {
			clearTimeout(this._pinnedDropIndicatorTimeout);
			this._pinnedDropIndicatorTimeout = null;
		}
	};

	function cleanUpDragDebug() {
		if (!debug) return;
		$$("[test-drop-before]").forEach(e => e.removeAttribute("test-drop-before"));
		$$("[test-drop-overlap]").forEach(e => e.removeAttribute("test-drop-overlap"));
		getNodes().forEach(t => style(t, {outline: "", boxShadow: ""}));
	};

	dragDropProto[`${HANDLE}_dragleave`] = function(e) {
		handle_dragleave.apply(this, arguments);

		let target = e.relatedTarget;
		while (target && target != tabContainer)
			target = target.parentNode;
		if (!target)
			this._postDraggingCleanup();
	};

	dragDropProto[`${HANDLE}_dragend`] = function(e) {
		nullifyNativeDragStyle(() => handle_dragend.apply(this, arguments), e.target, "#resetTabsAfterDrop");
		this._postDraggingCleanup();
	};

	dragDropProto[`${HANDLE}_drop`] = function(event) {
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
						(
							tabContainer.dragAndDropElements ??
							tabContainer.ariaFocusableItems ??
							gBrowser.visibleTabs
						)[this._getDropIndex(event)]
					)
				) {
					({moveTabTo} = gBrowser);
					gBrowser.moveTabTo = emptyFunc;
				}
			} else if (this._pinnedDropIndicator?.matches("[visible][interactive]")) {
				_dragData.newPinState = true;
				this._pinnedDropIndicator.removeAttribute("visible");
			}
		}

		let run = () => nullifyNativeDragStyle(() => handle_drop.apply(this, arguments), draggedTab, "#resetTabsAfterDrop");
		if (draggedTab && !sameWindow)
			animateLayout(() => {
				let nodes = getNodes({onlyFocusable: true});
				draggedTab.container.animateLayout(run);
				return getNodes({onlyFocusable: true}).filter(n => !nodes.includes(n));
			});
		else if (draggedTab && dt.dropEffect == "copy")
			animateLayout(() => {
				let oldNodes = getNodes({onlyFocusable: true});
				run();
				return getNodes({onlyFocusable: true}).filter(n => !oldNodes.includes(n));
			});
		else if (
			useIndicatorToMove && !moveTabTo &&
			//pinning tab is not handled by animateLayout currently thus it's better to let pinTab to do the job
			!(
				NATIVE_DRAG_TO_PIN &&
				!prefs.disableDragToPinOrUnpin &&
				_dragData.draggingTab &&
				!_dragData.pinned &&
				this[GET_DRAG_TARGET](event)?.pinned
			)
		)
			animateLayout(run);
		else
			run();

		if (moveTabTo)
			assign(gBrowser, {moveTabTo});

		//copying tabs
		if (_dragData && !sameWindow && draggedTab.isConnected)
			//add back the _dragData for finishAnimateTabMove on dragend
			assign(draggedTab, {_dragData});

		this._postDraggingCleanup();
	};

	dragDropProto[FINISH_ANIMATE_TAB_MOVE] = async function() {
		//_animateTabMove is not triggered when copying tab at first, i.e. pressing ctrl before dragging tab
		//thus chack the [movingtab] of tabs bar instead to identify whether the animate has performed
		let finishing = tabContainer.isFinishingTabMove;
		let movingTabGroup = !finishing && tabContainer.hasAttribute("moving-tabgroup");
		//the dragover would not be triggered and marked as moving when dragging out of the window so fast
		let moving = movingTabGroup || !finishing && tabsBar.hasAttribute("movingtab");

		let _dragData, rectsBeforeDrop, draggedGroup;
		let {selectedNode} = gBrowser;
		if (moving) {
			if (movingTabGroup) {
				draggedGroup = $("[movingtabgroup]");
				({_dragData} = draggedGroup.labelElement);
			} else if (
				//in case the data has been deleted
				({_dragData} = selectedNode) &&
				(
					_dragData.shouldCreateGroupOnDrop && !_dragData.dropElement.group ||
					_dragData.shouldDropIntoCollapsedTabGroup
				) &&
				isCalledBy("on_drop")
			) {
				//mark down the translated tabs and perform a restoring animate
				rectsBeforeDrop = new Map(
					getNodes({newTabButton: true}).map(t => [t, getVisualRect(t, true)])
				);
			}

			this._clearPinnedDropIndicatorTimer();
		}

		finishAnimateTabMove.apply(this, arguments);

		if (moving) {
			let movingNodes = $$("[movetarget]", arrowScrollbox);

			try {
				tabContainer.isFinishingTabMove = true;

				if (prefs.dragToGroupTabs && gBrowser._tabGroupsEnabled)
					this[CLEAR_DRAG_OVER_GROUPING_TIMER]();

				let {stacking, newPinState} = _dragData;
				let noTransform = {"--translate-x": "", "--translate-y": ""};

				if (newPinState != null && isCalledBy("on_drop")) {
					await Promise.all([
						animateLayout(
							async () => {
								for (let n of movingNodes)
									style(n, noTransform);
								tabContainer._unlockTabSizing({unlockSlot: false});
								tabContainer._keepTabSizeLocked = true;
								gBrowser[newPinState ? "pinMultiSelectedTabs" : "unpinMultiSelectedTabs"]();
								tabContainer._updateInlinePlaceHolder();
								await refreshGroups();
							},
							{
								translated: true,
								shouldUpdatePlacholder: false,
							},
						),
						stacking,
					]);
					if (newPinState)
						for (let t of movingNodes)
							t.style.minWidth = "";
				} else if (movingNodes[0]) {
					tabContainer._keepTabSizeLocked = true;

					assign(_dragData, {
						needsUpdate: true,
						cursorRowUnlocked: false,
					});

					if (rectsBeforeDrop)
						//wait a little bit to let the group settle
						await 0;

					//no group created if the dragging is canceled
					if (rectsBeforeDrop && movingNodes[0].group) {
						for (let n of movingNodes) {
							style(n, noTransform);
							n.tabs?.forEach(t => gBrowser.removeFromMultiSelectedTabs(t));
						}
						await animateLayout(() => {
							let {group} = movingNodes[0];
							if (
								_dragData.shouldDropIntoCollapsedTabGroup &&
								group.isShowingOverflowCount
							)
								return group.overflowContainer;
						}, {
							nodes: [...rectsBeforeDrop.keys()],
							rects: rectsBeforeDrop,
						});
					} else {
						await Promise.all([
							...movingNodes.map(async n => {
								n.setAttribute("animate-shifting", "run");
								await rAF();
								style(n, noTransform);
								await waitForAnimate(n);
							}),
							//in case dropping before the collapsing is done
							stacking,
							draggedGroup?.togglingAnimation,
						]);

						for (let n of movingNodes)
							n.removeAttribute("animate-shifting");

						if (draggedGroup && (_dragData.expandGroupOnDrop || draggedGroup.stacked)) {
							for (let t of draggedGroup.nonHiddenTabLikes)
								style(t, noTransform);
							/*
							  the tabs in group occasionally bounce when the group opens
							  it may be a racing of animation but can't figure how
							  adding a timeout somehow solved the problem
							*/
							await defer();
							delete tabContainer._keepTabSizeLocked;

							if (_dragData.expandGroupOnDrop) {
								draggedGroup.collapsed = false;
								await draggedGroup.togglingAnimation;
							} else if (draggedGroup.stacked) {
								let nodes = getNodes({newTabButton: true});
								nodes.push(gBrowser.selectedNode);
								await animateLayout(() => {
									draggedGroup.stacked = false;
									tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
									if (draggedGroup.isShowingOverflowCount)
										return draggedGroup.overflowContainer;
								}, {nodes});
							}

							movingNodes[0].scrollIntoView();
						}
					}
				}

				gBrowser.tabGroups?.forEach(g => {
					if (g.collapsed)
						for (let t of g.tabs)
							if (t.multiselected && !t.selected)
								gBrowser.removeFromMultiSelectedTabs(t);
				});

				if (stacking) {
					await defer();
					await animateLayout(() => {
						for (let t of movingNodes)
							t.stacking = false;
						delete tabContainer._keepTabSizeLocked;
						tabContainer._unlockTabSizing({unlockSlot: false});
					});
				}

				await refreshGroups();
				draggedGroup?.removeAttribute("movingtabgroup");
			} finally {
				for (let [node, attrs] of [
					[this._pinnedDropIndicator, ["visible", "interactive"]],
					[tabContainer, [
						"moving-pinned-tab", "moving-positioned-tab", "moving-single-tab",
						"moving-tabgroup", "movingtab-finishing",
					]],
					[tabsBar, ["movingtab", "moving-positioned-tab"]],
					[gNavToolbox, ["moving-tabgroup"]],
				])
					for (let a of attrs)
						node?.removeAttribute(a);

				style(arrowScrollbox, {"--scroll-top": ""});

				let noMoving = {
					zIndex: "",
					"--width-rounding-diff": "",
					"--height-rounding-diff": "",
					"--translate-x": "",
					"--translate-y": "",
					"--stacking-index": "",
					"--stacking-opacity": "",
				};
				//in case there are some moving hidden nodes
				let nodesToClear = [...getNodes(), ...movingNodes];
				if (_dragData.expandGroupOnDrop)
					nodesToClear.push(...draggedGroup.nonHiddenTabLikes);
				for (let node of new Set(nodesToClear)) {
					//the dragged tab may be unselected thus clear all tabs for safety
					InspectorUtils.clearPseudoClassLocks(node, ":hover");
					style(node, noMoving);
					node.removeAttribute("movetarget");
				}

				style(tabContainer, {
					"--stacking-size": "",
					"--stacking-start": "",
					"--stacking-top": "",
				});
				style(gNavToolbox, {"--tabs-moving-max-z-index": ""});

				delete tabContainer._keepTabSizeLocked;
				if (!tabContainer.overflowing)
					tabContainer.unlockSlotSize();

				if (!_dragData.expandGroupOnDrop)
					(movingTabGroup ? movingNodes[0] : selectedNode)?.scrollIntoView();

				delete this._dragData;
			}
		}

		async function refreshGroups() {
			if (TAB_GROUP_SUPPORT)
				await Promise.all(gBrowser.tabGroups.map(async g => {
					if (!g.tabs[0]) {
						g.dispatchEvent(new CustomEvent("TabGroupRemoved", {bubbles: true}));
						g.remove();
						await g.removingAnimation;
					} else
						await g.refreshState();
				}));
		}
	};

	dragDropProto.updateStackingInfo = function() {
		let {_dragData} = this;
		if (!_dragData?.stacking)
			return;
		let {draggedNode} = _dragData;
		let r = getRect(draggedNode).relativeTo(getRect(arrowScrollbox));
		style(tabContainer, {
			"--stacking-start": r.start * DIR + "px",
			"--stacking-top": r.y + (_dragData.movingPositionPinned ? 0 : scrollbox.scrollTop) + "px",
			"--stacking-size": r.width + "px",
		});
	};

	dragDropProto._postDraggingCleanup = function() {
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
		for (let [node, attrs] of [
			[tabContainer, ["tabmousedown", "dragging"]],
			[tabsBar, ["tabs-dragging", "tabs-dragging-ext"]],
		])
			for (let a of attrs)
				node?.removeAttribute(a);

		cleanUpDragDebug();
	};

	/**
	 * @param {{(): void}} callback
	 * @param {Element} [element]
	 * @param {string} caller
	 */
	function nullifyNativeDragStyle(callback, element, caller) {
		if (window.TabDragAndDrop || !FX_USING_PRIVATE_SET_STYLE) {
			callback();
			return;
		}

		let proto = (element?.ownerGlobal || window).XULElement.prototype;
		let oriStyle = Object.getOwnPropertyDescriptor(proto, "style");
		let dummy = {};

		define(proto, {
			style: function() {
				return isCalledBy(caller) ? dummy : oriStyle.get.call(this);
			},
		});

		try {
			callback();
		} finally {
			define(proto, {style: oriStyle});
		}
	}
}

/** hack tabContainer **/
{
	const {
		_updateCloseButtons, _handleTabSelect, uiDensityChanged,
	} = tabContainer;

	define(tabContainer, {
		overflowing: {get: "overflow"},

		isMovingTab: {get: "movingtab"},

		isFinishingTabMove: "movingtab-finishing",

		positioningPinnedTabs: "positionpinnedtabs",
	}, false);

	tabContainer.switchByScrolling = getPref("toolkit.tabbox.switchByScrolling", "Bool");
	tabContainer.addEventListener("DOMMouseScroll", function(e) {
		if (this.switchByScrolling)
			e.preventDefault();
	});

	assign(tabContainer, {animateLayout});

	//clear the cache in case the script is loaded with delay
	tabContainer._pinnedTabsLayoutCache = null;

	arrowScrollbox.before(
		...["pre-tabs", "post-tabs", "new-tab-button"].map(n =>
			tabContainer["_placeholder" + n.replace(/(?:^|-)(\w)/g, (m, w) => w.toUpperCase())] =
				assign(document.createXULElement("hbox"), {
					id: "tabs-placeholder-" + n,
					className: "tabs-placeholder",
				})
		)
	);
	//sometimes double clicking on the spaces doesn't perform the window maximizing/restoring, don't know why
	$$(".titlebar-spacer, .tabs-placeholder").forEach(node => node.addEventListener("dblclick", ondblclick, true));
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
							!prefs.disableDragToPinOrUnpin &&
							!tabContainer.isMovingTab &&
							!!node?.closest("tab[pinned]")
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
					for (let t of tabs)
						arrowScrollbox.insertBefore(t, firstNormal);
				},
				contains: function(node) {
					return isCalledBy("on_drop", "scrollIntoView")
						? (
							!prefs.disableDragToPinOrUnpin &&
							!tabContainer.isMovingTab &&
							!!node?.closest(`#tabbrowser-arrowscrollbox > :not([pinned])`)
						)
						: contains.apply(this, arguments);
				},
			});
		}
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
		let isPositioned = this.positioningPinnedTabs && !forcedOverflow;
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
				if (tabsUnderControlButtons >= 2) {
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
				if (tabsUnderControlButtons >= 2)
					spacers = Math.min(columns, spacers);
			} else {
				columns = numPinned;
				spacers = 0;
			}
			let boxWidth = getRect(this, {box: "padding"}).width;
			floatPinnedTabs = pointDelta(
				(
					columns * width + gap + (SPLIT_VIEW_SUPPORT ? splitViewMinWidth : tabMinWidth) + this.newTabButton.clientWidth
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
			style(slot, {minHeight: tabHeight * (maxRows + 1) + "px !important"});

		this.removeAttribute("forced-overflow");
		style(this, {"--forced-overflow-adjustment": ""});

		this.positioningPinnedTabs = floatPinnedTabs;
		tabsBar.toggleAttribute("positionpinnedtabs", floatPinnedTabs);
		tabsBar.toggleAttribute("pinned-tabs-wraps-placeholder", !!wrapPlaceholder);

		if (floatPinnedTabs) {
			style(this, {"--tab-overflow-pinned-tabs-width": columns * width + "px"});

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
						lastRowSize += getMinWidth(tabs[i], r);
					}
					this.setAttribute("forced-overflow", "");
					let adjacentNewTab = this.hasAttribute("hasadjacentnewtabbutton");
					let adj = Math.max(
						adjacentNewTab ? newTabButtonWidth : 0,
						slotRect.width - lastRowSize + 1,
					);
					style(this, {"--forced-overflow-adjustment": adj + "px"});
					arrowScrollbox.instantScroll(_lastScrollTop);
					console?.warn("positionpinnedtabs causes underflow!", {
						numPinned, adjacentNewTab, maxRows, lastRowSize,
						outerWidth, adj, lastLayoutData,
					});
				}
			}

			slot.style.minHeight = "";

			pinnedTabs.filter(t => !t.stacking).forEach((t, i) => {
				i += spacers + Math.max(columns - numPinned, 0);
				style(t, {
					insetInlineStart: i % columns * width + "px",
					top: Math.floor(i / columns) * tabHeight + "px",
					marginInlineStart: "",
				});
			});

			console?.log(`_positionPinnedTabs`, true, {
				isPositioned, columns, spacers, numPinned, overflowing, overflowAttr: this.hasAttribute("overflow")
			});
		} else if (isPositioned || forcedOverflow) {
			console?.log(`_positionPinnedTabs: false, overflowing: ${overflowing}, overflowAttr: ${this.hasAttribute("overflow")}`);

			for (let tab of pinnedTabs)
				style(tab, {top: "", insetInlineStart: "", marginInlineStart: ""});
			style(this, {"--tab-overflow-pinned-tabs-width": ""});

			if (!overflowing && scrollbox.scrollTopMax) {
				console?.warn("un-positionpinnedtabs cause overflow!");
				queueMicrotask(() => scrollbox.dispatchEvent(new Event("overflow")));
			}
		}

		console?.timeEnd("_positionPinnedTabs - update");
	};

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
			if (e.button || !(tab = this.tabDragAndDrop[GET_DRAG_TARGET](e)))
				return;
			this._lastMouseDownData = this.tabDragAndDrop.createMouseDownData(e, tab);
			this._showFakeScrollbar();
			//the registered listeners won't be removed when dragend but doing a normal click
			addEventListener("mouseup", up, true);
		}, true);
	}

	tabContainer._showFakeScrollbar = function() {
		let slotHeight = getRect(slot).height;
		let {scrollTop} = scrollbox;
		this.setAttribute("tabmousedown", "");
		style(fakeScrollbar, {"--slot-height": slotHeight + "px"});
		assign(fakeScrollbar, {scrollTop});
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
		style(fakeScrollbar, {"--slot-height": ""});
		this.removeAttribute("tabmousedown");
		if (overflowing && !this._hasTabTempMaxWidth)
			this.unlockSlotSize();
	};

	tabContainer._refreshAllGroups = async function() {
		if (TAB_GROUP_SUPPORT)
			await Promise.all(gBrowser.tabGroups.map(g => g.refreshState()));
	};

	//replace the original function with modified one
	tabContainer._notifyBackgroundTab = function(tab) {
		if (
			tab.pinned && this.positioningPinnedTabs ||
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
			if (
				pointDelta(scrollRect.y, tabRect.y) <= 0 &&
				pointDelta(tabRect.bottom, scrollRect.bottom) <= 0
			)
				return;

			if (this.arrowScrollbox.smoothScroll) {
				if (
					!selectedRect ||
					pointDelta(
						Math.max(
							pointDelta(tabRect.bottom, selectedRect.y),
							pointDelta(selectedRect.bottom, tabRect.y),
						),
						scrollRect.height,
					) <= 0
				) {
					arrowScrollbox.ensureElementIsVisible(tabToScrollIntoView);
					return;
				}

				//try to copy normal tab to the pinned tab side will make the new tab be placed at front
				//the original function always scroll down
				let edge = tabRect.y > selectedRect.y ? "top" : "bottom";
				arrowScrollbox.scrollByPixels(selectedRect[edge] - scrollRect[edge]);
			}

			let node = this._animateElement;
			if (!node.hasAttribute("highlight")) {
				node.setAttribute("highlight", "");
				setTimeout(() => node.removeAttribute("highlight"), 1000);
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
				for (let t of gBrowser.visibleTabs) {
					let {splitview} = t;
					let {width} = windowUtils.getBoundsWithoutFlushing(splitview ?? t);
					if (splitview)
						width /= 2;
					let {pinned} = t;
					t.toggleAttribute("closebutton", !pinned && pointDelta(width, _tabClipWidth) > 0);
					if (appVersion > 136) {
						pinned &&= !prefs.pinnedTabsFlexWidth;
						t.toggleAttribute("mini-audio-button", !pinned && width < 100);
						t.audioButton.toggleAttribute("pinned", pinned);
						t.overlayIcon.toggleAttribute("pinned", pinned || width < 100);
					}
				}
				_closeButtonsUpdatePending = false;
				console?.timeEnd("_updateCloseButtons");
			});
		}
		_updateCloseButtons.apply(this, arguments);
	};
	/* handle the cases that tabs moved by command or other resaons */
	tabContainer.addEventListener("TabMove", function() {
		if (
			!animatingLayout &&
			!this.isMovingTab &&
			!this.hasAttribute("dragging")
		) {
			this._refreshAllGroups();
			this._updateInlinePlaceHolder();
		}
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

		let lastNode = nodes.filter(n => !n.stacking).at(-1);

		//not using this.overflowing in case it is not updated in time
		let overflowing = !!scrollbox.scrollTopMax;
		let onlyUnderflow = prefs.tabsUnderControlButtons < 2;

		tabsBar.toggleAttribute("tabs-is-first-visible", isFirst);

		$$("[last-inflow-node]", this).forEach(n => n.removeAttribute("last-inflow-node"));
		lastNode.setAttribute("last-inflow-node", "");

		if (
			overflowing && onlyUnderflow ||
			innerWidth < prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery ||
			this._isCustomizing ||
			!prefs.tabsUnderControlButtons
		) {
			if (lastLayoutData) {
				placeholderStyle.innerHTML &&= "";
				style(tabsBar, {
					"--pre-tabs-items-width": "",
					"--post-tabs-items-width": "",
				});
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

		style(tabsBar, {
			"--pre-tabs-items-width": preTabsItemsSize + "px",
			"--post-tabs-items-width": postTabsItemsSize + "px",
		});
		tabsBar.toggleAttribute("has-items-pre-tabs", preTabsItemsSize);
		//there is an extra padding after tabs for shifting the items to not cover the scrollbar
		tabsBar.toggleAttribute("has-items-post-tabs", pointDelta(postTabsItemsSize, onlyUnderflow ? 0 : scrollbarWidth) > 0);

		console?.timeLog("_updateInlinePlaceHolder", "update pre/post tabs items width");

		if (!this.isMovingTab || this.hasAttribute("moving-positioned-tab"))
			this._positionPinnedTabs(numPinned);

		let adjacentNewTab = this.hasAttribute("hasadjacentnewtabbutton");
		let positionPinned = this.positioningPinnedTabs;
		let winWidth = winRect.width;
		let winMaxWidth = Math.max(screen.width - screen.left + 8, winWidth + splitViewMinWidth);
		let winMinWidth = parseInt(getComputedStyle(root).minWidth);
		let firstUnpinned = nodes[numPinned];
		let pinnedWidth = numPinned && !positionPinned
			? getVisualMinWidth(nodes.find(n => !n.stacking))
			: 0;
		let firstNodeMinWidth = pinnedWidth || getVisualMinWidth(firstUnpinned);
		let pinnedGap = prefs.gapAfterPinned;
		let pinnedReservedWidth = positionPinned
			? parseFloat(getStyle(this, "--tab-overflow-pinned-tabs-width")) + pinnedGap
			: 0;

		let inlinePreTabCS = getComputedStyle(slot, "::before");

		let tabsStartSeparator = Math.ceil(
			parseFloat(inlinePreTabCS.marginInlineEnd)
			+ parseFloat(inlinePreTabCS.borderInlineEndWidth)
			+ parseFloat(inlinePreTabCS.paddingInlineEnd)
		);

		let base = Math.max(preTabsItemsSize + tabsStartSeparator, pinnedReservedWidth) + postTabsItemsSize;

		console?.timeLog("_updateInlinePlaceHolder", "gather all info");

		console?.trace();

		lastLayoutData = {preTabsItemsSize, postTabsItemsSize, tabsStartSeparator};

		onlyUnderflow = onlyUnderflow ? ":not([overflow])" : "";

		const decimals = -Math.log10(EPSILON);

		let css = [`
			${media(0, base + firstNodeMinWidth + (adjacentNewTab ? newTabButtonWidth : 0) - EPSILON)} {
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
				#tabs-placeholder-post-tabs,
				#tabbrowser-tabs[multirows]${onlyUnderflow}
					#tabbrowser-arrowscrollbox::part(items-wrapper)::after
				{
					visibility: collapse;
				}
				#tabbrowser-tabs${onlyUnderflow} #tabbrowser-arrowscrollbox
					:is(
						.tabbrowser-tab,
						.tab-group-label-container,
						.tab-group-overflow-count-container,
						tab-split-view-wrapper,
						#tabbrowser-arrowscrollbox-periphery
					)
				{
					order: 2;
				}
			}
		`];

		let containerSelector = `#tabbrowser-tabs:not([ignore-newtab-btn=singlerow])`;

		if ("elementIndex" in tabProto) {
			let nodeSelector = `:is(
				:is(#tabbrowser-arrowscrollbox, tab-group:not([collapsed])) > :is(tab, tab-split-view-wrapper):not([closing], [hidden]),
				.tab-group-label-container,
				[collapsed][hasactivetab]:not([stacked]) > :is(tab[selected], tab-split-view-wrapper[hasactivetab]),
				[collapsed][hasactivetab][hasmultipletabs]:not([stacked]) > .tab-group-overflow-count-container
			)`;
			let breakpointSettings = `
				--line-overlap-length: 0px;

				& ~ :not(
					tab-group[collapsed] >
						:is(
							tab:not([selected]),
							tab-split-view-wrapper:not([hasactivetab])
						),
					tab-group[stacked] > :is(tab, tab-split-view-wrapper)
				),
				tab-group[collapsed]:not([stacked]) & ~ :is([selected], [hasactivetab]) ~ *,
				tab-group:has(> &) ~ * {
					&, tab-group& > * {
						order: 2;
					}
				}
			`;
			let lastIdx = lastNode.getAttribute("elementIndex");
			let prvIdx;
			for (
				let i = positionPinned ? numPinned : 0;
				pointDelta(base, winMaxWidth) <= 0 && i < nodes.length;
				i++
			) {
				let node = nodes[i];
				let idx = node.getAttribute("elementIndex");
				let width = node.stacking
					? 0
					: (
						i < numPinned && !prefs.pinnedTabsFlexWidth
							? pinnedWidth
							: getVisualMinWidth(node)
					);

				console?.debug("node width", width, node, idx);

				if (!i)
					base += width + (numPinned == 1 ? pinnedGap : 0);
				else {
					css.push(`
						${media(base, (base += width) - EPSILON)} {
							${containerSelector}
								${i < numPinned ? "" : nodeSelector}[elementIndex="${prvIdx ?? idx - 1}"]
							{
								${breakpointSettings}
							}
						}
					`);

					if (pinnedGap && i == numPinned - 1 && idx != lastIdx)
						css.push(`
							${media(base, (base += pinnedGap) - EPSILON)} {
								${containerSelector} {
									.tabbrowser-tab:nth-last-child(1 of tab[pinned]:not([stacking])) {
										--gap-after-pinned: 0px;
									}

									.tabbrowser-tab ~ :not([pinned]) {
										&, tab-group& > * {
											order: 2;
										}
									}
								}
							}
						`);

					if (adjacentNewTab && idx == lastIdx)
						css.push(`
							${media(base, base + newTabButtonWidth - EPSILON)} {
								${containerSelector}
									${nodeSelector}[elementIndex="${prvIdx ?? idx - 1}"]
								{
									${breakpointSettings}
								}
							}
						`);
				}

				prvIdx = idx;
			}
		} else {
			let inFlowTab = `tab:not([closing], [hidden], [stacking])`;
			if (this.matches("[movingtab], [movingtab-finishing]") && gBrowser.selectedTab.pinned)
				numPinned -= gBrowser.selectedTabs.filter(t => t.stacking).length;

			if (adjacentNewTab)
				css.push(`
					${media(0, base + firstNodeMinWidth + newTabButtonWidth - EPSILON)} {
						${containerSelector}
							.tabbrowser-tab:nth-child(1 of ${inFlowTab}):nth-last-child(1 of ${inFlowTab}),
						${containerSelector}
							.tabbrowser-tab:nth-child(1 of ${inFlowTab}):nth-last-child(1 of ${inFlowTab}) ~ *
						{
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
							${media(min, max)} {
								${containerSelector}
									.tabbrowser-tab:nth-child(${i} of ${inFlowTab}):not(:nth-last-child(1 of ${inFlowTab})) ~ *
								{
									order: 2;
								}
							}
						`);
				}

				//remove the gap after pinned to prevent the last pinned being wrapped, and force all non-pinned to wrap
				if (pinnedGap)
					css.push(`
						${media(base, base + pinnedGap - EPSILON)} {
							.tabbrowser-tab:nth-last-child(1 of ${inFlowTab}[pinned]) {
								--gap-after-pinned: 0px;
							}

							${containerSelector} .tabbrowser-tab[pinned] ~ :not([pinned]) {
								order: 2;
							}
						}
					`);

				//wrap the last pinned tab adjacent with new tab
				if (adjacentNewTab)
					css.push(`
						${media(base, base + newTabButtonWidth - EPSILON)} {
							${containerSelector}
								.tabbrowser-tab[pinned]:nth-last-child(2 of ${inFlowTab}) ~ *
							{
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
					${media(base, (base += tabMinWidth) - EPSILON)} {
						${containerSelector}
							.tabbrowser-tab:nth-child(
								${numPinned + i} of ${inFlowTab}
							):not(:nth-last-child(1 of ${inFlowTab})) ~ *
						{
							order: 2;
						}
					}
				`);
				//wrap the last normal tab adjacent with new tab
				if (adjacentNewTab && pointDelta(base, winMaxWidth) <= 0)
					css.push(`
						${media(base, base + newTabButtonWidth - EPSILON)} {
							${containerSelector}
								.tabbrowser-tab:nth-child(
									${numPinned + i} of ${inFlowTab}
								):nth-last-child(2 of ${inFlowTab}) ~ *
							{
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

		/**
		 * @param {number} min
		 * @param {number} max
		 */
		function media(min, max) {
			return `@media ${min ? `(min-width: ${fixed(min)}px) and` : ""} (max-width: ${fixed(max)}px)`;
		}

		/** @param {number} num */
		function fixed(num) {
			return +(Math.floor(num / EPSILON) * EPSILON).toFixed(decimals);
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
		style(this, {"--forced-overflow-adjustment": ""});
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
				(
					pGroup?.collapsed && pGroup.hasActiveTab &&
					(!target.splitview || target.splitview != previousTab.splitview)
				) ||
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
						let overflowing = animatingLayout && tGroup?.isShowingOverflowCount;
						select(target, previousTab);
						//wait for the hasActiveTab update
						await 0;
						tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
						if (overflowing == false && tGroup.isShowingOverflowCount)
							return tGroup.overflowContainer;
					}, {
						//bypassing the cache since the elementIndex is dirty at this moment
						//and needs to keep dirty, otherwise the inline placeholder will be wrong positioned
						nodes: [...new Set([
							...getNodes({newTabButton: true, bypassCache: true, includeClosing: true}),
							asNode(target),
							asNode(previousTab),
						])],
					});

				/**
				 * @param {MozTabbrowserTab} to
				 * @param {MozTabbrowserTab} from
				 */
				function select(to, from) {
					for (let [n, v] of [[from, false], [to, true]])
						for (let a of ["visuallyselected", "selected"]) {
							n[v ? "setAttribute" : "removeAttribute"](a, v);
							n.splitview?.toggleAttribute("hasactivetab", v);
							if (!v)
								for (let t of [...(n.splitview?.tabs ?? [n])])
									gBrowser.removeFromMultiSelectedTabs(t);
						}
				}
			}
		});

	/** @this {MozTabbrowserTabs} */
	function updateElementIndex() {
		if (animatingLayout)
			return;
		this._invalidateCachedTabs();
		this.removeAttribute("forced-overflow");
		style(this, {"--forced-overflow-adjustment": ""});

		//2 rAFs are required when adding tab and underflow -> overflow
		rAF(2).then(() => this._updateInlinePlaceHolder());
	}

	tabContainer._handleTabSelect = function() {
		if (
			arrowScrollbox._isScrolling ||
			this.matches("[movingtab], [dragging]") ||
			gBrowser.tabGroups?.some(g => g.togglingAnimation) ||
			//it's so stupid that there is a resize listener added but it does not check the event target
			//it causes _handleTabSelect to be called unexpectedly whenever a browser view resizes
			isCalledBy("handleResize")
		)
			return;
		console?.trace();
		_handleTabSelect.apply(this, arguments);
	};

	tabContainer._lockTabSizing = function(actionNode, {lockLayout, stacking} = {}) {
		let positionPinned = this.positioningPinnedTabs;
		//stop the original startTabDrag from locking the tabs when dragging a open tab group
		//currently only startTabDrag call this without parameter
		if (
			!actionNode ||
			actionNode.splitview ||
			gBrowser[CLOSING_THE_ONLY_TAB] ||
			positionPinned && actionNode.pinned ||
			isSlotJustifyCenter()
		)
			return;

		console?.time("_lockTabSizing");

		let nodes = getNodes({
			//be careful don't touch the ariaFocusableItems since it will update the elementIndex attribute when closing tab
			//and there will be two nodes with the same number, one is the closing tab and the other is the following node,
			//placeholder will be freaked out in this case
			bypassCache: "ariaFocusableItems" in this && isCalledBy("removeTab"),
		});
		let lock = false;

		if (nodes[0]) {
			let KEEP_STATE = Symbol();
			let isClosingTab = actionNode.closing;
			let actionGroup = actionNode.group;
			let {overflowContainer} = actionGroup || {};
			let collapsingGroup = !isTabLike(actionNode) ? actionGroup : null;
			let {selectedNode} = gBrowser;
			// the _dragData may not set on tabDragAndDrop yet when dragging an open group,
			// thus not rely on tabDragAndDrop._dragData
			let {_dragData} = collapsingGroup ? actionNode : selectedNode;
			let {expandGroupOnDrop} = _dragData || {};
			let selectingTabsOutsideGroup = collapsingGroup && gBrowser.selectedTabs.some(t => t.group != actionGroup);
			let tabsOfCollapsingGroup = collapsingGroup?.nonHiddenTabLikes;
			let hasAdjacentNewTab =
				this.hasAttribute("hasadjacentnewtabbutton") &&
				!((this.overflowing || this.hasAttribute("multirows")) && (prefs.autoCollapse || maxTabRows() == 1));
			let lastNode;

			if (collapsingGroup) {
				let hasActiveTab = !selectingTabsOutsideGroup && actionGroup.hasActiveTab;
				actionNode = actionGroup.labelContainerElement;
				// eslint-disable-next-line no-cond-assign
				if (stacking ||= this.isMovingTab && this.tabDragAndDrop.multiselectStacking) {
					if (hasActiveTab)
						nodes = nodes.filter(n => n != selectedNode && n != overflowContainer);
				} else {
					if (hasActiveTab && actionGroup.hasAttribute("hasmultipletabs")) {
						//set as absolute to not interrupt the layout
						style(overflowContainer, {display: "flex", position: "absolute"});
						//include the overflow container, which will display later
						nodes.splice(nodes.indexOf(selectedNode) + 1, 0, overflowContainer);
					}
					lastNode = nodes.findLast(n => !tabsOfCollapsingGroup.includes(n) || hasActiveTab && n.selected);
				}
			} else if (isClosingTab && actionGroup?.collapsed) {
				actionNode.setAttribute("selected", true);
				actionNode.setAttribute("visuallyselected", true);
				if (actionGroup.nonHiddenTabs.length > 1)
					overflowContainer.style.display = "flex";
			}

			lastNode ||= nodes.at(-1);

			let actionNodeRect = getRect(actionNode);
			//dont use tab.elementIndex since it will access ariaFocusableItems
			//getAttribute() is "" on fx 115 so use || instead of ??
			let closingLastTab =
				isClosingTab &&
				(
					+(actionNode.getAttribute("elementIndex") || actionNode._tPos) >
					+(lastNode.getAttribute("elementIndex") || lastNode._tPos)
				);
			let slotRect = getRect(slot, {box: "content"});
			let atFirstRow = slotRect.y == actionNodeRect.y + scrollbox.scrollTop;

			if (lockLayout) {
				let sizes = new Map();

				for (let n of nodes) {
					if (n.closing || n.stacking)
						continue;
					let r = getRect(n);
					let deltaY = pointDelta(r.y, actionNodeRect.y);
					sizes.set(
						n,
						deltaY < -tabHeight
							? null
							: deltaY < 0
								? r.width
								: deltaY
									? null
									: KEEP_STATE,
					);
				}

				for (let [n, w] of sizes)
					if (w != KEEP_STATE)
						this._setLockedSize(n, w);

				lock = true;
			} else if (closingLastTab) {
				if (
					pointDelta(getRect(lastNode).y, actionNodeRect.y) < 0 ||
					actionGroup?.collapsed
				) {
					this._clearSpacer();
					this.removeAttribute("ignore-newtab-btn");

					if (this.overflowing) {
						this.lockSlotSize();
						lock = true;
					}
				} else {
					let space = pointDeltaH(slotRect.end, actionNodeRect.end);
					if (atFirstRow)
						space -= lastLayoutData?.postTabsItemsSize ?? 0;
					if (hasAdjacentNewTab)
						space -= newTabButtonWidth;
					this._closingTabsSpacer.style.width = space.toFixed(4) + "px";
					this.setAttribute("using-closing-tabs-spacer", true);
					this.removeAttribute("ignore-newtab-btn");
					lock = true;
				}

				for (let n of nodes)
					this._setLockedSize(n);
			} else {
				let currentRow = new Map();
				let totalMinWidth = 0, totalVisualWidth = 0;
				let rowWidth, remainingSpace, hasPinned, hasNonPinned;
				let selectedNodePinned = selectedNode.pinned;
				let canFitIn = true, visuallyFitIn = true, lockFirstRow = false;
				let unifiedWidth = Infinity, unifiedSplitViewWidth = Infinity;

				for (let n of nodes) {
					let pinned = !!n.pinned;
					if (positionPinned && pinned)
						continue;

					let isSmallPinnedTab = pinned && !prefs.pinnedTabsFlexWidth;
					let isNormalTab = !isSmallPinnedTab && isTab(n);
					let isSplitView = !isNormalTab && isSplitViewWrapper(n);
					let r = getRect(n);
					let {width} = r;
					let deltaY = pointDelta(r.y, actionNodeRect.y);

					if (deltaY < 0) {
						currentRow.set(n, KEEP_STATE);
						continue;
					} else if (!deltaY) {
						// width of the tabs in the same row may differ a tiny bit, choose the smallest one for safety
						if (isNormalTab)
							unifiedWidth = Math.min(width, unifiedWidth);
						else if (isSplitView)
							unifiedSplitViewWidth = Math.min(width, unifiedSplitViewWidth, Math.max(unifiedWidth, splitViewMinWidth));

						if (!rowWidth) {
							rowWidth = pointDeltaH(slotRect.end, r.start);
							if (lastLayoutData && atFirstRow) {
								rowWidth -= lastLayoutData.postTabsItemsSize - scrollbox.scrollbarWidth;
								lockFirstRow = true;
							}
							remainingSpace = rowWidth;
						}
					}

					if (
						isClosingTab && n == actionNode ||
						(
							(selectingTabsOutsideGroup || n != selectedNode) &&
							tabsOfCollapsingGroup?.includes(n)
						) ||
						(
							stacking &&
							n != selectedNode &&
							n.multiselected &&
							pinned == selectedNodePinned &&
							(prefs.dragStackPreceding || n._tPos > selectedNode._tPos)
						)
					)
						continue;

					if (deltaY > 0 && unifiedSplitViewWidth == Infinity)
						unifiedSplitViewWidth = Math.max(unifiedWidth, splitViewMinWidth);

					let visualWidth = !deltaY
						? width
						: isNormalTab
							? unifiedWidth
							: isSplitView
								? unifiedSplitViewWidth
								: width;

					totalMinWidth += getMinWidth(n, r);
					totalVisualWidth += visualWidth;

					if (!hasNonPinned)
						if (pinned)
							hasPinned = true;
						else if (hasPinned) {
							hasNonPinned = true;
							let gap = prefs.gapAfterPinned;
							totalMinWidth += gap;
							totalVisualWidth += gap;
						}

					assert();

					//the next tab may sneak in if there is enough room.
					//can't find a way to force it to stay at the next row. it isn't a big deal thus don't borther
					if (!visuallyFitIn)
						break;

					if (!isSmallPinnedTab)
						currentRow.set(n, visualWidth);
					remainingSpace -= visualWidth;
				}

				if (this.isMovingTab || this.overflowing)
					this.lockSlotSize();

				let ignoreNewTab = false;
				if (visuallyFitIn && hasAdjacentNewTab) {
					totalMinWidth += newTabButtonWidth;
					totalVisualWidth += newTabButtonWidth;;
					assert();
					if (stacking || expandGroupOnDrop)
						ignoreNewTab = !visuallyFitIn;
					else {
						if (!canFitIn)
							currentRow.delete([...currentRow.keys()].at(-1));
						ignoreNewTab = canFitIn && !visuallyFitIn;
					}
				}
				this[ignoreNewTab ? "setAttribute" : "removeAttribute"]("ignore-newtab-btn", lockFirstRow ? "singlerow" : "multirows");

				let accurate = remainingSpace > .02;
				for (let n of nodes) {
					let size = currentRow.get(n);
					if (size == KEEP_STATE)
						continue;
					if (size && !accurate)
						if (isTab(n))
							size = unifiedWidth;
						else if (isSplitViewWrapper(n))
							size = unifiedSplitViewWidth;
					this._setLockedSize(n, size, accurate);
				}

				function assert() {
					canFitIn = pointDelta(totalMinWidth, rowWidth) <= 0;
					visuallyFitIn = pointDelta(totalVisualWidth, rowWidth) <= 0;
				}

				if (isClosingTab) {
					actionNode.removeAttribute("selected");
					actionNode.removeAttribute("visuallyselected");
				}

				this._clearSpacer();
				lock = true;
			}

			style(overflowContainer, {display: "", position: ""});
		} else
			this._clearSpacer();

		if (lock) {
			gBrowser.addEventListener("mousemove", this);
			addEventListener("mouseout", this);
		}
		this._hasTabTempMaxWidth = lock;

		console?.timeEnd("_lockTabSizing");
	};

	tabContainer._setLockedSize = function(node, width, accurate) {
		node[width ? "setAttribute" : "removeAttribute"]("size-locked", accurate ? "accurate" : "");
		style(node, {"--locked-size": width ? width + "px" : ""});
	};

	tabContainer._clearSpacer = function() {
		this.removeAttribute("using-closing-tabs-spacer");
		this._closingTabsSpacer.style.width = "";
	};

	tabContainer.lockSlotSize = function() {
		let r = getRect(slot);
		style(arrowScrollbox, {
			"--slot-width": r.width + "px",
			"--slot-height": r.height + "px",
		});
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
					getStyle(arrowScrollbox, "--slot-width") || getRect(slot).width + "px";
				style(scrollbox, {"overflow-y": "scroll !important"});
				style(this, {"--tabs-scrollbar-width": scrollbarWidth + "px"});
			}
			gBrowser.removeEventListener("mousemove", this);
			removeEventListener("mouseout", this);

			console?.timeEnd("_unlockTabSizing - general");

			await this.unlockSlotSize(instant);
		}

		await animateLayout(async () => {
			if (this._hasTabTempMaxWidth) {
				for (let n of $$("[size-locked]", arrowScrollbox))
					this._setLockedSize(n);
				delete this._hasTabTempMaxWidth;
			}

			this.removeAttribute("ignore-newtab-btn");
			this.removeAttribute("using-closing-tabs-spacer");
			this._closingTabsSpacer.style.width = "";

			if (unlockSlot) {
				style(slot, {minWidth: "", maxWidth: ""});
				scrollbox.style.overflowY = "";
				style(this, {"--tabs-scrollbar-width": ""});
			}
		}, {animate: !instant && this._hasTabTempMaxWidth});
	};

	tabContainer.unlockSlotSize = async function(instant) {
		instant ||= !this.overflowing;

		let oldHeight;
		if (!instant)
			oldHeight = slot.clientHeight - scrollbox.scrollTopMax + scrollbox.scrollTop;

		style(arrowScrollbox, {"--slot-height": "", "--slot-width": ""});

		if (instant) return;

		let delta = pointDelta(oldHeight, slot.clientHeight);
		if (delta <= 0) return;

		style(slot, {
			transition: "none !important",
			paddingBottom: delta + "px",
		});
		arrowScrollbox.instantScroll(scrollbox.scrollTop + delta);

		await rAF();

		style(slot, {transition: "", paddingBottom: ""});
		await waitForTransition(slot, "padding-bottom");
	};

	tabContainer.uiDensityChanged = function() {
		uiDensityChanged.apply(this, arguments);

		console?.time("uiDensityChanged");

		const HEIGHT_PREF = prefBranchStr + "tabContentHeight";
		style(root, {
			"--tab-height": "",
			"--tab-min-height": Services.prefs.prefHasUserValue(HEIGHT_PREF)
				? Math.min(Math.max(getPref(HEIGHT_PREF, "Int"), 16), TAB_CONTENT_HEIGHT[0] * 3) + "px"
				: "",
		});
		style(root, {
			"--tab-height": (tabHeight = +getRect(gBrowser.selectedNode).height.toFixed(4)) + "px",
		});

		let {newTabButton} = this;
		style(newTabButton, {"display": "flex !important"});
		newTabButtonWidth = getRect(newTabButton).width;
		newTabButton.style.display = "";

		style(tabsBar, {
			"--new-tab-button-width": newTabButtonWidth + "px",
		});

		let minWidthPref = this._tabMinWidthPref;
		let extraWidth = appVersion > 146
			? parseFloat(getStyle(tabContainer, "--tab-min-width-uidensity", true))
			: root.getAttribute("uidensity") == "touch"
				? appVersion > 136
					? Math.max(86 - minWidthPref, 0)
					: 10
				: 0;
		const propToStore = "strokeWidth";
		style(this, {
			[propToStore]: "var(--tab-split-view-min-width) !important",
			"--calculated-tab-min-width": (tabMinWidth = minWidthPref + extraWidth) + "px",
		});
		splitViewMinWidth = parseFloat(getComputedStyle(this)[propToStore]);
		this.style[propToStore] = "";

		console?.timeEnd("uiDensityChanged");

		updateNavToolboxNetHeight();
		this._updateInlinePlaceHolder();
	};
}

//auto collapse
{
	let shownPopups = new Set();

	for (let e of ["transitionstart", "transitionend"])
		tabContainer.addEventListener(e, onTransition);

	{
		let ctrl = gURLBar.controller;
		let listener = {
			[ctrl.NOTIFICATIONS.VIEW_OPEN]: () => gNavToolbox.setAttribute("urlbar-view-open", ""),
			[ctrl.NOTIFICATIONS.VIEW_CLOSE]: () => gNavToolbox.removeAttribute("urlbar-view-open"),
		};
		if (ctrl.addListener)
			ctrl.addListener(listener);
		else
			ctrl._listeners.add(listener);
	}

	/**
	 * @param {Event} e
	 * @this {MozTabbrowserTabs.arrowScrollbox.scrollbox}
	 */
	function onScrollend(e) {
		if (e.target != this || this.scrollTop > (tabContainer._scrollRows - 1) * tabHeight)
			return;
		style(tabContainer, {"--temp-open-padding": ""});
		this.removeEventListener("scrollend", onScrollend);
	}

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
	 * @this {ChromeWindow}
	 */
	function clearGhostPopup(e) {
		if (e.type == "keydown" && e.key != "Escape")
			return;
		for (let p of shownPopups)
			if (p.state != "open")
				shownPopups.delete(p);
		if (!shownPopups.size)
			tabContainer.removeAttribute("has-popup-open");
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

				let toggleListener = showing ? addEventListener : removeEventListener;
				for (let n of ["popupshown", "popuphidden"])
					toggleListener(n, setPopupOpen, true);

				toggleListener("mousedown", clearGhostPopup, true);
				toggleListener("keydown", clearGhostPopup, true);

				if (prefs.autoCollapseCurrentRowStaysTop) {
					if (start) {
						let scroll = this._scrollRows * tabHeight - slot.clientHeight + scrollbox.scrollTop;
						if (scroll) {
							style(this, {"--temp-open-padding": scroll + "px"});
							scrollbox.addEventListener("scrollend", onScrollend);
						}
					} else {
						style(this, {"--temp-open-padding": ""});
						scrollbox.removeEventListener("scrollend", onScrollend);
					}
				}
			}
		}
	}
}

/* gBrowser */
{
	define(gBrowser, {
		selectedNode: function() {
			return asNode(this.selectedTab);
		},
		selectedNodes: function() {
			return [...new Set(this.selectedTabs.map(asNode))];
		},
	});

	define(gBrowser, {
		pinnedTabCount: function() {
			return this._numPinnedTabs;
		},
	}, false);

	let {
		addTab, removeTab, pinTab, unpinTab, pinMultiSelectedTabs,
		_updateTabBarForPinnedTabs, createTabsForSessionRestore, addTabGroup,
		replaceTabsWithWindow, replaceGroupWithWindow,
		unsplitTabs,
	} = gBrowser;

	/* #splitview-patch for fx 146*/
	let {moveTabToGroup} = gBrowser;
	if (moveTabToGroup)
		gBrowser.moveTabToGroup = function() {
			let {isTab} = this;
			this.isTab = isTabLike;
			moveTabToGroup.apply(this, arguments);
			assign(this, {isTab});
		};
	/******/

	gBrowser.addTab = function(uri, o) {
		let tab;
		try {
			animateLayout(
				() => {
					let oldNodes = getNodes({onlyFocusable: true});
					tab = addTab.call(this, uri, assign(o, {skipAnimation: true}));
					//because of the fix of bug #1997096, multiple nodes may become visible after creating a tab
					return tab?.group?.collapsed == false
						? getNodes({onlyFocusable: true}).filter(n => !oldNodes.includes(n))
						: tab;
				},
				{animate: !o?.skipAnimation},
			);
		} catch(e) {
			window.console.error(e);
		}
		return tab;
	};

	gBrowser.removeTab = function(tab, o) {
		let nodes = getNodes({onlyFocusable: true});
		if (!nodes[1] && nodes[0] == tab)
			this[CLOSING_THE_ONLY_TAB] = true;

		if (animatingLayout || !o?.animate || !this.visibleTabs.includes(tab) || gReduceMotion)
			removeTab.call(this, tab, assign(o, {animate: false}));
		else {
			let nodes = getNodes({newTabButton: true, includeClosing: true});
			let {splitview} = tab;
			if (splitview)
				nodes.push(...splitview.tabs);
			animateLayout(() => {
				let oldOrder = getComputedStyle(tab)?.order;
				removeTab.apply(this, arguments);
				if (!tab.closing || !tab.isConnected) {
					assign(animatingLayout, {cancel: true});
					return;
				}
				tabContainer._setLockedSize(tab);
				tab.setAttribute("fadein", true);
				tab.setAttribute("closing", "");

				if (splitview && !splitview.visibleTabs[0])
					splitview.setAttribute("closing", "");

				tabContainer._updateInlinePlaceHolder();
				//the closing tab is stuck at the row end
				//and need to be translated manually to make it happen at the right place.
				//currently closing multiple tabs is not handled since the tabs are closed from rear to front
				//and it's unable to know if the tab will be placed at the previous row end
				//if all closing tabs become zero width
				if (animatingLayout && !splitview) {
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
						if (!nxtNode || pointDelta(r.y - tabsRect.y, newR.y - newTabsRect.y)) {
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
				nodes,
				shouldUpdatePlacholder: false,
			}).then(() => {
				if (!tab.closing)
					return;
				tab.removeAttribute("fadein");
				tab.dispatchEvent(assign(new Event("transitionend", {bubbles: true}), {propertyName: "max-width"}));
				console?.debug("removed", tab);
			});
		}

		delete this[CLOSING_THE_ONLY_TAB];
	};

	gBrowser.pinTab = function(tab) {
		/*global FirefoxViewHandler*/
		if (tab.pinned || tab == FirefoxViewHandler.tab)
			return pinTab.apply(this, arguments);

		let pinningMultiTabs = isCalledBy("pinMultiSelectedTabs");

		//ensure the tab size is unlocked
		tabContainer._setLockedSize(tab);

		animateLayout(() => {
			pinTab.apply(this, arguments);
			//pinned tab with a negative margin inline end stack will shrink
			//thus set a min width to prevent
			if (!prefs.pinnedTabsFlexWidth)
				style(tab, {minWidth: getRect(tab).width + "px !important"});
		}).then(() => {
			//here is executed after pinMultiSelectedTabs.apply() if pinning multi tabs
			//the min-width is handled there thus dont bother
			if (!pinningMultiTabs)
				tab.style.minWidth = "";
		});
	};

	gBrowser.unpinTab = function(tab) {
		let run = () => {
			unpinTab.apply(this, arguments);
			style(tab, {
				top: "",
				insetInlineStart: "",
			});
		};
		if (isCalledBy("restoreTab"))
			run();
		else
			animateLayout(run, {animate: tab.pinned});
	};

	gBrowser.pinMultiSelectedTabs = function() {
		animateLayout(() => pinMultiSelectedTabs.apply(this, arguments))
			.then(() => {
				if (!tabContainer.isFinishingTabMove)
					this.selectedTabs.forEach(tab => tab.style.minWidth = "");
			});
	};

	//all functions in this method are handled on animateLayout thus it is unnecessary in most cases,
	//and may cause unexpected problems since this method is called at undesired moment
	gBrowser._updateTabBarForPinnedTabs = function() {
		if (tabContainer.isFinishingTabMove)
			return;
		_updateTabBarForPinnedTabs.apply(this, arguments);
		if (!animatingLayout && gBrowser.pinnedTabsContainer)
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
				for (let t of group.tabLikes)
					t.setAttribute("closing", "");
				w = replaceGroupWithWindow.apply(this, arguments);
			});
			//update before the group is actually removed
			group.addEventListener("TabGroupRemoved", () => tabContainer._updateInlinePlaceHolder());
			return w;
		};

	if (unsplitTabs)
		gBrowser.unsplitTabs = function(splitview) {
			let run = () => unsplitTabs.apply(this, arguments);
			if (splitview)
				animateLayout(() => {
					run();
					tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
				}, {
					nodes: getNodes({newTabButton: true, includeClosing: true})
						.flatMap(n => n == splitview ? splitview.tabs : n),
				});
			else
				run();

		};

	gBrowser.replaceTabsWithWindow = function(contextTab) {
		let w;
		let nodes = contextTab.multiselected ? this.selectedNodes : [contextTab];
		animateLayout(() => {
			w = replaceTabsWithWindow.apply(this, arguments);
			for (let n of nodes) {
				n.setAttribute("fadein", true);
				n.setAttribute("closing", "");
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

/* TabContextMenu */
{
	let {moveTabsToSplitView} = TabContextMenu;

	if (moveTabsToSplitView)
		TabContextMenu.moveTabsToSplitView = function() {
			let sv;
			animateLayout(() => {
				let {addTabSplitView} = gBrowser;
				let tabs, addNewTab = this.contextTabs.length < 2;
				try {
					gBrowser.addTabSplitView = function(tabsToAdd) {
						tabs = tabsToAdd;
						return sv = addTabSplitView.apply(this, arguments);
					};

					moveTabsToSplitView.apply(this, arguments);

					if (sv)
						tabContainer._unlockTabSizing({instant: true, unlockSlot: false});

					tabContainer._updateInlinePlaceHolder();

					if (animatingLayout && sv) {
						let {rects, nodes} = animatingLayout;
						let [fT, sT] = tabs;
						if (addNewTab) {
							nodes.push(sT);
							rects.set(sT, rects.get(fT).clone().collapse());
						}
					}
				} finally {
					assign(gBrowser, {addTabSplitView});
				}
			}, {shouldUpdatePlacholder: false});
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
		"ungroupSplitViews",
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

let lastSlotWidth;
let tabsResizeObserver = new ResizeObserver(() => {
	console?.time("tabContainer ResizeObserver");

	let multiRowsPreviously = tabContainer.hasAttribute("multirows");
	let count = getRowCount(), scrollCount = Math.min(getRowCount(true), maxTabRows());
	let slotWidth = getRect(slot).width;
	tabsBar.toggleAttribute("tabs-multirows", count > 1);
	tabContainer.toggleAttribute("multirows", count > 1);
	tabContainer._scrollRows = scrollCount;
	style(root, {
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

	if (pointDelta(slotWidth, lastSlotWidth))
		tabContainer._unlockTabSizing({instant: true});
	lastSlotWidth = slotWidth;
});

for (let box of [tabContainer, slot])
	tabsResizeObserver.observe(box);

$("#toolbar-menubar").addEventListener("toolbarvisibilitychange", () => {
	onPrefChange(null, null, "menubar-autohide-change");
	updateNavToolboxNetHeight();
}, true);

arrowScrollbox._updateScrollButtonsDisabledState();
if ("hideAllTabs" in prefs)
	toggleAllTabsButton();

observeDPRChange(() => style(root, {"--device-pixel-ratio": devicePixelRatio}));

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

/** @param {(Element|null)} n */
function isTab(n) {
	return n?.tagName == "tab";
}

/** @param {(Element|null)} n */
function isTabGroupLabel(n) {
	return !!n?.classList?.contains("tab-group-label");
}

/** @param {(Element|null)} n */
function isTabGroupLabelContainer(n) {
	return !!n?.classList?.contains("tab-group-label-container");
}

/** @param {(Element|null)} n */
function isTabGroupOverflowContainer(n) {
	return !!n?.classList?.contains("tab-group-overflow-count-container");
}

/** @param {Element|null} n */
function isSplitViewWrapper(n) {
	return n?.tagName == "tab-split-view-wrapper";
}

/** @param {Element|null} n */
function isTabLike(n) {
	return isTab(n) || isSplitViewWrapper(n);
}

/**
 * @param {Element} n
 * @param {Rect} [r]
 */
function getVisualMinWidth(n, r = getRect(n)) {
	if (n?.isConnected && n.hasAttribute("size-locked"))
		return parseFloat(getStyle(n, "--locked-size"));
	return getMinWidth(n, r);
}

/**
 * @param {Element} n
 * @param {Rect} [r]
 */
function getMinWidth(n, r = getRect(n)) {
	return !n?.isConnected
		? 0
		: isTab(n)
			? n.pinned && !prefs.pinnedTabsFlexWidth
				? r.width
				: tabMinWidth
			: isSplitViewWrapper(n)
				? splitViewMinWidth
				: r.width;
}

/**
 * @param {Element} item
 * @returns {Element}
 */
function elementToMove(item) {
	return asNode(item);
}

/**
 * @param {Element} item
 * @returns {Element}
 */
function asNode(item) {
	return isTab(item)
		? item.splitview ?? item
		: isTabGroupLabel(item)
			? item.group.labelContainerElement
			: item;
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
	) {
		//using selector is fast than ariaFocusableItems w/o cache 1.5 times
		nodes = $$(`
			:is(
				#tabbrowser-arrowscrollbox,
				${includeClosing ? `[collapsed][toggling=collapse],` : ""}
				tab-group:not([collapsed])
			) >
				:is(
					tab:not([hidden]),
					tab-split-view-wrapper
				),
			${includeClosing ? `tab-group[collapsed] > tab[closing],` : ""}
			.tab-group-label-container,
			[collapsed][hasactivetab]:not([stacked]) >
				:is(
					tab[selected],
					tab-split-view-wrapper[hasactivetab]
				)
		`, arrowScrollbox);
		bypassCache = true;
	} else
		nodes =
			(tabContainer.dragAndDropElements ?? tabContainer.ariaFocusableItems)
				?.map(n => isTabGroupLabel(n) ? n.group.labelContainerElement : n) ||
			gBrowser.visibleTabs.slice();

	if (!includeClosing)
		nodes = nodes.filter(n => !n.closing && !n.hasAttribute("closing"));

	if (!bypassCache && SPLIT_VIEW_SUPPORT)
		if (!tabContainer.dragAndDropElements)
			nodes = nodes.flatMap(n =>
				n.splitview
					? n == n.splitview.visibleTabs[0]
						? n.splitview
						: []
					: n
			);
		else
			/* #splitview-patch for fx 147a */
			nodes = nodes.filter(n =>
				!n.matches(
					`tab-group[collapsed]${includeClosing ? ":not([toggling=collapse])" : ""} >
						tab-split-view-wrapper:not([hasactivetab])`
				)
			);

	if (!pinned) {
		let {selectedNode} = gBrowser;
		let {group} = selectedNode || {};
		if (group?.collapsed)
			if (group.stacked) {
				if (!bypassCache)
					nodes = nodes.filter(n => n != selectedNode);
			} else if (!onlyFocusable && group.isShowingOverflowCount) {
				let idx = nodes.findLastIndex(n => n == selectedNode);
				if (idx > -1)
					nodes.splice(idx + 1, 0, group.overflowContainer);
				else
					window.console.error(
						"Can't find the selected tab in group.",
						{selectedNode, group, nodes},
					);
			}
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
	return +getStyle(scrollbox, "--max-tab-rows", true);
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
	style(root, {"--nav-toolbox-net-height": netHeight + "px"});

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
	if (debug)
		window.MultiTabRows = {
			getNodes,
			getRect,
			getVisualRect,
			animateLayout,
			animateShifting,
			waitForAnimate,
			waitForTransition,
		};
	else
		delete window.MultiTabRows;
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
			eval(`${context}; f = function ${newMethod} ${code};`);
			element.prototype[newMethod] = f;
			relatedMehtods.forEach(m => exposePrivateMethod(element, m, context));
		} catch(e) {
			alert([SCRIPT_FILE_NAME,e,e.stack,method].join("\n"));
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
		translated, includeClosing = true,
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
	tabContainer.tabDragAndDrop.updateStackingInfo();

	if (animate && !cancel) {
		console?.log("animate layout");
		console?.trace();
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async rs => {
			await rAF();

			for (let n of nodes)
				if (!newRects.has(n))
					newRects.set(n, getRect(n));

			deltaNodes = [deltaNodes].flat().filter(v => v);

			if (isTabGroupOverflowContainer(deltaNodes[0])) {
				let oc = deltaNodes[0];
				let group = oc.closest("tab-group");
				let collapsing = group.getAttribute("toggling") == "collapse";
				let r = rects.get(
					collapsing
						? group.nonHiddenTabLikes.at(-1)
						: group.labelContainerElement
				)?.clone().collapse();
				if (r) {
					nodes.push(oc);
					rects.set(oc, r);
					newRects.set(oc, getRect(oc));

					if (!collapsing)
						tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
				}
			} else if (
				(
					deltaNodes =
					deltaNodes.filter(n =>
						isTabLike(n) &&
						(!n.pinned || prefs.pinnedTabsFlexWidth)
					).sort((a, b) => (a._tPos ?? a.tabs?.[0]?._tPos) - (b._tPos ?? b.tabs?.[0]?._tPos))
				)[0]
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
		});
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

	let s = pointDelta(oS, nS), y = pointDelta(oY, nY), w = pointDelta(oW, nW);
	let {abs} = Math;
	if (abs(s) < 1 && abs(y) < 1 && (abs(w) < 1 || !isTabLike(t))) {
		if (t.hasAttribute("animate-shifting"))
			style(t, {
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
		style(t, {
			"--x": s + "px",
			"--y": y + "px",
			"--w": w + "px",
			"--l": nW + "px",
			"--width-rounding-diff": wrd + "px",
			"--height-rounding-diff": hrd + "px",
		});

		await rAF();

		t.setAttribute("animate-shifting", "run");
		style(t, {"--x": "", "--y": "", "--w": ""});

		rs();
	}));
	delete t[APPLYING_ANIMATION];

	await waitForAnimate(t);

	t.removeAttribute("animate-shifting");
	style(t, {"--l": ""});
	if (["--translate-x", "--translate-y"].every(p => !getStyle(t, p)))
		style(t, {"--width-rounding-diff": "", "--height-rounding-diff": ""});

	delete t[ANIMATE_REQUEST];

	return t;
}

/** @param {Element} n */
async function waitForAnimate(n) {
	let anis = ["translate", "transform"].map(p => waitForTransition(n, p));
	if (isTabLike(n))
		anis.push(waitForTransition(
			n.stack ?? n,
			`margin-${END}`,
			n.stack ? "" : "::after",
		));
	anis = await Promise.all(anis);
	if (anis.some(a => a) && !anis.every(a => a))
		//ensure there is no running animation
		await waitForAnimate(n);
}

/**
 * @param {Element} node
 * @param {string} property
 * @param {"::before"|"::after"|""} [pseudo]
 * @returns {Promise<Animation>}
 */
async function waitForTransition(node, property, pseudo) {
	try {
		return await node.getAnimations(pseudo ? {subtree: true} : undefined)
			.find(ani =>
				ani.transitionProperty == property &&
				ani.effect.target == node &&
				ani.effect.pseudoElement == pseudo
			)?.finished;
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
	if (isTab(n) || isSplitViewWrapper(n)) {
		let cs = getComputedStyle(
			n.stack ?? n,
			n.stack ? "" : "::after"
		);
		//in case there is no CS, e.g. the node is disconnected
		r.width -= parseFloat(cs?.marginInlineEnd) || 0;
		if (!n.stack)
			//a property that store the value of the original margin inline end
			r.width += parseFloat(cs?.minHeight) || 0;
	}
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
 * @param {(Node|null)} node
 * @param {Object} [param1={}]
 * @param {("margin"|"border"|"padding"|"content")} [param1.box]
 * @param {(boolean|"transorm"|"translate"|Array<"transorm"|"translate">)} [param1.translated] return the translated box
 * @param {boolean} [param1.checkVisibility] if visibility is collapse, then size = 0, end = start
 * @param {boolean} [param1.scroll] return the scroll size
 * @param {boolean} [param1.noFlush] using getBoundsWithoutFlushing instead
 */
function getRect(node, {box, translated, checkVisibility, scroll, noFlush} = {}) {
	let cs;
	if (
		!node?.isConnected ||
		//in some weird cases, the cs is null
		["none", "contents", undefined].includes(
			(cs = getComputedStyle(node instanceof Element ? node : node.parentNode))?.display
		)
	) {
		let r = new Rect();
		if (debug)
			r.element = node;
		return r;
	}
	if (box && noFlush)
		throw new Error("box argument is not supported when using noFlush");
	let r;
	if (noFlush)
		r = windowUtils.getBoundsWithoutFlushing(node);
	// eslint-disable-next-line no-cond-assign
	else if (r = node.getBoxQuads({box})[0]) {
		//dont use the DOMQuad.getBounds() since it can't handle negative size
		let {p1, p3} = r;
		r = new DOMRect(p1.x, p1.y, p3.x - p1.x, p3.y - p1.y);
	}
	if (!r) {
		console?.warn("Can't get bounds of element");
		console?.debug(node);
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
		width += node.scrollWidth - node.clientWidth;
		height += node.scrollHeight - node.clientHeight;
	}

	return new Rect(start, y, width, height, widthRoundingDiff, heightRoundingDiff);
}

/**
 * @param {string} func
 * @param {string} [ignoreFunc]
 */
function isCalledBy(func, ignoreFunc) {
	let {stack} = new Error();
	let match = stack.match(new RegExp(`^(${func})@`, "m"));
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

async function defer() {
	await new Promise(rs => setTimeout(rs));
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
	return Object.assign(o, p);
}

/**
 * @param {Element} n
 * @param {Object} p
 * @returns {Element}
 */
function style(n, p) {
	if (!n) return n;
	let s = n.style;
	for (let [k, v] of Object.entries(p)) {
		let isVar = k.startsWith("--");
		if (v !== "" && v != null) {
			let i;
			// eslint-disable-next-line no-constant-binary-expression
			v = (v + "").replace(/\s*!\s*important\s*$/i, () => (i = "important") && "");
			if (isVar)
				s.setProperty(k, v, i);
			else if (i) {
				k = k.replace(/[A-Z]/g, c => "-" + c.toLowerCase());
				s.setProperty(k, v, i);
			} else
				s[k] = v;
		} else if (isVar)
			s.removeProperty(k);
		else
			s[k] = v;
	}
	return n;
}

/**
 * @param {Element} n
 * @param {string} p
 * @param {boolean} [computed]
 * @param {string} [pseudo]
 * @returns {string}
 */
function getStyle(n, p, computed, pseudo) {
	if (!n) return;
	return (computed ? getComputedStyle(n, pseudo) : n.style).getPropertyValue(p);
}

/**
 * Defines properties on the target object `o` using the descriptors provided in `p`.
 * `configurable` of all properties default to `true` if not specified.
 *
 * @param {Object} obj - The target object on which properties will be defined.
 * @param {Object} props - An object containing property definitions. Each key in `p` represents a property name,
 *   and its value can be one of the following:
 *   - A function: treated as a getter. The property will be defined using `Object.defineProperty` with this function as the `get` method.
 *   - An object: used directly as the property descriptor for `Object.defineProperty`. Get/toggle the specified attribute if get/set is a string.
 *   - A string: get and toggle the specified attribute.
 *   - A falsy: will be ignored.
 * @param {boolean} [overwrite=true] Whether the existing properties on `o` will be overwritten.
 * @returns {Object} the `obj`.
 */
function define(obj, props, overwrite = true) {
	for (let [n, v] of Object.entries(props)) {
		if (!v || !overwrite && n in obj)
			continue;
		switch (typeof v) {
			case "function":
				v = {get: v}; break;
			case "string":
				v = {get: v, set: v}; break;
		}

		let {get, set} = v;
		if (typeof get == "string")
			v.get = function() {
				return this.hasAttribute(get);
			};
		if (typeof set == "string")
			v.set = function(v) {
				this.toggleAttribute(set, !!v);
			};

		if (!("configurable" in v))
			v.configurable = true;

		Object.defineProperty(obj, n, v);
	}
	return obj;
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
return true;
} //end function setup()

} catch(e) {alert([SCRIPT_FILE_NAME,e,e.stack].join("\n"));console.error(e)}
