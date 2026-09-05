if (document.documentElement.id == "main-window") {
	let INCLUDE_FOLDERS = true;
	
	let containers = ":is(#bookmarksMenuPopup, #BMB_bookmarksPopup, #PlacesToolbarItems, #PlacesChevronPopup)";
	let items = `${containers} .bookmark-item:not([id])${!INCLUDE_FOLDERS ? `:not([type=menu], [container])` : ``}`;
	let icons = `${items} :is(.menu-icon, .menu-iconic-left, .toolbarbutton-icon)`;
	document.body.appendChild(document.createElement("style")).textContent = /*css*/`
		${items} {
			overflow: clip;
		}

		${icons} {
			--block: var(--panel-menuitem-padding-block, var(--arrowpanel-menuitem-padding-block));
			--inline: var(--panel-menuitem-padding-inline, var(--arrowpanel-menuitem-padding-inline));
			--margin-end: var(--space-small, 8px);
			pointer-events: auto;
			border-radius: var(--menuitem-border-radius, var(--arrowpanel-menuitem-border-radius));
			box-sizing: content-box;
			border: 1px solid transparent;
			margin-block: calc(var(--block) * -1 - env(hairline, 1px)) !important;
			margin-inline:
				calc(var(--inline) * -1 - env(hairline, 1px))
				calc(var(--margin-end) - var(--inline) - env(hairline, 1px)) !important;
			padding-block: var(--block) !important;
			padding-inline: var(--inline) !important;
			overflow: visible;
			background-clip: padding-box;
		}

		#bookmarksMenuPopup${icons} {
			--block: .5em;
			--inline: .5em;
			border-radius: var(--menuitem-border-radius);
		}

		${icons}.toolbarbutton-icon {
			--block: var(--bookmark-block-padding);
			--inline: 4px;
			--margin-end: 4px;
			border-radius: var(--toolbarbutton-border-radius);
			height: 100%;
		}

		${icons}:hover {
			background-color: var(--toolbarbutton-background-color-hover, var(--toolbarbutton-hover-background));
		}

		${icons}:hover:active {
			background-color: var(--toolbarbutton-background-color-active, var(--toolbarbutton-active-background));
		}
	`;

	/*global gBrowser*/
	if (gBrowser?._initialized)
		init();
	else
		addEventListener("DOMContentLoaded", init, {once: true});

	function init() {
		for (let p of [...document.querySelectorAll(containers)])
			p.addEventListener("click", aEvent => {
				if (aEvent.button > 1 || !aEvent.target.closest(icons))
					return;

				let item = aEvent.target.closest(".bookmark-item");
				item.dispatchEvent(new MouseEvent(
					item.matches("menu, [type=menu]") ? "click" : "command",
					{
						bubbles: true,
						cancelable: true,
						button: 1,
					},
				));
			});
	}
}
