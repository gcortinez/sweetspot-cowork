import { authAPI } from "./auth-api";
import type { AuthUser } from "@/types/database";

export interface SessionData {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  lastRefresh: number;
}

export interface SessionManagerEvents {
  sessionExpired: () => void;
  sessionRefreshed: (data: SessionData) => void;
  sessionCleared: () => void;
  sessionRestored: (data: SessionData) => void;
}

class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private eventListeners: Partial<SessionManagerEvents> = {};
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  // Session storage keys
  private readonly SESSION_KEY = "sweetspot-session";
  private readonly REFRESH_TOKEN_KEY = "sweetspot-refresh-token";
  private readonly SESSION_EVENT_KEY = "sweetspot-session-event";

  // Token refresh timing (in milliseconds) - Less aggressive refresh
  private readonly REFRESH_BUFFER = 2 * 60 * 1000; // 2 minutes before expiry (reduced from 5)
  private readonly MIN_REFRESH_INTERVAL = 60 * 1000; // 1 minute minimum between refreshes (increased from 30s)
  private readonly MAX_RETRY_ATTEMPTS = 2; // Reduced retry attempts

  private constructor() {
    this.setupStorageListener();
    this.setupVisibilityListener();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Clean corrupted tokens from storage
   */
  private cleanCorruptedTokens(): void {
    try {
      // Check if tokens are corrupted by trying to parse them
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          // Validate token format (basic JWT structure check)
          if (session.accessToken && typeof session.accessToken === 'string') {
            const tokenParts = session.accessToken.split('.');
            if (tokenParts.length !== 3) {
              console.warn('Corrupted access token detected, clearing session');
              this.clearSession();
              return;
            }
          }
        } catch (e) {
          console.warn('Invalid session data detected, clearing session');
          this.clearSession();
          return;
        }
      }
      
      if (refreshToken && typeof refreshToken === 'string') {
        const tokenParts = refreshToken.split('.');
        if (tokenParts.length !== 3) {
          console.warn('Corrupted refresh token detected, clearing session');
          this.clearSession();
          return;
        }
      }
    } catch (error) {
      console.error('Error cleaning corrupted tokens:', error);
      this.clearSession();
    }
  }

  /**
   * Initialize session from stored data
   */
  async initializeSession(): Promise<SessionData | null> {
    try {
      // First clean any corrupted tokens
      this.cleanCorruptedTokens();
      
      const storedSession = this.getStoredSession();
      if (!storedSession) {
        return null;
      }

      // Check if session is still valid
      if (this.isSessionExpired(storedSession)) {
        // Try to refresh the session
        const refreshed = await this.refreshSession();
        if (refreshed) {
          const newSession = this.getStoredSession();
          if (newSession) {
            this.emit("sessionRestored", newSession);
            this.scheduleTokenRefresh(newSession);
            return newSession;
          }
        }
        // If refresh failed, clear the session
        this.clearSession();
        return null;
      }

      // Session is valid, schedule refresh
      this.scheduleTokenRefresh(storedSession);
      this.emit("sessionRestored", storedSession);
      return storedSession;
    } catch (error) {
      console.error("Session initialization error:", error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Store session data
   */
  storeSession(data: SessionData): void {
    try {
      // Store main session data (without refresh token for security)
      const sessionData = {
        user: data.user,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
        lastRefresh: data.lastRefresh,
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));

      // Store refresh token separately (more secure)
      if (data.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
      }

      // Set cookie for middleware
      this.setCookie("auth-token", data.accessToken, data.expiresAt);

      // Schedule token refresh
      this.scheduleTokenRefresh(data);

      // Notify other tabs
      this.broadcastSessionEvent("session-updated", data);
    } catch (error) {
      console.error("Error storing session:", error);
    }
  }

  /**
   * Get stored session data
   */
  getStoredSession(): SessionData | null {
    try {
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

      if (!sessionStr) {
        return null;
      }

      const sessionData = JSON.parse(sessionStr);
      return {
        ...sessionData,
        refreshToken,
      };
    } catch (error) {
      console.error("Error getting stored session:", error);
      return null;
    }
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    try {
      // Clear localStorage
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);

      // Clear cookie
      this.clearCookie("auth-token");

      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Reset state
      this.isRefreshing = false;
      this.refreshPromise = null;

      // Notify other tabs
      this.broadcastSessionEvent("session-cleared");

      // Emit event
      this.emit("sessionCleared");
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  }

  /**
   * Refresh session tokens
   */
  async refreshSession(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      const session = this.getStoredSession();
      if (!session?.refreshToken) {
        return false;
      }


      // Check if we've refreshed too recently
      const timeSinceLastRefresh = Date.now() - session.lastRefresh;
      if (timeSinceLastRefresh < this.MIN_REFRESH_INTERVAL) {
        return true; // Consider it successful to avoid rapid refresh attempts
      }

      const response = await authAPI.refreshToken(session.refreshToken);

      if (response.success && response.user && response.accessToken) {
        const newSession: SessionData = {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || session.refreshToken,
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
          lastRefresh: Date.now(),
        };

        this.storeSession(newSession);
        this.emit("sessionRefreshed", newSession);
        return true;
      } else {
        // Refresh failed, clear session
        this.clearSession();
        this.emit("sessionExpired");
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      this.clearSession();
      this.emit("sessionExpired");
      return false;
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(session: SessionData): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const timeUntilExpiry = session.expiresAt - Date.now();
    const refreshTime = Math.max(
      timeUntilExpiry - this.REFRESH_BUFFER,
      this.MIN_REFRESH_INTERVAL
    );

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshSession();
      }, refreshTime);
    } else {
      // Token is already expired or about to expire, refresh immediately
      this.refreshSession();
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: SessionData): boolean {
    return Date.now() >= session.expiresAt - this.REFRESH_BUFFER;
  }

  /**
   * Set up storage event listener for cross-tab synchronization
   */
  private setupStorageListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("storage", (event) => {
      if (event.key === this.SESSION_EVENT_KEY && event.newValue) {
        try {
          const eventData = JSON.parse(event.newValue);
          this.handleSessionEvent(eventData);
        } catch (error) {
          console.error("Error handling storage event:", error);
        }
      }
    });
  }

  /**
   * Set up page visibility listener to refresh session when page becomes visible
   */
  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return;

    let lastVisibilityChange = 0;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Throttle visibility refresh to prevent rapid refreshes
        const now = Date.now();
        if (now - lastVisibilityChange < this.MIN_REFRESH_INTERVAL) {
          return;
        }
        lastVisibilityChange = now;
        
        // Page became visible, check if session needs refresh
        const session = this.getStoredSession();
        if (session && this.isSessionExpired(session)) {
          this.refreshSession();
        }
      }
    });
  }

  /**
   * Broadcast session events to other tabs
   */
  private broadcastSessionEvent(type: string, data?: any): void {
    if (typeof window === "undefined") return;

    try {
      const eventData = {
        type,
        data,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.SESSION_EVENT_KEY, JSON.stringify(eventData));
      // Remove immediately to trigger storage event
      localStorage.removeItem(this.SESSION_EVENT_KEY);
    } catch (error) {
      console.error("Error broadcasting session event:", error);
    }
  }

  /**
   * Handle session events from other tabs
   */
  private handleSessionEvent(eventData: any): void {
    switch (eventData.type) {
      case "session-cleared":
        // Another tab cleared the session, clear local state
        if (this.refreshTimer) {
          clearTimeout(this.refreshTimer);
          this.refreshTimer = null;
        }
        this.emit("sessionCleared");
        break;

      case "session-updated":
        // Another tab updated the session, sync local state
        if (eventData.data) {
          this.scheduleTokenRefresh(eventData.data);
          this.emit("sessionRefreshed", eventData.data);
        }
        break;
    }
  }

  /**
   * Set cookie
   */
  private setCookie(name: string, value: string, expiresAt: number): void {
    if (typeof document === "undefined") return;

    const expires = new Date(expiresAt).toUTCString();
    document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
  }

  /**
   * Clear cookie
   */
  private clearCookie(name: string): void {
    if (typeof document === "undefined") return;

    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Add event listener
   */
  on<K extends keyof SessionManagerEvents>(
    event: K,
    listener: SessionManagerEvents[K]
  ): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Remove event listener
   */
  off<K extends keyof SessionManagerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  /**
   * Emit event
   */
  private emit<K extends keyof SessionManagerEvents>(
    event: K,
    ...args: Parameters<NonNullable<SessionManagerEvents[K]>>
  ): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  /**
   * Get session validity status
   */
  getSessionStatus(): {
    isValid: boolean;
    expiresAt: number | null;
    timeUntilExpiry: number | null;
  } {
    const session = this.getStoredSession();
    if (!session) {
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
      };
    }

    const timeUntilExpiry = session.expiresAt - Date.now();
    return {
      isValid: timeUntilExpiry > 0,
      expiresAt: session.expiresAt,
      timeUntilExpiry,
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
