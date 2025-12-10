"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/error-display";
import { useToast } from "@/components/toaster";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

// Always use relative URLs - Next.js rewrites will proxy to backend
// This works in both development and production
const API_URL = '';

// Extract AWS Account ID from Role ARN
function extractAWSAccountId(roleArn: string): string | null {
  const match = roleArn.match(/arn:aws:iam::(\d{12}):role\//);
  return match ? match[1] : null;
}

export default function ScanPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedAccountId, setExtractedAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    role_arn: "",
    external_id: "",
  });

  // Load form data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("spotsave_scan_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        // Extract account ID if Role ARN is present
        if (parsed.role_arn) {
          const accountId = extractAWSAccountId(parsed.role_arn);
          setExtractedAccountId(accountId);
        }
      } catch (e) {
        console.error("Failed to load saved form data:", e);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formData.role_arn || formData.external_id) {
      localStorage.setItem("spotsave_scan_form", JSON.stringify(formData));
    }
  }, [formData]);

  // Extract account ID when Role ARN changes
  const handleRoleArnChange = (value: string) => {
    setFormData({ ...formData, role_arn: value });
    const accountId = extractAWSAccountId(value);
    setExtractedAccountId(accountId);
    
    // Auto-fill account name if empty and account ID is extracted
    if (accountId && !formData.account_name) {
      setFormData(prev => ({ ...prev, role_arn: value, account_name: `AWS Account ${accountId}` }));
    }
  };

  // Helper function to safely parse JSON from response
  const safeJsonParse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    
    console.log("Response details:", {
      status: response.status,
      statusText: response.statusText,
      contentType,
      url: response.url,
      textPreview: text.substring(0, 200)
    });
    
    if (!text) {
      throw new Error(`Empty response from server (${response.status} ${response.statusText})`);
    }
    
    if (contentType && contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("JSON parse error:", e, "Text:", text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
    }
    
    // Not JSON, return the text as error
    console.error("Non-JSON response:", text);
    throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use relative URL - Next.js rewrites will proxy to backend
      const apiEndpoint = '/api/accounts';
      console.log("Making request to:", apiEndpoint);
      console.log("Request body:", {
        account_name: formData.account_name || "One-time Scan",
        role_arn: formData.role_arn,
        external_id: formData.external_id ? "***" : "",
      });
      
      // First, create/update the account
      const accountResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_name: formData.account_name || "One-time Scan",
          role_arn: formData.role_arn,
          external_id: formData.external_id,
        }),
      });
      
      console.log("Account response status:", accountResponse.status, accountResponse.statusText);

      if (!accountResponse.ok) {
        const errorData = await safeJsonParse(accountResponse);
        throw new Error(errorData.detail || errorData.message || `Failed to create account (${accountResponse.status})`);
      }

      const account = await safeJsonParse(accountResponse);
      console.log("Account created:", account);

      // Trigger the scan
      const scanEndpoint = '/api/scan';
      console.log("Making scan request to:", scanEndpoint);
      const scanResponse = await fetch(scanEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: account.id,
          scan_type: "full",
        }),
      });

      if (!scanResponse.ok) {
        const errorData = await safeJsonParse(scanResponse);
        throw new Error(errorData.detail || errorData.message || `Failed to start scan (${scanResponse.status})`);
      }

      const scan = await safeJsonParse(scanResponse);

      toast.success("Scan started successfully!", "Scan Initiated");
      
      // Clear saved form data after successful scan
      localStorage.removeItem("spotsave_scan_form");
      
      // Small delay for toast to show
      setTimeout(() => {
        router.push(`/dashboard?account_id=${account.id}&scan_id=${scan.scan_id}`);
      }, 500);
    } catch (err: any) {
      console.error("Scan error:", err);
      const errorMessage = err.message || "An error occurred while starting the scan";
      setError(errorMessage);
      toast.error(errorMessage, "Scan Failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200">
            SpotSave
          </Link>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700 transition-colors">Dashboard</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700 transition-colors">Setup Wizard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Start AWS Cost Scan</CardTitle>
            <CardDescription>
              Enter your AWS connection details to begin scanning for cost savings opportunities.
              Don&apos;t have them? Use our{" "}
              <Link href="/onboarding" className="text-blue-600 underline">
                quick setup wizard
              </Link>{" "}
              to connect in 2 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name (Optional)</Label>
                <Input
                  id="account_name"
                  placeholder="My AWS Account"
                  value={formData.account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role_arn">
                  AWS Connection ID (Role ARN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="role_arn"
                  placeholder="arn:aws:iam::123456789012:role/SpotSaveRole"
                  required
                  value={formData.role_arn}
                  onChange={(e) => handleRoleArnChange(e.target.value)}
                  className={extractedAccountId ? "border-green-500 focus:border-green-600" : ""}
                />
                {extractedAccountId && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>AWS Account ID detected: <strong>{extractedAccountId}</strong></span>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  The IAM Role ARN from your AWS setup. Don&apos;t have one?{" "}
                  <Link href="/onboarding" className="text-blue-600 underline">
                    Use our quick setup wizard
                  </Link>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_id">
                  Security Token (External ID) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="external_id"
                  placeholder="unique-security-token-here"
                  required
                  value={formData.external_id}
                  onChange={(e) =>
                    setFormData({ ...formData, external_id: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500">
                  The security token from your AWS setup (keeps your account secure)
                </p>
              </div>

              {error && (
                <ErrorDisplay error={error} />
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Scan...
                  </>
                ) : (
                  "Start Scan"
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold mb-2">Don&apos;t have AWS credentials yet?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Use our quick setup wizard to connect your AWS account in 2 minutes - no command line needed!
              </p>
              <Link href="/onboarding">
                <Button variant="outline" className="w-full">
                  Launch Quick Setup Wizard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

