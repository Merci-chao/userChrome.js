"use strict";
// ==UserScript==
// @namespace      https://github.com/Merci-chao/userChrome.js
// @compatibility  Firefox 115, 132 - 133b
// @author         Merci chao
// @version        1.0
// ==/UserScript==

try {
if (Services.prefs.getPrefType("sidebar.verticalTabs") == Services.prefs.PREF_BOOL)
	Services.prefs.lockPref("sidebar.verticalTabs", false);

if (gBrowser._initialized) {
	setup();
	gBrowser.tabContainer.uiDensityChanged();	
	gBrowser.tabContainer._handleTabSelect(true);
} else {
	let {init} = gBrowser;
	gBrowser.init = function() {
		(this.init = init).call(this);
		//try catch in case any bug messing up the whole browser
		try {setup()}
		catch(e) {alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e)}
	};
}

function setup() {

let appVersion = parseInt(Services.appinfo.version);
let START = RTL_UI ? "right" : "left";
let END = RTL_UI ? "left" : "right";
let LTR1 = RTL_UI ? -1 : 1;
let {assign} = Object;

let root = document.documentElement;

let prefs;
{
	let prefBranchStr = "userChromeJS.multiTabRows@Merci.chao.";
	let defPrefs = {
		maxTabRows: 3,
		rowStartIncreaseFrom: parseInt(getComputedStyle(root).minWidth),
		rowIncreaseEvery: 200,
		spaceAfterTabs: 40,
		spaceAfterTabsOnMaximizedWindow: 40,
		spaceBeforeTabs: 40,
		spaceBeforeTabsOnMaximizedWindow: 0,
		gapAfterPinned: 12,
		tabsbarItemsAlign: "start",
		linesToScroll: 2,
		linesToDragScroll: 1,
		thinScrollbar: true,
		scrollbarTrackColor: "var(--toolbar-bgcolor)",
		scrollbarThumbColor: root.style.getPropertyValue("--toolbarbutton-icon-fill") ? "var(--toolbarbutton-icon-fill)" : "var(--toolbar-color)",
		dynamicThemeImageSize: false,
		tabsUnderControlButtons: 1,
		debugMode: 0,
		compactControlButtons: !matchMedia("(-moz-platform: windows-win7), (-moz-platform: windows-win8)").matches ?
				false : null,
		hideAllTabs: appVersion == 115 ?
				false : null,
	};

	let setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
			value != null && branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
	let getPrefs = (branch, data) => Object.fromEntries(Object.entries(data)
			.filter(([name, value]) => value != null)
			.map(([name, value]) => [name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));
	setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defPrefs);
	prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defPrefs);
}

let debug = prefs.debugMode;
let time = () => {}, timeLog = time, timeEnd = time;
if (debug) {
	time = label => console.time(label);
	timeLog = () => console.timeLog(...arguments);
	timeEnd = label => console.timeEnd(label);
}
time("setup");

let tabsBar = document.getElementById("TabsToolbar");
let tabsBarCustTarget = document.getElementById("TabsToolbar-customization-target");
let ctrlBtnBox = tabsBar.querySelector(".titlebar-buttonbox-container");
let privateBrowsingBox = document.getElementById("private-browsing-indicator-with-label");
let {tabContainer} = gBrowser, {arrowScrollbox} = tabContainer, {scrollbox} = arrowScrollbox;
let slot = scrollbox.querySelector("slot");

let tabAnimation = getComputedStyle(gBrowser.selectedTab).transition.match(/(?<=min-width )[^,]+|$/)[0]
		|| ".1s ease-out";
if (debug == 2)
	tabAnimation = "1s ease";

let tabHeight;
let newTabButtonWidth;

let PINNED_TAB_COUNT = "pinnedTabCount" in gBrowser ? "pinnedTabCount" : "_numPinnedTabs";

let fakeScrollbar = arrowScrollbox.shadowRoot.appendChild(document.createXULElement("box"));
fakeScrollbar.part = "fake-scrollbar";

document.body.appendChild(document.createElement("style")).innerHTML = `
:root {
	--tab-height: ${tabHeight}px;
}

#tabbrowser-tabs {
	--gap-after-pinned: ${prefs.gapAfterPinned}px;
	--tab-animation: ${tabAnimation};
}

#tabbrowser-arrowscrollbox {
	--scrollbar-track-color: ${prefs.scrollbarTrackColor};
	scrollbar-color: ${prefs.scrollbarThumbColor} var(--scrollbar-track-color);
	transition: 1s scrollbar-color ease-out;
}

#tabbrowser-arrowscrollbox[highlight] {
	--scrollbar-track-color: var(${appVersion == 115 ? "--tab-attention-icon-color" : "--attention-dot-color"});
	transition-duration: 0s;
}

/*ensure the new tab button won't be wrapped to the new row in any case*/
${(() => {
	let css = `
		${CSS.supports("selector(:has(*))") ? `
			#tabbrowser-arrowscrollbox:has(.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])))::part(slot) {
				flex-wrap: nowrap;
			}
		` : ``}
		#tabbrowser-tabs[hasadjacentnewtabbutton]:not([positionpinnedtabs]) #tabbrowser-arrowscrollbox {
			min-width: calc(var(--tab-min-width) + var(--new-tab-button-width)) !important;
		}
		${appVersion == 115 ? `
			:root[uidensity=touch] #tabbrowser-tabs[hasadjacentnewtabbutton]:not([positionpinnedtabs]) #tabbrowser-arrowscrollbox {
				min-width: calc(var(--tab-min-width) + 10px + var(--new-tab-button-width)) !important;
			}
		` : ``}
	`;
	return prefs.tabsUnderControlButtons ? `
		@media (max-width: ${prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery - 1}px) {
			${css}
		}
	` : css;
})()}

/*
  does not limit its width when positioning pinned tabs,
  allowing it to be made narrower, thus triggering un-positioning pinned tabs
*/
#tabbrowser-tabs:not([positionpinnedtabs]) #tabbrowser-arrowscrollbox[overflowing] {
	min-width: calc(var(--tab-min-width) + var(--scrollbar-width, 0px)) !important;
}
${appVersion == 115 ? `
	:root[uidensity=touch] #tabbrowser-tabs:not([positionpinnedtabs]) #tabbrowser-arrowscrollbox[overflowing] {
		min-width: calc(var(--tab-min-width) + 10px + var(--scrollbar-width, 0px)) !important;
	}
` : ``}

${[...Array(prefs.maxTabRows).keys()].map(i => `
	@media (min-width: ${prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery * i}px) {
		:root {
			--max-tab-rows: ${i + 1};
		}
	}
`).join("\n")}

#tabbrowser-arrowscrollbox::part(overflow-start-indicator),
#tabbrowser-arrowscrollbox::part(overflow-end-indicator) {
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
	z-index: 3;
	margin-inline: -.5px -6.5px;
}

#tabbrowser-arrowscrollbox::part(overflow-end-indicator) {
	margin-inline: -7.5px .5px !important;
}

:root:dir(rtl) #tabbrowser-arrowscrollbox::part(overflow-start-indicator) {
	margin-inline: .5px -7.5px;
}

:root:dir(rtl) #tabbrowser-arrowscrollbox::part(overflow-end-indicator) {
	margin-inline: -6.5px -.5px !important;
}


#tabbrowser-tabs:not([dragging])[overflow] #tabbrowser-arrowscrollbox::part(overflow-end-indicator) {
	translate: calc(var(--scrollbar-width, 0px) * -1 * ${LTR1});
}

#tabbrowser-tabs[movingtab][multirows]:not([movingpinnedtab]):not([movingsingletab]) #tabbrowser-arrowscrollbox::part(overflow-start-indicator),
#tabbrowser-tabs[movingtab][multirows]:not([movingpinnedtab]):not([movingsingletab]) #tabbrowser-arrowscrollbox::part(overflow-end-indicator) {
	opacity: 1;
}

#tabbrowser-tabs[positionpinnedtabs] #tabbrowser-arrowscrollbox::part(overflow-start-indicator) {
	translate: calc(var(--gap-after-pinned) * ${LTR1});
}

#tabbrowser-arrowscrollbox::part(scrollbutton-up),
#tabbrowser-arrowscrollbox::part(scrollbutton-down) {
	--height: 20px;
	position: absolute;
	z-index: 1;
	height: var(--height);
	width: var(--slot-width, 0px);
	border: 0 !important;
	padding: 0 !important;
	visibility: hidden;
	opacity: 0 !important;
	border-radius: 0;
}

#tabbrowser-arrowscrollbox::part(scrollbutton-down) {
	margin-top: calc(var(--tab-height) * var(--max-tab-rows) - var(--height));
}

#tabbrowser-tabs[overflow][dragging]:not([movingpinnedtab]) #tabbrowser-arrowscrollbox:not([lockscroll]):not([scrolledtostart])::part(scrollbutton-up),
#tabbrowser-tabs[overflow][dragging]:not([movingpinnedtab]) #tabbrowser-arrowscrollbox:not([lockscroll]):not([scrolledtoend])::part(scrollbutton-down) {
	visibility: visible !important;
}

#tabbrowser-arrowscrollbox::part(scrollbox-clip),
#tabbrowser-arrowscrollbox::part(scrollbox) {
	align-items: start;
	overflow-y: auto;
	overflow-x: hidden;
	max-height: calc(var(--tab-height) * var(--max-tab-rows));
	scroll-snap-type: both mandatory;
}

#tabbrowser-tabs[positionpinnedtabs] > #tabbrowser-arrowscrollbox::part(scrollbox) {
	/*padding cause inconsistent width result*/
	padding-inline: 0 !important;
	margin-inline-start: var(--gap-after-pinned);
}

#tabbrowser-tabs[dragging] #tabbrowser-arrowscrollbox[overflowing]::part(scrollbox) {
	overflow-y: hidden;
}

#tabbrowser-arrowscrollbox::part(fake-scrollbar)::before {
	content: "";
	height: var(--slot-height);
	width: 1px;
}

#tabbrowser-arrowscrollbox::part(fake-scrollbar) {
	height: calc(var(--tab-height) * var(--tab-rows));
	width: calc(var(--scrollbar-width) + 1px);
	margin-inline-start: -1px;
	overflow-y: scroll;
}

#tabbrowser-tabs:not([overflow][dragging]) #tabbrowser-arrowscrollbox::part(fake-scrollbar) {
	display: none;
}

${prefs.thinScrollbar ? `
	#tabbrowser-arrowscrollbox::part(scrollbox),
	#tabbrowser-arrowscrollbox::part(fake-scrollbar) {
		scrollbar-width: thin;
	}
` : ""}

#tabbrowser-arrowscrollbox::part(slot) {
	min-width: 1px; /*ensure it is visible and able to make the scrollbox overflow*/
	flex-wrap: wrap;
	height: var(--slot-height, auto);
	width: var(--slot-width, auto);
	align-items: start;
	align-content: start;
	transition: padding-bottom var(--tab-animation);
	display: flex; /*fx115*/
	flex: 1; /*fx115*/
}

#tabbrowser-arrowscrollbox:not([scrollsnap])::part(slot),
#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::part(slot) {
	overflow: hidden;
}

#tabbrowser-tabs[animatefinishing] #tabbrowser-arrowscrollbox::part(slot) {
	pointer-events: none;
}

.tabbrowser-tab {
	scroll-snap-align: start;
	margin-inline-end: calc(var(--moving-tab-width-adjustment, 0px) + var(--adjacent-newtab-button-adjustment, 0px)) !important;
}

/*ensure the closing / not-fully-open tabs can have 0 width*/
#tabbrowser-tabs:not([movingtab])
		.tabbrowser-tab:not([pinned], [multiselected-move-together], [tab-grouping], [tabdrop-samewindow]) {
	transition: var(--tab-animation);
	transition-property: max-width, min-width, padding;
}

.tabbrowser-tab:not([pinned], [fadein]) {
	padding-inline: 0;
}

/*prevent min/max width transition when resizing the dragged tabs*/
#tabbrowser-tabs[movingtab] .tabbrowser-tab:is([selected], [multiselected]):not([tabdrop-samewindow]) {
	transition: none;
}

/*ui.prefersReducedMotion = 1*/
@media (prefers-reduced-motion: reduce) {
	/*remove the animate when resizing tab*/
	#tabbrowser-tabs[movingtab] .tabbrowser-tab {
		transition: none;
	}
}

#tabbrowser-tabs[movingpinnedtab] > #tabbrowser-arrowscrollbox > .tabbrowser-tab[pinned]:is([selected], [multiselected]) {
	z-index: 3;
}

#tabbrowser-tabs:not([overflow])[hasadjacentnewtabbutton] :nth-last-child(1 of .tabbrowser-tab:not([hidden])) {
	--adjacent-newtab-button-adjustment: var(--new-tab-button-width);
}

#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox > .tabbrowser-tab:nth-child(1 of :not([pinned], [hidden])) {
	margin-inline-start: 0 !important;
}

#tabbrowser-tabs[haspinnedtabs]:not([positionpinnedtabs]) > #tabbrowser-arrowscrollbox >
		:nth-last-child(1 of [pinned]:not([hidden])):not(:nth-last-child(1 of .tabbrowser-tab:not([hidden]))) {
	margin-inline-end: var(--gap-after-pinned) !important;
}

#tabbrowser-tabs[closebuttons=activetab][orient=horizontal] .tabbrowser-tab[closebutton] .tab-close-button:not([selected]),
/*fx 115*/
#tabbrowser-tabs[closebuttons=activetab] > #tabbrowser-arrowscrollbox > .tabbrowser-tab[closebutton] > .tab-stack > .tab-content > .tab-close-button:not([selected=true]) {
	display: flex;
}

#tabs-newtab-button {
	margin-inline-start: calc(var(--new-tab-button-width) * -1) !important;
}

.closing-tabs-spacer {
	transition: width var(--tab-animation) !important;
}

${prefs.compactControlButtons ? `
	.titlebar-buttonbox-container {
		align-items: start;
	}
` : ""}

#TabsToolbar {
	--space-before-tabs: ${prefs.spaceBeforeTabs}px;
	--space-after-tabs: ${prefs.spaceAfterTabs}px;
}

:root[sizemode=maximized] #TabsToolbar {
	--space-before-tabs: ${prefs.spaceBeforeTabsOnMaximizedWindow}px;
	--space-after-tabs: ${prefs.spaceAfterTabsOnMaximizedWindow}px;
}

.titlebar-spacer[type=pre-tabs] {
	width: var(--space-before-tabs);
}

.titlebar-spacer[type=post-tabs] {
	width: var(--space-after-tabs);
}

#TabsToolbar-customization-target {
	align-items: ${prefs.tabsbarItemsAlign};
}

#TabsToolbar > :not(.toolbar-items, .toolbarbutton-1),
#TabsToolbar #TabsToolbar-customization-target >
		:not(#tabbrowser-tabs, .toolbarbutton-1, toolbaritem, toolbarpaletteitem) {
	height: var(--tab-height);
	max-height: var(--tab-height);
	align-self: stretch;
}

#TabsToolbar > .titlebar-buttonbox-container,
#TabsToolbar :is(.toolbarbutton-1, toolbaritem, toolbarpaletteitem) {
	height: calc(var(--tab-height) - var(--tabs-navbar-shadow-size, 0px)); /*fx 115*/
}


#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button {
	align-self: end;
}

${prefs.spaceBeforeTabsOnMaximizedWindow ? `
	:root[sizemode=maximized] .titlebar-spacer[type=pre-tabs] {
		display: flex;
	}
` : ""}

${prefs.tabsUnderControlButtons ? `
	#TabsToolbar[multitabrows]:not([overflowtabrows], [customizing]) #TabsToolbar-customization-target {
		align-items: stretch;
	}

	#navigator-toolbox[movingtab] #TabsToolbar[multitabrows]:not([overflowtabrows])
			#TabsToolbar-customization-target > :is([ondragover]:not(#new-window-button, #new-tab-button), #personal-bookmarks),
	#navigator-toolbox:not([movingtab]) #TabsToolbar[multitabrows]:not([overflowtabrows]) > :not(.toolbar-items),
	#navigator-toolbox:not([movingtab]) #TabsToolbar[multitabrows]:not([overflowtabrows])
			#TabsToolbar-customization-target > :not(#tabbrowser-tabs) {
		z-index: 2;
	}

	#TabsToolbar:not([customizing]) #tabbrowser-tabs[multirows]:not([overflow]) {
		z-index: 1;
		padding-inline-start: 0 !important;
		border-inline-start: 0 !important;
		margin-inline: calc(var(--pre-tabs-items-width) * -1) calc(var(--post-tabs-items-width) * -1) !important;
	}

	#TabsToolbar:not([customizing]) #tabbrowser-tabs[multirows]:not([overflow], [movingtab]) #tabbrowser-arrowscrollbox::part(slot) {
		mask-image: linear-gradient(to bottom, ${debug ? "rgba(0,0,0,.2)" : "transparent"} var(--tab-height), red var(--tab-height)),
				linear-gradient(to ${START}, ${debug ? "rgba(0,0,0,.2)" : "transparent"} calc(var(--post-tabs-items-width) - 2em), red var(--post-tabs-items-width));
	}

	#TabsToolbar:not([customizing]) #tabbrowser-arrowscrollbox::part(slot)::before,
	#TabsToolbar:not([customizing]) #tabbrowser-arrowscrollbox::part(slot)::after {
		content: "";
		pointer-events: none;
	}

	:root:not([privatebrowsingmode], [firefoxviewhidden]) :is(toolbarbutton, toolbarpaletteitem)
			~ #tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(slot)::before,
	:root[privatebrowsingmode]:not([firefoxviewhidden]) :is(toolbarbutton:not(#firefox-view-button), toolbarpaletteitem:not(#wrapper-firefox-view-button))
			~ #tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(slot)::before {
		border-inline-end: var(--tabstrip-inner-border, 1px solid color-mix(in srgb, currentColor 25%, transparent));
		padding-inline-end: 2px;
		margin-inline-end: 2px;
	}

	#tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(slot)::before {
		width: var(--pre-tabs-items-width);
	}

	#tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(slot)::after {
		width: var(--post-tabs-items-width);
	}

	${prefs.maxTabRows > 1 ? `
		@media (min-width: ${prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery}px) {
			#TabsToolbar {
				position: relative;
			}

			#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button {
				position: absolute;
				bottom: 0;
				${END}: 0;
			}

			:is(
				:root:not([chromehidden~=menubar], [privatebrowsingmode=temporary]) #toolbar-menubar[autohide=false] + #TabsToolbar,
				:root:not([tabsintitlebar])
			)
					${prefs.tabsbarItemsAlign == "end" ? `
						#tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button
					` : `
						#new-tab-button:nth-child(1 of #tabbrowser-tabs[hasadjacentnewtabbutton] ~ :not([hidden=true], [collapsed=true])):nth-last-child(1 of :not([hidden=true], [collapsed=true]))
					`}
			{
				position: static;
				align-self: end;
				order: 2;
			}
		}

		${prefs.tabsbarItemsAlign == "center" ? `
			@media (min-width: ${prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery}px)
					and (max-width: ${prefs.rowStartIncreaseFrom + prefs.rowIncreaseEvery * 2 - 1}px) {
				:is(
					:root:not([chromehidden~=menubar], [privatebrowsingmode=temporary]) #toolbar-menubar[autohide=false] + #TabsToolbar,
					:root:not([tabsintitlebar])
				) #tabbrowser-tabs[hasadjacentnewtabbutton] ~ #new-tab-button {
					position: static;
					align-self: end;
					order: 2;
				}
			}
		` : ``}
	` : ``}

	@media (not (-moz-platform: windows-win7)) and (not (-moz-platform: windows-win8)) {
		#tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(overflow-start-indicator),
		#tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(overflow-end-indicator) {
			opacity: 0 !important;
		}
	}
` : ""}

:root {
	--multirows-background-size: calc(var(--nav-toolbox-net-height) + var(--tab-height) * ${prefs.dynamicThemeImageSize ? "var(--tab-rows)" : prefs.maxTabRows});
}

:root, /*fx115*/
#navigator-toolbox {
	background-size: auto var(--multirows-background-size, auto) !important;
}

#TabsToolbar #firefox-view-button[open] > .toolbarbutton-icon:-moz-lwtheme,
#tabbrowser-tabs:not([movingtab]) > #tabbrowser-arrowscrollbox > .tabbrowser-tab > .tab-stack > .tab-background:is([selected=true], [multiselected=true]):-moz-lwtheme {
	background-size: auto 100%, auto 100%, auto var(--multirows-background-size, auto) !important;
}

${debug ? `
	.tabbrowser-tab[style*=max-width] {
		background: rgba(255,0,0,.2);
	}
	.tabbrowser-tab[style*=transform] {
		background: rgba(255,0,255,.2);
	}
	.tab-background {
		opacity: .7;
	}
	.closing-tabs-spacer {
		padding-inline-start: 1px;
		margin-inline-start: -1px;
		background: rgba(255, 255, 0, .5);
		height: var(--tab-height);
	}
	#tabbrowser-arrowscrollbox::part(slot)::before,
	#tabbrowser-arrowscrollbox::part(slot)::after {
		background: rgba(0, 255, 0, .5);
		height: var(--tab-height);
	}

	#tabbrowser-arrowscrollbox::part(scrollbutton-up),
	#tabbrowser-arrowscrollbox::part(scrollbutton-down) {
		opacity: 1 !important;
	}

	#tabbrowser-arrowscrollbox[scrollsnap] {
		outline: 4px solid rgba(255,0,255,.5);
	}

	.tabbrowser-tab {
		box-shadow: 0 0 0 1px inset rgba(255,255,255,.5);
		position: relative;
	}
` : ""}
${debug == 2 ? `
	#navigator-toolbox[movingtab] #TabsToolbar::before,
	#navigator-toolbox[movingtab] #TabsToolbar::after,
	#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::before,
	#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::after,
	#tabbrowser-tabs[movingtab]::before,
	#tabbrowser-tabs[movingtab]::after {
		--line: 1px dashed rgba(255, 255, 0, .75);
		content: "";
		position: fixed;
		z-index: 5;
		pointer-events: none;
	}
	#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::before,
	#tabbrowser-tabs[movingtab]::before {
		top: min(max(var(--drag-y, 0px), 0px), 100vh);
		width: 100vw;
		border-top: var(--line);
	}
	#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::after,
	#tabbrowser-tabs[movingtab]::after {
		left: min(max(var(--drag-x, 0px), 0px), 100vw);
		height: 100vh;
		border-left: var(--line);
	}
	#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::before {
		top: var(--drag-tran-y, 0px);
		--line: 1px dashed rgba(255, 0, 255, .75);
	}
	#tabbrowser-tabs[movingtab] #tabbrowser-arrowscrollbox::after {
		left: var(--drag-tran-x, 0px);
		--line: 1px dashed rgba(255, 0, 255, .75);
	}
	#navigator-toolbox[movingtab] #TabsToolbar::before,
	#navigator-toolbox[movingtab] #TabsToolbar::after {
		border: var(--line);
		left: min(max(var(--drag-x, 0px) - var(--drag-width) / 2, 0px), 100vw);
		top: min(max(var(--drag-y, 0px) - var(--tab-height) / 2, 0px), 100vh);
		height: var(--tab-height);
		width: var(--drag-width);
	}
	#navigator-toolbox[movingtab] #TabsToolbar::after {
		border-color: rgba(255, 0, 255, .75);
		--drag-width: var(--drag-tran-width);
	}

	@media (prefers-reduced-motion: no-preference) {
		#tabbrowser-tabs[movingtab] .tabbrowser-tab[fadein]:not([selected]):not([multiselected]),
		.tabbrowser-tab:is([multiselected-move-together], [tab-grouping], [tabdrop-samewindow]) {
			transition: transform 1000ms ease;
		}
	}
	.tabbrowser-tab[selected]::after,
	.tabbrowser-tab[selected]::before {
		--line: 1px solid rgba(255,255,255,.5);
		content: "";
		position: absolute;
		z-index: 1;
	}
	.tabbrowser-tab::after {
		top: 0; bottom: 0;
		left: 50%;
		border-left: var(--line);
	}
	.tabbrowser-tab::before {
		left: 0; right: 0;
		top: 50%;
		border-top: var(--line);
	}
` : ``}
`;

/** hack slot **/
{
	slot.part.add("slot");
}

/** hack scrollbox **/
{
	//the scrollbar is regenerated in some situations, ensure it is well set
	scrollbox.addEventListener("mouseenter", e => {
		if (e.target != scrollbox) return;
		let scrollbar = getScrollbar();
		if (scrollbar) {
			scrollbar.style.MozWindowDragging = "no-drag";
			//ensure to snap well when clicking on the scrollbar
			scrollbar.addEventListener("click", onScrollbarClick, true);
		}
	}, true);

	function onScrollbarClick(e) {
		arrowScrollbox.setAttribute("scrollsnap", "");
		//if it's already scrolled to the edge and click on the up / down button,
		//the scrollend event will not be dispatched
		//wait a while and check if there is no scroll, then remove the attribute
		requestAnimationFrame(() => requestAnimationFrame(() => {
			if (!arrowScrollbox._isScrolling)
				arrowScrollbox.removeAttribute("scrollsnap");
		}));
	}

	//control the scroll behavior and speed
	let {scrollBy} = scrollbox;
	let lockDragScroll;
	scrollbox.scrollBy = function(arg) {
		if (typeof arg == "object") {
			let {stack} = new Error();
			let onWheel = stack.includes("on_wheel@chrome://global/content/elements/arrowscrollbox.js");
			let dragScroll = stack.match(/on_dragover@chrome:\/\/browser\/content\/tabbrowser[/-]tabs\.js/);
			//ensure the scrolling performs one by one when dragging tabs
			if (dragScroll) {
				if (arrowScrollbox._isScrolling || lockDragScroll)
					return;
				if (gReduceMotion)
					lockDragScroll = setTimeout(() => lockDragScroll = null,
							Services.prefs.getIntPref("general.smoothScroll.durationToIntervalRatio") * 2);
				if (RTL_UI)
					//the scrolling is reversed as the box is marked as horizontal, reverse it back
					arg.top = -arg.top;
			} else if (onWheel)
				arg.top = Math.sign(arg.top) * arrowScrollbox.lineScrollAmount;
			if ((onWheel || dragScroll) && !gReduceMotion)
				arg.behavior = "smooth";
		}
		return scrollBy.apply(this, arguments);
	};

	let previousRowCount;
	new ResizeObserver(e => {
		time("scrollbox ResizeObserver");

		//Take charge and not let the ResizeObserver in the constructor of MozArrowScrollbox do anything stupid.
		//When the window is expanded and the box changes from being forced to be in one row, to being able to be in multi-rows,
		//the block may bounce very violently
		if (appVersion > 115) {
			let {toggleAttribute, dispatchEvent} = arrowScrollbox;
			assign(arrowScrollbox, {
				toggleAttribute: function(n, v) {
					if (n == "overflowing") return this.hasAttribute(n);
					return toggleAttribute.apply(this, arguments);
				},
				dispatchEvent: function({type}) {
					if (["overflow", "underflow"].includes(type)) return false;
					return dispatchEvent.apply(this, arguments);
				},
			});
			requestAnimationFrame(() => requestAnimationFrame(() =>
					assign(arrowScrollbox, {toggleAttribute, dispatchEvent})));
		}

		let count = getRowCount();
		if (count == previousRowCount) {
			let positionPinned = tabContainer.hasAttribute("positionpinnedtabs");
			let enoughSpace = getRect(scrollbox).width >= tabContainer._tabMinWidthPref + scrollbox.scrollbarWidth;
			let needPosition = gBrowser[PINNED_TAB_COUNT] && tabContainer.overflowing;
			if (!(!positionPinned && needPosition && enoughSpace || positionPinned && !enoughSpace)) {
				tabContainer._updateTabsbarPlaceHolder();
				timeEnd("scrollbox ResizeObserver");
				return;
			}
		} else {
			previousRowCount = count;
			tabsBar.toggleAttribute("multitabrows", count > 1);
			tabContainer.toggleAttribute("multirows", count > 1);
			root.style.setProperty("--tab-rows", count);
		}

		//the underflow event isn't always fired, here we refer to the ResizeObserver in the constructor of MozArrowScrollbox
		let {scrollTopMax} = scrollbox;
		if (arrowScrollbox.overflowing != !!scrollTopMax)
			scrollbox.dispatchEvent(new CustomEvent(scrollTopMax ? "overflow" : "underflow"));

		timeEnd("scrollbox ResizeObserver");
		//always let it run the determination
		tabContainer._positionPinnedTabs();
	}).observe(scrollbox);

	let scrollbarWidth;
	Object.defineProperty(scrollbox, "scrollbarWidth", {
		get: () => scrollbarWidth || (scrollbarWidth = getScrollbar()?.clientWidth),
		configurable: true,
	});

	//the overflow and underflow events may not be handled / triggered correctly
	//(even with the getBoundingClientRect hack of the slot)
	//ensure everything is set right
	tabContainer.removeAttribute("overflow");
	arrowScrollbox.removeAttribute("overflowing");

	//overwrite the action of the original listener
	scrollbox.addEventListener("underflow", e => {
		if (e.originalTarget != scrollbox)
			return;
		time("scrollbox underflow");

		// 0: vertical, 1: horizontal, 2: both
		//don't consider it can overflow if there is only one tab,
		//in case the new tab button is wrapped in extreme case and cause overflow
		let underflow = e.detail != 1 || !scrollbox.scrollTopMax || gBrowser.visibleTabs.length < 2;

		let toggleAttr = underflow ? "removeAttribute" : "setAttribute";
		tabsBar[toggleAttr]("overflowtabrows", true);
		arrowScrollbox[toggleAttr]("overflowing", true);
		tabContainer[toggleAttr]("overflow", true);

		timeLog("scrollbox underflow", "update status");

		if (underflow) {
			for (let tab of gBrowser._removingTabs)
				gBrowser.removeTab(tab);
			
			document.getElementById("tab-preview-panel")?.removeAttribute("rolluponmousewheel");
		}

		if (appVersion == 115)
			arrowScrollbox._updateScrollButtonsDisabledState();
		
		if (gBrowser[PINNED_TAB_COUNT])
			tabContainer._positionPinnedTabs();
		else
			tabContainer._updateTabsbarPlaceHolder();
		tabContainer._updateCloseButtons();

		timeEnd("scrollbox underflow");
	}, true);

	//overwrite the action of the original listener
	scrollbox.addEventListener("overflow", e => {
		if (e.originalTarget != scrollbox)
			return;
		time("scrollbox overflow");

		// 0: vertical, 1: horizontal, 2: both
		//don't consider it can overflow if there is only one tab,
		//in case the new tab button is wrapped in extreme case and cause overflow
		let overflow = (e.detail != 1 || scrollbox.scrollTopMax) && gBrowser.visibleTabs.length > 1;

		let toggleAttr = overflow ? "setAttribute" : "removeAttribute";
		arrowScrollbox[toggleAttr]("overflowing", true);
		tabContainer[toggleAttr]("overflow", true);
		tabsBar[toggleAttr]("overflowtabrows", true);

		timeLog("scrollbox overflow", "update status");

		if (appVersion == 115)
			arrowScrollbox._updateScrollButtonsDisabledState();
		tabContainer._positionPinnedTabs();
		tabContainer._updateCloseButtons();

		if (overflow) {
			tabContainer.style.setProperty("--scrollbar-width", scrollbox.scrollbarWidth + "px");
			tabContainer._unlockTabSizing();
			tabContainer._handleTabSelect(true);
			document.getElementById("tab-preview-panel")?.setAttribute("rolluponmousewheel", true);
		}

		timeEnd("scrollbox overflow");
	});

	let scrollbar;
	function getScrollbar() {
		if (!scrollbar?.isConnected)
			scrollbar = InspectorUtils.getChildrenForNode(scrollbox, true, false)
				.find(e => e.matches("scrollbar[orient=vertical]"));
		return arrowScrollbox.overflowing ? scrollbar : null;
	}
}

/** hack arrowScrollbox **/
{
	//fx 115, reset the cache in case the script is load after the box is overflowed
	delete arrowScrollbox._startEndProps;
	
	Object.defineProperty(arrowScrollbox, "lineScrollAmount", {get: () => tabHeight * prefs.linesToScroll, configurable: true});
	Object.defineProperty(arrowScrollbox, "scrollIncrement", {get: () => tabHeight * prefs.linesToDragScroll, configurable: true});
	if (!("overflowing" in arrowScrollbox)) //fx 115
		Object.defineProperty(arrowScrollbox, "overflowing", {
			get: function() {return this.hasAttribute("overflowing")},
			configurable: true,
		});

	let {getAttribute, on_scroll, on_scrollend, _boundsWithoutFlushing} = arrowScrollbox;
	
	//Make it think it's vertical and save a lot of modifications.
	//Do not modify the attribute directly as it may break the layout.
	arrowScrollbox.getAttribute = function(n) {
		if (n == "orient") return "vertical";
		return getAttribute.call(this, n);
	};

	let lastScrollTop;
	arrowScrollbox.on_scroll = function(e) {
		if (e.target != scrollbox) return;
		on_scroll.apply(this, arguments);

		let {scrollTop, scrollTopMax} = scrollbox;
		this.style.setProperty("--scroll-top", (fakeScrollbar.scrollTop = scrollTop) + "px");
		if (scrollTop != lastScrollTop && scrollTopMax && scrollTopMax >= lastScrollTop
				&& this.overflowing)
			this.setAttribute("scrollsnap", "");
		else
			//1. toggling the css overflow property
			//2. shrinking the box height that can't scroll that much anymore
			//3. underflow after unlocking the slot size
			//these cases will cause a scroll event with no scrollend afterward
			//clear the _isScrolling to prevent incorrect determine
			this._isScrolling = false;
		lastScrollTop = scrollTop;
	};
	arrowScrollbox.on_scrollend = function(e) {
		if (e.target != scrollbox) return;
		on_scrollend.apply(this, arguments);

		this.removeAttribute("scrollsnap");
	};

	//make updateScrollButtonsDisabledState gets a correct result when the first / last tab is translated
	arrowScrollbox._boundsWithoutFlushing = function(ele) {
		let r = _boundsWithoutFlushing.apply(this, arguments);
		if (ele.style.transform) {
			let x = ele.screenX - root.screenX;
			let y = ele.screenY - root.screenY;
			r.x = r.left = x;
			r.y = r.top = y;
			r.right = x + r.width;
			r.bottom = y + r.height;
		}
		return r;
	};

	Object.defineProperty(arrowScrollbox, "lockScroll", {
		get: function() {return this.hasAttribute("lockscroll")},
		set: function(v) {
			if (this.lockScroll == v) return;
			let update = () => this.toggleAttribute("lockscroll", v);
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
	let FSToggle = FullScreen.toggle;
	FullScreen.toggle = function() {
		gNavToolboxResizeObserver[window.fullScreen ? "observe" : "unobserve"](tabContainer);
		return FSToggle.apply(this, arguments);
	};
}

//the original scrollIntoView always scroll to ensure the tab is on the first visible row,
//for instance, when scrolling the box and the cursor touch the selected tab, will cause an annoying bouncing,
//fix it to be ensuring the tab is in view, if it already is, do nothing.
//use getRect() instead of getBoundingClientRect(), since when dragging tab too fast the box will scroll to half row
//because _handleTabSelect will try to scroll the translated position into view
customElements.get("tabbrowser-tab").prototype.scrollIntoView = function(args) {
	let rect = getRect(this);
	let box = this.parentNode.scrollbox;
	let boxRect = getRect(box);
	let top = rect.top - boxRect.top;
	let bottom = rect.bottom - boxRect.bottom;
	let left = rect.left - boxRect.left;
	let right = rect.right - boxRect.right;
	if (top < 0 || bottom > 0 || left < 0 || right > 0)
		box.scrollTo({
			left: box.scrollLeft + (left < 0 ? left : right > 0 ? right : 0),
			top: box.scrollTop + (top < 0 ? top : bottom > 0 ? bottom : 0),
			behavior: args?.behavior,
		});
};

{
	let {
		startTabDrag, on_dragover, on_dragend, on_drop, on_dragleave,
		_finishAnimateTabMove, _unlockTabSizing, _updateCloseButtons,
		_handleTabSelect, uiDensityChanged,
	} = tabContainer;
	let lockScrollTimeout;
	
	if (!("overflowing" in tabContainer)) //fx 115
		Object.defineProperty(tabContainer, "overflowing", {
			get: function() {return this.hasAttribute("overflow")},
			configurable: true,
		});

	//clear the cache in case the script is loaded with delay
	tabContainer._pinnedTabsLayoutCache = null;

	//the original function modifies --tab-overflow-pinned-tabs-width and cause undesired size changing of the slot,
	//which will cause weird bouncing of the scroll position,
	//plus the positioning is not the same logic, thus rewrite it and not wrap it.
	tabContainer._positionPinnedTabs = function() {
		if (this._hasTabTempMaxWidth) return;

		let numPinned = gBrowser[PINNED_TAB_COUNT];
		if (!numPinned && !this._lastNumPinned)
			return;

		time("_positionPinnedTabs - calculation");

		let width, columns;
		let gap = prefs.gapAfterPinned;

		let layoutData = this._pinnedTabsLayoutCache;
		let uiDensity = root.getAttribute("uidensity");
		if (!layoutData || layoutData.uiDensity != uiDensity)
			layoutData = this._pinnedTabsLayoutCache = {
				uiDensity,
				scrollStartOffset: gap,
			};

		let tabs = gBrowser.visibleTabs;
		let floatPinnedTabs = numPinned && tabs.length > numPinned && arrowScrollbox.overflowing;

		if (floatPinnedTabs) {
			width = (layoutData.width ||= getRect(tabs[0]).width);
			columns = Math.ceil(numPinned / getRowCount());
			floatPinnedTabs = columns * width + gap + this._tabMinWidthPref + scrollbox.scrollbarWidth
					<= getRect(this, {inner: true}).widthDouble;
		}

		timeEnd("_positionPinnedTabs - calculation");

		time("_positionPinnedTabs - update");

		let updatePinnedLayout;

		if (this._lastNumPinned != numPinned) {
			updatePinnedLayout = !floatPinnedTabs;
			this.toggleAttribute("haspinnedtabs", !!numPinned);
			this._lastNumPinned = numPinned;
			this._handleTabSelect(true);
		}

		let isPositioned = this.hasAttribute("positionpinnedtabs");

		if (isPositioned != floatPinnedTabs)
			updatePinnedLayout = true;

		this.toggleAttribute("positionpinnedtabs", floatPinnedTabs);

		tabs = tabs.slice(0, numPinned);
		if (floatPinnedTabs) {
			this.style.setProperty("--tab-overflow-pinned-tabs-width", columns * width + "px");

			tabs.forEach((tab, i) => {
				assign(tab.style, {
					marginInlineStart: -((columns - i % columns) * width + gap) + "px",
					marginTop: Math.floor(i / columns) * tabHeight + "px",
				});
				tab._pinnedUnscrollable = true;
			});

			if (debug)
				console.debug(`position pinned tabs`, true, new Error().stack);
		} else if (isPositioned) {
			for (let tab of tabs) {
				assign(tab.style, {marginTop: "", marginInlineStart: ""});
				tab._pinnedUnscrollable = false;
			}
			this.style.removeProperty("--tab-overflow-pinned-tabs-width");

			if (debug)
				console.debug(`position pinned tabs`, false, new Error().stack);
		}

		timeEnd("_positionPinnedTabs - update");

		if (updatePinnedLayout && prefs.tabsUnderControlButtons)
			this._updateTabsbarPlaceHolder();
	};
	//remove the margin when unpinned, as the modified _positionPinnedTabs does not handle the normal tabs,
	//which are handled in the original function.
	//the rest of clean up is done by gBrowser.unpinTab()
	tabContainer.addEventListener("TabUnpinned", e => e.target.style.marginTop = "");

	tabContainer.startTabDrag = function(e, tab) {
		//don't execute the original #moveTogetherSelectedTabs, which can't be replaced
		let {multiselected} = tab;
		if (multiselected) {
			this._groupSelectedTabs(tab);
			tab.removeAttribute("multiselected");
		}

		startTabDrag.apply(this, arguments);

		assign(tab._dragData, {
			atTabX: e.screenX - tab.screenX,
			atTabY: e.screenY - tab.screenY,
			screenY: e.screenY, /*fx115*/
		});
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
				addTransformInfo(tranInfos, tab._tPos, getRect(tab), getRect(visibleTabs[i + shift]));
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

			for (let tab of visibleTabs.slice(gBrowser[PINNED_TAB_COUNT])) {
				let {style} = tab;
				style.minWidth = style.maxWidth = "";
				style.removeProperty("--moving-tab-width-adjustment");
			}
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
					if (finished)
						return;
					postTransitionCleanup();
					console.error("transition is not ended");
				}, debug == 2 ? 3000: 200);
			}

			timeEnd("_finishGroupSelectedTabs");
		}
		_finishMoveTogetherSelectedTabs.apply(this, arguments);
	};

	tabContainer.on_dragover = function(e) {
		if (!this.hasAttribute("dragging")) {
			time("on_dragover - setup");
			this.setAttribute("dragging", "");
			lockSlotSize();
			arrowScrollbox.lockScroll = true;
			clearTimeout(lockScrollTimeout);
			lockScrollTimeout = setTimeout(() => arrowScrollbox.lockScroll = false, this._dragOverDelay);
			fakeScrollbar.scrollTop = scrollbox.scrollTop;
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
		let numPinned = gBrowser[PINNED_TAB_COUNT];
		let lastTab = visibleTabs.at(-1);
		let lastPos = lastTab._tPos;
		let firstNormalTab = visibleTabs[numPinned];
		let useEnd;

		if (!this.hasAttribute("movingtab")) {
			let dt = e.dataTransfer;
			let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
			let sameWindow = draggedTab?.ownerDocument == document;

			if (draggedTab?._dragData.fromTabList && sameWindow && dt.dropEffect != "copy") {
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
		newMarginY = tabRect.top + tabRect.height - rect.top - rect.height;
		newMarginY += rect.height / 2 - tabRect.height / 2;

		ind.style.transform = `translate(calc(${newMarginX}px + 50% * ${LTR1}), ${newMarginY}px)`;

		timeEnd("on_dragover - update indicator");
	};

	//since the original _animateTabMove will modify the transform property and cause improper transition animation,
	//rewite the whole _animateTabMove and not execute the original one
	tabContainer._animateTabMove = function(e) {
		let draggedTab = e.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);
		let {_dragData, pinned} = draggedTab;
		let {screenX: eX, screenY: eY} = e;

		if (eX == _dragData.lastScreenX && eY == _dragData.lastScreenY
				&& !arrowScrollbox._isScrolling)
			return;

		time("_animateTabMove");

		let {movingTabs} = _dragData;
		let {scrollTop} = scrollbox;

		let firstRun = !this.hasAttribute("movingtab");

		//the animate maybe interrupted and restart, don't initialize again
		if (firstRun && !_dragData.tabRects) {
			let boxStart, boxEnd;
			let {top: boxTop, bottom: boxBottom} = getRect(scrollbox);
			let numPinned = gBrowser[PINNED_TAB_COUNT];
			let {visibleTabs} = gBrowser;
			let tabs = visibleTabs.slice(
				pinned ? 0 : numPinned,
				pinned ? numPinned : undefined
			);
			if (pinned && tabContainer.hasAttribute("positionpinnedtabs")) {
				let rowEnd = tabs[0];
				for (let i = 1, n = tabs.length; i < n && pointDeltaH(rowEnd.screenX, tabs[i].screenX) < 0; i++)
					rowEnd = tabs[i];
				boxStart = getRect(tabs[0]).start;
				boxEnd = getRect(rowEnd).end;
			} else
				({start: boxStart, end: boxEnd} = getRect(slot));
			let placeholderWidth = parseFloat(getComputedStyle(slot, "::after").width) || 0;

			let idxInMoving = movingTabs.indexOf(draggedTab);
			let firstMoving = movingTabs[0];
			let lastMoving = movingTabs.at(-1);
			let movingCount = movingTabs.length;
			let movingAfterCount = movingCount - 1 - idxInMoving;

			//TODO: handle slot resizing, tab count changing...
			assign(_dragData, {
				winSX: root.screenX,
				winSY: root.screenY,
				visibleTabs,
				allTabs: tabContainer.allTabs,
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
					r.top += scrollTop;
					r.bottom += scrollTop;
					return [t._tPos, r];
				})),
				singleRow: getRowCount() == 1,
				boxStart, boxEnd, boxTop, boxBottom,
				placeholderStart: boxEnd - placeholderWidth * LTR1,
				placeholderBottom: boxTop + (placeholderWidth && tabHeight),
				scrollPos: scrollTop, //fx115
			});

			timeLog("_animateTabMove", "init");
		}

		let {
			winSX, winSY, tabs, atTabX, atTabY,
			boxStart, boxEnd, boxTop, boxBottom,
			placeholderBottom, placeholderStart,
			visibleTabs, allTabs, singleRow,
			tabRects, firstMoving, lastMoving,
			movingBeforeCount, movingAfterCount, movingCount,
			first, last, firstMovingIdx, lastMovingIdx, draggedTabIdx,
		} = _dragData;

		assign(_dragData, {lastScreenX: eX, lastScreenY: eY});

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
							- draggedEnd - tranWidth * LTR1;
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
			if (!pinned)
				y += scrollTop - _dragData.scrollPos;
			tranX = Math[RTL_UI?"max":"min"](Math[RTL_UI?"min":"max"](x, startBound), endBound);
			tranY = Math.min(Math.max(y, topBound), bottomBound);

			tranCenterX = Math.round(draggedStart + tranX + (targetWidth || draggedWidth) / 2 * LTR1);
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
			tranShift = (RTL_UI ? draggedWidthDouble - atTabX : atTabX) * (1 - 1 / draggedWidthDouble * targetWidth) * LTR1;
			virtualStart += tranShift;
			virtualEnd += tranShift + tranWidth * LTR1;
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
				addTransformInfo(
					tranInfos,
					tab._tPos,
					rect(tab),
					rect(tabs[targetIdx + tabs.indexOf(tab) - draggedTabIdx]),
					tranX + draggedStart - targetStart,
					tranY + draggedTop - targetTop,
					!pinned
				);

		let bgTabs = moveBackward ?
				tabs.slice(dropIdx, firstMovingIdx)
				: tabs.slice(lastMovingIdx + 1, dropIdx);

		for (let tab of bgTabs)
			addTransformInfo(tranInfos, tab._tPos, rect(tab), rect(tabs[tabs.indexOf(tab) + movingCount * (moveBackward ? 1 : -1)]));

		setTransform(tranInfos, tabs, scrollTop);

		timeEnd("_animateTabMove");

		if (firstRun) {
			//setup the attributes at the end can save 10ms+ reflow time
			this.toggleAttribute("movingpinnedtab", pinned);
			this.toggleAttribute("movingsingletab", _dragData.movingTabs.length == 1);
			this.setAttribute("movingtab", true);
			gNavToolbox.setAttribute("movingtab", true);
			if (!draggedTab.multiselected)
				this.selectedItem = draggedTab;
		}

		function rect(tab) {
			let r = {...tabRects[tab._tPos]};
			r.top -= scrollTop;
			r.bottom -= scrollTop;
			return r;
		}

		if (debug) {
			tabs.forEach(t => t.style.outline = t.style.boxShadow = "");
			first.style.boxShadow = last.style.boxShadow = "0 0 0 1px inset red";
			target.style.outline = "1px solid lime";
			let insertPoint = tabs.find(t => t._tPos >= draggedTab._dragData.animDropIndex);
			insertPoint && (insertPoint.style.outline = "1px solid yellow");
		}

		if (debug == 2) {
			let {style} = tabsBar;
			style.setProperty("--drag-x", virtualCenterX - winSX + "px");
			style.setProperty("--drag-y", virtualCenterY - winSY + "px");
			style.setProperty("--drag-tran-width", targetWidth + "px");
			style.setProperty("--drag-tran-x", tranCenterX - winSX + "px");
			style.setProperty("--drag-tran-y", tranCenterY - winSY + "px");
			style.setProperty("--drag-width", draggedWidth + "px");
		}
	};

	function addTransformInfo(infos, pos, tabRect, targetRect, offsetX = 0, offsetY = 0, floating) {
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

	function setTransform(infos, tabs, scrollTop = 0) {
		for (let tab of tabs) {
			let {style} = tab;
			let o = infos[tab._tPos];
			style.transform = o ? `translate(${o.x}px, ${o.floating ? `calc(${o.y - scrollTop}px + var(--scroll-top, 0px))` : o.y + "px"})` : "";
			if (!tab.pinned) {
				style.minWidth = style.maxWidth = o?.delta ? o.width + "px" : "";
				style[o?.delta ? "setProperty" : "removeProperty"]("--moving-tab-width-adjustment", o?.delta + "px");
			}
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
			tabContainer.setAttribute("animatefinishing", "");
			Promise.all(transitions).then(() => {
				this._finishAnimateTabMove();
				tabContainer.removeAttribute("animatefinishing");
			});
		}

		postDraggingCleanup();
	};

	tabContainer._finishAnimateTabMove = function() {
		if (this.hasAttribute("movingtab")) {
			this.removeAttribute("movingpinnedtab");
			this.removeAttribute("movingsingletab");
			for (let tab of gBrowser.visibleTabs.slice(gBrowser[PINNED_TAB_COUNT])) {
				let {style} = tab;
				style.minWidth = style.maxWidth = "";
				style.removeProperty("--moving-tab-width-adjustment");
			}
		}
		return _finishAnimateTabMove.apply(this, arguments);
	};

	function postDraggingCleanup() {
		clearTimeout(lockScrollTimeout);
		tabContainer.removeAttribute("dragging");
		unlockSlotSize(true);
		arrowScrollbox.lockScroll = false;
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
	let lastTabsWinDelta, lastWinMaxWidth, lastNumPinned, lastTabsPaddingStart,
			lastPreTabsItemsSize, lastPostTabsItemsSize;

	tabContainer._updateTabsbarPlaceHolder = function(numPinned = gBrowser[PINNED_TAB_COUNT]) {
		time("_updateTabsbarPlaceHolder");
		if (this.overflowing) {
			if (lastTabsWinDelta) {
				placeholderStyle.innerHTML = "";
				let {style} = tabsBar;
				style.removeProperty("--pre-tabs-items-width");
				style.removeProperty("--post-tabs-items-width");
				lastTabsWinDelta = lastWinMaxWidth = lastNumPinned = lastTabsPaddingStart
						= lastPreTabsItemsSize = lastPostTabsItemsSize = null;
			}
			timeEnd("_updateTabsbarPlaceHolder");
			return;
		}

		let tabsRect = getRect(this, {outer: true});
		let winRect = getRect(root);
		let firstTabRect = getRect(gBrowser.visibleTabs[0]);
		let winWidth = winRect.width;
		let tabsWinDelta = winWidth - tabsRect.width;
		let preTabsItemsSize = pointDeltaH(tabsRect.start, winRect.start);
		let postTabsItemsSize = pointDeltaH(winRect.end, tabsRect.end);
		let tabsPaddingStart = pointDeltaH(firstTabRect.start, tabsRect.start);
		let normalMinWidth = this._tabMinWidthPref
				+ (appVersion == 115 && root.getAttribute("uidensity") == "touch" ? 10 : 0);
		let winMaxWidth = Math.max(screen.width - screen.left + 8, winWidth + normalMinWidth);

		//probably there are too many buttons in tabsbar and no space for even one tab in the first row
		if (tabsPaddingStart < 0) {
			let cs = getComputedStyle(slot, "::before");
			tabsPaddingStart = parseFloat(cs.marginInlineEnd)
					+ parseFloat(cs.borderInlineEndWidth) + parseFloat(cs.paddingInlineEnd);
		}

		if (numPinned == lastNumPinned
				&& tabsWinDelta == lastTabsWinDelta
				&& winMaxWidth == lastWinMaxWidth
				&& preTabsItemsSize == lastPreTabsItemsSize
				&& postTabsItemsSize == lastPostTabsItemsSize
				&& tabsPaddingStart == lastTabsPaddingStart) {
			timeEnd("_updateTabsbarPlaceHolder");
			return;
		}

		let minWinWidth = numPinned && parseInt(getComputedStyle(root).minWidth);

		lastNumPinned = numPinned;
		lastTabsWinDelta = tabsWinDelta;
		lastWinMaxWidth = winMaxWidth;
		lastTabsPaddingStart = tabsPaddingStart;

		tabsBar.style.setProperty("--pre-tabs-items-width", (lastPreTabsItemsSize = preTabsItemsSize) + "px");
		tabsBar.style.setProperty("--post-tabs-items-width", (lastPostTabsItemsSize = postTabsItemsSize) + "px");

		let adjacentNewTab = this.hasAttribute("hasadjacentnewtabbutton");
		let base = preTabsItemsSize + postTabsItemsSize + tabsPaddingStart;
		let pinnedWidth = firstTabRect.width;

		let css = `
			@media (max-width: ${base + (numPinned ? pinnedWidth : normalMinWidth) - 1}px) {
				#tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(slot)::before {width: 100vw}
				#tabbrowser-tabs[multirows]:not([overflow]) #tabbrowser-arrowscrollbox::part(slot)::after {visibility: collapse}
				#tabbrowser-arrowscrollbox > * {order: 2}
			}
		`;
		if (adjacentNewTab)
			css += `
				@media (max-width: ${base + (numPinned ? pinnedWidth : normalMinWidth) + newTabButtonWidth - 1}px) {
					.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])),
					.tabbrowser-tab:nth-child(1 of :not([hidden])):nth-last-child(1 of .tabbrowser-tab:not([hidden])) ~ *
						{order: 2}
				}
			`;
		if (numPinned) {
			base += pinnedWidth;

			//wrap pinned tabs
			for (let i = 1; i < numPinned; i++) {
				let min = base, max = (base += pinnedWidth) - 1;
				if (max >= minWinWidth)
					css += `
						@media (min-width: ${min}px) and (max-width: ${max}px) {
							.tabbrowser-tab:nth-child(${i} of :not([hidden])) ~ * {order: 2}
						}
					`;
			}
			//remove the gap after pinned to prevent the last pinned being wrapped, and force all non-pinned to wrap
			css += `
				@media (min-width: ${base}px) and (max-width: ${base + prefs.gapAfterPinned - 1}px) {
					.tabbrowser-tab:nth-last-child(1 of [pinned]:not([hidden])) {--gap-after-pinned: 0px}
					.tabbrowser-tab[pinned] ~ :not([pinned]) {order: 2}
				}
			`;
			//wrap the last pinned tab adjacent with new tab
			if (adjacentNewTab)
				css += `
					@media (min-width: ${base}px) and (max-width: ${base + newTabButtonWidth - 1}px) {
						.tabbrowser-tab[pinned]:nth-last-child(2 of .tabbrowser-tab:not([hidden])) ~ * {order: 2}
					}
				`;
			base += prefs.gapAfterPinned;
		}
		for (let i = 0; base <= winMaxWidth; i++) {
			//wrap normal tabs
			css += `
				@media (min-width: ${base}px) and (max-width: ${(base += normalMinWidth) - 1}px) {
					.tabbrowser-tab:nth-child(${numPinned + i} of :not([hidden])) ~ * {order: 2}
				}
			`;
			//wrap the last normal tab adjacent with new tab
			if (adjacentNewTab && base <= winMaxWidth)
				css += `
					@media (min-width: ${base}px) and (max-width: ${base + newTabButtonWidth - 1}px) {
						.tabbrowser-tab:nth-child(${numPinned + i} of :not([hidden])):nth-last-child(2 of .tabbrowser-tab:not([hidden])) ~ * {order: 2}
					}
				`;
		}

		if (placeholderStyle.innerHTML != css) {
			if (debug)
				console.debug("update css", new Error().stack);
			placeholderStyle.innerHTML = css;
		}

		timeEnd("_updateTabsbarPlaceHolder");
	}

	if (prefs.tabsUnderControlButtons) {
		//_positionPinnedTabs is triggered when TabPinned or TabUnpinned happen, so don't need to listen to them,
		//pinned tabs can't be hidden thus TabShow and TabHide don't bother
		["TabClose", "TabOpen"].forEach(n =>
				tabContainer.addEventListener(n, ({target}) => {
					if (target.pinned)
						//pinnedTabCount doesn't update yes when TabClose is dispatched
						tabContainer._updateTabsbarPlaceHolder(gBrowser[PINNED_TAB_COUNT] - (n == "TabClose" ? 1 : 0));
				}, true));

		//wait 2 frames to let the layout settle down
		addEventListener("resize", e => {
			if (e.target != window) return;
			requestAnimationFrame(() => requestAnimationFrame(() => tabContainer._updateTabsbarPlaceHolder()));
		}, true);
	}

	tabContainer._handleTabSelect = function() {
		if (!arrowScrollbox._isScrolling && !this.hasAttribute("movingtab"))
			_handleTabSelect.apply(this, arguments);
	};

	//need too much thing to hack for the original function, thus rewrite it and not wrap it.
	//now this function is not only for close tab by mouse, but also add / remove tab by command.
	//tabWidthClosedByClick is provided only if the function is called by original closed by mouse event
	tabContainer._lockTabSizing = function(actionTab, tabWidthClosedByClick) {
		let tabs = gBrowser.visibleTabs.slice(gBrowser[PINNED_TAB_COUNT]);
		if (!tabs.length) return;
		time("_lockTabSizing");

		let lastTab = tabs.at(-1);
		let lastRowTop = lastTab.screenY;
		timeLog("_lockTabSizing", "reflow");
		let {closing, _tPos, screenY: actionTabTop} = actionTab;
		let isLastRow = actionTabTop == lastRowTop;
		let isEndTab = _tPos > lastTab._tPos;
		let nearByTab = closing ?
				tabs.findLast(t => t._tPos < _tPos)
				: tabs.find(t => t._tPos > _tPos);
		let isRowEdge = nearByTab?.screenY != actionTabTop;

		timeLog("_lockTabSizing", "calculation");

		if (tabWidthClosedByClick)
			this._lastTabClosedByMouse = true;

		if (isEndTab && !isRowEdge) {
			//prevent unlocking tabs when lock tabs concurrently
			if (this._lastTabClosedByMouse || !this._hasTabTempMaxWidth)
				//let the tabs in the last row to expend to fit
				for (let i = tabs.length - 1; tabs[i]?.screenY == actionTabTop; i--)
					assign(tabs[i].style, {maxWidth: "", minWidth: ""});
		} else {
			let lockLastRowWhenOpening;
			if (!closing) {
				let lastRowTabsCount = tabs.length - tabs.findLastIndex(t => t.screenY != lastRowTop) - 1;
				let totalWidth = (lastRowTabsCount + (!isLastRow && isRowEdge ? 1 : 0)) * tabContainer._tabMinWidthPref;
				if (totalWidth > getRect(slot).width)
					lockLastRowWhenOpening = true;
			}

			//lock the current row, and the previous row if closing the first tab of current row
			let lockTabs = tabs.filter(tab => {
				let {screenY} = tab;
				return !tab.closing && tab._fullyOpen
					&& (screenY == actionTabTop && (!isLastRow || lockLastRowWhenOpening || tabWidthClosedByClick)
							|| isRowEdge && screenY == actionTabTop + tabHeight * (closing ? -1 : 1)
									&& !(!closing && screenY == lastRowTop && !lockLastRowWhenOpening));
			});
			if (!closing)
				lockTabs = lockTabs.slice(0, -1);

			if (lockTabs.length) {
				let sizes = lockTabs.map(t => t.getBoundingClientRect().width + "px");
				lockTabs.forEach((tab, i) => {
					let width = sizes[i];
					assign(tab.style, {maxWidth: width, minWidth: width, transition: "none"});
				});

				promiseDocumentFlushed(() => {}).then(() => requestAnimationFrame(() => {
					for (let tab of lockTabs)
						tab.style.transition = "";
				}));

				//prevent unlocking tabs when lock tabs concurrently
				if (this._lastTabClosedByMouse || !this._hasTabTempMaxWidth)
					for (let tab of tabs.slice(tabs.indexOf(lockTabs.at(-1)) + 1))
						assign(tab.style, {maxWidth: "", minWidth: ""});

				this._hasTabTempMaxWidth = true;
			}

			if (tabWidthClosedByClick) {
				if (isLastRow)
					this._expandSpacerBy(tabWidthClosedByClick);
				else {
					this._closingTabsSpacer.style.width = 0;
					gBrowser.addEventListener("mousemove", this);
					addEventListener("mouseout", this);
				}
				//lock the slot to prevent the spacer cause overflowing of the scrollbox
				lockSlotSize();
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
		if (this._hasTabTempMaxWidth)
			for (let tab of gBrowser.visibleTabs.slice(gBrowser[PINNED_TAB_COUNT]))
				tab.style.minWidth = "";
		timeEnd("_unlockTabSizing");

		_unlockTabSizing.call(this);
	};
	
	tabContainer.uiDensityChanged = function() {
		time("uiDensityChanged");
		
		let {newTabButton} = this;
		
		newTabButton.style.setProperty("display", "flex", "important");
		newTabButtonWidth = newTabButton.clientWidthDouble;
		newTabButton.style.display = "";
		
		root.style.setProperty("--tab-height", (tabHeight = gBrowser.selectedTab.clientHeight) + "px");
		this.style.setProperty("--new-tab-button-width", newTabButtonWidth + "px");
		
		timeEnd("uiDensityChanged");
		
		uiDensityChanged.apply(this, arguments);
		
		updateNavToolboxNetHeight();
		tabContainer._updateTabsbarPlaceHolder();
	};

	function lockSlotSize() {
		let {style} = arrowScrollbox;
		let rect = getRect(slot);
		style.setProperty("--slot-width", rect.width + "px");
		style.setProperty("--slot-height", rect.height + "px");
	}

	function unlockSlotSize(instant) {
		let oldHeight = slot.clientHeight, scrollBottom = scrollbox.scrollTopMax - scrollbox.scrollTop;

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
	let {addTab, removeTab} = gBrowser;

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
				}, debug == 2 ? 3000: 200);
			}
		}
		return tab;
	};

	gBrowser.removeTab = function(tab) {
		let toHandle = !tab.pinned && !tab.closing;

		if (toHandle)
			//ensure the animation is kicked off when concurrently closing tabs,
			//as the tab may be locked when the previous tab closed
			assign(tab.style, {minWidth: "", transition: ""});

		removeTab.apply(this, arguments);

		//if there is no animation, the tab is removed directly
		if (!tab.isConnected)
			tabContainer._unlockTabSizing(true);
		else if (toHandle && !tabContainer._lastTabClosedByMouse && tab.closing) {
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
				}, debug == 2 ? 3000: 200);
			}
		}
	};
}

if (prefs.hideAllTabs)
	document.getElementById("alltabs-button").hidden = true;

function getRowCount() {
	return ~~(scrollbox.clientHeight / tabHeight);
}

function updateNavToolboxNetHeight(e) {
	time("updateNavToolboxNetHeight");
	let menubar = document.getElementById("toolbar-menubar");
	let personalbar = document.getElementById("PersonalToolbar");
	let menubarAutoHide = menubar.hasAttribute("autohide");
	let personalbarAutoHide = personalbar.collapsed && gBookmarksToolbarVisibility == "newtab";

	if (menubarAutoHide)
		menubar.removeAttribute("inactive");
	if (personalbarAutoHide)
		personalbar.collapsed = false;

	root.style.setProperty("--nav-toolbox-net-height", (gNavToolbox.getBoundingClientRect().height - scrollbox.clientHeight) + "px");
	
	if (menubarAutoHide)
		menubar.setAttribute("inactive", true);
	if (personalbarAutoHide)
		personalbar.collapsed = true;
	timeEnd("updateNavToolboxNetHeight");
}

function pointDelta(a, b = 0) {
	let delta = a - b;
	return Math.abs(delta) < .02 ? 0 : delta;
}

function pointDeltaH(a, b = 0) {
	return pointDelta(a, b) * LTR1;
}

/*return the position based on screenX and screenY*/
function getRect(ele, {outer, accurate, inner, visual} = {}) {
	let {width, height, x, y} = ele.getBoundingClientRect(), {screenX, screenY} = ele;
	let marginStart = 0, marginEnd = 0, marginTop = 0, marginBottom = 0;
	if (inner || outer) {
		let cs = getComputedStyle(ele);
		if (inner) {
			width = ele.clientWidthDouble;
			height = ele.clientHeightDouble;
		}
		if (cs.display != "none" && cs.visibility != "collapse") {
			if (outer) {
				marginStart = parseFloat(cs.marginInlineStart);
				marginEnd = parseFloat(cs.marginInlineEnd);
				marginTop = parseFloat(cs.marginTop);
				marginBottom = parseFloat(cs.marginBottom);
			} else {
				marginStart = parseFloat(cs.paddingInlineStart) * -1;
				marginEnd = parseFloat(cs.paddingInlineEnd) * -1;
				marginTop = parseFloat(cs.paddingTop) * -1;
				marginBottom = parseFloat(cs.paddingBottom) * -1;
			}
		}
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
	let start = round(x + (RTL_UI ? width : 0) - marginStart * LTR1);
	let end = round(x + (RTL_UI ? 0 : width) + marginEnd * LTR1);
	let top = round(y - marginTop);
	let bottom = round(y + height + marginBottom);
	let outerWidth = width + marginStart + marginEnd;
	let outerHeight = height + marginTop + marginBottom;
	return {
		start, end, top, bottom,
		width: visual ? (end - start) * LTR1 : round(outerWidth),
		height: visual ? bottom - top : round(outerHeight),
		widthDouble: outerWidth,
		heightDouble: outerHeight,
	};
}

timeEnd("setup");
} //end function setup()

} catch(e) {alert(["MultiTabRows@Merci.chao.uc.js",e,e.stack].join("\n"));console.error(e)}