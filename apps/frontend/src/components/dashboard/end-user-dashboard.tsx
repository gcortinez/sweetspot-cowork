"use client";

import { useState, useEffect } from "react";
import {
  MetricWidget,
  QuickActionWidget,
  ActivityFeedWidget,
  ChartWidget,
  CommonMetrics,
} from "./dashboard-widgets";
import { EndUserOnly } from "@/components/rbac/role-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  User,
  BookOpen,
  Coffee,
  Wifi,
  Car,
  Users,
  Star,
  Plus,
  Eye,
  Settings,
} from "lucide-react";

interface EndUserDashboardProps {
  className?: string;
}

export function EndUserDashboard({ className = "" }: EndUserDashboardProps) {
  const [userMetrics, setUserMetrics] = useState({
    upcomingBookings: 0,
    totalBookings: 0,
    creditsRemaining: 0,
    membershipDays: 0,
    favoriteSpaces: 0,
    hoursThisMonth: 0,
  });

  const [upcomingBookings, setUpcomingBookings] = useState([
    {
      id: "1",
      spaceName: "Conference Room A",
      date: "Today",
      time: "2:00 PM - 4:00 PM",
      status: "confirmed",
    },
    {
      id: "2",
      spaceName: "Hot Desk #12",
      date: "Tomorrow",
      time: "9:00 AM - 5:00 PM",
      status: "confirmed",
    },
    {
      id: "3",
      spaceName: "Phone Booth 3",
      date: "Friday",
      time: "11:00 AM - 12:00 PM",
      status: "pending",
    },
  ]);

  const [recentActivity, setRecentActivity] = useState([
    {
      id: "1",
      title: "Booking confirmed",
      description: "Conference Room A for today 2:00 PM",
      timestamp: "10 minutes ago",
      type: "booking" as const,
    },
    {
      id: "2",
      title: "Payment processed",
      description: "Monthly membership fee $99",
      timestamp: "2 days ago",
      type: "payment" as const,
    },
    {
      id: "3",
      title: "Space reviewed",
      description: "You rated Hot Desk Area B - 5 stars",
      timestamp: "1 week ago",
      type: "space" as const,
    },
  ]);

  const [availableSpaces, setAvailableSpaces] = useState([
    {
      id: "1",
      name: "Hot Desk Area A",
      type: "Hot Desk",
      available: true,
      price: "$15/hour",
      amenities: ["Wifi", "Coffee", "Printing"],
    },
    {
      id: "2",
      name: "Phone Booth 2",
      type: "Private",
      available: true,
      price: "$8/hour",
      amenities: ["Wifi", "Privacy"],
    },
    {
      id: "3",
      name: "Meeting Room B",
      type: "Conference",
      available: false,
      price: "$25/hour",
      amenities: ["Wifi", "Projector", "Whiteboard"],
    },
  ]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    setUserMetrics({
      upcomingBookings: 3,
      totalBookings: 24,
      creditsRemaining: 15,
      membershipDays: 127,
      favoriteSpaces: 4,
      hoursThisMonth: 42,
    });
  }, []);

  const handleBookSpace = () => {
    console.log("Navigate to space booking");
  };

  const handleViewBookings = () => {
    console.log("Navigate to my bookings");
  };

  const handleManageProfile = () => {
    console.log("Navigate to profile management");
  };

  const handleViewBilling = () => {
    console.log("Navigate to billing");
  };

  const handleFindSpaces = () => {
    console.log("Navigate to space directory");
  };

  const handleViewHistory = () => {
    console.log("Navigate to booking history");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-3 w-3" />;
      case "coffee":
        return <Coffee className="h-3 w-3" />;
      case "parking":
        return <Car className="h-3 w-3" />;
      case "privacy":
        return <User className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  return (
    <EndUserOnly>
      <div className={`space-y-8 ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Workspace</h1>
            <p className="text-gray-600">
              Manage your bookings and explore available spaces
            </p>
          </div>
          <Button onClick={handleBookSpace} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Book Space
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricWidget
            title="Upcoming Bookings"
            value={userMetrics.upcomingBookings}
            description="Next 7 days"
            icon={<Calendar className="h-4 w-4" />}
          />

          <MetricWidget
            title="Credits Remaining"
            value={userMetrics.creditsRemaining}
            description="This month"
            icon={<CreditCard className="h-4 w-4" />}
          />

          <MetricWidget
            title="Hours This Month"
            value={userMetrics.hoursThisMonth}
            description="Workspace usage"
            icon={<Clock className="h-4 w-4" />}
          />

          <MetricWidget
            title="Membership Days"
            value={userMetrics.membershipDays}
            description="Since joining"
            icon={<User className="h-4 w-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionWidget
              title="Book a Space"
              description="Find and reserve workspace"
              icon={<Calendar className="h-6 w-6" />}
              onClick={handleBookSpace}
            />

            <QuickActionWidget
              title="My Bookings"
              description="View and manage reservations"
              icon={<BookOpen className="h-6 w-6" />}
              onClick={handleViewBookings}
            />

            <QuickActionWidget
              title="Explore Spaces"
              description="Browse available workspaces"
              icon={<MapPin className="h-6 w-6" />}
              onClick={handleFindSpaces}
            />

            <QuickActionWidget
              title="Profile Settings"
              description="Update your information"
              icon={<User className="h-6 w-6" />}
              onClick={handleManageProfile}
            />

            <QuickActionWidget
              title="Billing & Plans"
              description="Manage subscription and payments"
              icon={<CreditCard className="h-6 w-6" />}
              onClick={handleViewBilling}
            />

            <QuickActionWidget
              title="Booking History"
              description="View past reservations"
              icon={<Eye className="h-6 w-6" />}
              onClick={handleViewHistory}
            />
          </div>
        </div>

        {/* Upcoming Bookings and Available Spaces */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{booking.spaceName}</p>
                        <p className="text-sm text-gray-600">
                          {booking.date} • {booking.time}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
                {upcomingBookings.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No upcoming bookings
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Available Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableSpaces.map((space) => (
                  <div
                    key={space.id}
                    className={`p-3 rounded-lg border ${
                      space.available
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{space.name}</p>
                        <p className="text-sm text-gray-600">
                          {space.type} • {space.price}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          space.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {space.available ? "Available" : "Occupied"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {space.amenities.map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-xs text-gray-500"
                        >
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="Usage Patterns"
            description="Your workspace usage over time"
          >
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Usage chart would go here</p>
                <p className="text-sm">
                  Shows your booking patterns and preferences
                </p>
              </div>
            </div>
          </ChartWidget>

          <ActivityFeedWidget
            activities={recentActivity}
            title="Recent Activity"
            maxItems={5}
          />
        </div>

        {/* Membership Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Membership Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Premium</div>
                <p className="text-sm text-gray-600">Current Plan</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userMetrics.creditsRemaining}
                </div>
                <p className="text-sm text-gray-600">Credits Remaining</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  Jan 15, 2025
                </div>
                <p className="text-sm text-gray-600">Next Billing Date</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Upgrade to Enterprise</p>
                  <p className="text-sm text-gray-600">
                    Get unlimited access and priority booking
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EndUserOnly>
  );
}
