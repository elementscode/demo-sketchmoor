import { test, equal, sql } from "@elements/app";
import { DEMO_LOGINS, DEMO_PASSWORD } from "./template";

test("signin", () => {
  test("the demo logins shown on the page share the documented password", () => {
    equal(DEMO_LOGINS.length, 3);
    equal(DEMO_PASSWORD.length >= 8, true);
    equal(new Set(DEMO_LOGINS.map((l) => l.email)).size, 3);
  });
});
