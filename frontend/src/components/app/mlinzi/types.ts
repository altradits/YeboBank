export type MlinziSection =
  | "overview"
  | "onboard-investor"
  | "onboard-beneficiary"
  | "onboard-manager"
  | "investments"
  | "projects"
  | "managers"
  | "trips"
  | "treasury"
  | "admin";

export interface MlinziProject {
  id: string;
  name: string;
  beneficiaryName: string;
  businessType: string;
  location: string;
  fundedAmountUsd: number;
  targetAmountUsd: number;
  currentMonthlyRevenueUsd: number;
  projectedRevenueUsd: number;
  inventoryTurnover: number;
  stockLevelPct: number;
  reorderAlert: boolean;
  salesVsProjectionPct: number;
  nextMilestoneDate: string;
  posCount30d: number;
  status: "pending_review" | "visit_scheduled" | "visit_verified" | "funded" | "active";
  visitDate?: string;
  visitCompleted?: boolean;
  visitReportName?: string;
  grantEligibilityScore: number;
  proofMedia: { type: "photo" | "video"; title: string; url: string }[];
}

export interface FundManagerProfile {
  id: string;
  fullName: string;
  country: string;
  expertise: string;
  aumRange: string;
  strategyDescription: string;
  trackRecordUrl: string;
  verifiedReturn12m: number;
  status: "verified" | "pending";
}

export interface VolunteerTrip {
  id: string;
  title: string;
  location: string;
  dates: string;
  focus: string;
  image: string;
  slotsRemaining: number;
  logisticsDonationTargetUsd: number;
  logisticsDonationRaisedUsd: number;
}
