"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSavings } from "@/components/hero-savings";
import { SavingsTable } from "@/components/savings-table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeft, Play, TrendingUp, DollarSign, Zap, CheckCircle2, ArrowRight, Sparkles, Target, Clock, Shield, Rocket } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";

// Enhanced demo data with more impressive numbers
const DEMO_DATA = {
  total_potential_savings_annual: 124500.00,
  total_potential_savings_monthly: 10375.00,
  current_monthly_cost: 45000.00,
  opportunities_by_type: {
    ri_sp: { count: 8, total_savings_annual: 45000 },
    rightsizing: { count: 12, total_savings_annual: 36000 },
    idle: { count: 5, total_savings_annual: 24000 },
    graviton: { count: 15, total_savings_annual: 19500 },
  },
  opportunities: [
    {
      id: 1,
      opportunity_type: "ri_sp",
      resource_id: "i-0123456789abcdef0",
      resource_type: "ec2-instance",
      region: "us-east-1",
      current_cost_monthly: 1200.00,
      potential_savings_monthly: 420.00,
      potential_savings_annual: 5040.00,
      savings_percentage: 35.0,
      recommendation: "Purchase Reserved Instance for m5.xlarge in us-east-1. Save ~35% on compute costs.",
      action_steps: JSON.stringify([
        "Navigate to EC2 Reserved Instances console",
        "Select instance type: m5.xlarge",
        "Choose region: us-east-1",
        "Select 1-year term for maximum savings",
        "Review and complete purchase"
      ]),
      implementation_time_hours: 0.5,
      risk_level: "low",
      expected_savings_timeline: "immediate",
    },
    {
      id: 2,
      opportunity_type: "rightsizing",
      resource_id: "i-0987654321fedcba0",
      resource_type: "ec2-instance",
      region: "us-west-2",
      current_cost_monthly: 800.00,
      potential_savings_monthly: 320.00,
      potential_savings_annual: 3840.00,
      savings_percentage: 40.0,
      recommendation: "Downsize m5.large to m5.medium. Current utilization: CPU 15.2%, Memory 18.5%",
      action_steps: JSON.stringify([
        "Stop instance i-0987654321fedcba0",
        "Create AMI backup",
        "Launch new m5.medium instance from AMI",
        "Update DNS/load balancer",
        "Test and validate"
      ]),
      implementation_time_hours: 2.0,
      risk_level: "medium",
      expected_savings_timeline: "immediate",
    },
    {
      id: 3,
      opportunity_type: "idle",
      resource_id: "i-0abcdef1234567890",
      resource_type: "ec2-instance",
      region: "eu-west-1",
      current_cost_monthly: 600.00,
      potential_savings_monthly: 600.00,
      potential_savings_annual: 7200.00,
      savings_percentage: 100.0,
      recommendation: "Instance appears idle (CPU: 2.1%). Consider terminating or stopping during non-business hours.",
      action_steps: JSON.stringify([
        "Verify instance is truly idle",
        "Stop instance to test impact",
        "Monitor for 7 days",
        "If safe, terminate instance",
        "Update documentation"
      ]),
      implementation_time_hours: 1.0,
      risk_level: "medium",
      expected_savings_timeline: "immediate",
    },
    {
      id: 4,
      opportunity_type: "graviton",
      resource_id: "i-0555555555555555",
      resource_type: "ec2-instance",
      region: "us-east-1",
      current_cost_monthly: 500.00,
      potential_savings_monthly: 100.00,
      potential_savings_annual: 1200.00,
      savings_percentage: 20.0,
      recommendation: "Migrate c5.large to c7g.large (Graviton/ARM). Save ~20% with better price-performance.",
      action_steps: JSON.stringify([
        "Verify ARM64 compatibility",
        "Test in staging environment",
        "Launch new Graviton instance",
        "Perform blue-green deployment",
        "Monitor and validate"
      ]),
      implementation_time_hours: 4.0,
      risk_level: "medium",
      expected_savings_timeline: "1-month",
    },
  ],
};

export default function DemoPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [countUp, setCountUp] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setTimeout(() => setCountUp(true), 300);
  }, []);

  const savingsData = Object.entries(DEMO_DATA.opportunities_by_type).map(([type, info]) => ({
    name: type === "ri_sp" ? "RI/SP" : type.charAt(0).toUpperCase() + type.slice(1),
    value: info.total_savings_annual,
    count: info.count,
  }));

  const COLORS = ["#10b981", "#059669", "#047857", "#065f46"];

  const savingsPercentage = ((DEMO_DATA.total_potential_savings_annual / (DEMO_DATA.current_monthly_cost * 12)) * 100).toFixed(1);
  const monthlyAfterOptimization = DEMO_DATA.current_monthly_cost - DEMO_DATA.total_potential_savings_monthly;

  const barChartData = [
    { name: "Current Cost", value: DEMO_DATA.current_monthly_cost, color: "#ef4444" },
    { name: "After Optimization", value: monthlyAfterOptimization, color: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Epic Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-75" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Sparkle effects */}
        <Sparkles className="absolute top-20 right-20 h-12 w-12 text-white/30 animate-pulse" />
        <Sparkles className="absolute bottom-20 left-20 h-8 w-8 text-white/20 animate-pulse" style={{ animationDelay: "1s" }} />
        <Sparkles className="absolute top-40 left-1/4 h-6 w-6 text-white/25 animate-pulse" style={{ animationDelay: "0.5s" }} />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <header className="mb-12 flex justify-between items-center">
            <Link href="/" className="text-3xl font-bold text-white hover:text-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">
              SpotSave
            </Link>
            <Link href="/onboarding">
              <Button className="bg-white text-green-600 hover:bg-emerald-50 font-semibold text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600">
                <Rocket className="mr-2 h-5 w-5" />
                Get Your Free Scan
              </Button>
            </Link>
          </header>

          <div className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-white/30">
              <Zap className="h-5 w-5 animate-pulse" />
              <span className="font-semibold">LIVE DEMO - See Real Results</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Stop Wasting{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-400 bg-clip-text text-transparent animate-pulse">
                  $124,500
                </span>
                <Sparkles className="absolute -top-4 -right-8 h-8 w-8 text-yellow-300 animate-bounce" />
              </span>
              <br />
              Every Year
            </h1>

            <p className="text-xl md:text-2xl mb-12 text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              This AWS account is wasting <strong className="text-white">${DEMO_DATA.total_potential_savings_monthly.toLocaleString()}/month</strong>. 
              SpotSave found these savings in just 2 minutes.{" "}
              <span className="text-yellow-300 font-semibold">Your account could save even more.</span>
            </p>

            {/* Massive Savings Display */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-md border-white/30 text-white shadow-2xl">
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-yellow-300" />
                  <div className="text-4xl md:text-5xl font-extrabold mb-2">
                    {countUp ? (
                      <AnimatedNumber value={DEMO_DATA.total_potential_savings_annual} duration={2000} decimals={0} prefix="$" />
                    ) : (
                      "$0"
                    )}
                  </div>
                  <p className="text-emerald-200 font-medium">Annual Savings</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/30 text-white shadow-2xl">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-300" />
                  <div className="text-4xl md:text-5xl font-extrabold mb-2">
                    {savingsPercentage}%
                  </div>
                  <p className="text-emerald-200 font-medium">Cost Reduction</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/30 text-white shadow-2xl">
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <div className="text-4xl md:text-5xl font-extrabold mb-2">2 min</div>
                  <p className="text-emerald-200 font-medium">To Find These</p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 hover:from-yellow-500 hover:via-orange-500 hover:to-red-600 text-white font-bold text-xl px-12 py-8 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse">
                  <Target className="mr-3 h-6 w-6" />
                  Find YOUR Savings Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <p className="text-emerald-200 text-sm">100% Free • No Credit Card • Results in 2 Minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison Section */}
      <section className="container mx-auto px-4 py-16 -mt-8 relative z-10">
        <Card className="shadow-2xl border-2 border-green-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-3xl font-bold text-center">Before vs. After: Your Cost Transformation</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Before */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-600">Before SpotSave</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <p className="text-sm text-red-700 font-medium mb-1">Monthly AWS Bill</p>
                    <p className="text-3xl font-extrabold text-red-600">
                      ${DEMO_DATA.current_monthly_cost.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <p className="text-sm text-red-700 font-medium mb-1">Annual Cost</p>
                    <p className="text-3xl font-extrabold text-red-600">
                      ${(DEMO_DATA.current_monthly_cost * 12).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">Wasted on:</p>
                    <ul className="text-sm text-gray-700 mt-2 space-y-1">
                      <li>• Over-provisioned instances</li>
                      <li>• Idle resources running 24/7</li>
                      <li>• Missing Reserved Instances</li>
                      <li>• Inefficient instance types</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-600">After SpotSave</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">Monthly AWS Bill</p>
                    <p className="text-3xl font-extrabold text-green-600">
                      ${monthlyAfterOptimization.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Save ${DEMO_DATA.total_potential_savings_monthly.toLocaleString()}/month!</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">Annual Cost</p>
                    <p className="text-3xl font-extrabold text-green-600">
                      ${(monthlyAfterOptimization * 12).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Save ${DEMO_DATA.total_potential_savings_annual.toLocaleString()}/year!</p>
                  </div>
                  <div className="p-4 bg-emerald-100 rounded-lg border-2 border-emerald-300">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-800">Optimized Resources</p>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✓ Right-sized instances</li>
                      <li>✓ Reserved Instances applied</li>
                      <li>✓ Idle resources eliminated</li>
                      <li>✓ Best-price instance types</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-8 pt-8 border-t">
              <h4 className="text-xl font-bold mb-6 text-center">Cost Comparison Visualization</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    labelStyle={{ color: '#1f2937' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Dashboard Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Your Complete Savings Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every opportunity explained with step-by-step guides. No guesswork, just results.
          </p>
        </div>

        {/* Hero Savings Card */}
        <div className="mb-8">
          <HeroSavings
            totalSavingsAnnual={DEMO_DATA.total_potential_savings_annual}
            totalSavingsMonthly={DEMO_DATA.total_potential_savings_monthly}
          />
        </div>

        {/* Cost Breakdown Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-600 font-medium mb-1">Current Monthly Cost</p>
              <p className="text-2xl font-bold text-blue-900">
                ${DEMO_DATA.current_monthly_cost.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-green-600 font-medium mb-1">Monthly Savings</p>
              <p className="text-2xl font-bold text-green-900">
                ${DEMO_DATA.total_potential_savings_monthly.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-emerald-600 font-medium mb-1">Savings %</p>
              <p className="text-2xl font-bold text-emerald-900">
                {savingsPercentage}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-purple-600 font-medium mb-1">After Optimization</p>
              <p className="text-2xl font-bold text-purple-900">
                ${monthlyAfterOptimization.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Savings by Category</CardTitle>
              <CardDescription>Where your savings come from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={savingsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {savingsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(value)
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Save Money?</CardTitle>
              <CardDescription className="text-base">Get your personalized savings report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">2-Minute Setup</p>
                    <p className="text-sm text-gray-600">No technical knowledge needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">100% Read-Only</p>
                    <p className="text-sm text-gray-600">We never modify your resources</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Results in Minutes</p>
                    <p className="text-sm text-gray-600">See your savings immediately</p>
                  </div>
                </div>
              </div>

              <Link href="/onboarding" className="block">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6 shadow-xl hover:scale-105 transition-transform">
                  <Play className="mr-2 h-5 w-5" />
                  Start Your Free Scan Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 text-center">
                  <strong>Demo Data:</strong> This dashboard shows sample results. Your actual savings will be calculated from your AWS account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Savings Table */}
        <SavingsTable opportunities={DEMO_DATA.opportunities} />

        {/* Final CTA Section */}
        <Card className="mt-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto mb-6 text-yellow-300 animate-pulse" />
            <h3 className="text-3xl md:text-4xl font-extrabold mb-4">
              Don&apos;t Wait - Start Saving Today
            </h3>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of AWS users who&apos;ve discovered hidden savings. 
              Your free scan takes just 2 minutes and requires zero commitment.
            </p>
            <Link href="/onboarding">
              <Button className="bg-white text-green-600 hover:bg-emerald-50 font-bold text-xl px-12 py-8 rounded-full shadow-2xl hover:scale-110 transition-transform">
                <Rocket className="mr-3 h-6 w-6" />
                Get Your Free Savings Report
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <p className="text-emerald-200 text-sm mt-4">
              ✓ Free forever • ✓ No credit card • ✓ Results in 2 minutes
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
