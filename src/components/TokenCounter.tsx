import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIUsage } from '@/hooks/useAIUsage';
import { Loader2, Calculator, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TokenCounter = () => {
  const [text, setText] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  const { countTokens, isLoading, error } = useAIUsage();

  const handleCountTokens = async () => {
    try {
      const result = await countTokens(text);
      setLastResult(result);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          AI Token Counter
        </CardTitle>
        <CardDescription>
          Enter text to calculate its environmental impact when processed by Claude AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="text-input" className="text-sm font-medium">
            Text to analyze
          </label>
          <Textarea
            id="text-input"
            placeholder="Enter your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleCountTokens} 
          disabled={isLoading || !text.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            'Calculate Environmental Impact'
          )}
        </Button>

        {lastResult && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Results</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Tokens:</span>
                <span className="ml-2 font-medium">{lastResult.tokens}</span>
              </div>
              <div>
                <span className="text-green-600">Energy:</span>
                <span className="ml-2 font-medium">{lastResult.energy_kwh.toFixed(6)} kWh</span>
              </div>
              <div>
                <span className="text-green-600">CO₂:</span>
                <span className="ml-2 font-medium">{lastResult.co2_kg.toFixed(6)} kg</span>
              </div>
              <div>
                <span className="text-green-600">Water:</span>
                <span className="ml-2 font-medium">{lastResult.water_l.toFixed(6)} L</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
