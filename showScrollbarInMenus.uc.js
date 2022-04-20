if (location == "chrome://browser/content/browser.xhtml") try {(()=>{
addEventListener("popupshowing", ({target}) => {
	if (!target.matches("menupopup")) return;
	let box = target.shadowRoot.querySelector(".menupopup-arrowscrollbox");
	if (box && !box.dataset["noarrow"]) {
		box.dataset["noarrow"] = true;
		box._scrollButtonDown.style.visibility = box._scrollButtonUp.style.visibility = "collapse";
		let innerbox = box.shadowRoot.querySelector("scrollbox");
		innerbox.style.setProperty("margin-top", 0, "important");
		innerbox.style.setProperty("margin-bottom", 0, "important");
		innerbox.style.setProperty("overflow-y", "auto", "important");
	}
}, true);
})()} catch(e) {alert(e);console.error(e)}
