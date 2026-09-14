module.exports = {
  uiPort: process.env.PORT || 1880,
  flowFile: process.env.FLOWS || "flows.json",
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,
  diagnostics: { enabled: true, ui: true },
  runtimeState: { enabled: false, ui: false },
  editorTheme: {
    projects: { enabled: false },
    palette: { editable: false },
    tours: false,
  },
  functionExternalModules: false,
  exportGlobalContextKeys: false,
};
