export interface DemandPoint {
  readonly category: string;
  readonly searchVolume: number;
  readonly enrollVolume: number;
}

export interface TrendItem {
  readonly id: string;
  readonly keyword: string;
  readonly weeklyGrowth: number; // percent
  readonly relatedCourses: number;
  readonly source: string;
}

export interface PromotionSuggestion {
  readonly id: string;
  readonly title: string;
  readonly targetSegment: string;
  readonly expectedLift: string;
  readonly rationale: string;
}

export interface PlatformDashboard {
  readonly demand: ReadonlyArray<DemandPoint>;
  readonly trends: ReadonlyArray<TrendItem>;
  readonly promotions: ReadonlyArray<PromotionSuggestion>;
}
