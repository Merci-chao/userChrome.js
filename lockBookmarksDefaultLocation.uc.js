{
	let func = StarUI._storeRecentlyUsedFolder;
	StarUI._storeRecentlyUsedFolder = function(selectedFolderGuid, didChangeFolder, ...args) {
		return func.call(this, selectedFolderGuid, false, ...args);
	};
}
