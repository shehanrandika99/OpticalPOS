/**
 * Authentication utility functions
 * Simple localStorage-based authentication
 */

/**
 * Check if user is authenticated
 * Returns userId if authenticated, null otherwise
 */
export function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  
  const userId = localStorage.getItem("userId");
  if (!userId || userId.trim() === "") {
    return null;
  }
  
  const parsed = parseInt(userId, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get username from localStorage
 */
export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("username");
}

/**
 * Get firstName from localStorage
 */
export function getFirstName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("firstName");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getUserId() !== null;
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("firstName");
}

