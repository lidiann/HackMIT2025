// Eden - AI Sustainability Counter Configuration
// Handles API keys and configuration for the Chrome extension

class Config {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.anthropic.com';
    this.tokenCountEndpoint = '/v1/messages/count_tokens';
    this.isConfigured = false;
    
    // Try to get API key from environment variable first
    this.setApiKeyFromEnv();
    this.loadConfig();
  }

  setApiKeyFromEnv() {
    // This will be set by your build process or environment
    // For now, you can manually set it here or use a build tool to inject it
    const envApiKey = this.getEnvApiKey();
    if (envApiKey) {
      this.apiKey = envApiKey;
      this.isConfigured = true;
      console.log('API key loaded from environment');
    }
  }

  getEnvApiKey() {
    // Try to get API key from the api-config.js file
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.ANTHROPIC_API_KEY) {
      return API_CONFIG.ANTHROPIC_API_KEY;
    }
    
    // Fallback: try to get from environment (if available)
    // This would work in a Node.js build process
    if (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) {
      return process.env.ANTHROPIC_API_KEY;
    }
    
    return null;
  }

  async loadConfig() {
    try {
      // First try to get from environment variable (for development/production)
      // In a Chrome extension, we can't directly access process.env, so we'll use a different approach
      // The API key should be set during build time or injected by the build process
      
      // Try to load from Chrome storage (fallback)
      const result = await chrome.storage.local.get(['anthropicApiKey']);
      if (result.anthropicApiKey) {
        this.apiKey = result.anthropicApiKey;
        this.isConfigured = true;
        console.log('API key loaded from Chrome storage');
        return;
      }

      // For now, we'll need to set the API key manually in the code
      // This should be replaced with environment variable injection during build
      console.log('No API key found. Please set ANTHROPIC_API_KEY in your environment and rebuild.');
      this.isConfigured = false;
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.isConfigured = false;
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
    // Use your deployed Render API instead of localhost
    return 'https://hackmit2025-pf5p.onrender.com/count';
  }

  // Get headers for API requests
  getApiHeaders() {
    // For deployed API, we don't need to send the API key from the extension
    // The API key is stored securely on the server
    return {
      'Content-Type': 'application/json'
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
