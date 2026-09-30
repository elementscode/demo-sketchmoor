import { test, equal } from "@elements/app";
import { timeAgo } from "./template";

test("home", () => {
  test("timeAgo", () => {
    let now = new Date("2026-09-30T12:00:00Z");

    equal(timeAgo(new Date("2026-09-30T11:59:30Z"), now), "just now");
    equal(timeAgo(new Date("2026-09-30T11:45:00Z"), now), "15m ago");
    equal(timeAgo(new Date("2026-09-30T07:00:00Z"), now), "5h ago");
    equal(timeAgo(new Date("2026-09-27T12:00:00Z"), now), "3d ago");
  });
});
