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
  CardImage,
  CardBadge,
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
    <Card
      variant={isAvailable ? "default" : "outline"}
      interactive
      className={cn(
        "group overflow-hidden",
        isGridView ? "flex flex-col" : "flex flex-row",
        !isAvailable && "opacity-75",
        className
      )}
      role="article"
      aria-label={`${space.name} - ${space.type}`}
    >
      {/* Image Section */}
      {isGridView && primaryImage && (
        <CardImage
          src={primaryImage.url}
          alt={primaryImage.alt || space.name}
          aspectRatio="video"
        />
      )}
      
      {!isGridView && (
        <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden">
          {primaryImage && !imageError ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="192px"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-gray-400 dark:text-gray-600 text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs">No image</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Badge */}
      <CardBadge
        variant={isAvailable ? "success" : "default"}
        position="top-left"
      >
        {space.status === "available" ? "Disponible" : "Ocupado"}
      </CardBadge>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFavorite}
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
          aria-label={
            isFavorited ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors duration-150",
              isFavorited
                ? "fill-red-500 text-red-500"
                : "text-gray-600"
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
          aria-label="Share space"
        >
          <Share2 className="w-4 h-4 text-gray-600" />
        </Button>
      </div>

      {/* Content Section */}
      <div
        className={cn(
          "flex flex-col",
          isGridView ? "flex-1" : "flex-1 min-w-0"
        )}
      >
        <CardHeader className={!isGridView ? "p-4" : undefined}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {space.name}
              </h3>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-sm line-clamp-1">
                  {space.location.building}, {space.location.city}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {space.type.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={!isGridView ? "p-4 pt-0" : undefined}>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {space.description}
          </p>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {space.amenities
              .slice(0, isGridView ? 4 : 3)
              .map((amenity: Amenity) => {
                const IconComponent =
                  amenityIcons[amenity.id as keyof typeof amenityIcons] ||
                  Users;
                return (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-400"
                    title={amenity.name}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span className="capitalize">{amenity.name}</span>
                  </div>
                );
              })}
            {space.amenities.length > (isGridView ? 4 : 3) && (
              <div className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-500 dark:text-gray-400">
                +{space.amenities.length - (isGridView ? 4 : 3)} más
              </div>
            )}
          </div>

          {/* Capacity and Pricing */}
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>Hasta {space.capacity} personas</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ${space.pricing.hourlyRate}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                /hora
              </span>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {space.availability.isAvailable
                ? "Disponible hoy"
                : "Ocupado hoy"}
            </span>
            <Calendar className="w-4 h-4 ml-2" />
            <span>9:00 AM - 6:00 PM</span>
          </div>
        </CardContent>

        <CardFooter className={!isGridView ? "p-4 pt-0" : undefined}>
          <Button
            onClick={handleBook}
            disabled={!isAvailable}
            className="w-full"
            size={isGridView ? "default" : "sm"}
          >
            {isAvailable ? "Reservar Ahora" : "No Disponible"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
