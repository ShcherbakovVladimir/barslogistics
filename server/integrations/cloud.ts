import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getCloudSettings, setCloudLastUpload } from "./settings.js";

export async function uploadToCloud(filePath: string, remoteName: string): Promise<void> {
  const settings = await getCloudSettings();
  if (!settings.enabled) throw new Error("Cloud storage is disabled");

  const buffer = fs.readFileSync(filePath);

  switch (settings.provider) {
    case "s3":
      await uploadToS3(buffer, remoteName, settings);
      break;
    case "yandex":
      await uploadToYandex(buffer, remoteName, settings);
      break;
    case "gdrive":
      await uploadToGDrive(buffer, remoteName, settings);
      break;
    default:
      throw new Error(`Unknown cloud provider: ${settings.provider}`);
  }

  await setCloudLastUpload();
}

async function uploadToS3(buffer: Buffer, remoteName: string, settings: Awaited<ReturnType<typeof getCloudSettings>>) {
  const s3 = settings.s3;
  if (!s3?.bucket || !s3.access_key_id || !s3.secret_access_key) {
    throw new Error("S3 settings incomplete");
  }

  const client = new S3Client({
    region: s3.region || "us-east-1",
    endpoint: s3.endpoint || undefined,
    forcePathStyle: Boolean(s3.endpoint),
    credentials: {
      accessKeyId: s3.access_key_id,
      secretAccessKey: s3.secret_access_key,
    },
  });

  const key = [s3.prefix?.replace(/\/$/, ""), remoteName].filter(Boolean).join("/");
  await client.send(new PutObjectCommand({
    Bucket: s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: "application/sql",
  }));
}

async function uploadToYandex(buffer: Buffer, remoteName: string, settings: Awaited<ReturnType<typeof getCloudSettings>>) {
  const yandex = settings.yandex;
  if (!yandex?.oauth_token) throw new Error("Yandex Disk OAuth token not configured");

  const folder = yandex.folder_path.replace(/\/$/, "") || "";
  const remotePath = `${folder}/${remoteName}`;

  const uploadUrlRes = await fetch(
    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(remotePath)}&overwrite=true`,
    { headers: { Authorization: `OAuth ${yandex.oauth_token}` } }
  );
  const uploadUrlData = (await uploadUrlRes.json()) as { href?: string; message?: string };
  if (!uploadUrlRes.ok || !uploadUrlData.href) {
    throw new Error(uploadUrlData.message || "Failed to get Yandex upload URL");
  }

  const putRes = await fetch(uploadUrlData.href, { method: "PUT", body: buffer });
  if (!putRes.ok) {
    throw new Error(`Yandex upload failed: HTTP ${putRes.status}`);
  }
}

async function uploadToGDrive(buffer: Buffer, remoteName: string, settings: Awaited<ReturnType<typeof getCloudSettings>>) {
  const gdrive = settings.gdrive;
  if (!gdrive?.access_token) throw new Error("Google Drive access token not configured");

  const metadata: Record<string, unknown> = { name: remoteName };
  if (gdrive.folder_id) metadata.parents = [gdrive.folder_id];

  const boundary = `barslogistics_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/sql\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gdrive.access_token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  const data = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || `Google Drive upload failed: HTTP ${res.status}`);
  }
}

export async function testCloudConnection(): Promise<{ ok: boolean; message: string }> {
  const settings = await getCloudSettings();
  if (!settings.enabled) return { ok: false, message: "Cloud storage is disabled" };

  const testContent = Buffer.from(`-- BarsLogistics cloud test ${new Date().toISOString()}\n`);
  const testName = `cloud-test-${Date.now()}.sql`;
  const tmpPath = `/tmp/${testName}`;
  fs.writeFileSync(tmpPath, testContent);

  try {
    await uploadToCloud(tmpPath, testName);
    return { ok: true, message: `Upload to ${settings.provider} successful` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await setCloudLastUpload(msg);
    return { ok: false, message: msg };
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}
