"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Zap, Shield, TrendingDown } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded">
            SpotSave
          </Link>
          <nav className="flex gap-3">
            <Link href="/scan">
              <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700 transition-colors">
                Quick Scan
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center animate-in">
        <div className="inline-block mb-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold animate-slide-in">
          ✨ Trusted by AWS users worldwide
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent animate-slide-in">
          Find 20-50% AWS Cost Savings<br />in 2 Minutes
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-in">
          Read-only AWS waste scanner that finds hidden savings opportunities.
          <span className="block mt-2 font-semibold text-green-600">No upfront costs - we only charge after showing results.</span>
        </p>
        <div className="flex gap-4 justify-center flex-wrap animate-scale-in">
          <Link href="/onboarding">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-10 py-7 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white font-semibold">
              Get Started Free →
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 hover:bg-green-50 hover:border-green-600 transition-all duration-200 font-semibold">
              Try Demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          No AWS account? <Link href="/demo" className="text-blue-600 underline hover:text-blue-700 font-medium">See what results look like</Link>
        </p>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover group border-2 hover:border-green-200 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">20-50% Savings</CardTitle>
              <CardDescription className="text-base">
                Discover significant cost reduction opportunities across your AWS infrastructure
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="card-hover group border-2 hover:border-green-200 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">Read-Only Access</CardTitle>
              <CardDescription className="text-base">
                Secure, read-only scanning. We never modify or delete your resources
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover group border-2 hover:border-green-200 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">Results-First Pricing</CardTitle>
              <CardDescription className="text-base">
                Only pay after we find savings. No upfront costs or commitments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover group border-2 hover:border-green-200 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">Comprehensive Analysis</CardTitle>
              <CardDescription className="text-base">
                RI/SP opportunities, rightsizing, idle resources, and Graviton migration
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl mb-16 border border-emerald-100 shadow-lg">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center group p-6 rounded-xl hover:bg-white/60 transition-all duration-300 hover:shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full text-2xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Connect AWS Account (2 Minutes)</h3>
            <p className="text-gray-600 leading-relaxed">
              Use our quick setup wizard - no command line needed! Choose CloudFormation, CloudShell, or Terraform.
            </p>
          </div>
          <div className="text-center group p-6 rounded-xl hover:bg-white/60 transition-all duration-300 hover:shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full text-2xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Run Scan</h3>
            <p className="text-gray-600 leading-relaxed">
              Our scanner analyzes your AWS resources for cost optimization opportunities in real-time.
            </p>
          </div>
          <div className="text-center group p-6 rounded-xl hover:bg-white/60 transition-all duration-300 hover:shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full text-2xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Review Savings</h3>
            <p className="text-gray-600 leading-relaxed">
              Get detailed recommendations with potential savings and export results to share with your team.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-green-600 mb-4">SpotSave</h3>
              <p className="text-sm text-gray-600">
                Find hidden AWS cost savings opportunities in minutes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/demo" className="hover:text-green-600 transition-colors">View Demo</Link></li>
                <li><Link href="/scan" className="hover:text-green-600 transition-colors">Quick Scan</Link></li>
                <li><Link href="/onboarding" className="hover:text-green-600 transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Reserved Instances</li>
                <li>Rightsizing</li>
                <li>Idle Resources</li>
                <li>Graviton Migration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Read-Only Scanning</li>
                <li>Results-First Pricing</li>
                <li>2-Minute Setup</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 SpotSave. All rights reserved. Built with ❤️ for cost-conscious AWS users.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

