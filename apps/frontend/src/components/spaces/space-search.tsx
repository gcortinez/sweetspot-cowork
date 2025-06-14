"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Calendar, Users, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { SpaceType, SPACE_TYPES, COMMON_AMENITIES } from "@/types/spaces";

interface SpaceSearchFilters {
  query: string;
  spaceType: SpaceType | "all";
  capacity: number;
  priceRange: [number, number];
  amenities: string[];
  rating: number;
  availableDate: Date | null;
  startTime: string;
  endTime: string;
}

interface SpaceSearchProps {
  onFiltersChange: (filters: SpaceSearchFilters) => void;
  initialFilters?: Partial<SpaceSearchFilters>;
  className?: string;
}

const defaultFilters: SpaceSearchFilters = {
  query: "",
  spaceType: "all",
  capacity: 1,
  priceRange: [0, 500],
  amenities: [],
  rating: 0,
  availableDate: null,
  startTime: "09:00",
  endTime: "17:00",
};

export const SpaceSearch = ({
  onFiltersChange,
  initialFilters,
  className,
}: SpaceSearchProps) => {
  const [filters, setFilters] = useState<SpaceSearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof SpaceSearchFilters>(
    key: K,
    value: SpaceSearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "query") return value !== "";
    if (key === "spaceType") return value !== "all";
    if (key === "capacity") return value > 1;
    if (key === "priceRange") return value[0] > 0 || value[1] < 500;
    if (key === "amenities") return Array.isArray(value) && value.length > 0;
    if (key === "rating") return value > 0;
    if (key === "availableDate") return value !== null;
    return false;
  }).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search spaces by name, description, or tags..."
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Space Type */}
              <div className="space-y-2">
                <Label>Space Type</Label>
                <Select
                  value={filters.spaceType}
                  onValueChange={(value) =>
                    updateFilter("spaceType", value as SpaceType | "all")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(SPACE_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label>Minimum Capacity</Label>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <Slider
                    value={[filters.capacity]}
                    onValueChange={([value]) => updateFilter("capacity", value)}
                    max={50}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">
                    {filters.capacity}
                  </span>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Hourly Rate Range</Label>
                <div className="space-x-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) =>
                      updateFilter("priceRange", value as [number, number])
                    }
                    max={500}
                    min={0}
                    step={5}
                    className="flex-1"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-gray-400" />
                  <Slider
                    value={[filters.rating]}
                    onValueChange={([value]) => updateFilter("rating", value)}
                    max={5}
                    min={0}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">
                    {filters.rating}
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {COMMON_AMENITIES.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={amenity.id}
                        checked={filters.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <Label
                        htmlFor={amenity.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {amenity.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.spaceType === "hot_desk" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            updateFilter(
              "spaceType",
              filters.spaceType === "hot_desk" ? "all" : "hot_desk"
            )
          }
        >
          Hot Desks
        </Button>
        <Button
          variant={filters.spaceType === "meeting_room" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            updateFilter(
              "spaceType",
              filters.spaceType === "meeting_room" ? "all" : "meeting_room"
            )
          }
        >
          Meeting Rooms
        </Button>
        <Button
          variant={
            filters.spaceType === "private_office" ? "default" : "outline"
          }
          size="sm"
          onClick={() =>
            updateFilter(
              "spaceType",
              filters.spaceType === "private_office" ? "all" : "private_office"
            )
          }
        >
          Private Offices
        </Button>
        <Button
          variant={filters.amenities.includes("wifi") ? "default" : "outline"}
          size="sm"
          onClick={() => toggleAmenity("wifi")}
        >
          WiFi
        </Button>
        <Button
          variant={
            filters.amenities.includes("projector") ? "default" : "outline"
          }
          size="sm"
          onClick={() => toggleAmenity("projector")}
        >
          Projector
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.query}"
              <button
                onClick={() => updateFilter("query", "")}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.spaceType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {SPACE_TYPES[filters.spaceType as SpaceType].label}
              <button
                onClick={() => updateFilter("spaceType", "all")}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.capacity > 1 && (
            <Badge variant="secondary" className="gap-1">
              Min {filters.capacity} people
              <button
                onClick={() => updateFilter("capacity", 1)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.amenities.map((amenityId) => {
            const amenity = COMMON_AMENITIES.find((a) => a.id === amenityId);
            return amenity ? (
              <Badge key={amenityId} variant="secondary" className="gap-1">
                {amenity.name}
                <button
                  onClick={() => toggleAmenity(amenityId)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
