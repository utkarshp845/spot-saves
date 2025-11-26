"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSavings } from "@/components/hero-savings";
import { SavingsTable } from "@/components/savings-table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ArrowLeft, Play } from "lucide-react";

// Demo data to show what results look like
const DEMO_DATA = {
  total_potential_savings_annual: 124500.00,
  total_potential_savings_monthly: 10375.00,
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
    },
  ],
};

export default function DemoPage() {
  const savingsData = Object.entries(DEMO_DATA.opportunities_by_type).map(([type, info]) => ({
    name: type === "ri_sp" ? "RI/SP" : type.charAt(0).toUpperCase() + type.slice(1),
    value: info.total_savings_annual,
    count: info.count,
  }));

  const COLORS = ["#10b981", "#059669", "#047857", "#065f46"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            SpotSave
          </Link>
          <div className="flex gap-4">
            <Link href="/onboarding">
              <Button className="bg-green-600 hover:bg-green-700">
                Connect Your AWS Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            DEMO MODE - Sample Results
          </div>
          <h2 className="text-3xl font-bold mb-2">See What SpotSave Finds</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This is a preview of what your cost savings dashboard will look like. 
            Connect your AWS account to see your actual savings opportunities.
          </p>
        </div>

        <div className="mb-8">
          <HeroSavings
            totalSavingsAnnual={DEMO_DATA.total_potential_savings_annual}
            totalSavingsMonthly={DEMO_DATA.total_potential_savings_monthly}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Savings by Category</CardTitle>
              <CardDescription>Annual savings breakdown</CardDescription>
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
                    outerRadius={80}
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

          <Card>
            <CardHeader>
              <CardTitle>Ready to See Your Savings?</CardTitle>
              <CardDescription>Connect your AWS account to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/onboarding" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Connect AWS Account
                </Button>
              </Link>
              <p className="text-sm text-gray-600">
                Our quick setup wizard guides you through connecting your AWS account in just 2 minutes. 
                No technical knowledge required!
              </p>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  <strong>Demo Data:</strong> This dashboard shows sample results from a typical AWS account.
                  Your actual results will vary based on your infrastructure.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <SavingsTable opportunities={DEMO_DATA.opportunities} />

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

