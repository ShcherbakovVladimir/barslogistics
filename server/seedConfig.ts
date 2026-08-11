/** When true, empty DB is filled with demo factories, shipments and sample carriers. Default: off (production-safe). */
export function isSeedDemoDataEnabled(): boolean {
  const raw = process.env.SEED_DEMO_DATA?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
