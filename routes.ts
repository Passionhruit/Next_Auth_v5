/**
 *
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type { string[] }
 *
 */

// for logged in, logged out user
export const publicRoutes = ["/", "/auth/new-verification"];
/**
 *
 * An array of routes that are accessible to the public
 * These routes will redirect logged in users to /settings
 * @type { string[] }
 *
 */

// it is only gonna available for logged out user
export const authRoutes = [
  "/auth/reset",
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/new-password",
];

/**
 *
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type { string }
 *
 */
export const apiAuthPrefix = "/api/auth";

/**
 *
 * The default redirect path after logging in
 * @type { string }
 *
 */
export const DEFAULT_LOGIN_REDIRECT = "/settings";
