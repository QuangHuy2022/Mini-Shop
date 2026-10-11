import { readdir } from "node:fs/promises";
import path from "node:path";

const PRODUCT_ASSET_DIRECTORY = path.resolve(
  process.cwd(),
  "public",
  "MiniShop_Assets",
  "assets",
  "images",
  "products"
);
const PRODUCT_ASSET_URL_PREFIX = "/MiniShop_Assets/assets/images/products/";
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function toProductAssetUrl(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) return null;

  const normalizedPath = relativePath.replace(/\\/g, "/");
  if (
    normalizedPath.startsWith("/")
    || /^[a-z]:\//i.test(normalizedPath)
    || normalizedPath.includes("\0")
  ) {
    return null;
  }

  const pathParts = normalizedPath.split("/");
  if (pathParts.some((part) => !part || part === "." || part === "..")) return null;

  const extension = path.extname(pathParts.at(-1)).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) return null;

  return PRODUCT_ASSET_URL_PREFIX
    + pathParts.map((part) => encodeURIComponent(part)).join("/");
}

async function collectImagePaths(directory, root, imagePaths) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectImagePaths(absolutePath, root, imagePaths);
    } else if (entry.isFile()) {
      const assetUrl = toProductAssetUrl(path.relative(root, absolutePath));
      if (assetUrl) imagePaths.push(assetUrl);
    }
  }
}

export async function listProductAssets(root = PRODUCT_ASSET_DIRECTORY) {
  const imagePaths = [];
  await collectImagePaths(root, root, imagePaths);
  return imagePaths.sort((left, right) => left.localeCompare(right, "vi"));
}
