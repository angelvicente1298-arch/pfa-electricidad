import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const AdminOrders = lazy(() => import("./pages/AdminOrders"));

function AdminOrdersRoute() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#050814] text-sm font-semibold text-slate-300">Cargando panel privado…</div>}>
      <AdminOrders />
    </Suspense>
  );
}

function Router() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin/pedidos" component={AdminOrdersRoute} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
