import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return PayPal client ID for client-side use
    const clientId = process.env.PAYPAL_CLIENT_ID;

    if (!clientId) {
      console.error("PAYPAL_CLIENT_ID environment variable is not set");
      return NextResponse.json(
        { 
          error: "PayPal client ID not configured",
          message: "Please set PAYPAL_CLIENT_ID in your environment variables"
        }, 
        { status: 500 }
      );
    }

    // Validate client ID format (PayPal client IDs typically start with specific patterns)
    const trimmedClientId = clientId.trim();
    if (trimmedClientId.length < 10) {
      console.error("PayPal client ID appears to be invalid (too short):", trimmedClientId.length);
      return NextResponse.json(
        { 
          error: "Invalid PayPal client ID",
          message: "The PayPal client ID appears to be invalid (too short). Please check your .env.local file."
        }, 
        { status: 500 }
      );
    }
    
    // Check for common issues
    if (trimmedClientId.includes('\n') || trimmedClientId.includes('\r')) {
      console.warn("PayPal client ID contains newlines - trimming");
    }
    
    if (trimmedClientId !== clientId) {
      console.warn("PayPal client ID had whitespace - using trimmed version");
    }

    return NextResponse.json({ clientId: trimmedClientId });
  } catch (error) {
    console.error("Error in PayPal get-client-id route:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
