import {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
} from "@sweetspot/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

interface AuthResponse {
  success: boolean;
  user?: any;
  tenant?: any; // Single tenant for auto-selected case
  tenants?: any[]; // Multiple tenants for selection
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

interface SessionResponse {
  isValid: boolean;
  user?: any;
  error?: string;
}

class AuthAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/api/auth${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // TEMPORARY: Use bypass endpoint
      const response = await this.request("/bypass-login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // The response is already in the correct format
      return {
        success: response.success,
        user: response.user,
        tenant: response.tenant,
        tenants: response.tenants,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.request("/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  async logout(
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Logout failed",
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await this.request("/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }

  async getSession(accessToken: string): Promise<SessionResponse> {
    try {
      const response = await this.request("/session", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response;
    } catch (error) {
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : "Session validation failed",
      };
    }
  }

  async changePassword(
    data: ChangePasswordRequest,
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Password change failed",
      };
    }
  }

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      };
    }
  }

  async confirmResetPassword(
    data: ConfirmResetPasswordRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request("/confirm-reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Password reset confirmation failed",
      };
    }
  }

  async getProfile(
    accessToken: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await this.request("/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get profile",
      };
    }
  }
}

export const authAPI = new AuthAPI();
export type { AuthResponse, SessionResponse };
