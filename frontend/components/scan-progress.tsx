"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface ScanProgressData {
  scan_id: number;
  status: string;
  progress: number;
  opportunities_found: number;
  total_savings: number;
  recent_opportunities: Array<{
    id: number;
    type: string;
    resource_id: string;
    savings_annual: number;
    recommendation: string;
  }>;
  error?: string;
}

interface ScanProgressProps {
  scanId: number;
  onComplete?: () => void;
}

export function ScanProgress({ scanId, onComplete }: ScanProgressProps) {
  const [progress, setProgress] = useState<ScanProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/scan/${scanId}/progress`
    );

    eventSource.onmessage = (event) => {
      try {
        const data: ScanProgressData = JSON.parse(event.data);
        setProgress(data);

        if (data.status === "completed" || data.status === "failed") {
          eventSource.close();
          if (onComplete && data.status === "completed") {
            setTimeout(onComplete, 1000); // Give a moment to show completion
          }
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
        setError("Failed to parse progress data");
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      setError("Connection error. Please refresh to see updates.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [scanId, onComplete]);

  if (error && !progress) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Connecting to scan...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    running: "bg-blue-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
  };

  const statusIcons = {
    running: <Loader2 className="h-5 w-5 animate-spin" />,
    completed: <CheckCircle2 className="h-5 w-5" />,
    failed: <AlertCircle className="h-5 w-5" />,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusIcons[progress.status as keyof typeof statusIcons]}
            <div>
              <CardTitle>Scan Progress</CardTitle>
              <CardDescription>
                {progress.status === "running" && `Scanning your AWS account... Found ${progress.opportunities_found} opportunities so far`}
                {progress.status === "completed" && "Scan completed successfully! View your savings below."}
                {progress.status === "failed" && "Scan failed - please check your AWS connection"}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={
              progress.status === "completed"
                ? "default"
                : progress.status === "failed"
                ? "destructive"
                : "secondary"
            }
          >
            {progress.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progress.opportunities_found}
            </div>
            <div className="text-sm text-gray-600">Opportunities Found</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
              }).format(progress.total_savings)}
            </div>
            <div className="text-sm text-gray-600">Potential Annual Savings</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {progress.status === "completed" ? "✓" : "..."}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        </div>

        {progress.recent_opportunities && progress.recent_opportunities.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Recent Opportunities Found:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {progress.recent_opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className="text-xs">
                      {opp.type.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-sm font-semibold text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(opp.savings_annual)}
                      /yr
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {opp.recommendation}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Resource: {opp.resource_id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {progress.status === "failed" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <strong>Scan failed:</strong> Please check your AWS connection and try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

