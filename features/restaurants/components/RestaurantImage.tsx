"use client";

import Image from "next/image";

import { cn } from "@/lib/utils/cn";

type RestaurantImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function RestaurantImage({
  src,
  alt,
  className,
  sizes = "96px",
  priority = false,
}: RestaurantImageProps) {
  const url = src?.trim();
  if (!url) return null;

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      className={cn("object-cover", className)}
    />
  );
}
