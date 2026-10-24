/** Foundation liveness is not proof that product integrations are operational. */
export function foundationReadiness(environment: string, dependencyReady = true) {
  const local = environment === "development" || environment === "test";
  const blockers: string[] = [];
  if (!local) blockers.push("PRODUCT_INTEGRATIONS_NOT_IMPLEMENTED");
  if (!dependencyReady) blockers.push("DEPENDENCY_UNAVAILABLE");
  return { ready: local && dependencyReady, mode: "foundation" as const, blockers };
}
