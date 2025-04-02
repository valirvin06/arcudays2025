import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import AdminNavbar from "@/components/admin/navbar";
import { Loader2 } from "lucide-react";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-[#5E35B1] animate-spin mb-4" />
        <h1 className="text-xl font-semibold text-gray-700">Loading...</h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // This will redirect to login page due to the useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
