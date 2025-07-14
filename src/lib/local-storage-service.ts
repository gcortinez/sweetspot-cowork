// Local storage service for demo data persistence
// This simulates database persistence while the backend is being developed

interface StoredActivity {
  id: string;
  leadId: string;
  type: string;
  subject: string;
  description?: string;
  dueDate?: string;
  duration?: number;
  location?: string;
  outcome?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface StoredLeadScore {
  leadId: string;
  score: number;
  updatedAt: string;
}

const ACTIVITIES_KEY = 'sweetspot_lead_activities';
const SCORES_KEY = 'sweetspot_lead_scores';

export const localStorageService = {
  // Activities
  getActivities: (leadId: string): StoredActivity[] => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY);
      if (!stored) return [];
      
      const allActivities = JSON.parse(stored) as StoredActivity[];
      return allActivities.filter(activity => activity.leadId === leadId);
    } catch (error) {
      console.error('Error loading activities from localStorage:', error);
      return [];
    }
  },

  saveActivity: (leadId: string, activity: any): void => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY);
      const allActivities = stored ? JSON.parse(stored) : [];
      
      const newActivity: StoredActivity = {
        ...activity,
        leadId,
        createdAt: activity.createdAt || new Date().toISOString()
      };
      
      allActivities.push(newActivity);
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(allActivities));
    } catch (error) {
      console.error('Error saving activity to localStorage:', error);
    }
  },

  updateActivity: (activityId: string, updates: any): void => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY);
      if (!stored) return;
      
      const allActivities = JSON.parse(stored) as StoredActivity[];
      const index = allActivities.findIndex(a => a.id === activityId);
      
      if (index !== -1) {
        allActivities[index] = { ...allActivities[index], ...updates };
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(allActivities));
      }
    } catch (error) {
      console.error('Error updating activity in localStorage:', error);
    }
  },

  deleteActivity: (activityId: string): void => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY);
      if (!stored) return;
      
      const allActivities = JSON.parse(stored) as StoredActivity[];
      const filtered = allActivities.filter(a => a.id !== activityId);
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting activity from localStorage:', error);
    }
  },

  // Lead Scores
  getLeadScore: (leadId: string): number | null => {
    try {
      const stored = localStorage.getItem(SCORES_KEY);
      if (!stored) return null;
      
      const scores = JSON.parse(stored) as StoredLeadScore[];
      const leadScore = scores.find(s => s.leadId === leadId);
      return leadScore ? leadScore.score : null;
    } catch (error) {
      console.error('Error loading score from localStorage:', error);
      return null;
    }
  },

  saveLeadScore: (leadId: string, score: number): void => {
    try {
      const stored = localStorage.getItem(SCORES_KEY);
      const scores = stored ? JSON.parse(stored) : [];
      
      const existingIndex = scores.findIndex((s: StoredLeadScore) => s.leadId === leadId);
      const scoreData: StoredLeadScore = {
        leadId,
        score,
        updatedAt: new Date().toISOString()
      };
      
      if (existingIndex !== -1) {
        scores[existingIndex] = scoreData;
      } else {
        scores.push(scoreData);
      }
      
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    } catch (error) {
      console.error('Error saving score to localStorage:', error);
    }
  },

  // Clear all demo data
  clearDemoData: (): void => {
    localStorage.removeItem(ACTIVITIES_KEY);
    localStorage.removeItem(SCORES_KEY);
  }
};