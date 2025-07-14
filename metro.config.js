const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);  // <-- مهم تمرير __dirname هنا
  return config;
})();
