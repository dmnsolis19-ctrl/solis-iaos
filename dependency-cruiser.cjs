/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-app-to-app",
      severity: "error",
      comment: "Deployable applications communicate through contracts, never source imports.",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/([^/]+)/", pathNot: "^apps/$1/" },
    },
    {
      name: "packages-never-import-apps",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: "(^|/)(main|index|vite\\.config|vitest\\.config)\\.(ts|tsx)$",
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "types", "default"],
    },
    reporterOptions: {
      dot: { collapsePattern: "node_modules/[^/]+" },
    },
  },
};
