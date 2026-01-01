"use client";

import { useEffect } from "react";

/**
 * Global error handler for PayPal SDK v5 unhandled exceptions
 * This component sets up error handlers at the app level to catch
 * PayPal SDK errors before they reach the console
 */
export function PayPalErrorHandler() {
  useEffect(() => {
    // Store original error handlers
    const originalOnError = window.onerror;
    const originalOnUnhandledRejection = window.onunhandledrejection;

    // Global error handler for PayPal SDK
    const handleError = (
      message: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean => {
      const messageStr = String(message || "");
      const sourceStr = String(source || "");
      const errorStr = error ? String(error) : "";

      // Check if this is a PayPal SDK v5 unhandled exception
      const isPayPalUnhandledException =
        messageStr.includes("paypal_js_sdk_v5_unhandled_exception") ||
        (error &&
          typeof error === "object" &&
          Object.keys(error).length === 0 &&
          sourceStr.includes("paypal"));

      if (isPayPalUnhandledException) {
        // Silently suppress this known non-critical PayPal SDK issue
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[PayPal SDK] Suppressed unhandled exception (non-critical):",
            { message, source }
          );
        }
        // Return true to prevent default error handling
        return true;
      }

      // Check for other PayPal errors
      const isPayPalError =
        messageStr.toLowerCase().includes("paypal") ||
        messageStr.toLowerCase().includes("paypal_js_sdk") ||
        errorStr.toLowerCase().includes("paypal") ||
        sourceStr.toLowerCase().includes("paypal");

      if (isPayPalError && !isPayPalUnhandledException) {
        // Log other PayPal errors but don't suppress them
        if (process.env.NODE_ENV === "development") {
          console.error("[PayPal SDK] Error:", { message, source, error });
        }
      }

      // Call original error handler for non-PayPal errors
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }

      return false;
    };

    // Global promise rejection handler for PayPal SDK
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonStr = reason?.toString() || JSON.stringify(reason);

      // Check if this is a PayPal SDK v5 unhandled exception
      const isPayPalUnhandledException =
        reasonStr.includes("paypal_js_sdk_v5_unhandled_exception") ||
        (reason &&
          typeof reason === "object" &&
          Object.keys(reason).length === 0);

      if (isPayPalUnhandledException) {
        // Silently suppress this known non-critical PayPal SDK issue
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[PayPal SDK] Suppressed unhandled promise rejection (non-critical):",
            reason
          );
        }
        event.preventDefault(); // Prevent default browser error handling
        return;
      }

      // Check for other PayPal errors
      const isPayPalError =
        reasonStr.toLowerCase().includes("paypal") ||
        reasonStr.toLowerCase().includes("paypal_js_sdk") ||
        (reason &&
          typeof reason === "object" &&
          "message" in reason &&
          String(reason.message).toLowerCase().includes("paypal")) ||
        (reason &&
          typeof reason === "object" &&
          "name" in reason &&
          String(reason.name).toLowerCase().includes("paypal"));

      if (isPayPalError && !isPayPalUnhandledException) {
        // Log other PayPal errors but don't suppress them
        if (process.env.NODE_ENV === "development") {
          console.error("[PayPal SDK] Promise rejection:", reason);
        }
      }

      // Call original handler for non-PayPal errors
      if (originalOnUnhandledRejection) {
        originalOnUnhandledRejection(event);
      }
    };

    // Set up global error handlers
    window.onerror = handleError as any;
    window.onunhandledrejection = handleUnhandledRejection;

    // Cleanup function
    return () => {
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
    };
  }, []);

  // This component doesn't render anything
  return null;
}
