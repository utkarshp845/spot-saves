"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";

interface HeroSavingsProps {
  totalSavingsAnnual: number;
  totalSavingsMonthly: number;
}

export function HeroSavings({ totalSavingsAnnual, totalSavingsMonthly }: HeroSavingsProps) {
  return (
    <Card className="group relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 border-0 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-green-500/50 hover:scale-[1.02]">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-white/10 to-green-400/0 animate-[shimmer_3s_ease-in-out_infinite]" />
      
      {/* Sparkle effects */}
      <Sparkles className="absolute top-4 right-4 h-8 w-8 text-white/30 animate-pulse" />
      <Sparkles className="absolute bottom-4 left-4 h-6 w-6 text-white/20 animate-pulse delay-75" />
      
      <CardContent className="relative p-8 md:p-12 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold opacity-95">Total Potential Savings</h2>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <AnimatedNumber
                value={totalSavingsAnnual}
                duration={2000}
                decimals={0}
                prefix="$"
                className="text-5xl md:text-7xl font-extrabold tracking-tight"
              />
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-emerald-200 animate-bounce" />
            </div>
            
            <p className="text-lg md:text-xl opacity-90 font-medium">
              <AnimatedNumber
                value={totalSavingsMonthly}
                duration={2000}
                decimals={0}
                prefix="$"
              />{" "}
              per month
            </p>
            
            <div className="mt-4 flex items-center gap-2 text-sm opacity-75">
              <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse" />
              <span>Calculated from latest scan</span>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
            <div className="text-3xl md:text-5xl font-bold opacity-20 mb-2">Annual</div>
            <div className="text-sm opacity-60 uppercase tracking-wider">Potential Savings</div>
          </div>
        </div>
      </CardContent>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Card>
  );
}

