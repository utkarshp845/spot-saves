"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Sparkles } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  const Icon = icon || Search;

  return (
    <Card className="border-dashed border-2 hover:border-green-300 transition-colors duration-300">
      <CardContent className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
            {typeof Icon === "function" ? (
              <Icon className="h-12 w-12 text-green-600" />
            ) : (
              Icon
            )}
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
        {(actionLabel && actionHref) && (
          <Button
            asChild
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        )}
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

