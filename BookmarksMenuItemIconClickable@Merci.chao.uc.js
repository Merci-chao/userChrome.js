if (document.documentElement.id == "main-window") {
	let popups = ":is(#bookmarksMenuPopup, #BMB_bookmarksPopup)";
	let menuitems = `${popups} .bookmark-item:not([id])`;
	let selector = `${menuitems} :is(.menu-icon, .menu-iconic-left)`;
	document.body.appendChild(document.createElement("style")).textContent = /*css*/`
		${menuitems} {
			overflow: clip;
		}
	
		${selector} {
			--block: var(--panel-menuitem-padding-block, var(--arrowpanel-menuitem-padding-block));
			--inline: var(--panel-menuitem-padding-inline, var(--arrowpanel-menuitem-padding-inline));
			pointer-events: auto;
			border-radius: var(--menuitem-border-radius, var(--arrowpanel-menuitem-border-radius));
			box-sizing: content-box;
			border: 1px solid transparent;
			margin-block: calc(var(--block) * -1 - env(hairline, 1px)) !important;
			margin-inline:
				calc(var(--inline) * -1 - env(hairline, 1px))
				calc(var(--space-small, 8px) - var(--inline) - env(hairline, 1px)) !important;
			padding-block: var(--block) !important;
			padding-inline: var(--inline) !important;
			overflow: visible;
			background-clip: padding-box;
		}

		#bookmarksMenuPopup${selector} {
			--block: .5em;
			--inline: .5em;
			border-radius: var(--menuitem-border-radius);
		}

		${selector}:hover {
			background-color: var(--toolbarbutton-background-color-hover, var(--toolbarbutton-hover-background));
		}

		${selector}:hover:active {
			background-color: var(--toolbarbutton-background-color-active, var(--toolbarbutton-active-background));
		}
	`;

	/*global gBrowser*/
	if (gBrowser?._initialized)
		init();
	else
		addEventListener("DOMContentLoaded", init, {once: true});

	function init() {
		for (let p of [...document.querySelectorAll(popups)])
			p.addEventListener("click", aEvent => {
				if (aEvent.button > 1 || !aEvent.target.closest(selector))
					return;

				let item = aEvent.target.closest(".bookmark-item");
				item.dispatchEvent(new MouseEvent(
					item.tagName == "menu" ? "click" : "command",
					{
						bubbles: true,
						cancelable: true,
						button: 1,
					},
				));
			});
	}
}
