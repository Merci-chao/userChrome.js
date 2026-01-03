{
    let id = "unfiled_____";
    let name = "browser.bookmarks.defaultLocation";
    let {prefs} = Services;
    prefs.addObserver(name, function() {
        if (prefs.getStringPref(name) != id)
            prefs.setStringPref(name, id);
    });
}