"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle2, Zap, Copy, ExternalLink } from "lucide-react";

interface SavingsOpportunity {
  id: number;
  opportunity_type: string;
  resource_id: string;
  resource_type: string;
  region: string;
  current_cost_monthly: number;
  potential_savings_monthly: number;
  potential_savings_annual: number;
  savings_percentage: number;
  recommendation: string;
  action_steps?: string | null;
  implementation_time_hours?: number | null;
  risk_level?: string | null;
  prerequisites?: string | null;
  expected_savings_timeline?: string | null;
  rollback_plan?: string | null;
  details?: string | null;
}

interface SavingsTableProps {
  opportunities: SavingsOpportunity[];
}

type FilterType = "all" | "quick-wins" | "high-impact" | "low-risk" | "ri_sp" | "rightsizing" | "idle" | "graviton";

export function SavingsTable({ opportunities }: SavingsTableProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"annual" | "monthly" | "percentage">("annual");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getOpportunityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ri_sp: "RI/SP",
      rightsizing: "Rightsizing",
      idle: "Idle",
      graviton: "Graviton",
    };
    return labels[type] || type;
  };

  const getOpportunityTypeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      ri_sp: "default",
      rightsizing: "secondary",
      idle: "outline",
      graviton: "default",
    };
    return variants[type] || "default";
  };

  const getRiskBadge = (riskLevel: string | null | undefined) => {
    if (!riskLevel) return null;
    
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-700 border-green-300",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      high: "bg-red-100 text-red-700 border-red-300",
    };
    
    return (
      <Badge className={colors[riskLevel] || "bg-gray-100 text-gray-700"}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </Badge>
    );
  };

  const isQuickWin = (opp: SavingsOpportunity) => {
    return (
      opp.potential_savings_monthly >= 100 &&
      (opp.implementation_time_hours || 0) <= 1 &&
      opp.risk_level === "low"
    );
  };

  const isHighImpact = (opp: SavingsOpportunity) => {
    return opp.potential_savings_annual >= 10000;
  };

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    // Apply filter
    switch (filter) {
      case "quick-wins":
        filtered = filtered.filter(isQuickWin);
        break;
      case "high-impact":
        filtered = filtered.filter(isHighImpact);
        break;
      case "low-risk":
        filtered = filtered.filter((opp) => opp.risk_level === "low");
        break;
      case "ri_sp":
      case "rightsizing":
      case "idle":
      case "graviton":
        filtered = filtered.filter((opp) => opp.opportunity_type === filter);
        break;
      default:
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "annual":
          return b.potential_savings_annual - a.potential_savings_annual;
        case "monthly":
          return b.potential_savings_monthly - a.potential_savings_monthly;
        case "percentage":
          return b.savings_percentage - a.savings_percentage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [opportunities, filter, sortBy]);

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const parseJSONSafely = (jsonStr: string | null | undefined): any => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getAWSConsoleUrl = (details: string | null | undefined): string | null => {
    if (!details) return null;
    const parsed = parseJSONSafely(details);
    return parsed?.aws_console_url || null;
  };

  if (opportunities.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
              <TrendingUp className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900">No Savings Opportunities Found Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Run a scan to discover cost optimization opportunities in your AWS account.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filterButtons: { label: string; value: FilterType; icon?: React.ReactNode }[] = [
    { label: "All", value: "all" },
    { label: "Quick Wins", value: "quick-wins", icon: <Zap className="h-3 w-3" /> },
    { label: "High Impact", value: "high-impact", icon: <TrendingUp className="h-3 w-3" /> },
    { label: "Low Risk", value: "low-risk", icon: <CheckCircle2 className="h-3 w-3" /> },
    { label: "RI/SP", value: "ri_sp" },
    { label: "Rightsizing", value: "rightsizing" },
    { label: "Idle", value: "idle" },
    { label: "Graviton", value: "graviton" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Savings Opportunities</CardTitle>
            <CardDescription>
              {filteredOpportunities.length} of {opportunities.length} opportunity(ies) shown
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "annual" | "monthly" | "percentage")}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              <option value="annual">Sort: Annual Savings</option>
              <option value="monthly">Sort: Monthly Savings</option>
              <option value="percentage">Sort: % Savings</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={filter === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(btn.value)}
              className={filter === btn.value ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {btn.icon && <span className="mr-1">{btn.icon}</span>}
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Annual Savings</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.map((opp, index) => {
                const isExpanded = expandedRows.has(opp.id);
                const actionSteps = parseJSONSafely(opp.action_steps);
                const awsConsoleUrl = getAWSConsoleUrl(opp.details);
                const isQuickWinOpp = isQuickWin(opp);
                const isHighImpactOpp = isHighImpact(opp);

                return (
                  <>
                    <TableRow
                      key={opp.id}
                      className="group hover:bg-green-50/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => toggleRow(opp.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getOpportunityTypeVariant(opp.opportunity_type)}>
                            {getOpportunityTypeLabel(opp.opportunity_type)}
                          </Badge>
                          {isQuickWinOpp && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                              <Zap className="h-3 w-3 mr-1" />
                              Quick Win
                            </Badge>
                          )}
                          {isHighImpactOpp && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              High Impact
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={opp.resource_id}>
                        {opp.resource_id}
                      </TableCell>
                      <TableCell className="font-medium">{opp.region}</TableCell>
                      <TableCell className="text-green-600 font-bold">
                        {formatCurrency(opp.potential_savings_annual)}
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(opp.risk_level)}
                      </TableCell>
                      <TableCell>
                        {opp.implementation_time_hours ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {opp.implementation_time_hours}h
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md text-sm text-gray-700">
                        {opp.recommendation}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${opp.id}-details`} className="bg-gray-50/50">
                        <TableCell colSpan={8} className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Action Steps */}
                            {actionSteps && Array.isArray(actionSteps) && actionSteps.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  Implementation Steps
                                </h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                                  {actionSteps.map((step: string, idx: number) => (
                                    <li key={idx}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Additional Info */}
                            <div className="space-y-3">
                              {opp.prerequisites && (
                                <div>
                                  <h4 className="font-semibold mb-1 text-sm">Prerequisites:</h4>
                                  <p className="text-sm text-gray-600">
                                    {typeof opp.prerequisites === 'string' 
                                      ? JSON.parse(opp.prerequisites || '[]').join(', ')
                                      : opp.prerequisites}
                                  </p>
                                </div>
                              )}
                              {opp.expected_savings_timeline && (
                                <div>
                                  <h4 className="font-semibold mb-1 text-sm">Savings Start:</h4>
                                  <p className="text-sm text-gray-600">{opp.expected_savings_timeline}</p>
                                </div>
                              )}
                              {opp.rollback_plan && (
                                <div>
                                  <h4 className="font-semibold mb-1 text-sm">Rollback Plan:</h4>
                                  <p className="text-sm text-gray-600">{opp.rollback_plan}</p>
                                </div>
                              )}
                              {awsConsoleUrl && (
                                <div>
                                  <a
                                    href={awsConsoleUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Open in AWS Console
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Cost Breakdown */}
                          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Current Monthly Cost</p>
                                <p className="font-semibold text-lg">{formatCurrency(opp.current_cost_monthly)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Monthly Savings</p>
                                <p className="font-semibold text-lg text-green-600">
                                  {formatCurrency(opp.potential_savings_monthly)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Savings Percentage</p>
                                <p className="font-semibold text-lg text-emerald-600">
                                  {opp.savings_percentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
