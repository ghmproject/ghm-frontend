"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/inspector";
import { getListing } from "@/api/routes/listings.api";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { RestaurantDetailScreen } from "@/features/restaurants/components/RestaurantDetailScreen";
import { getSoonestActiveDeal } from "@/features/restaurants/utils/hotDeal";
import { mapRestaurantDetail } from "@/features/restaurants/utils/mapRestaurantDetail";
import { formatPriceCompact } from "@/lib/utils/formatCurrency";

function resolveInitialMealId(
  detail: NonNullable<ReturnType<typeof mapRestaurantDetail>>,
  routeId: string,
  mealParam?: string,
): number {
  const candidates = [mealParam, routeId]
    .filter(Boolean)
    .map((v) => Number.parseInt(v!, 10));
  for (const parsed of candidates) {
    if (Number.isFinite(parsed) && detail.meals.some((m) => m.mealId === parsed)) {
      return parsed;
    }
  }
  const soonest = getSoonestActiveDeal(detail.meals);
  return soonest?.mealId ?? detail.meals[0]!.mealId;
}

export default function RestaurantDetailPage() {
  const searchParams = useSearchParams();
  const id = String(searchParams.get("id") ?? "");
  const mealParam = searchParams.get("meal") ?? undefined;

  const query = useQuery({
    queryKey: ["restaurant-detail", id],
    queryFn: async () => {
      try {
        const res = await getListing(id);
        if (!res.success || !res.data) return null;
        return mapRestaurantDetail(res.data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const detail = query.data ?? null;

  const initialMealId = useMemo(() => {
    if (!detail) return undefined;
    return resolveInitialMealId(detail, id, mealParam);
  }, [detail, id, mealParam]);

  useEffect(() => {
    if (!detail) return;
    const meal = detail.meals.find((m) => m.mealId === initialMealId) ?? detail.meals[0]!;
    document.title = `${detail.name} · ${formatPriceCompact(meal.price)} · ${siteConfig.name}`;
  }, [detail, initialMealId]);

  if (!id) {
    return (
      <div className="mx-auto flex min-h-[50dvh] w-full max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-neutral-700">Restaurant not found.</p>
        <Link href={routes.map} className="text-sm font-semibold text-[#FF5722]">
          Back to map
        </Link>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto flex min-h-[50dvh] w-full max-w-lg items-center justify-center px-4">
        <p className="text-sm font-medium text-neutral-500">Loading restaurant…</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto flex min-h-[50dvh] w-full max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-neutral-700">Could not load this restaurant.</p>
        <Link href={routes.map} className="text-sm font-semibold text-[#FF5722]">
          Back to map
        </Link>
      </div>
    );
  }

  if (!detail || initialMealId == null) {
    return (
      <div className="mx-auto flex min-h-[50dvh] w-full max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm font-medium text-neutral-700">Restaurant not found.</p>
        <Link href={routes.map} className="text-sm font-semibold text-[#FF5722]">
          Back to map
        </Link>
      </div>
    );
  }

  return <RestaurantDetailScreen detail={detail} initialMealId={initialMealId} />;
}
