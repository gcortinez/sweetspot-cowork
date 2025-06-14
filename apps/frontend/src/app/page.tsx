"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultRedirectForRole } from "@/lib/route-guards";
import {
  Building2,
  Users,
  Shield,
  BarChart3,
  Calendar,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Globe,
  Smartphone,
  Play,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to their role-appropriate dashboard
    // Only run once after initialization to prevent redirect loops
    if (!isLoading && user) {
      const redirectPath = getDefaultRedirectForRole(user.role);
      router.replace(redirectPath); // Use replace to avoid back button issues
    }
  }, [user?.id, isLoading]); // Depend only on user.id and loading state

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SweetSpot</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/auth/login")}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The modern way to manage your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                coworking space
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline operations, manage members, and grow your business with
              our comprehensive coworking space management platform trusted by
              500+ spaces worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium flex items-center justify-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
              >
                <Zap className="h-5 w-5" />
                <span>Start Free Trial</span>
              </button>
              <button
                onClick={() => router.push("/auth/login")}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Play className="h-5 w-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                4.9/5 from 500+ coworking spaces
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your space
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From member management to space booking, we've got you covered
              with powerful features designed for modern coworking spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-Tenant
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Isolated workspaces for different organizations with complete
                data separation and security.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Role-Based Access
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Granular permissions and access control for different user roles
                and responsibilities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-Time Updates
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Live notifications and updates keep everyone informed about
                space availability.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Analytics & Reports
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Detailed insights and reports to help you make data-driven
                decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Simplify your coworking operations
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Stop juggling multiple tools and spreadsheets. SweetSpot brings
                everything together in one powerful, intuitive platform.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Automated booking and scheduling",
                  "Member management and billing",
                  "Space utilization tracking",
                  "Mobile-friendly interface",
                  "24/7 customer support",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium flex items-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Today's Bookings
                      </h4>
                      <p className="text-gray-600">12 active reservations</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        name: "Meeting Room A",
                        time: "9:00 AM - 11:00 AM",
                        status: "occupied",
                        color: "green",
                      },
                      {
                        name: "Hot Desk #5",
                        time: "10:00 AM - 6:00 PM",
                        status: "occupied",
                        color: "green",
                      },
                      {
                        name: "Phone Booth 2",
                        time: "2:00 PM - 3:00 PM",
                        status: "available",
                        color: "blue",
                      },
                    ].map((booking, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.time}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.color === "green"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {booking.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-600 text-white p-3 rounded-xl shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                500+
              </div>
              <div className="text-blue-100 text-lg">Coworking Spaces</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                50K+
              </div>
              <div className="text-blue-100 text-lg">Active Members</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                99.9%
              </div>
              <div className="text-blue-100 text-lg">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your coworking space?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of coworking spaces already using SweetSpot to
            streamline their operations and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/auth/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium flex items-center justify-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
            >
              <Zap className="h-5 w-5" />
              <span>Start Free Trial</span>
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="border border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">SweetSpot</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-600">
              <Globe className="h-5 w-5" />
              <Smartphone className="h-5 w-5" />
              <Shield className="h-5 w-5" />
            </div>
            <p className="text-gray-600 mt-4 md:mt-0">
              © 2024 SweetSpot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
