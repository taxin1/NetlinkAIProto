import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Endpoint disabled in production" }, { status: 403 });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    const config = {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientIdPrefix: clientId?.substring(0, 5) || "N/A",
      // Don't expose full credentials
    };
    
    // Test if we can construct a valid PayPal SDK URL
    if (clientId) {
      const testUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&components=buttons`;
      config.testUrlLength = testUrl.length;
      config.testUrlValid = testUrl.length < 2000; // PayPal URLs should be reasonable length
    }
    
    return NextResponse.json({
      success: true,
      config,
      message: clientId 
        ? "PayPal client ID is configured" 
        : "PayPal client ID is missing"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
