"use client";

import React, { useState, useMemo } from "react";
import { Grid, List, SlidersHorizontal } from "lucide-react";
import { Space, SearchFilters } from "@/types/spaces";
import { SpaceCard } from "./space-card";
import { SpaceSearch } from "./space-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SpaceBrowserProps {
  spaces: Space[];
  onSpaceSelect?: (space: Space) => void;
  onSpaceBook?: (space: Space) => void;
  onSpaceFavorite?: (spaceId: string) => void;
  onSpaceShare?: (space: Space) => void;
  className?: string;
}

type SortOption = "name" | "price" | "capacity" | "rating" | "availability";
type ViewMode = "grid" | "list";

export function SpaceBrowser({
  spaces,
  onSpaceSelect,
  onSpaceBook,
  onSpaceFavorite,
  onSpaceShare,
  className,
}: SpaceBrowserProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort spaces
  const filteredAndSortedSpaces = useMemo(() => {
    let filtered = spaces;

    // Apply search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (space) =>
          space.name.toLowerCase().includes(query) ||
          space.description.toLowerCase().includes(query) ||
          space.location.building.toLowerCase().includes(query) ||
          space.location.city.toLowerCase().includes(query)
      );
    }

    // Apply space type filter
    if (filters.spaceTypes && filters.spaceTypes.length > 0) {
      filtered = filtered.filter((space) =>
        filters.spaceTypes!.includes(space.type)
      );
    }

    // Apply capacity filter
    if (filters.minCapacity) {
      filtered = filtered.filter(
        (space) => space.capacity >= filters.minCapacity!
      );
    }
    if (filters.maxCapacity) {
      filtered = filtered.filter(
        (space) => space.capacity <= filters.maxCapacity!
      );
    }

    // Apply price filter
    if (filters.minPrice) {
      filtered = filtered.filter(
        (space) => space.pricing.hourlyRate >= filters.minPrice!
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (space) => space.pricing.hourlyRate <= filters.maxPrice!
      );
    }

    // Apply amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter((space) =>
        filters.amenities!.some((amenityId) =>
          space.amenities.some((amenity) => amenity.id === amenityId)
        )
      );
    }

    // Apply floor filter
    if (filters.floor && filters.floor.length > 0) {
      filtered = filtered.filter((space) =>
        filters.floor!.includes(space.floor)
      );
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(
        (space) => space.rating.average >= filters.rating!
      );
    }

    // Sort spaces
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.pricing.hourlyRate - b.pricing.hourlyRate;
        case "capacity":
          return b.capacity - a.capacity;
        case "rating":
          return b.rating.average - a.rating.average;
        case "availability":
          if (a.availability.isAvailable && !b.availability.isAvailable)
            return -1;
          if (!a.availability.isAvailable && b.availability.isAvailable)
            return 1;
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [spaces, filters, sortBy]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.spaceTypes?.length) count++;
    if (filters.minCapacity || filters.maxCapacity) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.amenities?.length) count++;
    if (filters.floor?.length) count++;
    if (filters.rating) count++;
    return count;
  }, [filters]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and Filters Header */}
      <div className="space-y-4">
        <SpaceSearch
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
          className="w-full"
        />

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Filter Toggle and Active Filters */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "transition-colors duration-150",
                showFilters &&
                  "bg-brand-blue-pale border-brand-blue text-brand-blue"
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-brand-blue text-white text-caption px-1.5 py-0.5 min-w-[20px] h-5"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-neutral-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-body-sm border border-neutral-200 rounded-6 px-3 py-1.5 bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all duration-150"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="capacity">Capacity</option>
                <option value="rating">Rating</option>
                <option value="availability">Availability</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-neutral-200 rounded-6 p-1 bg-white">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "transition-all duration-150",
                  viewMode === "grid"
                    ? "bg-brand-blue text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "transition-all duration-150",
                  viewMode === "list"
                    ? "bg-brand-blue text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-body text-neutral-600">
          {filteredAndSortedSpaces.length === 0 ? (
            "No spaces found"
          ) : (
            <>
              Showing {filteredAndSortedSpaces.length} of {spaces.length} spaces
              {activeFilterCount > 0 && " (filtered)"}
            </>
          )}
        </div>
      </div>

      {/* Spaces Grid/List */}
      {filteredAndSortedSpaces.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center">
            <Grid className="w-8 h-8 text-neutral-400 dark:text-dark-text-secondary" />
          </div>
          <h3 className="text-h4 text-neutral-900 dark:text-dark-text-primary mb-2">
            No spaces found
          </h3>
          <p className="text-body text-neutral-500 dark:text-dark-text-secondary mb-4 max-w-md mx-auto">
            Try adjusting your search criteria or filters to find the perfect
            workspace.
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}
        >
          {filteredAndSortedSpaces.map((space, index) => (
            <div
              key={space.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SpaceCard
                space={space}
                viewMode={viewMode}
                onFavorite={onSpaceFavorite}
                onShare={onSpaceShare}
                onBook={onSpaceBook}
                className="cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Load More / Pagination Placeholder */}
      {filteredAndSortedSpaces.length > 0 && (
        <div className="text-center pt-8">
          <Button variant="outline" className="animate-fade-in">
            Load more spaces
          </Button>
        </div>
      )}
    </div>
  );
}
