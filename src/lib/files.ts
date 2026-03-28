import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();

export function getOutputDir(buildId: string): string {
  const dir = path.join(PROJECT_ROOT, "public", "outputs", buildId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getOutputUrl(buildId: string, fileName: string): string {
  return `/outputs/${buildId}/${fileName}`;
}

export async function saveFile(
  buildId: string,
  fileName: string,
  data: Buffer | string
): Promise<string> {
  const dir = getOutputDir(buildId);
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, data);
  return getOutputUrl(buildId, fileName);
}

export function getVaultDir(): string {
  const dir = path.join(PROJECT_ROOT, "vault");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
