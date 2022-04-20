if (location == "chrome://browser/content/browser.xhtml") try {(()=>{

	let appMenu = document.getElementById("appMenu-popup");
	appMenu.addEventListener("popupshowing", function func() {
		appMenu.removeEventListener("popupshowing", func, true);
		document.querySelector("#appMenu-quit-button2").addEventListener("click", e => {
			if (e.button != 1) return;
			if (e.shiftKey) {
				Services.appinfo.invalidateCachesOnRestart();
				Services.prompt.alert(window, "Restart", "Invalidate caches on restart.");
			}
			var Cc = Components.classes, Ci = Components.interfaces;
			var os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
			var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
			os.notifyObservers(cancelQuit, "quit-application-requested", "restart");
			if (cancelQuit.data)
				Services.prompt.alert(window, "Restart", "Abort restart process.");
			else {
				var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
				appStartup.quit(appStartup.eAttemptQuit | appStartup.eRestart);
			}
		}, true);
	}, true);
})()} catch(e) {alert(e);console.error(e)}