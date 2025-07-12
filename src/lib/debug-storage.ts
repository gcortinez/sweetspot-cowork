/**
 * Debug utilities for storage management
 */

export function clearAllStorage() {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Also set the recent-logout flag to prevent redirect
    localStorage.setItem('recent-logout', 'true');
    
    console.log('✅ All storage cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
}

export function debugStorage() {
  console.log('🔍 Storage Debug Info:');
  
  // Check localStorage
  console.log('📦 LocalStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  }
  
  // Check sessionStorage
  console.log('📦 SessionStorage:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      console.log(`  ${key}:`, sessionStorage.getItem(key));
    }
  }
  
  // Check cookies
  console.log('🍪 Cookies:');
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    console.log(`  ${name}:`, value);
  });
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAllStorage = clearAllStorage;
  (window as any).debugStorage = debugStorage;
}