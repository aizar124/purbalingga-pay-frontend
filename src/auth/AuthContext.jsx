import { createContext, useContext, useEffect, useState } from 'react';
import { bootstrapSsoSessionApi, logoutApi, meApi, syncSsoProfileApi } from '../api/purbalinggaPay';
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from './authStorage';
import { refreshSsoAccessToken } from './ssoAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedAuth = readStoredAuth();
  const [user, setUser] = useState(storedAuth?.user ?? null);
  const [token, setToken] = useState(storedAuth?.token ?? null);
  const [ssoAccessToken, setSsoAccessToken] = useState(storedAuth?.ssoAccessToken ?? null);
  const [ssoRefreshToken, setSsoRefreshToken] = useState(storedAuth?.ssoRefreshToken ?? null);
  const [loading, setLoading] = useState(Boolean(storedAuth?.token));

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        if (isMounted) {
          setLoading(false);
          clearStoredAuth();
        }

        return;
      }

      try {
        const response = await meApi(token);

        if (!isMounted) {
          return;
        }

        setUser(response.user);
        writeStoredAuth({
          token,
          user: response.user,
          ssoAccessToken,
          ssoRefreshToken,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setToken(null);
        clearStoredAuth();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncSsoProfile() {
      if (!token || !ssoAccessToken) {
        return;
      }

      try {
        const response = await syncSsoProfileApi(token, ssoAccessToken);
        if (!isMounted) {
          return;
        }

        setUser(response.user);
        writeStoredAuth({
          token,
          user: response.user,
          ssoAccessToken,
          ssoRefreshToken,
        });
      } catch {
        if (!isMounted || !ssoRefreshToken) {
          return;
        }

        try {
          const refreshed = await refreshSsoAccessToken(ssoRefreshToken);
          if (!isMounted) {
            return;
          }

          setSsoAccessToken(refreshed.access_token);
          setSsoRefreshToken(refreshed.refresh_token ?? ssoRefreshToken);

          const refreshedResponse = await syncSsoProfileApi(token, refreshed.access_token);
          if (!isMounted) {
            return;
          }

          setUser(refreshedResponse.user);
          writeStoredAuth({
            token,
            user: refreshedResponse.user,
            ssoAccessToken: refreshed.access_token,
            ssoRefreshToken: refreshed.refresh_token ?? ssoRefreshToken,
          });
        } catch {
          // Kalau refresh SSO gagal, tetap lanjut dengan sesi Pay yang sudah ada.
        }
      }
    }

    syncSsoProfile();

    const intervalId = window.setInterval(syncSsoProfile, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [ssoAccessToken, ssoRefreshToken, token, user]);

  const updateUser = (nextUser) => {
    setUser(nextUser);
    if (token && nextUser) {
      writeStoredAuth({
        token,
        user: nextUser,
        ssoAccessToken,
        ssoRefreshToken,
      });
    }
  };

  const establishSession = (nextToken, nextUser, nextSsoAccessToken = null, nextSsoRefreshToken = null) => {
    setUser(nextUser);
    setToken(nextToken);
    setSsoAccessToken(nextSsoAccessToken);
    setSsoRefreshToken(nextSsoRefreshToken);
    setLoading(false);
    writeStoredAuth({
      token: nextToken,
      user: nextUser,
      ssoAccessToken: nextSsoAccessToken,
      ssoRefreshToken: nextSsoRefreshToken,
    });
  };

  const loginWithSsoToken = async (accessToken, refreshToken = null) => {
    const response = await bootstrapSsoSessionApi(accessToken);
    establishSession(response.access_token, response.user, accessToken, refreshToken);
    return response;
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutApi(token);
      }
    } catch {
      // Logout should always clear local session even if the API call fails.
    } finally {
      setUser(null);
      setToken(null);
      setSsoAccessToken(null);
      setSsoRefreshToken(null);
      setLoading(false);
      clearStoredAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        loginWithSsoToken,
        establishSession,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
