export function isLaboratoryRole(role: unknown): boolean {
  if (!role || typeof role !== "object") return false;
  const { type, name } = role as { type?: unknown; name?: unknown };
  const laboratoryRoles = new Set([
    "laboratory", "laboratories", "laboratoire", "laboratoires", "labo",
  ]);
  return [type, name].some(
    (value) => typeof value === "string" && laboratoryRoles.has(value.trim().toLowerCase()),
  );
}
