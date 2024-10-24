if (location == "chrome://browser/content/browser.xhtml") setTimeout(()=>{try{
	
let {classes: Cc, interfaces: Ci, utils: Cu} = Components;

let prefBranchStr = "extensions.HistorySubmenus2@Merci.chao.";
let defPrefs = {
	historyCount: 25,
	submenuCount: 7,
	dateFormat: "%a",
};

let setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
		branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
let getPrefs = (branch, data) => Object.fromEntries(Object.entries(data).map(([name, value]) =>
		[name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));
setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defPrefs);
let prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defPrefs);


let SUBMENU_ID = "appMenu-HSM2-submenu";

/*
 * define utilities
 */
let HistorySubmenus2 = {
	placesBundle: Services.strings.createBundle("chrome://places/locale/places.properties"),

	locale: undefined,

	formatToken: {
		yearL: "%Y",
		year: "%y",
		monthL: "%M",
		month: "%m",
		dateL: "%D",
		date: "%d",
		age: "%a",
		monthNameL: "%N",
		monthName: "%n",
		monthNameN: "%e",
		weekDayL: "%W",
		weekDay: "%w",
		weekDayN: "%k",
		weekDayDeprecated : "%K",
	},

	formatDate(day, string) {
		let {placesBundle, dateFormatBundle, locale, formatToken: f} = this;
		let DTF = Intl.DateTimeFormat;

		let year = day.getFullYear();
		let month = day.getMonth() + 1;
		let monthName = new DTF(locale, {month: "short"}).format(day);
		let monthNameN = new DTF(locale, {month: "narrow"}).format(day);
		let monthNameL = new DTF(locale, {month: "long"}).format(day);
		let date = day.getDate();
		let weekDay = new DTF(locale, {weekday: "short"}).format(day);
		let weekDayN = new DTF(locale, {weekday: "narrow"}).format(day);
		let weekDayL = new DTF(locale, {weekday: "long"}).format(day);
		let weekDayDeprecated  = new DTF(locale, {weekday: "short"}).format(day);

		let age = parseInt((this.getStartOfDate(new Date()) - this.getStartOfDate(day)) / 1000 / 60 / 60 / 24);
		if (age < 2)
			age = placesBundle.GetStringFromName("finduri-AgeInDays-is-" + age);
		else
			age = placesBundle.formatStringFromName("finduri-AgeInDays-is", [age], 1);

		return string
				.replace(new RegExp(f.year, "g"), year % 100)
				.replace(new RegExp(f.yearL, "g"), year)
				.replace(new RegExp(f.month, "g"), month)
				.replace(new RegExp(f.monthL, "g"), month < 10 ? "0" + month : month)
				.replace(new RegExp(f.date, "g"), date)
				.replace(new RegExp(f.dateL, "g"), date < 10 ? "0" + date : date)
				.replace(new RegExp(f.weekDay, "g"), weekDay)
				.replace(new RegExp(f.weekDayL, "g"), weekDayL)
				.replace(new RegExp(f.weekDayN, "g"), weekDayN)
				.replace(new RegExp(f.weekDayDeprecated , "g"), weekDayDeprecated)
				.replace(new RegExp(f.monthNameN, "g"), monthNameN)
				.replace(new RegExp(f.monthName, "g"), monthName)
				.replace(new RegExp(f.monthNameL, "g"), monthNameL)
				.replace(new RegExp(f.age, "g"), age);
	},

	getStartOfDate(date) {
		date = new Date(date.getTime());

		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);
		date.setMilliseconds(0);

		return date;
	},

	uninitPopups(window) {
		Array.from(window.document.querySelectorAll("[historypopup=true]")).forEach(popup => {
			try {
				let menu = popup.parentNode;
				menu._placesView && menu._placesView.uninit();
			} catch(e) {
				console.error("Failed to uninit history popup", e);
			}
		});
	},

	bind(window) {
		this.uninitPopups(window);

		window.HistorySubmenus2 = this;

		/*with (window)*/ {
			let {
				BookmarksEventHandler, HistorySubmenus2,
				PlacesUtils, document, setInterval,
				clearInterval,
			} = window;
			let HistoryMenu = window.Function("return HistoryMenu")();
			let PlacesMenu = window.Function("return PlacesMenu")();
			
			let HMProto = HistoryMenu.prototype;
			
			/*
			 * save the original functions of HistoryMenu
			 */
			let HistorySubmenus2_OriginalFunctions = window.HistorySubmenus2_OriginalFunctions = {
				HM: {
					HM_placeProperty: Object.getOwnPropertyDescriptor(HMProto, "place"),
					HM_rebuildPopup: HMProto._rebuildPopup,
					HM_ensureMarkers: HMProto._ensureMarkers,
					HM_uninit: HMProto.uninit,

					get placeProperty() {
						return this.HM_placeProperty
								|| Object.getOwnPropertyDescriptor(PlacesMenu.prototype, "place")
								|| Object.getOwnPropertyDescriptor(window.Function("return PlacesViewBase")().prototype, "place");
					},
					get rebuildPopup() {
						return this.HM_rebuildPopup || PlacesMenu.prototype._rebuildPopup;
					},
					get ensureMarkers() {
						return this.HM_ensureMarkers || PlacesMenu.prototype._ensureMarkers;
					},
					get uninit() {
						return this.HM_uninit || PlacesMenu.prototype.uninit;
					},
				},
				
				BEH: {
					fillInBHTooltip: BookmarksEventHandler.fillInBHTooltip,
				},
			};
			
			/*
			 * wrap the fillInBHTooltip to fill the browse time of history item
			 */
			BookmarksEventHandler.fillInBHTooltip = function BEH_fillInBHTooltip(tooltip, aEvent) {
				let tooltipTime = tooltip.querySelector("#bhtTimeText");

				if (tooltipTime) {
					let {triggerNode} = tooltip;
					
					let node = triggerNode && triggerNode._placesNode;
					if (node && triggerNode.closest("[historypopup]")) {
						let date = new Date(node.time / 1000);
						tooltipTime.value = new Services.intl.DateTimeFormat(HistorySubmenus2.locale, {dateStyle: "long", timeStyle: "long"})
								.format(date);
						tooltipTime.hidden = false;
					} else
						tooltipTime.hidden = true;
				}

				return HistorySubmenus2_OriginalFunctions.BEH.fillInBHTooltip.apply(this, arguments);
			};

			/*
			 * wrap the setter of property "place"
			 * since the places uri is hard coded in constructor,
			 * so we intercept the places uri here
			 */
			HMProto.__defineSetter__("place", function(val) {
				/*
				 * update the max results property
				 */
				let currentMaxResults = /\d+/.exec(/maxResults=\d+/.exec(val));
				if (currentMaxResults != (prefs.historyCount || 1))
					val = val.replace("maxResults=" + currentMaxResults, "maxResults=" + (prefs.historyCount || 1));

				HistorySubmenus2_OriginalFunctions.HM.placeProperty.set.call(this, val);
			});

			HMProto.__defineGetter__("place", function() {
				return HistorySubmenus2_OriginalFunctions.HM.placeProperty.get.call(this);
			});

			/*
			 * properties
			 */
			HMProto._subResult = null;
			HMProto._subMenus = null;

			HMProto._updateSubMenus = function HM_prepareSubMenus() {
				if (!prefs.submenuCount)
					return false;
				
				/*
				 * create the query result of history
				 */
				if (!this._subResult) {
					let {history} = PlacesUtils;
					let queries = {};
					let options = {};
					let queryStr = "sort=" + Ci.nsINavHistoryQueryOptions.SORT_BY_DATE_DESCENDING +
							"&endTimeRef=" + Ci.nsINavHistoryQuery.TIME_RELATIVE_TODAY +
							"&endTime=" + (24 * 60 * 60 * 1000 * 1000);

					history.queryStringToQuery(queryStr, queries, options);
					this._subResult = history.executeQuery(queries.value, options.value);

					/*
					 * we keep the result open since it takes 0.5s for opening each time
					 */
					this._subResult.root.containerOpen = true;
				} else if (!this._subResult.root.containerOpen)
					this._subResult.root.containerOpen = true;

				/*
				 * prepare the result for each sub-menus
				 */
				let resultRoot = this._subResult.root;
				let {childCount} = resultRoot;
				let currentChildIndex = prefs.historyCount;

				for (let i in this._subMenus) {
					let submenu = this._subMenus[i];
					// let subpopup = submenu.lastChild;
					let timeOfSub = null;
					let result = submenu._result = [];

					/*
					 * assign the result for each sub-menu
					 */
					while (currentChildIndex < childCount) {
						let child = resultRoot.getChild(currentChildIndex);
						let timeOfChild = HistorySubmenus2.getStartOfDate(new Date(child.time / 1000)).getTime();

						/*
						 * get the results for one day
						 * we use the integer time comparing here since date object comparing is not via time value
						 */
						if (!timeOfSub) {
							timeOfSub = timeOfChild;
							result.push(child);
						} else if (timeOfChild == timeOfSub)
							result.push(child);
						else if (timeOfChild < timeOfSub)
							break;

						currentChildIndex++;
					}

					/*
					 * update the status of sub-menu
					 */
					if (!result.length) {
						submenu.hidden = true;
						submenu.removeAttribute("label");
					} else {
						hasSubShow = true;
						submenu.hidden = false;
						submenu.setAttribute("label", HistorySubmenus2.formatDate(new Date(timeOfSub), prefs.dateFormat));

						if (submenu.open && submenu.tagName == "menu")
							submenu._placesView._rebuildPopup(submenu.lastChild);
					}
				}
				
				return true;
			},

			/*
			 * wrap the _rebuildPopup
			 * we do some preparation for sub-menus after building top-menu
			 */
			HMProto._rebuildPopup = function HM_rebuildPopup(popup) {
				/*
				 * in case the popup has initialized before HSM2 is bound
				 */
				if (!popup.hasAttribute("historypopup")) {
					popup.setAttribute("historypopup", true);
					this.place = this.place;
				}

				/*
				 * call the original _rebuildPopup or the default one
				 */
				let result = HistorySubmenus2_OriginalFunctions.HM.rebuildPopup.apply(this, arguments);

				/*
				 * build the sub-menus when history menu opens at the first time
				 */
				if (!this._subMenus)
				 	this._rebuildSubMenus(popup);

				/*
				 * prepare for sub-menus
				 */
				popup._endMarker.hidden = !this._updateSubMenus(popup);

				/*
				 * a little trick, remove the additional item here
				 * please read HistoryMenu.prototype.place
				 */
				if (!prefs.historyCount) {
					this._setEmptyPopupStatus(popup, true);
					let lastHistory = popup._startMarker.nextSibling;
					if (lastHistory._placesNode)
						this._removeChild(lastHistory);
				}

				/*
				 * return the result of original function
				 */
				return result;
			};

			/*
			 * wrap the _ensureMarkers
			 * we add one more marker for history menu: sub-menus marker
			 */
			HMProto._ensureMarkers = function HM_ensureMarkers(popup) {
				/*
				 * call the original _ensureMarkers or the default one
				 */
				let result = HistorySubmenus2_OriginalFunctions.HM.ensureMarkers.apply(this, arguments);

				/*
				 * we do our jobs after the preparing of markers
				 */
				if (!popup._endSubMarker) {
					popup._endSubMarker = Array.from(popup.getElementsByClassName("endHistorySubmenusSeparator"))
							.find(elt => elt.parentNode == popup._endMarker.parentNode)

					if (!popup._endSubMarker)
						(popup._endSubMarker = popup.insertBefore(document.createXULElement("menuseparator"), popup._endMarker.nextSibling))
								.className = "endHistorySubmenusSeparator";
				}

				/*
				 * return the result of original function
				 */
				return result;
			};

			/*
			 * add a new function for building sub-menus
			 */
			HMProto._rebuildSubMenus =  function HM_rebuildSubMenus(popup) {
				/*
				 * remove the old ones
				 */
				this._cleanSubMenus(popup);

				/*
				 * create submenus
				 */
				let fragment = document.createDocumentFragment();
				for (let age = 0; age < prefs.submenuCount; age++) {
					let submenu = fragment.appendChild(document.createXULElement("menu"));
					submenu.className = "history-submenu menu-iconic bookmark-item";
					submenu.setAttribute("query", true);
					submenu.setAttribute("dayContainer", true);

					/*
					 * create popup
					 */
					let subpopup = submenu.appendChild(document.createXULElement("menupopup"));
					subpopup.setAttribute("placespopup", true);
					subpopup.setAttribute("tooltip", popup.getAttribute("tooltip"));
					subpopup.setAttribute("onpopupshowing",
							"if (!this.parentNode._placesView) new HistorySubMenu(event);");

					this._subMenus.push(submenu);
				}
				popup.insertBefore(fragment, popup._endSubMarker);
			};

			HMProto._cleanSubMenus = function HM_cleanSubMenus(popup) {
				if (this._subMenus)
					for (let menu of this._subMenus) {
						if (menu._placesView)
							try {
								menu._placesView.uninit();
							} catch(e) {
								console.warn(e);
							}
						menu.remove();
					}

				this._subMenus = [];
			};

			/*
			 * wrap the uninit
			 */
			HMProto.uninit = function HM_uninit() {
				if (this._subResult) {
					try {
						this._subResult.root.containerOpen = false;
					} catch(e) {
						console.warn(e);
					}
					delete this._subResult;
				}
				let popup = this._rootElt;
				this._cleanSubMenus(popup);
				popup.removeAttribute("historypopup");
				popup.removeChild(popup._endSubMarker);
				popup._endMarker.hidden = true;
				delete popup._endSubMarker;

				let result;

				try {
					result = HistorySubmenus2_OriginalFunctions.HM.uninit.call(this);
				} catch(e) {
					console.warn(e);
					delete this._viewElt._placesView;
				}

				return result;
			};

			/*
			 * view for sub-menus
			 */
			class HistorySubMenu extends PlacesMenu {
				constructor(popupShowingEvent) {
					/*
					 * since the sub-menus doesn't use query result, so we give some junk places string for
					 * construction. but i think there should be a places uri that is better than the default "place:"...
					 */
					super(popupShowingEvent, "");
				}
				
				_onPopupShowing(event) {
					this._rebuildPopup(event.originalTarget);
				}

				_rebuildPopup(popup) {
					this._cleanPopup(popup);
					
					let result = popup.parentNode._result;
					let isPanelUI = popup.parentNode.matches(".subviewbutton");

					let fragment = document.createDocumentFragment();
					for (let r of result) {
						let item = this._insertNewItemToPopup(r, fragment);
						if (isPanelUI)
							item.classList.add("subviewbutton");
					}
					popup.insertBefore(fragment, popup._endMarker);

					this._setEmptyPopupStatus(popup, !result.length);
				}
			}
			window.HistorySubMenu = HistorySubMenu;
			
			
			// let HistorySubMenu = window.HistorySubMenu = function HistorySubMenu(aPopupShowingEvent) {
				
				// window.Function("return PlacesMenu")().constructor.apply(this, aPopupShowingEvent, "");
			// }

			// HistorySubMenu.prototype = {
				// __proto__: window.Function("return PlacesMenu")().prototype,
				
			// };

			/*
			 * visit time in tooltip
			 */
			{
				let bhtTimeText = document.querySelector("#bhTooltip .places-tooltip-box")
						.insertBefore(document.createXULElement("label"), document.querySelector("#bhTooltip .places-tooltip-uri").nextSibling);
				bhtTimeText.id = "bhtTimeText";
				bhtTimeText.className = "tooltip-label";
			}
			
			document.body.appendChild(document.createElement("style")).innerHTML = `
				.HSM2-submenu {
					list-style-image: url("chrome://browser/skin/history.svg");
					-moz-context-properties: fill;
					fill: currentColor;
				}

				.HSM2-submenu .toolbarbutton-text {
					padding-inline-start: 8px;
				}
				
				.endHistorySubmenusSeparator:last-child,
				menuseparator:not([hidden]) + .endHistorySubmenusSeparator {
					visibility: collapse;
				}
			`;
		}
	},
	PanelUI: {
		_subResult: null,
		_subPlaceView: null,
		
		enable() {
			Cu.import("resource:///modules/CustomizableUI.jsm");
			Cu.import("resource:///modules/CustomizableWidgets.jsm");
			
			let widget = CustomizableWidgets.find(w => w.id == "history-panelmenu");
			
			if (widget.__HSM2_enabled)
				return;
			widget.__HSM2_enabled = true;
			
			widget.__HSM2_onViewShowing = widget.onViewShowing; 
			widget.__HSM2_onPanelMultiViewHidden = widget.onPanelMultiViewHidden;
			
			widget.onViewShowing = function(event) {
				let {target} = event, document = target.ownerDocument, window = document.defaultView,
						{HistorySubmenus2} = window, {PanelUI} = HistorySubmenus2;
				
				if (!this._panelMenuView) {
					/* init history panel when it is the first time to open on current window */
					if (!PanelUI._subResult) {
						let viewBody = window.PanelMultiView.getViewNode(document, "PanelUI-history").querySelector(".panel-subview-body");
						let appHM = viewBody.querySelector("#appMenu_historyMenu");
						
						let subPanelView = document.getElementById("appMenu-viewCache")
								.content.appendChild(document.createXULElement("panelview"));
						let body = subPanelView.appendChild(document.createXULElement("vbox"));
						body.className = "panel-subview-body";
						body.setAttribute("historypopup", true);
						body.tooltip = "bhTooltip";
						
						subPanelView.id = SUBMENU_ID;
						subPanelView.addEventListener("ViewShowing", function(e) {
							/* initialize sub-menu panel, a dummy places view is used */
							/* the view will be uninitialized when history panel is closed */
							if (!PanelUI._subPlaceView) {
								PanelUI._subPlaceView = new window.PlacesPanelview(
									"place:queryType=" + Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY + "&maxResults=1",
									body,
									subPanelView,
								);
								body._placesNode.containerOpen = false;
							}
							
							/* build sub-menu items for the selected day */
							let {_result} = e.explicitOriginalTarget;
							body._placesNode = {
								containerOpen: true,
								childCount: _result.length,
								getChild(i) {
									return _result[i];
								},
							};
							PanelUI._subPlaceView._rebuildPopup(body);
							
							let {scrollTop} = viewBody;
							let viewStack = viewBody.closest(".panel-viewstack");
							let subViewShown = false;
							viewStack.addEventListener("transitionstart", function f(e) {
								if (e.propertyName == "transform")
									if (subViewShown) {
										viewStack.removeEventListener("transitionstart", f, true);
										viewBody.scrollTop = scrollTop;
									} else
										subViewShown = true;
							}, true);
						}, true);
						
						/* build sub-menus */
						appHM.tooltip = "bhTooltip";
						appHM.setAttribute("historypopup", true);
						let frag = document.createDocumentFragment();
						frag.appendChild(document.createXULElement("toolbarseparator")).className = "HSM2-endSubMarker";
						let subMenus = HistorySubmenus2.PanelUI._subMenus = new Array(prefs.submenuCount).fill().map((v, i) => {
							let btn = frag.appendChild(document.createXULElement("toolbarbutton"));
							btn.setAttribute("closemenu", "none");
							btn.setAttribute("oncommand", `PanelUI.showSubView('${SUBMENU_ID}', this)`);
							btn.className = "HSM2-submenu subviewbutton subviewbutton-iconic subviewbutton-nav";
							return btn;
						});
						if (prefs.submenuCount)
							appHM.parentNode.insertBefore(frag, appHM.nextSibling);
					}
					
					/* build the top level of history panel */
					let descriptor = Object.getOwnPropertyDescriptor(window.Function("return PlacesViewBase")().prototype, "place");
					let {set} = descriptor;
					descriptor.set = function(val) {
						set.call(this, val.replace(/maxResults=\d+/, "maxResults=" + (prefs.historyCount || 1)));
					};
					Object.defineProperty(window.Function("return PlacesViewBase")().prototype, "place", descriptor);
					
					widget.__HSM2_onViewShowing.apply(this, arguments);
					
					if (!prefs.historyCount)
						target.querySelectorAll("#appMenu_historyMenu, #appMenu_historyMenu + .HSM2-endSubMarker").forEach(e => e.collapsed = true);
					
					descriptor.set = set;
					Object.defineProperty(window.Function("return PlacesViewBase")().prototype, "place", descriptor);
					
					/* update the label and results of each sub-menus */
					window.Function("return HistoryMenu")().prototype._updateSubMenus.call(PanelUI);
				} else
					widget.__HSM2_onViewShowing.apply(this, arguments);
			};
			
			widget.onPanelMultiViewHidden = function(event) {
				widget.__HSM2_onPanelMultiViewHidden.apply(this, arguments);
				/* uninitialize the view of sub-menu panel to prevent some strange problems, e.g. the places context menu does not work */
				let {PanelUI} = event.target.ownerDocument.defaultView.HistorySubmenus2;
				if (PanelUI._subPlaceView) {
					PanelUI._subResult.root.containerOpen = false;
					PanelUI._subPlaceView.uninit();
					PanelUI._subPlaceView = null;
				}
			};
		},
	},
};

HistorySubmenus2.bind(window);
HistorySubmenus2.PanelUI.enable();

} catch(e) {
	alert(["HistorySubmenus2@Merci.chao.uc.js",e,e.stack].join("\n"))
	console.error(e);
}});
