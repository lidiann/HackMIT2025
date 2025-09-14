import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Leaf,
  Droplet,
  Sun,
  Trophy,
  Sprout,
  Shield,
  Zap,
  Earth,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";

// Import all plant stage images
import plantStage1 from "@/assets/plant_stage_fixed_1.png";
import plantStage2 from "@/assets/plant_stage_fixed_2.png";
import plantStage3 from "@/assets/plant_stage_fixed_3.png";
import plantStage4 from "@/assets/plant_stage_fixed_4.png";
import plantStage5 from "@/assets/plant_stage_fixed_5.png";

export const EcoGarden = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Plant health percentage (0..100), derived from eco score
  const [plantHealth, setPlantHealth] = useState(72);
  // Plant needs derived from usage
  const [waterScorePercent, setWaterScorePercent] = useState(85);
  const [energyScorePercent, setEnergyScorePercent] = useState(90);

  // Plant stage images array
  const plantStages = [
    plantStage1,
    plantStage2,
    plantStage3,
    plantStage4,
    plantStage5,
  ];

  // Stage names and descriptions
  const stageInfo = [
    {
      name: "Seedling",
      level: "Level 1/5",
      description: "Just starting to grow",
    },
    { name: "Sprout", level: "Level 2/5", description: "Taking root" },
    { name: "Young Plant", level: "Level 3/5", description: "Growing strong" },
    { name: "Mature Plant", level: "Level 4/5", description: "Almost there!" },
    { name: "Flowering", level: "Level 5/5", description: "Fully grown!" },
  ];

  // Calculate current stage based on plant health
  const getCurrentStage = (health: number) => {
    if (health < 20) return 1;
    if (health < 40) return 2;
    if (health < 60) return 3;
    if (health < 80) return 4;
    return 5;
  };

  // Update plant stage with animation
  useEffect(() => {
    const newStage = getCurrentStage(plantHealth);
    if (newStage !== currentStage) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStage(newStage);
        setIsAnimating(false);
      }, 500);
    }
  }, [plantHealth, currentStage]);
  // Load from chrome storage and compute plant metrics
  useEffect(() => {
    const isChromeExtension =
      typeof chrome !== "undefined" && !!chrome.runtime?.id;
    if (!isChromeExtension) return;

    const computeFrom = (usage: any[], scores: any[]) => {
      // Eco health from scores: avg(score/5)*100
      const validScores = (scores || [])
        .map((s: any) => Number(s?.score))
        .filter((n: number) => !isNaN(n) && n > 0);
      if (validScores.length) {
        const avg =
          validScores.reduce((a: number, b: number) => a + b, 0) /
          validScores.length;
        const health = Math.round((avg / 5) * 100);
        setPlantHealth(health);
        // Make plant needs match overall plant health
        setEnergyScorePercent(health);
        setWaterScorePercent(health);
      }
    };

    const load = () => {
      chrome.storage.local.get(
        ["edenUsageHistory", "edenPromptScores"],
        (res) => {
          computeFrom(res.edenUsageHistory || [], res.edenPromptScores || []);
        }
      );
    };

    load();
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") return;
      if (changes.edenUsageHistory || changes.edenPromptScores) {
        chrome.storage.local.get(
          ["edenUsageHistory", "edenPromptScores"],
          (res) => {
            computeFrom(res.edenUsageHistory || [], res.edenPromptScores || []);
          }
        );
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const achievements = [
    {
      icon: <Sprout className="text-green-500 w-6 h-6" />,
      title: "First Steps",
      description: "Started your eco journey",
      completed: plantHealth > 0,
    },
    {
      icon: <Droplet className="text-blue-500 w-6 h-6" />,
      title: "Water Saver",
      description: "Reduced water usage per token",
      completed: waterScorePercent >= 80,
    },
    {
      icon: <Zap className="text-yellow-500 w-6 h-6" />,
      title: "Energy Efficient",
      description: "Optimized energy consumption per token",
      completed: energyScorePercent >= 80,
    },
    {
      icon: <Earth className="text-blue-600 w-6 h-6" />,
      title: "Planet Protector",
      description: "Achieved 70+ eco score",
      completed: plantHealth >= 70,
    },
    {
      icon: <Trophy className="text-amber-500 w-6 h-6" />,
      title: "Eco Master",
      description: "Reached maximum plant growth",
      completed: currentStage >= 5,
    },
  ];

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
                Your Eco Garden
              </h1>
            </div>
          </div>

          {/* Plant Growth Card */}
          <div className="extension-card text-center space-y-3">
            <div className="relative">
              <img
                src={plantStages[currentStage - 1]}
                alt={stageInfo[currentStage - 1].name}
                className={`w-24 h-24 mx-auto object-contain transition-all duration-700 ease-out ${
                  isAnimating
                    ? "scale-125 animate-bounce"
                    : "scale-100 hover:scale-110 hover:rotate-1"
                }`}
                style={{
                  filter: isAnimating
                    ? "drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))"
                    : "none",
                }}
              />
              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-800">
                {stageInfo[currentStage - 1].name}
              </h2>
              <p className="text-sm text-gray-500">
                {stageInfo[currentStage - 1].level}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stageInfo[currentStage - 1].description}
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={plantHealth} className="h-2" />
              <p className="text-sm text-gray-600">
                Plant health:{" "}
                <span className="text-green-500 font-medium">
                  {plantHealth}%
                </span>
              </p>
              <div className="text-xs text-gray-500">
                Next stage at {currentStage < 5 ? currentStage * 20 : 100}%
              </div>
            </div>
          </div>

          {/* Plant Needs */}
          <div className="extension-card space-y-3">
            <div className="flex items-center gap-2">
              <Leaf className="text-green-500 w-5 h-5" />
              <h3 className="text-base font-medium text-gray-800">
                Plant Needs
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplet className="text-blue-500 w-5 h-5" />
                  <span className="text-sm">Water Conservation</span>
                </div>
                <span className="text-sm font-medium">
                  {waterScorePercent}%
                </span>
              </div>
              <Progress value={waterScorePercent} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="text-yellow-500 w-5 h-5" />
                  <span className="text-sm">Energy Efficiency</span>
                </div>
                <span className="text-sm font-medium">
                  {energyScorePercent}%
                </span>
              </div>
              <Progress value={energyScorePercent} className="h-2" />
            </div>
          </div>

          {/* Achievements */}
          <div className="extension-card space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="text-amber-500 w-5 h-5" />
              <h3 className="text-base font-medium text-gray-800">
                Achievements
              </h3>
            </div>

            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    achievement.completed
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {achievement.icon}
                    <div>
                      <div
                        className={`text-xs font-medium ${
                          achievement.completed
                            ? "text-gray-800"
                            : "text-gray-500"
                        }`}
                      >
                        {achievement.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                  {achievement.completed && (
                    <Shield className="text-green-500 w-4 h-4" />
                  )}
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
