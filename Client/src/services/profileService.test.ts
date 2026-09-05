import { vi } from "vitest";
import { saveMyName } from "./profileService";

const mockGetUser = vi.fn();
const mockUpsert = vi.fn();

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => ({
      upsert: (payload: unknown, options: unknown) =>
        mockUpsert(table, payload, options),
    }),
  },
}));

const USER = { id: "athlete-1", email: "athlete@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: USER }, error: null });
  mockUpsert.mockResolvedValue({ error: null });
});

describe("saveMyName", () => {
  it("writes the name to the profiles row the dashboard reads", async () => {
    await saveMyName("Herdy Cen");

    const [table, payload, options] = mockUpsert.mock.calls[0];
    expect(table).toBe("profiles");
    expect(payload).toEqual({
      id: USER.id,
      name: "Herdy Cen",
      email: USER.email,
    });
    // Keyed on the existing row rather than inserting a second one.
    expect(options).toEqual({ onConflict: "id" });
  });

  it("trims surrounding whitespace", async () => {
    await saveMyName("  Herdy Cen  ");
    expect(mockUpsert.mock.calls[0][1]).toMatchObject({ name: "Herdy Cen" });
  });

  it("refuses a blank name instead of clearing the profile", async () => {
    await expect(saveMyName("   ")).rejects.toThrow("Please enter your name.");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("refuses when nobody is signed in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveMyName("Herdy Cen")).rejects.toThrow("logged in");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("surfaces a write failure to the caller", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "row-level security" } });
    await expect(saveMyName("Herdy Cen")).rejects.toMatchObject({
      message: "row-level security",
    });
  });
});
