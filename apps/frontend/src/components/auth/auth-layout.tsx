import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
        <div className="flex flex-col justify-center max-w-md mx-auto lg:mx-0">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">SweetSpot</h1>
            <p className="text-xl opacity-90">Cowork</p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">
                {title || "Comprehensive Coworking Management"}
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                {description ||
                  "Streamline your coworking space operations with our all-in-one platform. Manage members, bookings, billing, and more."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Multi-tenant architecture</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Role-based access control</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Real-time collaboration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Advanced analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
