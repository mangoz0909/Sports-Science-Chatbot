/**
 * The AI quota refund is server-only (bug hunt v4, V4-05, 16 Nov 2026).
 *
 * refund_ai_quota() took one request off the caller's daily counter every time
 * it was called and was granted to every signed-in user, so anyone could call
 * it through the API after each AI request and never reach the cap. It now
 * takes the athlete's id and only the service role may run it (migration
 * 20261127000000); the edge functions call it with a service-role client, on
 * their own failure path only. The grant itself is checked by
 * supabase/tests/V4-05-refund-rls.sql, which is run by hand in the SQL editor.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { vi } from "vitest";
import { refundQuota } from "../../supabase/functions/_shared/quota";

const supabaseDir = join(__dirname, "..", "..", "supabase");
const migrationsDir = join(supabaseDir, "migrations");

describe("refundQuota", () => {
  it("refunds the given athlete through the client it is handed", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await refundQuota({ rpc }, "athlete-1");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("refund_ai_quota", { p_user_id: "athlete-1" });
  });

  it("does nothing, and does not throw, without a service-role client", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(refundQuota(null, "athlete-1")).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it("does not throw when the refund call itself fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const rpc = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(refundQuota({ rpc }, "athlete-1")).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});

describe("the refund grant", () => {
  const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
  const latest = [...files]
    .reverse()
    .find((file) => readFileSync(join(migrationsDir, file), "utf8").includes("refund_ai_quota"))!;
  const sql = readFileSync(join(migrationsDir, latest), "utf8");

  it("drops the version any signed-in user could call", () => {
    expect(sql).toMatch(/drop function if exists public\.refund_ai_quota\(\);/i);
  });

  it("lets only the service role run the new one", () => {
    expect(sql).toMatch(
      /revoke all on function public\.refund_ai_quota\(uuid\) from public, anon, authenticated;/i
    );
    expect(sql).toMatch(/grant execute on function public\.refund_ai_quota\(uuid\) to service_role;/i);
    expect(sql).not.toMatch(/grant execute on function public\.refund_ai_quota[^;]*authenticated/i);
  });
});

describe("the edge functions", () => {
  it.each(["ai-chat", "ai-complete"])("%s refunds with a service-role client and the user's id", (name) => {
    const source = readFileSync(join(supabaseDir, "functions", name, "index.ts"), "utf8");
    expect(source).toContain("refundQuota(serviceRoleClient(supabaseUrl), user.id)");
    expect(source).toContain('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
    expect(source).not.toContain("refundQuota(supabase)");
  });
});
