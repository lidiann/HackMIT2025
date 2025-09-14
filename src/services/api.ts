import axios from "axios";

const API_BASE_URL = "https://hackmit2025-pf5p.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface TokenCountRequest {
  text: string;
  model: string;
  expected_output_tokens: number;
}

// Matches backend /count response
export interface TokenCountResponse {
  tokens_input: number;
  tokens_output_estimate: number;
  tokens_total_estimate: number;
  wh_per_token?: number;
  kwh: number;
  co2_kg: number;
  water_l: number;
}

export interface UsageStats {
  total_tokens: number;
  total_energy_kwh: number;
  total_co2_kg: number;
  total_water_l: number;
  total_sessions: number;
}

// Check if we're in a Chrome extension context
const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

export const apiService = {
  // Count tokens and get environmental impact
  async countTokens(data: TokenCountRequest): Promise<TokenCountResponse> {
    if (isChromeExtension) {
      // Use Chrome extension messaging for API calls
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: "countTokens",
            text: data.text,
            model: data.model,
            expectedOutputTokens: data.expected_output_tokens,
          },
          (response) => {
            if (response && response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response?.error || "Failed to count tokens"));
            }
          }
        );
      });
    } else {
      // Use direct API calls for web version
      const response = await api.post<TokenCountResponse>("/count", data);
      return response.data;
    }
  },

  // Get health status
  async getHealth(): Promise<{ ok: boolean }> {
    if (isChromeExtension) {
      // For Chrome extension, we'll assume it's healthy if we can send messages
      return { ok: true };
    } else {
      const response = await api.get<{ ok: boolean }>("/health");
      return response.data;
    }
  },

  // Get usage statistics (if you add database endpoints later)
  async getUsageStats(): Promise<UsageStats> {
    // For now, return mock data since we don't have database endpoints yet
    return {
      total_tokens: 0,
      total_energy_kwh: 0,
      total_co2_kg: 0,
      total_water_l: 0,
      total_sessions: 0,
    };
  },
};

export default apiService;
