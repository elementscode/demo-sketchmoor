import { sql, session, AuthError } from "@elements/app";

export const MIN_PASSWORD = 8;

/** The colors a new account's cursor can take, handed out in turn. */
export const CURSOR_COLORS = ["#e5484d", "#0090ff", "#30a46c", "#f76b15", "#8e4ec6", "#d6409f"];

interface User {
  id: string;
  name: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** @rpc */
export function signin(email: string, password: string) {
  let address = normalizeEmail(email);

  if (!address || !password) {
    throw new AuthError("enter your email and password");
  }

  let user = sql<User>(
    `select id, name from users
     where email = ${address}
       and passwordHash = crypt(${password}, passwordHash)`,
  ).first();

  if (!user) {
    throw new AuthError("invalid email or password");
  }

  session.login({ userId: user.id, userName: user.name });
}

/** @rpc */
export function signup(name: string, email: string, password: string) {
  let display = name.trim();
  let address = normalizeEmail(email);

  if (!display) {
    throw new AuthError("enter your name");
  }

  if (!isEmail(address)) {
    throw new AuthError("enter a valid email address");
  }

  if (password.length < MIN_PASSWORD) {
    throw new AuthError(`password must be at least ${MIN_PASSWORD} characters`);
  }

  let taken = !sql(`select 1 from users where email = ${address}`).empty();

  if (taken) {
    throw new AuthError("that email is already registered");
  }

  let count = sql<{ n: number }>(`select count(*)::int as n from users`).firstOrThrow().n;
  let color = CURSOR_COLORS[count % CURSOR_COLORS.length];

  let user = sql<{ id: string }>(
    `insert into users (name, email, color, passwordHash)
          values (${display}, ${address}, ${color}, crypt(${password}, genSalt('bf', 12)))
     returning id`,
  ).firstOrThrow();

  session.login({ userId: user.id, userName: display });
}

/** @rpc */
export function signout() {
  session.logout();
}

/** Only a path on this site is followed after signin, never another origin. */
export function safeNext(value: unknown): string {
  let next = typeof value === "string" ? value : "";

  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
