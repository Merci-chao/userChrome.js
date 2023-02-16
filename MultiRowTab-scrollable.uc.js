if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

var css =`
:root{
	--multirow-n-rows: 3;
	--multirow-tab-min-width: 76px;
	--tabs-newtab-button-width: 32px;
	--multirow-tab-dynamic-width: 1; /* Change to 0 for fixed-width tabs using the above width. */
}

/* Scrollbar can't be clicked but the rows can be scrolled with mouse wheel */
/* Uncomment the next line if you want to be able to use the scrollbar with mouse clicks */

/* #tabbrowser-arrowscrollbox{ -moz-window-dragging: no-drag } */

/* Uncommenting the above makes you unable to drag the window from empty space in the tab strip but normal draggable spaces will continue to work */

#tabbrowser-tabs{
	min-height: unset !important;
	padding-inline-start: 0px !important;
}

@-moz-document url(chrome://browser/content/browser.xhtml){
	#scrollbutton-up~spacer,
	#scrollbutton-up,
	#scrollbutton-down{ display: var(--scrollbutton-display-model,initial) }

	scrollbox[part][orient="horizontal"]{
		display: flex;
		flex-wrap: wrap;
		overflow-y: auto;
		max-height: calc((var(--tab-min-height) + var(--inline-tab-padding)) * var(--multirow-n-rows));
		scrollbar-width: thin;
	}
}

.scrollbox-clip[orient="horizontal"],
#tabbrowser-arrowscrollbox{
	overflow: -moz-hidden-unscrollable;
	display: block;
	--scrollbutton-display-model: none;
}

#tabbrowser-tabs .tabbrowser-tab[pinned]{
	position: static !important;
	margin-inline-start: 0px !important;
}

.tabbrowser-tab[fadein]:not([pinned]){
	min-width: var(--multirow-tab-min-width) !important;
	flex-grow: var(--multirow-tab-dynamic-width);
}

.tabbrowser-tab > stack{ width: 100%; height: 100% }

#alltabs-button { display: none !important }

.titlebar-spacer[type="pre-tabs"] {
	border-inline-end: 0 !important;
}

#tabbrowser-tabs:not([hashiddentabs]) #tabs-newtab-button {
	margin-inline-start: calc(0px - var(--tabs-newtab-button-width)) !important;
}

#tabbrowser-tabs:not([hashiddentabs]) .tabbrowser-tab:last-of-type {
	margin-inline-end: var(--tabs-newtab-button-width) !important;
}
`;

var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
sss.loadAndRegisterSheet(makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css)), sss.AGENT_SHEET);

{
	let {style} = document.documentElement;
	style.setProperty("--multirow-tab-min-width", Services.prefs.getIntPref("browser.tabs.tabMinWidth") + "px");
	style.setProperty("--tabs-newtab-button-width", document.getElementById("tabs-newtab-button").clientWidth + "px");
}

let tabs = gBrowser.tabContainer;
let isMultiRows = () => tabs.clientHeight > gBrowser.selectedTab.clientHeight + 1;

tabs._getDropIndex = function(event, isLink) {
	var tabs = this.allTabs;
	var tab = this._getDragTargetTab(event, isLink);
	if (!RTL_UI) {
		for (let i = tab ? tab._tPos : 0; i < tabs.length; i++) {
			let rect = tabs[i].getBoundingClientRect();
			if (event.clientX < rect.x + rect.width / 2
					&& event.clientY < rect.y + rect.height)
				return i;
		}
	} else {
		for (let i = tab ? tab._tPos : 0; i < tabs.length; i++) {
			let rect = tabs[i].getBoundingClientRect();
			if (event.clientX > rect.x + rect.width / 2
					&& event.clientY < rect.y + rect.height)
				return i;
		}
	}
	return tabs.length;
};

{
	let resizeObserver = new ResizeObserver(e => {
		if (FullScreen._isChromeCollapsed) {
			gNavToolbox.style.marginTop = -gNavToolbox.getBoundingClientRect().height + "px";
		} else {
			FullScreen.hideNavToolbox();
			FullScreen.showNavToolbox();
		}
	});
	let FSToggle = FullScreen.toggle;
	FullScreen.toggle = function() {
		resizeObserver[window.fullScreen ? "observe" : "unobserve"](tabs);
		return FSToggle.apply(this, arguments);
	};
}

{
	let dragging, multiRowDragging;
	let listener = {
		events: ["TabSelect", "dragstart", "dragover", "dragend", "drop"],
		handleEvent: e => listener[e.type].call(tabs, e),
		
		TabSelect: e => gBrowser.selectedTab.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"}),
		
		dragstart: e => {
			dragging = true;
			multiRowDragging = isMultiRows();
			
			if (multiRowDragging) {
				 let tab = tabs._getDragTargetTab(e, false);
				 let selectedTabs = gBrowser.selectedTabs;
				 while (selectedTabs.length) {
					let t = selectedTabs.pop();
					if (t._tPos > tab._tPos)
						gBrowser.moveTabTo(t, tab._tPos + 1);
					else if (t == tab)
						selectedTabs.reverse();
					else if (t._tPos < tab._tPos)
						gBrowser.moveTabTo(t, tab._tPos - 1);
				 }
			}
		},
		
		dragover: e => {
			if (dragging && !multiRowDragging) return;
			
			e.preventDefault();
			e.stopPropagation();

			let ind = tabs._tabDropIndicator;

			let newIndex = tabs._getDropIndex(e, false);
			if (newIndex == null)
				return;

			let {visibleTabs} = gBrowser;
			let ltr = !RTL_UI;
			let rect = tabs.arrowScrollbox.getBoundingClientRect();
			let newMarginX, newMarginY;
			if (newIndex == visibleTabs.length) {
				let tabRect = visibleTabs[newIndex - 1].getBoundingClientRect();
				if (ltr)
					newMarginX = tabRect.right - rect.left;
				else
					newMarginX = rect.right - tabRect.left;
				newMarginY = tabRect.top + tabRect.height - rect.top - rect.height; // multirow fix
				newMarginY += rect.height / 2 - tabRect.height / 2;
				
			} else if (newIndex != null || newIndex != 0) {
				let tabRect = visibleTabs[newIndex].getBoundingClientRect();
				if (ltr)
					newMarginX = tabRect.left - rect.left;
				else
					newMarginX = rect.right - tabRect.right;
				newMarginY = tabRect.top + tabRect.height - rect.top - rect.height; // multirow fix
				newMarginY += rect.height / 2 - tabRect.height / 2;
			}

			newMarginX += ind.clientWidth / 2;
			if (!ltr)
				newMarginX *= -1;

			ind.hidden = false;

			ind.style.transform = "translate(" + Math.round(newMarginX) + "px," + Math.round(newMarginY) + "px)"; // multirow fix
			ind.style.marginInlineStart = (-ind.clientWidth) + "px";
		},
		
		dragend: () => dragging = multiRowDragging = false,
		
		drop: e => {
			if (!multiRowDragging)
				return;
			
			let dt = e.dataTransfer;
			let dropEffect = dt.dropEffect;
			let draggedTab, movingTabs;
			if (dt.mozTypesAt(0)[0] == TAB_DROP_TYPE) {
				draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
				if (!draggedTab) {
				  return;
				}
				movingTabs = draggedTab._dragData.movingTabs;
				draggedTab.container._finishGroupSelectedTabs(draggedTab);
			}
			if (draggedTab && dropEffect == "copy") {}
			else if (draggedTab && draggedTab.container == tabs) {
				let newIndex = tabs._getDropIndex(e, false);
				let selectedTabs = gBrowser.selectedTabs;
				if (newIndex > selectedTabs[selectedTabs.length - 1]._tPos + 1)
					newIndex--;
				else if (newIndex >= selectedTabs[0]._tPos)
					newIndex = -1;
				else
					selectedTabs.reverse();
				
				if (newIndex > -1)
					selectedTabs.forEach(t => gBrowser.moveTabTo(t, newIndex));
			}
		},
	};
	
	listener.events.forEach(e => tabs.addEventListener(e, listener, true));
}

})()} catch(e) {alert(e);console.error(e)}

