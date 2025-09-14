import { useState, useEffect } from 'react';
import { apiService, TokenCountResponse } from '@/services/api';

export interface UsageData {
  tokens: number;
  energy_kwh: number;
  co2_kg: number;
  water_l: number;
  timestamp: Date;
}

// Check if we're in a Chrome extension context
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

export const useAIUsage = () => {
  const [usageHistory, setUsageHistory] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    if (isChromeExtension) {
      // Use Chrome extension storage
      chrome.storage.local.get(['edenUsageHistory'], (result) => {
        if (result.edenUsageHistory) {
          try {
            const parsed = result.edenUsageHistory.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }));
            setUsageHistory(parsed);
          } catch (err) {
            console.error('Failed to parse saved usage data:', err);
          }
        }
      });
    } else {
      // Use localStorage for web version
      const savedData = localStorage.getItem('eden-ai-usage');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setUsageHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        } catch (err) {
          console.error('Failed to parse saved usage data:', err);
        }
      }
    }
  }, []);

  // Save data to storage whenever usageHistory changes
  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage.local.set({ edenUsageHistory: usageHistory });
    } else {
      localStorage.setItem('eden-ai-usage', JSON.stringify(usageHistory));
    }
  }, [usageHistory]);

  const countTokens = async (text: string, model: string = 'claude-3-5-haiku-20241022', expectedOutputTokens: number = 200) => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.countTokens({
        text,
        model,
        expected_output_tokens: expectedOutputTokens
      });

      const newUsage: UsageData = {
        tokens: response.tokens,
        energy_kwh: response.energy_kwh,
        co2_kg: response.co2_kg,
        water_l: response.water_l,
        timestamp: new Date()
      };

      setUsageHistory(prev => [newUsage, ...prev]);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to count tokens';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotals = () => {
    return usageHistory.reduce(
      (totals, usage) => ({
        tokens: totals.tokens + usage.tokens,
        energy_kwh: totals.energy_kwh + usage.energy_kwh,
        co2_kg: totals.co2_kg + usage.co2_kg,
        water_l: totals.water_l + usage.water_l,
      }),
      { tokens: 0, energy_kwh: 0, co2_kg: 0, water_l: 0 }
    );
  };

  const getFilteredData = (period: 'Today' | 'Past Week' | 'Past Month') => {
    const now = new Date();
    const filterDate = new Date();

    switch (period) {
      case 'Today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'Past Week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'Past Month':
        filterDate.setDate(now.getDate() - 30);
        break;
    }

    return usageHistory.filter(usage => usage.timestamp >= filterDate);
  };

  const clearHistory = () => {
    setUsageHistory([]);
    if (isChromeExtension) {
      chrome.storage.local.remove(['edenUsageHistory']);
    } else {
      localStorage.removeItem('eden-ai-usage');
    }
  };

  return {
    usageHistory,
    isLoading,
    error,
    countTokens,
    getTotals,
    getFilteredData,
    clearHistory,
  };
};
