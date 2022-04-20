if (location == "chrome://browser/content/browser.xhtml") try {(()=>{
addEventListener("popupshowing", ({target}) => {
	if (!target.matches("menupopup")) return;
	let box = target.shadowRoot.querySelector(".menupopup-arrowscrollbox");
	if (box && !box.dataset["noarrow"]) {
		box.dataset["noarrow"] = true;
		box._scrollButtonDown.style.visibility = box._scrollButtonUp.style.visibility = "collapse";
		if (target.matches(":is(.subviewbutton, .subviewbutton-nav) menupopup")) {
			let innerbox = box.shadowRoot.querySelector("scrollbox");
			innerbox.style.setProperty("margin-top", 0, "important");
			innerbox.style.setProperty("margin-bottom", 0, "important");
			innerbox.style.setProperty("overflow-y", "auto", "important");
		}
	}
}, true);
document.body.appendChild(document.createElement("style")).innerHTML = `
menupopup::part(arrowscrollbox-scrollbox),
menupopup menupopup::part(arrowscrollbox-scrollbox) {
	overflow-y: auto;
}
`;
})()} catch(e) {alert(e);console.error(e)}