"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface HeroSavingsProps {
  totalSavingsAnnual: number;
  totalSavingsMonthly: number;
}

export function HeroSavings({ totalSavingsAnnual, totalSavingsMonthly }: HeroSavingsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-xl">
      <CardContent className="p-12 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-8 w-8" />
              <h2 className="text-2xl font-semibold opacity-90">Total Potential Savings</h2>
            </div>
            <div className="text-6xl font-bold mb-2">
              {formatCurrency(totalSavingsAnnual)}
            </div>
            <p className="text-xl opacity-90">
              {formatCurrency(totalSavingsMonthly)} per month
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold opacity-75">Annual</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

