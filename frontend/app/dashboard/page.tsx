"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSavings } from "@/components/hero-savings";
import { SavingsTable } from "@/components/savings-table";
import { Loader2, Download, RefreshCw, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DashboardData {
  total_potential_savings_annual: number;
  total_potential_savings_monthly: number;
  opportunities_by_type: Record<string, { count: number; total_savings_annual: number }>;
  opportunities: any[];
  last_scan_at: string | null;
  account_id: number | null;
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

      // If scan is in progress, poll for updates
      if (scanId && dashboardData.opportunities.length === 0) {
        setPolling(true);
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
      alert("No scan data available to export");
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
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboard();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
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
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            SpotSave
          </Link>
          <div className="flex gap-4">
            <Link href="/scan">
              <Button variant="ghost">New Scan</Button>
            </Link>
            {data && (
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
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

        {polling && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-800">
                  Scan in progress... This page will update automatically when complete.
                </span>
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
