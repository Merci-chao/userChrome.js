"use strict";
// ==UserScript==
// @name           Multi Tab Rows (MultiTabRows@Merci.chao.uc.js)
// @namespace      https://github.com/Merci-chao/userChrome.js
// @author         Merci chao
// @version        2.3
// ==/UserScript==

try {
try {Services.prefs.lockPref("sidebar.verticalTabs")} catch(e) {}

if (gBrowser?._initialized) {
	setup();
	let {tabContainer} = gBrowser;
	tabContainer.uiDensityChanged();
	tabContainer._handleTabSelect(true);
} else
	addEventListener("DOMContentLoaded", setup, {once: true});

function setup() {

let win7 = matchMedia("(-moz-platform: windows-win7)").matches;
let win8 = matchMedia("(-moz-platform: windows-win8)").matches;
let accentColorInTitlebarMQ = matchMedia("(-moz-windows-accent-color-in-titlebar)");
let micaEnabled = matchMedia("(-moz-windows-mica)").matches;
let mica;
let defaultDarkTheme, defaultAutoTheme, defaultTheme;

let appVersion = parseInt(Services.appinfo.version);
let [START, END, START_PC, END_PC, DIR]
		= RTL_UI ? ["right", "left", "100%", "0%", -1] : ["left", "right", "0%", "100%", 1];
let EPSILON = .001;
let {assign} = Object;

let root = document.documentElement;

let debug, log, trace, time, timeLog, timeEnd;

let prefBranchStr = "userChromeJS.multiTabRows@Merci.chao.";
let prefs;
{
	function createDefaultPrefs() {
		mica = micaEnabled && defaultAutoTheme
				&& !accentColorInTitlebarMQ.matches;

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
			floatingBackdropBlurriness: appVersion > 115 ? 5 : null,
			floatingBackdropOpacity: appVersion > 115 && !mica ? 25 : 75,
			compactControlButtons: !(win7 || win8) ? mica : null,
			hideAllTabs: appVersion == 115 ? false : null,
		};
	};

	let setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
			value != null && branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
	let getPrefs = (branch, data) => Object.fromEntries(Object.entries(data)
			.filter(([name, value]) => value != null)
			.map(([name, value]) => [name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));

	updateThemeStatus();
	loadPrefs();
	updatePrefsDependency(true);

	Object.keys(prefs).forEach(n => Services.prefs.addObserver(prefBranchStr + n, onPrefChange));
	let observedBrowserPrefs = ["extensions.activeThemeID", "browser.toolbars.bookmarks.visibility"];
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
	}

	function onPrefChange(pref, type, name) {
		if (window.MultiTabRows_updatingPref) return;

		log(name);

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
			case "tabsUnderControlButtons":
				if (hasTabGoups())
					prefs.tabsUnderControlButtons = 0;
				setStyle();
				tabsBar.toggleAttribute("tabs-hide-placeholder",
						tabContainer.overflowing && prefs.tabsUnderControlButtons < 2);
				tabContainer._updateInlinePlaceHolder();
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
			case "compactControlButtons":
				setStyle();
				updateNavToolboxNetHeight();
				break;
			default:
				setStyle();
		}
	}

	function updatePrefsDependency(enbale) {
		let singleRow = prefs.maxTabRows < 2;
		lock("compactControlButtons", mica);
		lock("rowStartIncreaseFrom", singleRow);
		lock("rowIncreaseEvery", singleRow);
		lock("hideEmptyPlaceholderWhenScrolling", singleRow || prefs.tabsUnderControlButtons < 2);
		lock("tabsbarItemsAlign", singleRow || prefs.tabsUnderControlButtons == 2);
		lock("dynamicThemeImageSize", singleRow || defaultTheme);
		lock("tabsUnderControlButtons", singleRow);
		lock("floatingBackdropClip", singleRow || prefs.tabsUnderControlButtons < 2);
		lock("floatingBackdropBlurriness",
				prefs.floatingBackdropOpacity >= 100 || prefs.floatingBackdropClip
						|| singleRow || prefs.tabsUnderControlButtons < 2 || mica);
		lock("floatingBackdropOpacity", prefs.floatingBackdropClip || singleRow || prefs.tabsUnderControlButtons < 2);

		function lock(name, toLock) {
			try {Services.prefs[enbale && toLock ? "lockPref" : "unlockPref"](prefBranchStr + name)} catch(e) {}
		}
	}
}

setDebug();

time("setup");

let tabsBar = document.getElementById("TabsToolbar");
let {tabContainer} = gBrowser, {arrowScrollbox} = tabContainer, {scrollbox} = arrowScrollbox;
let slot = scrollbox.querySelector("slot");

let tabAnimation = getComputedStyle(gBrowser.selectedTab).transition.match(/(?<=min-width )[^,]+|$/)[0]
		|| ".1s ease-out";

let tabHeight = 0;
let newTabButtonWidth = 0;
let scrollbarWidth = 0;

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
let {rowStartIncreaseFrom: rSIF, rowIncreaseEvery: rIE, maxTabRows: maxRows} = prefs;
let singleRow = maxRows < 2 ? "screen" : `(max-width: ${rSIF + rIE - EPSILON}px)`;
let multiRows = `(min-width: ${rSIF + rIE}px)`;
let twoOrLessRows = maxRows < 3 ? "screen" : `(max-width: ${rSIF + rIE * 2 - EPSILON}px)`;
let lastTab = `:is(
	#tabbrowser-arrowscrollbox > .tabbrowser-tab:nth-last-child(2 of :not([hidden])),
	tab-group:not([collapsed]):nth-last-child(2 of :not([hidden])) .tabbrowser-tab:nth-last-child(1 of :not([hidden])),
	tab-group[collapsed]:nth-last-child(2 of :not([hidden])) .tab-group-label-container
)`;
let adjacentNewTab = "#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button";
let dropOnItems = ":is(#home-button, #downloads-button, #bookmarks-menu-button, #personal-bookmarks)";
let dropOnItemsExt = "#TabsToolbar[tabs-dragging-ext] :is(#new-tab-button, #new-window-button)";
let shownMenubar = "#toolbar-menubar:is(:not([inactive]), [autohide=false])";
let hideMenubar = "#toolbar-menubar[autohide=true][inactive]";
let topMostTabsBar = `:root:is([tabsintitlebar], [customtitlebar]) ${hideMenubar} + #TabsToolbar`;
let hidePlaceHolder = "[customizing], [tabs-hide-placeholder]";
let showPlaceHolder = `:not(${hidePlaceHolder})`;
let tbDraggingHidePlaceHolder = ":is([tabs-dragging], [movingtab]):not([moving-positioned-tab])";
let staticPreTabsPlaceHolder = ":is([tabs-scrolledtostart], [pinned-tabs-wraps-placeholder])";

mainStyle.innerHTML = `
:root {
	--max-tab-rows: 1;
}

${[...Array(maxRows).keys()].slice(1).map(i => `
	@media (min-width: ${rSIF + rIE * i}px) {
		:root { --max-tab-rows: ${i + 1}; }
	}
`).join("\n")}

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
	--tabs-item-opacity-transition: ${getComputedStyle(arrowScrollbox.shadowRoot.querySelector("[part=overflow-end-indicator]"))
			.transition.match(/\d.+|$/)[0] || ".15s"};
}

@media (prefers-reduced-motion: reduce) {
	${_} {
		--tabs-item-opacity-transition: 0s;
	}
}

:root[sizemode=maximized] ${_} {
	--space-before-tabs: ${prefs.spaceBeforeTabsOnMaximizedWindow}px;
	--space-after-tabs: ${prefs.spaceAfterTabsOnMaximizedWindow}px;
}

${win7 || win8 ? `
	/*refer to browser-aero.css and browser-aero.css*/
	@media (-moz-windows-classic: 0) {
		${_=":root[sizemode=normal] " + hideMenubar + " + #TabsToolbar"} {
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
	:root[sizemode=maximized] ${_} {
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

	:root:is([tabsintitlebar], [customtitlebar]) #navigator-toolbox:not([tabs-hidden]) > #toolbar-menubar[autohide=true] {
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
	align-self: end;
}

#tabbrowser-tabs {
	--gap-after-pinned: ${prefs.gapAfterPinned}px;
	--tab-animation: ${debug == 2 ? "1s ease" : tabAnimation};
	--touch-extra-tab-width: 0px;
	--tabstrip-padding: 0px;
	--tabstrip-border-width: 0px;
	--tabstrip-border-color: transparent;
	--tabstrip-border: var(--tabstrip-border-width) solid var(--tabstrip-border-color);
	--tabstrip-size: calc(var(--tabstrip-padding) * 2 + var(--tabstrip-border-width));
}

/*ui.prefersReducedMotion = 1*/
@media (prefers-reduced-motion: reduce) {
	#tabbrowser-tabs {
		--tab-animation: 0s;
	}
}

${appVersion == 115 ? `
	:root[uidensity=touch] #tabbrowser-tabs {
		--touch-extra-tab-width: 10px;
	}
` : ``}

/*Highlight effect of _notifyBackgroundTab*/
${_="#tabbrowser-arrowscrollbox"} {
	--scrollbar-track-color: ${prefs.scrollbarTrackColor == "auto" ?
			win7 && defaultDarkTheme ? "var(--tab-icon-overlay-fill)" : "var(--toolbar-bgcolor)" : prefs.scrollbarTrackColor};
	scrollbar-color: ${prefs.scrollbarThumbColor == "auto" ?
			root.style.getPropertyValue("--toolbarbutton-icon-fill") ?
				"var(--toolbarbutton-icon-fill)" : "var(--toolbar-color)" : prefs.scrollbarThumbColor} var(--scrollbar-track-color);
	transition: scrollbar-color ${getComputedStyle(arrowScrollbox.shadowRoot.querySelector("[part=scrollbutton-down]"))
			.transition.match(/\d.+|$/)[0] || "1s ease-out"};
}

@media (prefers-reduced-motion: reduce) {
	${_} {
		transition-timing-function: step-end;
	}
}

${_}[highlight] {
	--scrollbar-track-color: var(${appVersion == 115 ? "--tab-attention-icon-color" : "--attention-dot-color"});
	transition-duration: 0s;
}

/*ensure the new tab button won't be wrapped to the new row in any case*/
/*TODO tab-group support*/
${(() => {
	let css = `
		${CSS.supports("selector(:has(*))") ? `
			${_}:has(.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])))::part(slot) {
				flex-wrap: nowrap;
			}
		` : `
			/*do not limit the box width when [positionpinnedtabs] as it needs to let the box
			  be narrow enough to trigger the deactivation of positioning*/
			#tabbrowser-tabs[hasadjacentnewtabbutton]:not([positionpinnedtabs]) ${_} {
				/*list out all possible things in case they are shown and their size is non zero*/
				min-width: calc(var(--tabstrip-size) + var(--tab-min-width) + var(--touch-extra-tab-width) + var(--new-tab-button-width) + var(--tabs-scrollbar-width)) !important;
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
		${_}[overflowing]::part(slot)::before,
		${_}[overflowing]::part(slot)::after,
		${_}[overflowing] #tabbrowser-arrowscrollbox-periphery {
			visibility: collapse;
		}
	}
` : ``}

/*do not limit the box width when [positionpinnedtabs]*/
#tabbrowser-tabs:not([positionpinnedtabs])[overflow] ${_} {
	min-width: calc(var(--tab-min-width) + var(--touch-extra-tab-width) + var(--tabs-scrollbar-width)) !important;
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
	z-index: 4;
	margin-inline: ${RTL_UI ? ".5px -7.5px" : "-.5px -6.5px"};
}

${_}::part(overflow-end-indicator) {
	margin-inline: ${RTL_UI ? "-6.5px -.5px" : "-7.5px .5px"} !important;
}

#tabbrowser-tabs:not([dragging])[overflow] ${_}::part(overflow-end-indicator) {
	translate: calc(var(--tabs-scrollbar-width) * -1 * ${DIR});
}

${context="#tabbrowser-tabs:is([multirows], [overflow])[movingtab]:not([moving-positioned-tab], [movingsingletab], [animate-finishing])"}
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
	--height: calc(var(--tab-height) / 3);
	position: absolute;
	z-index: 1;
	width: var(--slot-width, 0);
	border: 0 !important;
	padding: 0 !important;
	visibility: hidden;
	opacity: 0 !important;
	border-radius: 0;
}

@media ${singleRow} {
	${_}::part(scrollbutton-up),
	${_}::part(scrollbutton-down) {
		--height: calc(var(--tab-height) / 4);
	}
}

${_}::part(scrollbutton-up) {
	margin-top: calc(var(--tabs-top-space) * -1);
	height: calc(var(--height) + var(--tabs-top-space));
}

${_}::part(scrollbutton-down) {
	margin-top: calc(var(--tab-height) * var(--max-tab-rows) - var(--height));
	/*the 15px is an extra dragging space, hardcoded in tabs.css*/
	height: calc(var(--height) + 15px);
}

${context="#tabbrowser-tabs[positionpinnedtabs]"} ${_}::part(scrollbutton-up),
${context} ${_}::part(scrollbutton-down) {
	margin-inline-start: var(--gap-after-pinned);
}

${context="#tabbrowser-tabs[overflow][dragging]:not([moving-positioned-tab])"}
		${_}:not([lockscroll]):not([scrolledtostart])::part(scrollbutton-up),
${context}
		${_}:not([lockscroll]):not([scrolledtoend])::part(scrollbutton-down) {
	visibility: visible !important;
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

#tabbrowser-tabs[positionpinnedtabs] ${_}::part(scrollbox) {
	/*padding cause inconsistent width result*/
	padding-inline: 0 !important;
	margin-inline-start: var(--gap-after-pinned);
}

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
	height: var(--slot-height);
	width: 1px;
}

${_}::part(slot) {
	min-width: 1px; /*ensure it is visible and able to make the scrollbox overflow*/
	flex-wrap: wrap;
	height: var(--slot-height, auto);
	width: var(--slot-width, auto);
	align-items: start;
	align-content: start;
	transition: padding-bottom var(--tab-animation);
	/*fx115*/
	display: flex;
	flex: 1;
}

/*avoid any weird stuff going out of bounds and causing the scrollbox to overflow*/
${_}:not([scrollsnap])::part(slot),
/*when dragging tab outside the boundary, it makes the slot not expand*/
#tabbrowser-tabs[movingtab] ${_}::part(slot) {
	overflow: hidden;
}

#tabbrowser-tabs[animate-finishing] ${_}::part(slot) {
	pointer-events: none;
}

.tab-group-label-container {
	margin-inline-end: var(--adjacent-newtab-button-adjustment, 0px);
}

${_=".tabbrowser-tab"} {
	/*snap to end but not start as the first row may be occupied by the inline placeholder*/
	scroll-snap-align: end;
	margin-inline-end: calc(var(--moving-tab-width-adjustment, 0px) + var(--adjacent-newtab-button-adjustment, 0px)) !important;
}

/*ensure the closing/not-fully-open tabs can have 0 width*/
${_}:not([pinned], [fadein]) {
	padding-inline: 0;
}

#tabbrowser-tabs:not([movingtab])
		${_}${condition=":not([pinned], [multiselected-move-together], [tab-grouping], [tabdrop-samewindow])"} {
	transition: var(--tab-animation);
	transition-property: max-width, min-width, padding;
}

#tabbrowser-tabs:not([movingtab])
		${_}[fadein]${condition} {
	transition-property: max-width, min-width;
}

/*avoid min/max width transition when resizing the dragged tabs*/
#tabbrowser-tabs[movingtab] ${_}:is([selected], [multiselected]):not([tabdrop-samewindow]) {
	transition: none;
}

/*make moving pinned tabs above the selected normal tabs*/
#tabbrowser-tabs[moving-positioned-tab] > #tabbrowser-arrowscrollbox >
		${_}[pinned]:is([selected], [multiselected]) {
	z-index: 3;
}

#TabsToolbar:not([customizing]) #tabbrowser-tabs:not([overflow], [closing-tab-ignore-newtab-width])[hasadjacentnewtabbutton]
		${lastTab} {
	--adjacent-newtab-button-adjustment: var(--new-tab-button-width);
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
		:nth-last-child(1 of [pinned]:not([hidden])):not(:nth-last-child(1 of ${_}:not([hidden]))) {
	margin-inline-end: var(--gap-after-pinned) !important;
}

${context="#tabbrowser-tabs[closebuttons=activetab]"}[orient=horizontal] ${_}[closebutton] .tab-close-button:not([selected]),
/*fx 115*/
${context} > #tabbrowser-arrowscrollbox > ${_}[closebutton] > .tab-stack > .tab-content > .tab-close-button:not([selected=true]) {
	display: flex;
}

${appVersion == 115 ? `
	/*bug fix for fx 115*/
	:root[uidensity=touch] ${_}:not([pinned], [fadein]) {
		max-width: .1px;
		min-width: .1px;
	}
` : ``}

${_="#tabbrowser-arrowscrollbox-periphery"} {
	transition: margin-inline-end var(--tab-animation);
}

#tabbrowser-tabs:not([overflow])${condition="[closing-tab-ignore-newtab-width]"} ${_} {
	margin-inline-end: calc(var(--new-tab-button-width) * -1);
}

#tabbrowser-tabs:not(${condition}) #tabs-newtab-button {
	margin-inline-start: calc(var(--new-tab-button-width) * -1) !important;
}

/*make the spacer grow in sync with the closing tab to prevent the spacer from wrapping to new row*/
.closing-tabs-spacer {
	transition: width var(--tab-animation) !important;
}

.tab-group-label-container {
	align-self: stretch;
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
		--tabs-placeholder-shadow: var(--tab-selected-shadow,
				${getComputedStyle(gBrowser.selectedTab.querySelector(".tab-background")).boxShadow});
		--tabs-placeholder-border-color: ${getComputedStyle(tabContainer).getPropertyValue("--tabstrip-inner-border")
				.match(/(?<=\dpx \w+ ).+|$/)[0] || "color-mix(in srgb, currentColor 25%, transparent)"};
		--tabs-placeholder-border-width: 1px;
		--tabs-placeholder-border: var(--tabs-placeholder-border-width) solid var(--tabs-placeholder-border-color);
		--tabs-placeholder-border-radius: ${prefs.floatingBackdropClip && prefs.tabsUnderControlButtons == 2 ? 0 : "var(--tab-border-radius)"};
		--tabs-placeholder-backdrop: ${!prefs.floatingBackdropClip && prefs.floatingBackdropBlurriness && prefs.floatingBackdropOpacity < 100 && !mica ?
				`blur(${prefs.floatingBackdropBlurriness}px)` : "none"};
		--placeholder-background-color: var(${appVersion == 115 ?
				(win7 && defaultDarkTheme ? "--tab-icon-overlay-fill"
						: (win8 && defaultTheme ? "--tab-selected-bgcolor, var(--lwt-selected-tab-background-color)"
								: "--lwt-accent-color")) :
				"--toolbox-bgcolor, var(--toolbox-non-lwt-bgcolor, var(--lwt-accent-color, var(--tab-selected-bgcolor, var(--lwt-selected-tab-background-color))))"});
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
		--post-tabs-clip-reserved: calc(var(--tab-shadow-max-size) - var(--tab-overflow-clip-margin, 2px));
	}

	${_}:-moz-window-inactive {
		--placeholder-background-color: var(${appVersion == 115 ?
				(win7 && defaultDarkTheme ? "--tab-icon-overlay-fill"
						: (win8 && defaultTheme ? "--tab-selected-bgcolor, var(--lwt-selected-tab-background-color)"
								: "--lwt-accent-color-inactive, var(--lwt-accent-color)")) :
				"--toolbox-bgcolor-inactive, var(--toolbox-non-lwt-bgcolor-inactive, var(--lwt-accent-color-inactive, var(--tab-selected-bgcolor, var(--lwt-selected-tab-background-color))))"});
	}

	${micaEnabled && accentColorInTitlebarMQ.matches && defaultAutoTheme ? `
		${_} {
			--placeholder-background-color: ActiveCaption;
		}
		${_}:-moz-window-inactive {
			--placeholder-background-color: InactiveCaption;
		}
	` : ``}

	${mica ? `
		/*the colors should be replaced by variables (if exist)*/
		${_} {
			--placeholder-background-color: #DADADA;
		}
		${_}:-moz-window-inactive {
			--placeholder-background-color: #E8E8E8;
		}
		@media (prefers-color-scheme: dark) {
			${_} {
				--placeholder-background-color: #0A0A0A;
			}
			${_}:-moz-window-inactive {
				--placeholder-background-color: #202020;
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
	${_}:is(#toolbar-menubar[autohide=false] + *, :root:not([tabsintitlebar], [customtitlebar]) *)[tabs-overflow] {
		padding-inline-end: var(--tabs-scrollbar-width);
	}

	/*raise the items to cover the placeholder*/
	${context=`${_}:not(${condition=tbDraggingHidePlaceHolder})`} >
			:not(.toolbar-items),
	${context}
			#TabsToolbar-customization-target > :not(#tabbrowser-tabs) {
		z-index: 2;
	}

	/*raise the tabs to cover the items when dragging*/
	${context = _ + condition} #tabbrowser-tabs {
		z-index: 1;
	}

	/*raise the items that can be dropped on to cover the tabs when dragging*/
	${context} ${_=dropOnItems},
	${dropOnItemsExt} {
		z-index: 2;
	}

	${context}:not([tabs-scrolledtostart]) :is(${_}, ${dropOnItemsExt}:not(${adjacentNewTab})):is(#tabbrowser-tabs ~ *, #TabsToolbar:not([pinned-tabs-wraps-placeholder]) *)
			:is(.toolbarbutton-1 .toolbarbutton-icon, .toolbarbutton-badge-stack, #PlacesToolbar) {
		${floatingButtonStyle = `
			border-radius: var(--tab-border-radius);
			box-shadow: var(--tabs-placeholder-shadow), inset 0 0 0 var(--tabs-placeholder-border-width) var(--tabs-placeholder-border-color);
			backdrop-filter: var(--tabs-placeholder-backdrop);
			background-color: color-mix(in srgb, var(--placeholder-background-color) ${prefs.floatingBackdropOpacity}%, transparent);
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

	#TabsToolbar${showPlaceHolder} :is(
		:root:not([privatebrowsingmode], [firefoxviewhidden]) :is(toolbarbutton, toolbarpaletteitem),
		:root[privatebrowsingmode]:not([firefoxviewhidden]) :is(toolbarbutton:not(#firefox-view-button), toolbarpaletteitem:not(#wrapper-firefox-view-button))
	) ~ ${_="#tabbrowser-tabs"} {
		--tabstrip-padding: 2px;
		--tabstrip-border-width: var(--tabs-placeholder-border-width);
		--tabstrip-border-color: var(--tabs-placeholder-border-color);
		border-inline-start: 0;
		padding-inline-start: var(--tab-overflow-pinned-tabs-width, 0);
		margin-inline-start: 0;
	}

	#TabsToolbar${showPlaceHolder} ${_} {
		margin-inline: calc(var(--pre-tabs-items-width) * -1) calc(var(--post-tabs-items-width) * -1) !important;
	}

	${context="#TabsToolbar"+showPlaceHolder} ${_}[overflow][hasadjacentnewtabbutton]:not([closing-tab-ignore-newtab-width]) ${lastTab} {
		--adjacent-newtab-button-adjustment: var(--new-tab-button-width);
	}

	${win7 || win8 || mica ? (()=>{
		//there are two buttonbox, get the visible one
		let box = gNavToolbox.querySelector("toolbar:not([autohide=true]) .titlebar-buttonbox");
		let width, height;
		if (mica)
			box.style.alignSelf = "start";
		if (box.clientHeightDouble)
			({heightDouble: height, widthDouble: width} = getRect(box, {box: "margin"}));
		else {
			//as long as the title bar is not shown...
			let s = box.style, ps = box.parentNode.style;
			s.visibility = ps.visibility = "collapse";
			s.display = ps.display = "flex";
			({heightDouble: height, widthDouble: width} = getRect(box, {box: "margin"}));
			s.display = s.visibility = ps.display = ps.visibility = "";
		}
		if (mica) {
			box.style.alignSelf = "";
			height += 1.5;
		}
		let	normal = root.getAttribute("sizemode") == "normal";
		//the box is 2px less in height and 4px more in width when maximized
		return `
			${_ = topMostTabsBar + (mica && prefs.floatingBackdropClip ? ":has(.titlebar-close:hover)" : "")} {
				--control-box-reserved-height: ${height + (normal || mica ? 0 : 2)}px;
				--control-box-reserved-width: ${width - (normal || mica ? 0 : 4)}px;
			}
			[sizemode=maximized]${_} {
				--control-box-reserved-height: ${height - (normal && !mica ? 2 : 0)}px;
				--control-box-reserved-width: ${width + (normal && !mica ? 4 : 0)}px;
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
				/*var(--scrollbar-clip,*/
					${x} ${y=`calc(var(--control-box-reserved-height) - var(--tabs-top-space))`},
					${x=`calc(${END_PC} - (var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
					${x=`calc(${END_PC} - var(--control-box-margin-end) * ${DIR})`} calc(var(--control-box-reserved-height) - var(--tabs-top-space) - var(--control-box-radius-end)),
					${x} 0,
					${x=END_PC} 0,
				/*),*/
				${x} 100%,
				var(--new-tab-clip, ${END_PC} 100%),
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

		/*
		#TabsToolbar${tbDraggingHidePlaceHolder} ${_} {
			--top-placeholder-clip:
					${START_PC} calc(var(--tabs-top-space) * -1),
					calc(${END_PC} - var(--tabs-scrollbar-width) * ${DIR})  calc(var(--tabs-top-space) * -1);
		}

		#TabsToolbar${tbDraggingHidePlaceHolder}:not([tabs-scrolledtostart]) ${_} {
			--scrollbar-clip: ${END_PC} calc(var(--tabs-top-space) * -1);
		}
		*/

		${context}:not([tabs-scrolledtoend])/*:not(${tbDraggingHidePlaceHolder})*/ ${_}[overflow][hasadjacentnewtabbutton] {
			--new-tab-clip:
				${x=`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR})`} 100%,
				${x} ${y=`calc(100% - var(--tab-height))`},
				${x=`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--new-tab-button-width)) * ${DIR})`} ${y},
				${x} 100%;
		}
	` : `
		/*Clip the top right corner to hide the tabs that temporarily appear
		  behind the inline placeholder when some tab is opening/closing*/
		${_=`#TabsToolbar${showPlaceHolder}:not([movingtab]) #tabbrowser-arrowscrollbox[scrolledtostart]`} {
			clip-path: polygon(
				${x=`calc(${START_PC} - var(--tab-overflow-pinned-tabs-width) * ${DIR})`} 100%,
				${x} ${y="calc(var(--tabs-top-space) * -1)"},
				${x=`calc(${END_PC} - (var(--post-tabs-items-width) - var(--post-tabs-clip-reserved)) * ${DIR})`} ${y},
				${x} ${y="var(--tab-height)"},
				${x=`calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR})`} ${y},
				${x} ${y="calc(var(--control-box-clip-scrollbar) - var(--tabs-top-space))"},
				${x=`calc(${END_PC} - (var(--control-box-margin-end) + var(--control-box-radius-end)) * ${DIR})`} ${y},
				${x=`calc(${END_PC} - var(--control-box-margin-end) * ${DIR})`} ${y="calc(var(--control-box-clip-scrollbar) - var(--tabs-top-space) - var(--control-box-radius-end))"},
				${x} ${y="calc(var(--tabs-top-space) * -1)"},
				${x=END_PC} ${y},
				${x} 100%
			);
		}

		@media (-moz-overlay-scrollbars) {
			${_}[overflowing] {
				--scrollbar-clip-reserved: var(--tabs-scrollbar-visual-width);
			}
		}

		${win7 || win8 || mica ? `
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

				${topMostTabsBar}${showPlaceHolder}:not(${tbDraggingHidePlaceHolder}, :has(.titlebar-close:hover))[tabs-scrolledtostart] {
					--control-box-clip-scrollbar-reserved: var(--scrollbar-visual-width);
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

	${_="#tabbrowser-arrowscrollbox::part(slot)"}::before,
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
		border-bottom-${END}-radius: var(--tabs-placeholder-border-radius);
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
		--clip-shadow: calc(var(--tab-shadow-max-size) * -1);
		box-sizing: content-box;
		height: var(--tab-height);
		position: absolute;
		z-index: 1;
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
			background-color: var(--placeholder-background-color);
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
		${START}: 0;
		width: var(--pre-tabs-items-width);
		padding-inline-end: var(--tabstrip-padding);
		/*by default, the margin end will be -1 to cancel out the border*/
		margin-inline-end: calc(var(--tabstrip-padding) + var(--tabstrip-border-width) - var(--tabs-placeholder-border-width));
		border-top-width: 0;
		border-inline-start: 0;
		border-color: var(--tabstrip-border-color);
		border-top-color: transparent;
		border-bottom-${END}-radius: var(--tabs-placeholder-border-radius);
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
		${END}: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--post-tabs-items-width) - var(--tabs-scrollbar-width) - var(--scrollbar-clip-reserved));
		border-top-width: 0;
		border-inline-end: 0;
		border-bottom-${START}-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(var(--clip-shadow) ${RTL_UI ? "var(--clip-shadow)" : 0} var(--clip-shadow) ${RTL_UI ? 0 : "var(--clip-shadow)"});
	}

	#TabsToolbar[tabs-scrolledtostart] :is(${_}, #tabs-placeholder-pre-tabs) {
		pointer-events: none;
	}

	${context=`${shownMenubar} + #TabsToolbar`}
			${_=`:is(#TabsToolbar:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs, #tabs-placeholder-post-tabs)`} {
		border-top-width: var(--tabs-placeholder-border-width);
		border-top-color: var(--tabs-placeholder-border-color);
		margin-top: calc(var(--tabs-placeholder-border-width) * -1);
	}

	${context}${condition="[tabs-scrolledtostart]"} ${_} {
		border-top-color: transparent;
	}

	${context}:not(${condition}, ${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs {
		border-top-${END}-radius: var(--tabs-placeholder-border-radius);
	}

	${context} #tabs-placeholder-post-tabs {
		border-top-${START}-radius: var(--tabs-placeholder-border-radius);
	}

	#tabs-placeholder-new-tab-button {
		bottom: 0;
		${END}: calc(var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved));
		width: calc(var(--new-tab-button-width) - var(--scrollbar-clip-reserved));
		border-inline-end: 0;
		border-bottom: 0;
		border-top-${START}-radius: var(--tabs-placeholder-border-radius);
		clip-path: inset(var(--clip-shadow) ${RTL_UI ? "var(--clip-shadow)" : 0} 0 ${RTL_UI ? 0 : "var(--clip-shadow)"});
	}

	${_="#TabsToolbar"}${staticPreTabsPlaceHolder} #tabs-placeholder-pre-tabs {
		box-shadow: none;
		backdrop-filter: none;
	}

	${hideMenubar} + *
			:is(${_}:not(${staticPreTabsPlaceHolder}) #tabs-placeholder-pre-tabs, #tabs-placeholder-post-tabs) {
		height: calc(var(--tab-height) + var(--tabs-padding-top) + var(--nav-toolbox-padding-top));
		margin-top: calc((var(--tabs-padding-top) + var(--nav-toolbox-padding-top)) * -1);
	}

	${_}:not([tabs-hide-placeholder], [pinned-tabs-wraps-placeholder]) #tabbrowser-arrowscrollbox[overflowing]::part(slot)::before,
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

	${_}:hover #tabbrowser-arrowscrollbox:not(:hover) * {
		-moz-window-dragging: drag !important;
	}

	@media ${singleRow} {
		${_} .tabs-placeholder {
			visibility: collapse;
		}
	}

	${maxRows > 1 ? `
		@media ${multiRows} {
			${_=adjacentNewTab} {
				position: absolute;
				bottom: 0;
				${END}: 0;
			}

			#TabsToolbar:not([tabs-hide-placeholder])[tabs-overflow] ${_} {
				${END}: var(--tabs-scrollbar-width);
			}

			${prefs.tabsUnderControlButtons < 2 ? `
				${context=`:is(
					:root:not([privatebrowsingmode=temporary]) #toolbar-menubar[autohide=false] + #TabsToolbar,
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

		:is(
			#TabsToolbar[tabs-dragging-ext][has-items-post-tabs]:not([tabs-scrolledtostart]),
			#TabsToolbar[tabs-dragging-ext]:not([has-items-post-tabs], [tabs-scrolledtoend]),
		) ${adjacentNewTab}
				.toolbarbutton-icon {
			${floatingButtonStyle}
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

:root {
	--multirows-background-size: calc(var(--nav-toolbox-net-height) + var(--tab-height) * ${prefs.dynamicThemeImageSize ? "var(--tab-rows)" : maxRows});
}

${win7 || win8 ? `:root,` : ``}
#navigator-toolbox {
	background-size: auto var(--multirows-background-size) !important;
}

${appVersion == 115 ? `
	#TabsToolbar #firefox-view-button[open] > .toolbarbutton-icon:-moz-lwtheme,
	#tabbrowser-tabs:not([movingtab]) > #tabbrowser-arrowscrollbox > .tabbrowser-tab > .tab-stack > .tab-background:is([selected=true], [multiselected=true]):-moz-lwtheme {
		background-size: auto 100%, auto 100%, auto var(--multirows-background-size) !important;
	}
	.tabbrowser-tab[tab-grouping] .tab-background[multiselected=true]:-moz-lwtheme {
		background-image: none !important;
	}
` : ``}

${debug ? `
	${_="#tabbrowser-tabs"} {
		background: rgba(0,255,255,.2);
		box-shadow: 0 -5px rgba(0,255,0,.5);
	}
	${_}:hover {
		clip-path: none !important;
	}
	${_=".tabbrowser-tab"}[style*=max-width] {
		background: rgba(255,0,0,.2);
	}
	${_}[style*=transform] {
		background: rgba(255,0,255,.2);
	}
	${_} {
		box-shadow: 0 0 0 1px inset rgba(128,128,128,.5);
		position: relative;
	}
	.tab-background {
		opacity: .7;
	}
	.closing-tabs-spacer {
		outline: 5px solid orangered;
		background: rgba(255, 255, 0, .5);
		height: var(--tab-height);
	}
	${_="#tabbrowser-arrowscrollbox"}::part(slot)::before,
	${_}::part(slot)::after {
		background: rgba(0, 255, 0, .5);
		align-self: stretch;
	}

	${_}::part(scrollbutton-up),
	${_}::part(scrollbutton-down) {
		opacity: 1 !important;
		background: rgba(0,128,0,.5);
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
${debug == 2 ? `
	#TabsToolbar {
		--tabs-item-opacity-transition: 1s ease;
	}
	${_="#tabbrowser-tabs"}, #tabbrowser-arrowscrollbox {
		clip-path: none !important;
	}

	${_}[closing-tab-ignore-newtab-width] {
		outline: 5px solid lime;
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

	@media (prefers-reduced-motion: no-preference) {
		#tabbrowser-tabs[movingtab] ${_=".tabbrowser-tab"}[fadein]:not([selected]):not([multiselected]),
		${_}:is([multiselected-move-together], [tab-grouping], [tabdrop-samewindow]) {
			transition: transform 1000ms ease;
		}
	}
	${_}::after,
	${_}::before {
		--line: 1px solid rgba(128,128,128,.5);
		content: "";
		position: absolute;
		z-index: 1;
	}
	${_}::after {
		top: 0; bottom: 0;
		left: 50%;
		border-left: var(--line);
	}
	${_}::before {
		left: 0; right: 0;
		top: 50%;
		border-top: var(--line);
	}
` : ``}
`;
}

{
	let observer = new ResizeObserver(() => root.style.setProperty("--nav-toolbox-height",
			gNavToolbox.getBoundingClientRect().height + "px"));

	function onLwtChange() {
		root.style.removeProperty("--multirows-background-position");
		let bgPos = getComputedStyle(gNavToolbox).backgroundPosition;
		let hasChanged;
		bgPos = bgPos.split(", ").map(s => {
			s = s.split(" ");
			if (s[1] != "0%" && s[1].includes("%")) {
				hasChanged = true;
				s[1] = `calc(${s[1].replace(/calc\(|\)/g, "")
					.replace(/\d+%/g, m => "(var(--nav-toolbox-height) - var(--multirows-background-size)) * " +  parseFloat(m) / 100)})`;
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
	slot.part.add("slot");
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
				scrollbar.addEventListener("mouseover", e => tabsBar.setAttribute("tabs-scrollbar-hovered", ""), true);
				scrollbar.addEventListener("mouseout", e => tabsBar.removeAttribute("tabs-scrollbar-hovered"), true);
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
			log("snap", remainder);
			arrowScrollbox.removeAttribute("scrollsnap");
			clearTimeout(snapTimeout);
			snapTimeout = setTimeout(() => {
				arrowScrollbox.setAttribute("scrollsnap", "");
				snapTimeout = setTimeout(() => {
					arrowScrollbox.removeAttribute("scrollsnap");
					arrowScrollbox._isScrolling = false;
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
			let {stack} = new Error();
			let dragScroll = stack.match(/on_dragover@chrome:\/\/browser\/content\/tabbrowser[/-]tabs\.js/);
			//ensure the scrolling performs one by one when dragging tabs
			if (dragScroll) {
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
	scrollbox.addEventListener("overflow", onFlowChange, true);
	scrollbox.addEventListener("underflow", onFlowChange, true);

	function onFlowChange(e) {
		if (e.originalTarget != this)
			return;

		time(`scrollbox ${e.type} ${e.detail}`);

		let overflow = this.scrollTopMax;
		tabsBar.style[overflow ? "setProperty" : "removeProperty"]("--tabs-scrollbar-width", scrollbarWidth + "px");

		//don't consider it can overflow if there is only one tab,
		//in case the new tab button is wrapped in extreme case and cause overflow
		overflow &&= gBrowser.visibleTabs.length > 1

		let toggleAttr = overflow ? "setAttribute" : "removeAttribute";
		arrowScrollbox[toggleAttr]("overflowing", true, true);
		tabContainer[toggleAttr]("overflow", true);

		tabsBar.toggleAttribute("tabs-overflow", overflow);
		tabsBar.toggleAttribute("tabs-hide-placeholder", overflow && prefs.tabsUnderControlButtons < 2);

		timeLog(`scrollbox ${e.type} ${e.detail}`, "update status");

		arrowScrollbox._updateScrollButtonsDisabledState();

		//overflow may fired when moving tab then locking the slot
		if (overflow) {
			if (!tabContainer.hasAttribute("movingtab")) {
				tabContainer._unlockTabSizing(true);
				tabContainer._handleTabSelect(true);
			}
		} else
			for (let tab of gBrowser._removingTabs)
				gBrowser.removeTab(tab);

		document.getElementById("tab-preview-panel")?.[toggleAttr]("rolluponmousewheel", true);

		tabContainer._updateInlinePlaceHolder();
		tabContainer._updateCloseButtons();

		timeEnd(`scrollbox ${e.type} ${e.detail}`);
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

	let {getAttribute, removeAttribute, toggleAttribute, setAttribute, dispatchEvent,
			on_wheel, on_scroll, on_scrollend} = arrowScrollbox;

	//Take charge and not let the ResizeObserver in the constructor of MozArrowScrollbox do anything stupid about
	//the determination of overflow and event dispatching.
	//When the window is expanded and the box changes from being forced to be in one row, to being able to be in multi-rows,
	//the block may bounce very violently
	arrowScrollbox.dispatchEvent = function({type}) {
		if (["overflow", "underflow"].includes(type)) return false;
		return dispatchEvent.apply(this, arguments);
	};

	if (appVersion == 115)
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
		log(scrollTop, _lastScrollTop);
		if (tabContainer.matches("[tabmousedown], [dragging]")) {
			fakeScrollbar.scrollTop = scrollTop;
			if (tabContainer.hasAttribute("dragging"))
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
			this._isScrolling = false;

		if (appVersion != 115)
			this._updateScrollButtonsDisabledState();

		scrollbox._lastScrollTop = scrollTop;
	};

	arrowScrollbox.on_scrollend = function(e) {
		if (e.target != scrollbox) return;
		on_scrollend.apply(this, arguments);
		scrollbox._ensureSnap();
		log(e.type);
	};

	let minWheelDelta = Infinity;
	arrowScrollbox.on_wheel = function(e) {
		if (this._isScrolling || !this.overflowing)
			return;
		let {deltaY} = e;
		minWheelDelta = Math.min(minWheelDelta, Math.abs(deltaY));
		scrollbox.scrollBy({
			top: deltaY / minWheelDelta * tabHeight * restrictScroll(prefs.linesToScroll),
			behavior: gReduceMotion ? "instant" : "smooth",
		});
		e.stopPropagation();
		e.preventDefault();
	};
	if (appVersion == 115) {
		arrowScrollbox.removeEventListener("wheel", on_wheel);
		arrowScrollbox.addEventListener("wheel", arrowScrollbox.on_wheel);
	}

	Object.defineProperty(arrowScrollbox, "lockScroll", {
		get: function() {return this.hasAttribute("lockscroll")},
		set: function(v) {
			if (this.lockScroll == v) return;
			let update = () => this.toggleAttribute("lockscroll", !!v);
			if (this._isScrolling)
				scrollbox.addEventListener("scrollend", function f(e) {
					if (e.target != scrollbox) return;
					scrollbox.removeEventListener("scrollend", f, true);
					update();
				}, true);
			else
				update();
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

//the original scrollIntoView always scroll to ensure the tab is on the first visible row,
//for instance, when scrolling the box and the cursor touch the selected tab, will cause an annoying bouncing,
//fix it to be ensuring the tab is in view, if it already is, do nothing.
//use getRect() instead of getBoundingClientRect(), since when dragging tab too fast the box will scroll to half row
//because _handleTabSelect will try to scroll the translated position into view
customElements.get("tabbrowser-tab").prototype.scrollIntoView = function({behavior} = {}) {
	let rect = getRect(this);
	let boxRect = getRect(scrollbox);
	let {scrollbarWidth} = scrollbox;
	if (!tabsBar.hasAttribute("tabs-hide-placeholder") && tabContainer.overflowing) {
		let preTabs = getRect(tabContainer._placeholderPreTabs, {box: "content", visible: true});
		let postTabs = getRect(tabContainer._placeholderPostTabs, {box: "content", visible: true});
		let newTab = getRect(tabContainer._placeholderNewTabButton, {box: "content", visible: true});
		if (!(prefs.hideEmptyPlaceholderWhenScrolling && tabsBar.hasAttribute("tabs-is-first-visible"))
				&& preTabs.widthDouble && pointDelta(rect.top, preTabs.bottom) < 0 && pointDeltaH(rect.start, preTabs.end) < 0)
			boxRect.top = preTabs.bottom;
		else if (postTabs.widthDouble && pointDelta(rect.top, postTabs.bottom) < 0 && pointDeltaH(rect.end, postTabs.start) > 0)
			boxRect.top = postTabs.bottom;
		else if (newTab.widthDouble && pointDelta(rect.bottom, newTab.top) > 0 && pointDeltaH(rect.end, newTab.start) > 0)
			boxRect.bottom = newTab.top;
	}
	let top = rect.top - boxRect.top;
	let bottom = rect.bottom - boxRect.bottom;
	if (top < 0 || bottom > 0) {
		//prevent scrollsnap from causing bouncing
		if (behavior != "instant" && !gReduceMotion) {
			let done;
			arrowScrollbox._stopScrollSnap = true;
			scrollbox.addEventListener("scrollend", f, true);
			setTimeout(() => {
				if (done) return;
				cleanUp();
				console.error("scrollend is not fired");
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
};

{
	let {
		startTabDrag, on_dragover, on_dragend, on_drop, on_dragleave,
		_animateTabMove, _finishAnimateTabMove, _unlockTabSizing, _updateCloseButtons,
		_handleTabSelect, uiDensityChanged,
	} = tabContainer;
	let passingByTimeout;
	// let MozTabbrowserTabs = customElements.get("tabbrowser-tabs") ;

	// [
		// "#clearDragOverCreateGroupTimer", "#triggerDragOverCreateGroup",
		// "#setDragOverGroupColor",
	// ].forEach(m => exposePrivateMethod(MozTabbrowserTabs, m, `
		// const TAB_PREVIEW_PREF = "browser.tabs.hoverPreview.enabled";
		// const DIRECTION_BACKWARD = -1;
		// const DIRECTION_FORWARD = 1;
		// const GROUP_DROP_ACTION_CREATE = 0x1;
		// const GROUP_DROP_ACTION_APPEND = 0x2;
	// `));

	if (!("overflowing" in tabContainer)) //fx 115
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
	[...document.querySelectorAll(".titlebar-spacer, .tabs-placeholder")].forEach(ele =>
			ele.addEventListener("dblclick", ondblclick, true));
	function ondblclick(e) {
		if (e.buttons) return;
		switch (windowState) {
			case STATE_MAXIMIZED: restore(); break;
			case STATE_NORMAL: maximize(); break;
		}
	}

	//the original function modifies --tab-overflow-pinned-tabs-width and cause undesired size changing of the slot,
	//which will cause weird bouncing of the scroll position,
	//plus the positioning is not the same logic, thus rewrite it and not wrap it.
	tabContainer._positionPinnedTabs = function(numPinned = gBrowser.pinnedTabCount) {
		if (this._hasTabTempMaxWidth || !numPinned && !this._lastNumPinned
				|| appVersion == 115 && new Error().stack.includes("_initializeArrowScrollbox/<@chrome://browser/content/tabbrowser-tabs.js"))
			return;

		time("_positionPinnedTabs - calculation");

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
		let {visibleTabs} = gBrowser;
		let tabs = visibleTabs;
		//not using arrowScrollbox.overflowing in case it is not updated in time
		let floatPinnedTabs = numPinned && tabs.length > numPinned && scrollbox.scrollTopMax;
		let {tabsUnderControlButtons} = prefs;
		if (this._isCustomizing)
			tabsUnderControlButtons = 0;

		if (floatPinnedTabs) {
			width = (layoutData.width ||= getRect(tabs[0]).widthDouble);
			preTabsItemsSize = getRect(this._placeholderPreTabs, {box: "margin", visible: true}).widthDouble;
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
			let boxWidth = getRect(this, {box: "padding"}).widthDouble;
			floatPinnedTabs = columns * width + gap + getTabMinWidth() + this.newTabButton.clientWidth
					+ getRect(this._placeholderPostTabs, {box: "content", visible: true}).widthDouble + scrollbox.scrollbarWidth
							<= boxWidth;
			wrapPlaceholder = floatPinnedTabs && columns * width + gap >= preTabsItemsSize;
			// //TODO remove if all ok
			// if (debug)
				// log({
					// isPositioned, floatPinnedTabs, columns, rows, spacers,
					// atLeastOneTab: pinnedNetSize + getTabMinWidth() <= boxWidth,
					// expectWidth: pinnedNetSize + getTabMinWidth(),
					// pinnedNetSize, boxWidth,
					// preTabsItemsSize,
					// placeholder: getRect(this._placeholderPostTabs, {box: "content", visible: true}).widthDouble,
				// });
		}

		timeEnd("_positionPinnedTabs - calculation");

		time("_positionPinnedTabs - update");


		if (this._lastNumPinned != numPinned) {
			this.toggleAttribute("haspinnedtabs", numPinned);
			this._lastNumPinned = numPinned;
			this._handleTabSelect(true);
		}

		if (!isPositioned && floatPinnedTabs)
			slot.style.minHeight = tabHeight * (maxRows + 1) + "px";

		this.removeAttribute("forced-overflow");
		this.style.removeProperty("--forced-overflow-adjustment");

		this.toggleAttribute("positionpinnedtabs", floatPinnedTabs);
		tabsBar.toggleAttribute("positionpinnedtabs", floatPinnedTabs);
		tabsBar.toggleAttribute("pinned-tabs-wraps-placeholder", !!wrapPlaceholder);

		tabs = tabs.slice(0, numPinned);
		if (floatPinnedTabs) {
			this.style.setProperty("--tab-overflow-pinned-tabs-width", columns * width + "px");

			if (!isPositioned) {
				let lastTab = visibleTabs.at(-1);
				let lastTabRect = getRect(lastTab);
				let slotRect = getRect(slot);
				//innerWidth: 1740, numPinned: 3, expansion: -80px -182px
				if (lastTabRect.bottom < slotRect.bottom) {
					//TODO count tag-group
					let lastRowTabsCount = visibleTabs.length - visibleTabs.findLastIndex(t => t.screenY != lastTabRect.top) - 1;
					this.setAttribute("forced-overflow", "");
					this.style.setProperty("--forced-overflow-adjustment",
							slotRect.widthDouble - (lastRowTabsCount - 1) * getTabMinWidth() + "px");
					log("positionpinnedtabs makes underflow!");
				}
			}

			slot.style.minHeight = "";

			tabs.forEach((tab, i) => {
				i += spacers + Math.max(columns - numPinned, 0);
				assign(tab.style, {
					marginInlineStart: -((columns - i % columns) * width + gap) + "px",
					marginTop: Math.floor(i / columns) * tabHeight + "px",
				});
				tab._pinnedUnscrollable = true;
			});

			log(`position pinned tabs`, true, {columns, spacers, numPinned});
		} else if (isPositioned || forcedOverflow) {
			log(`position pinned tabs`, false);

			for (let tab of tabs) {
				assign(tab.style, {marginTop: "", marginInlineStart: ""});
				tab._pinnedUnscrollable = false;
			}
			this.style.removeProperty("--tab-overflow-pinned-tabs-width");
		}

		trace();

		timeEnd("_positionPinnedTabs - update");
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
				let {scrollTop} = scrollbox;
				let {screenX, screenY} = e;
				this._lastMouseDownData = {
					tab,
					tabRect: getRect(tab),
					atTabX: screenX - tab.screenX,
					atTabY: screenY - tab.screenY,
					scrollPos: scrollTop,
					screenX,
					screenY,
					oriScreenX: screenX,
					oriScreenY: screenY,
				};
				this.setAttribute("tabmousedown", "");
				fakeScrollbar.style.setProperty("--slot-height", slot.clientHeightDouble + "px");
				fakeScrollbar.scrollTop = scrollTop;
				//mouseup will not be fired in many cases, but mouseleave always will
				//TODO: touch event may have similar problem
				tabContainer.addEventListener("mouseleave", function f(e) {
					if (e.target != this) return;
					this.removeEventListener("mouseleave", f, true);
					up.call(tabContainer, e);
				}, true);
			}
		}

		function up(e) {
			if (e.type == "mouseup" && e.button || e.type == "touchend" && e.touches.length)
				return;
			if (this._lastMouseDownData) {
				delete this._lastMouseDownData;
				this.removeAttribute("tabmousedown");
				fakeScrollbar.style.removeProperty("--slot-height");
			}
		}
	}

	tabContainer.startTabDrag = function(e, tab) {
		//don't execute the original #moveTogetherSelectedTabs, which can't be replaced
		let {multiselected} = tab;
		if (multiselected) {
			this._groupSelectedTabs(tab);
			tab.removeAttribute("multiselected");
		}

		startTabDrag.apply(this, arguments);

		//if it is from tab list, there is no mouse down data
		let data = this._lastMouseDownData;
		if (data) {
			let curPos = getRect(tab), prvPos = data.tabRect;
			if (curPos.left != prvPos.left || prvPos.top != curPos.top)
				this._resetAnimateTabMove();
			assign(tab._dragData, data);
		}

		delete this._lastMouseDownData;
		fakeScrollbar.style.removeProperty("--slot-height");

		//fix the movingTabs as the original is told that there is no multiselect
		if (multiselected) {
			let {pinned} = tab;
			tab._dragData.movingTabs = gBrowser.selectedTabs.filter(t => t.pinned == pinned);
			tab.setAttribute("multiselected", true);
		}
	};

	let MOVE_TOGETHER_SELECTED_TABS_DATA = appVersion < 133 ? "groupingTabsData" : "_moveTogetherSelectedTabsData";
	let MULTISELECTED_MOVE_TOGETHER = appVersion < 133 ? "tab-grouping" : "multiselected-move-together";

	//since the original _groupSelectedTabs will modify the transform property
	//and cause improper transition animation,
	//rewite the whole _groupSelectedTabs and not execute the original one
	tabContainer._groupSelectedTabs = function(draggedTab) {
		time("_groupSelectedTabs");

		let {pinned} = draggedTab;
		let {selectedTabs, visibleTabs} = gBrowser;
		let animate = !gReduceMotion;

		draggedTab[MOVE_TOGETHER_SELECTED_TABS_DATA] = {finished: !animate};

		let tranInfos = {};

		let pinnedTabs = [], normalTabs = [];
		for (let t of selectedTabs)
			(t.pinned ? pinnedTabs : normalTabs).push(t);
		[
			[pinnedTabs, pinned ? draggedTab : pinnedTabs.at(-1)],
			[normalTabs, pinned ? normalTabs[0] : draggedTab],
		].forEach(([tabs, centerTab]) => {
			if (!centerTab) return;

			let {_tPos} = centerTab;
			let centerIdx = visibleTabs.indexOf(centerTab);
			let centerIdxInTabs = tabs.indexOf(centerTab);
			let basedIdx = centerIdx - centerIdxInTabs;
			let basedPos = _tPos - centerIdxInTabs;
			tabs.forEach((movingTab, i) => {
				if (movingTab == centerTab) {
					if (movingTab != draggedTab)
						movingTab[MOVE_TOGETHER_SELECTED_TABS_DATA] = {};
				} else if (animate) {
					movingTab[MOVE_TOGETHER_SELECTED_TABS_DATA] = {};
					addAnimationData(movingTab, basedIdx + i, basedPos + i, centerIdx, movingTab._tPos < _tPos);
				} else
					gBrowser.moveTabTo(movingTab, basedPos + i);
			});
		});

		function addAnimationData(movingTab, newIndex, newPos, centerIdx, beforeCenter) {
			let oldIndex = visibleTabs.indexOf(movingTab);
			if (oldIndex == newIndex)
				return;

			assign(movingTab[MOVE_TOGETHER_SELECTED_TABS_DATA], {
				indexShift: newIndex - oldIndex,
				animate: true,
			});
			movingTab.setAttribute(MULTISELECTED_MOVE_TOGETHER, true);

			if (!animate)
				postTransitionCleanup();
			else
				movingTab.addEventListener("transitionend", function f(e) {
					if (e.propertyName != "transform" || e.originalTarget != movingTab)
						return;
					movingTab.removeEventListener("transitionend", f);
					postTransitionCleanup();
				});

			function postTransitionCleanup() {
				let data = movingTab[MOVE_TOGETHER_SELECTED_TABS_DATA];
				//the gropping may be aborted
				if (data)
					assign(data, {newIndex: newPos, animate: false});
			}

			let lowerIndex = Math.min(oldIndex, centerIdx);
			let higherIndex = Math.max(oldIndex, centerIdx);

			for (let i = lowerIndex + 1; i < higherIndex; i++) {
				let middle = visibleTabs[i];

				if (middle.pinned != movingTab.pinned)
					break;

				if (middle.multiselected)
					continue;

				if (!middle[MOVE_TOGETHER_SELECTED_TABS_DATA] || !("indexShift" in middle[MOVE_TOGETHER_SELECTED_TABS_DATA]))
					middle[MOVE_TOGETHER_SELECTED_TABS_DATA] = {indexShift: 0};

				middle[MOVE_TOGETHER_SELECTED_TABS_DATA].indexShift += beforeCenter ? -1 : 1;
				middle.setAttribute(MULTISELECTED_MOVE_TOGETHER, true);
			}
		}

		visibleTabs.forEach((tab, i) => {
			let shift = tab[MOVE_TOGETHER_SELECTED_TABS_DATA]?.indexShift;
			if (shift)
				addTransformInfo({
					infos: tranInfos,
					pos: tab._tPos,
					tabRect: getRect(tab),
					targetRect: getRect(visibleTabs[i + shift]),
				});
		});

		setTransform(tranInfos, visibleTabs);

		timeEnd("_groupSelectedTabs");
	};

	let FINISH_MOVE_TOGETHER_SELECTED_TABS = appVersion < 133 ? "_finishGroupSelectedTabs" : "_finishMoveTogetherSelectedTabs";
	let _finishMoveTogetherSelectedTabs = tabContainer[FINISH_MOVE_TOGETHER_SELECTED_TABS];

	//original function doesn't perform a transition when the grouping is aborted
	tabContainer[FINISH_MOVE_TOGETHER_SELECTED_TABS] = function(tab) {
		let toHandle = tab[MOVE_TOGETHER_SELECTED_TABS_DATA] && !tab[MOVE_TOGETHER_SELECTED_TABS_DATA].finished;
		let {visibleTabs} = gBrowser;
		if (toHandle) {
			time("_finishGroupSelectedTabs");

			cleanUpTransform();

			let abortedAnimateTab = gBrowser.selectedTabs.find(t => t[MOVE_TOGETHER_SELECTED_TABS_DATA] && t[MOVE_TOGETHER_SELECTED_TABS_DATA].animate);
			if (abortedAnimateTab) {
				//block the removing of attribute [tab-grouping] until transition ended
				let {removeAttribute, toggleAttribute} = abortedAnimateTab.__proto__;
				assign(abortedAnimateTab.__proto__, {
					removeAttribute: function(n) {
						if (n == MULTISELECTED_MOVE_TOGETHER) return;
						removeAttribute.call(this, n);
					},
					toggleAttribute: function(n) {
						if (n == MULTISELECTED_MOVE_TOGETHER) return;
						return toggleAttribute.apply(this, arguments);
					},
				});
				let finished;
				let onTransitionEnd = e => {
					if (e.propertyName != "transform" || e.originalTarget != abortedAnimateTab)
						return;
					postTransitionCleanup();
				};
				let postTransitionCleanup = () => {
					finished = true;
					abortedAnimateTab.removeEventListener("transitionend", onTransitionEnd);
					assign(abortedAnimateTab.__proto__, {removeAttribute, toggleAttribute});
					visibleTabs.forEach(t => t.removeAttribute(MULTISELECTED_MOVE_TOGETHER));
					tabContainer._handleTabSelect(true);
				};
				abortedAnimateTab.addEventListener("transitionend", onTransitionEnd);
				//in case the animation is not performed
				setTimeout(() => {
					if (finished) return;
					postTransitionCleanup();
					console.error("transition is not ended");
				}, debug == 2 ? 3000: 300);
			}

			timeEnd("_finishGroupSelectedTabs");
		}
		_finishMoveTogetherSelectedTabs.apply(this, arguments);
	};

	tabContainer.on_dragover = function(e) {
		let dt = e.dataTransfer;
		let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
		let sameWindow = draggedTab?.ownerDocument == document;
		let copy = dt.dropEffect == "copy";
		let animate = draggedTab && sameWindow && !copy;

		tabsBar.toggleAttribute("tabs-dragging-ext", !animate);

		if (!this.hasAttribute("dragging")) {
			time("on_dragover - setup");
			this.setAttribute("dragging", "");
			tabsBar.setAttribute("tabs-dragging", "");
			this.removeAttribute("tabmousedown");
			lockSlotSize();
			arrowScrollbox.lockScroll = true;
			clearTimeout(passingByTimeout);
			passingByTimeout = setTimeout(() => {
				arrowScrollbox.lockScroll = false;
				if (this.hasAttribute("multirows")) {
					let panel = document.getElementById("customizationui-widget-panel");
					if (panel) {
						let panelRect = getRect(panel), tabsRect = getRect(this);
						if (!(pointDelta(panelRect.bottom, tabsRect.top) <= 0
								|| pointDelta(panelRect.top, tabsRect.bottom) >= 0
								|| pointDeltaH(panelRect.end, tabsRect.start) <= 0
								|| pointDeltaH(panelRect.start, tabsRect.end) >= 0))
							panel.hidePopup();
					}
				}
			}, this._dragOverDelay);
			fakeScrollbar.scrollTop = scrollbox.scrollTop;

			if (animate)
				if (tabGroupsEnabled() && getRowCount(true) == 1)
					//apply the original animation handler
					assign(this, {_animateTabMove, _finishAnimateTabMove});
				else if (hasTabGoups() && !draggedTab?.pinned) {
					//disable _animateTabMove as we don't want to bother with it
					draggedTab._dragData.fromTabList = true;
				}

			timeEnd("on_dragover - setup");
		}

		let ind = this._tabDropIndicator;

		time("original on_dragover");

		//when copying tab in the same window,
		//the original on_dragover hide the indicator (modify DOM), measure arrowScrollbox,
		//and show the indicator (modify DOM again), cause serious reflow problem and terribly lag.
		let hidden;
		let opd = Object.getOwnPropertyDescriptor(ind, "hidden")
				|| Object.getOwnPropertyDescriptor(ind.__proto__, "hidden");
		Object.defineProperty(ind, "hidden", {set: v => hidden = v, configurable: true});

		on_dragover.apply(this, arguments);

		Object.defineProperty(ind, "hidden", opd);
		if (hidden != null)
			ind.hidden = hidden;

		timeEnd("original on_dragover");

		if (hidden) return;

		time("on_dragover - update indicator");

		let pos = this._getDropIndex(e);
		let {visibleTabs} = gBrowser;
		let target = this._getDragTargetTab(e);
		let numPinned = gBrowser.pinnedTabCount;
		let lastTab = visibleTabs.at(-1);
		let lastPos = lastTab._tPos;
		let firstNormalTab = visibleTabs[numPinned];
		let useEnd;

		if (!this.hasAttribute("movingtab")) {
			if (draggedTab?._dragData.fromTabList && sameWindow && !copy) {
				if (draggedTab.pinned) {
					lastTab = visibleTabs[numPinned - 1];
					lastPos = lastTab._tPos;
					if (!target?.pinned)
						pos = numPinned;
				} else if (!target)
					pos = lastPos + 1;
				else if (target.pinned)
					pos = numPinned;
			} else if (target?.pinned && (!draggedTab || sameWindow))
				//dragging external thing or copying tabs
				pos = numPinned;

			if (pos > lastPos) {
				if (lastTab.getBoundingClientRect().bottom > scrollbox.getBoundingClientRect().bottom)
					pos = -1;
			} else if (pos == numPinned || pos == firstNormalTab._tPos) {
				target = firstNormalTab;
				if (firstNormalTab.getBoundingClientRect().top < scrollbox.getBoundingClientRect().top)
					pos = -1;
			}
		}

		if (pos < 0) {
			ind.hidden = true;
			timeEnd("on_dragover - update indicator");
			return;
		}

		let rect = getRect(arrowScrollbox);
		let newMarginX, newMarginY;

		let tabRect;

		if (pos > lastPos) {
			tabRect = getRect(lastTab);
			useEnd = true;
		} else {
			let targetRect = getRect(target);
			let nextTab = visibleTabs.find(t => t._tPos >= pos);
			tabRect = getRect(nextTab);
			if (targetRect.top != tabRect.top &&
					(!target.pinned || nextTab.pinned)) {
				useEnd = true;
				tabRect = targetRect;
			}
		}
		newMarginX = tabRect[useEnd ? "end" : "start"] - rect.start;
		newMarginY = tabRect.top + tabRect.heightDouble - rect.top - rect.heightDouble;
		newMarginY += rect.heightDouble / 2 - tabRect.heightDouble / 2;

		ind.style.transform = `translate(calc(${newMarginX}px + 50% * ${DIR}), ${newMarginY}px)`;

		timeEnd("on_dragover - update indicator");
	};

	//since the original _animateTabMove will modify the transform property and cause improper transition animation,
	//rewite the whole _animateTabMove and not execute the original one
	tabContainer._animateTabMove = function(e) {
		time("_animateTabMove");

		let draggedTab = e.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);
		let {_dragData, pinned} = draggedTab;
		let {screenX: eX, screenY: eY} = e;

		let {movingTabs} = _dragData;
		let movingPositionPinned = pinned && this.hasAttribute("positionpinnedtabs");
		let scrollOffset = movingPositionPinned ? 0 : scrollbox.scrollTop;

		//update the attribute first to ensure a reflow before querying the position of tabs.
		//don't know why the position is incorrect when moving the first tab in each row together.
		//setting the attribute first can fix this problem.
		//setup the attributes at the end can save 10ms+ reflow time though.
		if (!this.hasAttribute("movingtab")) {
			this.toggleAttribute("moving-positioned-tab", movingPositionPinned);
			tabsBar.toggleAttribute("moving-positioned-tab", movingPositionPinned);
			this.toggleAttribute("movingsingletab", _dragData.movingTabs.length == 1);
			this.setAttribute("movingtab", true);
			tabsBar.setAttribute("movingtab", "");
			gNavToolbox.setAttribute("movingtab", true);
			if (!draggedTab.multiselected)
				this.selectedItem = draggedTab;
		}

		//the animate maybe interrupted and restart, don't initialize again
		if (!("lastScreenX" in _dragData)) {
			let {visibleTabs, pinnedTabCount: numPinned} = gBrowser;
			let boxStart, boxEnd, placeholderWidth = 0;
			let {top: boxTop, bottom: boxBottom} = getRect(scrollbox);
			let tabs = visibleTabs.slice(
				pinned ? 0 : numPinned,
				pinned ? numPinned : undefined
			);
			if (movingPositionPinned) {
				let rowEnd = tabs[0];
				for (let i = 1, n = tabs.length; i < n && pointDeltaH(rowEnd.screenX, tabs[i].screenX) < 0; i++)
					rowEnd = tabs[i];
				let rowStart = tabs.at(-1);
				for (let i = tabs.length - 2; i > -1 && pointDeltaH(rowStart.screenX, tabs[i].screenX) > 0; i--)
					rowStart = tabs[i];
				boxStart = getRect(rowStart).start;
				boxEnd = getRect(rowEnd).end;
			} else {
				({start: boxStart, end: boxEnd} = getRect(slot));
				placeholderWidth = parseFloat(getComputedStyle(slot, "::after").width) || 0;
			}

			let idxInMoving = movingTabs.indexOf(draggedTab);
			let firstMoving = movingTabs[0];
			let lastMoving = movingTabs.at(-1);
			let movingCount = movingTabs.length;
			let movingAfterCount = movingCount - 1 - idxInMoving;

			assign(_dragData, {
				visibleTabs, numPinned,
				winSX: root.screenX,
				winSY: root.screenY,
				draggedTabIdx: tabs.indexOf(draggedTab),
				firstMoving, lastMoving,
				firstMovingIdx: tabs.indexOf(firstMoving),
				lastMovingIdx: tabs.indexOf(lastMoving),
				movingBeforeCount: idxInMoving,
				movingAfterCount,
				movingCount,
				first: tabs[idxInMoving],
				last: tabs.at(movingAfterCount * -1 - 1),
				tabs,
				tabRects: Object.fromEntries(tabs.map(t => {
					let r = getRect(t, {visual: true});
					r.top += scrollOffset;
					r.bottom += scrollOffset;
					return [t._tPos, r];
				})),
				singleRow: getRowCount() == 1,
				boxStart, boxEnd, boxTop, boxBottom,
				placeholderStart: boxEnd - placeholderWidth * DIR,
				placeholderBottom: boxTop + (placeholderWidth && tabHeight),
			});

			timeLog("_animateTabMove", "init");
			log(_dragData);
		}

		let {tabs, tabRects} = _dragData;

		//TODO: Tag position/size change detection is not perfect and may result in false positives,
		//and the reset calculation of _resetAnimateTabMove does not work with moving tab usually...
		//just left here for reference
		/*{
			let needReset = tabs.length != (pinned ? numPinned : visibleTabs.length - numPinned);
			if (!needReset) {
				let {abs} = Math;
				let lastTab = visibleTabs.at(-1);
				for (let i in tabs) {
					let t = tabs[i];
					if (t == visibleTabs[+i + (pinned ? 0 : numPinned)]) {
						let nr = getRect(t), or = rect(t);
						if (abs(or.left - nr.left) <= 1 && abs(or.top - nr.top) <= 1
								&& (t != lastTab || abs(or.width - nr.width - parseFloat(t.style.getPropertyValue("--moving-tab-width-adjustment") || 0)) <= 1))
							continue;
					}
					needReset = t;
					break;
				}
			}
			if (needReset) {
				log("_animateTabMove has tab changed", needReset);
				_dragData.lastScreenX = eX;
				this._resetAnimateTabMove();
				timeEnd("_animateTabMove");
				return;
			}
		}*/

		if (eX == _dragData.lastScreenX && eY == _dragData.lastScreenY
				&& !arrowScrollbox._isScrolling) {
			timeEnd("_animateTabMove");
			return;
		}

		assign(_dragData, {lastScreenX: eX, lastScreenY: eY});

		let {
			visibleTabs, numPinned,
			winSX, winSY, atTabX, atTabY,
			boxStart, boxEnd, boxTop, boxBottom,
			placeholderBottom, placeholderStart,
			singleRow, firstMoving, lastMoving,
			movingBeforeCount, movingAfterCount, movingCount,
			first, last, firstMovingIdx, lastMovingIdx, draggedTabIdx,
		} = _dragData;

		placeholderBottom -= scrollOffset;

		//the box may scroll thus didn't cache these things
		let {start: firstStart, end: firstEnd, top: firstTop, bottom: firstBottom} = rect(first);
		let {start: lastStart, end: lastEnd, top: lastTop, bottom: lastBottom} = rect(last);
		let {start: draggedStart, end: draggedEnd, top: draggedTop, bottom: draggedBottom,
				height: draggedHeight, width: draggedWidth, widthDouble: draggedWidthDouble} = rect(draggedTab);

		let virtualStart = eX - atTabX;
		let virtualEnd = virtualStart + draggedWidth;
		let virtualCenterX = (virtualStart + virtualEnd) / 2;
		let virtualCenterY = eY - atTabY + draggedHeight / 2;
		if (RTL_UI)
			[virtualStart, virtualEnd] = [virtualEnd, virtualStart];

		let tranShift = 0, tranWidth = 0;
		let tranX, tranY, tranCenterX, tranCenterY;
		let target, targetIdx, targetWidth, targetStart, targetTop;
		let getTranslate = () => {
			let noSpaceBtwnFirstLast = pointDeltaH(virtualEnd, virtualStart) > pointDeltaH(lastEnd, firstStart)
					&& pointDelta(lastTop, firstBottom) < tabHeight;
			let startBound = (pointDelta(virtualCenterY, firstBottom) < 0 || singleRow ?
					firstStart : (pointDelta(lastBottom, virtualCenterY) <= 0 && pointDelta(virtualCenterY, boxBottom) < 0 ? lastStart : boxStart))
							- draggedStart;
			let endBound = (pointDelta(virtualCenterY, lastTop) >= 0 ?
					lastEnd : (pointDelta(virtualCenterY, firstTop) < 0 && pointDelta(boxTop, virtualCenterY) <= 0 ?
									firstEnd : (pointDelta(virtualCenterY, placeholderBottom) < 0 ? placeholderStart : boxEnd)))
							- draggedEnd - tranWidth * DIR;
			let topBound = (pointDeltaH(boxStart, firstStart) < 0
							&& (pointDeltaH(virtualStart, firstStart) < 0 || noSpaceBtwnFirstLast)
							&& pointDelta(virtualCenterY, firstBottom) >= 0 ?
					firstBottom : (pointDeltaH(virtualEnd, placeholderStart) > 0
									&& pointDelta(virtualCenterY, placeholderBottom) >= 0
									&& pointDelta(firstTop, placeholderBottom) < 0 ?
							placeholderBottom : firstTop)) - draggedTop;
			let bottomBound = (pointDeltaH(lastEnd, boxEnd) < 0
							&& (pointDeltaH(lastEnd, virtualEnd) < 0 || noSpaceBtwnFirstLast)
							&& pointDelta(virtualCenterY, lastTop) < 0
							&& pointDelta(firstTop, virtualCenterY) <= 0 ?
					lastTop : lastBottom) - draggedBottom;

			let x = eX - _dragData.screenX + tranShift, y = eY - _dragData.screenY;
			if (!movingPositionPinned)
				y += scrollOffset - _dragData.scrollPos;
			tranX = Math[RTL_UI?"max":"min"](Math[RTL_UI?"min":"max"](x, startBound), endBound);
			tranY = Math.min(Math.max(y, topBound), bottomBound);

			tranCenterX = Math.round(draggedStart + tranX + (targetWidth || draggedWidth) / 2 * DIR);
			tranCenterY = Math.round(draggedTop + tranY + draggedHeight / 2);

			target = tabs.find(tab => {
				let r = rect(tab);
				return pointDeltaH(r.start, tranCenterX) <= 0 && pointDeltaH(tranCenterX, r.end) <= 0
						&& pointDelta(r.top, tranCenterY) <= 0 && pointDelta(tranCenterY, r.bottom) <= 0;
			});

			if (!target)
				//the dragged tab center is located at a gap between tabs
				return;

			({width: targetWidth, top: targetTop, start: targetStart} = rect(target));
			targetIdx = tabs.indexOf(target);
		};

		getTranslate();

		tranWidth = pointDelta(targetWidth, draggedWidthDouble);
		if (tranWidth) {
			tranShift = (RTL_UI ? draggedWidthDouble - atTabX : atTabX) * (1 - 1 / draggedWidthDouble * targetWidth) * DIR;
			virtualStart += tranShift;
			virtualEnd += tranShift + tranWidth * DIR;
			virtualCenterX = (virtualStart + virtualEnd) / 2;
			getTranslate();
		}

		//todo? the moving tabs won't follow the cursor when the dragged tab center located at a gap if we end here
		if (!target) {
			timeEnd("_animateTabMove");
			return;
		}

		let moveBackward = targetIdx < draggedTabIdx;
		let dropIdx = targetIdx + (moveBackward ? -movingBeforeCount : movingAfterCount + 1);
		_dragData.animDropIndex = tabs[dropIdx]?._tPos ?? visibleTabs.at(-1)._tPos + 1;

		let tranInfos = _dragData.transformInfos = {};
		tranInfos[draggedTab._tPos] = {
			width: targetWidth,
			delta: -tranWidth,
			x: tranX,
			y: tranY,
			finalX: targetStart - draggedStart,
			finalY: targetTop - draggedTop,
			floating: !pinned,
		};

		for (let tab of movingTabs)
			if (tab != draggedTab)
				addTransformInfo({
					infos: tranInfos,
					pos: tab._tPos,
					tabRect: rect(tab),
					targetRect: rect(tabs[targetIdx + tabs.indexOf(tab) - draggedTabIdx]),
					offsetX: tranX + draggedStart - targetStart,
					offsetY: tranY + draggedTop - targetTop,
					floating: !pinned,
				});

		let bgTabs = moveBackward ?
				tabs.slice(dropIdx, firstMovingIdx)
				: tabs.slice(lastMovingIdx + 1, dropIdx);

		for (let tab of bgTabs)
			addTransformInfo({
				infos: tranInfos,
				pos: tab._tPos ?? tab.parentNode.id,
				tabRect: rect(tab),
				targetRect: rect(tabs[tabs.indexOf(tab) + movingCount * (moveBackward ? 1 : -1)]),
			});

		setTransform(tranInfos, tabs, scrollOffset);

		timeEnd("_animateTabMove");

		function rect(tab) {
			let r = {...tabRects[tab._tPos]};
			r.top -= scrollOffset;
			r.bottom -= scrollOffset;
			return r;
		}

		if (debug) {
			tabs.forEach(t => t.style.outline = t.style.boxShadow = "");
			first.style.boxShadow = last.style.boxShadow = "0 0 0 1px inset red";
			target.style.outline = "1px solid lime";
			let insertPoint = tabs.find(t => t._tPos >= draggedTab._dragData.animDropIndex);
			insertPoint && (insertPoint.style.outline = "1px solid yellow");
			if (debug == 2) {
				let {style} = tabsBar;
				style.setProperty("--drag-x", virtualCenterX - winSX + "px");
				style.setProperty("--drag-y", virtualCenterY - winSY + "px");
				style.setProperty("--drag-tran-width", targetWidth + "px");
				style.setProperty("--drag-tran-x", tranCenterX - winSX + "px");
				style.setProperty("--drag-tran-y", tranCenterY - winSY + "px");
				style.setProperty("--drag-width", draggedWidth + "px");
			}
		}
	};

	function addTransformInfo({infos, pos, tabRect, targetRect, offsetX = 0, offsetY = 0, floating}) {
		let {widthDouble: width, top, start} = tabRect;
		let {width: tWidth, top: tTop, start: tStart} = targetRect;
		let finalX = tStart - start;
		let finalY = tTop - top;
		infos[pos] = {
			delta: pointDelta(width - tWidth),
			width: tWidth,
			x: finalX + offsetX,
			y: finalY + offsetY,
			finalX,
			finalY,
			floating,
		};
	}

	function setTransform(infos, tabs, scrollOffset = 0) {
		arrowScrollbox.style.setProperty("--scroll-top", scrollOffset + "px");
		for (let tab of tabs) {
			let {style} = tab;
			let o = infos[tab._tPos ?? tab.parentNode.id];
			style.transform = o ? `translate(${o.x}px, ${o.floating ? `calc(${o.y - scrollOffset}px + var(--scroll-top))` : o.y + "px"})` : "";
			if (!tab.pinned) {
				style.minWidth = style.maxWidth = o?.delta ? o.width + "px" : "";
				style[o?.delta ? "setProperty" : "removeProperty"]("--moving-tab-width-adjustment", o?.delta + "px");
			}
		}
	}

	function cleanUpTransform(tabs = gBrowser.visibleTabs.slice(gBrowser.pinnedTabCount)) {
		arrowScrollbox.style.removeProperty("--scroll-top");
		for (let tab of tabs) {
			let {style} = tab;
			style.minWidth = style.maxWidth = "";
			style.removeProperty("--moving-tab-width-adjustment");
		}
	}

	tabContainer.on_dragleave = function(e) {
		on_dragleave.apply(this, arguments);

		let target = event.relatedTarget;
		while (target && target != this)
			target = target.parentNode;
		if (!target)
			postDraggingCleanup();
	};

	tabContainer.on_dragend = function(e) {
		on_dragend.apply(this, arguments);
		postDraggingCleanup();
	};

	tabContainer.on_drop = function(event) {
		//as the _dragData.translatePos is not set during the modified _animateTabMove,
		//the finishing is not performed in the original on_dop,
		//do the modified finishing here
		let dt = event.dataTransfer;
		let {dropEffect} = dt;
		let draggedTab, _dragData, movingTabs, transformInfos;
		if (dt.mozTypesAt(0)[0] == TAB_DROP_TYPE) {
			draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
			if (draggedTab) {
				({_dragData} = draggedTab);
				({movingTabs, transformInfos} = _dragData);
			}
		}

		let transitions = [];
		let shouldHandle = dropEffect != "copy" && draggedTab?.container == this && transformInfos;
		let {_finishAnimateTabMove} = this, {moveTabTo} = gBrowser;
		if (shouldHandle) {
			time("on_drop");
			//prevent the original functions being called when the original on_drop performs later
			this._finishAnimateTabMove = gBrowser.moveTabTo = () => {};

			let dropIndex;
			if (_dragData.fromTabList)
				dropIndex = this._getDropIndex(event);
			else
				dropIndex = "animDropIndex" in _dragData && _dragData.animDropIndex;
			let incrementDropIndex = true;
			if (dropIndex && dropIndex > movingTabs[0]._tPos) {
				dropIndex--;
				incrementDropIndex = false;
			}

			let animate = !gReduceMotion;

			for (let tab of movingTabs) {
				let info = transformInfos[tab._tPos];
				let postTransitionCleanup = () => {
					tab.removeAttribute("tabdrop-samewindow");
					if (dropIndex !== false) {
						moveTabTo.call(gBrowser, tab, dropIndex);
						if (incrementDropIndex)
							dropIndex++;
					}
					gBrowser.syncThrobberAnimations(tab);
				};
				//in extremely special cases _animateTabMove() is not executed in time and the tab is dropped
				//thus there may be no transformInfos and need to check if it is not null
				if (info && (info.finalX != info.x || info.finalY != info.y) && animate) {
					tab.setAttribute("tabdrop-samewindow", true);
					transitions.push(new Promise(rs => tab.addEventListener("transitionend", function f(e) {
						if (e.propertyName != "transform" || e.originalTarget != tab)
							return;
						tab.removeEventListener("transitionend", f);
						postTransitionCleanup();
						rs();
					})));
					tab.style.transform = `translate(${info.finalX}px, ${info.finalY}px)`;
				} else
					postTransitionCleanup();
			}
			timeEnd("on_drop");
		}

		on_drop.apply(this, arguments);

		if (shouldHandle) {
			this._finishAnimateTabMove = _finishAnimateTabMove;
			gBrowser.moveTabTo = moveTabTo;
			//prevent start another dragging before the animate is done
			this.setAttribute("animate-finishing", "");
			Promise.all(transitions).then(() => {
				this._finishAnimateTabMove();
				this.removeAttribute("animate-finishing");
			});
		}

		postDraggingCleanup();
	};

	tabContainer._finishAnimateTabMove = function() {
		let transformedTabs;
		if (this.hasAttribute("movingtab")) {
			//if tab is dropped, animate-finishing should be set,
			//otherwise the dragging is aborted likely,
			//mark down the transformed tabs and perform a restoring animate
			if (!this.hasAttribute("animate-finishing") && !gReduceMotion)
				transformedTabs = gBrowser.visibleTabs.filter(tab => tab.style.transform);
			this.removeAttribute("moving-positioned-tab");
			this.removeAttribute("movingsingletab");
			tabsBar.removeAttribute("movingtab");
			tabsBar.removeAttribute("moving-positioned-tab");
			cleanUpTransform();
		}

		_finishAnimateTabMove.apply(this, arguments);

		if (transformedTabs) {
			this.setAttribute("animate-finishing", "");
			this.setAttribute("movingtab", true);

			Promise.all(transformedTabs.map(tab => new Promise(rs => {
				if (tab.selected || tab.multiselected) {
					tab.setAttribute("tabdrop-samewindow", "");
					if (tab.selected && tab._dragData)
						//force the _animateTabMove to update when the tab moving is restored
						tab._dragData.lastScreenX = -1;
				}
				let done;
				tab.addEventListener("transitionend", onAnimateDone);

				//in case the animation is not performed
				setTimeout(() => {
					if (done) return;
					cleanUp();
					console.error("transition is not ended", tab);
				}, debug == 2 ? 3000: 300);

				function onAnimateDone(e) {
					if (e.propertyName != "transform" || e.originalTarget != tab)
						return;
					done = true;
					cleanUp();
				}
				function cleanUp() {
					tab.removeEventListener("transitionend", onAnimateDone);
					tab.removeAttribute("tabdrop-samewindow");
					rs();
				}
			}))).then(() => {
				this.removeAttribute("movingtab");
				this.removeAttribute("animate-finishing");
			});
		}
	};

	let newAnimateFunctions = {_animateTabMove: tabContainer._animateTabMove, _finishAnimateTabMove: tabContainer._finishAnimateTabMove};

	function postDraggingCleanup() {
		clearTimeout(passingByTimeout);
		tabContainer.removeAttribute("tabmousedown");
		tabContainer.removeAttribute("dragging");
		tabsBar.removeAttribute("tabs-dragging");
		tabsBar.removeAttribute("tabs-dragging-ext");
		unlockSlotSize(true);
		arrowScrollbox.lockScroll = false;

		if (tabGroupsEnabled)
			assign(tabContainer, newAnimateFunctions);

		if (debug)
			tabContainer.allTabs.forEach(t => t.style.outline = t.style.boxShadow = "");
	}

	//TODO not work for movingtab
	tabContainer._resetAnimateTabMove = function() {
		let data = this._lastMouseDownData || gBrowser.selectedTab._dragData;
		if (!data)
			for (let t of gBrowser.visibleTabs)
				if (data = t._dragData) break;
		if (!data) return;

		unlockSlotSize(true);

		let {tab, tabRect} = data;
		let {scrollTop} = scrollbox;
		let newRect = getRect(tab);
		let atTabX = (data.oriScreenX - tabRect.left) / tabRect.widthDouble * newRect.widthDouble;
		assign(data, {
			scrollPos: scrollTop,
			screenX: newRect.left + atTabX,
			screenY: data.oriScreenY - tabRect.top + newRect.top,
			atTabX,
		});

		if (debug)
			log({boxWidth: scrollbox.clientWidth, slotWidth: slot.clientWidth, screenX: tab.screenX, oriX: data.oriScreenX, oriY : data.oriScreenY, oriTabX: data.atTabX, tabRect,
					newX: newRect.left + atTabX, newY: data.oriScreenY - tabRect.top + newRect.top, atTabX, newRect});
		log("_resetAnimateTabMove", "lastScreenY" in data);

		if ("lastScreenY" in data) {
			this._finishAnimateTabMove();
			this.removeAttribute("dragging");
			delete data.lastScreenX;
		} else {
			unlockSlotSize(true);
			lockSlotSize();
			fakeScrollbar.scrollTop = scrollTop;
		}
	}

	//replace the original function with modified one
	tabContainer._notifyBackgroundTab = function(tab) {
		if (tab.pinned || tab.hidden || tab.visible === false || !this.overflowing)
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
			if (scrollRect.top <= tabRect.top && tabRect.bottom <= scrollRect.bottom)
				return;

			if (this.arrowScrollbox.smoothScroll) {
				if (
					!selectedRect ||
					Math.max(tabRect.bottom - selectedRect.top, selectedRect.bottom - tabRect.top) <= scrollRect.height
				) {
					arrowScrollbox.ensureElementIsVisible(tabToScrollIntoView);
					return;
				}

				//try to copy normal tab to the pinned tab side will make the new tab be placed at front
				//the original function always scroll down
				let edge = tabRect.top > selectedRect.top ? "top" : "bottom";
				arrowScrollbox.scrollByPixels(selectedRect[edge] - scrollRect[edge]);
			}

			let ele = this._animateElement;
			if (!ele.hasAttribute("highlight")) {
				ele.setAttribute("highlight", "");
				setTimeout(() => ele.removeAttribute("highlight"), 150);
			}
		});
	};

	tabContainer._updateCloseButtons = function() {
		if (!this._closeButtonsUpdatePending)
			requestAnimationFrame(() => requestAnimationFrame(() => {
				let {_tabClipWidth} = this;
				for (let tab of gBrowser.visibleTabs)
					tab.toggleAttribute("closebutton", !tab.pinned && windowUtils.getBoundsWithoutFlushing(tab).width > _tabClipWidth);
			}));
		_updateCloseButtons.apply(tabContainer, arguments);
	};
	tabContainer.addEventListener("TabMove", function({target: tab}) {
		if (!tab.pinned)
			this._updateCloseButtons();
		//TabMove is fired when duplicating tab, lock the tabs in new location
		if (!tab._fullyOpen)
			this._lockTabSizing(tab);
	}, true);

	let placeholderStyle = document.body.appendChild(document.createElement("style"));
	let lastLayoutData = null;

	tabContainer._updateInlinePlaceHolder = function(numPinned = gBrowser.pinnedTabCount) {
		time("_updateInlinePlaceHolder");

		tabsBar.toggleAttribute("tabs-is-first-visible",
				tabContainer.matches(":nth-child(1 of :not([hidden=true], [collapsed=true]))"));

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
			timeEnd("_updateInlinePlaceHolder");
			this._positionPinnedTabs(numPinned);
			return;
		}

		let tabsRect = getRect(this, {box: "margin", accurate: true});
		let winRect = getRect(root, {box: "margin", accurate: true});
		let preTabsItemsSize = pointDeltaH(tabsRect.start, winRect.start);
		let postTabsItemsSize = pointDeltaH(winRect.end, tabsRect.end);
		let {scrollbarWidth} = scrollbox;

		tabsBar.style.setProperty("--pre-tabs-items-width", preTabsItemsSize + "px");
		tabsBar.style.setProperty("--post-tabs-items-width", postTabsItemsSize + "px");
		tabsBar.toggleAttribute("has-items-pre-tabs", preTabsItemsSize);
		//there is an extra padding after tabs for shifting the items to not cover the scrollbar
		tabsBar.toggleAttribute("has-items-post-tabs", postTabsItemsSize > (onlyUnderflow ? 0 : scrollbarWidth));

		timeLog("_updateInlinePlaceHolder", "update pre/post tabs items width");

		this._positionPinnedTabs(numPinned);

		let adjacentNewTab = !overflowing && this.hasAttribute("hasadjacentnewtabbutton");
		let positionPinned = this.hasAttribute("positionpinnedtabs");
		let firstTabRect = getRect(gBrowser.visibleTabs[positionPinned ? numPinned : 0]);
		let winWidth = winRect.width;
		let normalMinWidth = getTabMinWidth();
		let winMaxWidth = Math.max(screen.width - screen.left + 8, winWidth + normalMinWidth);
		let winMinWidth = parseInt(getComputedStyle(root).minWidth);
		let pinnedWidth = numPinned && !positionPinned ? firstTabRect.widthDouble : 0;
		let firstStaticWidth = pinnedWidth || normalMinWidth;
		let pinnedGap = prefs.gapAfterPinned;
		let pinnedReservedWidth = positionPinned ?
				parseFloat(this.style.getPropertyValue("--tab-overflow-pinned-tabs-width")) + pinnedGap : 0;

		let inlinePreTabCS = getComputedStyle(slot, "::before");

		let tabsStartSeparator = Math.round(parseFloat(inlinePreTabCS.marginInlineEnd)
				+ parseFloat(inlinePreTabCS.borderInlineEndWidth) + parseFloat(inlinePreTabCS.paddingInlineEnd));

		let base = Math.max(preTabsItemsSize + tabsStartSeparator, pinnedReservedWidth) + postTabsItemsSize;

		let layoutData = {
			preTabsItemsSize, postTabsItemsSize, tabsStartSeparator, base, firstStaticWidth, scrollbarWidth,
			adjacentNewTab, newTabButtonWidth, pinnedWidth, numPinned, winMinWidth, winMaxWidth, normalMinWidth,
		};
		timeLog("_updateInlinePlaceHolder", "gather all info");

		if (lastLayoutData && JSON.stringify(lastLayoutData) == JSON.stringify(layoutData)) {
			timeEnd("_updateInlinePlaceHolder");
			return;
		}

		log("update css", lastLayoutData, layoutData);
		trace();

		lastLayoutData = layoutData;

		onlyUnderflow = onlyUnderflow ? ":not([overflow])" : "";
		let css = `
			@media (max-width: ${base + firstStaticWidth - EPSILON}px) {
				${prefs.floatingBackdropClip ? `
					#tabbrowser-tabs${onlyUnderflow} {
						--top-placeholder-clip:
								${START_PC} var(--tab-height),
								calc(${END_PC} - (var(--tabs-scrollbar-width) + var(--scrollbar-clip-reserved)) * ${DIR}) var(--tab-height);
					}
				` : ``}
				#TabsToolbar:not([tabs-hide-placeholder]) #tabbrowser-tabs[multirows]${onlyUnderflow}
						#tabbrowser-arrowscrollbox::part(slot)::before {
					width: calc(100% - var(--tabstrip-size)) !important;
					margin-inline-end: 0;
					border-inline-end-width: 0;
					border-bottom-${END}-radius: 0;
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
				#tabbrowser-tabs[multirows]${onlyUnderflow} #tabbrowser-arrowscrollbox::part(slot)::after {visibility: collapse}
				#tabbrowser-tabs${onlyUnderflow} #tabbrowser-arrowscrollbox > * {order: 2}
			}
		`;
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
				if (max >= winMinWidth)
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

		for (let i = 0; base <= winMaxWidth; i++) {
			if (!i && !numPinned) {
				base += normalMinWidth;
				continue;
			}

			//wrap normal tabs
			css += `
				@media (min-width: ${base}px) and (max-width: ${(base += normalMinWidth) - EPSILON}px) {
					.tabbrowser-tab:nth-child(${numPinned + i} of :not([hidden])):not(:nth-last-child(1 of .tabbrowser-tab:not([hidden]))) ~ * {order: 2}
				}
			`;
			//wrap the last normal tab adjacent with new tab
			if (adjacentNewTab && base <= winMaxWidth)
				css += `
					@media (min-width: ${base}px) and (max-width: ${base + newTabButtonWidth - EPSILON}px) {
						.tabbrowser-tab:nth-child(${numPinned + i} of :not([hidden])):nth-last-child(2 of .tabbrowser-tab:not([hidden])) ~ * {order: 2}
					}
				`;
		}

		placeholderStyle.innerHTML = css;

		timeEnd("_updateInlinePlaceHolder");
	};

	//pinned tabs can't be hidden thus TabShow and TabHide don't bother
	["TabClose", "TabOpen", "TabPinned", "TabUnpinned"].forEach(n =>
			tabContainer.addEventListener(n, function({target}) {
				if (target.pinned || ["TabPinned", "TabUnpinned"].includes(n))
					//pinnedTabCount doesn't update yet when TabClose is dispatched
					this._updateInlinePlaceHolder(gBrowser.pinnedTabCount - (n == "TabClose" ? 1 : 0));
				this.removeAttribute("forced-overflow");
				this.style.removeProperty("--forced-overflow-adjustment");
			}));
	
	tabContainer.addEventListener("TabGroupCreate", function(e) {
		if (prefs.tabsUnderControlButtons) {
			prefs.tabsUnderControlButtons = 0;
			setStyle();
		}
	});
	tabContainer.addEventListener("DOMNodeRemoved", function(e) {
		if (e.target.tagName != "tab-group" || this.allGroups.length > 1)
			return;
		let expand = Services.prefs.getIntPref(prefBranchStr + "tabsUnderControlButtons");
		if (!expand)
			return;
		prefs.tabsUnderControlButtons = expand;
		tabsBar.toggleAttribute("tabs-hide-placeholder", this.overflowing && expand < 2);
		setStyle();
		this._updateInlinePlaceHolder();
	}, true);

	tabContainer._handleTabSelect = function() {
		if (!arrowScrollbox._isScrolling && !this.hasAttribute("movingtab") && !this.hasAttribute("dragging"))
			_handleTabSelect.apply(this, arguments);
	};

	//need too much thing to hack for the original function, thus rewrite it and not wrap it.
	//now this function is not only for close tab by mouse, but also add / remove tab by command.
	//tabWidthClosedByClick is provided only if the function is called by original closed by mouse event
	//TODO tab-group
	tabContainer._lockTabSizing = function(actionTab, tabWidthClosedByClick) {
		let tabs = gBrowser.visibleTabs.slice(gBrowser.pinnedTabCount);
		if (!tabs.length || this._isClosingLastTab) return;
		time("_lockTabSizing");

		let lastTab = tabs.at(-1);
		let last2ndTab = tabs.at(-2);
		let {closing, _tPos, screenY: actionTabTop} = actionTab;
		timeLog("_lockTabSizing", "reflow");
		let isEndTab = _tPos > lastTab?._tPos;
		let is2ndEndTab = !isEndTab && _tPos > last2ndTab?._tPos;
		let lastRowTop = (isEndTab ? actionTab : lastTab)?.screenY;
		let isLastRow = actionTabTop == lastRowTop;
		let nearByTab = closing ?
				tabs.findLast(t => t._tPos < _tPos)
				: tabs.find(t => t._tPos > _tPos);
		let isRowEdge = nearByTab?.screenY != actionTabTop;
		let adjacentNewTab = this.hasAttribute("hasadjacentnewtabbutton");
		let {overflowing} = this;
		let spacer = this._closingTabsSpacer;

		if (tabWidthClosedByClick)
			this._lastTabClosedByMouse = true;

		let tabMinWidth = getTabMinWidth();
		let last2ndRowIs1stRow = true;
		let lastRowTabsCount = tabs.length - tabs.findLastIndex(t => t.screenY != lastRowTop) - 1;
		let last2ndRowTabsCount = tabs.length - tabs.findLastIndex(t => t.screenY < lastRowTop - tabHeight && !(last2ndRowIs1stRow = false)) - 1;
		let tempWidth = Math.round(last2ndRowTabsCount * last2ndTab?.getBoundingClientRect().width) + newTabButtonWidth;
		let finalWidth = last2ndRowTabsCount * tabMinWidth + newTabButtonWidth;
		let {width: rowWidth, end: rowEnd, top: slotTop} = getRect(slot);
		let data = lastLayoutData;
		if (data)
			if (closing && last2ndRowIs1stRow || !closing && lastRowTop == slotTop) {
				rowWidth -= data.base;
				if (data.numPinned && !this.hasAttribute("positionpinnedtabs"))
					rowWidth -= data.pinnedWidth * data.numPinned + prefs.gapAfterPinned;
				rowEnd -= data.postTabsItemsSize * DIR;
			}

		let willDecreaseRow = finalWidth <= rowWidth;
		let rowCount = getRowCount(true);
		let maxRows = maxTabRows();

		//Because not leaving the new tab button alone would make things too complicated,
		//the following criteria are not well-thought-out, they just make things seem to work.
		//Need fully review and test.
		if (isEndTab && (!isRowEdge || last2ndTab?.style.maxWidth && adjacentNewTab && !willDecreaseRow)
				|| is2ndEndTab && !isLastRow && adjacentNewTab && lastRowTabsCount < 2 && !willDecreaseRow) {
			//prevent unlocking tabs when lock tabs concurrently
			if (tabWidthClosedByClick || !this._hasTabTempMaxWidth) {
				//let the tabs in the last row to expand to fit
				for (let tab of tabs)
					assign(tab.style, {maxWidth: "", minWidth: ""});

				if (!adjacentNewTab && isEndTab && isRowEdge && !overflowing) {
					unlockSlotSize(true);
					spacer.style.width = 0;
					this.removeAttribute("using-closing-tabs-spacer");
				}

				//in case there is some space after the spacer, such as the last tab is shrunk to math the previous
				if (tabWidthClosedByClick && isEndTab && adjacentNewTab) {
					let emptySpace = pointDeltaH(rowEnd, getRect(arrowScrollbox.lastChild).end);
					//it can be minus due to subpixel problem
					if (emptySpace > 0) {
						lockSlotSize();
						let {style} = spacer;
						style.setProperty("transition", "none", "important");
						this._expandSpacerBy(emptySpace);
						requestAnimationFrame(() => requestAnimationFrame(() => style.transition = ""));
					}
				}
			}
		} else {
			let lockLastRowWhenOpening, ignoreNewTabWhenCosing, needShrinkLastTab,
					dontLock, shouldKeepSpacer;
			if (closing) {
				if (tabWidthClosedByClick || !(overflowing && willDecreaseRow && rowCount == maxRows + 1))
					if (lastRowTabsCount < 2 && adjacentNewTab && last2ndTab) {
						ignoreNewTabWhenCosing = willDecreaseRow && tempWidth >= rowWidth;
						needShrinkLastTab = ignoreNewTabWhenCosing || tempWidth < rowWidth;
						dontLock = (isLastRow && isEndTab || !isLastRow && is2ndEndTab) && !willDecreaseRow;
						shouldKeepSpacer = !lastRowTabsCount && isEndTab && !willDecreaseRow;
					} else if (overflowing && !this.hasAttribute("using-closing-tabs-spacer")
							&& this.hasAttribute("closing-tab-ignore-newtab-width"))
						ignoreNewTabWhenCosing = true;
			} else {
				let totalWidth = (lastRowTabsCount + (!isLastRow && isRowEdge ? 1 : 0)) * tabMinWidth;
				if (adjacentNewTab)
					totalWidth += newTabButtonWidth;
				lockLastRowWhenOpening = totalWidth > rowWidth;
			}

			if (!dontLock) {
				//lock the current row, and the previous row if closing the first tab of current row
				let lockTabs = tabs.filter(tab => {
					let {screenY} = tab;
					return !tab.closing && tab._fullyOpen
						&& (screenY == actionTabTop && (!isLastRow || lockLastRowWhenOpening || tabWidthClosedByClick)
								|| isRowEdge && screenY == actionTabTop + tabHeight * (closing ? -1 : 1)
										&& !(!closing && screenY == lastRowTop && !lockLastRowWhenOpening));
				});
				if (!closing && !lockLastRowWhenOpening)
					lockTabs = lockTabs.slice(0, -1);

				if (lockTabs.length) {
					let sizes = lockTabs.map(t => t.getBoundingClientRect().width + "px");
					lockTabs.forEach((tab, i) => {
						let width = sizes[i];
						assign(tab.style, {maxWidth: width, minWidth: width, transition: "none"});
					});

					//the last tab usually has a different width when it is unwrapped from the last row,
					//resize it to match the others
					if (needShrinkLastTab) {
						let last = lockTabs.at(-1);
						if (last == lastTab || tabs[tabs.indexOf(last) + 1] == lastTab) {
							let secLast = last == lastTab ? lockTabs.at(-2) : last;
							if (secLast) {
								//sometimes the last tab just doesn't want to unwrap to the last second row,
								//make it a little bit smaller can help
								let value = `calc(${secLast.style.maxWidth} - ${1/60}px)`;
								assign(lastTab.style, {maxWidth: value, minWidth: value, transition: "none"});
							}
							if (last != lastTab)
								lockTabs.push(lastTab);
						}
					}

					requestAnimationFrame(() => requestAnimationFrame(() => {
						for (let tab of lockTabs)
							tab.style.transition = "";

						this.toggleAttribute("closing-tab-ignore-newtab-width", !!ignoreNewTabWhenCosing);
					}));

					this._hasTabTempMaxWidth = true;
				}

				//prevent unlocking tabs when lock tabs concurrently
				if (tabWidthClosedByClick || !this._hasTabTempMaxWidth)
					for (let tab of tabs.slice(tabs.indexOf(lockTabs.at(-1)) + 1))
						assign(tab.style, {maxWidth: "", minWidth: ""});
			}

			if (tabWidthClosedByClick) {
				if (this.hasAttribute("closing-tab-ignore-newtab-width"))
					tabWidthClosedByClick -= newTabButtonWidth;
				if (isLastRow && !isEndTab)
					//add 2 rAF to prevent the spacer from growing earlier then the tab shrinking
					requestAnimationFrame(() => requestAnimationFrame(() => this._expandSpacerBy(tabWidthClosedByClick)));
				else if (!shouldKeepSpacer) {
					spacer.style.width = 0;
					this.removeAttribute("using-closing-tabs-spacer");
					gBrowser.addEventListener("mousemove", this);
					addEventListener("mouseout", this);
				}

				//lock the slot to prevent the spacer cause overflowing of the scrollbox
				if (overflowing || isLastRow && !ignoreNewTabWhenCosing && !isEndTab)
					lockSlotSize();
				else
					unlockSlotSize(true);
			}
		}

		timeEnd("_lockTabSizing");
	};

	tabContainer._unlockTabSizing = function(instant) {
		//prevent unlocking tabs when removing tabs concurrently
		if (gBrowser._removingTabs.size)
			return;

		time("_unlockTabSizing");
		unlockSlotSize(instant);
		let animate = !gReduceMotion;
		let animations = [];
		if (this._hasTabTempMaxWidth) {
			for (let tab of this.allTabs.slice(gBrowser.pinnedTabCount)) {
				if (animate && tab.style.minWidth)
					animations.push(new Promise(rs => tab.addEventListener("TabAnimationEnd", rs, {once: true})));
				tab.style.minWidth = "";
			}
		}

		if (this.overflowing && this.hasAttribute("using-closing-tabs-spacer"))
			this.removeAttribute("closing-tab-ignore-newtab-width");
		else {
			let done;
			let cleanUp = () => {
				done = true;
				this.removeAttribute("closing-tab-ignore-newtab-width");
			};
			Promise.all(animations).then(cleanUp);
			//in case the animation is not performed
			setTimeout(() => {
				if (done) return;
				cleanUp();
				console.error("transition is not ended");
			}, debug == 2 ? 3000: 300);
		}

		timeEnd("_unlockTabSizing");

		_unlockTabSizing.call(this);
	};

	tabContainer.uiDensityChanged = function() {
		uiDensityChanged.apply(this, arguments);

		time("uiDensityChanged");

		let {newTabButton} = this;
		newTabButton.style.setProperty("display", "flex", "important");
		newTabButtonWidth = getRect(newTabButton).widthDouble;
		newTabButton.style.display = "";

		root.style.setProperty("--tab-height", (tabHeight = gBrowser.selectedTab.clientHeight) + "px");
		tabsBar.style.setProperty("--new-tab-button-width", newTabButtonWidth + "px");

		timeEnd("uiDensityChanged");

		updateNavToolboxNetHeight();
		tabContainer._updateInlinePlaceHolder();
	};

	function lockSlotSize() {
		let {style} = arrowScrollbox;
		let rect = getRect(slot);
		style.setProperty("--slot-width", rect.widthDouble + "px");
		style.setProperty("--slot-height", rect.heightDouble + "px");
	}

	function unlockSlotSize(instant) {
		let oldHeight, scrollBottom;
		if (!instant) {
			oldHeight = slot.clientHeight;
			scrollBottom = scrollbox.scrollTopMax - scrollbox.scrollTop;
		}

		let {style} = arrowScrollbox;
		style.removeProperty("--slot-height");
		style.removeProperty("--slot-width");

		if (!instant) {
			let delta = oldHeight - slot.clientHeight - scrollBottom;
			if (delta > 0) {
				let {smoothScroll} = arrowScrollbox;
				let {style} = slot;
				arrowScrollbox.smoothScroll = false;

				style.setProperty("transition", "none", "important");
				style.paddingBottom = delta + "px";
				scrollbox.scrollTop += delta;
				promiseDocumentFlushed(() => {}).then(() => requestAnimationFrame(() => {
					assign(arrowScrollbox, {smoothScroll});
					assign(style, {transition: "", paddingBottom: ""});
				}));
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

	let {addTab, removeTab, createTabsForSessionRestore} = gBrowser;

	gBrowser.addTab = function(uriString, {skipAnimation, pinned, bulkOrderedOpen} = {}) {
		let animate = !skipAnimation && !pinned && !gReduceMotion;
		let {getAttribute, hasAttribute} = tabContainer;
		if (animate)
			//add tab animation is skipped when scrollbox is overflowing, deceive that it isn't
			assign(tabContainer, {
				getAttribute: function(n) {
					if (n == "overflow") return "";
					return getAttribute.call(this, n);
				},
				hasAttribute: function(n) {
					if (n == "overflow") return false;
					return hasAttribute.call(this, n);
				},
			});

		let tab = addTab.apply(this, arguments);

		if (animate) {
			let {visibleTabs} = gBrowser;
			assign(tabContainer, {getAttribute, hasAttribute});
			if (!bulkOrderedOpen) {
				tabContainer._lockTabSizing(tab);
				//always unlock in case a TabMove is fired and some another tabs are locked
				let unlocked;
				tab.addEventListener("TabAnimationEnd", e => {
					unlocked = true;
					tabContainer._unlockTabSizing();
				}, {once: true});
				//in case the animation is not performed
				setTimeout(() => {
					if (unlocked || !tab.isConnected) return;
					tabContainer._unlockTabSizing(true);
					console.error("transition is not ended");
				}, debug == 2 ? 3000: 300);
			}
		}
		return tab;
	};

	gBrowser.removeTab = function(tab) {
		let toHandle = !tab.pinned && !tab.closing;

		if (toHandle) {
			//ensure the animation is kicked off when concurrently closing tabs,
			//as the tab may be locked when the previous tab closed
			assign(tab.style, {minWidth: "", transition: ""});
			tabContainer._isClosingLastTab = !tab.hidden && this.visibleTabs.length == 1;
		}

		removeTab.apply(this, arguments);

		delete tabContainer._isClosingLastTab;

		//if there is no animation, the tab is removed directly
		if (!tab.isConnected) {
			if (!tabContainer._lastTabClosedByMouse)
				tabContainer._unlockTabSizing(true);
		} else if (toHandle && !tabContainer._lastTabClosedByMouse && tab.closing) {
			tabContainer._lockTabSizing(tab);
			if (tabContainer._hasTabTempMaxWidth) {
				let unlocked;
				tab.addEventListener("TabAnimationEnd", e => {
					unlocked = true;
					tabContainer._unlockTabSizing();
				}, {once: true});
				//in case the animation is not performed
				setTimeout(() => {
					if (unlocked || !tab.isConnected) return;
					tabContainer._unlockTabSizing(true);
					console.error("transition is not ended");
				}, debug == 2 ? 3000: 300);
			}
		}
	};
	
	gBrowser.createTabsForSessionRestore = function(restoreTabsLazily,
		selectTab,
		tabDataList,
		tabGroupDataList
	) {
		try {
			if (tabGroupDataList?.length && prefs.tabsUnderControlButtons) {
				prefs.tabsUnderControlButtons = 0;
				setStyle();
			}
		} catch(e) {
			console.error(e);
		}
		return createTabsForSessionRestore.apply(this, arguments);
	};
}

new ResizeObserver(onTabsResize).observe(tabContainer);

document.getElementById("toolbar-menubar").addEventListener("toolbarvisibilitychange", updateNavToolboxNetHeight, true);

arrowScrollbox._updateScrollButtonsDisabledState();
if (appVersion == 115)
	toggleAllTabsButton();

function onTabsResize() {
	time("tabContainer ResizeObserver");

	log("scrollbox width", root.getAttribute("sizemode"), scrollbox.clientWidthDouble);

	//the underflow event isn't always fired, here we refer to the ResizeObserver in the constructor of MozArrowScrollbox
	let {scrollTopMax} = scrollbox;

	let count = getRowCount();
	tabsBar.toggleAttribute("tabs-multirows", count > 1);
	tabContainer.toggleAttribute("multirows", count > 1);
	root.style.setProperty("--tab-rows", count);

	timeEnd("tabContainer ResizeObserver");

	if (arrowScrollbox.overflowing != !!scrollTopMax)
		scrollbox.dispatchEvent(new CustomEvent(scrollTopMax ? "overflow" : "underflow"));
	else
		tabContainer._updateInlinePlaceHolder();

	tabContainer._resetAnimateTabMove();
}

function toggleAllTabsButton() {
	document.getElementById("alltabs-button").hidden = prefs.hideAllTabs;
}

function getRowCount(allRows) {
	return ~~((allRows ? slot : scrollbox).clientHeight / tabHeight);
}

function maxTabRows() {
	return +getComputedStyle(scrollbox).getPropertyValue("--max-tab-rows");
}

function getTabMinWidth() {
	return tabContainer._tabMinWidthPref
			+ (appVersion == 115 && root.getAttribute("uidensity") == "touch" ? 10 : 0);
}

function getScrollbar(box, orient = "vertical") {
	return InspectorUtils.getChildrenForNode(box, true, false)
			.find(e => e.matches(`scrollbar[orient=${orient}]`));
}

function updateNavToolboxNetHeight() {
	time("updateNavToolboxNetHeight");
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
	timeEnd("updateNavToolboxNetHeight");
}

function restrictScroll(lines) {
	let rows = getRowCount();
	if (getRect(tabContainer._placeholderPostTabs, {visible: true}).width
			|| getRect(tabContainer._placeholderPreTabs, {visible: true}).width)
		rows--;
	if (getRect(tabContainer._placeholderNewTabButton, {visible: true}).width)
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

function tabGroupsEnabled() {
	try {return Services.prefs.getBoolPref("browser.tabs.groups.enabled"); } catch(e) {}
}

function hasTabGoups() {
	return gBrowser.tabContainer.arrowScrollbox.matches(":has(tab-group)");
}

function pointDelta(a, b = 0) {
	let delta = a - b;
	return Math.abs(delta) < .02 ? 0 : delta;
}

function pointDeltaH(a, b = 0) {
	return pointDelta(a, b) * DIR;
}

function setDebug() {
	debug = prefs.debugMode;
	if (debug) {
		trace = () => console.trace();
		log = (...args) => console.log(...args);
		time = label => console.time(label);
		timeLog = (...args) => console.timeLog(...args);
		timeEnd = label => console.timeEnd(label);
	} else
		log = () => {}, trace = log, timeLog = log, timeEnd = log, time = log;
}

function exposePrivateMethod(element, method, context) {
	if (typeof element == "string")
		element = customElements.get(element);
	let newMethod = method.replace("#", "_");
	if (newMethod in element.prototype)
		return;
	let relatedMehtods = new Set();
	let code = element.toString().match(new RegExp(`(?<=\\s+)${method}.+|$`, "s"))[0];
	let idx = 0;
	code = code.substr(0, [...code].findIndex(c => {
		switch(c) {
			case "{": idx++; break;
			case "}": if (!--idx) return true;
		}
	}) + 1).replace(/\bthis\s*\.\s*(#[\w\s]+)(\()?/gs, (match, property, bracket = "") => {
		if (bracket)
			relatedMehtods.add(property);
		return "this._" + property.substr(1) + bracket;
	}).substr(method.length);
	if (code)
		try {
			let f;
			eval(`${context}; f = function ${newMethod} ${code};`);
			element.prototype[newMethod] = f;
			relatedMehtods.forEach(m => exposePrivateMethod(element, m, context));
		} catch(e) {
			alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack,method].join("\n"));
		}
}

/*
return the position based on screenX and screenY
box: content | padding | border | margin
visible: check visibility
accurate: no rounding, translated position
visual: painting size, translated position
scroll: scroll size
* check visibility: display == none: position = NaN, size = 0; visibility == collapse: size = 0, end = start;
*/
function getRect(ele, {box = "border", accurate, visual, visible, scroll} = {}) {
	let {width, height, x, y} = ele.getBoundingClientRect(), {screenX, screenY} = ele;
	let spaceStart = 0, spaceEnd = 0, spaceTop = 0, spaceBottom = 0, invisible;
	let cs = (box != "border" || visible) && getComputedStyle(ele);

	if (scroll) {
		width += ele.scrollWidth - ele.clientWidth;
		height += ele.scrollHeight - ele.clientHeight;
	}

	if (visible && (cs.display == "none" || cs.visibility == "collapse")) {
		if (cs.display == "none")
			x = y = screenX = screenY = NaN;
		width = height = 0;
		invisible = true;
	}

	if (!invisible)
		switch (box) {
			case "margin":
				spaceStart = parseFloat(cs.marginInlineStart);
				spaceEnd = parseFloat(cs.marginInlineEnd);
				spaceTop = parseFloat(cs.marginTop);
				spaceBottom = parseFloat(cs.marginBottom);
				break;
			case "content":
				spaceStart = -parseFloat(cs.paddingInlineStart);
				spaceEnd = -parseFloat(cs.paddingInlineEnd);
				spaceTop = -parseFloat(cs.paddingTop);
				spaceBottom = -parseFloat(cs.paddingBottom);
			case "padding":
				spaceStart -= parseFloat(cs.borderInlineStartWidth);
				spaceEnd -= parseFloat(cs.borderInlineEndWidth);
				spaceTop -= parseFloat(cs.borderTopWidth);
				spaceBottom -= parseFloat(cs.borderBottomWidth);
				break;
		}

	let {round} = Math;
	if (accurate || visual) {
		if (accurate)
			round = n => n;
		x += root.screenX;
		y += root.screenY;
	} else {
		x = screenX;
		y = screenY;
	}

	let start = round(x + (RTL_UI ? width : 0) - spaceStart * DIR);
	let end = round(x + (RTL_UI ? 0 : width) + spaceEnd * DIR);
	let top = round(y - spaceTop);
	let bottom = round(y + height + spaceBottom);
	let widthDouble = width + spaceStart + spaceEnd;
	let heightDouble = height + spaceTop + spaceBottom;
	return {
		width: visual ? (end - start) * DIR : round(widthDouble),
		height: visual ? bottom - top : round(heightDouble),
		top, end, bottom, start,
		left: RTL_UI ? end : start,
		right: RTL_UI ? start : end,
		widthDouble, heightDouble,
	};
}

timeEnd("setup");
} //end function setup()

} catch(e) {alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e)}
