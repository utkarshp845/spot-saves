"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ErrorInfo {
  error_type?: string;
  title: string;
  message: string;
  details?: string[];
  solutions?: string[];
  technical_details?: string;
}

interface ErrorDisplayProps {
  error: ErrorInfo | string;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  let errorInfo: ErrorInfo;
  
  if (typeof error === "string") {
    errorInfo = {
      title: "An Error Occurred",
      message: error,
      details: [],
      solutions: []
    };
  } else {
    errorInfo = error;
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">{errorInfo.title}</CardTitle>
        </div>
        <CardDescription className="text-red-800">
          {errorInfo.message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorInfo.details && errorInfo.details.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-red-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              What this means:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800 ml-6">
              {errorInfo.details.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {errorInfo.solutions && errorInfo.solutions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              How to fix it:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800 ml-6">
              {errorInfo.solutions.map((solution, idx) => (
                <li key={idx}>{solution}</li>
              ))}
            </ul>
          </div>
        )}

        {errorInfo.technical_details && (
          <details className="mt-4">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto text-gray-700">
              {errorInfo.technical_details}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

