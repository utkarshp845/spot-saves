"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSavings } from "@/components/hero-savings";
import { SavingsTable } from "@/components/savings-table";
import { ScanProgress } from "@/components/scan-progress";
import { Loader2, Download, RefreshCw, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Get API URL - use environment variable if set, otherwise use relative URLs for rewrites
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  return typeof window !== 'undefined' ? '' : (envUrl || "http://localhost:8000");
};
const API_URL = getApiUrl();

interface DashboardData {
  total_potential_savings_annual: number;
  total_potential_savings_monthly: number;
  opportunities_by_type: Record<string, { count: number; total_savings_annual: number }>;
  opportunities: any[];
  last_scan_at: string | null;
  account_id: number | null;
  aws_account_id?: string | null;
  account_name?: string | null;
  total_current_cost_monthly?: number | null;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("account_id");
  const scanId = searchParams.get("scan_id");

  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const url = accountId
        ? `${API_URL}/api/dashboard?account_id=${accountId}`
        : `${API_URL}/api/dashboard`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const dashboardData = await response.json();
      setData(dashboardData);

      // Check scan status if we have a scan ID
      if (scanId) {
        try {
          const scanResponse = await fetch(`${API_URL}/api/scan/${scanId}`);
          if (scanResponse.ok) {
            const scanData = await scanResponse.json();
            setScanStatus(scanData.status);
            if (scanData.status === "running") {
              setPolling(false); // Use SSE instead
            } else {
              setPolling(false);
            }
          }
        } catch (err) {
          console.error("Failed to fetch scan status:", err);
        }
      } else {
        setPolling(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Poll for scan updates if scan is running
    let interval: NodeJS.Timeout | null = null;
    if (polling) {
      interval = setInterval(() => {
        fetchDashboard();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, scanId, polling]);

  const handleExport = async () => {
    if (!scanId) {
      console.error("No scan data available to export");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/dashboard/export/${scanId}`);
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const jsonData = await response.json();
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spotsave-scan-${scanId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(`Export failed: ${err.message}`);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboard();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              SpotSave
            </Link>
            <div className="flex gap-4">
              <Link href="/scan">
                <Button variant="ghost">New Scan</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/scan")}>Start New Scan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const savingsData = data
    ? Object.entries(data.opportunities_by_type).map(([type, info]) => ({
        name: type === "ri_sp" ? "RI/SP" : type.charAt(0).toUpperCase() + type.slice(1),
        value: info.total_savings_annual,
        count: info.count,
      }))
    : [];

  const COLORS = ["#10b981", "#059669", "#047857", "#065f46"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200">
              SpotSave
            </Link>
            {data && data.aws_account_id && (
              <p className="text-sm text-gray-600 mt-1">
                AWS Account: <span className="font-mono font-semibold">{data.aws_account_id}</span>
                {data.account_name && <span className="ml-2">({data.account_name})</span>}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/scan">
              <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700 transition-colors">New Scan</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700 transition-colors">Setup</Button>
            </Link>
            {data && (
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="hover:bg-green-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {scanId && scanStatus === "running" && (
          <div className="mb-6">
            <ScanProgress 
              scanId={parseInt(scanId)} 
              onComplete={() => {
                // Refresh dashboard when scan completes
                fetchDashboard();
                setScanStatus("completed");
              }}
            />
          </div>
        )}

        {scanStatus === "failed" && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span>Scan failed. Please try again or check your AWS connection.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className="mb-8">
              <HeroSavings
                totalSavingsAnnual={data.total_potential_savings_annual}
                totalSavingsMonthly={data.total_potential_savings_monthly}
              />
            </div>

            {/* Cost Breakdown Cards */}
            {data.total_current_cost_monthly && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-600 font-medium mb-1">Current Monthly Cost</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(data.total_current_cost_monthly)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-green-600 font-medium mb-1">Monthly Savings</p>
                    <p className="text-2xl font-bold text-green-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(data.total_potential_savings_monthly)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-emerald-600 font-medium mb-1">Savings %</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {data.total_current_cost_monthly > 0
                        ? (
                            (data.total_potential_savings_monthly / data.total_current_cost_monthly) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-purple-600 font-medium mb-1">After Optimization</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        (data.total_current_cost_monthly || 0) - data.total_potential_savings_monthly
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Savings by Category</CardTitle>
                  <CardDescription>Annual savings breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {savingsData.length > 0 ? (
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
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No savings data available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Export and manage your scan results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scanId && (
                    <Button
                      onClick={handleExport}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  )}
                  <Link href="/scan" className="block">
                    <Button className="w-full" variant="outline">
                      Run New Scan
                    </Button>
                  </Link>
                  {data.last_scan_at && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Last scan:{" "}
                        {new Date(data.last_scan_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <SavingsTable opportunities={data.opportunities} />
          </>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
