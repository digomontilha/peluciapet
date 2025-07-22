import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import Catalog from "./pages/Catalog";
import Auth from "./pages/Auth";
import ComoComprar from "./pages/ComoComprar";
import AdminDashboard from "./pages/AdminDashboard";
import ProductForm from "./pages/ProductForm";
import ProductList from "./pages/ProductList";

import CategoryManagement from "./pages/CategoryManagement";
import UserManagement from "./pages/UserManagement";
import ProductVariants from "./pages/ProductVariants";
import ContactManagement from "./pages/ContactManagement";
import ProductSizes from "./pages/ProductSizes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/como-comprar" element={<ComoComprar />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<ProductList />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/:id/edit" element={<ProductForm />} />
            
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/variants" element={<ProductVariants />} />
            <Route path="/admin/products/:productId/sizes" element={<ProductSizes />} />
            <Route path="/admin/contacts" element={<ContactManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
