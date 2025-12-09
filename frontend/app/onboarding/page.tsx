"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Cloud, Terminal, FileText, Copy, Check } from "lucide-react";

const CLOUDFORMATION_TEMPLATE_URL = "https://raw.githubusercontent.com/utkarshp845/spot-saves/main/cloudformation/spotsave-role.yaml";

type SetupMethod = "cloudformation" | "cloudshell" | "manual";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [setupMethod, setSetupMethod] = useState<SetupMethod | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [spotsaveAccountId, setSpotsaveAccountId] = useState<string>("");

  const handleMethodSelect = (method: SetupMethod) => {
    setSetupMethod(method);
    setStep(2);
  };

  const handleCopy = (text: string, id: string) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Choose Your Setup Method</h2>
              <p className="text-gray-600">Select the easiest way to connect your AWS account</p>
            </div>

            <RadioGroup value={setupMethod || undefined} className="space-y-4">
              <Card 
                className="cursor-pointer hover:border-green-500 transition-colors"
                onClick={() => handleMethodSelect("cloudformation")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Cloud className="h-8 w-8 text-blue-600" />
                      <div>
                        <CardTitle>CloudFormation (Recommended)</CardTitle>
                        <CardDescription>One-click setup in AWS Console - No command line needed!</CardDescription>
                      </div>
                    </div>
                    <RadioGroupItem value="cloudformation" id="cloudformation" className="mt-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2 ml-11">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Takes 2 minutes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>No technical knowledge required</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>All done in AWS Console</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-green-500 transition-colors"
                onClick={() => handleMethodSelect("cloudshell")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Terminal className="h-8 w-8 text-orange-600" />
                      <div>
                        <CardTitle>AWS CloudShell</CardTitle>
                        <CardDescription>Paste a script into AWS CloudShell - Instant setup!</CardDescription>
                      </div>
                    </div>
                    <RadioGroupItem value="cloudshell" id="cloudshell" className="mt-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2 ml-11">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>No local tools needed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Works in your browser</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Fully automated</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-green-500 transition-colors"
                onClick={() => handleMethodSelect("manual")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-gray-600" />
                      <div>
                        <CardTitle>Terraform / Manual Setup</CardTitle>
                        <CardDescription>For users who prefer Terraform or manual IAM setup</CardDescription>
                      </div>
                    </div>
                    <RadioGroupItem value="manual" id="manual" className="mt-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2 ml-11">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Full control</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Version controlled</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>For advanced users</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>
        );

      case 2:
        if (setupMethod === "cloudformation") {
          return renderCloudFormationInstructions();
        } else if (setupMethod === "cloudshell") {
          return renderCloudShellInstructions();
        } else {
          return renderManualInstructions();
        }

      case 3:
        return renderCredentialsCapture();
    }
  };

  const renderCloudFormationInstructions = () => {
    // Only add account ID to URL if it's set (otherwise user will need to enter it manually in CloudFormation)
    const accountIdParam = spotsaveAccountId ? `&param_SpotSaveAccountId=${spotsaveAccountId}` : '';
    const cloudformationUrl = `https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=${encodeURIComponent(CLOUDFORMATION_TEMPLATE_URL)}${accountIdParam}`;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">CloudFormation Setup</h2>
          <p className="text-gray-600">We&apos;ll guide you through creating the IAM role</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Download Template & Open CloudFormation</CardTitle>
            <CardDescription>Download the template file and upload it to CloudFormation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  try {
                    const response = await fetch(CLOUDFORMATION_TEMPLATE_URL);
                    const yamlContent = await response.text();
                    const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'spotsave-role.yaml';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Failed to download template:', error);
                    // Error is logged, user can retry
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Template File
              </Button>
              
              <a 
                href="https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <Cloud className="mr-2 h-4 w-4" />
                  Open CloudFormation Console
                </Button>
              </a>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-900 font-semibold mb-2">Simple Instructions:</p>
              <ol className="text-sm text-green-800 list-decimal list-inside space-y-1">
                <li>Click &quot;Download Template File&quot; above (downloads spotsave-role.yaml)</li>
                <li>Click &quot;Open CloudFormation Console&quot; above</li>
                <li>Select &quot;Template is ready&quot; → &quot;Upload a template file&quot;</li>
                <li>Choose the downloaded spotsave-role.yaml file</li>
                <li>Click &quot;Next&quot; to continue</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Stack Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="account-id">SpotSave Account ID:</Label>
              <p className="text-sm text-gray-600 mb-2">
                Enter your SpotSave service account ID (provided by SpotSave)
              </p>
              <div className="flex gap-2">
                <Input
                  id="account-id"
                  value={spotsaveAccountId}
                  onChange={(e) => setSpotsaveAccountId(e.target.value)}
                  placeholder="Enter your SpotSave Account ID"
                  className="font-mono text-sm"
                />
                {spotsaveAccountId && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(spotsaveAccountId);
                      handleCopy("", "account-id");
                    }}
                  >
                    {copied === "account-id" ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Enter the Stack name (e.g., &quot;SpotSaveRole&quot;)</li>
              <li>Enter the SpotSave Account ID: {spotsaveAccountId ? (
                <code className="bg-gray-100 px-1 rounded">{spotsaveAccountId}</code>
              ) : (
                <span className="text-gray-500 italic">(Enter above)</span>
              )}</li>
              <li>External ID: Leave empty (it will be auto-generated) or enter a custom value</li>
              <li>Scroll down and check &quot;I acknowledge that AWS CloudFormation might create IAM resources&quot;</li>
              <li>Click <strong>&quot;Submit&quot;</strong> or <strong>&quot;Create stack&quot;</strong></li>
              <li>Wait 1-2 minutes for the stack to create</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Get Your Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Once the stack shows <strong>&quot;CREATE_COMPLETE&quot;</strong>, click on it</li>
              <li>Go to the <strong>&quot;Outputs&quot;</strong> tab</li>
              <li>Copy the <strong>RoleArn</strong> and <strong>ExternalId</strong> values</li>
              <li>Come back here and click &quot;Next&quot; to enter them</li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setStep(3)}>
            Next: Enter Credentials
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderCloudShellInstructions = () => {
    const scriptUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/cloudformation/cloudshell-setup.sh`;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">AWS CloudShell Setup</h2>
          <p className="text-gray-600">Paste this script into AWS CloudShell</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Your SpotSave Account ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="account-id-cloudshell">SpotSave Account ID:</Label>
              <p className="text-sm text-gray-600 mb-2">
                Enter your SpotSave service account ID (provided by SpotSave)
              </p>
              <Input
                id="account-id-cloudshell"
                value={spotsaveAccountId}
                onChange={(e) => setSpotsaveAccountId(e.target.value)}
                placeholder="Enter your SpotSave Account ID"
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Open AWS CloudShell</CardTitle>
          </CardHeader>
          <CardContent>
            <a 
              href="https://console.aws.amazon.com/cloudshell/home"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full">
                <Terminal className="mr-2 h-4 w-4" />
                Open AWS CloudShell
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Copy and Run This Script</CardTitle>
            <CardDescription>Click the copy button, then paste into CloudShell</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`#!/bin/bash
# SpotSave Quick Setup - Paste this in CloudShell
${spotsaveAccountId ? '' : '# IMPORTANT: Replace YOUR_SPOTSAVE_ACCOUNT_ID with your actual account ID from SpotSave dashboard\n' +
'# Get this from your SpotSave dashboard or contact SpotSave support\n'}
EXTERNAL_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
SPOTSAVE_ACCOUNT_ID="${spotsaveAccountId || "YOUR_SPOTSAVE_ACCOUNT_ID"}"
ROLE_NAME="SpotSaveRole"

# Create trust policy
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::${spotsaveAccountId || "YOUR_SPOTSAVE_ACCOUNT_ID"}:root"},
    "Action": "sts:AssumeRole",
    "Condition": {"StringEquals": {"sts:ExternalId": "$EXTERNAL_ID"}}}
  }]
}
EOF
)

echo "Creating IAM Role..."
aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST_POLICY"

echo "Attaching policies..."
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/job-function/Billing"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AWSPriceListServiceFullAccess"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AWSLambda_ReadOnlyAccess"

# CloudWatch policy
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "SpotSaveCloudWatchRead" --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["cloudwatch:GetMetricStatistics","cloudwatch:ListMetrics","cloudwatch:GetMetricData","cloudwatch:DescribeAlarms"],"Resource":"*"}]}'

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo "✅ Setup Complete!"
echo "Role ARN: $ROLE_ARN"
echo "External ID: $EXTERNAL_ID"
echo ""
echo "Copy these values and use them in SpotSave!"`}
              </pre>
              <Button 
                variant="outline" 
                className="absolute top-2 right-2"
                onClick={async () => {
                  const script = `#!/bin/bash
# SpotSave Quick Setup - Paste this in CloudShell
${spotsaveAccountId ? '' : '# IMPORTANT: Replace YOUR_SPOTSAVE_ACCOUNT_ID with your actual account ID from SpotSave dashboard\n'}
EXTERNAL_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
SPOTSAVE_ACCOUNT_ID="${spotsaveAccountId || "YOUR_SPOTSAVE_ACCOUNT_ID"}"
ROLE_NAME="SpotSaveRole"

TRUST_POLICY='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::${spotsaveAccountId || "YOUR_SPOTSAVE_ACCOUNT_ID"}:root"},"Action":"sts:AssumeRole","Condition":{"StringEquals":{"sts:ExternalId":"$EXTERNAL_ID"}}}]}'

echo "Creating IAM Role..."
aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST_POLICY"

echo "Attaching policies..."
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/job-function/Billing"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AWSPriceListServiceFullAccess"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess"
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AWSLambda_ReadOnlyAccess"

aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "SpotSaveCloudWatchRead" --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["cloudwatch:GetMetricStatistics","cloudwatch:ListMetrics","cloudwatch:GetMetricData","cloudwatch:DescribeAlarms"],"Resource":"*"}]}'

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo "✅ Setup Complete!"
echo "Role ARN: $ROLE_ARN"
echo "External ID: $EXTERNAL_ID"
echo ""
echo "Copy these values and use them in SpotSave!"`;
                  await navigator.clipboard.writeText(script);
                  handleCopy("", "cloudshell");
                }}
              >
                {copied === "cloudshell" ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Script
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              After running the script, it will output your Role ARN and External ID. Copy those and click Next.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setStep(3)}>
            Next: Enter Credentials
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderManualInstructions = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Manual/Terraform Setup</h2>
          <p className="text-gray-600">Follow these steps for Terraform or manual IAM setup</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Enter Your SpotSave Account ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="account-id-terraform">SpotSave Account ID:</Label>
              <p className="text-sm text-gray-600 mb-2">
                Enter your SpotSave service account ID (provided by SpotSave)
              </p>
              <Input
                id="account-id-terraform"
                value={spotsaveAccountId}
                onChange={(e) => setSpotsaveAccountId(e.target.value)}
                placeholder="Enter your SpotSave Account ID"
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Option 1: Use Terraform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">2. Navigate to terraform directory:</p>
              <code className="block bg-gray-100 p-2 rounded text-sm">cd terraform-onboarding</code>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">3. Create terraform.tfvars:</p>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                {`spotsave_account_id = "${spotsaveAccountId || "YOUR_SPOTSAVE_ACCOUNT_ID"}"\nrole_name = "SpotSaveRole"`}
              </code>
              {!spotsaveAccountId && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Replace YOUR_SPOTSAVE_ACCOUNT_ID with your actual account ID from SpotSave dashboard
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">4. Run Terraform:</p>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                terraform init<br/>
                terraform apply
              </code>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">4. Copy outputs (Role ARN and External ID)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Option 2: Manual IAM Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              See <Link href="/terraform-onboarding/README.md" className="text-blue-600 underline">Terraform README</Link> for detailed manual setup instructions.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setStep(3)}>
            Next: Enter Credentials
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderCredentialsCapture = () => {
    return (
      <CredentialsFormComponent 
        onBack={() => setStep(2)}
        setupMethod={setupMethod || "manual"}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            SpotSave
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    s === step
                      ? "bg-green-600 text-white"
                      : s < step
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span className={step >= 1 ? "text-green-600 font-semibold" : ""}>Choose Method</span>
            <span className={step >= 2 ? "text-green-600 font-semibold" : ""}>Setup</span>
            <span className={step >= 3 ? "text-green-600 font-semibold" : ""}>Connect</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Credentials form component
function CredentialsFormComponent({ onBack, setupMethod }: { onBack: () => void; setupMethod: SetupMethod }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    role_arn: "",
    external_id: "",
  });

  // Get API URL - smart detection for production vs development
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('awsapprunner.com') || hostname.includes('spotsave.pandeylabs.com')) {
        return 'https://pqykjsmmab.us-east-1.awsapprunner.com';
      }
      return '';
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  };
  const API_URL = getApiUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const accountResponse = await fetch(`${API_URL}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: formData.account_name || "My AWS Account",
          role_arn: formData.role_arn,
          external_id: formData.external_id,
        }),
      });

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json();
        throw new Error(errorData.detail || "Failed to create account");
      }

      const account = await accountResponse.json();

      const scanResponse = await fetch(`${API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: account.id,
          scan_type: "full",
        }),
      });

      if (!scanResponse.ok) {
        throw new Error("Failed to start scan");
      }

      const scan = await scanResponse.json();
      router.push(`/dashboard?account_id=${account.id}&scan_id=${scan.scan_id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Enter Your AWS Connection Details</h2>
        <p className="text-gray-600">Paste the values from your setup</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="account_name">Account Name (Optional)</Label>
          <Input
            id="account_name"
            placeholder="My AWS Account"
            value={formData.account_name}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, role_arn: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            This is the Role ARN from CloudFormation Outputs or your setup script
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
            onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            This is the External ID from CloudFormation Outputs or your setup script
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Starting Scan..." : "Start Scan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

