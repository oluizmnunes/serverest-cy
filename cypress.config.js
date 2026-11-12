const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: '1eki4g',
  video: true,
  e2e: {
    baseUrl: 'https://front.serverest.dev',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
