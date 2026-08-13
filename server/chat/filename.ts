/**
 * Multer/Busboy often decodes multipart Content-Disposition filenames as Latin-1
 * even when the browser sent UTF-8. Re-decode so Cyrillic names stay readable.
 */
export function decodeUploadFilename(raw: string | undefined | null): string {
  const name = String(raw ?? "").trim() || "file";
  try {
    const asUtf8 = Buffer.from(name, "latin1").toString("utf8");
    // Prefer re-decoded form when it restores Cyrillic / non-Latin text
    // and does not introduce replacement characters.
    if (!asUtf8.includes("\uFFFD") && /[^\u0000-\u007F]/.test(asUtf8)) {
      return asUtf8;
    }
    // If original already has Cyrillic, keep it.
    if (/[\u0400-\u04FF]/.test(name)) return name;
    // If re-decode looks equal in printable sense and original is mojibake-like, use utf8.
    if (asUtf8 !== name && /Ð.|Ñ.|Ã./.test(name)) return asUtf8;
    return name;
  } catch {
    return name;
  }
}

/** Safe basename for disk storage (ASCII-ish); display name stays in DB as UTF-8. */
export function safeStoredBasename(originalName: string): string {
  const base = originalName.replace(/^.*[\\/]/, "") || "file";
  const extMatch = base.match(/(\.[A-Za-z0-9]{1,12})$/);
  const ext = extMatch?.[1]?.toLowerCase() ?? "";
  const stem = (ext ? base.slice(0, -ext.length) : base)
    .normalize("NFKD")
    .replace(/[^\w.\-()+@ ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, 80);
  return `${stem || "file"}${ext}`;
}

/** RFC 5987 Content-Disposition for downloads with non-ASCII names. */
export function contentDispositionAttachment(filename: string): string {
  const fallback = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]+/g, "_")
    .replace(/["\\]/g, "_") || "file";
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
