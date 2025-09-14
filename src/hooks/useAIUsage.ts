import { useState, useEffect } from "react";
import { apiService, TokenCountResponse } from "@/services/api";

export interface UsageData {
  // Primary metrics
  energy_kwh: number; // normalized from backend `kwh`
  co2_kg: number;
  water_l: number;
  // Tokens
  tokens_input: number;
  tokens_output_estimate: number;
  tokens_total_estimate: number; // used for totals
  // Meta
  timestamp: Date;
}

// Check if we're in a Chrome extension context
const isChromeExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

export const useAIUsage = () => {
  const [usageHistory, setUsageHistory] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    const normalize = (item: any): UsageData => {
      // Normalize from either extension-stored raw backend responses or web shape
      const energy_kwh = item.energy_kwh ?? item.kwh ?? 0;
      const tokens_input = item.tokens_input ?? 0;
      const tokens_output_estimate = item.tokens_output_estimate ?? 0;
      const tokens_total_estimate =
        item.tokens_total_estimate ??
        item.tokens ??
        tokens_input + tokens_output_estimate ??
        0;
      return {
        energy_kwh: Number(energy_kwh) || 0,
        co2_kg: Number(item.co2_kg) || 0,
        water_l: Number(item.water_l) || 0,
        tokens_input: Number(tokens_input) || 0,
        tokens_output_estimate: Number(tokens_output_estimate) || 0,
        tokens_total_estimate: Number(tokens_total_estimate) || 0,
        timestamp: new Date(item.timestamp),
      };
    };

    if (isChromeExtension) {
      // Use Chrome extension storage
      chrome.storage.local.get(["edenUsageHistory"], (result) => {
        if (result.edenUsageHistory) {
          try {
            const parsed = result.edenUsageHistory.map((item: any) =>
              normalize(item)
            );
            setUsageHistory(parsed);
          } catch (err) {
            console.error("Failed to parse saved usage data:", err);
          }
        }
      });
    } else {
      // Use localStorage for web version
      const savedData = localStorage.getItem("eden-ai-usage");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setUsageHistory(parsed.map((item: any) => normalize(item)));
        } catch (err) {
          console.error("Failed to parse saved usage data:", err);
        }
      }
    }
  }, []);

  // When running as an extension, react to external storage updates
  useEffect(() => {
    if (!isChromeExtension || !chrome?.storage) return;
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local" || !changes.edenUsageHistory) return;
      try {
        const newVal = changes.edenUsageHistory.newValue || [];
        const normalized = newVal.map((item: any) => ({
          energy_kwh: Number(item.energy_kwh ?? item.kwh) || 0,
          co2_kg: Number(item.co2_kg) || 0,
          water_l: Number(item.water_l) || 0,
          tokens_input: Number(item.tokens_input) || 0,
          tokens_output_estimate: Number(item.tokens_output_estimate) || 0,
          tokens_total_estimate:
            Number(
              item.tokens_total_estimate ??
                item.tokens ??
                (item.tokens_input || 0) + (item.tokens_output_estimate || 0)
            ) || 0,
          timestamp: new Date(item.timestamp),
        }));
        setUsageHistory(normalized);
      } catch (e) {
        console.error("Failed to normalize updated usage data:", e);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Save data to storage whenever usageHistory changes
  // Avoid overwriting Chrome storage in extension context to prevent resets
  useEffect(() => {
    if (!isChromeExtension) {
      localStorage.setItem("eden-ai-usage", JSON.stringify(usageHistory));
    }
  }, [usageHistory]);

  const countTokens = async (
    text: string,
    model: string = "claude-3-5-haiku-20241022",
    expectedOutputTokens: number = 200
  ) => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.countTokens({
        text,
        model,
        expected_output_tokens: expectedOutputTokens,
      });

      const newUsage: UsageData = {
        energy_kwh: response.kwh,
        co2_kg: response.co2_kg,
        water_l: response.water_l,
        tokens_input: response.tokens_input,
        tokens_output_estimate: response.tokens_output_estimate,
        tokens_total_estimate: response.tokens_total_estimate,
        timestamp: new Date(),
      };
      // In extension context, persist to chrome.storage.local by merging (does not overwrite)
      if (isChromeExtension && typeof chrome !== "undefined") {
        const entryForStorage: any = {
          tokens_input: newUsage.tokens_input,
          tokens_output_estimate: newUsage.tokens_output_estimate,
          tokens_total_estimate: newUsage.tokens_total_estimate,
          kwh: newUsage.energy_kwh,
          co2_kg: newUsage.co2_kg,
          water_l: newUsage.water_l,
          // Legacy aliases for older UI builds
          tokens: newUsage.tokens_total_estimate,
          energy_kwh: newUsage.energy_kwh,
          timestamp: new Date().toISOString(),
          text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        };
        await new Promise<void>((resolve) => {
          chrome.storage.local.get(["edenUsageHistory"], (result) => {
            const history = (result.edenUsageHistory || []) as any[];
            history.unshift(entryForStorage);
            if (history.length > 100) history.splice(100);
            chrome.storage.local.set({ edenUsageHistory: history }, () =>
              resolve()
            );
          });
        });
      }

      // Update local state immediately for UI feedback
      setUsageHistory((prev) => [newUsage, ...prev]);
      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Failed to count tokens";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotals = () => {
    return usageHistory.reduce(
      (totals, usage) => ({
        tokens_total_estimate:
          totals.tokens_total_estimate + (usage.tokens_total_estimate || 0),
        energy_kwh: totals.energy_kwh + (usage.energy_kwh || 0),
        co2_kg: totals.co2_kg + (usage.co2_kg || 0),
        water_l: totals.water_l + (usage.water_l || 0),
      }),
      { tokens_total_estimate: 0, energy_kwh: 0, co2_kg: 0, water_l: 0 }
    );
  };

  const getFilteredData = (period: "Today" | "Past Week" | "Past Month") => {
    const now = new Date();
    const filterDate = new Date();

    switch (period) {
      case "Today":
        filterDate.setHours(0, 0, 0, 0);
        break;
      case "Past Week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "Past Month":
        filterDate.setDate(now.getDate() - 30);
        break;
    }

    return usageHistory.filter((usage) => usage.timestamp >= filterDate);
  };

  const clearHistory = () => {
    setUsageHistory([]);
    if (isChromeExtension) {
      chrome.storage.local.remove(["edenUsageHistory"]);
    } else {
      localStorage.removeItem("eden-ai-usage");
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
