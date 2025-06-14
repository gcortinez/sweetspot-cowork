"use client";

import React from "react";
import { SpaceBrowser } from "@/components/spaces/space-browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Building2, Users, Calendar, TrendingUp } from "lucide-react";
import { MOCK_SPACES } from "@/lib/mock-data/spaces";
import { Space } from "@/types/spaces";

const SpacesPage: React.FC = () => {
  const handleSpaceSelect = (space: Space) => {
    console.log("Selecting space:", space.name);
    // TODO: Navigate to space details page
  };

  const handleSpaceBook = (space: Space) => {
    console.log("Booking space:", space.name);
    // TODO: Implement booking flow
  };

  const handleSpaceFavorite = (spaceId: string) => {
    console.log("Toggling favorite for space:", spaceId);
    // TODO: Implement favorite functionality
  };

  const handleSpaceShare = (space: Space) => {
    console.log("Sharing space:", space.name);
    // TODO: Implement share functionality
  };

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h1 font-semibold text-gray-900">Spaces</h1>
              <p className="text-body text-gray-600 mt-1">
                Discover and book the perfect workspace for your needs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary">View Calendar</Button>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Book Space
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-brand-light flex items-center justify-center">
                <Building2 className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">24</p>
                <p className="text-body-sm text-gray-600">Total Spaces</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-green-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">18</p>
                <p className="text-body-sm text-gray-600">Available Now</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-yellow-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">6</p>
                <p className="text-body-sm text-gray-600">Booked Today</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-12 bg-purple-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-h3 font-semibold text-gray-900">85%</p>
                <p className="text-body-sm text-gray-600">Utilization</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Space Browser */}
        <div className="bg-surface-primary rounded-12 border border-gray-200 shadow-card">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-h3 font-semibold text-gray-900">
              Browse Spaces
            </h2>
            <p className="text-body text-gray-600 mt-1">
              Find the perfect workspace for your team or event
            </p>
          </div>
          <div className="p-6">
            <SpaceBrowser
              spaces={MOCK_SPACES}
              onSpaceSelect={handleSpaceSelect}
              onSpaceBook={handleSpaceBook}
              onSpaceFavorite={handleSpaceFavorite}
              onSpaceShare={handleSpaceShare}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpacesPage;
