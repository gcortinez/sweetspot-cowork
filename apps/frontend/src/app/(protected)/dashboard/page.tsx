"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Star,
} from "lucide-react";

const DashboardPage: React.FC = () => {
  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h1 font-semibold text-gray-900">Dashboard</h1>
              <p className="text-body text-gray-600 mt-1">
                Welcome back! Here's what's happening with your workspace.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary">View Reports</Button>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                New Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-brand-light flex items-center justify-center">
                <Calendar className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">12</p>
                <p className="text-body-sm text-gray-600">Today's Bookings</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-caption text-green-600">+15%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-green-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">248</p>
                <p className="text-body-sm text-gray-600">Active Members</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-caption text-green-600">+8%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-yellow-50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">18/24</p>
                <p className="text-body-sm text-gray-600">Spaces Occupied</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-caption text-gray-600">
                    75% utilization
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">$12,450</p>
                <p className="text-body-sm text-gray-600">Monthly Revenue</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-caption text-green-600">+22%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-h3 font-semibold text-gray-900">
                    Recent Bookings
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    View all
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      space: "Executive Office A",
                      member: "Sarah Johnson",
                      time: "9:00 AM - 5:00 PM",
                      status: "confirmed",
                      avatar: "SJ",
                    },
                    {
                      id: 2,
                      space: "Meeting Room B",
                      member: "Tech Team",
                      time: "2:00 PM - 4:00 PM",
                      status: "in-progress",
                      avatar: "TT",
                    },
                    {
                      id: 3,
                      space: "Hot Desk #12",
                      member: "Mike Chen",
                      time: "10:00 AM - 6:00 PM",
                      status: "confirmed",
                      avatar: "MC",
                    },
                    {
                      id: 4,
                      space: "Phone Booth 3",
                      member: "Lisa Park",
                      time: "1:00 PM - 1:30 PM",
                      status: "completed",
                      avatar: "LP",
                    },
                  ].map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-3 rounded-8 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center">
                        <span className="text-caption font-medium text-white">
                          {booking.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium text-gray-900 truncate">
                          {booking.space}
                        </p>
                        <p className="text-body-sm text-gray-600">
                          {booking.member}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-body-sm text-gray-900">
                          {booking.time}
                        </p>
                        <div className="flex justify-end mt-1">
                          {booking.status === "confirmed" && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          )}
                          {booking.status === "in-progress" && (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                          {booking.status === "completed" && (
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-h4 font-semibold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <Button className="w-full justify-start" variant="ghost">
                  <Calendar className="h-4 w-4 mr-3" />
                  Schedule a Tour
                </Button>
                <Button className="w-full justify-start" variant="ghost">
                  <Users className="h-4 w-4 mr-3" />
                  Add New Member
                </Button>
                <Button className="w-full justify-start" variant="ghost">
                  <Building2 className="h-4 w-4 mr-3" />
                  Manage Spaces
                </Button>
                <Button className="w-full justify-start" variant="ghost">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  View Analytics
                </Button>
              </div>
            </Card>

            {/* Alerts */}
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-h4 font-semibold text-gray-900">Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-8 bg-yellow-50 border border-yellow-200">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-body-sm font-medium text-yellow-800">
                      Maintenance Scheduled
                    </p>
                    <p className="text-caption text-yellow-700">
                      Meeting Room A will be unavailable tomorrow 2-4 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-8 bg-blue-50 border border-blue-200">
                  <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-body-sm font-medium text-blue-800">
                      New Review
                    </p>
                    <p className="text-caption text-blue-700">
                      Executive Office received a 5-star rating
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
