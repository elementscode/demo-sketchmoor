import { test, assert, equal, session, sql } from "@elements/app";
import { safeNext, signin, signup } from "./auth";

async function message(fn: () => unknown): Promise<string> {
  try {
    await fn();
    return "";
  } catch (err: any) {
    return err.message;
  }
}

test("auth", () => {
  test("signup creates a user with a cursor color and signs them in", () => {
    signup("  Katherine Johnson ", "Kat@Example.com", "orbit-1962");

    let user = sql<{ name: string; email: string; color: string }>(
      `select name, email, color from users where email = 'kat@example.com'`,
    ).firstOrThrow();

    equal(user.name, "Katherine Johnson");
    assert(/^#[0-9a-f]{6}$/.test(user.color), "color is a hex value");
    equal(session.get("userName"), "Katherine Johnson");
  });

  test("signup refuses a short password and a taken email", async () => {
    equal(await message(() => signup("Kat", "kat@example.com", "short")), "password must be at least 8 characters");

    signup("Kat", "kat@example.com", "orbit-1962");
    equal(await message(() => signup("Kat", "KAT@example.com", "orbit-1962")), "that email is already registered");
  });

  test("signin checks the password", async () => {
    signup("Kat", "kat@example.com", "orbit-1962");
    session.logout();

    equal(await message(() => signin("kat@example.com", "wrong-one")), "invalid email or password");
    equal(await message(() => signin("KAT@example.com", "orbit-1962")), "");
    assert(session.isLoggedIn(), "signed in");
  });

  test("safeNext only follows paths on this site", () => {
    equal(safeNext("/b/123"), "/b/123");
    equal(safeNext("//evil.example"), "/");
    equal(safeNext("https://evil.example"), "/");
    equal(safeNext(undefined), "/");
  });
});
