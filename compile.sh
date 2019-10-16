#	rm -rf ../release-builds/Document\ Pager*;

	electron-packager . --overwrite --platform=darwin --arch=x64 --prune=true --extend-info "info.plist" --out="../release-builds/" # --icon ./images/edit-virtual-hosts.icns;
#	electron-packager . --overwrite --platform=win32 --arch=x64 --prune=true --out="../release-builds" # --icon images/edit-virtual-hosts.ico;

	cd "../release-builds";

	mv "Document Pager-darwin-x64" "Document Pager MacOS";
#	mv "Document Pager-win32-x64" "Document Pager Windows";
	mv "Document Pager-win32-x64" "Document Pager Windows";

	zip -r -X "Document Pager MacOS.zip" "Document Pager MacOS/";
	zip -r -X "Document Pager Windows.zip" "Document Pager Windows/";

	cd ..
