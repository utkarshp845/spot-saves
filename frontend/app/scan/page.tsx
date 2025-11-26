"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/error-display";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    role_arn: "",
    external_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, create/update the account
      const accountResponse = await fetch(`${API_URL}/api/accounts`, {
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

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json();
        throw new Error(errorData.detail || "Failed to create account");
      }

      const account = await accountResponse.json();

      // Trigger the scan
      const scanResponse = await fetch(`${API_URL}/api/scan`, {
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
        const errorData = await scanResponse.json();
        throw new Error(errorData.detail || "Failed to start scan");
      }

      const scan = await scanResponse.json();

      // Redirect to dashboard with account ID
      router.push(`/dashboard?account_id=${account.id}&scan_id=${scan.scan_id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            SpotSave
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
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
                  onChange={(e) =>
                    setFormData({ ...formData, role_arn: e.target.value })
                  }
                />
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

