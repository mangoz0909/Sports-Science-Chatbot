import { EmailConfirmationRequiredError } from "./authService";

describe("EmailConfirmationRequiredError", () => {
  it("is distinguishable from an ordinary failure", () => {
    // AuthPage branches on this to show the green success message instead of
    // reporting a successful signup as a red error.
    const confirmation = new EmailConfirmationRequiredError("check your email");

    expect(confirmation).toBeInstanceOf(EmailConfirmationRequiredError);
    expect(confirmation).toBeInstanceOf(Error);
    expect(new Error("boom")).not.toBeInstanceOf(
      EmailConfirmationRequiredError
    );
  });

  it("keeps its message and name", () => {
    const confirmation = new EmailConfirmationRequiredError("check your email");

    expect(confirmation.message).toBe("check your email");
    expect(confirmation.name).toBe("EmailConfirmationRequiredError");
  });
});
