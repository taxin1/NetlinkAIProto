import { Loader2 } from "lucide-react";

export default function CheckoutLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    </div>
  );
}
