export default {
  expo: {
    name: "myapp",
    slug: "myapp",
    version: "1.0.0",
    sdkVersion: "50.0.0", // حسب نسخة Expo اللي عندك
    extra: {
      GOOGLE_MAPS_API_KEY:  process.env.GOOGLE_MAPS_API_KEY, // 🔐 ضع مفتاحك هنا
    },
  },
};
