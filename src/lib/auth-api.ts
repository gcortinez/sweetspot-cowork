import {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
} from "@/types/database";
import { buildAuthUrl } from "./api-config";

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
    const url = buildAuthUrl(endpoint);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        // Handle validation errors with details
        if (errorData.error === "VALIDATION_ERROR" && errorData.details) {
          errorMessage = errorData.details[0]?.message || errorMessage;
        } else {
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch (jsonError) {
        // If JSON parsing fails, try to get text response
        try {
          const textResponse = await response.text();
          if (textResponse) {
            errorMessage = textResponse;
          }
        } catch (textError) {
          errorMessage = "Network error";
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthAPI.login called with:', { email: data.email, hasPassword: !!data.password, tenantSlug: data.tenantSlug });
      const response = await this.request("/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

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
