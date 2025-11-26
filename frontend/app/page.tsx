"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Zap, Shield, TrendingDown } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-green-600">SpotSave</div>
          <nav className="flex gap-4">
            <Link href="/scan">
              <Button variant="ghost">Quick Scan</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Find 20-50% AWS Cost Savings in 2 Minutes
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Read-only AWS waste scanner that finds hidden savings opportunities.
          No upfront costs - we only charge after showing results.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/onboarding">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
              Get Started Free
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Try Demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          No AWS account? <Link href="/demo" className="text-blue-600 underline">See what results look like</Link>
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>20-50% Savings</CardTitle>
              <CardDescription>
                Discover significant cost reduction opportunities across your AWS infrastructure
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Read-Only Access</CardTitle>
              <CardDescription>
                Secure, read-only scanning. We never modify or delete your resources
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Results-First Pricing</CardTitle>
              <CardDescription>
                Only pay after we find savings. No upfront costs or commitments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingDown className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Comprehensive Analysis</CardTitle>
              <CardDescription>
                RI/SP opportunities, rightsizing, idle resources, and Graviton migration
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-slate-100 rounded-lg mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Connect AWS Account (2 Minutes)</h3>
            <p className="text-gray-600">
              Use our quick setup wizard - no command line needed! Choose CloudFormation, CloudShell, or Terraform.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Run Scan</h3>
            <p className="text-gray-600">
              Our scanner analyzes your AWS resources for cost optimization opportunities.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Review Savings</h3>
            <p className="text-gray-600">
              Get detailed recommendations with potential savings and export results.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 SpotSave. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

