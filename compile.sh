#	rm -rf ../release-builds/Document\ Pager*;

	if [ "$1" = "win" ]; then
		npx electron-builder build --win --x64;
	elif [ "$1" = "mac" ]; then
		npx electron-builder build --mac --arm64;
	else
		npx electron-builder build
	#	cd "../release-builds";
	#	rm -rf "Document Pager MacOS";
	#	mv "Document Pager-darwin-x64" "Document Pager MacOS";
	#	cd ..
	fi
