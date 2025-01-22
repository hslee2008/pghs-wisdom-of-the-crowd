// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["vuetify-nuxt-module"],
  imports: {
    presets: [
      {
        from: "firebase/database",
        imports: [
          "onValue",
          "set",
          "update",
          "push",
          ["ref", "dbRef"],
          "DataSnapshot",
        ],
      },
    ],
  },
});
