import { NextRequest, NextResponse } from "next/server";
import { getPayPalCheckoutClient } from "@/lib/paypal";
// @ts-ignore - @paypal/checkout-server-sdk doesn't have TypeScript types
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = "USD" } = body;

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const client = getPayPalCheckoutClient();

    const orderRequest = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    orderRequest.prefer("return=representation");

    orderRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        },
      ],
    });

    const order = await client.execute(orderRequest);

    return NextResponse.json({ 
      orderID: order.result.id,
      id: order.result.id,
    });
  } catch (error) {
    console.error("PayPal order creation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 500 }
    );
  }
}
