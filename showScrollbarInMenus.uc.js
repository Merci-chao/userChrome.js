addEventListener("popupshowing", ({target}) => {
	if (!target?.matches?.("menupopup")) return;
	let {scrollBox} = target;
	if (!scrollBox.dataset["noarrow"]) {
		scrollBox.dataset["noarrow"] = true;
		scrollBox._scrollButtonDown.style.visibility = scrollBox._scrollButtonUp.style.visibility = "collapse";
		for (let [p, v] of [["margin-block", 0], ["padding-block", 0], ["overflow-y", "auto"]])
			scrollBox.scrollbox.style.setProperty(p, v, "important");
	}
}, true);
