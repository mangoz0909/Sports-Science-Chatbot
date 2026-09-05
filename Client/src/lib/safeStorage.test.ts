import { readStored, writeStored, removeStored } from "./safeStorage";
import { readCachedPlan, writeCachedPlan } from "./planCache";

const original = Object.getOwnPropertyDescriptor(window, "localStorage");

/** Safari private browsing / "block all cookies": the property access throws. */
function blockStorage() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
  });
}

/** Quota full: the object exists, but writes throw. */
function fillQuota() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      },
      removeItem: () => {},
    },
  });
}

function restore() {
  if (original) Object.defineProperty(window, "localStorage", original);
}

// Restore before clearing, so a test that blocked storage cannot leave the
// next one reading a stale entry and asserting against the wrong thing.
beforeEach(() => {
  restore();
  window.localStorage.clear();
});

afterEach(restore);

describe("safeStorage", () => {
  it("confirms a direct access really does throw when storage is blocked", () => {
    // The control for everything below. AuthPage did exactly this inside a
    // useState initialiser — during render — so the whole sign-in route went
    // to the ErrorBoundary instead of just forgetting the saved address.
    blockStorage();
    expect(() => window.localStorage.getItem("rememberedEmail")).toThrow();
  });

  it("reads as null rather than throwing", () => {
    blockStorage();
    expect(readStored("rememberedEmail")).toBeNull();
  });

  it("writes and removes as silent no-ops", () => {
    blockStorage();
    expect(() => writeStored("rememberedEmail", "a@b.com")).not.toThrow();
    expect(() => removeStored("rememberedEmail")).not.toThrow();
  });

  it("survives a full quota on write", () => {
    fillQuota();
    expect(() => writeStored("k", "v")).not.toThrow();
  });

  it("round-trips normally when storage is available", () => {
    writeStored("rememberedEmail", "a@b.com");
    expect(readStored("rememberedEmail")).toBe("a@b.com");

    removeStored("rememberedEmail");
    expect(readStored("rememberedEmail")).toBeNull();
  });
});

describe("planCache on a browser with storage blocked", () => {
  it("degrades to a cache miss instead of taking the page down", () => {
    blockStorage();
    expect(() => writeCachedPlan("workout", "u1", { focus: "Legs" })).not.toThrow();
    expect(readCachedPlan("workout", "u1")).toBeNull();
  });

  it("keeps rendering when the quota is full", () => {
    fillQuota();
    // The plan is already on screen; it just will not survive a navigation.
    expect(() => writeCachedPlan("nutrition", "u1", { meals: [1] })).not.toThrow();
  });

  it("skips a plan that cannot be serialised", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => writeCachedPlan("workout", "u1", circular)).not.toThrow();
    expect(readCachedPlan("workout", "u1")).toBeNull();
  });
});
