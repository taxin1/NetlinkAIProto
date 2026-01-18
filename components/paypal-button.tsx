"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: string;
  planName: string;
  currency?: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  subscriptionMode?: boolean; // Enable PayPal subscription mode
  planId?: string; // PayPal plan ID for subscriptions
}

export function PayPalButton({
  amount,
  planName,
  currency = "USD",
  onSuccess,
  onError,
  disabled = false,
  subscriptionMode = false,
  planId,
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [cardFieldsAvailable, setCardFieldsAvailable] = useState(false);
  const [nameFieldAvailable, setNameFieldAvailable] = useState(false);
  const paypalButtonContainerRef = useRef<HTMLDivElement>(null);
  const cardNameFieldRef = useRef<HTMLDivElement>(null);
  const cardNumberFieldRef = useRef<HTMLDivElement>(null);
  const cardCvvFieldRef = useRef<HTMLDivElement>(null);
  const cardExpiryFieldRef = useRef<HTMLDivElement>(null);
  const paypalLoadedRef = useRef(false);
  const cardFieldRef = useRef<any>(null);

  // Billing address state
  const [billingAddress, setBillingAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    adminArea1: "",
    adminArea2: "",
    countryCode: "US",
    postalCode: "",
  });

  useEffect(() => {
    // Load PayPal SDK
    if (paypalLoadedRef.current) return;
    
    // Store original error handlers for cleanup
    const originalErrorHandler = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;
    
    // Add global error handler for PayPal SDK before loading
    // This catches unhandled exceptions from PayPal SDK v5
    window.onerror = (message, source, lineno, colno, error) => {
      // Check if this is a PayPal-related error
      const messageStr = String(message || '');
      const errorStr = error ? String(error) : '';
      const sourceStr = String(source || '');
      
      // Check for PayPal SDK errors - including empty error objects
      const isPayPalError = 
        messageStr.toLowerCase().includes('paypal') ||
        messageStr.toLowerCase().includes('paypal_js_sdk') ||
        messageStr.toLowerCase().includes('paypal_js_sdk_v5_unhandled_exception') ||
        errorStr.toLowerCase().includes('paypal') ||
        sourceStr.toLowerCase().includes('paypal') ||
        (error && typeof error === 'object' && Object.keys(error).length === 0 && sourceStr.includes('paypal'));
      
      if (isPayPalError) {
        // For the specific "paypal_js_sdk_v5_unhandled_exception" error (including empty {}), suppress console error
        const isUnhandledException = messageStr.includes('paypal_js_sdk_v5_unhandled_exception') || 
                                    (error && typeof error === 'object' && Object.keys(error).length === 0 && sourceStr.includes('paypal'));
        
        if (isUnhandledException) {
          // Silently handle this known PayPal SDK issue - it's usually non-critical
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn("PayPal SDK v5 unhandled exception (non-critical):", { message, source });
          }
          setIsProcessing(false);
          // Don't show error to user unless it's actually blocking functionality
          return true; // Prevent default error handling
        }
        
        // For other PayPal errors, log and handle normally
        console.error("PayPal SDK unhandled error:", { message, source, lineno, colno, error });
        setIsProcessing(false);
        const errorMsg = typeof message === 'string' ? message : error?.message || "An unexpected PayPal error occurred";
        setResultMessage(`PayPal error: ${errorMsg}`);
        onError(`PayPal error: ${errorMsg}`);
        return false;
      }
      // Call original error handler for non-PayPal errors
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // Also handle unhandled promise rejections from PayPal SDK
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonStr = reason?.toString() || JSON.stringify(reason);
      
      // Check if this is a PayPal-related error
      const isPayPalError = 
        reasonStr.toLowerCase().includes('paypal') ||
        reasonStr.toLowerCase().includes('paypal_js_sdk') ||
        reasonStr.toLowerCase().includes('paypal_js_sdk_v5_unhandled_exception') ||
        (reason && typeof reason === 'object' && 'message' in reason && 
         String(reason.message).toLowerCase().includes('paypal')) ||
        (reason && typeof reason === 'object' && 'name' in reason && 
         String(reason.name).toLowerCase().includes('paypal')) ||
        (reason && typeof reason === 'object' && Object.keys(reason).length === 0);
      
      if (isPayPalError) {
        // For the specific "paypal_js_sdk_v5_unhandled_exception" error (including empty {}), suppress console error
        const isUnhandledException = reasonStr.includes('paypal_js_sdk_v5_unhandled_exception') ||
                                    (reason && typeof reason === 'object' && Object.keys(reason).length === 0);
        
        if (isUnhandledException) {
          // Silently handle this known PayPal SDK issue - it's usually non-critical
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.warn("PayPal SDK v5 unhandled promise rejection (non-critical):", reason);
          }
          setIsProcessing(false);
          event.preventDefault(); // Prevent default browser error handling
          return;
        }
        
        // For other PayPal errors, log and handle normally
        console.error("PayPal SDK unhandled promise rejection:", reason);
        setIsProcessing(false);
        const errorMsg = reason?.message || reasonStr || "An unexpected PayPal error occurred";
        setResultMessage(`PayPal error: ${errorMsg}`);
        onError(`PayPal error: ${errorMsg}`);
        event.preventDefault(); // Prevent default browser error handling
      } else if (originalUnhandledRejection) {
        (originalUnhandledRejection as any)(event);
      }
    };

    // Add PayPal-specific error handler
    (window as any).paypalErrorHandler = (error: any) => {
      console.error("PayPal SDK global error:", error);
      setIsProcessing(false);
      setResultMessage(`PayPal error: ${error?.message || "An unexpected error occurred"}`);
      onError(error?.message || "An unexpected PayPal error occurred");
    };
    
    const loadPayPalSDK = async () => {
      try {
        // Check if PayPal SDK is already loaded and initialized
        if (window.paypal && window.paypal.Buttons) {
          console.log("PayPal SDK already loaded and initialized");
          setIsLoading(false);
          return;
        }

        // Check if script is already in the DOM
        const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
        if (existingScript) {
          console.log("PayPal SDK script already exists, waiting for initialization...");
          // Wait for it to initialize with polling
          let attempts = 0;
          const maxAttempts = 40; // 40 attempts * 250ms = 10 seconds max wait
          const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.paypal && window.paypal.Buttons) {
              console.log("PayPal SDK initialized from existing script");
              clearInterval(checkInterval);
              setIsLoading(false);
            } else if (attempts >= maxAttempts) {
              console.error("PayPal SDK script exists but failed to initialize");
              clearInterval(checkInterval);
              setIsLoading(false);
              onError("PayPal SDK script exists but failed to initialize. Please refresh the page.");
            }
          }, 250); // Check every 250ms
          
          return;
        }

        // Fetch client ID from server (for security)
        console.log("Fetching PayPal client ID...");
        const response = await fetch("/api/paypal/get-client-id");
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch PayPal client ID:", response.status, errorData);
          setIsLoading(false);
          onError(`PayPal client ID not configured (${response.status})`);
          return;
        }

        const data = await response.json();
        
        if (!data.clientId) {
          console.error("PayPal client ID is missing from response:", data);
          setIsLoading(false);
          onError("PayPal client ID not configured");
          return;
        }

        console.log("PayPal client ID retrieved, loading SDK...");
        paypalLoadedRef.current = true;
        
        const script = document.createElement("script");
        // Use subscription mode if enabled
        // Build SDK parameters - focus on card payments and PayPal
        // No Google Pay or Apple Pay - keep it simple
        let sdkParams: string;
        
        // Validate client ID before using it
        const clientId = data.clientId?.trim();
        if (!clientId || clientId.length < 10) {
          console.error("Invalid PayPal client ID format - too short or empty");
          setIsLoading(false);
          onError("Invalid PayPal client ID. Please check your .env.local file and ensure PAYPAL_CLIENT_ID is set correctly.");
          return;
        }
        
        console.log("Client ID validation passed:", {
          length: clientId.length,
          startsWith: clientId.substring(0, 5),
          hasSpaces: clientId.includes(' '),
          hasNewlines: clientId.includes('\n')
        });
        
        if (subscriptionMode) {
          sdkParams = `client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription&currency=${currency}&components=buttons`;
        } else {
          // Enable buttons and card fields for easy card payments without PayPal account
          sdkParams = `client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons,card-fields`;
        }
        
        const sdkUrl = `https://www.paypal.com/sdk/js?${sdkParams}`;
        console.log("Loading PayPal SDK from:", sdkUrl.replace(clientId, "CLIENT_ID_HIDDEN"));
        console.log("Full URL length:", sdkUrl.length);
        
        script.src = sdkUrl;
        script.async = true;
        script.setAttribute("data-namespace", "paypal_sdk");
        script.setAttribute("data-sdk-integration-source", "button-factory");
        
        let loadTimeout: NodeJS.Timeout;
        let hasLoaded = false;
        
        script.onload = () => {
          if (hasLoaded) return; // Prevent duplicate calls
          hasLoaded = true;
          console.log("PayPal SDK script loaded, waiting for initialization...");
          
          // Check for PayPal SDK errors in console
          const originalConsoleError = console.error;
          const paypalErrors: any[] = [];
          console.error = (...args: any[]) => {
            const errorMsg = args.join(' ');
            if (errorMsg.toLowerCase().includes('paypal')) {
              paypalErrors.push(errorMsg);
              console.warn("PayPal SDK error detected:", errorMsg);
            }
            originalConsoleError.apply(console, args);
          };
          
          // Check if script actually executed - look for PayPal SDK in window
          // Sometimes the script loads but fails silently
          const checkScriptExecution = () => {
            // Check multiple possible locations where PayPal SDK might be
            const possibleLocations = [
              window.paypal,
              (window as any).paypal_sdk,
              (window as any).PayPal,
            ];
            
            for (const location of possibleLocations) {
              if (location) {
                console.log("Found PayPal SDK in alternative location:", location);
                return location;
              }
            }
            return null;
          };
          
          // Poll for window.paypal to be available (PayPal SDK can take time to initialize)
          let attempts = 0;
          const maxAttempts = 30; // 30 attempts * 300ms = 9 seconds max wait
          const checkInterval = setInterval(() => {
            attempts++;
            
            // First check standard location
            if (window.paypal) {
              console.log("window.paypal found, checking for Buttons...");
              
              // Check for Buttons
              if (window.paypal.Buttons) {
                console.log("PayPal SDK initialized successfully with Buttons");
                console.error = originalConsoleError; // Restore original
                clearInterval(checkInterval);
                setIsLoading(false);
                if (loadTimeout) clearTimeout(loadTimeout);
                return;
              }
              
              // Check for CardFields (alternative component)
              if (window.paypal.CardFields) {
                console.log("PayPal SDK initialized with CardFields (Buttons may not be available)");
                console.error = originalConsoleError; // Restore original
                clearInterval(checkInterval);
                setIsLoading(false);
                if (loadTimeout) clearTimeout(loadTimeout);
                return;
              }
              
              // window.paypal exists but Buttons not available - might be a configuration issue
              if (attempts >= maxAttempts) {
                console.error("PayPal SDK loaded but Buttons component not available");
                console.error("Available PayPal components:", Object.keys(window.paypal));
                console.error("PayPal errors detected:", paypalErrors);
                console.error("This usually means:");
                console.error("1. Invalid PayPal client ID");
                console.error("2. PayPal account not properly configured");
                console.error("3. Client ID doesn't have permission for buttons component");
                console.error = originalConsoleError; // Restore original
                clearInterval(checkInterval);
                setIsLoading(false);
                onError("PayPal SDK loaded but payment buttons are not available. Please verify your PayPal client ID is correct in .env.local");
                if (loadTimeout) clearTimeout(loadTimeout);
                return;
              }
            } else {
              // Check alternative locations
              const altLocation = checkScriptExecution();
              if (altLocation) {
                console.log("Found PayPal SDK in alternative location, attempting to use it...");
                // Try to assign it to window.paypal if possible
                if (!window.paypal && typeof altLocation === 'object') {
                  (window as any).paypal = altLocation;
                }
              }
              
              if (attempts >= maxAttempts) {
                console.error("PayPal SDK loaded but window.paypal is not available after waiting");
                console.error("PayPal errors detected:", paypalErrors);
                console.error("Script src:", script.src.replace(clientId, "CLIENT_ID_HIDDEN"));
                console.error("This usually means:");
                console.error("1. Invalid or incorrect PayPal client ID");
                console.error("2. Network/CORS issue blocking PayPal SDK");
                console.error("3. PayPal SDK script failed to execute");
                console.error("Please check:");
                console.error("- Your .env.local file has PAYPAL_CLIENT_ID set");
                console.error("- The client ID is from PayPal Developer Dashboard");
                console.error("- You're using the correct environment (sandbox vs live)");
                console.error = originalConsoleError; // Restore original
                clearInterval(checkInterval);
                setIsLoading(false);
                onError("PayPal SDK failed to initialize. Please verify your PayPal client ID in .env.local is correct and restart your dev server.");
                if (loadTimeout) clearTimeout(loadTimeout);
                return;
              }
            }
            
            // Still waiting for SDK to initialize
            if (attempts % 5 === 0) { // Log every 5 attempts to reduce console spam
              console.log(`Waiting for PayPal SDK... (attempt ${attempts}/${maxAttempts})`);
            }
          }, 300); // Check every 300ms
        };
        
        script.onerror = (error) => {
          if (hasLoaded) return; // Prevent duplicate calls
          hasLoaded = true;
          console.error("Failed to load PayPal SDK script:", error);
                console.error("Script src:", script.src.replace(clientId, "CLIENT_ID_HIDDEN"));
          
          // Try to get more details about the error
          const scriptError = error as ErrorEvent;
          if (scriptError) {
            console.error("Error details:", {
              message: scriptError.message,
              filename: scriptError.filename,
              lineno: scriptError.lineno,
              colno: scriptError.colno,
              error: scriptError.error
            });
          }
          
          
          setIsLoading(false);
          onError("Failed to load PayPal SDK. Please check your internet connection and PayPal client ID configuration.");
          if (loadTimeout) clearTimeout(loadTimeout);
        };

        // Add timeout for script loading (increased to 20 seconds to allow for initialization)
        loadTimeout = setTimeout(() => {
          if (!window.paypal || !window.paypal.Buttons) {
            console.error("PayPal SDK loading timeout after 20 seconds");
            setIsLoading(false);
            onError("PayPal SDK loading timeout. Please check your internet connection and refresh the page.");
          }
        }, 20000); // 20 second timeout

        document.body.appendChild(script);
      } catch (error) {
        console.error("Error loading PayPal SDK:", error);
        setIsLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        onError(`Failed to initialize PayPal: ${errorMessage}`);
      }
    };

    loadPayPalSDK();
    
    // Cleanup function to restore original error handlers
    return () => {
      if (originalErrorHandler) {
        window.onerror = originalErrorHandler;
      } else {
        window.onerror = null;
      }
      if (originalUnhandledRejection) {
        window.onunhandledrejection = originalUnhandledRejection;
      } else {
        window.onunhandledrejection = null;
      }
      delete (window as any).paypalErrorHandler;
    };
  }, [currency, onError]);

  // Create subscription callback - memoized to prevent recreation
  const createSubscriptionCallback = useCallback(async (data: any, actions: any) => {
    setResultMessage("");
    try {
      setIsProcessing(true);
      
      // Use provided planId or check environment variable
      const planIdToUse = planId || process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
      
      if (!planIdToUse) {
        const errorMsg = "PayPal subscription plan ID is not configured. Please set NEXT_PUBLIC_PAYPAL_PLAN_ID in your environment variables, or create a subscription plan in your PayPal dashboard.";
        console.error(errorMsg);
        setResultMessage(errorMsg);
        setIsProcessing(false);
        onError("PayPal subscription plan ID is required but not configured.");
        throw new Error(errorMsg);
      }
      
      // Validate plan ID format (PayPal plan IDs start with "P-" followed by alphanumeric characters)
      if (!planIdToUse.match(/^P-[A-Z0-9]+$/)) {
        const errorMsg = `Invalid PayPal plan ID format: ${planIdToUse}. Plan IDs must start with "P-" followed by alphanumeric characters.`;
        console.error(errorMsg);
        setResultMessage(errorMsg);
        setIsProcessing(false);
        onError("Invalid PayPal plan ID format.");
        throw new Error(errorMsg);
      }
      
      console.log("Creating PayPal subscription with plan ID:", planIdToUse);
      
      // Create subscription using PayPal SDK
      return actions.subscription.create({
        plan_id: planIdToUse,
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to create subscription";
      setResultMessage(`Could not initiate PayPal Subscription: ${errorMsg}`);
      setIsProcessing(false);
      onError(errorMsg);
      throw error;
    }
  }, [planId, onError]);

  // Create order callback - memoized to prevent recreation
  const createOrderCallback = useCallback(async () => {
    setResultMessage("");
            try {
              setIsProcessing(true);
      const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
          cart: [
            {
              id: planName,
              quantity: "1",
              amount: amount,
              description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`,
            },
          ],
                  planName,
                  amount,
                  currency,
                }),
              });

              const orderData = await response.json();

      if (orderData.id) {
        // Check if payer action is required (e.g., 3D Secure authentication)
        if (orderData.status === "PAYER_ACTION_REQUIRED" && orderData.payerActionUrl) {
          // Redirect user to complete the required action
          // The PayPal SDK should handle this automatically, but we log it for debugging
          console.log("Payer action required, redirecting to:", orderData.payerActionUrl);
          // The SDK will handle the redirect automatically, but we can also do it manually if needed
          // window.location.href = orderData.payerActionUrl;
        }
        return orderData.id;
      } else {
        const errorDetail = orderData?.details?.[0];
        const errorMessage = errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
          : JSON.stringify(orderData);

        throw new Error(errorMessage);
      }
            } catch (error) {
              console.error("Create order error:", error);
      const errorMsg = `Could not initiate PayPal Checkout...<br><br>${error}`;
      setResultMessage(errorMsg);
      setIsProcessing(false);
              onError(error instanceof Error ? error.message : "Failed to create order");
              throw error;
            }
  }, [planName, amount, currency, onError]);

  // On approve callback - memoized to prevent recreation
  const onApproveCallback = useCallback(async (data: any, actions: any) => {
    try {
      const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  planName,
                }),
              });

      const orderData = await response.json();
      
      // Check if order requires payer action (e.g., 3D Secure)
      if (orderData.status === "PAYER_ACTION_REQUIRED") {
        const payerActionUrl = orderData.payerActionUrl || 
          orderData.links?.find((link: any) => link.rel === "payer-action")?.href;
        
        if (payerActionUrl) {
          // Redirect user to complete required action (e.g., 3D Secure)
          console.log("Payer action required, redirecting to:", payerActionUrl);
          window.location.href = payerActionUrl;
          return;
        } else {
          setResultMessage("Additional authentication required. Please complete the payment process.");
          setIsProcessing(false);
          return;
        }
      }
      
      // Three cases to handle:
      //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
      //   (2) Other non-recoverable errors -> Show a failure message
      //   (3) Successful transaction -> Show confirmation or thank you message

      const transaction =
        orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
        orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
      const errorDetail = orderData?.details?.[0];

      if (errorDetail?.issue === "INSTRUMENT_DECLINED" && actions?.restart) {
        // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
        return actions.restart();
      } else if (errorDetail || !transaction || transaction.status === "DECLINED") {
        // (2) Other non-recoverable errors -> Show a failure message
        let errorMessage;
        if (transaction) {
          errorMessage = `Transaction ${transaction.status}: ${transaction.id}`;
        } else if (errorDetail) {
          errorMessage = `${errorDetail.description} (${orderData.debug_id})`;
        } else {
          errorMessage = JSON.stringify(orderData);
        }

        throw new Error(errorMessage);
      } else {
        // (3) Successful transaction -> Show confirmation or thank you message
        setResultMessage(
          `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`
        );
        console.log(
          "Capture result",
          orderData,
          JSON.stringify(orderData, null, 2)
        );
              setIsProcessing(false);
              onSuccess(data.orderID);
      }
            } catch (error) {
              console.error("Capture error:", error);
      const errorMsg = `Sorry, your transaction could not be processed...<br><br>${error}`;
      setResultMessage(errorMsg);
              setIsProcessing(false);
              onError(error instanceof Error ? error.message : "Failed to process payment");
            }
  }, [planName, onSuccess, onError]);

  useEffect(() => {
    if (isLoading || disabled || !window.paypal) {
      return;
    }

    // Wait a bit to ensure SDK is fully initialized
    const initTimeout = setTimeout(() => {
      try {
        // Clear any existing buttons
        if (paypalButtonContainerRef.current) {
          paypalButtonContainerRef.current.innerHTML = "";
        }

        // Clear card fields
        [cardNameFieldRef, cardNumberFieldRef, cardCvvFieldRef, cardExpiryFieldRef].forEach(ref => {
          if (ref.current) {
            ref.current.innerHTML = "";
          }
        });

        // Render the PayPal button component
        if (paypalButtonContainerRef.current && window.paypal?.Buttons) {
          try {
            const buttonConfig: any = {
              onError: function (error: any) {
                console.error("PayPal button error:", error);
                setIsProcessing(false);
                setResultMessage(`Payment error: ${error.message || "An error occurred during payment. Please try again."}`);
                onError("An error occurred during payment. Please try again.");
              },
              onCancel: function () {
                setIsProcessing(false);
                setResultMessage("Payment was cancelled.");
              },
              style: {
                shape: "rect",
                layout: "vertical",
                color: "gold",
                label: "paypal",
              },
              message: {
                amount: parseFloat(amount) || 100,
              },
              // Enable guest checkout - users can pay with cards without PayPal account
              enableStandardCardFields: false, // We handle card fields separately for better UX
            };

            // Use subscription mode if enabled
            if (subscriptionMode) {
              buttonConfig.createSubscription = createSubscriptionCallback;
              buttonConfig.onApprove = async function (data: any, actions: any) {
                try {
                  console.log("Subscription approved:", data);
                  setIsProcessing(false);
                  
                  // Call the success callback with subscription ID
                  const subscriptionId = data.subscriptionID || data.subscriptionId;
                  setResultMessage(`You have successfully subscribed! Subscription ID: ${subscriptionId}`);
                  
                  // Optionally save subscription to database
                  try {
                    const response = await fetch("/api/subscriptions/save", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        subscriptionId,
                        planName,
                        amount,
                        currency,
                      }),
                    });
                    
                    if (!response.ok) {
                      console.warn("Failed to save subscription to database");
                    }
                  } catch (saveError) {
                    console.warn("Error saving subscription:", saveError);
                    // Don't fail the subscription if database save fails
                  }
                  
                  onSuccess(subscriptionId);
                } catch (error) {
                  console.error("Subscription approval error:", error);
                  setIsProcessing(false);
                  onError(error instanceof Error ? error.message : "Failed to process subscription");
                }
              };
            } else {
              buttonConfig.createOrder = createOrderCallback;
              buttonConfig.onApprove = onApproveCallback;
            }

            const buttons = window.paypal.Buttons(buttonConfig);
            
            if (buttons && buttons.render) {
              buttons.render(paypalButtonContainerRef.current);
            } else {
              throw new Error("PayPal Buttons render method not available");
            }
          } catch (renderError) {
            console.error("Error rendering PayPal buttons:", renderError);
            setIsLoading(false);
            onError("Failed to render PayPal buttons");
          }
        }

        // Render card fields - try to render even if eligibility check fails
        // Eligibility is not always reliable, so we attempt to render and handle errors gracefully
        if (window.paypal?.CardFields) {
          try {
            const cardField = window.paypal.CardFields({
              createOrder: createOrderCallback,
              onApprove: onApproveCallback,
              onError: function (error: any) {
                console.error("Card field error:", error);
            setIsProcessing(false);
                setResultMessage(`Card payment error: ${error.message || "An error occurred"}`);
                onError("An error occurred during card payment");
              },
              style: {
                input: {
                  "font-size": "16px",
                  "font-family": "courier, monospace",
                  "font-weight": "lighter",
                  color: "#ccc",
                },
                ".invalid": { color: "purple" },
              },
            });

            cardFieldRef.current = cardField;

            // Check eligibility, but don't treat it as a hard requirement
            // PayPal's isEligible() can be unreliable, so we try to render anyway
            const isEligible = cardField.isEligible ? cardField.isEligible() : true;
            
            if (isEligible) {
              console.log("Card fields are eligible, rendering...");
            } else {
              console.warn("Card fields eligibility check returned false, but attempting to render anyway...");
            }
            
            // Attempt to render card fields regardless of eligibility
            // Only fail if there's an actual error during rendering
            const renderedFields: string[] = [];
            
            try {
              // Name field is optional - try to render it but don't fail if it causes issues
              try {
                if (cardField.NameField) {
                  const nameField = cardField.NameField({
                    style: { input: { color: "blue" }, ".invalid": { color: "purple" } },
                  });
                  if (cardNameFieldRef.current && nameField && nameField.render) {
                    nameField.render(cardNameFieldRef.current);
                    setNameFieldAvailable(true);
                    renderedFields.push("name");
                  }
                }
              } catch (nameError: any) {
                console.warn("Name field not available (optional):", nameError);
                setNameFieldAvailable(false);
                // Clear the name field container if it failed
                if (cardNameFieldRef.current) {
                  cardNameFieldRef.current.innerHTML = "";
                }
                // Name field is optional, continue without it
              }

              // Try to render number field (required)
              try {
                if (cardField.NumberField) {
                  const numberField = cardField.NumberField({
                    style: { input: { color: "blue" } },
                  });
                  if (cardNumberFieldRef.current && numberField && numberField.render) {
                    numberField.render(cardNumberFieldRef.current);
                    renderedFields.push("number");
                  } else {
                    console.warn("NumberField render method not available");
                  }
                }
              } catch (err: any) {
                console.warn("Error rendering number field:", err);
              }

              // Try to render CVV field (required)
              try {
                if (cardField.CVVField) {
                  const cvvField = cardField.CVVField({
                    style: { input: { color: "blue" } },
                  });
                  if (cardCvvFieldRef.current && cvvField && cvvField.render) {
                    cvvField.render(cardCvvFieldRef.current);
                    renderedFields.push("cvv");
                  } else {
                    console.warn("CVVField render method not available");
                  }
                }
              } catch (err: any) {
                console.warn("Error rendering CVV field:", err);
              }

              // Try to render expiry field (required)
              try {
                if (cardField.ExpiryField) {
                  const expiryField = cardField.ExpiryField({
                    style: { input: { color: "blue" } },
                  });
                  if (cardExpiryFieldRef.current && expiryField && expiryField.render) {
                    expiryField.render(cardExpiryFieldRef.current);
                    renderedFields.push("expiry");
                  } else {
                    console.warn("ExpiryField render method not available");
                  }
                }
              } catch (err: any) {
                console.warn("Error rendering expiry field:", err);
              }
              
              // Mark as available if we have at least the core required fields (number, CVV, expiry)
              // These are the minimum fields needed for card payment
              const hasRequiredFields = 
                renderedFields.includes("number") && 
                renderedFields.includes("cvv") && 
                renderedFields.includes("expiry");
              
              if (hasRequiredFields) {
                setCardFieldsAvailable(true);
                console.log("Card fields rendered successfully:", renderedFields);
              } else {
                console.warn("Card fields failed to render properly. Rendered fields:", renderedFields);
                setCardFieldsAvailable(false);
              }
            } catch (fieldError) {
              console.warn("Error creating card fields:", fieldError);
              setCardFieldsAvailable(false);
            }
          } catch (cardError) {
            console.warn("Card fields not available:", cardError);
            setCardFieldsAvailable(false);
            // Card fields are optional, continue without them
          }
        } else {
          console.warn("PayPal CardFields component not available in SDK");
          setCardFieldsAvailable(false);
        }
    } catch (error) {
        console.error("Error rendering PayPal components:", error);
      setIsLoading(false);
        onError("Failed to initialize payment components");
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [isLoading, disabled, subscriptionMode, createOrderCallback, createSubscriptionCallback, onApproveCallback, onSuccess, onError, planName, amount, currency]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PayPal Smart Payment Buttons */}
      <div>
        <p className="text-sm text-muted-foreground text-center mb-3">
          Pay with PayPal account, or use card fields below (no account needed)
        </p>
        <div ref={paypalButtonContainerRef} className="w-full" />
      </div>

      {/* Card Fields Section */}
      {cardFieldsAvailable && (
        <div className="space-y-4 border-t pt-6">
          <div>
            <h3 className="text-lg font-semibold">Pay with Card</h3>
            <p className="text-sm text-muted-foreground mt-1">No PayPal account needed - use any credit or debit card</p>
          </div>
          
          {/* Card Name Field - Optional */}
          {nameFieldAvailable && (
            <div className="space-y-2">
              <Label htmlFor="card-name-field">Cardholder Name (Optional)</Label>
              <div id="card-name-field-container" ref={cardNameFieldRef} />
              <p className="text-xs text-muted-foreground">Leave blank if not required</p>
            </div>
          )}

          {/* Card Number Field */}
          <div className="space-y-2">
            <Label htmlFor="card-number-field">Card Number</Label>
            <div id="card-number-field-container" ref={cardNumberFieldRef} />
          </div>

          {/* Card Details Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* CVV Field */}
            <div className="space-y-2">
              <Label htmlFor="card-cvv-field">CVV</Label>
              <div id="card-cvv-field-container" ref={cardCvvFieldRef} />
            </div>

            {/* Expiry Field */}
            <div className="space-y-2">
              <Label htmlFor="card-expiry-field">Expiry Date</Label>
              <div id="card-expiry-field-container" ref={cardExpiryFieldRef} />
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Billing Address</h4>
            
            <div className="space-y-2">
              <Label htmlFor="card-billing-address-line-1">Address Line 1</Label>
              <Input
                id="card-billing-address-line-1"
                value={billingAddress.addressLine1}
                onChange={(e) =>
                  setBillingAddress({ ...billingAddress, addressLine1: e.target.value })
                }
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-billing-address-line-2">Address Line 2 (Optional)</Label>
              <Input
                id="card-billing-address-line-2"
                value={billingAddress.addressLine2}
                onChange={(e) =>
                  setBillingAddress({ ...billingAddress, addressLine2: e.target.value })
                }
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-billing-address-admin-area-line-1">City</Label>
                <Input
                  id="card-billing-address-admin-area-line-1"
                  value={billingAddress.adminArea1}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, adminArea1: e.target.value })
                  }
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-billing-address-admin-area-line-2">State</Label>
                <Input
                  id="card-billing-address-admin-area-line-2"
                  value={billingAddress.adminArea2}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, adminArea2: e.target.value })
                  }
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-billing-address-country-code">Country Code</Label>
                <Input
                  id="card-billing-address-country-code"
                  value={billingAddress.countryCode}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, countryCode: e.target.value.toUpperCase() })
                  }
                  placeholder="US"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-billing-address-postal-code">Postal Code</Label>
                <Input
                  id="card-billing-address-postal-code"
                  value={billingAddress.postalCode}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                  }
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            id="card-field-submit-button"
            type="button"
            className="w-full"
            disabled={isProcessing || disabled}
            onClick={() => {
              if (!cardFieldRef.current) return;
              
              setIsProcessing(true);
              setResultMessage("");
              
              // Prepare submit data - only include fields that have values
              const submitData: any = {};
              
              // Only include billing address if at least some fields are filled
              const hasBillingAddress = 
                billingAddress.addressLine1 || 
                billingAddress.adminArea1 || 
                billingAddress.postalCode;
              
              if (hasBillingAddress) {
                submitData.billingAddress = {
                  ...(billingAddress.addressLine1 && { addressLine1: billingAddress.addressLine1 }),
                  ...(billingAddress.addressLine2 && { addressLine2: billingAddress.addressLine2 }),
                  ...(billingAddress.adminArea1 && { adminArea1: billingAddress.adminArea1 }),
                  ...(billingAddress.adminArea2 && { adminArea2: billingAddress.adminArea2 }),
                  countryCode: billingAddress.countryCode || "US",
                  ...(billingAddress.postalCode && { postalCode: billingAddress.postalCode }),
                };
              }
              
              cardFieldRef.current
                .submit(submitData)
                .then(() => {
                  // submit successful - onApprove will be called
                })
                .catch((error: any) => {
                  console.error("Card field submit error:", error);
                  setIsProcessing(false);
                  const errorMsg = `Failed to submit card payment: ${error.message || error}`;
                  setResultMessage(errorMsg);
                  onError("Failed to submit card payment");
                });
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay with Card"
            )}
          </Button>
        </div>
      )}

      {/* Result Message */}
      {resultMessage && (
        <div
          id="result-message"
          className="mt-4 p-4 bg-muted rounded-lg"
          dangerouslySetInnerHTML={{ __html: resultMessage }}
        />
      )}

      {isProcessing && !resultMessage && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Processing payment...
        </div>
      )}
    </div>
  );
}
