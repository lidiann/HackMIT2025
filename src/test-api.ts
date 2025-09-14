// Simple test to verify API connection
import { apiService } from './services/api';

const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const health = await apiService.getHealth();
    console.log('Health check:', health);
    
    // Test token counting
    const result = await apiService.countTokens({
      text: 'Hello, this is a test message to count tokens.',
      model: 'claude-3-5-haiku-20241022',
      expected_output_tokens: 200
    });
    
    console.log('Token count result:', result);
    console.log('✅ API connection successful!');
  } catch (error) {
    console.error('❌ API connection failed:', error);
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  testAPI();
}

export { testAPI };
