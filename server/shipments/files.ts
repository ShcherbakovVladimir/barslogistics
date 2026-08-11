import fs from "fs";
import path from "path";

export function getShipmentFilesDir(): string {
  const dir = process.env.SHIPMENT_FILES_DIR || path.join(process.cwd(), "data", "shipment-files");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getShipmentMaxFileBytes(): number {
  const raw = process.env.SHIPMENT_MAX_FILE_BYTES?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20 * 1024 * 1024;
}

export function shipmentFileDir(shipmentId: string): string {
  const dir = path.join(getShipmentFilesDir(), shipmentId);
  fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
  return dir;
}
