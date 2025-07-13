// Temporary stub for sessions to fix build
// TODO: Migrate these to Clerk-based authentication

export class SessionManager {
  static async setSession() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async getValidSession() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async logout() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async getCurrentUser() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async switchTenant() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async refreshSession() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async isAuthenticated() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async getCurrentTenantId() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async requireAuth() {
    throw new Error('Not implemented - migrate to Clerk');
  }
}