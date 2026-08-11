import type { Factory, UserRole } from "../src/types.js";

const MANAGER_UPDATABLE: (keyof Factory)[] = [
  "name",
  "type",
  "holding",
  "country",
  "region",
  "latitude",
  "longitude",
  "description",
  "code",
  "address",
  "kladr_id",
  "geocode_source",
];

const ADMIN_ONLY: (keyof Factory)[] = ["is_ours", "is_active", "sort_order"];

/** Whitelist factory fields allowed per role — blocks privilege escalation via req.body. */
export function pickFactoryUpdatePatch(role: UserRole, body: Partial<Factory>): Partial<Factory> {
  const allowed = role === "admin"
    ? [...MANAGER_UPDATABLE, ...ADMIN_ONLY]
    : MANAGER_UPDATABLE;

  const patch: Partial<Factory> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      (patch as Record<string, unknown>)[key] = body[key];
    }
  }
  return patch;
}
