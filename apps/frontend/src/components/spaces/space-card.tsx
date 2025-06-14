"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Users,
  Star,
  Clock,
  Wifi,
  Monitor,
  Coffee,
  Car,
  Heart,
  Share2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Space, SPACE_TYPES, Amenity } from "@/types/spaces";
import { cn } from "@/lib/utils";

interface SpaceCardProps {
  space: Space;
  viewMode?: "grid" | "list";
  onFavorite?: (spaceId: string) => void;
  onShare?: (space: Space) => void;
  onBook?: (space: Space) => void;
  className?: string;
}

const amenityIcons = {
  wifi: Wifi,
  coffee: Coffee,
  parking: Car,
  meeting_room: Users,
  printer: Users,
  kitchen: Coffee,
  phone_booth: Users,
  lockers: Users,
  reception: Users,
  security: Users,
};

export function SpaceCard({
  space,
  viewMode = "grid",
  onFavorite,
  onShare,
  onBook,
  className,
}: SpaceCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const primaryImage =
    space.images.find((img) => img.isPrimary) || space.images[0];
  const spaceTypeInfo = SPACE_TYPES[space.type];

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.(space.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(space);
  };

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook?.(space);
  };

  const isAvailable = space.status === "available";
  const isGridView = viewMode === "grid";

  return (
    <div
      className={cn(
        "group relative overflow-hidden transition-all duration-200 ease-out animate-fade-in",
        "bg-white border border-neutral-200 shadow-card hover:shadow-card-hover",
        "dark:bg-dark-surface dark:border-dark-border dark:shadow-dark-card",
        isGridView ? "rounded-8 flex flex-col" : "rounded-6 flex flex-row",
        !isAvailable && "opacity-75",
        className
      )}
      role="article"
      aria-label={`${space.name} - ${space.type}`}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative overflow-hidden",
          isGridView ? "aspect-[4/3] w-full" : "w-48 h-32 flex-shrink-0"
        )}
      >
        {primaryImage && !imageError ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes={
              isGridView
                ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                : "192px"
            }
          />
        ) : (
          <div className="w-full h-full bg-neutral-100 dark:bg-dark-bg-tertiary flex items-center justify-center">
            <div className="text-neutral-400 dark:text-dark-text-secondary text-center">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <span className="text-body-sm">No image</span>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={isAvailable ? "default" : "secondary"}
            className={cn(
              "text-caption font-medium",
              isAvailable
                ? "bg-functional-success/90 text-white border-0"
                : "bg-neutral-500/90 text-white border-0"
            )}
          >
            {space.status}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleFavorite}
            className="bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors duration-150",
                isFavorited
                  ? "fill-functional-error text-functional-error"
                  : "text-neutral-600"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleShare}
            className="bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
            aria-label="Share space"
          >
            <Share2 className="w-4 h-4 text-neutral-600" />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div
        className={cn(
          "flex flex-col justify-between",
          isGridView ? "p-6 flex-1" : "p-4 flex-1 min-w-0"
        )}
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-h5 font-semibold text-neutral-900 dark:text-dark-text-primary line-clamp-1">
                {space.name}
              </h3>
              <Badge variant="outline" className="text-caption shrink-0">
                {space.type.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-neutral-500 dark:text-dark-text-secondary">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-body-sm line-clamp-1">
                {space.location.building}, {space.location.city}
              </span>
            </div>
          </div>

          <p className="text-body text-neutral-600 dark:text-dark-text-secondary line-clamp-2">
            {space.description}
          </p>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2">
            {space.amenities
              .slice(0, isGridView ? 4 : 3)
              .map((amenity: Amenity) => {
                const IconComponent =
                  amenityIcons[amenity.id as keyof typeof amenityIcons] ||
                  Users;
                return (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-1 px-2 py-1 bg-neutral-50 dark:bg-dark-bg-tertiary rounded-6 text-caption text-neutral-600 dark:text-dark-text-secondary"
                    title={amenity.name}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span className="capitalize">{amenity.name}</span>
                  </div>
                );
              })}
            {space.amenities.length > (isGridView ? 4 : 3) && (
              <div className="flex items-center px-2 py-1 bg-neutral-50 dark:bg-dark-bg-tertiary rounded-6 text-caption text-neutral-500 dark:text-dark-text-secondary">
                +{space.amenities.length - (isGridView ? 4 : 3)} more
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 space-y-3">
          {/* Capacity and Pricing */}
          <div className="flex items-center justify-between text-body-sm">
            <div className="flex items-center gap-1 text-neutral-500 dark:text-dark-text-secondary">
              <Users className="w-4 h-4" />
              <span>Up to {space.capacity} people</span>
            </div>
            <div className="text-right">
              <span className="text-h5 font-semibold text-neutral-900 dark:text-dark-text-primary">
                ${space.pricing.hourlyRate}
              </span>
              <span className="text-body-sm text-neutral-500 dark:text-dark-text-secondary">
                /hour
              </span>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 text-body-sm text-neutral-500 dark:text-dark-text-secondary">
            <Clock className="w-4 h-4" />
            <span>
              {space.availability.isAvailable
                ? "Available today"
                : "Busy today"}
            </span>
            <Calendar className="w-4 h-4 ml-2" />
            <span>9:00 AM - 6:00 PM</span>
          </div>

          {/* Book Button */}
          <Button
            onClick={handleBook}
            disabled={!isAvailable}
            className="w-full"
            size={isGridView ? "default" : "sm"}
          >
            {isAvailable ? "Book Now" : "Unavailable"}
          </Button>
        </div>
      </div>
    </div>
  );
}
