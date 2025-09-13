// Eden - AI Sustainability Counter Configuration
// Handles API keys and configuration for the Chrome extension

class Config {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.anthropic.com';
    this.tokenCountEndpoint = '/v1/messages/count_tokens';
    this.isConfigured = false;
    
    this.loadConfig();
  }

  async loadConfig() {
    try {
      // Try to load from Chrome storage first
      const result = await chrome.storage.local.get(['anthropicApiKey']);
      if (result.anthropicApiKey) {
        this.apiKey = result.anthropicApiKey;
        this.isConfigured = true;
        console.log('API key loaded from Chrome storage');
        return;
      }

      // If not in storage, show configuration prompt
      this.showConfigPrompt();
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.showConfigPrompt();
    }
  }

  showConfigPrompt() {
    // This would typically show a popup or settings page
    // For now, we'll just log that configuration is needed
    console.log('Anthropic API key not found. Please configure it in the extension settings.');
  }

  async setApiKey(apiKey) {
    try {
      // Store in Chrome storage
      await chrome.storage.local.set({ anthropicApiKey: apiKey });
      this.apiKey = apiKey;
      this.isConfigured = true;
      console.log('API key saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  isApiKeyConfigured() {
    return this.isConfigured && this.apiKey !== null;
  }

  getTokenCountUrl() {
    return this.baseUrl + this.tokenCountEndpoint;
  }

  // Get headers for API requests
  getApiHeaders() {
    if (!this.isApiKeyConfigured()) {
      throw new Error('API key not configured');
    }

    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };
  }

  // Validate API key format
  validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Basic validation - Anthropic keys typically start with 'sk-ant-'
    return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
} else if (typeof window !== 'undefined') {
  window.Config = Config;
}
