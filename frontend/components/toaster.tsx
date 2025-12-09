"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Toast, ToastProps } from "@/components/ui/toast";

interface ToastContextType {
  toast: (props: Omit<ToastProps, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  loading: (message: string, title?: string) => string; // Returns ID for dismissing
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const toast: ToastProps = {
      ...props,
      id,
      duration: props.duration ?? 5000,
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration && toast.duration > 0 && props.variant !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "error", duration: 7000 });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "info" });
    },
    [addToast]
  );

  const loading = useCallback(
    (message: string, title?: string) => {
      return addToast({ description: message, title, variant: "loading", duration: 0 });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, loading, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

