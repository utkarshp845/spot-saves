"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  title?: string;
  description: string;
  variant?: "default" | "success" | "error" | "info" | "loading";
  duration?: number;
  onClose?: () => void;
}

const ToastComponent: React.FC<ToastProps & { onClose: () => void }> = ({
  title,
  description,
  variant = "default",
  onClose,
}) => {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    loading: Loader2,
    default: Info,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
    loading: "bg-blue-50 border-blue-200 text-blue-900",
    default: "bg-gray-50 border-gray-200 text-gray-900",
  };

  const Icon = icons[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-xl max-w-md animate-slide-in",
        colors[variant]
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 mt-0.5 flex-shrink-0",
          variant === "loading" && "animate-spin"
        )}
      />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1">{title}</p>
        )}
        <p className="text-sm">{description}</p>
      </div>
      {variant !== "loading" && (
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export function Toast({ ...props }: ToastProps) {
  return <ToastComponent {...props} onClose={props.onClose || (() => {})} />;
}

