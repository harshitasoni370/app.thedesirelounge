import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "@/context/SessionContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppRoutes } from "@/routes/AppRoutes";

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <CartProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </CartProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
