"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

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
  details?: string;
}

interface SavingsTableProps {
  opportunities: SavingsOpportunity[];
}

export function SavingsTable({ opportunities }: SavingsTableProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Opportunities</CardTitle>
        <CardDescription>
          {opportunities.length} opportunity(ies) found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Current Cost</TableHead>
                <TableHead>Savings/Month</TableHead>
                <TableHead>Savings/Year</TableHead>
                <TableHead>% Savings</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp, index) => (
                <TableRow 
                  key={opp.id} 
                  className="group hover:bg-green-50/50 transition-colors duration-200 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <Badge 
                      variant={getOpportunityTypeVariant(opp.opportunity_type)}
                      className="group-hover:scale-105 transition-transform duration-200"
                    >
                      {getOpportunityTypeLabel(opp.opportunity_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {opp.resource_id}
                  </TableCell>
                  <TableCell className="font-medium">{opp.region}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(opp.current_cost_monthly)}</TableCell>
                  <TableCell className="text-green-600 font-bold group-hover:text-green-700 transition-colors">
                    {formatCurrency(opp.potential_savings_monthly)}
                  </TableCell>
                  <TableCell className="text-green-600 font-bold group-hover:text-green-700 transition-colors">
                    {formatCurrency(opp.potential_savings_annual)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-emerald-600">
                      {opp.savings_percentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md text-sm text-gray-700">
                    {opp.recommendation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

