// API Configuration for Eden - AI Sustainability Counter
// Set your Anthropic API key here

const API_CONFIG = {
  // Replace with your actual API key from your partner's environment
  ANTHROPIC_API_KEY: 'sk-ant-your-api-key-here',
  
  // API endpoints
  ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
  TOKEN_COUNT_ENDPOINT: '/v1/messages/count_tokens',
  ANTHROPIC_VERSION: '2023-06-01',
  ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
} else if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
} else if (typeof self !== 'undefined') {
  self.API_CONFIG = API_CONFIG;
}
