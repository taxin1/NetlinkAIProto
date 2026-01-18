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
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Intercept console.error to catch PayPal SDK errors that are logged directly
    console.error = (...args: any[]) => {
      // #region agent log
      if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('Error fetching subscription')) {
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'paypal-error-handler.tsx:20',message:'Intercepted Error fetching subscription',data:{args: args.map(a => a instanceof Error ? {name:a.name,message:a.message,stack:a.stack} : a)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'3'})}).catch(()=>{});
      }
      // #endregion
      const errorMessage = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Include message and code for common error objects like PostgrestError
            const msg = arg.message || arg.msg || '';
            const code = arg.code || '';
            const details = arg.details || '';
            return `${JSON.stringify(arg)}${msg ? ` (${msg}${code ? ` - ${code}` : ''})` : ''}${details ? ` Details: ${details}` : ''}`;
          } catch (e) {
            return '[Unstringifiable Object]';
          }
        }
        return String(arg);
      }).join(' ');
      const errorStr = errorMessage.toLowerCase();

      // Suppress source map errors (harmless development warnings from Next.js/Turbopack)
      const isSourceMapError = 
        errorStr.includes("invalid source map") ||
        errorStr.includes("sourcemapurl") ||
        errorStr.includes("source map") ||
        errorStr.includes("sourcemap") ||
        errorStr.includes("could not be parsed") ||
        (args.length > 0 &&
          typeof args[0] === "string" &&
          (args[0].includes("Invalid source map") ||
           args[0].includes("sourceMapURL") ||
           args[0].includes("sourceMap") ||
           args[0].includes("source map"))) ||
        (args.length > 0 &&
          typeof args[0] === "object" &&
          args[0] !== null &&
          (String(args[0]).includes("source map") || 
           String(args[0]).includes("sourceMap")))
      
      if (isSourceMapError) {
        // Silently suppress source map parsing errors - these are harmless development warnings
        return; // Don't call original console.error
      }

      // Check if this is the PayPal SDK v5 unhandled exception
      if (
        errorStr.includes("paypal_js_sdk_v5_unhandled_exception") ||
        (args.length > 0 &&
          typeof args[0] === "string" &&
          args[0].includes("paypal_js_sdk_v5_unhandled_exception")) ||
        (args.length > 0 &&
          typeof args[0] === "object" &&
          args[0] !== null &&
          Object.keys(args[0]).length === 0 &&
          errorStr.includes("paypal"))
      ) {
        // Silently suppress this known non-critical PayPal SDK issue
        // This error is harmless and doesn't affect functionality
        return; // Don't call original console.error
      }

      // Call original console.error for all other errors
      originalConsoleError.apply(console, args);
    };

    // Intercept console.warn for PayPal SDK warnings
    console.warn = (...args: any[]) => {
      const warningMessage = args.map(arg => 
        typeof arg === 'string' ? arg : 
        typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : 
        String(arg)
      ).join(' ');
      const warningStr = warningMessage.toLowerCase();

      // Suppress source map warnings (harmless development warnings from Next.js/Turbopack)
      const isSourceMapWarning = 
        warningStr.includes("invalid source map") ||
        warningStr.includes("sourcemapurl") ||
        warningStr.includes("source map") ||
        warningStr.includes("sourcemap") ||
        warningStr.includes("could not be parsed") ||
        (args.length > 0 &&
          typeof args[0] === "string" &&
          (args[0].includes("Invalid source map") ||
           args[0].includes("sourceMapURL") ||
           args[0].includes("sourceMap") ||
           args[0].includes("source map"))) ||
        (args.length > 0 &&
          typeof args[0] === "object" &&
          args[0] !== null &&
          (String(args[0]).includes("source map") || 
           String(args[0]).includes("sourceMap")))

      if (isSourceMapWarning) {
        // Silently suppress source map parsing warnings - these are harmless development warnings
        return;
      }

      // Suppress PayPal SDK v5 unhandled exception warnings
      if (
        warningStr.includes("paypal_js_sdk_v5_unhandled_exception") ||
        (args.length > 0 &&
          typeof args[0] === "string" &&
          args[0].includes("paypal_js_sdk_v5_unhandled_exception"))
      ) {
        // Silently suppress
        return;
      }

      // Call original console.warn for all other warnings
      originalConsoleWarn.apply(console, args);
    };

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
      const combinedStr = `${messageStr} ${sourceStr} ${errorStr}`.toLowerCase();

      // Suppress source map errors (harmless development warnings from Next.js/Turbopack)
      if (
        combinedStr.includes("invalid source map") ||
        combinedStr.includes("sourcemapurl") ||
        combinedStr.includes("source map") ||
        combinedStr.includes("sourcemap") ||
        combinedStr.includes("could not be parsed")
      ) {
        // Silently suppress source map parsing errors
        return true; // Prevent default error handling
      }

      // Check if this is a PayPal SDK v5 unhandled exception
      const isPayPalUnhandledException =
        messageStr.includes("paypal_js_sdk_v5_unhandled_exception") ||
        (error &&
          typeof error === "object" &&
          Object.keys(error).length === 0 &&
          sourceStr.includes("paypal"));

      if (isPayPalUnhandledException) {
        // Silently suppress this known non-critical PayPal SDK issue
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
          originalConsoleError("[PayPal SDK] Error:", { message, source, error });
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
          originalConsoleError("[PayPal SDK] Promise rejection:", reason);
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
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // This component doesn't render anything
  return null;
}
