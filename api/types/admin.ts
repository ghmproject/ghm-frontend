export type PendingMealDto = {
  id: number;
  dishName: string;
  price: number;
  cuisine: string | null;
  status: string;
  image: string | null;
  restaurant: {
    id: number;
    name: string;
    suburb: string;
  };
};

export type PendingMealsResponse = {
  success: boolean;
  data: PendingMealDto[];
};

export type ModerationActionResponse = {
  success: boolean;
  message: string;
};


export type ImportCsvResponse = {
  success: boolean;
  message: string;
  restaurantsCreated?: number;
  mealsCreated?: number;
  skippedRows?: number;
};

export type MealReportDto = {
  id: number;
  mealId: number;
  reason: string;
  createdAt: string;
};

export type ReportedMealDto = {
  id: number;
  dishName: string;
  price: number;
  cuisine: string | null;
  status: string;
  isHidden: boolean;
  hiddenAt: string | null;
  image: string | null;
  restaurant: {
    id: number;
    name: string;
    suburb: string;
  };
  reports: MealReportDto[];
};

export type ReportedMealsResponse = {
  success: boolean;
  count?: number;
  data: ReportedMealDto[];
};
