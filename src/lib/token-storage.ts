// Determines whether tokens live in localStorage (persist across browser restarts)
// or sessionStorage (cleared when the tab/browser is closed).
// The preference key itself is always stored in localStorage so we know where to look.

const PREF_KEY = 'tokenStoragePref';

function getStorage(): Storage {
  return localStorage.getItem(PREF_KEY) === 'session'
    ? sessionStorage
    : localStorage;
}

export const tokenStorage = {
  /**
   * Persist both tokens. Call this right after a successful login/register.
   * @param remember - true → localStorage (survives browser restarts)
   *                   false → sessionStorage (cleared on tab close)
   */
  setTokens(accessToken: string, refreshToken: string, remember: boolean): void {
    // Wipe any leftover tokens from either storage before writing to the right one.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');

    localStorage.setItem(PREF_KEY, remember ? 'local' : 'session');
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
  },

  getAccessToken(): string | null {
    return getStorage().getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return getStorage().getItem('refreshToken');
  },

  /** Update the access token in-place (called by the refresh interceptor). */
  updateAccessToken(token: string): void {
    getStorage().setItem('accessToken', token);
  },

  /** Update the refresh token in-place (rotation). */
  updateRefreshToken(token: string): void {
    getStorage().setItem('refreshToken', token);
  },

  /** Remove all token data from both storages. */
  clear(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(PREF_KEY);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  },
};
