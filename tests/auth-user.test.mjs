import assert from "node:assert/strict";
import test from "node:test";

const authUserModule = await import("../lib/auth-user.mjs").catch((error) => {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
  return null;
});
const toStoreUser = authUserModule?.toStoreUser;
const isAdminClaims = authUserModule?.isAdminClaims;

test("maps the Supabase profile name and email to the storefront user", () => {
  assert.equal(typeof toStoreUser, "function", "auth-user must export toStoreUser");
  assert.deepEqual(
    toStoreUser({
      email: "customer@example.com",
      user_metadata: { full_name: "Nguyễn An" },
      app_metadata: {},
    }),
    { name: "Nguyễn An", email: "customer@example.com", role: "customer" }
  );
});

test("only trusts Supabase app metadata for the admin role", () => {
  assert.equal(typeof toStoreUser, "function", "auth-user must export toStoreUser");
  assert.equal(
    toStoreUser({
      email: "customer@example.com",
      user_metadata: { role: "admin" },
      app_metadata: {},
    }).role,
    "customer"
  );
  assert.equal(
    toStoreUser({
      email: "admin@example.com",
      user_metadata: { full_name: "Shop Admin" },
      app_metadata: { role: "admin" },
    }).role,
    "admin"
  );
});

test("grants admin access only when verified claims include the admin app role", () => {
  assert.equal(typeof isAdminClaims, "function", "auth-user must export isAdminClaims");
  assert.equal(isAdminClaims(null), false);
  assert.equal(isAdminClaims({ user_metadata: { role: "admin" } }), false);
  assert.equal(isAdminClaims({ app_metadata: { role: "customer" } }), false);
  assert.equal(isAdminClaims({ app_metadata: { role: "admin" } }), true);
});
