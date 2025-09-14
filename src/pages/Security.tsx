import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Security = () => {
  // Scores captured by content script from /score
  const [scores, setScores] = useState<any[]>([]);

  // Load and subscribe to chrome storage (extension) or leave empty on web
  useEffect(() => {
    const isChromeExtension =
      typeof chrome !== "undefined" && !!chrome.runtime?.id;
    if (!isChromeExtension) return;

    const load = () => {
      chrome.storage.local.get(["edenPromptScores"], (result) => {
        const arr = result.edenPromptScores || [];
        setScores(arr);
      });
    };
    load();
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local" || !changes.edenPromptScores) return;
      setScores(changes.edenPromptScores.newValue || []);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Compute Eco Score as avg(score/5)*100
  const ecoPercent = (() => {
    if (!scores.length) return 0;
    const valid = scores
      .map((s) => Number(s.score))
      .filter((n) => !isNaN(n) && n > 0);
    if (!valid.length) return 0;
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    return Math.round((avg / 5) * 100);
  })();

  const hardcodedStreak = 1;

  // Use latest suggestions if present; otherwise fall back to defaults
  const latest = scores[0];
  const latestSuggestions: string[] = (latest?.suggestions || []).slice(0, 3);
  const improvements = (
    latestSuggestions.length
      ? latestSuggestions
      : [
          "Try smaller, efficient AI models for simple tasks",
          "Shorter prompts use less computational power",
          "Group AI tasks together to reduce overhead",
        ]
  ).map((desc, idx) => ({
    icon:
      idx === 0 ? (
        <TrendingDown className="text-red-500 w-4 h-4" />
      ) : idx === 1 ? (
        <AlertTriangle className="text-orange-500 w-4 h-4" />
      ) : (
        <Lightbulb className="text-yellow-500 w-4 h-4" />
      ),
    title:
      idx === 0
        ? "Reduce Large Model Usage"
        : idx === 1
        ? "Optimize Query Length"
        : "Batch Similar Requests",
    description: desc,
    impact:
      idx === 0
        ? "Could save 40% energy"
        : idx === 1
        ? "15-25% efficiency gain"
        : "30% resource optimization",
  }));

  return (
    <div className="chrome-extension-container">
      <div className="chrome-extension-content">
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="extension-card">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-medium text-gray-800">
                AI Usage Overview
              </h1>
            </div>
          </div>

          {/* AI Use Section */}
          <div className="extension-card space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-500 w-5 h-5" />
              <h2 className="text-base font-medium text-gray-800">AI use</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center space-y-1">
                <div className="text-xl font-bold text-green-500">
                  {ecoPercent}%
                </div>
                <div className="text-xs text-gray-500">Eco Score</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-bold text-blue-500">
                  {hardcodedStreak}
                </div>
                <div className="text-xs text-gray-500">Days Streak</div>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              You're doing well with environmental consciousness. Your
              consistent efforts are making a real difference!
            </p>
          </div>

          {/* How You Can Improve Section */}
          <div className="extension-card space-y-3">
            <h2 className="text-base font-medium text-gray-800">
              How you can improve
            </h2>

            <div className="space-y-3">
              {improvements.map((improvement, index) => (
                <div
                  key={index}
                  className="border-l-2 border-primary pl-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {improvement.icon}
                    <h4 className="text-xs font-medium">{improvement.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600">
                    {improvement.description}
                  </p>
                  <div className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                    {improvement.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};
