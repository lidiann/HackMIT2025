// Eden - AI Sustainability Counter Storage Module
// Provides unified API for managing all extension data in Chrome's local storage

class EdenStorage {
  constructor() {
    this.storageKey = 'edenData';
    this.defaultData = {
      totalTokens: 0,
      totalEnergy: 0,
      totalCarbon: 0,
      totalWater: 0,
      sessionTokens: 0,
      sessionEnergy: 0,
      sessionCarbon: 0,
      sessionWater: 0,
      lastReset: Date.now(),
      dailyUsage: {}
    };
  }

  async initialize() {
    try {
      const data = await chrome.storage.local.get([this.storageKey]);
      if (!data[this.storageKey]) {
        await chrome.storage.local.set({ [this.storageKey]: this.defaultData });
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  async getStats() {
    try {
      const data = await chrome.storage.local.get([this.storageKey]);
      return data[this.storageKey] || this.defaultData;
    } catch (error) {
      console.error('Error getting stats:', error);
      return this.defaultData;
    }
  }

  async updateStats(tokens, energy, carbon, water) {
    try {
      const data = await this.getStats();
      data.totalTokens += tokens;
      data.totalEnergy += energy;
      data.totalCarbon += carbon;
      data.totalWater += water;
      data.sessionTokens += tokens;
      data.sessionEnergy += energy;
      data.sessionCarbon += carbon;
      data.sessionWater += water;
      
      await chrome.storage.local.set({ [this.storageKey]: data });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  async resetStats() {
    try {
      await chrome.storage.local.set({ [this.storageKey]: this.defaultData });
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  }

  async getSessionData() {
    try {
      const data = await this.getStats();
      return {
        tokens: data.sessionTokens,
        energy: data.sessionEnergy,
        carbon: data.sessionCarbon,
        water: data.sessionWater
      };
    } catch (error) {
      console.error('Error getting session data:', error);
      return { tokens: 0, energy: 0, carbon: 0, water: 0 };
    }
  }

  async resetSession() {
    try {
      const data = await this.getStats();
      data.sessionTokens = 0;
      data.sessionEnergy = 0;
      data.sessionCarbon = 0;
      data.sessionWater = 0;
      await chrome.storage.local.set({ [this.storageKey]: data });
    } catch (error) {
      console.error('Error resetting session:', error);
    }
  }

  async addTokenUsage(tokens, energy, carbon, water) {
    await this.updateStats(tokens, energy, carbon, water);
  }

  async getDailyUsage() {
    try {
      const data = await this.getStats();
      return data.dailyUsage || {};
    } catch (error) {
      console.error('Error getting daily usage:', error);
      return {};
    }
  }

  async exportData() {
    try {
      const data = await this.getStats();
      return {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  async cleanupOldData() {
    try {
      const data = await this.getStats();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // Clean up old daily usage data
      Object.keys(data.dailyUsage || {}).forEach(date => {
        if (new Date(date).getTime() < thirtyDaysAgo) {
          delete data.dailyUsage[date];
        }
      });
      
      await chrome.storage.local.set({ [this.storageKey]: data });
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}

// Create global instance
const edenStorage = new EdenStorage();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EdenStorage;
} else if (typeof window !== 'undefined') {
  window.EdenStorage = EdenStorage;
  window.edenStorage = edenStorage;
} else if (typeof self !== 'undefined') {
  self.EdenStorage = EdenStorage;
  self.edenStorage = edenStorage;
}
