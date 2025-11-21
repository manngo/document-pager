require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;
	if (electronPlatformName !== 'darwin') return;

	const appName = context.packager.appInfo.productFilename;

	return await notarize({
		appBundleId: 'com.webcraft101.document-pager',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
		teamId: process.env.APPLE_TEAM_ID,
		appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
	});
};
