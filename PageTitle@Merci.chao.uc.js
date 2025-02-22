if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

let prefs;
{
	let prefBranchStr = "extensions.PageTitle@Merci.chao.";
	let defPrefs = {
		hideWww: false,
		highlightIdentityBox: true,
		showDomain: true,
		showSubTitle: true,
		showUriOnHover: true,
		decodeHashAndSearch: true,
		formattingEnabled: true,
	};

	let setDefaultPrefs = (branch, data) => Object.entries(data).forEach(([name, value]) =>
			value != null && branch[`set${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name, value));
	let getPrefs = (branch, data) => Object.fromEntries(Object.entries(data)
			.filter(([name, value]) => value != null)
			.map(([name, value]) => [name, branch[`get${{string:"String",number:"Int",boolean:"Bool"}[typeof value]}Pref`](name)]));
	setDefaultPrefs(Services.prefs.getDefaultBranch(prefBranchStr), defPrefs);
	prefs = getPrefs(Services.prefs.getBranch(prefBranchStr), defPrefs);
}



let docEle = document.documentElement;
let rtl = window.getComputedStyle(docEle).direction == "rtl";
let create = (tagName, parent, props = {}, insertPoint = null) =>
		Object.assign(parent.insertBefore(document.createXULElement(tagName), insertPoint), props);
let createHTML = (tagName, parent, props = {}, insertPoint = null) =>
		Object.assign(parent.insertBefore(document.createElement(tagName), insertPoint), props);
let $$ = s => Array.from(document.querySelectorAll(s));
let $ = s => document.querySelector(s);
let formatRange = (selection, textNode, start, end) => {
	let range = document.createRange();
	range.setStart(textNode, start);
	range.setEnd(textNode, end);
	selection.addRange(range);
};

let urlbar = $("#urlbar");
let urlbarInput = $("#urlbar-input");
let identityBox = $("#identity-box");
let container = $(".urlbar-input-box");
let insertPoint = urlbarInput.nextSibling;

/* title and url */
let pageTitle = createHTML("input", container, {
	id: "urlbar-pagetitle",
	readOnly: true,
}, insertPoint);

let pageURL = createHTML("input", container, {
	id: "urlbar-pageurl",
	readOnly: true,
}, insertPoint);

{
	let handler = {
		handleEvent: ({type, target}) => target.toggleAttribute("overflowed", type == "overflow"),
	};
	[pageTitle, pageURL].forEach(elt => ["overflow", "underflow"].forEach(evt => elt.addEventListener(evt, handler, true)));
}

/* tooltip */
let tooltip = create("tooltip", $("#mainPopupSet"), {
	id: "urlbar-tooltip",
});
tooltip.addEventListener("popupshowing", e => {
	if (urlbar.getAttribute("pageproxystate") == "invalid") {
		e.preventDefault();
		return;
	}
}, true);
container.tooltip = tooltip.id;

/* domain label */
let hostportBox = create("box", $("#identity-icon-box"), {
	id: "identity-icon-hostport-box",
	flex: 1,
	align: "center",
}, null);

let subdomainWrapper = create("box", hostportBox, {
	id: "identity-icon-subdomain-wrapper",
	flex: 1,
});

let subDomainLabel = create("label", subdomainWrapper, {
	id: "identity-icon-subdomain",
	flex: 1,
	className: "plain",
	crop: "center",
});

let domainLabel = create("label", hostportBox, {
	id: "identity-icon-domain",
	className: "plain",
	flex: 1,
	crop: "center",
});

let portLabel = create("label", hostportBox, {
	id: "identity-icon-port",
	className: "plain",
	flex: 1,
	crop: "end",
});

let IIOService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
/* add the event listeners for updating title text */
let PageTitle = window.PageTitle = {
	updateURLBarPageTitleText: (tab = gBrowser.selectedTab) => {
		let browser = tab.linkedBrowser;

		//clear the value of our stuffs
		[pageTitle, pageURL, subDomainLabel, domainLabel, portLabel]
				.forEach(elt => elt.value = "");

		//get the page title and url
		let title = browser.contentTitle;

		let subURL = "";
		let subTitleSeperator = " - ";
		let baseDomain = "";
		let subDomain = "";

		let url = browser.currentURI.spec;
		let documentURL = browser.documentURI?.spec;

		//remove the prefix of container and get the real url of page
		let wrappedUrl = /(?:about:reader\?url=)(.+)/i.exec(url);
		if (wrappedUrl)
			try {
				url = decodeURIComponent(wrappedUrl[1]);
			} catch (e) {
				console.error(e);
			}

		try {
			//if the title is just the url, it is unnecessary to show our stuffs
			if (title == url) {
				title = null;
			//some about: pages does not show url in url bar but just waits for inputing url
			//so we keep the url bar in input mode
			} else {
				if (/^about:((blank|home|newtab|privatebrowsing|sessionrestore|welcome(back)?)|(blocked|certerror|neterror)(\?.*)?)$/i
						.test(documentURL)) {
					title = null;
				//here is the right time for us to do something
				} else {
					let protocol = url.match(/^[a-z\d.+\-]+:(?=[^\d])?/);

					if (protocol)
						if (!["http:", "https:", "ftp:"].includes(protocol[0])) {
							/*
							 * if it is not http or ftp, we show the protocol instead of domain in identity box
							 */
							domainLabel.value = protocol[0].replace(/:$/, "");
							if (protocol != "view-source:")
								subURL = prefs.showDomain ? url.replace(new RegExp("^" + protocol[0] + "\/*"), "") : url;
							else
								url = subURL;
						} else {
							/*
							 * otherwise, we grab the domain name to show in identity box
							 */
							let urlObj = IIOService.newURI(url, null, null).QueryInterface(Ci.nsIURL);

							let prePath = urlObj.prePath;
							let matchedURL = prePath.match(/^((?:[a-z]+:\/\/)?(?:[^\/]+@)?)(.+?)(?::\d+)?(?:\/|$)/);
							let [, preDomain, domain] = matchedURL;
							let path = urlObj.path || url.substr(urlObj.prePath.length);

							baseDomain = domain;

							// getBaseDomainFromHost doesn't recognize IPv6 literals in brackets as IPs (bug 667159)
							if (domain[0] != "[")
								try {
									const IDNService = Cc["@mozilla.org/network/idn-service;1"].getService(Ci.nsIIDNService);
									domain = IDNService.convertACEtoUTF8(domain);
									baseDomain = Services.eTLD.getBaseDomainFromHost(domain);
									if (!domain.endsWith(baseDomain)) {
										// getBaseDomainFromHost converts its resultant to ACE.
										baseDomain = IDNService.convertACEtoUTF8(baseDomain);
									}
								} catch (e) {}

							if (baseDomain != domain)
								subDomain = domain.slice(0, -baseDomain.length);

							let needToHide3W = prefs.hideWww && subDomain.toLowerCase() == "www.";

							if (prefs.showDomain) {
								subURL = path.replace(/^\//, "");
								portLabel.value = urlObj.port != -1 ? ":" + urlObj.port : "";
								domainLabel.value = baseDomain;
								subDomainLabel.value = needToHide3W ? "" : subDomain;
							} else {
								subURL = domain.substr(needToHide3W ? 4 : 0);
								if (urlObj.port != -1)
									subURL += ":" + urlObj.port;
								if (path != "/")
									subURL += path;
							}

							if (needToHide3W)
								subDomain = "";
						}
					else
						//if the protocol is unknown, use the whole url for subURL
						subURL = url;

					try {
						subURL = decodeURI(subURL);
					} catch (e) {
						let charset = browser.characterSet;
						/*
						 * try to decode the uri with the charset of page
						 */
						if (!wrappedUrl && charset != "UTF-8")
							try {
								// Let's try to unescape it using a character set
								// in case the URI is not ASCII.
								const txtToSubURIService = Cc["@mozilla.org/intl/texttosuburi;1"].getService(Ci.nsITextToSubURI);
								subURL = txtToSubURIService.unEscapeNonAsciiURI(charset, subURL);
							} catch (e) {}

					}

					if (prefs.decodeHashAndSearch)
						try {
							subURL = subURL
									.replace(/\?[^#]+/, matched => decodeURIComponent(matched.replace(/\+/g, " ")))
									.replace(/#.+/, matched => decodeURIComponent(matched.replace(/\.(?=[0-9a-f]{2})/ig, "%")));
						} catch (e) {}

					let finalURL = subURL || title;
					let finalTitle = subURL && prefs.showSubTitle ?
							rtl ? subURL + subTitleSeperator + title : title + subTitleSeperator + subURL
							: title;

					pageTitle.value = finalTitle;
					pageURL.value = finalURL;
					{
						let decodedUrl = url;
						try {
							decodedUrl = decodeURI(url);
						} catch(e) {}
						tooltip.label = Array.from(new Set([title, decodedUrl])).filter(v => v).join("\n");
					}

					let titleController = pageTitle.editor.selectionController;
					let titleTextNode = pageTitle.editor.rootElement.firstChild;
					let titleSelection = titleController.getSelection(titleController.SELECTION_URLSECONDARY);

					if (prefs.showSubTitle && subURL)
						if (!prefs.showDomain && prefs.formattingEnabled) {
							let baseDomainIdx = rtl ?
									subDomain.length
									: title.length + subTitleSeperator.length + subDomain.length;
							formatRange(titleSelection, titleTextNode,
									rtl ? 0 : title.length,
									baseDomainIdx);
							formatRange(titleSelection, titleTextNode,
									rtl ? baseDomainIdx + baseDomain.length : baseDomainIdx + baseDomain.length,
									rtl ? finalTitle.length - title.length : finalTitle.length);
						} else
							formatRange(titleSelection, titleTextNode,
									rtl ? 0 : title.length,
									rtl ? finalTitle.length - title.length : finalTitle.length);

					let urlController = pageURL.editor.selectionController;
					let urlTextNode = pageURL.editor.rootElement.firstChild;
					let urlSelection = urlController.getSelection(urlController.SELECTION_URLSECONDARY);

					if (prefs.showUriOnHover && prefs.formattingEnabled)
						if (!subURL || prefs.showDomain && baseDomain)
							formatRange(urlSelection, urlTextNode, 0, finalURL.length);
						else if (baseDomain) {
							if (subDomain)
								formatRange(urlSelection, urlTextNode, 0, subDomain.length);

							formatRange(urlSelection, urlTextNode, subDomain.length + baseDomain.length, subURL.length);
						}
				}
			}
		//if error occurs, show the original url bar
		} catch(e) {
			title = null;
			console.error(e);
		}

		//set the flag for css to control the visibility of our stuffs
		urlbar.toggleAttribute("nopagetitle", !title);
	},

	onTabSelect: e => {
		PageTitle.updateURLBarPageTitleText();
	},

	updatePrefAttributes: () => {
		docEle.toggleAttribute("data-pageTitleShowDomain", prefs.showDomain);
		docEle.toggleAttribute("data-pageTitleHighlightIdentity", prefs.highlightIdentityBox);
		docEle.toggleAttribute("data-pageTitleShowUriOnHover", prefs.showUriOnHover);
	},
	tabsMutationObserver: new MutationObserver(records => {
		records.some(record => {
			if (record.target == gBrowser.selectedTab && ["progress", "label", "busy"].includes(record.attributeName)) {
				PageTitle.updateURLBarPageTitleText();
				return true;
			}
		});
	}),
};

function setupTabContainer() {
	PageTitle.tabsMutationObserver.observe(gBrowser.tabContainer, {attributes: true, subtree: true});
	gBrowser.tabContainer.addEventListener("TabSelect", PageTitle.onTabSelect, true);
}
if (gBrowser?._initialized)
	setupTabContainer();
else
	addEventListener("DOMContentLoaded", setupTabContainer, {once: true});

if (!UrlbarInput.prototype.__PageTitleInit) {
	let originalSetURI = UrlbarInput.prototype.setURI;
	UrlbarInput.prototype.setURI = function() {
		let r = originalSetURI.apply(this, arguments);
		try {
			this.window.PageTitle?.updateURLBarPageTitleText();
		} catch (e) {
			console.error(e);
		}
		return r;
	};
	UrlbarInput.prototype.__PageTitleInit = true;
}
if (!AboutReaderParent.__PageTitleInit) {
	let originalFunc = AboutReaderParent.toggleReaderMode;
	AboutReaderParent.toggleReaderMode = function(event) {
		event.target.ownerGlobal.gBrowser.selectedTab.label += "\u200B";
		return originalFunc.apply(this, arguments);
	};
	AboutReaderParent.__PageTitleInit = true;
}

let style = document.body.appendChild(document.createElement("style"));
style.innerHTML = `
#identity-box, #identity-icon-box {
	max-width: none !important;
}
#identity-icon-hostport-box {
	margin-inline-start: 4px;
	direction: ltr;
}
#identity-icon-hostport-box label {
	margin: 0;
}
#urlbar[focused] #identity-icon-hostport-box,
#identity-box[pageproxystate=invalid] #identity-icon-hostport-box,
#urlbar[nopagetitle] #identity-icon-hostport-box {
	display: none;
}
:root:not([data-pageTitleShowDomain]) #identity-icon-hostport-box {
	display: none;
}
#identity-icon-subdomain {
	text-align: end;
}
:is(#identity-icon-subdomain, #identity-icon-port) {
	opacity: .5;
}
.urlbar-input-box {
	position: relative;
}
:is(#urlbar-pagetitle, #urlbar-pageurl) {
	-moz-appearance: none !important;
	background: none !important;
	padding: 0 !important;
	margin: 0 !important;
	border: 0 !important;
	color: inherit;
	direction: ltr;
	width: 100%;
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	pointer-events: none;
}
:is(#urlbar-pagetitle, #urlbar-pageurl) {
	width: 100%;
}
:is(#urlbar-pagetitle, #urlbar-pageurl):-moz-locale-dir(rtl) {
	text-align: end;
}
:is(#urlbar-pagetitle, #urlbar-pageurl)[overflowed] {
	mask-image: linear-gradient(to left, transparent, black 1em);
}
:is(#urlbar-pagetitle, #urlbar-pageurl)[overflowed]:-moz-locale-dir(rtl) {
	mask-image: linear-gradient(to right, transparent, black 1em);
}
:root:not([pageTitleTabSwitching]) :is(#urlbar-pagetitle, #urlbar-pageurl) {
	transition: opacity .1s ease-out;
}
#urlbar:is([focused], [pageproxystate=invalid]) #urlbar-pagetitle,
#urlbar:not([pageproxystate=invalid]):not([focused]):not([nopagetitle]) #urlbar-input {
	opacity: 0;
	cursor: default;
}
#urlbar:is([nopagetitle], [focused], [pageproxystate=invalid])
		:is(#urlbar-pagetitle, #urlbar-pageurl) {
	visibility: hidden;
}
#urlbar-pageurl {
	opacity: 0;
}
:root[data-pageTitleShowUriOnHover] #urlbar:not([focused]) .urlbar-input-box:hover #urlbar-pageurl {
	opacity: 1;
}
/*effect for hover*/
#urlbar .urlbar-input-box:hover :is(#urlbar-pagetitle, #urlbar-pageurl) {
	transition-delay: .2s !important;
}
:root[data-pageTitleShowUriOnHover] #urlbar .urlbar-input-box:hover #urlbar-pagetitle {
	opacity: 0 !important;
}

:root[data-pageTitleHighlightIdentity][data-pageTitleShowDomain] #urlbar:not(:is([nopagetitle], [pageproxystate=invalid])) #identity-icon-box {
	background-color: var(--urlbar-box-bgcolor);
}
:root[data-pageTitleHighlightIdentity][data-pageTitleShowDomain] #urlbar[focused]:not(:is([nopagetitle], [pageproxystate=invalid])) #identity-icon-box {
	background-color: var(--urlbar-box-focus-bgcolor);
}
:root[data-pageTitleHighlightIdentity][data-pageTitleShowDomain] #urlbar:not(:is([nopagetitle], [pageproxystate=invalid])) #identity-icon-box:hover:not([open]) {
	background-color: var(--urlbar-box-hover-bgcolor);
	color: var(--urlbar-box-hover-text-color);
}
:root[data-pageTitleHighlightIdentity][data-pageTitleShowDomain] #urlbar:not(:is([nopagetitle], [pageproxystate=invalid])) #identity-icon-box:is(:hover:active, [open]) {
	background-color: var(--urlbar-box-active-bgcolor);
	color: var(--urlbar-box-hover-text-color);
}

/* margin inline end of identity-box */
:root[data-pageTitleHighlightIdentity][data-pageTitleShowDomain] #urlbar:not(:is([nopagetitle], [pageproxystate=invalid]))
		#identity-box[pageproxystate=valid]:not(.notSecureText):not(.chromeUI):not(.extensionPage)
		#identity-permission-box:not([open=true]):not([hasPermissions]):not([hasSharingIcon]) ~ #notification-popup-box[hidden] {
	visibility: visible;
	margin-inline-end: 4px;
}
`;

PageTitle.updatePrefAttributes();
setTimeout(() => PageTitle.updateURLBarPageTitleText());

//page title may occasionally disappear, ensure it will be repainted
setInterval(() => pageTitle.style.zIndex ^= 1, 100);

})()} catch(e) {alert(e);console.error(e, e.stack)}
