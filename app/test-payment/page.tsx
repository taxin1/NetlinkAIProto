"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PayPalButton } from "@/components/paypal-button";
import { AlertCircle, CheckCircle2, Loader2, Settings } from "lucide-react";
import Link from "next/link";

export default function TestPaymentPage() {
  const [configStatus, setConfigStatus] = useState<{
    success: boolean;
    message: string;
    config?: any;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/paypal/test");
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      setConfigStatus({
        success: false,
        message: "Failed to check configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    setPaymentResult({
      success: true,
      message: "Payment successful!",
      orderId
    });
  };

  const handlePaymentError = (error: string) => {
    setPaymentResult({
      success: false,
      message: "Payment failed",
      error
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">PayPal Integration Test</h1>
      
      <div className="grid gap-6">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Checks if your PayPal credentials are correctly set in .env.local
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking configuration...
              </div>
            ) : configStatus?.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  {configStatus.message}
                </div>
                
                <div className="bg-slate-100 p-4 rounded-md text-sm font-mono">
                  <div>Client ID Prefix: {configStatus.config.clientIdPrefix}...</div>
                  <div>Client ID Length: {configStatus.config.clientIdLength}</div>
                  <div>Has Client Secret: {configStatus.config.hasClientSecret ? "Yes" : "No"}</div>
                </div>

                {!configStatus.config.hasClientSecret && (
                  <div className="text-amber-600 text-sm">
                    Warning: Client Secret is missing. You won't be able to capture payments server-side.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <AlertCircle className="h-5 w-5" />
                  {configStatus?.message || "Configuration check failed"}
                </div>
                {configStatus?.error && (
                  <div className="text-sm text-muted-foreground">
                    Error: {configStatus.error}
                  </div>
                )}
                <div className="bg-amber-50 p-4 rounded-md text-sm border border-amber-200">
                  <p className="font-semibold mb-2">How to fix:</p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Create a <code>.env.local</code> file in your project root if it doesn't exist.</li>
                    <li>Add your PayPal credentials:</li>
                  </ol>
                  <pre className="bg-slate-900 text-slate-50 p-2 rounded mt-2 overflow-x-auto">
                    PAYPAL_CLIENT_ID=your_client_id_here{'\n'}
                    PAYPAL_CLIENT_SECRET=your_client_secret_here
                  </pre>
                </div>
                <Button onClick={checkConfig} variant="outline" className="mt-2">
                  Retry Check
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Test Transaction</CardTitle>
            <CardDescription>
              Attempt a real $1.00 USD transaction (use Sandbox account!)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configStatus?.success ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 border border-blue-200">
                  <strong>Note:</strong> Ensure you are using a PayPal Sandbox account to test this. Do not use your real personal PayPal account.
                </div>

                <div className="max-w-md mx-auto border p-6 rounded-lg shadow-sm">
                  <div className="mb-4 text-center">
                    <div className="text-2xl font-bold">$1.00 USD</div>
                    <div className="text-sm text-muted-foreground">Test Payment</div>
                  </div>
                  
                  <PayPalButton
                    amount="1.00"
                    planName="Test Plan"
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </div>

                {paymentResult && (
                  <div className={`p-4 rounded-md flex items-start gap-3 ${
                    paymentResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                  }`}>
                    {paymentResult.success ? (
                      <CheckCircle2 className="h-5 w-5 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{paymentResult.message}</div>
                      {paymentResult.orderId && (
                        <div className="text-sm mt-1">Order ID: {paymentResult.orderId}</div>
                      )}
                      {paymentResult.error && (
                        <div className="text-sm mt-1">{paymentResult.error}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please fix the configuration above to enable the test payment button.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
