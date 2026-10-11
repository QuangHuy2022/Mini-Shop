import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const { listProductAssets, toProductAssetUrl } = await import("../lib/product-assets.mjs");

test("converts an image path inside the product assets directory to a web path", () => {
  assert.equal(typeof toProductAssetUrl, "function");
  assert.equal(
    toProductAssetUrl("noi-that gia-dung/sofa-phong-khach.webp"),
    "/MiniShop_Assets/assets/images/products/noi-that%20gia-dung/sofa-phong-khach.webp"
  );
});

test("rejects asset paths that escape the product directory or are not images", () => {
  assert.equal(typeof toProductAssetUrl, "function");
  assert.equal(toProductAssetUrl("../private.webp"), null);
  assert.equal(toProductAssetUrl("chair.svg"), null);
  assert.equal(toProductAssetUrl(""), null);
});

test("recursively lists supported product images as sorted public URLs", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mini-shop-assets-"));
  try {
    await mkdir(path.join(root, "chairs"), { recursive: true });
    await writeFile(path.join(root, "chairs", "oak chair.webp"), "");
    await writeFile(path.join(root, "logo.svg"), "");

    assert.deepEqual(await listProductAssets(root), [
      "/MiniShop_Assets/assets/images/products/chairs/oak%20chair.webp",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
