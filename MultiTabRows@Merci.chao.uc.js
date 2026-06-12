"use strict";
// ==UserScript==
// @name           Multi Tab Rows (MultiTabRows@Merci.chao.uc.js)
// @description    Make Firefox support multiple rows of tabs.
// @author         Merci chao
// @version        4.9.1
// @compatibility  Firefox 115, 140, 151-153
// @homepageURL    https://github.com/Merci-chao/userChrome.js#multi-tab-rows
// @changelogURL   https://github.com/Merci-chao/userChrome.js#changelog
// @supportURL     https://github.com/Merci-chao/userChrome.js/issues/new
// @updateURL      https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js
// ==/UserScript==

/* global
   gBrowser, RTL_UI, Services, Cu, Cc, Ci, promiseDocumentFlushed,
   gURLBar, gNavToolbox, gReduceMotion, FullScreen, TAB_DROP_TYPE, InspectorUtils, windowUtils,
   gNotificationBox, gTabsPanel, AIWindow, fullScreen,
*/

if (document.documentElement.matches(`[windowtype="navigator:browser"]:not([chromehidden~=toolbar])`)) {

const SCRIPT_NAME = "Multi Tab Rows";
const SCRIPT_FILE_NAME = "MultiTabRows@Merci.chao.uc.js";

try {
const appVersion = parseInt(Services.appinfo.version);

const DOCUMENT_GLOBAL = "documentGlobal" in document
	? "documentGlobal" : "ownerGlobal";
const ON_UI_DENSITY_CHANGED = "on_uidensitychanged" in customElements.get("tabbrowser-tabs").prototype
	? "on_uidensitychanged" : "uiDensityChanged";

if (gBrowser?._initialized) {
	if (setup()) {
		let tc = gBrowser.tabContainer;
		if (gBrowser.pinnedTabsContainer)
			tc.arrowScrollbox.prepend(...tc.visibleTabs.slice(0, gBrowser.pinnedTabCount));
		tc[ON_UI_DENSITY_CHANGED]();
		tc._invalidateCachedTabs();
		tc.updateLayout();
		tc._handleTabSelect(true);
		updateNavBarOverflow();
	}
} else
	addEventListener("DOMContentLoaded", () => {
		try { setup() }
		catch (e) {
			showError(e, e.stack);
		}
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
	/** @type {boolean} */
	relative = false;
	/** @type {boolean} */
	visible;
	/** @type {number} */
	widthRoundingDiff;
	/** @type {number} */
	heightRoundingDiff;

	/** @param {("start"|"y")} n */
	#pos(n) {
		let v = n == "y" ? this.#y : this.#start;
		if (v == null)
			window.console.error("Can't access position of a hidden or disconnected element", this.element);
		return v ?? 0;
	}

	/** @param {number} v */
	set start(v) {this.#start = v;}
	get start() {return this.#pos("start");}

	/** @param {number} v */
	set end(v) {this.width = (v - this.start) * DIR;}
	get end() {return this.start + this.width * DIR;}

	/** @param {number} v */
	set x(v) {this[LEFT] = v;}
	get x() {return this[LEFT];}

	/** @param {number} v */
	set right(v) {this[RIGHT] = v;}
	get right() {return this[RIGHT];}

	/** @param {number} v */
	set left(v) {this.x = v;}
	get left() {return this.x;}

	/** @param {number} v */
	set y(v) {this.#y = v;}
	get y() {return this.#pos("y");}

	/** @param {number} v */
	set top(v) {this.y = v;}
	get top() {return this.y;}

	/** @param {number} v */
	set bottom(v) {this.height = v - this.y;}
	get bottom() {return this.y + this.height;}

	get centerX() {return this.start + this.width / 2 * DIR;}
	get centerY() {return this.y + this.height / 2;}

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

const prefBranchStr = "userChromeJS.multiTabRows@Merci.chao.";

(async () => {
	let name = "currentVersion";
	if (!getPref(prefBranchStr + name)) {
		let {prefs} = Services;
		let compatibilityPref = prefBranchStr + "incompatible";
		let {version, compatible, compatibility} = await getScriptInfo();

		prefs.getDefaultBranch(prefBranchStr).setStringPref(name, version);
		prefs.lockPref(prefBranchStr + name);
		if (compatible)
			prefs.clearUserPref(compatibilityPref);
		else {
			let prefValue = version + "_" + appVersion;
			if (getPref(compatibilityPref) != prefValue) {
				let ver = compatibility.at(-1)[0];
				let texts = l10n({
					en: {
						msg: `You are using Firefox ${appVersion} and this script may not be fully compatible. Please update to Firefox ${ver} or above to ensure the compatibility.`,
						checkMsg: "Don't show again",
					},
					ja: {
						msg: `Firefox ${appVersion} を使用しています。このスクリプトは完全な互換性がない可能性があります。互換性を確保するため、Firefox ${ver} 以上に更新してください。`,
						checkMsg: "今後表示しない",
					},
				});

				await defer();

				let checked = {};
				Services.prompt.alertCheck(
					window,
					`${SCRIPT_NAME} (${SCRIPT_FILE_NAME})`,
					texts.msg,
					texts.checkMsg,
					checked,
				);

				if (checked.value)
					prefs.setStringPref(compatibilityPref, prefValue);
			}
		}
	}
})();

const tabsBar = $("#TabsToolbar");
const {tabContainer} = gBrowser, {arrowScrollbox} = tabContainer, {scrollbox} = arrowScrollbox;
const slot = $("slot", scrollbox);

const emptyFunc = () => {};

{
	let {prefs} = Services;
	let vTab = "sidebar.verticalTabs";
	try {
		let needRestart;

		try {
			if (getPref(vTab)) {
				prefs.setBoolPref(vTab, false);
				needRestart = true;
			}
		// eslint-disable-next-line no-unused-vars
		} catch (e) {
			// in case the pref is created manually
			prefs.clearUserPref(vTab);
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
		showError(e, e.stack);
	}
}

const CLOSING_THE_ONLY_TAB = Symbol("closingTheOnlyTab");
const TEMP_SHOW_CONDITIONS = `:is(
	:hover:not(:-moz-window-inactive),
	[temp-open][has-popup-open],
	[dragging],
	:focus-within
):not([urlbar-view-open] #tabbrowser-tabs)`;
const MENUBAR_AUTOHIDE = appVersion > 142 ? "[autohide]" : "[autohide=true]";
const THEME_IMAGE_IN_TOOLBOX = appVersion > 152 ? "theme-image-in-toolbox" : "lwtheme-image-y-align";

const win7 = matchMedia("(-moz-platform: windows-win7)").matches;
const win8 = matchMedia("(-moz-platform: windows-win8)").matches;
const accentColorInTitlebarMQ = matchMedia("(-moz-windows-accent-color-in-titlebar)");
const micaMQ = matchMedia("(-moz-windows-mica)");
const novaMQ = matchMedia(`-moz-pref("browser.nova.enabled")`);
const OVERLAY_SCROLLBARS = matchMedia("(-moz-overlay-scrollbars)").matches;

let micaEnabled = false,
	mica = false,
	micaTheme = false,
	defaultDarkTheme = false,
	defaultAutoTheme = false,
	defaultTheme = false,
	bgImgTheme = false,
	bgImgHasRepeat = false,
	bgImgAllRepeat = false,
	nova = false;

const lastLayoutData = {};

const root = document.documentElement;

const TABS_RELATED_PANELS = `
	#tab-preview-panel,
	#tabgroup-preview-panel,
	#tab-group-editor .tab-group-editor-panel,
	#tabNotePanel
`;

const NATIVE_DRAG_TO_PIN = !!window.TabDragAndDrop;
const TAB_GROUP_SUPPORT = "tabGroups" in gBrowser;
const SPLIT_VIEW_SUPPORT = "addTabSplitView" in gBrowser;
const SPLIT_VIEW_NEED_PATCH = SPLIT_VIEW_SUPPORT && !("adoptSplitView" in gBrowser);
const TAB_NOTE_SUPPORT = "tabNoteMenu" in gBrowser;
const TAB_GROUP_PREVIEW_SUPPORT = appVersion > 143;
const TAB_STACKING_SUPPORT = appVersion > 148 || "TabStacking" in window;
const BACKGROUND_ON_BODY = appVersion > 148 && !gNavToolbox.matches(".browser-toolbox-background");
const AI_WINDOW_SUPPORT = appVersion > 148;

const FOR_GROUP = 1;
const FOR_TAB = 2;

const TAB_CONTENT_HEIGHT_NOVA = 32;
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
		["--window-min-width", 450],
		["--tab-block-margin", 4],
		["--tab-inline-padding", 8],
		["--tab-overflow-clip-margin", 2],
	].map(([p, d]) => parseFloat(cs.getPropertyValue(p) || d))
		.concat(
			+cs.getPropertyValue("--tab-dragover-transition").match(/\d+|$/)[0] || 200
		);
})();
let TAB_BLOCK_MARGIN_CURRENT = TAB_BLOCK_MARGIN;

/** @type {(Console|null)} */
let console;
let debug = false;

/** @type {Object} */
let prefs;
function createDefaultPrefs() {
	const shouldClip = win7 || win8
		? defaultTheme
		: !!(
			mica && getPref("browser.tabs.inTitlebar") ||
			getPref(prefBranchStr + "nativeWindowStyle")
		);
	return {
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
		tabsUnderControlButtons: 2,
		debugMode: 0,
		floatingBackdropClip: shouldClip,
		floatingBackdropBlurriness: appVersion > 116 ? 5 : null,
		floatingBackdropOpacity:
			appVersion < 117 || shouldClip
					? 100 : 25,
		compactControlButtons: win7 || win8 ? null : false,
		hideAllTabs: $("#alltabs-button")?.getAttribute("removable") == "false" ? false : null,
		checkUpdate: 1,
		checkUpdateFrequency: 1,
		dynamicMoveOverThreshold: TAB_GROUP_SUPPORT ? true : null,
		nativeWindowStyle: appVersion > 130 ? false : null,
		nativeWindowStyleToolbarColorOpacity:
			appVersion > 130
				? !nova && getPref(prefBranchStr + "tabsAtBottom")
					? 0 : 100
				: null,
		nativeWindowStyleURLBarColorOpacity: appVersion > 130 ? 100 : null,
		animationDuration: ANIMATE_DURATION,
		autoCollapse: false,
		autoCollapseDelayExpanding: 100,
		autoCollapseDelayCollapsing: 400,
		// autoCollapseCurrentRowStaysTop: false,
		hideDragPreview: FOR_GROUP,
		tabsAtBottom: appVersion > 132 ? 0 : null,
		tabMaxWidth: 225,
		hideScrollButtonsWhenDragging: false,
		scrollButtonsSize: 10,
		justifyCenter: 0,
		checkUpdateAutoApply: 1,
		pinnedTabsFlexWidth: false,
		pinnedTabsFlexWidthIndicator: false,
		animateTabMoveUnderLimit: 200,
		hidePinnedDropIndicator: $("#pinned-drop-indicator") ? false : null,
		dragStackPreceding: true,
		privateBrowsingIconOnNavBar: $("#private-browsing-indicator-with-label") ? null : false,
		tabContentHeight:
			nova
				? TAB_CONTENT_HEIGHT_NOVA
				: (
					TAB_CONTENT_HEIGHT[getPref("browser.uidensity")] ||
					TAB_CONTENT_HEIGHT[0]
				),
		tabVerticalMargin: TAB_BLOCK_MARGIN_CURRENT,
		tabHorizontalPadding: TAB_INLINE_PADDING,
		tabHorizontalMargin: TAB_INLINE_MARGIN,
		previewPanelNoteEditable: TAB_NOTE_SUPPORT ? true : null,
		previewPanelShifted: TAB_GROUP_PREVIEW_SUPPORT ? FOR_TAB | FOR_GROUP : null,
		previewPanelShiftedAlways: TAB_GROUP_PREVIEW_SUPPORT ? false : null,
		newTabButtonAfterLastTab: true,
		positionPinnedTabs: true,
		lastRowTabsFlexibe: true,
		animateTabMoveShiftKeyToPause: true,
		// dlpButtonOnNavBar: $(".content-analysis-indicator") ? false : null,
		smartWindowButtonOnNavBar: appVersion > 148 ? false : null,
		showScrollShadow: true,
		themeImageSize: bgImgHasRepeat ? -1 : 0,
		controlButtonsAutoHide: win7 || win8 ? null : 0,
		controlButtonsAutoHideTriggerHeight: win7 || win8 ? null : 2,
		hamburgerMenuOnTabBar: window.AIWindow?.init.toString().includes("_updateToolbarButtonPositions") == false
			? true : null,
	};
}

const PREFS_TO_PROPS = {
	"browser.tabs.dragDrop.multiselectStacking": {
		name: "multiselectStacking",
		default: TAB_STACKING_SUPPORT,
	},
	"browser.tabs.dragDrop.dragToPin.enabled": {
		name: "_dragToPinEnabled",
		default: NATIVE_DRAG_TO_PIN,
	},
	...(
		TAB_GROUP_SUPPORT &&
		{
			"browser.tabs.dragDrop.createGroup.enabled": {
				name: "_tabGroupDragToCreate",
				default: true,
			},
		}
	),
};

const setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
	value != null &&
	branch[`set${{string: "String", number: "Int", boolean: "Bool"}[typeof value]}Pref`](name, value)
);
const getPrefs = (branch, data) => Object.fromEntries(
	Object.entries(data).filter(([, value]) => value != null)
		.map(([name, value]) => [name, branch[`get${{string: "String", number: "Int", boolean: "Bool"}[typeof value]}Pref`](name)])
);

//migrate old prefs
{
	let {prefs} = Services;
	for (let [name, action] of Object.entries({
		animateTabMoveMaxCount: null,

		disableDragToPinOrUnpin: v =>
			v == NATIVE_DRAG_TO_PIN &&
			prefs.setBoolPref("browser.tabs.dragDrop.dragToPin.enabled", !v),

		dragToGroupTabs: v =>
			v == false &&
			prefs.setBoolPref("browser.tabs.dragDrop.createGroup.enabled", v),

		showScrollSahdow: v =>
			v == false &&
			prefs.setBoolPref(prefBranchStr + "showScrollShadow", v),

		dynamicThemeImageSize: v =>
			v &&
			prefs.setIntPref(prefBranchStr + "themeImageSize", 2),
	})) {
		name = prefBranchStr + name;
		action?.(getPref(name));
		prefs.clearUserPref(name);
	}
}

updateThemeStatus();
loadPrefs();

Object.keys(prefs).forEach(n => Services.prefs.addObserver(prefBranchStr + n, onPrefChange));
let observedBrowserPrefs = [
	"browser.ai.control.smartWindow",
	"browser.smartwindow.enabled",
	"browser.tabs.dragDrop.moveOverThresholdPercent",
	"browser.tabs.groups.enabled",
	"browser.tabs.inTitlebar",
	"browser.tabs.notes.enabled",
	"browser.tabs.tabMinWidth",
	"browser.toolbars.bookmarks.visibility",
	"browser.uidensity",
	"extensions.activeThemeID",
	"layout.css.has-selector.enabled",
	"sidebar.position_start",
	"toolkit.tabbox.switchByScrolling",
	"ui.prefersReducedMotion",
	...Object.keys(PREFS_TO_PROPS),
];
let observedNotifications = [
	"ai-window-state-changed",
	"lightweight-theme-styling-update",
];
for (let p of observedBrowserPrefs)
	Services.prefs.addObserver(p, onPrefChange);
for (let p of observedNotifications)
	Services.obs.addObserver(onNofitied, p);
accentColorInTitlebarMQ.onchange = () => onPrefChange(null, null, "-moz-windows-accent-color-in-titlebar");
novaMQ.onchange = () => onPrefChange(null, null, "browser.nova.enabled");
micaMQ.onchange = () => onPrefChange(null, null, "widget.windows.mica");

addEventListener("unload", e => {
	if (e.target != document) return;
	Object.keys(prefs).forEach(n => Services.prefs.removeObserver(prefBranchStr + n, onPrefChange));
	for (let p of observedBrowserPrefs)
		Services.prefs.removeObserver(p, onPrefChange);
	for (let p of observedNotifications)
		Services.obs.removeObserver(onNofitied, p);
}, true);

function loadPrefs(defaultPrefs = createDefaultPrefs()) {
	setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defaultPrefs);
	prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defaultPrefs);
	prefs.tabsAtBottom ??= 0;

	for (let [p, [min, max]] of Object.entries({
		animationDuration: [0, prefs.debugMode ? Infinity : 1000],
		nativeWindowStyleToolbarColorOpacity: [0, 100],
		nativeWindowStyleURLBarColorOpacity: [0, 100],
	}))
		if (p in prefs)
			prefs[p] = Math.min(Math.max(prefs[p], min), max);

	const showMenubar = !!$(`#toolbar-menubar:not(${MENUBAR_AUTOHIDE})`);
	const allWindowsHaveTitleOrMenuBar =
		!getPref("browser.tabs.inTitlebar") ||
		!("TaskbarTabsChrome" in window) && showMenubar;
	const moveOverThreshold = getPref("browser.tabs.dragDrop.moveOverThresholdPercent", 0);
	const singleRow = prefs.maxTabRows < 2;
	const supportsHas = getPref("layout.css.has-selector.enabled", true);
	const noAutoCollapse = !supportsHas || singleRow;
	const noSmartWindow = !["available", "enabled"].includes(window.AIWindow?.aiControlState);

	lock("autoCollapse", noAutoCollapse);

	const {autoCollapse, tabsAtBottom} = prefs;
	const alwaysIndMove = prefs.animateTabMoveUnderLimit < 3;

	lock("themeImageSize", !bgImgTheme || singleRow || autoCollapse || tabsAtBottom < 0);
	lock("nativeWindowStyleToolbarColorOpacity", !prefs.nativeWindowStyle || !nova && tabsAtBottom);
	lock("nativeWindowStyleURLBarColorOpacity", !prefs.nativeWindowStyle);
	lock(["compactControlButtons", "controlButtonsAutoHide"], allWindowsHaveTitleOrMenuBar);
	lock("controlButtonsAutoHideTriggerHeight", !prefs.controlButtonsAutoHide);
	lock("linesToDragScroll", singleRow);
	lock("linesToScroll", singleRow || getPref("toolkit.tabbox.switchByScrolling"));
	lock(
		["autoCollapseDelayCollapsing", "autoCollapseDelayExpanding", "autoCollapseCurrentRowStaysTop"],
		!autoCollapse,
	);
	lock(
		["rowStartIncreaseFrom", "rowIncreaseEvery"],
		singleRow || autoCollapse,
		0,
	);
	lock("tabsUnderControlButtons", singleRow || autoCollapse, 0);
	lock("floatingBackdropClip", singleRow || prefs.tabsUnderControlButtons < 2);
	lock("floatingBackdropOpacity", singleRow || prefs.tabsUnderControlButtons < 2 || prefs.floatingBackdropClip, 75);
	lock("tabsbarItemsAlign", singleRow || prefs.tabsUnderControlButtons > 1 || autoCollapse);
	lock(
		"floatingBackdropBlurriness",
		(
			prefs.floatingBackdropOpacity >= 100 ||
			prefs.floatingBackdropClip ||
			singleRow ||
			prefs.tabsUnderControlButtons < 2 ||
			(mica || prefs.nativeWindowStyle) && noSmartWindow
		),
	);
	lock(["checkUpdateFrequency", "checkUpdateAutoApply"], !prefs.checkUpdate);
	lock(
		"dynamicMoveOverThreshold",
		(
			alwaysIndMove ||
			!getPref("browser.tabs.dragDrop.createGroup.enabled", TAB_GROUP_SUPPORT) ||
			moveOverThreshold <= 50
		),
		false,
	);
	lock(
		[
			"privateBrowsingIconOnNavBar",
			// "dlpButtonOnNavBar",
		],
		tabsAtBottom,
		true,
	);
	lock("smartWindowButtonOnNavBar", tabsAtBottom || noSmartWindow, !!tabsAtBottom);
	lock("hidePinnedDropIndicator", !getPref("browser.tabs.dragDrop.dragToPin.enabled", NATIVE_DRAG_TO_PIN) || alwaysIndMove, true);
	lock("pinnedTabsFlexWidthIndicator", !prefs.pinnedTabsFlexWidth);
	lock("dragStackPreceding", !getPref("browser.tabs.dragDrop.multiselectStacking", TAB_STACKING_SUPPORT) || alwaysIndMove);
	lock(
		["spaceAfterTabs", "spaceAfterTabsOnMaximizedWindow", "spaceBeforeTabs", "spaceBeforeTabsOnMaximizedWindow"],
		allWindowsHaveTitleOrMenuBar,
		0,
	);
	lock(
		"hideEmptyPlaceholderWhenScrolling",
		(
			prefs.tabsUnderControlButtons < 2 ||
			tabsAtBottom ||
			!prefs.spaceBeforeTabs && !prefs.spaceBeforeTabsOnMaximizedWindow
		),
	);
	lock("previewPanelNoteEditable", !getPref("browser.tabs.notes.enabled", TAB_NOTE_SUPPORT), false);
	lock("positionPinnedTabs", prefs.pinnedTabsFlexWidth || autoCollapse, false);
	lock("lastRowTabsFlexibe", prefs.justifyCenter > 1);
	lock("previewPanelShiftedAlways", !prefs.previewPanelShifted);
	lock("animateTabMoveShiftKeyToPause", alwaysIndMove);
	lock("animationDuration", getPref("ui.prefersReducedMotion") == 1);
	lock("hamburgerMenuOnTabBar", tabsAtBottom || noSmartWindow, false);

	if (gNavToolbox.hasAttribute("tabs-hidden"))
		prefs.tabsUnderControlButtons = 0;
	if (showMenubar && root.matches(":not([chromehidden~=menubar])"))
		prefs.controlButtonsAutoHide = 0;
	/*global PrivateBrowsingUtils*/
	prefs.hamburgerMenuOnTabBar &&= !PrivateBrowsingUtils.isWindowPrivate(window);

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

async function onNofitied(subject, name) {
	switch (name) {
		case "lightweight-theme-styling-update": {
			let data = subject.wrappedJSObject;
			if (!data || !root.hasAttribute("ai-window"))
				return;
			updateThemeStatus(data);
			break;
		} case "ai-window-state-changed":
			if (subject != window)
				return;
			updateAIWindowButtonsPosition();
			await 0;
			updateThemeStatus();
			break;
	}
	await onPrefChange(null, null, name);
}

/**
 * @param {Object} pref
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
		case "browser.nova.enabled":
		case "nativeWindowStyle":
			updateThemeStatus();
			break;
		case "browser.ai.control.smartWindow":
		case "browser.smartwindow.enabled":
			await 0;
			break;
	}

	if (name == "browser.nova.enabled") {
		mainStyle.innerHTML = "";
		TAB_BLOCK_MARGIN_CURRENT = parseFloat(getStyle(root, "--tab-block-margin", true));
		novaTabsBarResizeObserver[nova ? "observe" : "unobserve"](tabsBar);
		updateNovaURLBarPosition();
		tabContainer[ON_UI_DENSITY_CHANGED]();
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
			tabContainer.updateLayout();
			break;
		case "autoCollapse":
		case "pinnedTabsFlexWidth":
		case "positionPinnedTabs":
		case "tabsUnderControlButtons":
		case "layout.css.has-selector.enabled":
			setStyle();
			tabsBar.toggleAttribute(
				"tabs-hide-placeholder",
				tabContainer.overflowing && prefs.tabsUnderControlButtons < 2,
			);
			tabContainer.updateLayout();
			scrollbox.dispatchEvent(new Event("overflow"));
			break;
		case "thinScrollbar":
			setStyle();
			updateScrollbarWidth();
			tabContainer.updateLayout();
			break;
		case "rowStartIncreaseFrom":
		case "rowIncreaseEvery":
		case "gapAfterPinned":
			setStyle();
			tabContainer.updateLayout();
			break;
		case "spaceAfterTabs":
		case "spaceAfterTabsOnMaximizedWindow":
		case "spaceBeforeTabs":
		case "spaceBeforeTabsOnMaximizedWindow":
		case "privateBrowsingIconOnNavBar":
		case "tabsAtBottom":
		case "browser.ai.control.smartWindow":
		case "browser.smartwindow.enabled":
		case "smartWindowButtonOnNavBar":
		case "hamburgerMenuOnTabBar":
		case "controlButtonsAutoHide":
		// case "dlpButtonOnNavBar":
			setStyle();
			tabContainer.updateLayout();
			updateNavToolboxNetHeight();
			updateAIWindowButtonsPosition();
			updateNavBarOverflow();
			updatePopupPosition();
			updateNovaURLBarPosition();
			break;
		case "tabHorizontalMargin":
		case "tabHorizontalPadding":
			delete tabContainer._pinnedTabsLayoutCache;
		// eslint-disable-next-line no-fallthrough
		case "tabContentHeight":
		case "tabVerticalMargin":
		case "tabMaxWidth":
		case "browser.tabs.tabMinWidth":
			setTimeout(() => {
				setStyle();
				tabContainer[ON_UI_DENSITY_CHANGED]();
				tabContainer._updateCloseButtons();
				scrollbox._ensureSnap();
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
		case "newTabButtonAfterLastTab":
			tabContainer._updateNewTabVisibility();
			break;
		case "animateTabMoveUnderLimit":
		case "animateTabMoveShiftKeyToPause":
		case "autoCollapseCurrentRowStaysTop":
		case "checkUpdate":
		case "checkUpdateAutoApply":
		case "checkUpdateFrequency":
		case "dragStackPreceding":
		case "hidePinnedDropIndicator":
		case "previewPanelShifted":
		case "previewPanelShiftedAlways":
		case "browser.tabs.dragDrop.moveOverThresholdPercent":
		case "browser.tabs.groups.enabled":
			break;
		case "toolkit.tabbox.switchByScrolling":
			tabContainer.switchByScrolling = getPref("toolkit.tabbox.switchByScrolling");
			break;
		case "lastRowTabsFlexibe":
			setStyle();
			tabContainer._updateCloseButtons();
			break;
		case "browser.tabs.notes.enabled":
			tabContainer._updateCloseButtons();
			setStyle();
			break;
		default: {
			let prop = PREFS_TO_PROPS[name];
			if (prop)
				Object.getPrototypeOf(tabContainer.tabDragAndDrop)[prop.name] =
					getPref(name, prop.default);
			else
				setStyle();
		}
	}
}

setDebug();

if (
	prefs.checkUpdate && (Date.now() / 1000 - prefs.checkUpdate) / 60 / 60 / 24
		>= Math.max(prefs.checkUpdateFrequency, 1)
) {
	Services.prefs.setIntPref(prefBranchStr + "checkUpdate", Date.now() / 1000);
	(async () => {
		let auto = prefs.checkUpdateAutoApply;
		let skipMinorVer = auto < 3;

		let {script: localScript, version: local, uri: localFileURI} =
			await getScriptInfo({skipMinorVer});

		let updateURL = localScript.match(/^\/\/\s*@updateURL\s+(.+?)\s*$/mi)[1];
		let homeURL = "https://github.com/Merci-chao/userChrome.js";

		let remoteScript, remote, compatible;

		try {
			(
				{script: remoteScript, version: remote, compatible} =
					await getScriptInfo({uri: updateURL, skipMinorVer})
			);
		} catch (e) {
			window.console.error(e, updateURL);
			setTomorrow();
			return;
		}

		if (
			!compatible ||
			remote.localeCompare(local, undefined, {numeric: true}) <= 0
		)
			return;

		let texts = l10n({
			en: {
				message: `${SCRIPT_NAME} (${SCRIPT_FILE_NAME}) version ${remote} is released.`,
				update: "Update Now",
				updateKey: "N",
				download: "Update Manually",
				downloadKey: "M",
				changelog: "Changelog",
				changelogKey: "C",
				finished: "Done",
				finishedKey: "D",
				later: "Remind Tomorrow",
				laterKey: "R",
				link: "#changelog",
				done: `${SCRIPT_NAME} has been updated to version ${remote}. You may restart Firefox to apply.`,
				error: `Failed to apply the update of version ${remote}. Please ensure the file is not read-only or locked by another program:`,
			},
			ja: {
				message: `${SCRIPT_NAME}（${SCRIPT_FILE_NAME}）の新バージョン ${remote} がリリースされました。`,
				update: "今すぐ更新",
				download: "手動で更新",
				changelog: "変更履歴",
				finished: "完了",
				later: "明日再通知する",
				link: "/blob/main/README.jp.md#変更履歴",
				done: `${SCRIPT_NAME} ${remote} に更新しました。Firefox を再起動すると変更が適用になります。`,
				error: `バージョン ${remote} の更新処理に失敗しました。ファイルが読み取り専用でないこと、または他のプログラムによってロックされていないことを確認してください：`,
			},
		});

		if (auto > 1)
			install();
		else
			showNotification(
				texts.message,
				[
					{
						label: texts.update,
						accessKey: texts.updateKey,
						callback: install,
						primary: true,
					},
					{
						label: texts.download,
						accessKey: texts.downloadKey,
						callback: showChangelog,
					},
					{
						label: texts.later,
						accessKey: texts.laterKey,
						callback: setTomorrow,
					},
				],
				"chrome://browser/skin/update-badge.svg",
			);

		/**
		 * @param {string} label
		 * @param {Object[]} buttons
		 * @param {string} icon
		 */
		async function showNotification(label, buttons, icon, color) {
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
				node.src = icon;
				style(node, {
					fill: color,
					color,
					"--message-bar-icon-url": `url(${icon})`,
				});
			}
		}

		/*global FileUtils, NetUtil*/
		function install() {
			let file;
			try {
				file =
					NetUtil.newChannel({
						uri: Services.io.newURI(localFileURI),
						loadUsingSystemPrincipal: true,
					}).URI.QueryInterface(Ci.nsIFileURL).file;
				let converter = Cc["@mozilla.org/intl/converter-output-stream;1"]
					.createInstance(Ci.nsIConverterOutputStream);
				converter.init(
					FileUtils.openFileOutputStream(
						file,
						FileUtils.MODE_WRONLY | FileUtils.MODE_TRUNCATE,
					),
					"UTF-8",
				);
				converter.writeString(remoteScript);
				converter.close();
				if (auto < 3)
					//Delay a bit to make the installation feel like it's actually running
					setTimeout(() => showNotification(
						texts.done,
						[
							{
								label: texts.changelog,
								accessKey: texts.changelogKey,
								callback: showChangelog,
								primary: true,
							},
							{
								label: texts.finished,
								accessKey: texts.finishedKey,
								callback: emptyFunc,
							},
						],
						"chrome://browser/skin/migration/success.svg",
						"var(--panel-banner-item-update-supported-bgcolor)",
					), 500);
			} catch (e) {
				showError(texts.error, file?.path || localFileURI, e.message);
				return true;
			}
		}

		function showChangelog() {
			/*global openURL*/
			openURL(homeURL + texts.link);
		}

		function setTomorrow() {
			Services.prefs.setIntPref(
				prefBranchStr + "checkUpdate",
				Date.now() / 1000 - (Math.max(prefs.checkUpdateFrequency, 1) - 1) * 24 * 60 * 60,
			);
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
let maxItemWidth = 0;
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
//fx 115 doesn't support CSS nesting so use some variables to save code
let _, __, context, condition, x, y;
let floatingButtonStyle;
const {rowStartIncreaseFrom: rSIF, rowIncreaseEvery: rIE, maxTabRows: maxRows} = prefs;
const singleRow = maxRows < 2 ? "screen" : `(max-width: ${rSIF + rIE - EPSILON}px)`;
const multiRows = `(min-width: ${rSIF + rIE}px)`;
const twoOrLessRows = maxRows < 3 ? "screen" : `(max-width: ${rSIF + rIE * 2 - EPSILON}px)`;
const visible = `:not([hidden], [closing], [stacking])`;
const adjacentNewTab = "#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button";
const dropOnItems = ":is(#home-button, #downloads-button, #bookmarks-menu-button, #personal-bookmarks, #bookmarksMenu):not([moving-tabgroup] *)";
const dropOnItemsExt = "#TabsToolbar[tabs-dragging-ext] :is(#new-tab-button, #new-window-button)";
const shownMenubar = `#toolbar-menubar:not(:root[inFullscreen] *):is(:not([inactive]), :not(${MENUBAR_AUTOHIDE}))`;
const hiddenMenubar = `#toolbar-menubar:is(${MENUBAR_AUTOHIDE}[inactive], :root[inFullscreen] *)`;
const CUSTOM_TITLEBAR = appVersion > 134 ? "customtitlebar" : "tabsintitlebar";
const topMostTabsBar = prefs.tabsAtBottom
	? "#TabsToolbar:not([id])"
	: `:root[${CUSTOM_TITLEBAR}] ${hiddenMenubar} ~ #TabsToolbar`;
const hidePlaceHolder = "[customizing], [tabs-hide-placeholder]";
const showPlaceHolder = `:not(${hidePlaceHolder})`;
const tbDraggingHidePlaceHolder = ":is([tabs-dragging], [movingtab]):not([moving-positioned-tab])";
const staticPreTabsPlaceHolder = ":is([tabs-scrolledtostart], [pinned-tabs-wraps-placeholder])";
const preTabsButtons = `:is(
	:root:not([privatebrowsingmode], [firefoxviewhidden]) :is(toolbarbutton, toolbarpaletteitem),
	:root[privatebrowsingmode]:not([firefoxviewhidden]) :is(toolbarbutton:not(#firefox-view-button), toolbarpaletteitem:not(#wrapper-firefox-view-button))
)`;
const showAudioButton = "[muted], [soundplaying], [activemedia-blocked]";
const sidebarAtStart = getPref("sidebar.position_start");
const navToolboxWithSidebar = "#navigator-toolbox:has(~ #browser #sidebar-main:not([hidden], [collapsed]))";
const navToolboxWithAsk = "#navigator-toolbox:has(~ #browser #ai-window-box:not([hidden], [collapsed]))";
const autoCollapseExpandDir = prefs.tabsAtBottom < 0 ? "top" : "bottom";
const taskBarTab = root.hasAttribute("taskbartab");
const isYAlign = root.hasAttribute(THEME_IMAGE_IN_TOOLBOX);

/** @param {string} size */
const borderSnapping = size => CSS.supports("flex", "round(1)")
	//https://drafts.csswg.org/css-values-4/#snap-a-length-as-a-border-width
	? /*js*/`calc(
		max( /*at least 1 device px, or 0 if size <= 0*/
			round( /*round down to integer*/
				down,
				(${size}) * var(--device-pixel-ratio), /*covert to device px*/
				1px
			),
			min( /*will only be 1px (size > 0), or NaN (size <= 0) which forces the final result to be 0px*/
				max(${size}, 0px) / 0, /*will only be Infinity or NaN*/
				1px
			)
		)
		/ var(--device-pixel-ratio) /*covert back to css px*/
	)`.replace(/\/\*.+?\*\//g, "")
	//fallback to approximation
	: /*js*/`calc((${size}) / var(--device-pixel-ratio))`;

let dummyElement;
/**
 * @param {string} color
 * @param {string} [colorScheme]
 * @returns {{a: number, b: number, g: number, r: number}}
 */
const colorToRGBA = (color, colorScheme) => {
	if (color.includes("light-dark(")) {
		style(
			(dummyElement ||= root.appendChild(document.createElement("div"))),
			{color, colorScheme},
		);
		({color} = getComputedStyle(dummyElement));
	}
	return InspectorUtils.colorToRGBA(color);
};

/**
 * @param {CSSStyleDeclaration} cs
 * @param {string|Array<string>} property
 */
const getColor = (cs, property) => {
	for (let p of [property].flat()) {
		let v = cs.getPropertyValue(p);
		if (v)
			return colorToRGBA(v, cs.colorScheme);
	}
};

const outlineOffsetSnappingPref = [1, 2].includes(getPref("layout.css.outline-offset.snapping"));

/** @param {string} size */
const outlineOffsetSnapping = size =>
	outlineOffsetSnappingPref ? size : borderSnapping(size);

const rootCS = getComputedStyle(root);

let controlBoxInfo;
if (win7 || win8) {
	//there are two buttonbox, get the visible one
	let box = $( `toolbar:not(${MENUBAR_AUTOHIDE}) .titlebar-buttonbox`, gNavToolbox);
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
	controlBoxInfo = {
		normal: {
			height: height + (normal ? 0 : 2),
			width: width - (normal ? 0 : 4),
		},
		maximized: {
			height: height - (normal ? 2 : 0),
			width: width + (normal ? 4 : 0),
		},
	};
}

const novaBlockStyle = nova &&
	!!(
		prefs.tabsAtBottom > -1 ||
		getColor(rootCS, "--chrome-content-separator-color")?.a ||
		(
			!(prefs.nativeWindowStyle && !prefs.nativeWindowStyleToolbarColorOpacity) &&
			getColor(rootCS, "--toolbar-background-color")?.a
		)
	);

/*cannot use any nesting here since the properties are also applied on .tabs-placeholder::before*/
const themeBackgroundStyle = `
	background-image: var(--multirows-toolbox-background-image);
	${!nova && !((win7 || win8) && defaultTheme) ? `
		background-color: var(--multirows-toolbox-background-color);
	` : ``}
	background-size: var(--multirows-background-size);
	background-position: var(--multirows-background-position);
	background-repeat: var(--multirows-toolbox-background-repeat);
	background-attachment: fixed;
`;
const toolbarBackgroundStyle = nova
	? `
		--chrome-block-toolbar-color: transparent;
		--chrome-block-foreground-color: ${
			root.matches("[lwtheme]:not([theme-image-in-toolbox])")
				? root.hasAttribute("lwtheme-brighttext")
					? "rgba(255, 255, 255, .05)" : "rgba(0, 0, 0, .05)"
				: "transparent"
		};
		--chrome-block-background-image: var(--multirows-toolbox-background-image);
		--chrome-block-background-color: transparent;
		background-image:
			image(var(--chrome-block-toolbar-color)),
			image(var(--chrome-block-foreground-color)),
			var(--chrome-block-background-image),
			image(var(--chrome-block-background-color));
		background-color: var(--multirows-toolbox-background-color);
		background-repeat:
			repeat,
			repeat,
			var(--multirows-toolbox-background-repeat),
			repeat;
		background-position:
			0%,
			0%,
			var(--multirows-background-position),
			0%;
		background-size:
			auto,
			auto,
			var(--multirows-background-size),
			auto;
		background-attachment: fixed;
	` : themeBackgroundStyle;

mainStyle.innerHTML = /*css*/`
:root {
	--max-tab-rows: 1;
	--tab-animation: ${prefs.animationDuration}ms ${debug > 1 ? "ease" : "var(--animation-easing-function)"};
	--tab-icon-size: var(--icon-size, 16px);
	--tab-block-margin: ${Math.min(
		Math.max(prefs.tabVerticalMargin, 0),
		TAB_BLOCK_MARGIN_CURRENT * 3
	)}px;
	--tab-inline-padding: ${Math.min(
		Math.max(prefs.tabHorizontalPadding, 0),
		TAB_INLINE_PADDING * 3
	)}px;
	${!nova ? `
		--tab-border-radius: min(
			var(--toolbarbutton-border-radius),
			max(
				var(--tab-inline-padding),
				(var(--tab-min-height) - var(--tab-icon-size)) / 2
			)
		);
	` : ``}
	--tab-pinned-inline-padding: ${nova ? `calc((var(--tab-min-height) - var(--icon-size)) / 2 - var(--tab-inline-padding))` : "2px"};
	--tab-overflow-clip-margin: ${Math.min(Math.max(prefs.tabHorizontalMargin, 0), TAB_INLINE_MARGIN * 3)}px;
	--tabstrip-min-height: calc(var(--tab-min-height) + 2 * var(--tab-block-margin));
	--tab-group-label-height: min(max(1.5em, var(--tab-min-height) - 14px), var(--tab-min-height));
	--tab-group-line-thickness: clamp(1px, var(--tab-block-margin) - 1px, 2px);
	--tab-group-line-toolbar-border-distance: clamp(0px, var(--tab-block-margin) - var(--tab-group-line-thickness) - 1px, 1px);
	--tab-icon-end-margin: 6px;
	--tab-outline-max-width: 2px;
	--tabs-item-opacity-transition: ${
		getComputedStyle($("[part=overflow-end-indicator]", arrowScrollbox.shadowRoot))
			.transition.match(/\d.+|$/)[0] ||
		".15s"
	};

	--nav-toolbox-margin-border-block: 0px;
	--nav-toolbox-margin-border-inline: 0px;
	--original-toolbar-background-color: var(--toolbar-background-color, var(--toolbar-bgcolor));
	--original-toolbox-background-color: var(--toolbox-background-color, var(--toolbox-bgcolor));
	--multirows-background-position:
		var(--toolbox-background-position, var(--lwt-background-alignment));
	--multirows-background-size: var(--toolbox-background-size, auto);
	--multirows-toolbox-background-color:
		var(--toolbox-background-color,
			var(--toolbox-bgcolor,
				var(--toolbox-non-lwt-bgcolor,
					var(--lwt-accent-color)
				)
			)
		);
	--multirows-toolbox-background-image:
		var(--ai-gradient,
			var(--toolbox-background-image,
				var(--lwt-additional-images)
			)
		);
	--multirows-toolbox-background-repeat:
		var(--toolbox-background-repeat, var(--lwt-background-tiling));
	--multirows-toolbox-background-height:
		${
			prefs.tabsAtBottom > -1 && prefs.themeImageSize > -1
				? `max(
					var(--nav-toolbox-net-padding-box-height)
						${!isYAlign ? "+ var(--nav-toolbox-margin-border-block) * 2" : ""}
						+ var(--tabstrip-min-height)
							* ${
								[maxRows, "var(--max-tab-rows)"][prefs.themeImageSize] ||
								"var(--tab-rows)"
							},
					var(--nav-toolbox-margin-box-height, 0px)
						${isYAlign ? "- var(--nav-toolbox-margin-border-block) * 2" : ""}
				)`
				: "0px"
		};

	/*color from measuring the background color of window when enabling mica*/
	--mica-background-color: #E8E8E8;
	@media (prefers-color-scheme: dark) {
		--mica-background-color: #202020;
	}
	@media -moz-pref("widget.windows.mica.toplevel-backdrop", 2) {
		--mica-background-color: ${prefs.nativeWindowStyle ? "#D3D3D3" : "#EDEDED"};
		@media (prefers-color-scheme: dark) {
			--mica-background-color: ${prefs.nativeWindowStyle ? "#545454" : "#222222"};
		}
	}
}

:root:-moz-window-inactive {
	--multirows-toolbox-background-color:
		var(--toolbox-background-color-inactive,
			var(--toolbox-bgcolor-inactive,
				var(--toolbox-non-lwt-bgcolor-inactive,
					var(--lwt-accent-color-inactive,
						var(--lwt-accent-color)
					)
				)
			)
		);
}

:root[lwtheme-image] {
	--multirows-toolbox-background-image:
		var(--ai-gradient,
			var(--toolbox-background-image,
				var(--lwt-header-image),
				var(--lwt-additional-images)
			)
		);
	--multirows-background-position:
		var(--toolbox-background-position,
			right top, var(--lwt-background-alignment)
		);
}

${nova && defaultTheme ? /*css*/`
	:root {
		--multirows-background-size:
			calc(100vw - ${__="var(--nav-toolbox-margin-border-inline)"} * 2)
			calc(var(--nav-toolbox-margin-box-height) - ${__} * 2);
		--multirows-background-position:
			${__}
			${__};

		${prefs.tabsAtBottom > -1 ? /*css*/`
			${!mica ? "#TabsToolbar," : ""}
			.titlebar-buttonbox-container,
			.tabs-placeholder::before {
				--chrome-block-background-color: var(--toolbar-background-color);
			}
		` : ``}
	}
` : ``}

${prefs.autoCollapse ? /*css*/`
	:root {
		--multirows-background-size: var(--toolbox-background-size, auto) !important;
	}
` : ``}

/*ui.prefersReducedMotion = 1*/
@media (prefers-reduced-motion: reduce) {
	:root {
		--tab-animation: 0s;
		--tabs-item-opacity-transition: 0s;
	}
}

${[...Array(maxRows).keys()].slice(1).map(i => /*css*/`
	@media (min-width: ${rSIF + rIE * i}px) {
		:root { --max-tab-rows: ${i + 1}; }
	}
`).join("\n")}

${!win7 && !win8 ? /*css*/`
	/*make the title bar able to be narrower on 115*/
	:root[tabsintitlebar][sizemode] #titlebar {
		appearance: none;
	}

	#TabsToolbar > .titlebar-buttonbox-container {
		margin-bottom: 0;
	}
` : ``}

${_="#navigator-toolbox"} {
	--tabs-moving-max-z-index: 0;
	--space-before-tabs: ${prefs.spaceBeforeTabs}px;
	--space-after-tabs: ${prefs.spaceAfterTabs}px;
	${nova ? `
		--chrome-block-inner-radius: calc(var(--chrome-block-radius) - ${borderSnapping("1px")});
	` : ``}
}

:root[sizemode=maximized] ${_} {
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
		prefs.floatingBackdropClip && prefs.tabsUnderControlButtons > 1
			? 0
			: nova
				? "var(--chrome-block-radius)"
				: "var(--tab-border-radius)"
	};
	--tabs-placeholder-blurriness: ${prefs.floatingBackdropBlurriness}px;
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
			: `
				--multirows-toolbox-background-color,
					var(--tab-background-color-selected,
						var(--tab-selected-bgcolor,
							var(--lwt-selected-tab-background-color)
						)
					)
			`
	});

	/*ensure the newtab button has a consistent size*/
	--newtab-button-outer-padding: 2px;
	--newtab-button-inner-padding: calc((var(--tab-min-height) - var(--tab-icon-size)) / 2);
	--tabs-placeholder-backdrop: blur(var(--tabs-placeholder-blurriness));

	${nova && defaultTheme ? /*css*/`
		:root:not([customtitlebar], [ai-window]) & {
			${prefs.nativeWindowStyle ? /*css*/`
				& {
					--tabs-placeholder-background-color: var(--mica-background-color);
				}
			` : /*css*/`
				&:-moz-window-inactive {
					--tabs-placeholder-background-color: -moz-dialog;
				}
			`}
		}
	` : ``}
}

@media (forced-colors) {
	${_} {
		--tabs-placeholder-blurriness: 0px;
		--tabs-placeholder-border-color: ThreeDShadow;
	}
}

${
	!(
		!prefs.floatingBackdropClip &&
		prefs.floatingBackdropBlurriness &&
		prefs.floatingBackdropOpacity < 100 &&
		!(micaTheme && getPref("browser.tabs.inTitlebar")) &&
		!prefs.nativeWindowStyle
	)
	? /*css*/`
		:root:not([ai-window]) ${_} {
			--tabs-placeholder-backdrop: none;
		}
	` : ``
}

${nova && !prefs.tabsAtBottom ? /*css*/`
	#navigator-toolbox:has(> ${hiddenMenubar} ~ #TabsToolbar[tabs-dragging]) {
		overflow: visible !important;

		#TabsToolbar {
			border-start-start-radius: ${__="var(--chrome-block-inner-radius)"};
			border-start-end-radius: ${__};

			#tabs-placeholder-pre-tabs {
				border-start-start-radius: ${__};
			}

			${OVERLAY_SCROLLBARS ? /*css*/`
				#tabs-placeholder-post-tabs {
					border-start-end-radius: ${__};
				}
			` : ``}
		}

		#nav-bar:not(
			:root:not([inFullscreen]) :has(~ #PersonalToolbar:not([collapsed])),
			:has(~ #notifications-toolbar notification-message)
		),
		#PersonalToolbar:not(:has(~ #notifications-toolbar notification-message)),
		#notifications-toolbar {
			border-end-start-radius: ${__};
			border-end-end-radius: ${__};
		}
	}
` : ``}

${context=`#navigator-toolbox:is([movingtab], [tabs-dragging]) toolbar:not(${_})`} {
	z-index: calc(var(--tabs-moving-max-z-index) + 3);
	pointer-events: none;
}

${context} ${dropOnItems} {
	pointer-events: auto;
}

${prefs.privateBrowsingIconOnNavBar ? /*css*/`
	${_} .private-browsing-indicator-with-label,
	#nav-bar .private-browsing-indicator-label {
		display: none;
	}

	:root[privatebrowsingmode=temporary] #nav-bar#nav-bar .private-browsing-indicator-with-label {
		display: flex;
		margin-inline-end: ${appVersion > 151 ? "var(--space-medium)" : "12px"};
	}
` : ``}

${prefs.tabsAtBottom/*dlpButtonOnNavBar*/ ? /*css*/`
	:root[contentanalysisactive] {
		#nav-bar#nav-bar .content-analysis-indicator {
			display: flex;
		}

		${_} .content-analysis-indicator {
			display: none;
		}
	}
` : ``}

${prefs.controlButtonsAutoHide ? /*css*/`
	${context = prefs.controlButtonsAutoHide < 2 ? ":root:not([sizemode=normal])" : ""}
		${__ = ".titlebar-buttonbox-container"}
	{
		--transition:
			filter var(--tabs-item-opacity-transition),
			background-color var(--inactive-window-transition);
		position: absolute;
		top: 0;
		inset-inline-end: 0;
		box-shadow: var(--tab-selected-shadow, 0 0 4px rgba(0,0,0,.4));
		border: var(--tabstrip-inner-border, 1px solid color-mix(in srgb, currentColor 25%, transparent));
		border-inline-end: 0;
		border-top: 0;
		transition: var(--transition);
		z-index: calc(1/0) !important;
		/*10px is large enough for the shadow*/
		clip-path: inset(
			-10px
			-10px
			calc(100% - var(--height, 100% - 10px))
			-10px
		);
		${toolbarBackgroundStyle}

		${micaTheme ? /*css*/`
			:root[customtitlebar] & {
				background-color: var(--mica-background-color);
			}
		` : ``}
	}

	${context} #navigator-toolbox {
		position: relative;
	}

	${context} ${__}:is(:not(:hover), #navigator-toolbox[tabs-dragging] *) {
		--height: calc(${Math.max(prefs.controlButtonsAutoHideTriggerHeight, 1)}px + var(--window-border, 0px));
		/*
			Using opacity may block window dragging on the placeholder underneath,
			whereas filter does not seem to have this problem.
		*/
		filter: opacity(0);
		transition:
			var(--transition),
			clip-path 0s var(--tabs-item-opacity-transition);
		${debug == 2 ? `
			filter: opacity(.75);
			background: red;
		` : ""};
	}

	${context} .titlebar-button {
		position: relative;
 		bottom: 0;
	}

	/*prevent the snap layouts menu from showing, the buttons need to be inside the view*/
	${context} ${__}:not(:hover) .titlebar-button {
		bottom: calc(100% - 1px);
		transition: bottom 0s var(--tabs-item-opacity-transition);
	}

	:root[sizemode=normal] #navigator-toolbox .titlebar-buttonbox-container {
		--window-border: max(8px - var(--chrome-window-gap, 0px), 0px);
	}

	${prefs.compactControlButtons ? /*css*/`
		${context} #toolbar-menubar:not([inactive]) {
			min-height: 29px !important;
		}
	` : /*css*/`
		${context} #toolbar-menubar .titlebar-buttonbox-container {
			min-height: ${prefs.tabsAtBottom
				? `calc(var(--urlbar-min-height) + 2 * var(--urlbar-padding-block))`
				: `var(--tabstrip-min-height)`};
		}

		${context} #nav-bar .titlebar-buttonbox-container {
			min-height: calc(var(--urlbar-min-height) + 2 * var(--urlbar-padding-block));
		}
	`}
` : ``}

${win7 || win8 ? /*css*/`
	/*refer to browser-aero.css and browser-aero.css*/
	@media (-moz-windows-classic: 0) {
		${_=":root[sizemode=normal] " + hiddenMenubar + " ~ #TabsToolbar"} {
			--tabs-margin-top: 1px;
		}
	}
	${win7 ? /*css*/`
		${_} {
			--tabs-padding-top: 4px;
		}
	` : ``}

	${!defaultTheme ? /*css*/`
		${_} {
			--nav-toolbox-padding-top: 1px;
		}
	` : ``}
` : ``}

${_=".titlebar-spacer[type=pre-tabs]"} {
	width: var(--space-before-tabs);
}

${prefs.spaceBeforeTabsOnMaximizedWindow ? /*css*/`
	:root[sizemode=maximized][${CUSTOM_TITLEBAR}] ${_} {
		display: flex;
	}
` : ""}

.titlebar-spacer[type=post-tabs] {
	width: var(--space-after-tabs);
}

${prefs.compactControlButtons || win7 || win8 ? /*css*/`
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
	height: ${__="calc(var(--tabstrip-min-height) + var(--tabs-top-space))"};
	max-height: ${__};
}

#TabsToolbar > :is(${_}) {
	margin-top: var(--tabs-top-space);
}

#TabsToolbar > .titlebar-buttonbox-container,
#TabsToolbar .toolbarbutton-1 {
	height: calc(var(--tabstrip-min-height) - var(--tabs-navbar-shadow-size, 0px)); /*fx 115*/
}

${!nova ? /*css*/`
	#TabsToolbar .toolbarbutton-1 > :is(.toolbarbutton-icon, .toolbarbutton-text, .toolbarbutton-badge-stack) {
		border-radius: min(var(--toolbarbutton-padding-inner, var(--toolbarbutton-inner-padding)), var(--tab-border-radius));
	}
` : ``}

#TabsToolbar #TabsToolbar-customization-target > :not(#tabbrowser-tabs, .toolbarbutton-1) {
	height: var(--tabstrip-min-height);
	max-height: var(--tabstrip-min-height);
}

${prefs.tabsUnderControlButtons
	? adjacentNewTab
	: "#tabbrowser-tabs[hasadjacentnewtabbutton] + #new-tab-button"
} {
	--toolbarbutton-padding-outer: var(--newtab-button-outer-padding);
	--toolbarbutton-outer-padding: var(--newtab-button-outer-padding);
	--toolbarbutton-padding-inner: var(--newtab-button-inner-padding);
	--toolbarbutton-inner-padding: var(--newtab-button-inner-padding);
	align-self: end;
}

${_="#tabbrowser-tabs[orient]"} {
	--gap-after-pinned: ${prefs.gapAfterPinned}px;
	--group-line-padding: ${TAB_GROUP_SUPPORT ? "3px" : "0px"};
	--group-label-max-width: ${TAB_GROUP_SUPPORT ? "10em" : "0px"};
	--group-last-tab-line-indent: ${nova
		? "calc(var(--tab-overflow-clip-margin) * -1)"
		: appVersion > 144 ? "calc(var(--tab-border-radius) / 2)" : "0px"};
	--calculated-tab-min-width: 0px;
	--tab-max-width: max(${prefs.tabMaxWidth}px, var(--calculated-tab-min-width));
	--tab-split-view-min-width: calc((var(--calculated-tab-min-width) + var(--tab-overflow-clip-margin)) * 2 + 1px);
	--tab-split-view-max-width: max(var(--tab-split-view-min-width), var(--tab-max-width));
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
	--extra-scroll-button-size: 15px; /*hardcoded in tabs.css*/
	--extra-drag-space: 0px;
	--scroll-content-start: 0px;
	position: relative;
	padding-inline-start: var(--tabstrip-padding) !important;
}

${_}[positionpinnedtabs] {
	--scroll-content-start: calc(var(--tab-overflow-pinned-tabs-width) + var(--gap-after-pinned));
}

/*override the default rule for consistent handling*/
${_}[movingtab] {
	--extra-drag-space: var(--extra-scroll-button-size);
	padding-block: var(--extra-scroll-button-size);
	margin-block: calc(var(--extra-scroll-button-size) * -1);
}

${preTabsButtons} ~ ${_} {
	--tabstrip-padding: 2px;
	${appVersion > 150 ? /*css*/`
		/* add back the traditional border which moved to ::before https://bugzil.la/2023473 */
		border-inline-start: var(--tabstrip-inner-border);
		margin-inline-start: var(--tabstrip-padding);
	` : ``}
}

${!prefs.autoCollapse ? /*css*/`
	@media ${prefs.tabsUnderControlButtons < 2 ? "screen" : singleRow} {
		${preTabsButtons} ~ ${_}[movingtab] {
			/* https://bugzil.la/2023473 */
			mask: linear-gradient(
				transparent var(--extra-drag-space),
				red 0%,
				red calc(100% - var(--extra-drag-space)),
				transparent 0%
			);
		}
	}
` : ``}

/* override https://bugzil.la/2023473 */
${_}::before {
	border: 0 !important;
	margin: 0 !important;
	padding: 0 !important;
}

${prefs.showScrollShadow ? /*css*/`
	${_}::before,
	${_}::after {
		--height: calc(var(--tabstrip-min-height) * .15);
		--shift: calc(var(--extra-drag-space) - var(--height) * 4);
		--dir: 1;
		content: "";
		pointer-events: none;
		position: absolute;
		top: var(--shift);
		inset-inline: var(--scroll-content-start) 0;
		height: calc(var(--height) * 4);
		border-radius: min(20%, var(--tabstrip-min-height)) / 50%;
		clip-path: inset(
			calc(100% * var(--dir))
			var(--clip-right, 0)
			calc(-100% * var(--dir))
			var(--clip-left, 0)
		);
		z-index: -1;
		transition: opacity var(--tabs-item-opacity-transition);
		box-shadow:
			0
			calc(var(--height) * var(--dir))
			var(--height)
			var(--color, light-dark(rgba(0, 0, 0, .05), rgba(255, 255, 255, .05)));
	}

	${_}::after {
		--dir: -1;
		top: auto;
		bottom: var(--shift);
	}

	${!CSS.supports("color: light-dark(red, red)") ? /*css*/`
		${_}::before,
		${_}::after {
			--color: rgba(0, 0, 0, .05);
			z-index: 0;
		}

		:root[lwtheme-brighttext] ${_}::before,
		:root[lwtheme-brighttext] ${_}::after {
			--color: rgba(255, 255, 255, .05);
		}

		#tabbrowser-arrowscrollbox {
			z-index: 1;
		}
	` : ``}

	#TabsToolbar[tabs-scrolledtostart] ${_}::before,
	#TabsToolbar[tabs-scrolledtoend] ${_}::after {
		opacity: 0;
	}
` : ``}

${prefs.autoCollapse && !taskBarTab ? /*css*/`
	${prefs.tabsAtBottom > -1 ? /*css*/`
		#navigator-toolbox {
			overflow: visible !important;
		}
	` : ``}

	#navigator-toolbox,
	#titlebar,
	${prefs.tabsAtBottom > -1 ? "#TabsToolbar," : ""}
	#TabsToolbar > .toolbar-items,
	#TabsToolbar-customization-target {
		z-index: calc(1/0) !important;
		position: relative !important;
	}

	${_} {
		/*ensure the transitionstart/end will be fired*/
		--transition-delay-after: ${Math.max(prefs.autoCollapseDelayCollapsing, 1)}ms;
		--transition-delay-before: ${Math.max(prefs.autoCollapseDelayExpanding, 1)}ms;
		will-change: margin-${autoCollapseExpandDir}, height;
		outline: 1px solid transparent !important;
	}

	${_}[movingtab] {
		--extra-scroll-button-size: 0px;
	}

	${context=`:root:not([style*="--tab-scroll-rows: 1;"])`} ${_}:not(${TEMP_SHOW_CONDITIONS}) {
		height: var(--tabstrip-min-height);
	}

	${context} ${_} :is(tab, tab-split-view-wrapper, tab-group > *) {
		margin-inline-end: 0 !important;
	}

	${context} #TabsToolbar {
		max-height: calc(var(--tabstrip-min-height) + var(--tabs-padding-top) + var(--tabs-margin-top));
		align-items: start;
	}

	${context} #TabsToolbar:has(> .toolbar-items > .customization-target > ${_}${TEMP_SHOW_CONDITIONS}) {
		opacity: 1 !important;
	}

	${context}:not([multitabrows-applying-style]) ${_} {
		--auto-collapse-delay: var(--transition-delay-after);
		transition: var(--tab-animation) var(--auto-collapse-delay);
		transition-property:
			background-color, height, margin-${autoCollapseExpandDir}, outline,
			border-color, box-shadow, border-radius, color, text-shadow;
		overflow: clip;
	}

	${context} ${_}${TEMP_SHOW_CONDITIONS} {
		--auto-collapse-delay: var(--transition-delay-before);
		margin-${autoCollapseExpandDir}: calc((var(--tab-scroll-rows) - 1) * var(--tabstrip-min-height) * -1);
		height: calc(var(--tab-scroll-rows) * var(--tabstrip-min-height));
		outline: 1px solid var(--panel-border-color, var(--arrowpanel-border-color)) !important;
		border-color: transparent;
		background-color: var(--toolbar-field-background-color-focus, var(--toolbar-field-focus-background-color));
		box-shadow: 0 2px 14px rgba(0, 0, 0, 0.13);
		border-radius: var(--toolbarbutton-border-radius);
		color: var(--toolbar-field-text-color-focus, var(--toolbar-field-focus-color));
		text-shadow: none;
		-moz-window-dragging: no-drag;
	}

	${context} .tab-background {
		--lwt-header-image: none;
	}

	${context} ${_}
		${__ = `:is(
			.tab-content:is([selected], [multiselected]),
			.tab-group-overflow-count
		)`}
	{
		transition: color var(--tab-animation) var(--auto-collapse-delay);
	}

	${context} ${_}${TEMP_SHOW_CONDITIONS} ${__} {
		color: inherit;
	}

	${context} ${_}${TEMP_SHOW_CONDITIONS} tab[dragover-groupTarget] .tab-content {
		color: var(--toolbox-text-color, var(--toolbox-textcolor));
	}

	${context} ${_}[temp-open] #tabbrowser-arrowscrollbox::part(scrollbox) {
		padding-bottom: var(--temp-open-padding, 0px);
	}

	${context} ${_}[temp-open]:not(:is([tabmousedown], [dragging])[overflow])
		#tabbrowser-arrowscrollbox::part(scrollbox)
	{
		overflow-y: scroll;
	}

	${context} ${_}:is(${TEMP_SHOW_CONDITIONS}, [temp-open]) #tabs-newtab-button {
		display: none;
	}

	${context} ${_}[hasadjacentnewtabbutton] ~ #new-tab-button {
		display: flex;
		align-self: start;
	}

	${nova && prefs.tabsAtBottom > -1 ? /*css*/`
		#toolbar-menubar,
		${hiddenMenubar} ~ ${prefs.tabsAtBottom ? "#nav-bar" : "#TabsToolbar"} {
			border-start-start-radius: ${__ = "var(--chrome-block-inner-radius)"};
			border-start-end-radius: ${__};
		}

		${prefs.tabsAtBottom ? "#TabsToolbar" : "#nav-bar"}:not(
			${prefs.tabsAtBottom < 2 ? `
				:root:not([inFullscreen]) :has(~ #PersonalToolbar:not([collapsed])),
			` : ``}
			:has(~ #notifications-toolbar notification-message)
		),
		${prefs.tabsAtBottom < 2 ? `
			#PersonalToolbar:not(:has(~ #notifications-toolbar notification-message)),
		` : ``}
		#notifications-toolbar {
			border-end-start-radius: ${__};
			border-end-end-radius: ${__};
		}
	` : ``}
` : ``}

${_="#tabbrowser-arrowscrollbox[orient][id]"} {
	position: relative;
	/*it will fall into endless loop of layout reflow when too narrow to overflow*/
	min-width: var(--max-item-width);
	${
	//use the default style for accent color in titlebar
	!(
		!micaEnabled &&
		defaultAutoTheme &&
		prefs.scrollbarTrackColor == "auto" &&
		prefs.scrollbarThumbColor == "auto" &&
		accentColorInTitlebarMQ.matches
	) ? `
		scrollbar-color:
			${
				prefs.scrollbarThumbColor == "auto"
					? (
						["", "currentColor"].includes(getStyle(document.body, "--toolbarbutton-icon-fill", true))
							? "var(--toolbar-text-color, var(--toolbar-color))"
							: "var(--toolbarbutton-icon-fill)"
					)
					: prefs.scrollbarThumbColor
			}
			${
				prefs.scrollbarTrackColor == "auto"
					? (
						win7 && defaultDarkTheme
							? "var(--tab-icon-overlay-fill)"
							: !OVERLAY_SCROLLBARS && (nova || prefs.tabsAtBottom)
								? "transparent" : "var(--toolbar-background-color, var(--toolbar-bgcolor))"
					)
					: prefs.scrollbarTrackColor
			}
	` : ``};
}

#tabbrowser-tabs[hasadjacentnewtabbutton] ${_} {
	min-width: calc(var(--max-item-width) + var(--new-tab-button-width));
}

:root[animating-tabs-slot-size] ${_} {
	overflow: hidden;
}

/*ensure the new tab button won't be wrapped to the new row in any case*/
${
	__ = CSS.supports("selector(:has(*))") ?
		/*css*/`
			${_}:has(>
				:is(tab, tab-split-view-wrapper):nth-child(
					1 of :not([hidden], [stacking])
				):nth-last-child(
					1 of :not([hidden], [stacking], #tabbrowser-arrowscrollbox-periphery)
				)
			)::part(items-wrapper) {
				flex-wrap: nowrap;
			}
		` : /*css*/`
			/*do not limit the box width when [positionpinnedtabs] as it needs to let the box
			  be narrow enough to trigger the deactivation of positioning*/
			#tabbrowser-tabs[hasadjacentnewtabbutton]:not([positionpinnedtabs]) ${_} {
				/*list out all possible things in case they are shown and their size is non zero*/
				min-width: calc(var(--tabstrip-separator-size) + var(--max-item-width) + var(--new-tab-button-width) + var(--tabs-scrollbar-width)) !important;
			}
		`,
	prefs.tabsUnderControlButtons ? `
		@media ${singleRow} {
			${__}
		}
	` : __
}

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
#tabbrowser-tabs:not([positionpinnedtabs]) ${_}[overflowing] {
	min-width: calc(var(--max-item-width) + var(--tabs-scrollbar-width)) !important;
}

.tab-drop-indicator {
	transition: transform var(--tab-animation);
	z-index: calc(1/0);
}

.tab-drop-indicator[to-pin]::after {
	content: "";
	position: absolute;
	top: 50%;
	width: var(--tab-icon-size);
	height: var(--tab-icon-size);
	fill: #0a84ff;
	-moz-context-properties: fill;
	filter:
		${__="drop-shadow(0 0 .4px white)"}
		${__} ${__} ${__} ${__}
		${__} ${__} ${__}
		drop-shadow(0 1px .5px rgba(0,0,0,.496));
	inset-inline-start: calc(
		50%
		- var(--tab-overflow-clip-margin)
		- var(--tab-inline-padding)
		- var(--tab-pinned-inline-padding)
	);
	translate: -100% -50%;
	background:
		url(chrome://${appVersion < 137 ? "activity-stream" : "newtab"}/content/data/content/assets/glyph-pin-16.svg)
		center / contain;
}

.tab-drop-indicator[to-pin=false]::after {
	inset-inline-start: calc(
		50%
		+ var(--tab-overflow-clip-margin)
		+ var(--tab-inline-padding)
	);
	translate: 0 -50%;
	background-image: url(chrome://${appVersion < 137 ? "activity-stream" : "newtab"}/content/data/content/assets/glyph-unpin-16.svg);
}

/*use the start and end indicators for the hint of left and right edges when moving tabs*/
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
	border: 0;
	border-left: .5px solid rgba(255,255,255,.2);
	margin-inline: 0;
	position: absolute;
	inset: 0;
	z-index: calc(var(--tabs-moving-max-z-index) + 4);
}

${_}::part(overflow-end-indicator) {
	inset-inline-start: auto;
}

${_}[overflowing]::part(overflow-end-indicator) {
	inset-inline-end: var(--tabs-scrollbar-width);
}

@media ${win7 || win8 || prefs.tabsUnderControlButtons < 2 || !OVERLAY_SCROLLBARS && !nova
	? "screen" : singleRow
} {
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
}

/*display the up and down buttons at the top and bottom edges for scrolling while dragging*/
${_}::part(scrollbutton-up),
${_}::part(scrollbutton-down) {
	--border: 1px;
	--height: min(${prefs.scrollButtonsSize}px, var(--tabstrip-min-height) / 2);
	position: absolute;
	inset-inline: var(--scroll-content-start) 0;
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
	transition: opacity var(--tabs-item-opacity-transition);
}

@media (forced-colors) {
	${_}::part(scrollbutton-up),
	${_}::part(scrollbutton-down) {
		border-color: var(--toolbarbutton-outline-color, ButtonText) !important;
		background-color: var(--tabs-placeholder-background-color) !important;
	}
}

${_}[highlight]::part(scrollbutton-down) {
	--color: var(--tab-attention-dot-color, var(--attention-dot-color, var(--tab-attention-icon-color)));
	opacity: 1 !important;
	background: var(--color) !important;
}

${_}[highlight]::part(scrollbutton-down-icon) {
	fill: var(--color);
	filter: invert(1) grayscale(1);
	background: none;
}

${_}::part(scrollbutton-up-icon),
${_}::part(scrollbutton-down-icon) {
	rotate: ${RTL_UI ? 270 : 90 /*negative deg causes bug on 115*/}deg;
	margin: -4px 0;
	padding: 0;
	object-fit: scale-down;
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
		--height: min(${prefs.scrollButtonsSize}px * 4 / 5, var(--tabstrip-min-height) / 3);
	}
}

${_}::part(scrollbutton-up)::before {
	top: ${__="calc(var(--extra-scroll-button-size) * -1)"};
}

${_}::part(scrollbutton-down)::before {
	bottom: ${__};
}

${_}::part(scrollbutton-down) {
	bottom: 0;
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
	max-height: calc(var(--tabstrip-min-height) * var(--max-tab-rows));
	scroll-snap-type: both mandatory;
	${prefs.thinScrollbar
		? `scrollbar-width: thin;`
		: ``}
}

#tabbrowser-tabs[positionpinnedtabs] ${_}::part(scrollbox) {
	/*padding cause inconsistent width result*/
	padding-inline: 0 !important;
}

/*avoid the native drag scroll behavior*/
#tabbrowser-tabs${condition="[overflow]:is([dragging], [tabmousedown])"} ${_}::part(scrollbox) {
	overflow-y: hidden;
}

#tabbrowser-tabs:not(${condition}) ${_}::part(fake-scrollbar) {
	visibility: collapse;
}

${_}::part(fake-scrollbar) {
	height: calc(var(--tabstrip-min-height) * var(--tab-rows));
	width: calc(var(--tabs-scrollbar-width) + 1px);
	margin-inline-start: -1px;
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
}

${_}::part(fake-scrollbar)::before {
	content: "";
	height: calc(var(--slot-height) + var(--temp-open-padding, 0px));
	width: 1px;
}

${_}::part(items-wrapper) {
	box-sizing: border-box;
	flex-wrap: wrap;
	min-height: var(--slot-height, var(--tabstrip-min-height));
	min-width: var(--slot-width, 1px); /*ensure it is visible and able to make the scrollbox overflow*/
	align-content: start;
	transition: padding-bottom var(--tab-animation);
	/*fx115*/
	display: flex;
	flex: 1 0 0;
}

[positionpinnedtabs] ${_}::part(items-wrapper) {
	padding-inline-start: calc(var(--tab-overflow-pinned-tabs-width) + var(--gap-after-pinned));
}

${prefs.justifyCenter ? /*css*/`
	${prefs.justifyCenter == 1
		? "#tabbrowser-tabs:not([multirows], [overflow])"
		: ""}
			${_}::part(items-wrapper)
	{
		justify-content: safe center;
	}

	#tabbrowser-tabs:not([multirows], [overflow])[using-closing-tabs-spacer=closing-last-tab]
		${_}::part(items-wrapper)
	{
		justify-content: end;
	}
` : ``}

/*avoid any weird stuff going out of bounds and causing the scrollbox to overflow*/
${_}:not([scrollsnap])::part(items-wrapper),
/*when dragging tab outside the boundary, keep the slot not expand*/
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

${"#tabbrowser-arrowscrollbox".repeat(3)} tab-group {
	--line-overlap-length: 0px;
	--line-indent: 0px;
	--line-border-radius: 0px;

	&[toggling] {
		& > :is(
			/*
			  prevent the preview menu from opening when collapsing the group.
			  when a tab on the next row is animating to the collapsing point,
			  a mouseover will be triggered and it tries to open the preview panel,
			  but for the hovered group label instead.
			*/
			.tab-group-label-container,
			/* in case the group line of overflow count covers the active tab */
			${__ =`
				tab[selected],
				tab-split-view-wrapper[hasactivetab]
			`}
		) {
			z-index: 1;
		}

		& > :is(${__}) {
			pointer-events: none;
		}
	}

	${!TAB_GROUP_PREVIEW_SUPPORT ? /*css*/`
		&[movingtabgroup] > tab:not([animate-shifting]) {
			visibility: hidden;
		}
	` : ``}

	&[collapsed] {
		&:not([stacked]) {
			&[movingtabgroup][hasactivetab] > tab[selected] {
				max-width: var(--tab-max-width) !important;
				min-width: var(--calculated-tab-min-width) !important;

				&[size-locked] {
					max-width: var(--locked-size) !important;
					min-width: var(--locked-size) !important;
				}
			}

			/* counter the change for https://bugzil.la/1986587 */
			& > tab:not([selected], [stacking]) {
				min-width: 0 !important;
				max-width: 0 !important;
			}
		}

		& >
			[movetarget]:is(
				tab:not([selected]),
				tab-split-view-wrapper:not([hasactivetab])
			):not([stacking])
		{
			&:not([animate-shifting]) {
				visibility: hidden;
			}

			tab-split-view-wrapper& tab {
				overflow: clip;
			}
		}

		#tabbrowser-tabs[dragging]:not([movingtab]) & >
			tab:not([selected])
		{
			/*prevent exception of getting elementIndex*/
			pointer-events: none;

			&:not([animate-shifting]) {
				visibility: hidden;
			}
		}
	}

	.tab-group-label-container::after,
	${__ =`:is(
		tab-split-view-wrapper,
		.tab-stack
	)::before`} {
		border-start-end-radius: var(--line-border-radius);
		border-end-end-radius: var(--line-border-radius);
	}

	${!prefs.autoCollapse ? /*css*/`
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
		tab& .tab-stack::before,
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

		${!nova ? /*css*/`
			tab-group[collapsed] & .tab-group-label-hover-highlight {
				padding-block: min(4px, (var(--tab-min-height) - var(--tab-group-label-height)) / 2);
			}
		` : ``}

		.tab-group-label {
			max-width: var(--group-label-max-width);
			align-content: center;
			${!nova ? `
				border-radius: max(var(--tab-border-radius) - 2px, var(--tab-group-label-padding));
			` : ``}

			/*https://bugzil.la/1985445*/
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

			/*https://bugzil.la/1985190*/
			tab-group[collapsed] &:not(.tablist-keyboard-focus) {
				outline-offset: calc(${outlineOffsetSnapping("1px")} * -1);
			}
		}
	}

	& > tab .tab-stack,
	tab-split-view-wrapper {
		--wrapper-padding: 0px;

		&.tab-stack {
			--wrapper-padding: var(--tab-overflow-clip-margin);

			[animate-shifting] > &::before {
				width: calc(
					var(--l)
					- var(--tab-overflow-clip-margin)
					- var(--line-indent)
					+ var(--wrapper-padding)
					+ var(--line-overlap-length)
					+ var(--width-rounding-diff)
				);
			}
		}

		tab-split-view-wrapper& {
			--line-rounding-diff-start: ${RTL_UI ? "var(--width-rounding-diff, 0px)" : "0px"};
			--line-rounding-diff-end: ${!RTL_UI ? "var(--width-rounding-diff, 0px)" : "0px"};
		}

		tab-group:not([stacked]) & {
			tab-split-view-wrapper&:not(
				tab-group[collapsed] > :not([hasactivetab]),
				[stacking]
			)::before,
			tab:not(
				tab-group[collapsed] > ${TAB_GROUP_PREVIEW_SUPPORT ? ":not([selected])" : "tab"},
				[stacking]
			) > &::before {
				content: "";
				background-color: var(
					--tab-group-line-color,
					light-dark(var(--tab-group-color), var(--tab-group-color-invert))
				);
				position: absolute;
				height: var(--tab-group-line-thickness);
				bottom: var(--tab-group-line-toolbar-border-distance);
				inset-inline:
					calc(
						0px
						- var(--wrapper-padding)
						- var(--line-rounding-diff-start, 0px)
					)
					calc(
						var(--line-indent)
						- var(--line-overlap-length)
						- var(--wrapper-padding)
						- var(--line-rounding-diff-end, 0px)
					);
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
			${nova ? `
				margin-inline-end: var(--group-line-padding);
			` : `
				align-content: center;
				height: inherit;
				padding-block: 0;
				padding-inline-end: calc(var(--space-small) + var(--group-line-padding));
			`}
		}

		&:is([animate-shifting], [movetarget]) {
			.tab-group-overflow-count {
				margin-left: calc(
					var(--width-rounding-diff)
					${nova && RTL_UI ? `+ var(--group-line-padding)` : ``}
				);
				margin-top: var(--height-rounding-diff);
				${!nova ? `
					padding-right: calc(
						${RTL_UI ? "0px" : "var(--group-line-padding)"}
						+ var(--space-small) - var(--width-rounding-diff)
					);
				` : ``}
			}

			&::after {
				right: calc(${RTL_UI ? "0px" : "var(--group-line-padding)"} - var(--width-rounding-diff)) !important;
			}
		}
	}

	/*https://bugzil.la/1990744*/
	& > :is(.tab-group-label-container, tab, tab-split-view-wrapper):not(
		:has(~ :is(tab, tab-split-view-wrapper)${visible}),
		[hasactivetab][hasmultipletabs][collapsed] > :is([selected], [hasactivetab])
	) {
		--line-overlap-length: 0px;
		--line-indent: var(--group-last-tab-line-indent);
		--line-border-radius: calc(var(--tab-group-line-thickness) / 2);

		&.tab-group-label-container {
			--line-indent: var(--group-line-padding);
		}

		tab-group > tab&,
		tab-split-view-wrapper& {
			--line-indent: calc(var(--group-last-tab-line-indent) + var(--tab-overflow-clip-margin));
		}
	}

	&[stacked] > :is([hasactivetab], [selected]) {
		min-width: 0 !important;
		max-width: 0 !important;

		&:not([animate-shifting]) {
			overflow: clip;
		}

		.tab-stack {
			overflow: clip;
			width: 0;
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
	height: var(--tabstrip-min-height);
	-moz-window-dragging: no-drag;

	/*override the position:absolute of the fx rule*/
	&[dragtarget] {
		position: relative !important;
	}
}

${!prefs.lastRowTabsFlexibe ? /*css*/`
	#tabbrowser-tabs:is([multirows], [overflow]) #tabbrowser-arrowscrollbox-periphery {
		flex-grow: calc(1/0);
	}
` : ``}

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

${appVersion < 132 ? /*css*/`
	${_} {
		padding: 0 var(--tab-overflow-clip-margin);
	}
` : ``}

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
}

${_}[stacking] .tab-content,
tab-split-view-wrapper[stacking] tab,
:is(
	${_},
	tab-split-view-wrapper
)[stacking=hidden] {
	visibility: hidden;
}

${"#tabbrowser-arrowscrollbox".repeat(3)}
	:is(
		${_}${prefs.pinnedTabsFlexWidth ? "" : ":not([pinned])"},
		tab-split-view-wrapper
	)[stacking]
{
	min-width: ${__="var(--stacking-size) !important"};
	max-width: ${__};
	overflow: visible;
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

${appVersion < 134 ? /*css*/`
	${_}[image] > .tab-stack > .tab-content:is([attention], [titlechanged]):not([pinned], [selected]) {
		background-position-x: ${START} calc(var(--tab-inline-padding) + 6px);
	}
` : ``}

/*the context line margin causes the tab background can't shrink*/
.tabbrowser-tab[usercontextid] > .tab-stack > .tab-background > .tab-context-line {
	position: absolute;
	top: var(--tab-block-margin);
	margin: 0;
	/* https://bugzil.la/2039854 */
	width: calc(
		100%
		- ${nova ? "var(--tab-min-height) + 4px" : "var(--tab-border-radius)"}
	);
	align-self: center;

	tab-split-view-wrapper & {
		top: 0;
	}
}

${prefs.pinnedTabsFlexWidth ? /*css*/`
	${_}[pinned] {
		--tab-label-mask-size: ${appVersion < 130 ? 2 : 1}em !important;
		flex: 100 100;
	}

	${_}[pinned] .tab-content {
		min-width: 0;
	}

	${_}${__="[pinned]:is([attention], [titlechanged]) > .tab-stack > .tab-content:is([attention], [titlechanged]):not([selected])"} {
		background-position-x: ${START} calc(var(--tab-inline-padding) + 6px);
	}

	${_}:not([image])${__} {
		background: none;
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
		margin-inline-end: var(--tab-icon-end-margin);

		tab:is(${showAudioButton}):not([mini-button]) & {
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
	padding: 0 !important;
	margin-inline-start: -.1px !important;
}

${!prefs.pinnedTabsFlexWidth ? /*css*/`
	${_}[closing][pinned] {
		visibility: hidden;
	}
` : ``}

${_}[closing] .tab-stack {
	overflow: clip;
}

.tab-content {
	--tab-overlay-icon-distance: calc(
		var(--tab-outline-max-width) + 1px - var(--tab-overlay-icon-distance-adjustment, 0px)
	);
	--tab-overlay-icon-min-size: 10px;
	--tab-overlay-icon-size: clamp(
		var(--tab-overlay-icon-min-size),
		round(
			down,
			(
				var(--tab-min-height)
				+ (
					var(--tab-overlay-icon-size-adjustment, 0px)
					- var(--tab-overlay-icon-distance)
				) * 2
			) * var(--tab-overlay-icon-size-percentage, 1),
			1px
		),
		var(--tab-icon-size)
	);

	tab-split-view-wrapper & {
		--tab-overlay-icon-distance-adjustment: min(var(--tab-overflow-clip-margin), 1px);
	}

	${!prefs.pinnedTabsFlexWidth ? /*css*/`
		&[pinned] {
			--tab-overlay-icon-distance: ${nova
				? "1px"
				: "calc(var(--tab-pinned-inline-padding) + 1px)"};

			--tab-overlay-icon-size-adjustment: min(
				${nova
					? `var(--tab-min-height) - var(--tab-icon-size) * 2`
					: `var(--tab-inline-padding) - var(--tab-icon-size) / 2`},
				0px
			);
		}
	` : ``}

	tab[tab-note]:is(${showAudioButton}) & {
		--tab-overlay-icon-size-percentage: .5;
	}
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

${prefs.pinnedTabsFlexWidthIndicator ? /*css*/`
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

${appVersion < 152 ? /*css*/`
	#tabbrowser-tabs:not([secondarytext-unsupported]) .tab-label-container {
		height: min(var(--tab-label-height, 2.7em), var(--tab-min-height));
	}
` : ``}

${!prefs.pinnedTabsFlexWidth ? /*css*/`
	:root[id] .tab-content[pinned] {
		padding-inline: calc(var(--tab-inline-padding) + var(--tab-pinned-inline-padding));
	}
` : ``}

.tab-label {
	line-height: min(1em * var(--tab-label-line-height, 1.7), var(--tab-min-height));
}

${prefs.tabContentHeight <= TAB_CONTENT_HEIGHT[1] ? /*css*/`
	.tab-secondary-label {
		display: none;
	}
` : ``}

.tab-note-icon,
.tab-close-button {
	padding-block: 0;
	object-fit: scale-down;
	height: min(24px, var(--tab-min-height));
}

${appVersion > 136 ? /*css*/`
	.tab-icon-overlay,
	.tab-note-icon-overlay {
		--shift: clamp(
			var(--tab-icon-size) / -2,
			(var(--tab-icon-size) - var(--tab-min-height)) / 2 + var(--tab-overlay-icon-distance),
			var(--tab-overlay-icon-distance)
		);
		top: round(down, var(--shift), 1px);
		inset-inline: auto -1px;
		justify-self: end;
		height: var(--tab-overlay-icon-size);
		width: var(--tab-overlay-icon-size);
		padding: 0;
		object-fit: scale-down;

		${!prefs.pinnedTabsFlexWidth ? /*css*/`
			[pinned] > & {
				inset-inline-end: calc(
					min(
						var(--tab-icon-size) / 2,
						var(--tab-inline-padding)
					) * -1
					- var(--tab-pinned-inline-padding)
					+ var(--tab-overlay-icon-distance)
				);
			}
		` : ``}
	}

	.tab-icon-overlay, .tab-note-icon-overlay:is(:hover, [open]) {
		z-index: 2;
	}
` : ``}

/*https://bugzil.la/2005910*/
${nova ? `.tab-icon-overlay` : `.tab-note-icon-overlay`} {
	top: auto;
	bottom: round(up, var(--shift), 1px);
	align-self: end;
}

.tab-audio-button::part(button) {
	--size: min(24px, var(--tab-min-height));
	--button-size-icon-small: var(--size);
	--button-min-height-small: var(--size);
}

${"#tabbrowser-arrowscrollbox".repeat(3)} tab-split-view-wrapper {
	--w: 0px;
	--width-rounding-diff: 0px;
	--splitview-width-rounding-diff: var(--width-rounding-diff);
	--splitview-outline-color: transparent;
	--splitview-outline-width: 1px;
	--splitview-outline-offset: calc(${outlineOffsetSnapping("var(--splitview-outline-width)")} * -1);
	--splitview-background-color: transparent;
	--splitview-separator-color: var(--toolbarbutton-icon-fill);
	--splitview-separator-indent: 1px;
	--splitview-tab-min-height: max(calc(var(--tab-min-height) - var(--tab-overflow-clip-margin) * 2), var(--tab-icon-size));
	display: flex;
	align-items: center;
	position: relative;
	min-width: var(--tab-split-view-min-width);
	max-width: var(--tab-split-view-max-width);
	outline: 0;
	border-radius: 0;
	border: 0;
	padding: 0;
	background: none !important;

	&::after {
		--animate-width: calc(var(--w) + var(--width-rounding-diff));
		content: "";
		outline: var(--splitview-outline-width) solid var(--splitview-outline-color);
		outline-offset: var(--splitview-outline-offset);
		background-color: var(--splitview-background-color);
		border-radius: var(--tab-border-radius);

		width: calc(100% - var(--tab-overflow-clip-margin) * 2 + var(--animate-width));
		height: var(--tab-min-height);
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

	&[animate-shifting]::after {
		will-change: width, margin-inline;
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
		--splitview-background-color: var(--tab-background-color-hover, var(--tab-hover-background-color));
		--splitview-separator-color: transparent;

		/*ui.useAccessibilityTheme=1*/
		@media (forced-colors) {
			--splitview-outline-color: SelectedItem;
			--splitview-background-color: SelectedItemText;
		}
	}

	&:not([hasactivetab]) {
		--splitview-outline-color: var(--tab-outline-color);

		tab-group[collapsed] & {
			max-height: var(--tabstrip-min-height) !important;

			&[animate-shifting] {
				overflow: visible;
			}
		}

		&:hover {
			--splitview-background-color: var(--tab-background-color-hover, var(--tab-hover-background-color));
			--splitview-outline-color: var(--tab-hover-outline-color);
		}
	}

	&:is(
		[stacking],
		:not(:has(> :not([multiselected]))),
		#tabbrowser-tabs[movingtab-group]
			:is(
				${!nova ? `[dragover-groupSource],` : ``}
				[dragover-groupTarget]
			),
		#tabbrowser-tabs[stackingtabs]:not([movingtab-finishing])
			[movetarget]:has(> [multiselected]),
		#tabbrowser-tabs[stackingtabs][movingtab-finishing=""]
			[movetarget][hasactivetab]
	) {
		--splitview-outline-color: var(--focus-outline-color);
		--splitview-background-color: var(--tab-background-color-selected, var(--tab-selected-bgcolor));
		--splitview-separator-color: var(--toolbarbutton-icon-fill);

		&:not([dragover-groupTarget])::after {
			box-shadow: var(--tab-selected-shadow);
		}

		#tabbrowser-tabs[movingtab-group] & {
			${!nova ? /*css*/`
				&[dragover-groupSource] {
					--splitview-outline-color: var(--dragover-tab-group-color);
					--splitview-outline-width: 2px;
				}
			` : ``}

			&[dragover-groupTarget] {
				${nova ? `
					--splitview-outline-width: 2px;
					--splitview-outline-color: var(--dragover-tab-group-color);
					--splitview-background-color: var(--dragover-tab-group-color-invert);
					--splitview-outline-offset: calc(${outlineOffsetSnapping("1px")} * -1);
				` : `
					--splitview-outline-color: light-dark(var(--dragover-tab-group-color), var(--dragover-tab-group-color-pale));
					--splitview-background-color: light-dark(var(--dragover-tab-group-color-pale), var(--dragover-tab-group-color));
				`}
			}
		}

		&[hasactivetab] {
			--splitview-outline-width: 2px;
		}

		tab {
			.tab-background {
				background: none;
				border-color: transparent;
				outline-color: transparent;
				box-shadow: none;
				transition: none;
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

	tab {
		--tab-overflow-clip-margin: inherit;
		border: 0;
		padding: 0;
		min-width: 0;
		max-width: var(--tab-split-view-max-width);
		scroll-snap-align: none;
		align-items: center;
		flex-basis: calc(50% - .5px);

		&:last-child {
			flex-basis: calc(50% + .5px);
		}

		&:first-child::before,
		&:last-child::after,
		&[closing] + &::before,
		&:has(+ &[closing])::after {
			/*https://bugzil.la/2007279*/
			width: calc(
				var(--tab-overflow-clip-margin) * 2
				+ var(--split-view-tab-padding-inline, var(--tab-overflow-clip-margin))
			);
			transition: width var(--tab-animation);
		}

		/* 1st tab */
		&:has(+ &:not([closing])) {
			--box-shadow-indent: ${borderSnapping(`
				var(--tab-block-margin)
				+ 2px
			`)};
			/*https://bugzil.la/2007048*/
			box-shadow:
				calc((
					var(--box-shadow-indent)
					+ ${borderSnapping("1px")}
				) * ${DIR})
				0
				0
				calc(var(--box-shadow-indent) * -1)
				var(--splitview-separator-color);

			tab-group[collapsed] :not([hasactivetab]) > & {
				box-shadow: none;
			}
		}

		/* 2nd tab */
		& + & {
			&::before {
				width: calc(var(--tab-overflow-clip-margin) + 1px);
			}

			/* prevent the tab from visually exceeding the splitview background when closing */
			/* TODO handle switching from single tab */
			&[closing] .tab-stack {
				overflow: visible;

				/* not using the stack directly since it is already used for sizing animation */
				& > * {
					translate: calc(var(--tab-overflow-clip-margin) * -3 * ${DIR}) 0;
					transition: translate var(--tab-animation);
				}
			}
		}

		.tab-background {
			--tab-min-height: var(--splitview-tab-min-height);
			min-height: var(--tab-min-height);
			margin-inline: 0;

			tab[multiselected] & {
				outline-color: var(--focus-outline-color);
				background-color: var(--tab-background-color-selected, var(--tab-selected-bgcolor));
			}
		}

		.tab-content {
			--tab-min-height: var(--splitview-tab-min-height);
			padding: 0;

			${appVersion < 152 ? /*css*/`
				.tab-label-container {
					height: auto;

					#tabbrowser-tabs:not([secondarytext-unsupported]) & {
						height: min(var(--tab-label-height, 2.7em), var(--tab-min-height));
					}
				}
			` : ``}
		}
	}
}

${prefs.pinnedTabsFlexWidth && appVersion < 139 ? ["ltr", "rtl"].map(dir => /*css*/`
	${__=".tab-label-container[textoverflow]"}[labeldirection=${dir}],
	${__}:not([labeldirection]):-moz-locale-dir(${dir}) {
		direction: ${dir};
		mask-image: linear-gradient(to ${dir == "ltr" ? "left" : "right"}, transparent, black var(--tab-label-mask-size));
	}
`).join("\n") : ``}

/* for tabs with audio button, fix the size and display the button like pinned tabs */
#tabbrowser-tabs[orient] ${_}[fadein]:is(
	${showAudioButton}, [tab-note]
)[mini-button]${prefs.pinnedTabsFlexWidth ? "[fadein]" : ":not([pinned])"} {
	&:not(${__ = "[image], [crashed], [sharing], [pictureinpicture], [busy], [pendingicon]"}) {
		.tab-icon-overlay,
		&[tab-note] .tab-audio-button,
		&:is(${showAudioButton}) .tab-note-icon {
			display: none;
		}

		&[tab-note]:is(${showAudioButton}) {
			--tab-icon-end-margin: inherit;

			.tab-icon-image,
			.tab-icon-overlay {
				display: revert;
			}
		}
	}

	&:is(${__}) {
		--tab-icon-end-margin: inherit;

		.tab-audio-button,
		.tab-note-icon {
			display: none !important;
		}
	}
}

/*https://bugzil.la/2005910*/
${_}[fadein][tab-note]:is(
	${!prefs.pinnedTabsFlexWidth ? "[pinned]," : ""}
	[mini-button]
):is(${__}, ${showAudioButton}) .tab-note-icon-overlay {
	display: revert;
}

${prefs.pinnedTabsFlexWidth ? /*css*/`
	${_}[pinned][tab-note]:is(:not(${__}), :not([mini-button])) {
		.tab-note-icon {
			display: revert;
		}

		.tab-note-icon-overlay {
			display: none;
		}
	}
` : ``}

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
	overflow: clip;
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
	tab& .tab-stack::before,
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

${!nova ? /*css*/`
	[movingtabgroup][collapsed] .tab-group-label-hover-highlight {
		background-color: ${__=`var(--tab-background-color-hover, var(--tab-hover-background-color))`};
		box-shadow: 0 0 0 var(--tab-group-label-highlight-radius, 2px) ${__};
	}
` : ``}

#tabbrowser-tabs[orient]
	${condition = `${_}:is([movetarget], [animate-shifting])`}
{
	overflow: visible;
}

${condition = `:not(tab-split-view-wrapper) > ` + condition}::${RTL_UI ? "before" : "after"} {
	margin-left: calc(var(--width-rounding-diff) * -1) !important;
}

${condition} .tab-background {
	margin-bottom: calc(var(--tab-block-margin) - var(--height-rounding-diff)) !important;
}

${condition} .tab-content {
	margin-bottom: var(--height-rounding-diff) !important;
}

${__ = "[animate-shifting=run]"},
${__} > .tab-stack,
${__} > .tab-stack::before,
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
			overflow: clip;
		}

		tab-group:not([collapsed]) &,
		[collapsed][hasactivetab]:not([stacked]) > &[selected] {
			overflow: visible;
		}
	}
}

[animate-shifting=run] > .tab-stack {
	transition-property: margin-inline-end !important;

	&::before {
		transition-property: translate !important;
	}
}

${__="[movingtab-finishing] [animate-shifting=run]"},
${__} > .tab-stack::before,
${__}:is(tab-split-view-wrapper)::before,
${__}:is(.tab-group-label-container, .tab-group-overflow-count-container)::after,
[movingtab-finishing] [movingtabgroup] [animate-shifting=run] :is(
	${__=".tab-group-label-hover-highlight"},
	${__} .tab-group-label
) {
	transition-property: translate, transform !important;
}

/* prevent the original rules display the line */
.tab-group-line {
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

${!prefs.autoCollapse ? /*css*/`
	@media ${prefs.tabsUnderControlButtons > 1 ? multiRows : "screen"} {
		${context=`#TabsToolbar:not([customizing])
			#tabbrowser-tabs:not([ignore-newtab-btn])${prefs.tabsUnderControlButtons < 2 ? ":not([overflow])" : ""}[hasadjacentnewtabbutton]`}
				[last-inflow-node],
		${context} :is([last-inflow-node], tab-group:has(> [last-inflow-node])) ~ [closing] {
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
		}

		${context} :is([last-inflow-node], tab-group:has(> [last-inflow-node])) ~ [closing] {
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

/* raise the priority high enough */
${"#tabbrowser-tabs".repeat(5)}[forced-overflow]
	[last-inflow-node]
{
	margin-inline-end: var(--forced-overflow-adjustment) !important;
}

/*
  move the margin-start to the last pinned, so that the first normal tab won't
  have a weird margin on the left when it is wrapped to new row. the important is necessary here.
  the [first-visible-unpinned-tab] is for fx 115 as it may not be updated in time and cause weird layout animation.
*/
${context = `#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox`} >
	${__=`${_}:is(:nth-child(1 of :not([pinned], [hidden])), [first-visible-unpinned-tab])`}
{
	margin-inline-start: 0 !important;
}

${context} > ${__}[closing] {
	margin-inline-start: -.1px !important;
}

[hasadjacentnewtabbutton]${context} > [last-inflow-node] ~ ${__}[closing] {
	margin-inline-start: calc(var(--new-tab-button-width) * -1 - .1px) !important;
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

${_}:not([pinned], [closebutton]) .tab-close-button:not([selected]) {
	display: none;
}

/*bug fix for fx 115*/
:root[uidensity=touch] #tabbrowser-tabs[orient] ${_}:not([pinned], [fadein]) {
	max-width: .1px;
	min-width: .1px;
}

/*https://bugzil.la/1985190*/
#tabbrowser-tabs #tabbrowser-arrowscrollbox .tab-background {
	--outline-width: calc(var(--tab-outline-offset, -1px) * -1);
	outline-offset: calc(${outlineOffsetSnapping("var(--outline-width)")} * -1);
}

${!nova ? `
	[${MOVINGTAB_GROUP}] tab:not([pinned]) .tab-background:is([multiselected], [selected]),
` : ``}
.tab-background[multiselected][selected] {
	--tab-outline-offset: -2px;
}

${condition="[ignore-newtab-btn]"}:not([overflow]) #tabbrowser-arrowscrollbox-periphery {
	margin-inline-end: calc(var(--new-tab-button-width) * -1);
}

#tabs-newtab-button {
	--toolbarbutton-padding-outer: var(--newtab-button-outer-padding);
	--toolbarbutton-outer-padding: var(--newtab-button-outer-padding);
	--toolbarbutton-padding-inner: var(--newtab-button-inner-padding);
	--toolbarbutton-inner-padding: var(--newtab-button-inner-padding);
}

[ignore-newtab-btn=singlerow] #tabs-newtab-button {
	mask-image: linear-gradient(to ${END}, black, transparent 67%);
}

${!prefs.autoCollapse ? /*css*/`
	@media ${prefs.tabsUnderControlButtons > 1 ? multiRows : "screen"} {
		#tabbrowser-tabs:not(${condition}) #tabs-newtab-button {
			margin-inline-start: calc(var(--forced-overflow-adjustment, var(--new-tab-button-width)) * -1) !important;
		}
	}
` : ``}

${"#tabbrowser-tabs".repeat(3)} > #pinned-drop-indicator {
	display: flex;
	align-items: center;
	position: absolute;
	top: var(--extra-drag-space);
	inset-inline-start: calc(var(--pre-tabs-items-width) + var(--tabstrip-separator-size));
	z-index: calc(var(--tabs-moving-max-z-index) + 1);
	width: calc(var(--tab-icon-size) + (var(--tab-inline-padding) + var(--tab-pinned-inline-padding)) * 2);
	min-width: 0;
	height: var(--tab-min-height);
	padding: 0;
	margin: var(--tab-block-margin) var(--tab-overflow-clip-margin);
	border-radius: var(--tab-border-radius);
	outline-offset: calc(${outlineOffsetSnapping("1px")} * -1);
	background: var(--tab-background-color-hover, var(--tab-hover-background-color));
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
		top: calc(var(--extra-drag-space) + var(--tabstrip-min-height) * var(--preserved-row, 0));
		inset-inline-start: 0;
		height: calc(var(--tab-min-height) + var(--tabstrip-min-height) * (var(--tab-rows) - 1 - var(--preserved-row, 0)));

		[has-items-pre-tabs][tabs-scrolledtostart] & {
			--preserved-row: 1;
		}
	}

	&[interactive] {
		background: var(--tab-background-color-selected, var(--tab-selected-bgcolor));
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

${prefs.tabsUnderControlButtons ? /*css*/`
	${!(prefs.nativeWindowStyle && (prefs.tabsAtBottom > 0 || nova)) ? /*css*/`
		:root[${CUSTOM_TITLEBAR}]
			:is(
				${!nova ? `.browser-titlebar, ` : ``}
				#titlebar,
				#TabsToolbar
			)
		{
			transition-property: opacity, background-color;
		}
	` : ``}

	${_="#TabsToolbar"} {
		--post-tabs-clip-reserved: 0px;
		--scrollbar-clip-reserved: 0px;
		--control-box-reserved-height: 0px;
		--control-box-reserved-width: 0px;
		--control-box-margin-end: 0px;
		--control-box-radius-start: 0px;
		--control-box-radius-end: 0px;
		--control-box-clip-scrollbar-reserved: var(--scrollbar-clip-reserved);
		/*3px is calculated from --tab-box-shadow*/
		--tab-shadow-size: var(--tab-selected-shadow-size, var(--tab-shadow-max-size, 3px));

		${
			nova && defaultTheme && prefs.tabsAtBottom < 0
				? `
					background-color: var(--toolbar-background-color);
				` : (
					prefs.tabsAtBottom < 1 &&
					//the tabs bar will not get tranparency when window inactive thus doesn't need the background
					!(nova && !prefs.tabsAtBottom && !getPref("browser.tabs.inTitlebar")) &&
					//exclude the case where the body already has background
					!(!nova && BACKGROUND_ON_BODY && !isYAlign && prefs.tabsAtBottom < 0) &&
					//there is no backgound on win7 and win8 with default themes
					!(defaultTheme && (win7 || win8))
				)
					? toolbarBackgroundStyle
					//show a y-align-bottom style for tabs unser content
					: !nova && prefs.tabsAtBottom < 0 && bgImgAllRepeat && !prefs.nativeWindowStyle
						? /*css*/`
							#navigator-toolbox:not(${navToolboxWithSidebar}) & {
								${toolbarBackgroundStyle}
							}
						` : ``
		}

		${nova && micaTheme && !prefs.tabsAtBottom ? /*css*/`
			& {
				--chrome-block-background-image: none;
				background-color: transparent;
			}
		` : ``}
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
				: `
					--multirows-toolbox-background-color,
						var(--tab-background-color-selected,
							var(--tab-selected-bgcolor,
								var(--lwt-selected-tab-background-color)
							)
						)
				`
		});
	}

	${(micaEnabled && accentColorInTitlebarMQ.matches) && defaultAutoTheme ? /*css*/`
		:root:not([ai-window]) {
			${!prefs.nativeWindowStyle ? `:root[${CUSTOM_TITLEBAR}]` : ``}
				${_}
			{
				${__="--tabs-placeholder-background-color"}: ActiveCaption;
			}

			${!prefs.nativeWindowStyle ? `:root[${CUSTOM_TITLEBAR}]` : ``}
				${_}:-moz-window-inactive
			{
				${__}: InactiveCaption;
			}
		}
	` : ``}

	${micaTheme ? /*css*/`
		:root[customtitlebar] :is(${_}, ${_}:-moz-window-inactive) {
			--tabs-placeholder-background-color: var(--mica-background-color);
		}
	` : ``}

	${_ += showPlaceHolder}[tabs-dragging] .titlebar-buttonbox-container {
		pointer-events: none;
	}

	${_} #TabsToolbar-customization-target {
		align-items: start;
	}

	@media ${multiRows} {
		${prefs.tabsUnderControlButtons > 1 ? /*css*/`
			/*shift the post items to make them not cover the scrollbar, when there are no inline control buttons*/
			#TabsToolbar[tabs-overflow][has-items-post-tabs]:not([no-scrollbar-gutter]) {
				padding-inline-end: var(--tabs-scrollbar-width);
			}
		` : ``}

		/*raise the items to cover the placeholder*/
		${context=`${_}:not(${condition=tbDraggingHidePlaceHolder})`} >
			:not(.toolbar-items),
		${context}
			#TabsToolbar-customization-target > :not(#tabbrowser-tabs)
		{
			z-index: calc(var(--tabs-moving-max-z-index) + 3);
		}

		/*raise the tabs to cover the items when dragging*/
		${context = _ + condition} #tabbrowser-tabs {
			z-index: 1;
		}

		/*raise the items that can be dropped on to cover the tabs when dragging*/
		${context} ${_=dropOnItems},
		${dropOnItemsExt} {
			z-index: calc(var(--tabs-moving-max-z-index) + 3);
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

				@media (forced-colors) {
					background-color: var(--tabs-placeholder-background-color);
					box-shadow: none;
				}
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
		${condition = context + `:not(${staticPreTabsPlaceHolder})`} >
			:not(.toolbar-items),
		${condition}
			#TabsToolbar-customization-target >
				:not(#tabbrowser-tabs, ${dropOnItems}, ${dropOnItemsExt}),
		${condition}
			#TabsToolbar-customization-target
				.urlbar:popover-open,
		/*hide items post tabs when dragging*/
		${condition = context + ":not([tabs-scrolledtostart])"} >
			.toolbar-items ~ *,
		${condition}
			#tabbrowser-tabs ~
				:not(${_ = adjacentNewTab}, ${dropOnItems}, ${dropOnItemsExt}),
		${condition}
			#tabbrowser-tabs ~ .urlbar-container
				.urlbar:popover-open,
		/*hide adjacent new tab button when dragging*/
		${context}:not([tabs-scrolledtoend], [tabs-dragging-ext]) ${_} {
			${__ = `
				opacity: 0 !important;
				transition: opacity var(--tabs-item-opacity-transition);
			`}
		}

		/*always hide the static adjacent new tab button when dragging*/
		@media ${multiRows} and ${twoOrLessRows} {
			${context}:not([tabs-dragging-ext]) ${_} {
				${__}
			}
		}

		${win7 || win8 ? /*css*/`
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

	${win7 || win8 ? /*css*/`
		${_=topMostTabsBar} {
			--control-box-reserved-height: ${controlBoxInfo.normal.height}px;
			--control-box-reserved-width: ${controlBoxInfo.normal.width}px;
		}

		[sizemode=maximized]${_} {
			--control-box-reserved-height: ${controlBoxInfo.maximized.height}px;
			--control-box-reserved-width: ${controlBoxInfo.maximized.width}px;
		}

		@media (-moz-windows-compositor) {
			[sizemode=maximized]${_} {
				--control-box-margin-end: 3px;
			}

			${win7 ? /*css*/`
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

	@media not ${singleRow} {
		${prefs.floatingBackdropClip && prefs.tabsUnderControlButtons > 1 ? /*css*/`
			${context = "#TabsToolbar" + showPlaceHolder}:not(${tbDraggingHidePlaceHolder}) ${_ = "#tabbrowser-tabs"} {
				clip-path: polygon(
					${START_PC} ${y=/*js*/`calc(var(--tabstrip-min-height) + var(--extra-drag-space))`},
					var(--top-placeholder-clip,
						var(--pre-tabs-clip,
							${x=/*js*/`calc(${START_PC} + (var(--pre-tabs-items-width) + var(--tabstrip-padding)) * ${DIR})`} ${y},
							${x} ${y=/*js*/`calc(var(--tabs-top-space) * -1)`}
						),
						var(--post-tabs-clip,
							${x=/*js*/`calc(${END_PC} - (var(--post-tabs-items-width) - var(--post-tabs-clip-reserved)) * ${DIR})`} ${y},
							${x} ${y=/*js*/`calc(var(--tabstrip-min-height) + var(--extra-drag-space))`},
							${x=/*js*/`calc(${END_PC} - var(--scollbar-clip-width, (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved))) * ${DIR})`} ${y}
						)
					),
					${x} ${y=/*js*/`calc(var(--control-box-reserved-height) + var(--extra-drag-space) - var(--tabs-top-space))`},
					${x=/*js*/`calc(${END_PC} - (var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
					${x=/*js*/`calc(${END_PC} - var(--control-box-margin-end) * ${DIR})`} calc(var(--control-box-reserved-height) + var(--extra-drag-space) - var(--tabs-top-space) - var(--control-box-radius-end)),
					${x} 0,
					${x=END_PC} 0,
					${x} 100%,
					var(--new-tab-clip, ${x} 100%),
					${START_PC} 100%
				);
			}

			${prefs.showScrollShadow ? /*css*/`
				${__=`${_}[orient]:is(:not([dragging], [movingtab], [movingtab-finishing]), [moving-positioned-tab])`}::before {
					--clip-${START}: max(var(--pre-tabs-items-width) - var(--scroll-content-start), 0px);
					--clip-${END}: var(--post-tabs-items-width);
				}

				${__}[hasadjacentnewtabbutton]::after {
					--clip-${END}: calc(var(--new-tab-button-width) + var(--tabs-scrollbar-width));
				}
			` : ``}

			${context}:not(${tbDraggingHidePlaceHolder})[tabs-scrolledtostart] ${_} {
				--scollbar-clip-width: var(--tabs-scrollbar-visual-width);
				--top-placeholder-clip:
					${START_PC} ${y=/*js*/`calc(var(--tabs-top-space) * -1)`},
					calc(${END_PC} - var(--scollbar-clip-width, (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved))) * ${DIR}) ${y};
			}

			${prefs.hideEmptyPlaceholderWhenScrolling ? /*css*/`
				${context}[tabs-no-previous-visible] ${_} {
					--pre-tabs-clip: ${START_PC} calc(var(--tabs-top-space) * -1);
				}

				${context}[tabs-no-next-visible] ${_} {
					--post-tabs-clip: calc(${END_PC} - var(--scollbar-clip-width, (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved))) * ${DIR}) calc(var(--tabs-top-space) * -1);
				}
			` : ``}

			${context}:not([tabs-scrolledtoend]) ${_}[overflow][hasadjacentnewtabbutton] {
				--new-tab-clip:
					${x=/*js*/`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR})`} 100%,
					${x} ${y=/*js*/`calc(100% - var(--tabstrip-min-height) - var(--extra-drag-space))`},
					${x=/*js*/`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--new-tab-button-width)) * ${DIR})`} ${y},
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

	${win7 || win8 ? /*css*/`
		/*Clip the scrollbar when dragging*/
		${topMostTabsBar}${showPlaceHolder}${tbDraggingHidePlaceHolder}${defaultTheme ? "" : "[tabs-scrolledtostart]"}
			#tabbrowser-tabs[overflow]
		{
			clip-path: polygon(
				${x=START_PC} 100%,
				${x} ${y="calc(var(--tabs-top-space) * -1)"},
				${x=/*js*/`calc(${END_PC} - var(--tabs-scrollbar-width) * ${DIR})`} ${y},
				${x} ${y=/*js*/`calc(var(--control-box-reserved-height) + var(--extra-drag-space) - var(--tabs-top-space))`},
				${x=/*js*/`calc(${END_PC} - (var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
				${x=/*js*/`calc(${END_PC} - var(--control-box-margin-end) * ${DIR})`} ${y=/*js*/`calc(var(--control-box-reserved-height) + var(--extra-drag-space) - var(--tabs-top-space) - var(--control-box-radius-end))`},
				${x} ${y="calc(var(--tabs-top-space) * -1)"},
				${x=END_PC} ${y},
				${x} 100%
			);
		}

		/*clip the background of post tabs placeholder so that when the control box clip is canceled when dragging,
		  placeholder does not cover the control box until fadeout is complete*/
		${!prefs.floatingBackdropClip ? /*css*/`
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

			${defaultTheme ? /*css*/`
				.tabs-placeholder::before {
					--control-box-adjustment: 1px;
				}
			` : ``}
		` : ``}
	` : ``}

	${win8 && defaultDarkTheme ? /*css*/`
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
		[tabs-hide-placeholder], [pinned-tabs-wraps-placeholder], [tabs-no-previous-visible]
	)
		#tabbrowser-arrowscrollbox[scrolledtostart]::part(overflow-start-indicator)
	{
		clip-path: inset(calc(var(--tabstrip-min-height) + var(--tabs-placeholder-border-width)) 0 0 0);
	}

	${_="#tabbrowser-arrowscrollbox::part(items-wrapper)"}::before,
	${_}::after {
		content: "";
		pointer-events: none;
		flex-shrink: 0;
	}

	#tabbrowser-tabs[overflow] ${_}::before {
		opacity: 0;
	}

	/*Height is not set for the post-tabs placeholder to let it not occupy an empty row,
	  such as when closing the only tab in the second row, tabs in the first row are locking size
	  and the placeholder is wrapped to the second row alone.*/
	${_}::before {
		height: var(--tabstrip-min-height);
	}

	${context=`#TabsToolbar:is(${hidePlaceHolder})`} ${_}::before,
	${context} ${_}::after {
		display: none;
	}

	@media ${multiRows} {
		${context="#TabsToolbar:not([pinned-tabs-wraps-placeholder])"} ${_}::before {
			border-inline-end: var(--tabstrip-border);
			padding-inline-end: var(--tabstrip-padding);
			margin-inline-end: calc(
				var(--tabstrip-padding) + var(--tabstrip-border-width) - ${borderSnapping("var(--tabstrip-border-width)")}
			);
		}
	}

	${context}[tabs-multirows] ${_}::before {
		border-bottom: var(--tabstrip-border);
		margin-bottom: calc(${borderSnapping("var(--tabstrip-border-width)")} * -1);
		border-end-end-radius: var(--tabs-placeholder-border-radius);
	}

	${context="#TabsToolbar:not([tabs-hide-placeholder])"} ${_}::before {
		width: var(--pre-tabs-items-width);
	}

	${context}[positionpinnedtabs] ${_}::before {
		width: calc(var(--pre-tabs-items-width) - var(--tab-overflow-pinned-tabs-width) - var(--gap-after-pinned));
	}

	${context} ${_}::after {
		width: calc(var(--post-tabs-items-width) - var(--tabs-scrollbar-width));
	}

	${_=".tabs-placeholder"} {
		--clip-shadow: calc(var(--tab-shadow-size) * -1);
		--section-border-width: 0px;
		--section-border-radius: 0px;
		--section-clip: 0px;
		box-sizing: content-box;
		height: calc(var(--tabstrip-min-height) - var(--section-border-width) * 2);
		position: absolute;
		z-index: calc(var(--tabs-moving-max-z-index) + 2);
		box-shadow: var(--tabs-placeholder-shadow);
		border: var(--tabs-placeholder-border);
		overflow: clip;
		backdrop-filter: var(--tabs-placeholder-backdrop);
		transition: var(--tabs-item-opacity-transition);
		transition-property: box-shadow, backdrop-filter, border-color, opacity;
	}

	[tabs-scrolledtostart] ${_}[position=top] {
		pointer-events: none;
	}

	${win7 || win8 ? /*css*/`
		:root[${CUSTOM_TITLEBAR}] ${hiddenMenubar} ~ #TabsToolbar
			:is(
				#TabsToolbar:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs,
				#tabs-placeholder-post-tabs
			)
		{
			height: calc(var(--tabstrip-min-height) + var(--tabs-padding-top) + var(--nav-toolbox-padding-top));
			margin-top: calc((var(--tabs-padding-top) + var(--nav-toolbox-padding-top)) * -1);
		}
	` : ``}

	${prefs.floatingBackdropOpacity && !prefs.floatingBackdropClip ? /*css*/`
		${_}::before {
			--controlbox-clip-path: none;
			content: "";
			width: 100%;
			height: 100%;
			opacity: ${prefs.floatingBackdropOpacity / 100};
			transition:
				background-color var(--inactive-window-transition, 0s),
				opacity var(--inactive-window-transition, var(--tabs-item-opacity-transition));

			${toolbarBackgroundStyle}
			${nova && defaultTheme && prefs.tabsAtBottom < 0 ? `
				--chrome-block-background-image: none;
			` : ``}
			background-color: var(--tabs-placeholder-background-color);
		}

		@media (forced-colors) {
			${_}::before {
				opacity: 1;
			}
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

	${_="#tabs-placeholder-pre-tabs"} {
		--clip-end: var(--clip-shadow);
		inset-inline-start: 0;
		width: var(--pre-tabs-items-width);
		padding-inline-end: var(--tabstrip-padding);
		/*by default, the margin end will be -1 to cancel out the border*/
		margin-inline-end: calc(var(--tabstrip-padding) + var(--tabstrip-border-width) - var(--tabs-placeholder-border-width));
		border-top-width: var(--section-border-width);
		border-inline-start: 0;
		border-color: var(--tabstrip-border-color);
		border-top-color: transparent;
		border-start-end-radius: var(--section-border-radius);
		border-end-end-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(
			var(--section-clip)
			${RTL_UI ? 0 : "var(--clip-end)"}
			var(--clip-shadow)
			${RTL_UI ? "var(--clip-end)" : 0}
		);
	}

	#TabsToolbar:not([pinned-tabs-wraps-placeholder], [tabs-scrolledtostart])
		${_}
	{
		border-color: var(--tabs-placeholder-border-color);
	}

	#TabsToolbar${staticPreTabsPlaceHolder} ${_} {
		--section-border-radius: 0 !important;
		box-shadow: none;
		backdrop-filter: none;
	}

	${_="#tabs-placeholder-post-tabs"} {
		inset-inline-end: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--post-tabs-items-width) - var(--tabs-scrollbar-width) - var(--scrollbar-clip-reserved));
		border-top-width: var(--section-border-width);
		border-inline-end: 0;
		border-start-start-radius: var(--section-border-radius);
		border-end-start-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(
			var(--section-clip)
			${RTL_UI ? "var(--clip-shadow)" : 0}
			var(--clip-shadow)
			${RTL_UI ? 0 : "var(--clip-shadow)"}
		);
	}

	${prefs.hideEmptyPlaceholderWhenScrolling ? /*css*/`
		#TabsToolbar[tabs-no-previous-visible] #tabs-placeholder-pre-tabs,
		#TabsToolbar[tabs-no-next-visible] #tabs-placeholder-post-tabs {
			visibility: hidden;
		}

		#TabsToolbar[tabs-no-previous-visible]:not([has-items-pre-tabs]) #tabs-placeholder-pre-tabs,
		#TabsToolbar[tabs-no-next-visible]:not([has-items-post-tabs]) #tabs-placeholder-post-tabs {
			/*collapse it so that its width is zero since it has a border*/
			visibility: collapse;
		}

		#TabsToolbar[tabs-no-previous-visible]:not([customizing])
			:is(.titlebar-spacer[type=pre-tabs], toolbarspring:not(#tabbrowser-tabs ~ *)),
		#TabsToolbar[tabs-no-next-visible]:not([customizing])
			:is(.titlebar-spacer[type=post-tabs], #tabbrowser-tabs ~ toolbarspring)
		{
			visibility: hidden;
		}
	` : ``}

	${_="#tabs-placeholder-new-tab-button"} {
		--clip-bottom: var(--section-clip);
		bottom: var(--extra-drag-space);
		inset-inline-end: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--new-tab-button-width) - var(--scrollbar-clip-reserved));
		border-inline-end: 0;
		border-bottom-width: var(--section-border-width);
		border-end-start-radius: var(--section-border-radius);
		border-start-start-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(
			var(--clip-shadow)
			${RTL_UI ? "var(--clip-shadow)" : 0}
			var(--section-clip)
			${RTL_UI ? 0 : "var(--clip-shadow)"}
		);
		pointer-events: none;
	}

	:where(#TabsToolbar:not([connected-to-navbar])[has-tabs-navbar-shadow]) ${_} {
		--section-clip: var(--tabs-navbar-shadow-size, 0px);
	}

	/* show the top/bottom border when tabs bar visually connects to above/below */
	${!prefs.floatingBackdropClip ? `
		${prefs.tabsAtBottom < 0 ? (
			nova
				? !novaBlockStyle ? ".tabs-placeholder" : "#dummy:not([id])"
				: `
					${sidebarAtStart ? navToolboxWithSidebar : navToolboxWithAsk}
						#tabs-placeholder-pre-tabs,
					${!sidebarAtStart ? navToolboxWithSidebar : navToolboxWithAsk}
						#tabs-placeholder-post-tabs
				`
		) : `
			${
				prefs.tabsAtBottom
					? nova
						? `:is(
							${prefs.tabsAtBottom > 1 ? `
								:root[lwtheme]:not([inFullscreen]) #TabsToolbar:has(~ #PersonalToolbar:not([collapsed], [collapsed=""])),
							` : ``}
							#TabsToolbar[connected-to-navbar]
						)`
						: ""
					: `:is(
						${!nova && prefs.nativeWindowStyle
							? `:root:not([${CUSTOM_TITLEBAR}], [ai-window]),` : ``}
						${shownMenubar} ~ #TabsToolbar
					)`
			}
				.tabs-placeholder[position=top],
			${
				prefs.tabsAtBottom
					? `:is(
						${prefs.tabsAtBottom == 1 && (!(nova && defaultTheme) || nova && root.hasAttribute("ai-window")) ? `
							:root:not([inFullscreen])
								#TabsToolbar:has(~ #PersonalToolbar:not([collapsed=true], [collapsed=""])),
						` : ``}
						${!nova ? `
							:root:not([${THEME_IMAGE_IN_TOOLBOX}])
								${sidebarAtStart ? navToolboxWithAsk : navToolboxWithSidebar},
							:root[aiwindow-immersive-view],
						` : ""}
						#TabsToolbar:has(
							${nova && defaultTheme && prefs.tabsAtBottom == 1 ?
								`~ #PersonalToolbar[collapsed]` : ``}
							~ #notifications-toolbar notification-message
						)
					)`
					: "#TabsToolbar[connected-to-navbar]"
			}
				#tabs-placeholder-new-tab-button
		`} {
			--section-clip: var(--clip-shadow);
			--section-border-width: var(--tabs-placeholder-border-width);
			--section-border-radius: var(--tabs-placeholder-border-radius);
		}
	` : ``}

	${_="#TabsToolbar"}[tabs-scrolledtostart] #tabs-placeholder-post-tabs,
	${_}[tabs-scrolledtoend] #tabs-placeholder-new-tab-button {
		opacity: 0;
	}

	${_}:not([has-items-pre-tabs]) #tabs-placeholder-pre-tabs,
	${_}:not([has-items-post-tabs]) #tabs-placeholder-post-tabs,
	#tabbrowser-tabs:not([hasadjacentnewtabbutton]) #tabs-placeholder-new-tab-button,
	:is(${_}${hidePlaceHolder}, #tabbrowser-tabs:not([overflow], [positionpinnedtabs]))
		.tabs-placeholder
	{
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

	${maxRows > 1 ? /*css*/`
		@media ${multiRows} {
			${_=adjacentNewTab} {
				position: absolute;
				bottom: 0;
				inset-inline-end: 0;
			}

			#TabsToolbar:not([tabs-hide-placeholder])[tabs-overflow] ${_} {
				inset-inline-end: var(--tabs-scrollbar-width);
			}

			${prefs.tabsUnderControlButtons < 2 ? /*css*/`
				${context=`:is(
					${!prefs.privateBrowsingIconOnNavBar ? `:root:not([privatebrowsingmode=temporary])` : ``}
						#toolbar-menubar:not(${MENUBAR_AUTOHIDE}) ~ #TabsToolbar,
					:root:not([${CUSTOM_TITLEBAR}])
				)`} ${prefs.tabsbarItemsAlign == "end" ? `
					${_}
				` : /*css*/`
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

		${prefs.tabsUnderControlButtons < 2 && prefs.tabsbarItemsAlign == "center" && maxRows > 1 ? /*css*/`
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
			--toolbarbutton-padding-outer: inherit;
			--toolbarbutton-outer-padding: inherit;
			--toolbarbutton-padding-inner: inherit;
			--toolbarbutton-inner-padding: inherit;
			position: static;
			align-self: start;
		}

		${context}${tbDraggingHidePlaceHolder}:is([tabs-scrolledtostart], [tabs-dragging-ext])
			${adjacentNewTab}
		{
			opacity: 1 !important;
		}

		@media ${multiRows} {
			#TabsToolbar[tabs-dragging-ext]:is(
				[has-items-post-tabs]:not([tabs-scrolledtostart]),
				:not([has-items-post-tabs], [tabs-scrolledtoend])
			) ${adjacentNewTab}
				.toolbarbutton-icon
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

		${prefs.floatingBackdropClip ? /*css*/`
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

${prefs.tabsAtBottom && !taskBarTab ? /*css*/`
	#navigator-toolbox {
		${nova ? /*css*/`
			${prefs.tabsAtBottom > 0 ? /*css*/`
				&[tabs-dragging]:not(
					${prefs.tabsAtBottom == 1
						? `:root:not([inFullscreen]) :has(> #PersonalToolbar:not([collapsed])),` : ``}
					:has(> #notifications-toolbar notification-message)
				) {
					overflow: visible !important;

					#TabsToolbar {
						border-end-start-radius: ${__="var(--chrome-block-inner-radius)"};
						border-end-end-radius: ${__};
					}

					#toolbar-menubar,
					#toolbar-menubar[autohide][inactive] ~ #nav-bar {
						border-start-start-radius: ${__};
						border-start-end-radius: ${__};
					}

					${OVERLAY_SCROLLBARS ? /*css*/`
						#tabs-placeholder-new-tab-button {
							border-end-end-radius: ${__};
						}
					` : ``}
				}
			` : /*css*/`
				#tabs-placeholder-pre-tabs {
					border-start-start-radius: ${__="var(--chrome-block-inner-radius)"};
				}

				${OVERLAY_SCROLLBARS ? /*css*/`
					#tabs-placeholder-post-tabs {
						border-start-end-radius: ${__};
					}

					#tabs-placeholder-new-tab-button {
						border-end-end-radius: ${__};
					}
				` : ``}
			`}
		` : `
			border-bottom-color: transparent;
		` }

		&:not([tabs-hidden]) > #nav-bar > .titlebar-buttonbox-container {
			display: flex;
		}

		&[tabs-dragging] ~ #browser {
			pointer-events: none;
		}

		${nova ? /*css*/`
			#nav-bar {
				background: none;
			}
		` : /*css*/`
			& > toolbar:not(#TabsToolbar),
			& ~ #browser {
				background: none;
			}
		`}
	}

	${_="#TabsToolbar"} {
		--inactive-titlebar-opacity: 1;
		order: 1;
		z-index: 1;
		will-change: unset;

		${nova && prefs.tabsAtBottom > 0 ? /*css*/`
			& {
				background-color: var(--toolbar-background-color);
			}

			.tabs-placeholder::before {
				--chrome-block-toolbar-color: var(--toolbar-background-color);
			}

			${prefs.tabsAtBottom > 1 ? /*css*/`
				& ~ #PersonalToolbar {
					border-top: 0;
					border-bottom: 1px solid var(--chrome-content-separator-color);
				}
			` : ``}
		` : ``}
	}

	${prefs.tabsAtBottom == 1 ? /*css*/`
		#PersonalToolbar {
			order: 2;
		}
	` : ``}

	#nav-bar, #PersonalToolbar {
		color: var(--toolbox-text-color, var(--toolbox-textcolor));
	}

	#nav-bar {
		border-top: 0;

		&:-moz-window-inactive {
			color: var(--toolbox-text-color-inactive, var(--toolbox-textcolor-inactive));
		}

		:root[${CUSTOM_TITLEBAR}] & {
			&, #urlbar:popover-open {
				will-change: opacity;
				transition:
					opacity var(--inactive-window-transition) !important;

				&:-moz-window-inactive {
					opacity: var(--inactive-titlebar-opacity);
				}
			}
		}
	}

	#sidebar-main {
		color: var(--toolbox-text-color);
	}

	:root[ai-window][aiwindow-immersive-view] #nav-bar:not(.browser-titlebar) {
		height: auto;
		min-height: 20px;
		visibility: visible;
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

	:root[customtitlebar] #navigator-toolbox:not([tabs-hidden]) #toolbar-menubar${MENUBAR_AUTOHIDE} {
		min-height: calc(var(--urlbar-min-height) + 2 * var(--urlbar-padding-block));
	}

	${prefs.tabsAtBottom < 0 ? /*css*/`
		${_} {
			position: fixed;
			inset: auto 0 0;

			${nova ? /*css*/`
				& {
					margin: inherit;
					border: inherit;
					border-color: var(--chrome-content-separator-color);
					border-radius: inherit;
				}

				&, .tabs-placeholder::before {
					--chrome-block-toolbar-color: var(--toolbar-background-color);
					--chrome-block-foreground-color: transparent;
				}

				:root[ai-window] & {
					border-color: transparent;
				}

				${!prefs.autoCollapse ? /*css*/`
					:root:not([inFullscreen]) &:not([tabs-dragging]) {
						overflow: hidden;
					}
				` : ``}

				&::before {
					content: "";
					inset: calc(-1px - var(--chrome-window-gap));
					position: absolute;
				}
			` : ``}

			.urlbar {
				translate: 0;
				display: flex;
				flex-direction: column-reverse;

				.urlbar-input-container {
					min-height: var(--urlbar-height);
				}

				&[open] {
					translate: 0 calc(var(--urlbar-container-height) - 100%);

					${nova ? /*css*/`
						& {
							margin-top: calc(var(--urlbar-margin-block-start-breakout) * -1);
						}

						.urlbarView-results {
							padding-block: 0 var(--urlbarView-padding);
						}
					` : /*css*/`
						.urlbar-input-container {
							min-height: var(--urlbar-container-height);
						}
					`}
				}
			}
		}

		${nova ? /*css*/`
			:root[lwtheme] #PersonalToolbar {
				background: none;
				border-top: 0;
			}
		` : ``}

		${(
			bgImgAllRepeat &&
			!(
				BACKGROUND_ON_BODY &&
				!isYAlign &&
				(nova || prefs.nativeWindowStyle)
			)
		) ? /*css*/`
			${BACKGROUND_ON_BODY && !isYAlign && !nova
				? `#navigator-toolbox:not(${navToolboxWithSidebar}),` : ``}
			:root${BACKGROUND_ON_BODY ? `[${THEME_IMAGE_IN_TOOLBOX}]` : ""}
			{
				${_}, .tabs-placeholder::before {
					background-position-y: bottom !important;
				}
			}
		` : ``}

		#browser, #customization-container {
			--margin-bottom-adjustment: ${nova
				? `calc(var(--chrome-window-gap, 0px) * 2 - ${borderSnapping("2px")})`
				: "0px"};

			${prefs.autoCollapse ? /*css*/`
				margin-bottom: calc(var(--tabstrip-min-height) + var(--margin-bottom-adjustment));
			` : /*css*/`
				margin-bottom: calc(var(--tabstrip-min-height) * var(--tab-rows) + var(--margin-bottom-adjustment));

				:root[animating-tabs-slot-size] & {
					margin-bottom: calc(
						min(
							var(--tabs-slot-animate-height),
							var(--tabstrip-min-height) * var(--max-tab-rows)
						)
						+ var(--margin-bottom-adjustment)
					);
					transition: var(--tab-animation) margin-bottom;
				}
			`}
		}

		@media -moz-pref("browser.fullscreen.autohide") {
			:root[inFullscreen]:not([animating-tabs-slot-size]) {
				#navigator-toolbox {
					z-index: calc(1/0);
				}

				#TabsToolbar {
					clip-path: inset(
						calc(100% - var(--height, 100% - var(--chrome-window-gap, 0px)))
						${__="calc(var(--chrome-window-gap, 0px) * -1)"}
						${__}
						${__}
					);
				}

				&:not(:has(
					#TabsToolbar:is(:hover, :focus-within),
					#TabsToolbar-customization-target
						:is(toolbarbutton, moz-button)[open],
					menupopup[anchor-to-tabsbar],
					:is(${TABS_RELATED_PANELS})[panelopen]
				)) {
					--tabs-under-content-hiding-transition: 0s .4s;

					#TabsToolbar {
						--height: 1px;
						filter: opacity(0);
						transition: var(--tabs-under-content-hiding-transition);
						transition-property: clip-path, filter;

						[breakout] {
							visibility: hidden;

							:root:not([entering-fullscreen]) & {
								transition: visibility var(--tabs-under-content-hiding-transition);
							}
						}
					}

					#browser, #customization-container {
						margin-bottom: 0;

						/*workaround with a bug that the transition applied*/
						:root:not([entering-fullscreen]) & {
							transition: margin-bottom var(--tabs-under-content-hiding-transition);
						}
					}
				}
			}
		}

		:root:not([inDOMFullscreen]) .browserContainer {
			@media -moz-pref("sidebar.revamp") and -moz-pref("sidebar.revamp.round-content-area") {
				#tabbrowser-tabbox[sidebar-shown] & {
					border-end-${sidebarAtStart ? "start" : "end"}-radius: var(--border-radius-medium);
				}
			}

			:root[ai-window] & {
				border-radius: var(--border-radius-medium);
			}
		}
	` : nova ? /*css*/`
		#nav-bar {
			&, &::after {
				border-bottom: .01px var(--tabs-navbar-separator-style) transparent;
			}

			&::after {
				content: "";
				position: absolute;
				inset: 100% 0 0;
				border-color: var(--tabs-navbar-separator-color);
				background-color: var(--toolbar-background-color);
			}
		}
	` : ``}
` : ``}

${prefs.nativeWindowStyle ? /*css*/`
	:root:not([ai-window]) {
		--original-tabs-navbar-separator-color: var(--tabs-navbar-separator-color);
		outline-color: var(--background-color-canvas, -moz-dialog);

		&:-moz-window-inactive {
			--original-toolbox-background-color: var(--toolbox-background-color-inactive, var(--toolbox-bgcolor-inactive));
		}

		body {
			--toolbox-background-color: transparent;
			--toolbox-background-color-inactive: transparent;
			--toolbar-background-color: transparent;
			--toolbox-bgcolor: transparent;
			--toolbox-bgcolor-inactive: transparent;
			--toolbar-bgcolor: transparent;
			--tabs-navbar-separator-color: color-mix(
				in srgb,
				var(--original-tabs-navbar-separator-color)
					${prefs.nativeWindowStyleToolbarColorOpacity}%,
				transparent
			);
		}

		${!nova && prefs.tabsAtBottom ? "#navigator-toolbox," : ""}
		${nova && prefs.tabsAtBottom ? "#TabsToolbar," : ""}
		${!nova && micaTheme ? ".tabs-placeholder::before," : ""}
		#tabbrowser-arrowscrollbox,
		#browser,
		.browser-toolbar:not(.browser-titlebar),
		#nav-bar::after {
			--toolbar-background-color: ${__ = `color-mix(
				in srgb,
				var(--original-toolbar-background-color)
					${prefs.nativeWindowStyleToolbarColorOpacity}%,
				transparent
			)`};
			--toolbar-bgcolor: ${__};
		}

		${!nova && !prefs.tabsAtBottom ? /*css*/`
			@media -moz-pref("sidebar.revamp") {
				#navigator-toolbox {
					border-bottom-color: ${__};
				}
			}
		` : ``}

		.urlbar:not([focused], [open]) .urlbar-background,
		#urlbar-background,
		#searchbar {
			background-color: color-mix(
				in srgb,
				var(--urlbar-background-background-color, var(--toolbar-field-background-color))
					${prefs.nativeWindowStyleURLBarColorOpacity}%,
				transparent
			);
		}

		&,
		${!nova ? `#navigator-toolbox,` : ``}
		${!BACKGROUND_ON_BODY ? `#browser, #TabsToolbar,` : ``}
		body {
			background-color: transparent !important;
		}

		${micaTheme && prefs.tabsAtBottom ? /*css*/`
			#TabsToolbar {
				&, &:-moz-window-inactive {
					--tabs-placeholder-background-color: var(--mica-background-color);
				}
			}
		` : ``}

		${BACKGROUND_ON_BODY && !(nova && defaultTheme) ? /*css*/`
			&:not([ai-window], [${THEME_IMAGE_IN_TOOLBOX}]) #TabsToolbar {
				${nova && prefs.tabsAtBottom < 0 ? `
					--chrome-block-background-image: none;
					background-color: transparent;
				` : !nova || (!defaultTheme && !prefs.tabsAtBottom) ? `
					background: none;

					${micaTheme ? `
						.tabs-placeholder::before {
							background-color: var(--mica-background-color);
						}
					` : ``}
				` : ``}
			}
		` : ``}
	}
` : ``}

${BACKGROUND_ON_BODY
	? `
		#main-window[lwtheme]:not([${THEME_IMAGE_IN_TOOLBOX}], [ai-window]) body,
		:root[${THEME_IMAGE_IN_TOOLBOX}] #navigator-toolbox
		`
	: `:root[lwtheme] ${"#navigator-toolbox".repeat(win7 || win8 ? 3 : 1)}`}
{
	${themeBackgroundStyle}
}

${appVersion < 121 ? /*css*/`
	:root[lwtheme-image] :is(
		#firefox-view-button > .toolbarbutton-icon,
		.tab-background
	) {
		--lwt-header-image: none !important;
	}
` : ``}

${!prefs.previewPanelNoteEditable ? /*css*/`
	.tab-preview-add-note {
		display: none !important;
	}
` : ``}

:root[multitabrows-applying-style] {
	--tab-animation: 0s;
	--inactive-window-transition: 0s;
	--tabs-item-opacity-transition: 0s;
}

${debug && debug < 3 && debug > 0 ? /*css*/`
	${_="#tabbrowser-tabs"} {
		background: rgba(0,255,255,.2);
		box-shadow: 0 -5px rgba(0,255,0,.5);
	}
	${_}:hover {
		clip-path: none !important;
	}
	${_ = `${"#tabbrowser-arrowscrollbox".repeat(3)}
			:is(
				.tabbrowser-tab, .tab-group-label-container,
				.tab-group-overflow-count-container, tab-split-view-wrapper
			)`}[style*=min-width] {
		background: rgba(0,255,0,.2) !important;
	}
	${_}:is([style*=max-width], [size-locked]) {
		background: rgba(255,0,0,.2) !important;
	}
	${_}:not(tab-split-view-wrapper, tab-split-view-wrapper > tab)[elementIndex]::before {
		content: attr(elementIndex) !important;
		height: .001px;
	}
	${_}:is(tab-split-view-wrapper)[elementIndex]::after {
		content: attr(elementIndex) !important;
	}
	${!prefs.pinnedTabsFlexWidth ? /*css*/`
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
		box-shadow: 0 0 0 1px red;
	}
	.closing-tabs-spacer {
		outline: 5px solid orangered;
		background: rgba(255, 255, 0, .5);
		height: var(--tabstrip-min-height);
	}
	${_="#tabbrowser-arrowscrollbox"}::part(items-wrapper)::before,
	${_}::part(items-wrapper)::after {
		background: rgba(0, 255, 0, .5);
		align-self: stretch;
	}

	${_}::part(scrollbutton-up)::before,
	${_}::part(scrollbutton-down)::before {
		background: rgba(255, 123, 0, .5);
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
${debug < 0 ? /*css*/`
	:root:root:is([builtintheme], :not([lwtheme])) {
		--toolbox-background-gradient: linear-gradient(
			135deg,
			green 10%, red 0,
			red 80%, green 0,
			green 93%, red 0
		);
		${debug < -1 ? `
			--toolbox-background-gradient: linear-gradient(
				90deg,
				green 5%, red 0,
				red 30%, green 0,
				green 98%, red 0
			);
		` : ``}
		#nav-bar {
			background: none !important;
		}
	}
` : ``}
${debug > 1 ? /*css*/`
	:root {
		--inactive-window-transition: 2s ease;
	}
	#TabsToolbar {
		--tabs-item-opacity-transition: 1s ease;
	}

	${debug == 2 ? /*css*/`
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
			top: min(max(var(--drag-y, 0px) - var(--tabstrip-min-height) / 2, 0px), 100vh);
			height: var(--tabstrip-min-height);
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

{
	const navBarCS = getComputedStyle($("#nav-bar"));
	//115
	const hasShadow =
		root.hasAttribute("lwtheme") &&
		parseFloat(navBarCS.getPropertyValue("--tabs-navbar-shadow-size")) &&
		getColor(navBarCS, "--lwt-tabs-border-color")?.a != 0;
	tabsBar.toggleAttribute(
		"connected-to-navbar",
		(
			!hasShadow &&
			(
				navBarCS.getPropertyValue("--tabs-navbar-separator-style") == "none" ||
				!getColor(navBarCS, "--tabs-navbar-separator-color")?.a
			) &&
			!getColor(navBarCS, ["--toolbar-background-color", "--toolbar-bgcolor"])?.a
		),
	);
	tabsBar.toggleAttribute("has-tabs-navbar-shadow", hasShadow);
}

dummyElement?.remove();

rAF(2).then(() => root.removeAttribute("multitabrows-applying-style"));
} /* setStyle() */

{
	new ResizeObserver(() => {
		let outer = getRect(gNavToolbox, {box: "margin"});
		let inner = getRect(gNavToolbox, {box: "padding"});
		style(root, {
			"--nav-toolbox-margin-box-height": outer.height + "px",
			"--nav-toolbox-margin-border-block": inner.y - outer.y + "px",
			"--nav-toolbox-margin-border-inline": inner.x - outer.x + "px",
		});
	}).observe(gNavToolbox);

	async function onLwtChange() {
		style(root, {
			"--multirows-background-position": "",
			"--multirows-background-size": "",
			"--original-root-background-color":
				getComputedStyle(root)[prefs.nativeWindowStyle ? "outlineColor" : "backgroundColor"],
		});

		if (!root.matches("[ai-window], [taskbartab]")) {
			let isYAlign;
			let cs = getComputedStyle(
				(
					BACKGROUND_ON_BODY &&
					!root.hasAttribute(THEME_IMAGE_IN_TOOLBOX)
				)
					? document.body : gNavToolbox
			);

			let heights = await Promise.all(
				cs.backgroundImage.split(", ").map(p => {
					let src = p.match(/(?<=url\(").+?(?="\))/);
					return src
						? new Promise(rs => assign(
							new Image(),
							{
								onload: e => rs(e.target.height || 0),
								onerror: () => rs(0),
								src,
							}
						))
						: 0;
				})
			);
			let maxHeight = Math.max(...heights);

			if (maxHeight) {
				style(root, {
					"--multirows-background-size":
						heights.map(h =>
							h
								? `
									auto
									calc(
										max(
											var(--multirows-toolbox-background-height),
											${maxHeight}px
										)
										* ${h / maxHeight}
									)
								`
								: "auto"
						).join(", "),
				});

				let bgPos = cs.backgroundPosition.split(", ").map((s, i) => {
					s = s.split(" ");

					s[0] = `calc(
						${s[0]}
						+ var(--nav-toolbox-margin-border-inline)
							* ${1 - parseFloat(s[0]) / 50}
					)`;

					if (s[1] != "0%") {
						isYAlign = true;
						s[1] = `calc(${
							s[1].replace(/calc\(|\)/g, "")
								.replace(
									/\d+%/g,
									m => `
										(
											var(--nav-toolbox-margin-box-height)
											- var(--nav-toolbox-margin-border-block) * 2
											- max(
												var(--multirows-toolbox-background-height),
												${heights[i]}px
											)
										) * ${parseFloat(m) / 100}
										+ var(--nav-toolbox-margin-border-block)
									`,
								)
						})`;
					} else
						s[1] = `var(--nav-toolbox-margin-border-block)`;

					return s.join(" ");
				});

				if (isYAlign || !BACKGROUND_ON_BODY)
					style(root, {"--multirows-background-position": bgPos.join(", ")});
			}
		}
	}

	addEventListener("windowlwthemeupdate", onLwtChange, true);
	onLwtChange();
}

/** slot **/
{
	slot.part.add("items-wrapper");

	define(slot, {
		heightLocked: () => !!getStyle(arrowScrollbox, "--slot-height"),
	});
}

/** scrollbox **/
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
		style(scrollbar, {
			opacity: 1,
			outline: "transparent solid 1px",
		});
	}, true);

	scrollbox.addEventListener("mouseleave", function(e) {
		if (e.target != this || !scrollbar?.isConnected)
			return;

		style(scrollbar, {opacity: "", outline: ""});
	}, true);

	let ensureSnapDelay = getPref("general.smoothScroll.mouseWheel.durationMaxMS");
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
						getPref("general.smoothScroll.durationToIntervalRatio") * 2,
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
	for (let e of ["overflow", "underflow"])
		scrollbox.addEventListener(e, onFlowChange);

	function onFlowChange(e) {
		if (animatingLayout || e.originalTarget != this || tabContainer._unlockingTabs)
			return;

		console?.time(`scrollbox ${e.type} ${e.detail}`);

		let overflowing = !!this.scrollTopMax;

		delete arrowScrollbox._isScrolling;

		console?.log({type: e.type, overflowing});

		for (let n of $$("#tab-preview-panel, #tabgroup-preview-panel"))
			n[overflowing ? "setAttribute" : "removeAttribute"]("rolluponmousewheel", true);

		console?.timeEnd(`scrollbox ${e.type} ${e.detail}`);

		if (!overflowing)
			for (let tab of gBrowser._removingTabs)
				gBrowser.removeTab(tab);

		if (overflowing != lastLayoutData.overflowing)
			tabContainer.updateLayout();
	}
}

/** arrowScrollbox **/
{
	/*fx 115*/
	arrowScrollbox.style.minWidth = "";
	//reset the cache in case the script is load after the box is overflowed
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
				n.visible &&
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
		let {scrollTop, scrollTopMax} = scrollbox;
		this[!scrollTop ? "setAttribute" : "removeAttribute"]("scrolledtostart", true, true);
		this[scrollTop == scrollTopMax ? "setAttribute" : "removeAttribute"]("scrolledtoend", true, true);
	};

	arrowScrollbox.on_scroll = function(e) {
		if (e.target != scrollbox) return;
		on_scroll.apply(this, arguments);
		let {scrollTop, scrollTopMax, _lastScrollTop} = scrollbox;
		console?.log("scroll", {scrollTop, scrollTopMax, _lastScrollTop});
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

/** workaround with full screen **/
{
	let gNavToolboxResizeObserver = new ResizeObserver(() => {
		if (FullScreen._isChromeCollapsed) {
			gNavToolbox.style.marginTop = -getRect(gNavToolbox).height + "px";
		} else {
			FullScreen.hideNavToolbox();
			FullScreen.showNavToolbox();
		}
	});
	let popuphHandler = function(e) {
		if (prefs.tabsAtBottom < 0 && e.target.tagName == "menupopup")
			e.target.toggleAttribute(
				"anchor-to-tabsbar",
				e.type == "popupshowing" && contains(tabsBar, e.explicitOriginalTarget),
			);
	};
	let {toggle} = FullScreen;
	FullScreen.toggle = function() {
		let on = fullScreen;
		gNavToolboxResizeObserver[on ? "observe" : "unobserve"](tabContainer);
		for (let type of ["popupshowing", "popuphidden"])
			root[on ? "addEventListener" : "removeEventListener"](type, popuphHandler, true);

		if (on) {
			root.setAttribute("entering-fullscreen", "");
			rAF(2).then(() => root.removeAttribute("entering-fullscreen"));
		} else
			//in case something strange has happened
			for (let ele of $$("[anchor-to-tabsbar]"))
				ele.removeAttribute("anchor-to-tabsbar");

		return toggle.apply(this, arguments);
	};
}

/** MozTabSplitViewWrapper **/
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

		_tPos: function() {
			return this.visibleTabs[0]?._tPos;
		},

		stacking: {
			get: function() {
				return this.getAttribute("stacking") || false;
			},
			set: function(v) {
				this[v ? "setAttribute" : "removeAttribute"]("stacking", v);
			},
		},

		visibleTabs: function() {
			return this.tabs.filter(t => t.visible);
		},
	});

	let {
		reverseTabs, replaceTab, unsplitTabs,
	} = splitViewProto;

	assign(splitViewProto, {
		reverseTabs: function() {
			animateLayout(() => reverseTabs.call(this), {nodes: this.tabs});
		},

		replaceTab: function(oldTab) {
			animateLayout(() => {
				replaceTab.apply(this, arguments);
				tabContainer.updateLayout();
				if (animatingLayout) {
					let {rects} = animatingLayout;
					let svR = rects.get(this);
					if (svR) {
						let newSvR = getRect(this);
						for (let t of this.tabs) {
							let r = rects.get(t);
							if (r) {
								r.start -= svR.start - newSvR.start;
								r.y -= svR.y - newSvR.y;
							}
						}
					}
				}
			}, {
				shouldUpdateLayout: false,
				includeNodes: this.tabs.find(t => t != oldTab),
			});
		},

		unsplitTabs: function() {
			animateLayout(() => {
				unsplitTabs.apply(this, arguments);
				this.setAttribute("closing", "");
				tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
			}, {
				includeNodes: this.tabs,
				excludeNodes: this,
			});
		},

		scrollIntoView,
	});
}

/** MozTabbrowserTabGroup **/
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
				let run = () => opd.label.set.call(this, v);
				if (this.isConnected && isCalledBy("#setMlGroupLabel")) {
					if (tabContainer.isFinishingTabMove)
						tabContainer.addEventListener(
							"FinishAnimateTabMove",
							() => animateLayout(run),
							{once: true},
						);
					else
						animateLayout(run);
				} else
					run();
			},
		},

		collapsed: {
			get: opd.collapsed.get,
			set: function(v) {
				if (isCalledBy("[_#]expandGroupOnDrop|startTabDrag"))
					return;

				let dragging = v && isCalledBy("on_dragover");
				let willStack = dragging && tabContainer.tabDragAndDrop.multiselectStacking;

				if (
					!this.isConnected ||
					(
						!!v == this.collapsed &&
						(!willStack || !this.hasActiveTab)
					)
				) {
					opd.collapsed.set.call(this, v);
					return;
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
					excludeNodes:
						dragging && this.labelContainerElement ||
						!v && this.overflowContainer,
					includeNodes: !v && this.nonHiddenTabLikes.filter(t => !t.visible),
				}).then(() => {
					delete this.togglingAnimation;
					this.removeAttribute("toggling");
				});
			},
		},

		visibleNodes: function() {
			return [
				this.labelContainerElement,
				...this.visibleTabLikes,
				...(
					this.isShowingOverflowCount
						? [this.overflowContainer]
						: []
				),
			];
		},

		visibleTabs: function() {
			return this.tabs.filter(t => t.visible);
		},

		nonHiddenTabs: function() {
			return this.tabs.filter(t => !t.hidden);
		},

		visibleTabLikes: function() {
			return this.tabsAndSplitViews.filter(t => t.visible);
		},

		nonHiddenTabLikes: function() {
			return this.tabsAndSplitViews.filter(t => !t.hidden);
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

		tabsAndSplitViews: function() {
			return [...this.children].filter(isTabLike);
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
					? this.nonHiddenTabLikes.filter(t => !t.visible)
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
					if (tabs[0]?.[DOCUMENT_GLOBAL] != window) {
						let oldTabs = this.tabsAndSplitViews;
						tabs[0].container.animateLayout(run);
						return this.tabsAndSplitViews.filter(t => !oldTabs.includes(t));
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
				excludeNodes: this.labelContainerElement,
			}).then(() => delete this.removingAnimation);
		},

		dispatchEvent: function(e) {
			if (e.type == "TabGroupRemoved" && tabContainer.isMovingTab)
				return false;
			return dispatchEvent.apply(this, arguments);
		},

		isTabVisibleInGroup: function(tab) {
			return (
				!this.collapsed ||
				(
					(tab.selected || tab.splitview?.hasActiveTab) &&
					!this.stacked
				)
			);
		},

		refreshState: async function() {
			let {hasActiveTab} = this;
			if (hasActiveTab == null || !this.collapsed) return;

			let isSelectedGroup = gBrowser.selectedTab.group == this;
			if (hasActiveTab || isSelectedGroup) {
				let totalCount = this.nonHiddenTabs.filter(t => !t.closing).length;
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
						let {tabsAndSplitViews, isShowingOverflowCount} = this;
						if (tabsAndSplitViews[0])
							this.appendChild(tabsAndSplitViews.at(-1));
						this.hasActiveTab = isSelectedGroup;
						this.toggleAttribute("hasmultipletabs", hasMultipleTabs);
						this.overflowCountLabel.textContent = overflowCountText;
						if (!isShowingOverflowCount && this.isShowingOverflowCount)
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

/** MozTabbrowserTab **/
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

	define(tabProto, {
		isOpen: function() {
			return this.isConnected && !this.closing && this != FirefoxViewHandler.tab;
		},

		visible: function() {
			return this.isOpen && !this.hidden;
		},
	}, false);

	assign(tabProto, {scrollIntoView});
}

/** TabDragAndDrop **/
let GET_DRAG_TARGET;
{
	let HANDLE;
	if (window.TabDragAndDrop) {
		/*global TabDragAndDrop*/
		let constructorString = TabDragAndDrop.toString().replace(/(^(\s+([gs]et\s+)?)|this.)(#)/mg, "$1_");

		constructorString = constructorString.replace(
			/* _getDragTarget, https://bugzil.la/2007720 */
			/*js*/`target === this._tabbrowserTabs.arrowScrollbox`,
			false,
		).replace(
			/* _getDropIndex, https://bugzil.la/1988159 */
			/*js*/`let item = this._getDragTarget(event);`,
			/*js*/`let item = this._getDragTarget(event);
				if (!item) {
					let overflowContainer = event.target?.closest(".tab-group-overflow-count-container");
					if (overflowContainer)
						return getGroup(overflowContainer).visibleNodes.at(-2).elementIndex + 1;
				}
			`,
		);

		evalInSandbox(
			/*js*/`window.TabDragAndDrop = ${constructorString}`,
			new Cu.Sandbox(window, {sandboxPrototype: window, sameZoneAs: window}),
			{isTab, isTabGroupLabel, isSplitViewWrapper, elementToMove, getGroup},
		);

		assign(TabDragAndDrop.prototype, {
			_updateTabStylesOnDrag: emptyFunc,
			_resetTabsAfterDrop: emptyFunc,
			_moveTogetherSelectedTabs: emptyFunc,
		});

		(tabContainer.tabDragAndDrop = new TabDragAndDrop(tabContainer)).init();

		window.TabStacking &&= TabDragAndDrop;

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
			].forEach(n => exposePrivateMethod(MozTabbrowserTabs, n, {isTab, isTabGroupLabel}));
			tabContainer._rtlMode = RTL_UI;
		}

		HANDLE = "on";
	}

	const dragDropProto = Object.getPrototypeOf(tabContainer.tabDragAndDrop);

	const FINISH_ANIMATE_TAB_MOVE = dragDropProto.finishAnimateTabMove
		? "finishAnimateTabMove"
		: "_finishAnimateTabMove";

	GET_DRAG_TARGET = dragDropProto._getDragTarget
		? "_getDragTarget"
		: "_getDragTargetTab";

	const {
		startTabDrag,
		[`${HANDLE}_dragover`]: handle_dragover,
		[`${HANDLE}_dragend`]: handle_dragend,
		[`${HANDLE}_drop`]: handle_drop,
		[`${HANDLE}_dragleave`]: handle_dragleave,
		[FINISH_ANIMATE_TAB_MOVE]: finishAnimateTabMove,
	} = dragDropProto;

	for (let [pref, prop] of Object.entries(PREFS_TO_PROPS))
		dragDropProto[prop.name] = getPref(pref, prop.default);

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

	dragDropProto.startTabDrag = function(e, tab, opt) {
		console?.time("startTabDrag");
		let draggingTab = isTabLike(tab);
		let {pinned} = tab;
		let {selectedTabs, selectedElements} = gBrowser;
		//in case dragging a tab in split view
		let target = this[GET_DRAG_TARGET](e);
		let scrollPos = scrollbox.scrollTop;

		if (draggingTab) {
			/*https://bugzil.la/2007802*/
			tab = tab.splitview ?? tab;

			//on fx115, ctrl click on another tab and start dragging, the clicked tab won't be [selected],
			//the _dragData is set on it but the data is expected to be bound on [selected] thus things go messed up
			//it is also the fix for https://bugzil.la/1987160
			if (!opt?.fromTabList && !target.selected) {
				tabContainer.selectedItem = target;
				if (
					e.ctrlKey ||
					!e.target.matches?.(".tab-audio-button, .tab-icon-overlay")
				)
					for (let t of [...selectedTabs, target])
						if (t.visible)
							gBrowser.addToMultiSelectedTabs(t);
						else
							gBrowser.removeFromMultiSelectedTabs(t);
				({selectedTabs, selectedElements} = gBrowser);
				if (!selectedTabs[1])
					gBrowser.removeFromMultiSelectedTabs(target);
			}
		}

		let movingTabs = draggingTab && !opt?.fromTabList
			? selectedElements.filter(t => t.pinned == pinned)
			: [tab];

		let stopAnimateTabMove, pauseAnimateTabMove;
		if (!opt?.fromTabList) {
			stopAnimateTabMove = getNodes().length >= prefs.animateTabMoveUnderLimit;
			pauseAnimateTabMove = !stopAnimateTabMove && e.shiftKey && prefs.animateTabMoveShiftKeyToPause;

			if (stopAnimateTabMove || pauseAnimateTabMove)
				//in case opt is null
				opt = assign(opt, {fromTabList: true});
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

		if (prefs.hideDragPreview & (draggingTab ? FOR_TAB : FOR_GROUP)) {
			let dt = e.dataTransfer;
			dt.setDragImage(document.createElement("div"), 0, 0);
			dt.updateDragImage = dt.setDragImage = emptyFunc;
		}

		console?.timeLog("startTabDrag", "init");

		startTabDrag.call(this, e, tab, opt);

		console?.timeLog("startTabDrag", "ori func");

		(draggingTab ? tab : tab.group.labelContainerElement).removeAttribute("dragtarget");

		let {_dragData} = tab;

		//if it is from tab list, there is no mouse down data
		let data =
			tabContainer._lastMouseDownData ||
			//in case the mouse down data is missing
			!opt?.fromTabList && this.createMouseDownData(e, tab);
		assign(_dragData, data);

		assign(_dragData, {
			stopAnimateTabMove,
			pauseAnimateTabMove,
			pinned: !!pinned,
			draggingTab,
			movingTabs,
			scrollPos, //fx115
			movingPositionPinned: pinned && tabContainer.positioningPinnedTabs,
			createGroupDelay: getPref("browser.tabs.dragDrop.createGroup.delayMS"),
		});

		delete tabContainer._lastMouseDownData;
		tabContainer._hideFakeScrollbar();

		//fix the movingTabs as the original is told that there is no multiselect
		if (useCustomGrouping) {
			if (isTab(tab))
				tab.setAttribute("multiselected", true);
			assign(gBrowser, {removeFromMultiSelectedTabs});
		}

		console?.timeEnd("startTabDrag");
	};

	dragDropProto._groupSelectedTabs = function(draggedTab, movingTabs) {
		console?.time("_groupSelectedTabs");

		let {pinned} = draggedTab;
		let {selectedElements, visibleTabs} = gBrowser;
		let pinnedTabs = [], normalTabs = [];

		for (let t of selectedElements)
			(t.pinned ? pinnedTabs : normalTabs).push(t);

		let tasks = [];
		for (let [tabs, centerTab] of [
			[pinnedTabs, pinned ? draggedTab : pinnedTabs.at(-1)],
			[normalTabs, pinned ? normalTabs[0] : draggedTab],
		]) {
			if (!centerTab) continue;

			let targetGroup = centerTab.group;
			let idxOfCenter = tabs.indexOf(centerTab);
			let posOfCenter = pos(centerTab);

			tabs.slice(0, idxOfCenter).reverse().forEach((tab, i, a) => {
				if (pos(tab) != posOfCenter - 1 - i || tab.group != targetGroup)
					tasks.push({dir: "Before", tab, target: a[i - 1] || centerTab});
			});
			tabs.slice(idxOfCenter + 1).forEach((tab, i, a) => {
				if (pos(tab) != posOfCenter + 1 + i || tab.group != targetGroup)
					tasks.push({dir: "After", tab, target: a[i - 1] || centerTab});
			});
		}

		if (tasks[0]) {
			if (
				this.multiselectStacking &&
				(draggedTab == movingTabs[0] || !prefs.dragStackPreceding)
			)
				tabContainer._lockTabSizing(draggedTab);
			animateLayout(() => {
				for (let {dir, tab, target} of tasks)
					gBrowser[`moveTabs` + dir]([tab], target);
			});
		}

		console?.timeEnd("_groupSelectedTabs");

		/**
		 * @param {(MozTabbrowserTab|MozTabSplitViewWrapper)} item
		 */
		function pos(item) {
			return item.elementIndex ?? visibleTabs.indexOf(item);
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
		let {_dragData} = draggedTab || {};
		let sameWindow = draggedTab?.[DOCUMENT_GLOBAL] == window;
		let copy = dt.dropEffect == "copy";

		if (sameWindow && prefs.animateTabMoveShiftKeyToPause && !_dragData.stopAnimateTabMove)
			if (e.shiftKey)
				assign(_dragData, {
					pauseAnimateTabMove: true,
					fromTabList: true,
				});
			else if (_dragData.pauseAnimateTabMove)
				assign(_dragData, {
					pauseAnimateTabMove: false,
					fromTabList: false,
				});

		let animate = sameWindow && !copy && !_dragData.fromTabList;

		tabsBar.toggleAttribute(
			"tabs-dragging-ext",
			!animate && !_dragData?.pauseAnimateTabMove && !_dragData?.stopAnimateTabMove,
		);

		if (!tabContainer.hasAttribute("dragging")) {
			console?.time("on_dragover - setup");
			tabContainer.setAttribute("dragging", "");
			tabsBar.setAttribute("tabs-dragging", "");
			gNavToolbox.setAttribute("tabs-dragging", "");

			tabContainer.lockSlotSize();
			gBrowser.addEventListener("mousemove", tabContainer);
			addEventListener("mouseout", tabContainer);

			arrowScrollbox.lockScroll = true;
			clearTimeout(this._passingByTimeout);
			this._passingByTimeout = setTimeout(() => {
				arrowScrollbox.lockScroll = false;
				let panel = $(":is(#customizationui-widget-panel, #appMenu-popup)[panelopen]");
				if (
					panel &&
					isOverlapping(
						getRect(panel),
						getRect(tabContainer, {box: "content"}),
					)
				)
					panel.hidePopup();
			}, tabContainer._dragOverDelay || getPref("browser.tabs.dragDrop.selectTab.delayMS", 350));
			fakeScrollbar.scrollTop = scrollbox.scrollTop;

			//the scrollbar is regenerated when overflow of gNavToolbox is changed
			if (nova)
				style(getScrollbar(fakeScrollbar), {opacity: 1, transition: "none"});

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

		ind.removeAttribute("to-pin");

		let target = this[GET_DRAG_TARGET](e);
		target = target?.splitview ?? target;

		const {isMovingTab} = tabContainer;
		const allowToPin = this._dragToPinEnabled && _dragData?.movingTabs.some(isTab);
		const updatePinState = sameWindow && !copy &&
			allowToPin && target &&
			draggedTab.pinned != !!target.pinned;
		const allowIndToPin = NATIVE_DRAG_TO_PIN && allowToPin;

		if (updatePinState)
			hidden = false;
		else
			delete _dragData?.newPinState;

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
			else
				this._clearGrouping(_dragData);
			return;
		}

		console?.time("on_dragover - update indicator");

		const numPinned = gBrowser.pinnedTabCount;
		const nodes = getNodes({onlyFocusable: true});
		const firstNonPinned = nodes[numPinned];

		let idx = this._getDropIndex(e);
		let lastNode = nodes.at(-1);
		let lastIdx = indexOf(lastNode);
		let draggingGroup = isTabGroupLabel(draggedTab);

		if (!draggingGroup) {
			let overflowContainer = e.originalTarget?.closest(".tab-group-overflow-count-container");
			if (overflowContainer) {
				target = overflowContainer;
				idx = overflowContainer.getAttribute("elementIndex") - .5;
			}
		}

		console?.debug("drag ind", idx, target);

		if (isMovingTab) {
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
				ind.setAttribute("to-pin", !pinned);
			} else
				delete _dragData.newPinState;
		} else {
			//dragging a group
			if (draggingGroup) {
				//dragging to pinned area
				if (target?.pinned)
					idx = numPinned;
				//dragging to normal area
				else {
					//in case dragging over oveflow container, which target is null
					let group = getGroup(e.originalTarget);
					//handle group over group
					if (group)
						//will drop before
						if (idx <= (group.visibleTabLikes.at(-1) || group.labelElement).elementIndex)
							idx = (target = group.labelElement).elementIndex;
						//will drop after
						else {
							target = group.visibleNodes.at(-1);
							if (isTabGroupOverflowContainer(target))
								idx = +target.getAttribute("elementIndex") + .5;
						}
				}
			}
			//dragging to pin tabs
			else if (
				target?.pinned &&
				(
					//copy as a pinned tab is always disallowed
					copy ||
					//split view cant be pinned
					!sameWindow && _dragData?.movingTabs.every(isSplitViewWrapper)
				)
			)
				idx = numPinned;
			//handle moving tab to the same window
			else if (_dragData?.fromTabList && sameWindow && !copy) {
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
			else if (!sameWindow || copy || !draggedTab) {
				//dragging onto a collapsed active group
				let group = getGroup(target);
				if (
					group?.collapsed &&
					(
						isTabGroupLabelContainer(target) ||
						isTabLike(target) && idx != target.elementIndex
					)
				)
					target = group.visibleNodes.at(-1);
			}

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
			target = lastNode.pinned
				? lastNode
				: getNodes().at(-1); //in case the last one is overflow label

		let groupTarget;

		if (target) {
			let targetRect = getRect(elementToMove(target), {translated: false});
			let boxRect = getRect(arrowScrollbox);
			let dropBefore = idx == indexOf(target);
			let x = +(targetRect[dropBefore ? "start" : "end"] - boxRect.start).toFixed(3);
			let boxHalf = boxRect.height / 2;
			let y = +Math.max(Math.min(targetRect.centerY - boxRect.centerY, boxHalf), -boxHalf).toFixed(3);
			let {style} = ind;
			if (!style.transform) {
				style.transition = "none";
				rAF(2).then(() => style.transition = "");
			}
			style.transform = `translate(calc(${x}px + 50% * ${DIR}), ${y}px)`;

			if (
				sameWindow &&
				!copy &&
				!draggingGroup &&
				target == _dragData.dropElement &&
				this._tabGroupDragToCreate &&
				gBrowser._tabGroupsEnabled &&
				!_dragData.pinned &&
				!target.pinned &&
				(_dragData.stopAnimateTabMove || _dragData.pauseAnimateTabMove)
			) {
				groupTarget = asNode(this[GET_DRAG_TARGET](e, {ignoreSides: true}));
				if (
					!(
						target == groupTarget &&
						isTabLike(target) &&
						!target.group &&
						!_dragData.movingTabs.includes(target)
					) &&
					!(
						isTabGroupLabelContainer(groupTarget) &&
						groupTarget.parentNode.matches("[collapsed]:not([hasactivetab])")
					)
				)
					groupTarget = null;
			}

			assign(_dragData, {
				dropElement: target,
				dropBefore,
			});
		} else
			ind.hidden = true;

		if (groupTarget)
			this._timeGrouping(_dragData, groupTarget);
		else
			this._clearGrouping(_dragData);

		function indexOf(e) {
			return e.elementIndex ?? e._tPos;
		}

		console?.timeEnd("on_dragover - update indicator");
	};

	dragDropProto._animateTabMove = async function(e) {
		const draggedTab = e.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);
		const {_dragData} = draggedTab;

		if (!_dragData || _dragData.isGroupCollapsePending)
			return;

		let {
			pinned, recursion, draggingTab, movingTabs, movingPositionPinned,
			lastX, lastY, oriX, oriY,
		} = _dragData;

		console?.time("_animateTabMove - setup");

		const tabGroupsEnabled = gBrowser._tabGroupsEnabled;
		const dragToGroupTabs = this._tabGroupDragToCreate && tabGroupsEnabled;
		const pinDropInd = draggingTab && !prefs.hidePinnedDropIndicator && movingTabs.some(isTab)
			? this._pinnedDropIndicator
			: null;

		const {x, y} = e;
		const scrollPos = movingPositionPinned ? 0 : scrollbox.scrollTop;

		let groupOfDraggedNode = draggedTab.group;
		let draggedGroup = !draggingTab ? groupOfDraggedNode : null;

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
			//set boxRect before updating nodes
			assign(_dragData, {
				boxRect: getRect(arrowScrollbox),
				lastScrollPos: scrollPos,
				movingNodes,
				draggedNode,
				shouldGroupTogether: draggingTab && movingNodes.some(n => n.group != groupOfDraggedNode),
			});
			if (movingPositionPinned)
				_dragData.scrollPos = 0;

			let moveOverThreshold = tabGroupsEnabled
				? Math.min(1, Math.max(0, getPref("browser.tabs.dragDrop.moveOverThresholdPercent") / 100))
				: .5;
			let groupThreshold = 1 - moveOverThreshold;

			assign(_dragData, {
				numPinned,
				moveOverThreshold,
				groupThreshold,
			});

			console?.log(_dragData);
		}

		let {numPinned, movingNodes, draggedNode} = _dragData;

		if (!tabsBar.hasAttribute("movingtab")) {
			/*used for updateStackingInfo()*/
			assign(this, {_dragData});

			InspectorUtils.addPseudoClassLock(draggedNode, ":hover");
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

			_dragData.groupOfLastAction = groupOfDraggedNode;

			for (let n of
				(_dragData.expandGroupOnDrop || draggedGroup?.hasActiveTab && this.multiselectStacking)
					? [...movingNodes, ...draggedGroup.nonHiddenTabLikes]
					: movingNodes
			)
				n.setAttribute("movetarget", "");

			if (draggedGroup) {
				//in case the group is open after pressing ctrl
				draggedGroup.collapsed = true;
				tabContainer.setAttribute("moving-tabgroup", "");
				gNavToolbox.setAttribute("moving-tabgroup", "");
				draggedGroup.setAttribute("movingtabgroup", "");

				if (draggedGroup.togglingAnimation) {
					_dragData.isGroupCollapsePending = true;
					//wait until the animation started
					console?.timeLog("_animateTabMove - setup", "before rAF");
					await rAF();
					console?.timeLog("_animateTabMove - setup", "after rAF");
					delete _dragData.isGroupCollapsePending;
				}
			}

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
						style(tabContainer, {"--stacking-size": getRect(draggedTab).width + "px"});
						tabContainer.setAttribute("stackingtabs", "");

						/*
						  it's better to not lock when stacking in flow pinned tabs
						  since it looks weird that the tab in next row may sneak in.
						  and currently the placeholder logic on 115 doesn't work with wrapping locked tabs
						*/
						if (
							!pinned ||
							movingPositionPinned ||
							prefs.pinnedTabsFlexWidth ||
							prefs.justifyCenter == 1 && !tabContainer.hasAttribute("multirows") ||
							//may want to ignore the new tabs button if there is only pinned tabs
							getNodes({onlyFocusable: true}).at(-1).pinned
						)
							tabContainer._lockTabSizing(leader, {stacking: true});

						if (stackPreceding)
							precedingTabs.reverse().forEach((t, i) => setStackingVar(t, i, true));
						followingTabs.forEach((t, i) => setStackingVar(t, i, false));

						if (movingPositionPinned)
							tabContainer._positionPinnedTabs();
						tabContainer.updateLayout();

						if (animatingLayout) {
							if (stackPreceding || prefs.justifyCenter > 1) {
								let {rects, newRects} = animatingLayout;
								let oldDraggedR = rects.get(draggedNode);
								let newDraggedR = getRect(draggedNode);
								let stackedR = assign(newDraggedR.clone(), {start: 0, y: 0});
								_dragData.rectsBeforeStacking = new Map(rects);

								for (let n of movingNodes) {
									if (n.stacking == "hidden")
										continue;
									rects.set(n, rects.get(n).relativeTo(oldDraggedR));
									newRects.set(
										n,
										n.stacking || n == draggedNode
											? stackedR
											: getRect(n).relativeTo(newDraggedR),
									);
								}
							}

							animatingLayout.nodes = animatingLayout.nodes.filter(n => n.stacking != "hidden");
						}
					}, {shouldUpdateLayout: false}).then(() => _dragData.stacking = true);

				/**
				 * @param {MozTabbrowserTab} t
				 * @param {number} i
				 * @param {boolean} preceding
				 */
				function setStackingVar(t, i, preceding) {
					let idx = i + 1;
					let opacity = 1 / Math.pow(2, idx);
					if (opacity > .1) {
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

		console?.timeEnd("_animateTabMove - setup");

		if (arrowScrollbox._isScrolling)
			this._clearGrouping(_dragData);
		else {
			_dragData.lastScrollPos = scrollPos;

			if (!_dragData.needsUpdate && x == lastX && y == lastY)
				return;
		}

		if (lastX != null && draggingTab && this._dragToPinEnabled) {
			let dragOverTarget = this[GET_DRAG_TARGET](e);
			if (
				dragOverTarget &&
				!!dragOverTarget.pinned != pinned &&
				!isSplitViewWrapper(draggedTab) //TODO: pin/unpin splitview support?
			)
				return;
		}

		delete _dragData.needsUpdate;

		console?.debug(`_animateTabMove, recursion=${recursion}`, x, y);

		console?.time("_animateTabMove - update dragtarget position");

		let {
			moveForward,
			nodes, nodeRects,
			boxRect,
			moveOverThreshold, groupThreshold,
		} = _dragData;

		let dirX = Math.sign(x - (lastX ?? oriX));

		assign(_dragData, {lastX: x, lastY: y});

		let tranX, tranY, rTranX, rTranY, cursorRow;

		let firstMovingIdx, lastMovingIdx,
			precedingNode, followingNode,
			firstRect, lastRect, draggedRect, firstMovingRect, lastMovingRect;

		let firstRowCantFit;

		let collapsingTabs = draggingTab
			? []
			: draggedGroup.tabsAndSplitViews
				.filter(t => t.hasAttribute("animate-shifting") && !movingNodes.includes(t));

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
						(draggedRect.centerY + tranY + scrollPos + scrollChange - boxRect.y)
						/ tabHeight
					),
					firstRect.row,
				),
				lastRect.row,
			);

			precedingNode = nodes[firstMovingIdx - 1];
			followingNode = nodes[lastMovingIdx + 1];

			let [firstRectInCursorRow, lastRectInCursorRow] = getEdgeRectOfRow(cursorRow);
			let precedingGroup = getGroup(precedingNode);
			let followingGroup = getGroup(followingNode);
			let extraShiftStart = getExtraShiftSpace(true);
			let extraShiftEnd = getExtraShiftSpace(false);
			let firstRowEnd = boxRect.end - (!firstRect.row && lastLayoutData.postTabsItemsSize || 0) * DIR;

			if (
				cursorRow == firstRect.row &&
				pointDelta(
					getMinWidth(draggedNode, draggedRect),
					pointDeltaH(firstRowEnd, firstRect.start),
				) > 0
			) {
				[firstRectInCursorRow, lastRectInCursorRow] = getEdgeRectOfRow(cursorRow += 1);
				rTranY -= Math.min(pointDelta(draggedRect.top + rTranY + scrollChange, firstRect.bottom), 0);
				firstRowCantFit = true;
			}

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

			if (
				cursorRow == lastRect.row - 1 &&
				pointDeltaH(draggedRect.end + rTranX, lastRect.end) > 0
			)
				rTranY -= Math.max(pointDelta(draggedRect.bottom + rTranY + scrollChange, lastRect.y), 0);

			if (
				cursorRow == firstRect.row + 1 &&
				(
					pointDeltaH(draggedRect.start + rTranX, firstRect.start) < 0 ||
					pointDeltaH(draggedRect.end + rTranX, firstRowEnd) > 0
				)
			)
				rTranY -= Math.min(pointDelta(draggedRect.top + rTranY + scrollChange, firstRect.bottom), 0);

			console?.debug("restrict tranY", rTranY - tranY, cursorRow, draggedRect.row, lastMovingRect.row, lastRect.row);

			let movingUp = rTranY + scrollPos < _dragData.scrollPos;
			if (!movingPositionPinned) {
				let p = _dragData.scrollPos;
				tranY -= p;
				rTranY -= p;
			}

			let movingForward = rTranX > 0 != RTL_UI;
			let maxZIndex = 0;
			let stackedIndex = 0;
			let draggedTabZIndex;
			movingNodes.forEach((node, i, a) => {
				let {row} = _dragData.nodeRects.get(node);
				let zIndex =
					2
					+ a.length
					+ (movingForward ? a.length - i : i)
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
				else if (!movingForward && node == draggedGroup?.overflowContainer)
					zIndex = maxZIndex - 1;

				maxZIndex = Math.max(maxZIndex, zIndex);

				let transform = {
					"--translate-x": rTranX + "px",
					"--translate-y": rTranY + "px",
					zIndex,
				};
				style(node, transform);
				if (
					!draggingTab &&
					isTabGroupLabelContainer(node)
				) {
					transform.zIndex = 1;
					for (let t of collapsingTabs)
						style(t, transform);
				}
			});
			style(gNavToolbox, {"--tabs-moving-max-z-index": maxZIndex});

			if (pinDropInd && !numPinned) {
				pinDropInd.toggleAttribute(
					"forFirstRow",
					cursorRow == firstRect.row && !pointDelta(firstRect.y, boxRect.y),
				);
				let r = getRect(pinDropInd, {box: "margin"});
				let interactive = isOverlapping(r, new Rect(x + (RTL_UI ? 1 : 0), y, 1, 1));
				if (!pinDropInd.hasAttribute("visible"))
					if (!interactive && pointDeltaH(rTranX, tranX) < r.width)
						this._clearPinnedDropIndicatorTimer();
					else if (!this._pinnedDropIndicatorTimeout) {
						this._pinnedDropIndicatorTimeout = setTimeout(
							() => pinDropInd.setAttribute("visible", ""),
							getPref("browser.tabs.dragDrop.pinInteractionCue.delayMS", 350),
						);
						this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
					}
				pinDropInd.toggleAttribute("interactive", interactive);
			}

			/**
			 * @param {number} row
			 * @returns {Rect[]}
			 */
			function getEdgeRectOfRow(row) {
				return [
					rects.find(r => r.row == row),
					rects.findLast(r => r.row == row),
				];
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

		if (_dragData.rectsBeforeStacking) {
			let rects = _dragData.rectsBeforeStacking;
			let p = _dragData.atTabXPercent;
			let oldDraggedR = rects.get(draggedNode);
			let newDraggedR = rect(draggedNode);
			let deltaTranX = pointDeltaH(rTranX, tranX);
			let deltaStart = pointDeltaH(oldDraggedR.start, newDraggedR.start + rTranX);
			let deltaEnd = pointDeltaH(oldDraggedR.end, newDraggedR.end + rTranX);
			let deltaY = pointDelta(oldDraggedR.y, newDraggedR.y + rTranY);
			let deltaWidth = newDraggedR.width - oldDraggedR.width;
			let deltaX = deltaEnd > 0 && deltaTranX < 0
				? deltaEnd + deltaWidth
				: (
					deltaStart < 0 && deltaTranX > 0 ||
					(
						prefs.justifyCenter > 1 &&
						(!followingNode || pointDelta(rect(followingNode).y, newDraggedR.y)) &&
						(!precedingNode || pointDelta(rect(precedingNode).y, newDraggedR.y))
					)
				)
					? deltaStart
					: deltaWidth * (RTL_UI ? 1 - p : p);
			deltaX *= DIR;
			deltaY = rTranY < tranY && deltaY > 0
				? deltaY - scrollPos : 0;

			if (deltaX || deltaY)
				for (let n of movingNodes)
					if (n.getAttribute("animate-shifting") == "start")
						style(n, {
							"--x": parseFloat(getStyle(n, "--x") || 0) + deltaX + "px",
							"--y": parseFloat(getStyle(n, "--y") || 0) + deltaY + "px",
						});
					else if (n == draggedNode)
						animateShifting(
							n,
							assign(oldDraggedR.clone(), {start: deltaX, y: deltaY}),
							newDraggedR.relativeTo(newDraggedR),
						);

			delete _dragData.rectsBeforeStacking;
		}

		console?.timeEnd("_animateTabMove - update dragtarget position");

		if (arrowScrollbox._isScrolling) {
			_dragData.needsUpdate = true;
			updateRestrictedShfit();
			return;
		}

		console?.time("_animateTabMove - calculate drop postion");

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

		let leaderCenterY = leaderRect.centerY;

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
		} else if (!firstRowCantFit) {
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
				console?.timeEnd("_animateTabMove - calculate drop postion");
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
								moveForward && _dragData.groupOfLastAction == getGroup(t)
							)
						) ||
						(
							prefs.dynamicMoveOverThreshold &&
							(
								pinned ||
								!draggingTab ||
								(
									groupOfDraggedNode &&
									groupOfDraggedNode == getGroup(t) &&
									!(
										!moveForward &&
										_dragData.groupOfLastAction != groupOfDraggedNode &&
										!groupOfDraggedNode.isShowingOverflowCount &&
										groupOfDraggedNode.visibleTabLikes.at(-1) == movingNodes.at(-1)
									)
								) ||
								isTabGroupOverflowContainer(t) ||
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
					getGroup(dropBeforeElement);
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
					/ (
						draggingTab
							? Math.min(r.width, leaderRect.width)
							: r.width
					)
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
						overlapTarget.parentNode.collapsed &&
						groupOfDraggedNode != overlapTarget.parentNode
					)
				) &&
				![arrowScrollbox._scrollButtonUp, arrowScrollbox._scrollButtonDown]
					.includes(e.originalTarget)
			) {
				if (dragToGroupTabs)
					this._timeGrouping(_dragData, overlapTarget);

				if (overlapBefore) {
					dropBefore = false;
					dropElement = dropAfterElement;
				}
			} else {
				this._clearGrouping(_dragData);

				let groupOfPreceding = getGroup(dropAfterElement);
				if (groupOfPreceding?.collapsed == false)
					if (!dropBefore && (overlapAfter || !overlapBefore && !groupOfDraggedNode))
						dropElement = groupOfPreceding;
					else if (
						overlapBefore && groupOfPreceding != getGroup(dropBeforeElement) ||
						!overlapAfter && groupOfDraggedNode == groupOfPreceding
					) {
						dropElement = dropAfterElement;
						dropBefore = false;
					}
			}
		}

		//ignore the cases that won't actually move
		let shouldMove =
			_dragData.shouldGroupTogether ||
			!!(
				dropElement &&
				(
					(
						dropElement != (dropBefore ? followingNode : precedingNode) &&
						dropElement != (dropBefore ? movingNodes.at(-1).nextSibling : movingNodes[0].previousSibling)
					) ||
					(
						draggingTab &&
						(
							overlapBefore && !groupOfDraggedNode && getGroup(precedingNode)?.collapsed == false ||
							overlapAfter && groupOfDraggedNode && groupOfDraggedNode != getGroup(followingNode)
						)
					)
				)
			);
		console?.log({shouldMove, dropBefore, dropElement, overlapBefore, overlapAfter});

		dropElement = this._redirectDropElement({movingNodes, dropElement, dropBefore});

		shouldMove &&= _dragData.dropBefore != dropBefore || _dragData.dropElement != dropElement;
		console?.log({shouldMove, dropBefore, dropElement});
		assign(_dragData, {dropElement, dropBefore, moveForward});

		console?.timeEnd("_animateTabMove - calculate drop postion");

		// if (false)
		if (shouldMove) {
			console?.time("_animateTabMove - move");

			delete _dragData.shouldGroupTogether;

			let oldVisualRects =
				!recursion &&
				new Map(
					[...movingNodes, ...collapsingTabs].map(t => {
						let r = getVisualRect(t);
						r.y += scrollPos;
						return [t, r];
					})
				);

			animateLayout(async () => {
				console?.timeLog("_animateTabMove - move", "gather layout info");

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

				console?.timeLog("_animateTabMove - move", "lock tab sizing");

				gBrowser[dropBefore ? "moveTabsBefore" : "moveTabsAfter"](movingTabs, dropElement);

				console?.timeLog("_animateTabMove - move", "moved");

				groupOfDraggedNode?.refreshState();

				if (
					(rowChange || cursorRow != draggedRect.row) &&
					!_dragData.cursorRowUnlocked &&
					!movingPositionPinned
				) {
					await tabContainer._unlockTabSizing();
					_dragData.cursorRowUnlocked = true;
					delete _dragData.layoutLockedRow;
				}

				tabContainer.updateLayout();
				//the slot may expand due to the rearrangement
				tabContainer.lockSlotSize();

				let oldNodeRects = nodeRects;

				updateNodeRects();

				let newNodeRects = _dragData.nodeRects;

				let oldDraggedR = nodeRects.get(draggedNode);
				let newDraggedR = newNodeRects.get(draggedNode);
				let p = _dragData.atTabXPercent;
				let widthDelta = pointDelta(newDraggedR.width, oldDraggedR.width);

				_dragData.oriX += Math.round(newDraggedR.x - oldDraggedR.x + widthDelta * p);
				_dragData.oriY += Math.round(newDraggedR.y - oldDraggedR.y);

				console?.timeEnd("_animateTabMove - move");

				if (recursion) {
					assign(_dragData, {widthDelta});
					return;
				}

				_dragData.groupOfLastAction = groupOfDraggedNode;

				if (rowChange) {
					console?.time("_animateTabMove - recursion");

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

					console?.timeEnd("_animateTabMove - recursion");
				}

				console?.time("_animateTabMove - update layout after move");

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

					if (collapsingTabs[0]) {
						let labelOldR = oldDraggedR;
						let labelNewR = newDraggedR.clone().collapse().relativeTo(newDraggedR, false);

						let activeTab = movingNodes.find(t => t.selected || t.hasActiveTab) || draggedNode;
						let activeTabOldR = oldNodeRects.get(activeTab);
						let activeTabNewR = newNodeRects.get(activeTab);
						activeTabNewR = activeTabNewR.clone().collapse().relativeTo(activeTabNewR, false);

						for (let t of collapsingTabs) {
							if (!animatingLayout.nodes.includes(t))
								animatingLayout.nodes.push(t);

							let postActive = t._tPos > activeTab._tPos;
							animatingLayout.rects.set(
								t,
								oldVisualRects.get(t).relativeTo(
									postActive
										? activeTabOldR
										: labelOldR
								),
							);
							animatingLayout.newRects.set(
								t,
								postActive
									? activeTabNewR
									: labelNewR,
							);
						}
					}
				}

				console?.timeEnd("_animateTabMove - update layout after move");

				//without this will cause the animating tabs can't apply upcoming animation
				await rAF();
			}, {
				shouldUpdateLayout: false,
				animate: !recursion,
			});
		} else {
			console?.time("_animateTabMove - update layout with no move");
			updateRestrictedShfit();
			console?.timeEnd("_animateTabMove - update layout with no move");
		}

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
				r.row = Math.round(pointDelta(r.y, _dragData.boxRect.y, true) / tabHeight);
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

	dragDropProto._timeGrouping = function(_dragData, target) {
		if (this[DRAG_OVER_GROUPING_TIMER])
			return;

		let overlappingTab = isTabLike(target);
		this[DRAG_OVER_GROUPING_TIMER] = setTimeout(
			() => {
				let args = [overlappingTab ? target : target.parentNode.labelElement];
				if (appVersion > 142) {
					_dragData[
						overlappingTab ? "shouldCreateGroupOnDrop" : "shouldDropIntoCollapsedTabGroup"
					] = true;
					this._setDragOverGroupColor(
						overlappingTab ? _dragData.tabGroupCreationColor : target.parentNode.color
					);
				} else
					args.unshift(_dragData);
				this["_" + TRIGGER_DRAG_OVER_GROUPING](...args);
				for (let t of _dragData.movingTabs)
					asNode(t).setAttribute("dragover-groupSource", "");
			},
			_dragData.createGroupDelay,
		);
	};

	dragDropProto._clearGrouping = function(_dragData) {
		if (!this._tabGroupDragToCreate || !gBrowser._tabGroupsEnabled)
			return;

		tabContainer.removeAttribute(MOVINGTAB_GROUP);
		tabContainer.removeAttribute("movingtab-addToGroup");

		$(
			`[${DRAGOVER_GROUPTARGET}]`,
			arrowScrollbox,
		)
			?.removeAttribute(DRAGOVER_GROUPTARGET);

		for (let t of $$("[dragover-groupSource]", arrowScrollbox))
			t.removeAttribute("dragover-groupSource");

		assign(_dragData, {
			shouldCreateGroupOnDrop: false,
			shouldDropIntoCollapsedTabGroup: false,
		});
		this[CLEAR_DRAG_OVER_GROUPING_TIMER]();
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

	dragDropProto._redirectDropElement = function({movingTabs, dropElement, dropBefore}, event) {
		if (!dropElement)
			return;

		let group = getGroup(dropElement);

		//drag tab out of the current group
		if (
			!dropBefore &&
			dropElement == group?.visibleTabLikes.at(-1) &&
			(
				dropElement == movingTabs?.at(-1) ||
				event && !this[GET_DRAG_TARGET](event)
			) &&
			!group.isShowingOverflowCount
		)
			return group;

		if (dropElement.closest(".tab-group-label-container"))
			return dropBefore || group.collapsed && !group.hasActiveTab
				? group
				: $("slot", group);

		if (!dropBefore && isTabGroupOverflowContainer(dropElement))
			return dropElement.parentNode;

		return dropElement;
	};

	dragDropProto[`${HANDLE}_dragleave`] = function(e) {
		handle_dragleave.apply(this, arguments);

		let target = e.relatedTarget;
		while (target && target != tabContainer)
			target = target.parentNode;
		if (!target)
			this._postDraggingCleanup();
	};

	dragDropProto[`${HANDLE}_dragend`] = function() {
		handle_dragend.apply(this, arguments);
		this._postDraggingCleanup();
	};

	dragDropProto[`${HANDLE}_drop`] = function(event) {
		let dt = event.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let sameWindow = draggedTab?.[DOCUMENT_GLOBAL] == window;
		let {_dragData} = draggedTab || {};
		let useIndicatorToMove = _dragData?.fromTabList;
		let stopAnimateTabMove = _dragData?.stopAnimateTabMove || _dragData?.pauseAnimateTabMove;
		let moveTabTo;
		if (_dragData) {
			let {dropElement} = _dragData;
			if (_dragData.shouldDropIntoCollapsedTabGroup) {
				if (_dragData.dropElement.tagName == "tab-group")
					_dragData.dropElement = dropElement.labelElement;
			} else if (useIndicatorToMove)
				assign(_dragData, {
					fromTabList: false,
					dropElement: this._redirectDropElement(_dragData, event),
					//for fx 115
					animDropIndex:
						(dropElement.elementIndex ?? dropElement._tPos)
						+ (_dragData.dropBefore ? 0 : 1),
				});
			else if (!_dragData.shouldCreateGroupOnDrop)
				delete _dragData.dropElement;

			if (useIndicatorToMove) {
				if (
					sameWindow &&
					dt.dropEffect == "move" &&
					_dragData.movingTabs.includes(_dragData.dropElement)
				) {
					({moveTabTo} = gBrowser);
					gBrowser.moveTabTo = emptyFunc;
				}
			} else if (this._pinnedDropIndicator?.matches("[visible][interactive]")) {
				_dragData.newPinState = true;
				this._pinnedDropIndicator.removeAttribute("visible");
			}
		}

		let run = () => {
			let groupOfDraggedTab = draggedTab.group;

			handle_drop.apply(this, arguments);

			if (
				(stopAnimateTabMove || dt.dropEffect == "copy") &&
				!tabContainer.suggestToLockSlot
			)
				tabContainer._unlockTabSizing({unlockSlot: true});

			if (groupOfDraggedTab?.collapsed && draggedTab.group != groupOfDraggedTab)
				groupOfDraggedTab.refreshState();
		};
		//tabs may be dragged into a collapsed group
		let param = {includeNodes: _dragData?.movingTabs.filter(isTabLike)};

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
				this._dragToPinEnabled &&
				_dragData.draggingTab &&
				!_dragData.pinned &&
				this[GET_DRAG_TARGET](event)?.pinned
			)
		) {
			if (_dragData.shouldDropIntoCollapsedTabGroup)
				animateLayout(async () => {
					await run();
					let {group} = draggedTab;
					if (group?.isShowingOverflowCount)
						return group.overflowContainer;
				});
			else {
				if (_dragData.shouldCreateGroupOnDrop)
					animateLayout(
						async () => {
							tabContainer.isFinishingTabMove = true;
							await run();
							return draggedTab.group?.labelContainerElement;
						},
						param,
					).then(() => {
						tabContainer.isFinishingTabMove = false;
						tabContainer.dispatchEvent(new Event("FinishAnimateTabMove"));
					});
				else
					animateLayout(run, param);
			}
		} else if (useIndicatorToMove)
			animateLayout(run, param);
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
		//thus check the [movingtab] of tabs bar instead to identify whether the animate has performed
		let finishing = tabContainer.isFinishingTabMove;
		let movingTabGroup = !finishing && tabContainer.hasAttribute("moving-tabgroup");
		//the dragover would not be triggered and marked as moving when dragging out of the window so fast
		let moving = movingTabGroup || !finishing && tabsBar.hasAttribute("movingtab");

		let _dragData, rectsBeforeDrop, draggedGroup;
		let {selectedNode, tabGroups} = gBrowser;
		if (moving) {
			if (movingTabGroup) {
				draggedGroup = tabGroups.find(g => g.isBeingDragged);
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

				if (this._tabGroupDragToCreate && gBrowser._tabGroupsEnabled)
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
								await refreshGroups();
								tabContainer.updateLayout();
								await rAF();
							},
							{
								translated: true,
								shouldUpdateLayout: false,
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
							delete tabContainer._keepTabSizeLocked;
							tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
							let {group} = movingNodes[0];
							if (
								_dragData.shouldDropIntoCollapsedTabGroup &&
								group.isShowingOverflowCount
							)
								return group.overflowContainer;
							if (_dragData.shouldCreateGroupOnDrop)
								return group.labelContainerElement;
						}, {
							nodes: [...rectsBeforeDrop.keys()],
							rects: rectsBeforeDrop,
						});
					} else {
						await rAF();
						await Promise.all(movingNodes.map(waitForAnimate));
						await Promise.all([
							...movingNodes.map(
								gReduceMotion
									? n => style(n, noTransform)
									: async n => {
										n.setAttribute("animate-shifting", "run");
										await rAF();
										style(n, noTransform);
										await waitForAnimate(n);
									},
							),
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
							} else if (draggedGroup.stacked)
								await animateLayout(() => {
									draggedGroup.stacked = false;
									tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
									if (draggedGroup.isShowingOverflowCount)
										return draggedGroup.overflowContainer;
								}, {
									includeNodes: gBrowser.selectedNode,
								});

							movingNodes[0].scrollIntoView();
						}
					}
				}

				tabContainer.setAttribute("movingtab-finishing", "dropped");

				if (stacking) {
					await defer();
					await animateLayout(() => {
						for (let t of movingNodes)
							t.stacking = false;
						//no need to unlcock tab size since the layout won't change after unstacking
						if (!movingNodes[0].group?.collapsed) {
							delete tabContainer._keepTabSizeLocked;
							tabContainer._unlockTabSizing({unlockSlot: !tabContainer.overflowing});
						}
					});
				}

				await refreshGroups();
				draggedGroup?.removeAttribute("movingtabgroup");
			} finally {
				for (let [node, attrs] of [
					[this._pinnedDropIndicator, ["visible", "interactive"]],
					[tabContainer, [
						"moving-pinned-tab", "moving-positioned-tab", "moving-single-tab",
						"moving-tabgroup", "movingtab-finishing", "stackingtabs",
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

				tabContainer.dispatchEvent(new Event("FinishAnimateTabMove"));
			}
		}

		async function refreshGroups() {
			if (TAB_GROUP_SUPPORT)
				await Promise.all(tabGroups.map(async g => {
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
		this._clearGrouping();
		this._clearPinnedDropIndicatorTimer();
		this._pinnedDropIndicator?.removeAttribute("interactive");

		clearTimeout(this._passingByTimeout);

		this._tabDropIndicator.style.transform = "";

		for (let t of $$("tab-group[collapsed] tab:not([selected])[multiselected]", arrowScrollbox))
			gBrowser.removeFromMultiSelectedTabs(t);

		arrowScrollbox.lockScroll = false;

		for (let [node, attrs] of [
			[tabContainer, ["tabmousedown", "dragging"]],
			[tabsBar, ["tabs-dragging", "tabs-dragging-ext"]],
			[gNavToolbox, ["tabs-dragging"]],
		])
			for (let a of attrs)
				node?.removeAttribute(a);

		//the scrollbar is regenerated when overflow of gNavToolbox is changed
		if (nova)
			rAF().then(async () => {
				let {style} = getScrollbar(scrollbox);
				style.transition = "none";
				await rAF();
				style.transition = "";
			});

		cleanUpDragDebug();
	};
}

/** tabContainer **/
{
	const {
		_updateCloseButtons, _handleTabSelect, _updateNewTabVisibility,
		[ON_UI_DENSITY_CHANGED]: uiDensityChanged,
	} = tabContainer;

	define(tabContainer, {
		overflowing: {get: "overflow"},

		isMovingTab: {get: "movingtab"},

		isFinishingTabMove: "movingtab-finishing",

		positioningPinnedTabs: "positionpinnedtabs",

		hasAdjacentNewTabButton: "hasadjacentnewtabbutton",

		forcedOverflow: {
			get: "forced-overflow",
			set: function(v) {
				v = Math.max(v, 0);
				this.toggleAttribute("forced-overflow", !!v);
				style(this, {"--forced-overflow-adjustment": v ? v + "px" : ""});
			},
		},

		suggestToLockSlot: function() {
			return this.overflowing || prefs.tabsAtBottom < 0;
		},
	}, false);

	tabContainer.switchByScrolling = getPref("toolkit.tabbox.switchByScrolling");
	tabContainer.addEventListener("DOMMouseScroll", function(e) {
		if (this.switchByScrolling)
			e.preventDefault();
	});

	assign(tabContainer, {animateLayout});

	//clear the cache in case the script is loaded with delay
	tabContainer._pinnedTabsLayoutCache = null;

	arrowScrollbox.before(
		...["new-tab-button", "pre-tabs", "post-tabs"].map((n, i) => {
			let ele = tabContainer["_placeholder" + n.replace(/(?:^|-)(\w)/g, (m, w) => w.toUpperCase())] =
				assign(document.createXULElement("hbox"), {
					id: "tabs-placeholder-" + n,
					className: "tabs-placeholder",
				});
			ele.setAttribute("position", i ? "top" : "bottom");
			return ele;
		})
	);
	//sometimes double clicking on the spaces doesn't perform the window maximizing/restoring, don't know why
	$$(".titlebar-spacer, .tabs-placeholder", gNavToolbox).forEach(node => node.addEventListener("dblclick", ondblclick, true));
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
							tabContainer.tabDragAndDrop._dragToPinEnabled &&
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
							tabContainer.tabDragAndDrop._dragToPinEnabled &&
							!tabContainer.isMovingTab &&
							!!node?.closest(`#tabbrowser-arrowscrollbox > :not([pinned])`)
						)
						: contains.apply(this, arguments);
				},
			});
		}
	}

	tabContainer._positionPinnedTabs = function(numPinned, recursion) {
		numPinned ??= gBrowser.pinnedTabCount;
		this.toggleAttribute("haspinnedtabs", numPinned);

		if (
			!numPinned && !this._lastNumPinned ||
			!prefs.positionPinnedTabs && !this.positioningPinnedTabs ||
			!tabHeight ||
			//it seems this checking is no necessary anymore but there's no harm to keep it
			appVersion < 132 && isCalledBy("_initializeArrowScrollbox/<") ||
			appVersion < 141 && isCalledBy("on_(ov|und)erflow")
		)
			return;

		console?.trace();

		console?.time("_positionPinnedTabs - calculation");

		let width, rows, maxRows, columns, spacers, preTabsItemsSize, wrapPlaceholder;
		let gap = prefs.gapAfterPinned;

		let layoutData = this._pinnedTabsLayoutCache;
		let uiDensity = root.getAttribute("uidensity");
		if (!layoutData || layoutData.uiDensity != uiDensity || layoutData.nova != nova)
			layoutData = this._pinnedTabsLayoutCache = {
				nova,
				uiDensity,
				scrollStartOffset: gap,
			};

		let {forcedOverflow} = this;
		let isPositioned = this.positioningPinnedTabs && !forcedOverflow;
		let nodes = getNodes();
		let pinnedTabs = nodes.slice(0, numPinned);
		let lastNode = nodes.at(-1);
		//not using arrowScrollbox.overflowing in case it is not updated in time
		let overflowing = !!scrollbox.scrollTopMax;
		let {_lastScrollTop} = scrollbox;
		let floatPinnedTabs =
			numPinned && nodes.length > numPinned && overflowing &&
			prefs.positionPinnedTabs;
		let {tabsUnderControlButtons} = prefs;
		if (this._isCustomizing)
			tabsUnderControlButtons = 0;

		if (floatPinnedTabs) {
			width = (layoutData.width ||= getRect(nodes[0]).width);
			preTabsItemsSize = getRect(this._placeholderPreTabs, {box: "margin"}).width;
			rows = getRowCount();
			maxRows = maxTabRows();
			if (rows > 1) {
				if (tabsUnderControlButtons > 1) {
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
				if (tabsUnderControlButtons > 1)
					spacers = Math.min(columns, spacers);
			} else {
				columns = numPinned;
				spacers = 0;
			}
			let boxWidth = getRect(this, {box: "padding"}).width;
			floatPinnedTabs = pointDelta(
				(
					columns * width + gap
					+ maxItemWidth
					+ this.newTabButton.clientWidth
					+ (lastLayoutData.postTabsItemsSize ?? scrollbox.scrollbarWidth)
				),
				boxWidth,
			) <= 0;
			wrapPlaceholder = floatPinnedTabs && pointDelta(columns * width + gap, preTabsItemsSize) >= 0;
		}

		console?.timeEnd("_positionPinnedTabs - calculation");

		console?.time("_positionPinnedTabs - update");

		if (this._lastNumPinned != numPinned)
			this._handleTabSelect(true);

		this._lastNumPinned = numPinned;

		if (!isPositioned && floatPinnedTabs)
			//not sure why the !important is required, it is overrided by some unknown rule
			style(slot, {minHeight: tabHeight * (maxRows + 1) + "px !important"});

		this.forcedOverflow = 0;
		this.positioningPinnedTabs = floatPinnedTabs;
		tabsBar.toggleAttribute("positionpinnedtabs", floatPinnedTabs);
		tabsBar.toggleAttribute("pinned-tabs-wraps-placeholder", !!wrapPlaceholder);

		if (floatPinnedTabs) {
			style(this, {"--tab-overflow-pinned-tabs-width": columns * width + "px"});

			if (!isPositioned && !slot.heightLocked) {
				let lastNodeRect = getRect(lastNode);
				let slotRect = getRect(slot, {box: "content"});
				/*
				case 1:
					tabContainer clientWidth 909, 2 pinned tabs, no new tab button, tUCB 0 version of case 2
				case 2:
					outerWidth 1306, 3 buttons pre tabs, 1 button post tabs,
					--pre-tabs-items-width: 160px; --post-tabs-items-width: 218px;
					2 pinned tabs, total 61 tabs, no new tab button, tUCB 2
				case 3:
					outerWidth 1210, pin gap 12, 6 buttons pre tabs, 1 button post tabs,
					tab min width 100, most compact, 7 pinned tabs, tUCB 2, scrollbar overlay
					--pre-tabs-items-width: 218px; --post-tabs-items-width: 198px;
				*/
				if (pointDelta(lastNodeRect.bottom, slotRect.bottom) < 0) {
					let lastRowSize = 0;
					for (let i = nodes.length - 1; i > -1; i--) {
						let r = getRect(nodes[i]);
						if (pointDelta(lastNodeRect.y, r.y))
							break;
						lastRowSize += getMinWidth(nodes[i], r);
					}
					this.forcedOverflow = Math.max(
						this.hasAdjacentNewTabButton ? newTabButtonWidth : 0,
						slotRect.width - lastRowSize + 1,
					);
					//the last tab may be locked in size, which will look weird as it is wrapped alone
					this._setLockedSize(nodes.at(-1));
					arrowScrollbox.instantScroll(_lastScrollTop);
					console?.warn("positionpinnedtabs causes underflow!", {
						numPinned, maxRows, lastRowSize,
						outerWidth, lastLayoutData,
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
				if (!recursion) {
					console?.warn("un-positionpinnedtabs cause overflow!");
					console?.timeEnd("_positionPinnedTabs - update");
					this._positionPinnedTabs(numPinned, true);
					return;
				}
				console?.error("recursion is blocked!!");
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
		style(getScrollbar(fakeScrollbar), {opacity: 1, transition: "none"});
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
		let {heightLocked} = slot;
		if (overflowing)
			this.lockSlotSize();
		style(fakeScrollbar, {"--slot-height": ""});
		this.removeAttribute("tabmousedown");
		if (overflowing && !heightLocked)
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
			!tab.visible ||
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
		if (!animatingLayout?.shouldUpdateLayout && !_closeButtonsUpdatePending && !isCalledBy("handleResize")) {
			_closeButtonsUpdatePending = true;
			rAF(2).then(() => {
				console?.time("_updateCloseButtons");
				let {_tabClipWidth} = this;
				let {_tabNotesEnabled} = gBrowser;
				let minWidth = _tabNotesEnabled ? 124 : 100;
				for (let t of gBrowser.visibleTabs) {
					let {splitview} = t;
					let {width} = windowUtils.getBoundsWithoutFlushing(splitview ?? t);
					if (splitview)
						width /= 2;
					let {pinned} = t;
					t.toggleAttribute("closebutton", !pinned && pointDelta(width, _tabClipWidth) > 0);
					if (appVersion > 136) {
						pinned &&= !prefs.pinnedTabsFlexWidth;
						t.toggleAttribute("mini-button", !pinned && width < minWidth);
						t.audioButton.toggleAttribute("pinned", pinned);
						t.overlayIcon.toggleAttribute("pinned", pinned || width < minWidth);
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
			this.updateLayout();
		}
	}, true);

	let placeholderStyle = document.body.appendChild(document.createElement("style"));

	tabContainer.updateLayout = function() {
		if (animatingLayout?.shouldUpdateLayout)
			return;

		if (!tabMinWidth) {
			this[ON_UI_DENSITY_CHANGED]();
			//uiDensityChanged will call updateLayout thus return now
			return;
		}

		//ensure the elementIndex is set for all tabs
		const nodes = getNodes();
		if (!nodes[0])
			return;

		console?.time("updateLayout");

		const lastNode = nodes.filter(n => !n.stacking).at(-1);
		const onlyUnderflow = prefs.tabsUnderControlButtons < 2;
		let numPinned = gBrowser.pinnedTabCount;

		let tabsRect = getRect(this, {box: "margin"});
		let {scrollbarWidth} = scrollbox;

		if (
			onlyUnderflow && scrollbox.scrollTopMax  ||
			innerWidth < prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery ||
			this._isCustomizing ||
			!prefs.tabsUnderControlButtons
		) {
			placeholderStyle.innerHTML &&= "";
			style(tabsBar, {
				"--pre-tabs-items-width": "",
				"--post-tabs-items-width": "",
			});
			tabsBar.removeAttribute("has-items-pre-tabs");
			tabsBar.removeAttribute("has-items-post-tabs");
			assign(lastLayoutData, {
				preTabsItemsSize: 0,
				postTabsItemsSize: 0,
				tabsStartSeparator: 0,
			});

			this._positionPinnedTabs(numPinned);
		} else {
			let winRect = getRect(root, {box: "margin"});
			let toolbarRect = getRect(tabsBar, {box: "padding"});
			let overflowSize = Math.min(tabsRect.width, 0); //adjustment for extreme cases, e.g. too many buttons in tabs bar
			let preTabsItemsSize = pointDeltaH(tabsRect.start, toolbarRect.start) - overflowSize;
			let postTabsItemsSize = pointDeltaH(toolbarRect.end, tabsRect.end) + overflowSize;
			let winMaxWidth = Math.max(screen.width + outerWidth - innerWidth, innerWidth + maxItemWidth);
			let winMinWidth = parseInt(getComputedStyle(root).minWidth);
			let firstNonStackingMinWidth = getVisualMinWidth(nodes.find(n => !n.stacking));
			let firstUnpinnedMinWidth = getVisualMinWidth(nodes[numPinned]);
			let inlinePreTabCS = getComputedStyle(slot, "::before");
			let tabsStartSeparator = Math.ceil(
				parseFloat(inlinePreTabCS.marginInlineEnd)
				+ parseFloat(inlinePreTabCS.borderInlineEndWidth)
				+ parseFloat(inlinePreTabCS.paddingInlineEnd)
			);

			style(tabsBar, {
				"--pre-tabs-items-width": preTabsItemsSize + "px",
				"--post-tabs-items-width": postTabsItemsSize + "px",
			});
			tabsBar.toggleAttribute("has-items-pre-tabs", preTabsItemsSize);
			//there is an extra padding after tabs for shifting the items to not cover the scrollbar
			tabsBar.toggleAttribute("has-items-post-tabs", pointDelta(postTabsItemsSize, onlyUnderflow ? 0 : scrollbarWidth) > 0);

			assign(lastLayoutData, {preTabsItemsSize, postTabsItemsSize, tabsStartSeparator});

			console?.timeLog("updateLayout", "update pre/post tabs items width");

			if (!this.isMovingTab || this.hasAttribute("moving-positioned-tab"))
				this._positionPinnedTabs(numPinned);

			let {hasAdjacentNewTabButton, positioningPinnedTabs} = this;
			let pinnedWidth = numPinned && !positioningPinnedTabs
				? prefs.pinnedTabsFlexWidth
					? tabMinWidth
					: firstNonStackingMinWidth
				: 0;
			let firstNodeMinWidth = pinnedWidth || firstUnpinnedMinWidth;
			let pinnedGap = prefs.gapAfterPinned;
			let pinnedReservedWidth = positioningPinnedTabs
				? parseFloat(getStyle(this, "--tab-overflow-pinned-tabs-width")) + pinnedGap
				: 0;

			let base =
				Math.max(preTabsItemsSize + tabsStartSeparator, pinnedReservedWidth)
				+ postTabsItemsSize
				+ winRect.width
				- toolbarRect.width;

			console?.timeLog("updateLayout", "gather all info");

			console?.trace();

			const condition = onlyUnderflow ? ":not([overflow])" : "";

			const decimals = -Math.log10(EPSILON);

			let css = [/*css*/`
				${media(0, base + firstNodeMinWidth + (hasAdjacentNewTabButton ? newTabButtonWidth : 0) - EPSILON)} {
					${prefs.floatingBackdropClip ? /*css*/`
						#tabbrowser-tabs${condition} {
							--top-placeholder-clip:
								${START_PC} calc(var(--tabstrip-min-height) + var(--extra-drag-space)),
								calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR}) calc(var(--tabstrip-min-height) + var(--extra-drag-space));
						}

						#tabbrowser-tabs::before {
							--clip-left: 0 !important;
							--clip-right: 0 !important;
						}
					` : ``}

					#TabsToolbar:not([tabs-hide-placeholder]) #tabbrowser-tabs[multirows]${condition}
						#tabbrowser-arrowscrollbox::part(items-wrapper)::before
					{
						width: calc(100% - var(--tabstrip-separator-size)) !important;
						margin-inline-end: 0;
						border-inline-end-width: 0;
						border-radius: 0;
						padding-inline-end: var(--tabstrip-separator-size);
					}

					#tabs-placeholder-pre-tabs {
						--tabstrip-padding: 0px;
						--section-clip: 0px !important;
						--clip-end: 0px;
						width: calc(100vw - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)));
						border-inline-end-width: 0;
						border-radius: 0 !important;
					}

					${!nova && prefs.tabsAtBottom < 0 ? /*css*/`
						:root[ai-window] #navigator-toolbox:has(~ #browser :is(#sidebar-main, #ai-window-box):not([hidden], [collapsed]))
							#tabs-placeholder-pre-tabs
						{
							--section-border-width: var(--tabs-placeholder-border-width);
						}
					` : ``}

					#tabs-placeholder-pre-tabs::before {
						clip-path: var(--controlbox-clip-path);
					}

					${prefs.hideEmptyPlaceholderWhenScrolling ? /*css*/`
						#TabsToolbar[tabs-no-previous-visible] #tabs-placeholder-pre-tabs {
							visibility: visible;
						}
					` : ``}

					#tabs-placeholder-post-tabs,
					#tabbrowser-tabs[multirows]${condition}
						#tabbrowser-arrowscrollbox::part(items-wrapper)::after
					{
						visibility: collapse;
					}

					#tabbrowser-tabs[orient]:is(:not([dragging], [movingtab], [movingtab-finishing]), [moving-positioned-tab])::before {
						${prefs.floatingBackdropClip
							? "top: calc(var(--shift) + var(--tabstrip-min-height));"
							: "display: none !important;"}
					}

					${"#tabbrowser-tabs".repeat(2)}${condition}
						:is(
							:not(tab-split-view-wrapper) > tab,
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

			let containerSelector = `${"#tabbrowser-tabs".repeat(2)}:not([ignore-newtab-btn=singlerow])`;

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
					let i = positioningPinnedTabs ? numPinned : 0;
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

						if (hasAdjacentNewTabButton && idx == lastIdx)
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

				if (hasAdjacentNewTabButton)
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
					if (hasAdjacentNewTabButton)
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
					if (hasAdjacentNewTabButton && pointDelta(base, winMaxWidth) <= 0)
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
		}//end update placeholder

		let {
			slotWidth: prvSlotWidth,
			overflowing: prvOverflowing,
		} = lastLayoutData;

		this._updateState();

		console?.timeEnd("updateLayout");

		if (
			//overflow may fired when moving tab then locking the slot
			lastLayoutData.overflowing && !prvOverflowing && !this.isMovingTab ||
			pointDelta(prvSlotWidth, lastLayoutData.slotWidth)
		)
			this._unlockTabSizing({instant: true});
		else
			requestAnimationFrame(() => this._updateCloseButtons());
	};

	tabContainer._updateState = function() {
		const nodes = getNodes();
		const lastNode = nodes.filter(n => !n.stacking).at(-1);

		let hasControlButtons = isVisible($(".titlebar-buttonbox-container", tabsBar));
		let hasExtraItemsPostSpacer =
			!hasControlButtons &&
			$$(".titlebar-spacer[type=post-tabs] ~ :not(.titlebar-buttonbox-container)", tabsBar)
				.some(isVisible);
		let attrs = new Map([
			[
				"no-scrollbar-gutter",
				!!(
					OVERLAY_SCROLLBARS ||
					hasControlButtons ||
					(
						!hasExtraItemsPostSpacer &&
						(
							$(".titlebar-spacer[type=post-tabs]", tabsBar).clientWidth ||
							$("#TabsToolbar-customization-target > toolbarspring:nth-last-child(1 of :not([hidden]))")
						)
					)
				),
			],
		]);

		for (let dir of ["next", "previous"]) {
			let hasVisible = dir == "next" && (hasControlButtons || hasExtraItemsPostSpacer);

			if (!hasVisible && lastLayoutData[{next: "postTabsItemsSize", previous: "preTabsItemsSize"}[dir]])
				checking: for (let center of [this, this.closest(".toolbar-items")])
					// eslint-disable-next-line no-cond-assign
					for (let item = center; item = item[dir + "Sibling"];)
						if (
							!item.matches(".titlebar-spacer, toolbarspring") &&
							isVisible(item)
						) {
							hasVisible = true;
							break checking;
						}

			attrs.set(`tabs-no-${dir}-visible`, !hasVisible);
		}

		for (let [a, v] of attrs)
			tabsBar.toggleAttribute(a, v);

		$$("[last-inflow-node]", arrowScrollbox).forEach(n => n.removeAttribute("last-inflow-node"));
		lastNode.setAttribute("last-inflow-node", "");

		//don't consider it can overflow if there is only one node,
		//in case the new tab button is wrapped in extreme case and cause overflow
		const overflowing = !!(scrollbox.scrollTopMax && nodes[1]);
		const rowCount = getRowCount();
		const scrollRowCount = Math.min(getRowCount(true), maxTabRows());
		const slotRect = getRect(slot, {box: "content"});
		const tabsRect = getRect(this, {box: "margin"});
		const {scrollbarWidth} = scrollbox;

		style(tabsBar, {"--tabs-scrollbar-width": overflowing ? scrollbarWidth + "px" : ""});

		tabsBar.toggleAttribute("tabs-multirows", rowCount > 1);
		this.toggleAttribute("multirows", rowCount > 1);
		if (scrollRowCount < 2 && this.hasAttribute("temp-open")) {
			this.removeAttribute("temp-open");
			if (!prefs.tabsAtBottom) {
				if (gURLBar.hasAttribute("popover"))
					gURLBar.showPopover();
			}
		}
		this._scrollRows = scrollRowCount;
		style(root, {
			"--tab-rows": rowCount,
			"--tab-scroll-rows": scrollRowCount,
		});

		const toggleAttr = overflowing ? "setAttribute" : "removeAttribute";
		arrowScrollbox[toggleAttr]("overflowing", true, true);
		this[toggleAttr]("overflow", true);

		tabsBar.toggleAttribute("tabs-overflow", overflowing);
		tabsBar.toggleAttribute("tabs-hide-placeholder", overflowing && prefs.tabsUnderControlButtons < 2);

		assign(lastLayoutData, {
			slotWidth: slotRect.width,
			slotHeight: slotRect.height,
			tabsWidth: tabsRect.width,
			tabsHeight: tabsRect.height,
			overflowing,
			rowCount,
		});

		/**
		 * @param {Element} e
		 */
		function isVisible(e) {
			if (!e.clientWidth)
				return false;
			let cs = getComputedStyle(e);
			return (
				cs.visibility != "collapse" &&
				!["fixed", "absolute"].includes(cs.position)
			);
		}
	};

	for (let n of [
		"TabOpen", "TabClose",
		"TabHide", "TabShow",
		"TabGroupCreate",
		"TabGroupExpand", "TabGroupCollapse",
		"TabPinned", "TabUnpinned", "SplitViewRemoved",
	])
		tabContainer.addEventListener(n, updateElementIndex);

	tabContainer.addEventListener("TabGroupUpdate", function(e) {
		this.forcedOverflow = 0;
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
						bypassCache: true,
						includeNodes: [asNode(target), asNode(previousTab)],
					});

				/**
				 * @param {MozTabbrowserTab} to
				 * @param {MozTabbrowserTab} from
				 */
				function select(to, from) {
					for (let [n, v] of [[from, false], [to, true]])
						for (let a of ["visuallyselected", "selected"]) {
							n[v ? "setAttribute" : "removeAttribute"](a, v);
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
		this.forcedOverflow = 0;

		//2 rAFs are required when adding tab and underflow -> overflow
		rAF(2).then(() => this.updateLayout());
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
			prefs.justifyCenter > 1
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
				this.hasAdjacentNewTabButton &&
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
					lastNode = nodes.findLast(n =>
						!tabsOfCollapsingGroup.includes(n) ||
						hasActiveTab && (n.selected || n.hasActiveTab)
					);
				}
			} else if (isClosingTab && actionGroup?.collapsed) {
				actionNode.setAttribute("selected", true);
				actionNode.setAttribute("visuallyselected", true);
				if (actionGroup.nonHiddenTabs.length > 1)
					overflowContainer.style.display = "flex";
			}

			lastNode ||= nodes.at(-1);

			const actionNodeRect = getRect(actionNode);
			//dont use tab.elementIndex since it will access ariaFocusableItems
			//getAttribute() is "" on fx 115 so use || instead of ??
			const closingLastTab =
				isClosingTab &&
				(
					+(actionNode.getAttribute("elementIndex") || actionNode._tPos)
					> +(lastNode.getAttribute("elementIndex") || lastNode._tPos)
				);
			const slotRect = getRect(slot, {box: "content"});
			const atFirstRow = !pointDelta(slotRect.y, actionNodeRect.y + scrollbox.scrollTop);

			const setSpacer = (space, closeLastTab) => {
				if ((space = +space.toFixed(4)) > 0 || closeLastTab && prefs.justifyCenter) {
					this._closingTabsSpacer.style.width = space + "px";
					this.setAttribute("using-closing-tabs-spacer", closeLastTab ? "closing-last-tab" : "");
					if (!closeLastTab)
						this.removeAttribute("ignore-newtab-btn");
					lock = true;
				} else
					this._clearSpacer();
			};

			if (lockLayout) {
				let sizes = new Map();
				let {positioningPinnedTabs} = this;

				for (let n of nodes) {
					if (
						n.closing ||
						n.stacking ||
						positioningPinnedTabs && n.pinned
					)
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
					actionGroup?.collapsed ||
					lastNode?.pinned
				) {
					this._clearSpacer();
					this.removeAttribute("ignore-newtab-btn");
					this.unlockSlotSize();
				} else {
					let space = pointDeltaH(slotRect.end, actionNodeRect.end);
					if (atFirstRow)
						space -= lastLayoutData.postTabsItemsSize || 0;
					if (hasAdjacentNewTab)
						space -= newTabButtonWidth;
					setSpacer(space, true);
				}

				for (let n of nodes)
					this._setLockedSize(n);
			} else {
				let currentRow = new Map();
				let totalMinWidth = 0, totalVisualWidth = 0;
				let rowWidth, remainingSpace, hasPinned, hasNonPinned;
				let selectedNodePinned = selectedNode.pinned;
				let canFitIn = true, visuallyFitIn = true, lockFirstRow = false;
				//the closing tab may have the smallest size
				let unifiedWidth = isClosingTab ? actionNodeRect.width : Infinity;
				let unifiedSplitViewWidth = Infinity;
				let firstNodeRect;

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
							rowWidth = pointDeltaH(
								slotRect.end,
								deltaY
									? r.start
									//in case closing the first tab
									: minPointH(r.start, actionNodeRect.start),
							);
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
							!collapsingGroup &&
							n != selectedNode &&
							n.multiselected &&
							pinned == selectedNodePinned &&
							(prefs.dragStackPreceding || n._tPos > selectedNode._tPos)
						)
					)
						continue;

					firstNodeRect ??= r;

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

				if (this.isMovingTab || this.suggestToLockSlot)
					this.lockSlotSize();

				let ignoreNewTab = false;
				if (visuallyFitIn && hasAdjacentNewTab) {
					totalMinWidth += newTabButtonWidth;
					totalVisualWidth += newTabButtonWidth;
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

				if (visuallyFitIn && atFirstRow && prefs.justifyCenter)
					setSpacer(
						rowWidth
						- totalVisualWidth
						+ (lastLayoutData.preTabsItemsSize + lastLayoutData.tabsStartSeparator || 0)
						- pointDeltaH(
							//in case closing the first tab
							minPointH(firstNodeRect.start, actionNodeRect.start),
							slotRect.start,
						)
						//prevent from wrapping as there may be no room for sub-px adjustment
						- 1/60
					);
				else
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
		style(arrowScrollbox, {
			"--slot-width": scrollbox.clientWidthDouble + "px",
			"--slot-height": getRect(slot).height + "px",
		});
	};

	tabContainer._unlockTabSizing = async function({
		instant,
		unlockSlot = !this.hasAttribute("dragging"),
	} = {}) {
		if (
			this._keepTabSizeLocked ||
			isCalledBy("([_#]expandGroupOnDrop|on_TabGroupCollapse)") ||
			(
				isCalledBy("handleEvent@tabs.js", "*") &&
				$$(`${TABS_RELATED_PANELS}, #tabContextMenu`)
					.some(p => ["open", "hiding"].includes(p.state))
			)
		)
			return;

		console?.trace();

		this._unlockingTabs = true;

		if (unlockSlot) {
			console?.time("_unlockTabSizing - general");

			//the slot can only shrink in height so only handle underflowing
			if (!instant && this.overflowing && !this.matches("[dragging], [tabmousedown]")) {
				let tabsBarPadding = getStyle(tabsBar, "padding-inline-end", true);
				let slotWidth = getStyle(arrowScrollbox, "--slot-width") || getRect(slot).width + "px";

				style(slot, {
					minWidth: slotWidth,
					maxWidth: slotWidth,
				});
				style(scrollbox, {overflowY: "scroll !important"});
				style(this, {"--tabs-scrollbar-width": scrollbarWidth + "px"});
				tabsBar.style.paddingInlineEnd = tabsBarPadding;
			}
			gBrowser.removeEventListener("mousemove", this);
			removeEventListener("mouseout", this);

			console?.timeEnd("_unlockTabSizing - general");

			let unlocking = this.unlockSlotSize(instant);
			if (unlocking)
				await unlocking;
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
				tabsBar.style.paddingInlineEnd = "";
			}
		}, {
			animate: !instant && this._hasTabTempMaxWidth,
		});

		delete this._unlockingTabs;
	};

	tabContainer.unlockSlotSize = function(instant = gReduceMotion) {
		instant ||= !this.suggestToLockSlot;

		let oldHeight;
		if (!instant)
			oldHeight = slot.clientHeight - scrollbox.scrollTopMax + scrollbox.scrollTop;

		style(arrowScrollbox, {"--slot-height": "", "--slot-width": ""});

		if (instant) return;

		let newHeight = slot.clientHeight;
		let delta = pointDelta(oldHeight, newHeight);
		if (delta <= 0) return;

		style(slot, {
			transition: "none !important",
			paddingBottom: delta + "px",
		});
		arrowScrollbox.instantScroll(scrollbox.scrollTop + delta);

		return (async () => {
			await rAF();
			root.setAttribute("animating-tabs-slot-size", "");
			style(root, {"--tabs-slot-animate-height": newHeight + "px"});
			style(slot, {transition: "", paddingBottom: ""});
			// overflow may be triggered and the attribute is set incorrectly during shrinking
			if (prefs.tabsAtBottom < 0 && !this.overflowing) {
				let {on_overflow} = this;
				this.on_overflow = emptyFunc;
				requestAnimationFrame(() => assign(this, {on_overflow}));
			}
			await waitForTransition(slot, "padding-bottom");
			style(root, {"--tabs-slot-animate-height": ""});
			rAF(fullScreen ? 2 : 0).then(() => {
				root.removeAttribute("animating-tabs-slot-size");
			});
			this._handleTabSelect();
		})();
	};

	tabContainer[ON_UI_DENSITY_CHANGED] = function() {
		uiDensityChanged.apply(this, arguments);

		console?.time("uiDensityChanged");

		const HEIGHT_PREF = prefBranchStr + "tabContentHeight";
		style(root, {
			"--tab-min-height": Services.prefs.prefHasUserValue(HEIGHT_PREF)
				? Math.min(Math.max(getPref(HEIGHT_PREF), 16), TAB_CONTENT_HEIGHT[0] * 3) + "px"
				: "",
		});

		let {newTabButton} = this;
		style(newTabButton, {"display": "flex !important"});

		newTabButtonWidth = getRect(newTabButton).width;
		tabHeight = +getRect(gBrowser.selectedNode).height.toFixed(4);

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
		const propToStore = {
			splitViewMinWidth: "strokeWidth",
			maxItemWidth: "strokeDashoffset",
		};
		style(this, {
			[propToStore.splitViewMinWidth]: "var(--tab-split-view-min-width) !important",
			[propToStore.maxItemWidth]: "var(--max-item-width) !important",
			"--calculated-tab-min-width": (tabMinWidth = minWidthPref + extraWidth) + "px",
		});
		let cs = getComputedStyle(this);
		splitViewMinWidth = parseFloat(cs[propToStore.splitViewMinWidth]);
		maxItemWidth = parseFloat(cs[propToStore.maxItemWidth]);
		for (let k of Object.values(propToStore))
			this.style[k] = "";

		console?.timeEnd("uiDensityChanged");

		updateNavToolboxNetHeight();
		this.updateLayout();
	};

	tabContainer._updateNewTabVisibility = function() {
		_updateNewTabVisibility.apply(this, arguments);
		if (!prefs.newTabButtonAfterLastTab)
			this.hasAdjacentNewTabButton = false;
		updatePopupPosition();
	};
}

/** auto collapse **/
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
		if (e.target?.matches?.(`menupopup, panel${prefs.previewPanelNoteEditable ? "" : ":not(#tab-preview-panel)"}`)) {
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
			e.propertyName == "margin-" + (prefs.tabsAtBottom < 0 ? "top" : "bottom")
		) {
			let showing = this.matches(TEMP_SHOW_CONDITIONS);
			this.toggleAttribute("animating-collapse", start);
			if (start == showing) {
				if (!prefs.tabsAtBottom && gURLBar.hasAttribute("popover"))
					gURLBar[(start ? "hide" : "show") + "Popover"]();
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

			if (!start) {
				this._updateState();
				this._handleTabSelect();
			}
		}
	}
}

/** gBrowser **/
{
	define(gBrowser, {
		selectedNode: function() {
			return asNode(this.selectedTab);
		},
		//fix the original one that counts the pinned tabs that moving to new window
		pinnedTabCount: function() {
			let i = 0;
			for (let t of this.visibleTabs) {
				if (!t.pinned)
					return i;
				if (!t.hasAttribute("closing"))
					i++;
			}
			return i;
		},
	});

	define(gBrowser, {
		selectedElements: function() {
			return [...new Set(this.selectedTabs.map(asNode))];
		},
	}, false);

	let {
		addTab, removeTab, pinTab, unpinTab, pinMultiSelectedTabs,
		_updateTabBarForPinnedTabs, createTabsForSessionRestore, addTabGroup,
		replaceTabsWithWindow, replaceGroupWithWindow,
		adoptTabGroup, addTabSplitView,
	} = gBrowser;

	let {moveTabToGroup} = gBrowser;
	if (SPLIT_VIEW_NEED_PATCH)
		gBrowser.moveTabToGroup = function() {
			let {isTab} = this;
			this.isTab = isTabLike;
			moveTabToGroup.apply(this, arguments);
			assign(this, {isTab});
		};

	gBrowser.addTab = function(uri, o) {
		let run = () => addTab.call(this, uri, assign(o, {skipAnimation: true}));
		if (animatingLayout)
			return run();

		let tab;
		try {
			if (isCalledBy("openLinkInSplitView"))
				animateLayout(async () => {
					tab = run();
					if (animatingLayout) {
						await 0;
						let {rects, nodes} = animatingLayout;
						nodes.push(tab);
						rects.set(tab, rects.get(tab.previousSibling).clone().collapse());
					}
				});
			else
				animateLayout(async () => {
					let oldNodes = getNodes({onlyFocusable: true});
					tab = run();
					//handle cases like undo closed tabs and https://bugzil.la/1997096
					await 0;
					return getNodes({onlyFocusable: true}).filter(n => !oldNodes.includes(n));
				});
		} catch(e) {
			window.console.error(e);
		}
		return tab;
	};

	gBrowser.removeTab = function(tab) {
		let {visibleTabs} = this;
		let closingLast, closing, closingLastGrouped;
		if (!visibleTabs[1] && visibleTabs[0] == tab) {
			closingLast = this[CLOSING_THE_ONLY_TAB] = true;
			closingLastGrouped = tab.group?.collapsed;
		}

		if (animatingLayout || !visibleTabs.includes(tab) || gReduceMotion)
			removeTab.apply(this, arguments);
		else {
			let {splitview} = tab;
			let hasPrompted;
			//wait a little to check if the tab still exists, if it does it's probably get prompted
			//the prompt may not show if there has no interaction in page yet but it will still get some delay before closing
			setTimeout(() => hasPrompted = !tab.closing, 10);

			animateLayout(self => {
				let animate = animatingLayout?.action == self;
				removeTab.apply(this, arguments);

				({closing} = tab);

				if (!animate)
					return;

				let {nodes, rects, newRects, tabsRect} = animatingLayout;

				if (!closing || !tab.isConnected) {
					tabContainer.updateLayout();
					if (!closing)
						animatingLayout.cancel = true;
					else if (closingLast) {
						let newTab = gBrowser.visibleTabs[0];
						if (newTab) {
							rects.set(newTab, rects.get(tab));
							nodes.push(newTab);
						}
					}
				} else {
					tab.setAttribute("fadein", true);

					if (animate && hasPrompted)
						for (let [n] of rects)
							rects.set(n, getVisualRect(n));

					tab.setAttribute("closing", "");
					tabContainer._setLockedSize(tab);

					if (splitview && !splitview.visibleTabs[0])
						splitview.setAttribute("closing", "");

					tabContainer.forcedOverflow = 0;

					tabContainer.updateLayout();
				}

				//the closing tab is stuck at the row end
				//and need to be translated manually to make it happen at the right place.
				//currently closing multiple tabs is not handled since the tabs are closed from rear to front
				//and it's unable to know if the tab will be placed at the previous row end
				//if all closing tabs become zero width
				if (animate && !splitview) {
					let newTabsRect = getRect(tabContainer, {box: "content"});

					for (let node of nodes) {
						if (!isTab(node) || !node.closing || !node.isConnected || node._animationTargetingRect)
							continue;
						let oldR = rects.get(node);
						let newR = getRect(node);
						if (pointDelta(oldR.y - tabsRect.y, newR.y - newTabsRect.y)) {
							let nxtNode = nodes.slice(nodes.indexOf(node) + 1).find(n => !n.closing && n.isConnected);
							if (nxtNode)
								newR = getRect(nxtNode);
							if (!nxtNode || !newR.visible || pointDelta(oldR.y - tabsRect.y, newR.y - newTabsRect.y)) {
								newR = oldR.clone();
								newR.start += newTabsRect.start - tabsRect.start;
								newR.y += newTabsRect.y - tabsRect.y;
							}
							newR.width = 0;
							node._animationTargetingRect = newR;
						} else
							newRects.set(node, newR);
					}

					if (tabContainer._hasTabTempMaxWidth) {
						clearTimeout(tabContainer._pauseDraggingTimeout);
						tabContainer.style.MozWindowDragging = "no-drag";
						tabContainer._pauseDraggingTimeout = setTimeout(
							() => tabContainer.style.MozWindowDragging = "",
							1000,
						);
					}

					if (closingLastGrouped)
						return this.selectedNode;
				}
			}, {
				includeNodes: splitview?.tabs,
				excludeNodes: splitview,
				shouldUpdateLayout: false,
			}).then(() => {
				if (!closing)
					return;
				if (closingLastGrouped)
					tab.group?.refreshState();
				tab.removeAttribute("fadein");
				tab.dispatchEvent(assign(new Event("transitionend", {bubbles: true}), {propertyName: "max-width"}));
				console?.debug("removed", tab);
			});
		}

		delete this[CLOSING_THE_ONLY_TAB];
	};

	gBrowser.pinTab = function(tab) {
		if (tab.splitview)
			return;

		let run = () => pinTab.apply(this, arguments);

		/*global FirefoxViewHandler*/
		if (tab.pinned || tab == FirefoxViewHandler.tab)
			return run();

		let pinningMultiTabs = isCalledBy("pinMultiSelectedTabs");
		let onDrop = isCalledBy("on_drop");

		animateLayout(async () => {
			//ensure the tab size is unlocked
			tabContainer._setLockedSize(tab);

			run();
			//pinned tab with a negative margin inline end stack will shrink
			//thus set a min width to prevent
			if (!prefs.pinnedTabsFlexWidth)
				style(tab, {minWidth: getRect(tab).width + "px !important"});

			if (onDrop)
				await 0;
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
				for (let t of tabs)
					this.moveTabTo(t, t._tPos < _tPos ? _tPos - 1 : _tPos + forwardCount++);
			},
		});

	gBrowser.addTabGroup &&= function() {
		let run = () => addTabGroup.apply(this, arguments);
		if (isCalledBy("on_drop"))
			return run();
		let g;
		animateLayout(() => (g = run())?.labelContainerElement);
		return g;
	};

	gBrowser.replaceGroupWithWindow &&= function(group) {
		let w;
		animateLayout(() => {
			for (let t of group.tabsAndSplitViews)
				t.setAttribute("closing", "");
			w = replaceGroupWithWindow.apply(this, arguments);
		});
		//update before the group is actually removed
		group.addEventListener("TabGroupRemoved", () => tabContainer.updateLayout());
		return w;
	};

	gBrowser.replaceTabsWithWindow = function(contextTab) {
		let w;
		let nodes = contextTab.multiselected ? this.selectedElements : [contextTab];
		animateLayout(() => {
			//there's a bug that dragging a split view with pinned tabs out to create a new window
			//may be related to https://bugzil.la/2019479
			if (isSplitViewWrapper(contextTab))
				for (let n of nodes)
					if (n.pinned)
						this.unpinTab(n);

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
		let run = () => {
			r = createTabsForSessionRestore.apply(this, arguments);
			//wait for the follow-ups finished e.g. label update of the active collapsed group
			requestAnimationFrame(() => {
				tabContainer.updateLayout();
				tabContainer._handleTabSelect(true);
			});
		};
		if (animatingLayout)
			run();
		else
			try {
				animatingLayout = {};
				try {
					run();
				} finally {
					animatingLayout = null;
				}
			} catch(e) {
				window.console.error(e);
			}
		return r;
	};

	gBrowser.adoptTabGroup &&= function(group) {
		let g;
		animateLayout(() => {
			let run = () => g = adoptTabGroup.apply(this, arguments);
			if (group[DOCUMENT_GLOBAL] == window)
				run();
			else
				group.labelElement.container.animateLayout(run);
			return g?.visibleNodes;
		});
		return g;
	};

	gBrowser.addTabSplitView &&= function() {
		let sv;
		animateLayout(() => {
			sv = addTabSplitView.apply(this, arguments);
			if (sv)
				tabContainer._unlockTabSizing({instant: true, unlockSlot: false});
		});
		return sv;
	};
}

/** TabContextMenu **/
{
	let {moveTabsToSplitView} = TabContextMenu;

	TabContextMenu.moveTabsToSplitView &&= function() {
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

				tabContainer.updateLayout();

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
		}, {shouldUpdateLayout: false});
	};
}

/** preview panel **/
if (TAB_GROUP_PREVIEW_SUPPORT) {
	tabContainer.ensureTabPreviewPanelLoaded();
	const {tabPanel, tabGroupPanel} = tabContainer.previewPanel;

	if (TAB_NOTE_SUPPORT) {
		tabPanel._prefUseTabNotes;
		const {get} = Object.getOwnPropertyDescriptor(
			tabPanel,
			"_prefUseTabNotes",
		);
		define(tabPanel, {
			_prefUseTabNotes: function() {
				return prefs.previewPanelNoteEditable || isCalledBy("#updatePreview")
					? get.call(this) : false;
			},
		});
	}

	for (let [panel, check] of [
		[
			tabPanel,
			() => prefs.previewPanelNoteEditable && prefs.previewPanelShifted & FOR_TAB,
		],
		[
			tabGroupPanel,
			() => prefs.previewPanelShifted & FOR_GROUP,
		],
	]) {
		const {get} = Object.getOwnPropertyDescriptor(
			Object.getPrototypeOf(panel),
			"popupOptions",
		);
		define(panel, {
			popupOptions: function() {
				let opts = get.call(this);
				if (
					check() &&
					(prefs.previewPanelShiftedAlways || tabContainer.hasAttribute("multirows"))
				)
					opts.position = "bottomcenter topleft";

				return opts;
			},
		});
	}
}

/** gTabsPanel **/
if (TAB_GROUP_SUPPORT) {
	if (gTabsPanel._initialized)
		inject();
	else {
		let {init} = gTabsPanel;
		gTabsPanel.init = function() {
			let r = init.apply(this, arguments);
			inject();
			assign(gTabsPanel, {init});
			return r;
		};
	};

	function inject() {
		for (let panel of [gTabsPanel.groupsPanel, gTabsPanel.showAllGroupsPanel]) {
			let {handleEvent} = panel;
			panel.handleEvent = function(e) {
				let run = () => handleEvent.apply(this, arguments);
				let {tabGroupId, command} = e.target?.dataset || {};
				if (e.type == "command" && command == "allTabsGroupView_restoreGroup")
					animateLayout(() => {
						run();
						return gBrowser.tabGroups.find(g => g.id == tabGroupId)?.visibleNodes;
					});
				else
					run();
			};
		}
	}
}

/** XULPopupElement **/
if ("tabsAtBottom" in prefs) {
	/* global XULPopupElement */
	let panelProto = XULPopupElement.prototype;
	let {openPopup, moveToAnchor} = panelProto;

	panelProto.openPopup = function(anchor, opt, ...args) {
		let {position} = opt || {};
		let newPosition = getPopupPosition(anchor, position);
		if (position != newPosition)
			opt = assign(opt, {position: newPosition});
		return openPopup.call(this, anchor, opt, ...args);
	};

	panelProto.moveToAnchor = function(anchor, position, ...args) {
		return moveToAnchor.call(this, anchor, getPopupPosition(anchor, position), ...args);
	};

	gNavToolbox.addEventListener("aftercustomization", updatePopupPosition);
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
		"ungroupTabsAndSplitViews",
		["duplicateSelectedTabs", 1],
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

$("#saved-tab-group-context-menu_openInThisWindow")?.addEventListener("command", () => {
	animateLayout(async () => {
		let {tabGroups} = gBrowser;
		await rAF();
		return gBrowser.tabGroups.find(g => !tabGroups.includes(g))?.visibleNodes;
	});
}, true);

let tabsResizeObserver = new ResizeObserver(() => {
	if (prefs.autoCollapse)
		tabContainer._handleTabSelect(true);

	arrowScrollbox._updateScrollButtonsDisabledState();

	if (animatingLayout || tabContainer._unlockingTabs || tabContainer.hasAttribute("animating-collapse"))
		return;

	console?.time("tabContainer ResizeObserver");

	let {height: tabsHeight, width: tabsWidth} = getRect(tabContainer, {box: "margin"});
	let {height: slotHeight, width: slotWidth} = getRect(slot, {box: "content"});

	console?.timeEnd("tabContainer ResizeObserver");

	if (
		Object.entries({tabsHeight, tabsWidth, slotWidth, slotHeight})
			.some(([p, v]) => pointDelta(v, lastLayoutData[p]))
	)
		tabContainer.updateLayout();
});

for (let box of [tabContainer, slot])
	tabsResizeObserver.observe(box);

let novaTabsBarResizeObserver = new ResizeObserver(entries => {
	let {height} = entries[0].contentRect;
	if (height != lastLayoutData.tabsBarHeight) {
		updateNovaURLBarPosition({instant: true});
		lastLayoutData.tabsBarHeight = height;
	}
});
if (nova)
	novaTabsBarResizeObserver.observe(tabsBar);

$("#toolbar-menubar").addEventListener("toolbarvisibilitychange", () => {
	onPrefChange(null, null, "menubar-autohide-change");
	rAF().then(updateNavToolboxNetHeight);
	if (prefs.tabsAtBottom)
		updateNavBarOverflow();
}, true);

arrowScrollbox._updateScrollButtonsDisabledState();
if ("hideAllTabs" in prefs)
	toggleAllTabsButton();
tabContainer._updateNewTabVisibility();

if (AI_WINDOW_SUPPORT) {
	if (!AIWindow._ori_updateToolbarButtonPositions)
		evalInSandbox(
			/*js*/`
				AIWindow._ori_updateToolbarButtonPositions = AIWindow._updateToolbarButtonPositions;
				AIWindow._updateToolbarButtonPositions = function(win) {
					this._ori_updateToolbarButtonPositions(...arguments);
					win.dispatchEvent(new win.Event("AIWindowUpdateButtonsPosition"));
				};
			`,
			new Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal()),
			{AIWindow},
		);

	updateAIWindowButtonsPosition();
	addEventListener("AIWindowUpdateButtonsPosition", updateAIWindowButtonsPosition);
}

observeDPRChange(() => style(root, {"--device-pixel-ratio": devicePixelRatio}));

addEventListener("resize", function(e) {
	if (e.target == this) {
		rAF(2).then(() => tabContainer._handleTabSelect(true));
		if (nova && prefs.tabsAtBottom < 0)
			updateNovaURLBarPosition({container: tabsBar, instant: true});
	}
});

/**
 * @param {Object} [param0={}]
 * @param {Element} [param0.container]
 * @param {boolean} [param0.instant]
 */
function updateNovaURLBarPosition({container = gNavToolbox, instant} = {}) {
	if (instant) {
		let {requestAnimationFrame} = window;
		window.requestAnimationFrame = f => f();
		try {
			run();
		} finally {
			assign(window, {requestAnimationFrame});
		}
	} else
		run();

	function run() {
		for (let bar of $$("moz-urlbar", container))
			bar._on_toolbarvisibilitychange?.();
	}
}

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
		let [preTabs, postTabs, newTab] = ["PreTabs", "PostTabs", "NewTabButton"]
			.map(n => getRect(tabContainer["_placeholder" + n], {box: "content", checkVisibility: true}));

		if (
			!(prefs.hideEmptyPlaceholderWhenScrolling && tabsBar.hasAttribute("tabs-no-previous-visible")) &&
			preTabs.width && pointDelta(rect.y, preTabs.bottom) < 0 && pointDeltaH(rect.start, preTabs.end) < 0
		)
			boxRect.y += tabHeight;
		else if (
			!(prefs.hideEmptyPlaceholderWhenScrolling && tabsBar.hasAttribute("tabs-no-next-visible")) &&
			postTabs.width && pointDelta(rect.y, postTabs.bottom) < 0 && pointDeltaH(rect.end, postTabs.start) > 0
		)
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

/** @param {(Element|null)} n */
function getGroup(n) {
	return getRootHost(n)?.closest("tab-group");
}

/**
 * @param {Element|null} c
 * @param {Element|null} e
 */
function contains(c, e) {
	return c?.contains(getRootHost(e));
}

/** @param {(Element|null)} n */
function getRootHost(n) {
	let host;
	// eslint-disable-next-line no-cond-assign
	while (host = n?.getRootNode().host)
		n = host;
	return n;
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
		else if (SPLIT_VIEW_NEED_PATCH)
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
				let idx = nodes.findLastIndex(n => n.parentNode == group);
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

	if (newTabButton && tabContainer.hasAdjacentNewTabButton)
		nodes.push(tabContainer.newTabButton);

	return nodes;
}

function toggleAllTabsButton() {
	$("#alltabs-button").hidden = prefs.hideAllTabs;
}

function updateAIWindowButtonsPosition() {
	if (!AI_WINDOW_SUPPORT) return;

	let aiBtn = $("#ai-window-toggle");
	let menuBtn = $("#PanelUI-button");
	let [nav, tabs] = ["nav-bar", "TabsToolbar"].map(id => $(`#${id} .titlebar-buttonbox-container`));
	if (prefs.tabsAtBottom)
		nav.before(aiBtn, menuBtn);
	else if (AIWindow.isAIWindowActive(window))
		tabs.before(aiBtn, menuBtn);
	else {
		(prefs.smartWindowButtonOnNavBar ? nav : tabs).before(aiBtn);
		(prefs.hamburgerMenuOnTabBar ? tabs : nav).before(menuBtn);
	}
	updateNavBarOverflow();
}

/** @param {boolean} [allRows] */
function getRowCount(allRows) {
	if (!tabHeight && !gNavToolbox.hasAttribute("tabs-hidden"))
		tabContainer[ON_UI_DENSITY_CHANGED]();
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
	let personalbar = $("#PersonalToolbar");
	let countPersonalbar = getPref("browser.toolbars.bookmarks.visibility") != "never";
	let personalbarCollapsed = personalbar.collapsed;

	if (countPersonalbar && personalbarCollapsed) {
		personalbar.style.transition = "none";
		personalbar.collapsed = false;
	}

	let netHeight = getRect(gNavToolbox, {box: "padding"}).height - scrollbox.clientHeight;
	if (!countPersonalbar && !personalbarCollapsed)
		netHeight -= getRect(personalbar).height;
	netHeight -= getRect($("#notifications-toolbar")).height;
	style(root, {"--nav-toolbox-net-padding-box-height": netHeight + "px"});

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

function updateThemeStatus(themeData) {
	let aiWindow = root.hasAttribute("ai-window");
	let id = getPref("extensions.activeThemeID");
	defaultTheme = ["", "default-theme@mozilla.org", "firefox-compact-light@mozilla.org", "firefox-compact-dark@mozilla.org"]
		.includes(id);
	defaultDarkTheme = id == "firefox-compact-dark@mozilla.org";
	defaultAutoTheme = ["", "default-theme@mozilla.org"].includes(id);
	micaEnabled = micaMQ.matches;
	nova = novaMQ.matches;
	mica = micaEnabled && defaultAutoTheme && !accentColorInTitlebarMQ.matches;
	micaTheme = !aiWindow && (mica || micaEnabled && getPref(prefBranchStr + "nativeWindowStyle"));

	if (!themeData && aiWindow)
		return;

	let repeatVal;
	if (themeData) {
		console?.debug(themeData);
		let {theme} = themeData;
		bgImgTheme = !!(theme?.headerImage || theme?.headerURL || theme?.additionalBackgrounds?.[0]);
		repeatVal = theme?.backgroundsTiling || "";
	} else {
		let cs = getComputedStyle(
			BACKGROUND_ON_BODY && !root.hasAttribute(THEME_IMAGE_IN_TOOLBOX)
				? document.body
				: win7 || win8
					? root : gNavToolbox
		);
		bgImgTheme = cs.backgroundImage.includes("url(");
		repeatVal = cs.backgroundRepeat;
	}
	repeatVal = repeatVal.split(/,\s*/);
	let isRepeat = p => ["repeat", "repeat-y"].includes(p);
	bgImgHasRepeat = bgImgTheme && repeatVal.some(isRepeat);
	bgImgAllRepeat = bgImgTheme && repeatVal.every(isRepeat);
}

/**
 * @param {Element} anchor
 * @param {string} position
 */
function getPopupPosition(anchor, position) {
	return (
		prefs.tabsAtBottom < 0 &&
		(!position || position.match(/bottom\w+ top\w+/)) &&
		contains(tabsBar, anchor)
	)
		? flipPosition(position) || "topleft bottomleft"
		: position;
}

function updatePopupPosition() {
	for (let p of $$(".new-tab-popup, #BMB_bookmarksPopup")) {
		p._oriPosition ||= p.position;
		p.position = prefs.tabsAtBottom < 0 && contains(tabsBar, p)
			? flipPosition(p._oriPosition)
			: p._oriPosition;
	}
}

/**
 * @param {string} position
 */
function flipPosition(position) {
	return position
		?.replace(/^after/, "before")
		.replace(/bottom(\w+) top(\w+)/, "top$1 bottom$2");
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

/**
 * @param {number} a
 * @param {number} b
 */
function minPointH(a, b) {
	return Math[RTL_UI ? "max" : "min"](a, b);
}

/**
 * @param {(string|CustomElementConstructor)} element
 * @param {string} method
 * @param {Object} [context]
 */
function exposePrivateMethod(element, method, context) {
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
			element.prototype[newMethod] = evalInSandbox(
				/*js*/
				`(function ${newMethod} ${code})`,
				new Cu.Sandbox(window, {sandboxPrototype: window, sameZoneAs: window}),
				context,
			);
			relatedMehtods.forEach(m => exposePrivateMethod(element, m, context));
		} catch (e) {
			showError(e, method, e.stack);
		}
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

function restartFirefox() {
	let s = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
	s.quit(s.eAttemptQuit | s.eRestart);
}

/**
 * @param {{(): void|Promise<Element>|Array<Promise<Element>>}} action
 * @param {Object} [param1]
 * @param {Element[]} [param1.nodes]
 * @param {(Element|Element[])} [param1.includeNodes]
 * @param {(Element|Element[])} [param1.excludeNodes]
 * @param {Map<Element, Rect>} [param1.rects]
 * @param {Map<Element, Rect>} [param1.newRects]
 * @param {boolean} [param1.includeClosing]
 * @param {boolean} [param1.bypassCache]
 * @param {(boolean|"transorm"|"translate"|Array<"transorm"|"translate">)} [param1.translated]
 * @param {boolean} [param1.animate]
 * @param {boolean} [param1.shouldUpdateLayout]
 */
async function animateLayout(
	action,
	{
		nodes,
		includeNodes,
		excludeNodes,
		rects,
		newRects,
		translated,
		includeClosing = true,
		bypassCache,
		animate = true,
		shouldUpdateLayout = true,
	} = (animatingLayout || {}),
) {
	let recursion = !!animatingLayout;
	animate &&= !recursion && !gReduceMotion && !!prefs.animationDuration;

	let deltaNodes, cancel, slotRect, tabsRect, scrollTop;
	let newTabButton, newTabBtnWasVisible;

	if (animate) {
		({scrollTop} = scrollbox);
		tabsRect = getRect(tabContainer, {box: "content"});
		slotRect = getRect(slot, {box: "content"});
		nodes ||= getNodes({newTabButton: true, includeClosing, bypassCache});
		rects ||= new Map();
		newRects ||= new Map();
		if (excludeNodes)
			nodes = nodes.filter(
				Array.isArray(excludeNodes)
					? n => !excludeNodes.includes(n)
					: n => n != excludeNodes
			);
		if (includeNodes)
			nodes = [...new Set([
				...nodes,
				...[includeNodes].flat(),
			])];

		for (let n of nodes)
			if (!rects.has(n))
				rects.set(n, getVisualRect(n, translated));

		if (prefs.tabsUnderControlButtons > 1 && maxTabRows() > 1) {
			({newTabButton} = tabContainer);
			if ((newTabBtnWasVisible = rects.get(newTabButton)?.visible) == false)
				rects.set(newTabButton, getVisualRect($("#new-tab-button", tabsBar), translated));
		}

		animatingLayout = {
			nodes, rects, newRects, shouldUpdateLayout,
			slotRect, tabsRect, scrollTop, action,
			stack: debug && new Error().stack,
		};
		if (debug)
			animatingLayout.trace = new Error();
	}

	try {
		deltaNodes = action?.(action);
		if (animate && !animatingLayout.cancel && deltaNodes instanceof Promise)
			deltaNodes = await deltaNodes;
	} finally {
		if (animate) {
			({cancel, shouldUpdateLayout} = animatingLayout);
			animatingLayout = null;
		}
	}

	if (recursion)
		return;

	if (shouldUpdateLayout)
		tabContainer.updateLayout();
	tabContainer.tabDragAndDrop.updateStackingInfo();

	if (!animate || cancel)
		return;

	console?.log("animate layout");
	console?.trace();
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async rs => {
		for (let n of nodes)
			if (!newRects.has(n))
				newRects.set(n, getRect(n));

		/*TODO: handle closing tabs*/

		deltaNodes = [deltaNodes].flat().filter(n =>
			isTabLike(n) && n.visible ||
			isTabGroupLabelContainer(n) ||
			isTabGroupOverflowContainer(n)
		);
		if (deltaNodes.every(n => n._tPos > -1))
			deltaNodes.sort((a, b) => a._tPos - b._tPos);

		if (deltaNodes[0]) {
			if (
				getGroup(deltaNodes.find(isTabGroupOverflowContainer))
					?.getAttribute("toggling")
				!= "collapse"
			)
				tabContainer._unlockTabSizing({instant: true, unlockSlot: false});

			nodes = nodes.concat(deltaNodes);
			for (let t of deltaNodes)
				if (!newRects.has(t))
					newRects.set(t, getRect(t));

			/*TODO: support non-continuous new elements*/

			let newNodes = getNodes();
			let nxt = newNodes[newNodes.lastIndexOf(deltaNodes.at(-1)) + 1];
			let nxtR = rects.get(nxt);
			let nxtNewR = newRects.get(nxt);
			let newSlotRect = getRect(slot, {box: "content"});
			let newRowStartPoint = newSlotRect[prefs.justifyCenter < 2 ? "start" : "centerX"];

			for (let n of deltaNodes) {
				if (isTabGroupOverflowContainer(n)) {
					let group = getGroup(n);
					let r = rects.get(
						group.getAttribute("toggling") == "collapse"
							? group.nonHiddenTabLikes.at(-1)
							: group.labelContainerElement
					)?.clone().collapse();
					if (r) {
						nodes.push(n);
						rects.set(n, r);
						newRects.set(n, getRect(n));
					}
				} else {
					let r;
					let newR = newRects.get(n);
					let prv = newNodes[newNodes.indexOf(n) - 1];
					let prvNewR =
						newRects.get(prv) ||
						//the previous may be a newly added tab group label
						prv && getRect(prv);

					if (prvNewR && !pointDelta(prvNewR.y, newR.y)) {
						r = rects.get(prv)?.clone();
						if (!r) {
							r = prvNewR.clone();
							r.basedOnNewLayout = true;
						}
						r.start = r.end;
					} else if (nxtNewR && !pointDelta(nxtNewR.y, newR.y))
						r = nxtR.clone();
					else {
						r = newR.clone();
						r.start = newRowStartPoint;
						r.basedOnNewLayout = true;
					}
					r.y += scrollbox.scrollTop - scrollTop;
					if (!n.pinned || prefs.pinnedTabsFlexWidth)
						r.width = 0;
					rects.set(n, r);
				}
			}
		}

		if (newTabBtnWasVisible && !newRects.get(newTabButton).visible) {
			let staticNewTabBtn = $("#new-tab-button", tabsBar);
			nodes[nodes.indexOf(newTabButton)] = staticNewTabBtn;
			rects.set(staticNewTabBtn, rects.get(newTabButton));
			newRects.set(staticNewTabBtn, getRect(staticNewTabBtn));
		}

		let newTabsRect = getRect(tabContainer, {box: "content"});
		let run = () => Promise.all(nodes.map(n => {
			let r = rects.get(n), nR = newRects.get(n), targetingR = n._animationTargetingRect;
			if (targetingR) {
				n.style.transform = `translate(${targetingR.start - nR.start}px, ${targetingR.y - nR.y}px)`;
				nR = targetingR;
			}
			return animateShifting(
				n,
				r.relativeTo(r.basedOnNewLayout ? newTabsRect : tabsRect),
				nR.relativeTo(newTabsRect),
			);
		})).then(rs);

		nodes = nodes.filter(n => {
			if (n.stacking == "hidden")
				return true;

			let nR = newRects.get(n);
			let oR = rects.get(n);
			return (
				oR.relative || nR.relative ||
				isOverlapping(nR, newTabsRect) ||
				isOverlapping(oR, newTabsRect) ||
				deltaNodes?.includes(n)
			);
		});

		if (tabContainer.overflowing && arrowScrollbox.hasAttribute("scrolledtoend")) {
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
	});
}

const ANIMATE_REQUEST = Symbol("animateRequest");
const APPLYING_ANIMATION = Symbol("applyingAnimation");

/**
 * @param {Element} n
 * @param {Rect} oR
 * @param {Rect} nR
 */
async function animateShifting(n, oR, nR) {
	if (gReduceMotion || !n.isConnected || !oR.visible || !nR.visible || !prefs.animationDuration)
		return n;

	let {start: oS, y: oY, width: oW} = oR;
	let {start: nS, y: nY, width: nW, widthRoundingDiff: wrd, heightRoundingDiff: hrd} = nR;

	let s = pointDelta(oS, nS), y = pointDelta(oY, nY), w = pointDelta(oW, nW);

	if (n.getAttribute("animate-shifting") == "start") {
		n.removeAttribute("animate-shifting");
		delete n[ANIMATE_REQUEST];
	}

	let {abs} = Math;
	if (abs(s) < 1 && abs(y) < 1 && (abs(w) < 1 || !isTabLike(n))) {
		if (n.hasAttribute("animate-shifting"))
			style(n, {
				"--width-rounding-diff": wrd + "px",
				"--height-rounding-diff": hrd + "px",
			});
		return n;
	}

	let to = [nS, nY, nW];
	if (n[ANIMATE_REQUEST]?.every((v, i) => abs(v - to[i]) < 1)) {
		await waitForAnimate(n);
		console?.debug(n, "previous animate done");
		return n;
	}
	n[ANIMATE_REQUEST] = to;

	n.setAttribute("animate-shifting", "start");
	style(n, {
		"--x": s + "px",
		"--y": y + "px",
		"--w": w + "px",
		"--l": nW + "px",
		"--width-rounding-diff": wrd + "px",
		"--height-rounding-diff": hrd + "px",
	});

	await (
		n[APPLYING_ANIMATION] = rAF(2).then(() => {
			if (n[ANIMATE_REQUEST] == to) {
				n.setAttribute("animate-shifting", "run");
				style(n, {"--x": "", "--y": "", "--w": ""});
			}
		})
	);

	if (n[ANIMATE_REQUEST] == to) {
		delete n[APPLYING_ANIMATION];

		await waitForAnimate(n);

		n.removeAttribute("animate-shifting");
		style(n, {"--l": ""});
		if (["--translate-x", "--translate-y"].every(p => !getStyle(n, p)))
			style(n, {"--width-rounding-diff": "", "--height-rounding-diff": ""});

		delete n[ANIMATE_REQUEST];
	} else {
		await n[APPLYING_ANIMATION];
		await waitForAnimate(n);
	}

	return n;
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
		r1.width && r1.height && r2.width && r2.height &&
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
	if (r.visible && isTabLike(n)) {
		let cs = getComputedStyle(
			n.stack ?? n,
			n.stack ? "" : "::after"
		);
		r.width -= parseFloat(cs.marginInlineEnd) || 0;
		if (!n.stack)
			//a property that store the value of the original margin inline end
			r.width += parseFloat(cs.minHeight) || 0;
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
 * @param {boolean} [param1.noFlush] using `getBoundsWithoutFlushing()` instead
 */
function getRect(node, {box, translated, checkVisibility, noFlush} = {}) {
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

	return new Rect(start, y, width, height, widthRoundingDiff, heightRoundingDiff);
}

/**
 * @param {string} func
 * @param {string} [ignoreFunc]
 */
function isCalledBy(func, ignoreFunc) {
	let {stack} = new Error();
	func = func.split("@");
	let match = stack.match(new RegExp(`^(${func[0]})@.+${func[1]||""}(\\?\\d+)?:\\d+:\\d+$`, "m"));
	if (match && stack.match(/^.+\*/m)?.index < match.index) {
		if (ignoreFunc != "*" && (!ignoreFunc || !isCalledBy(ignoreFunc)))
			window.console.error("Unsafe stack checking!", func, stack);
		return false;
	}
	return !!match;
}

async function rAF(times = 1) {
	while (times-- > 0)
		await new Promise(requestAnimationFrame);
}

async function defer(timeout = 0) {
	await new Promise(rs => setTimeout(rs, timeout));
}

/**
 * @param {string} name
 * @param {(number|boolean|string)} [fallback]
 * @returns {(number|boolean|string)}
 */
function getPref(name, fallback) {
	let {prefs} = Services;
	let type = prefs.getPrefType(name);
	if (!type)
		return fallback;
	return prefs[
		`get${{
			[prefs.PREF_STRING]: "String",
			[prefs.PREF_INT]: "Int",
			[prefs.PREF_BOOL]: "Bool",
		}[type]}Pref`
	](name);
}

/**
 * @param {(Object|CSSStyleDeclaration|null)} o object
 * @param {Object} [p] parameters
 * @returns {Object} a copy of `p` if `o` is `null`
 */
function assign(o, p) {
	return Object.assign(o || {}, p);
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
 * `configurable` and `enumerable` of all properties default to `true` if not specified.
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

		v.configurable ??= true;
		v.enumerable ??= true;

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

/**
 * Workaround for the Firefox console bug where the source code of this file
 * cannot be displayed when using evalInSandbox.
 * @param {string} script
 * @param {Sandbox} sandbox
 */
function evalInSandbox(script, sandbox, context = {}) {
	let useSandbox = !debug;

	if (!useSandbox)
		try {
			eval("");
		// eslint-disable-next-line no-unused-vars
		} catch (e) {
			useSandbox = true;
		}

	return useSandbox
		? Cu.evalInSandbox(script, assign(sandbox, context))
		: new Function(...Object.keys(context), script)(...Object.values(context));
}

/**
 * @param {Object} param0
 * @param {string} [param0.uri]
 * @param {boolean} [param0.skipMinorVer]
 */
async function getScriptInfo({
	uri = new Error().stack.match(/(?<=@).+?(?=:\d+:\d+$)/m)[0],
	skipMinorVer,
} = {}) {
	let script = (await(await fetch(uri)).text()).trim();
	let version = script.match(/^\/\/\s*@version\s+(.+?)\s*$/mi)[1]
		.replace(/((\d+\.\d+\.\d+)\.\d+)/, skipMinorVer ? "$2" : "$1")
		.replace(/(\.0)+$/, "");
	let compatibility = script.match(/^\/\/\s*@compatibility\s+firefox\s*(.+?)\s*$/mi)[1]
		.split(/\s*,\s*/).map(v => v.split(/\s*-\s*/));
	let compatible =
		appVersion > compatibility.at(-1).at(-1) ||
		compatibility.some(([min, max]) => max ? min <= appVersion && appVersion <= max : appVersion == min);
	return {script, version, compatible, compatibility, uri};
}

/**
 * @param {Object} texts
 */
function l10n(texts) {
	return assign(texts.en, texts[Services.locale.appLocaleAsLangTag.split("-")[0]]);
}

console?.timeEnd("setup");
return true;
} //end function setup()

function updateNavBarOverflow() {
	dispatchEvent(new Event("resize"));
}

} catch (e) {
	showError(e, e.stack);
}

function showError(...texts) {
	for (let t of texts)
		if (t instanceof Error) {
			console.error(t);
			break;
		}
	setTimeout(() => Services.prompt.alert(window, `${SCRIPT_NAME} (${SCRIPT_FILE_NAME})`, texts.join("\n\n")));
}

}
