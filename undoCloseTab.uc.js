try {(()=>{
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

	let $$ = s => Array.from(document.querySelectorAll(s));
	let $ = s => document.querySelector(s);
	
	let goPopup = $("#historyMenuPopup"),
		items = ["#historyUndoMenu", "#historyUndoWindowMenu", "#historyRestoreLastSession"].map($),
		oriPosition = items[1].nextSibling;
	{
		let undo = $("#context_undoCloseTab");
		undo.parentNode.insertBefore(document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuseparator"), undo.nextSibling);
	}
	$$("#tabContextMenu, #toolbar-context-menu").forEach(menu => {
		menu.addEventListener("popupshowing", e => {
			if (e.target != e.currentTarget)
				return;
			let view = goPopup.parentNode._placesView || new HistoryMenu({target: goPopup, originalTarget: goPopup});
			view.toggleRecentlyClosedTabs();
			view.toggleRecentlyClosedWindows();
			let frag = document.createDocumentFragment();
			items.forEach(i => frag.append(i));
			menu.insertBefore(frag, menu.querySelector("#toolbar-context-undoCloseTab, #context_undoCloseTab").nextSibling);
		}, true);
		menu.addEventListener("popuphidden", e => {
			if (e.target != e.currentTarget)
				return;
			items.forEach(i => goPopup.insertBefore(i, oriPosition));
		}, true);
	});
})()} catch(e) {alert(e);console.error(e)}