// Temporary stub for auth service to fix build
// TODO: Migrate these to Clerk-based authentication

export class AuthService {
  static async login() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async register() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async refreshToken() {
    throw new Error('Not implemented - migrate to Clerk');
  }
  
  static async getSession() {
    throw new Error('Not implemented - migrate to Clerk');
  }
}

export async function getCurrentUser() {
  throw new Error('Not implemented - migrate to Clerk');
}

export async function requireRole() {
  throw new Error('Not implemented - migrate to Clerk');
}