import path from "node:path";

export type UploadFile = {
  id?: number | string;
  documentId?: string;
  name?: string;
  mime?: string;
  size?: number;
  url?: string;
  [key: string]: unknown;
};

export function getLocalUploadPath(file: UploadFile): string {
  const rawUrl = typeof file?.url === "string" ? file.url : "";

  if (!rawUrl) {
    throw new Error("Missing file.url on upload event");
  }

  const cleanUrl = rawUrl.split("?")[0];

  if (!cleanUrl.startsWith("/uploads/")) {
    throw new Error(`Unsupported upload URL for local provider: ${cleanUrl}`);
  }

  return path.join(process.cwd(), "public", cleanUrl.replace(/^\/+/, ""));
}