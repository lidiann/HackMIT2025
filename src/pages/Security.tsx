import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Security = () => {
  const improvements = [
    {
      icon: <TrendingDown className="text-red-500 w-4 h-4" />,
      title: "Reduce Large Model Usage",
      description: "Try smaller, efficient AI models for simple tasks",
      impact: "Could save 40% energy"
    },
    {
      icon: <AlertTriangle className="text-orange-500 w-4 h-4" />,
      title: "Optimize Query Length",
      description: "Shorter prompts use less computational power",
      impact: "15-25% efficiency gain"
    },
    {
      icon: <Lightbulb className="text-yellow-500 w-4 h-4" />,
      title: "Batch Similar Requests",
      description: "Group AI tasks together to reduce overhead",
      impact: "30% resource optimization"
    }
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
              <h1 className="text-lg font-medium text-gray-800">AI Usage Overview</h1>
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
                <div className="text-xl font-bold text-green-500">85%</div>
                <div className="text-xs text-gray-500">Eco Score</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-bold text-blue-500">12</div>
                <div className="text-xs text-gray-500">Days Streak</div>
              </div>
            </div>
            
            <p className="text-xs text-gray-600">
              You're doing well with environmental consciousness. Your consistent efforts are making a real difference!
            </p>
          </div>

          {/* How You Can Improve Section */}
          <div className="extension-card space-y-3">
            <h2 className="text-base font-medium text-gray-800">How you can improve</h2>
            
            <div className="space-y-3">
              {improvements.map((improvement, index) => (
                <div key={index} className="border-l-2 border-primary pl-3 space-y-1">
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