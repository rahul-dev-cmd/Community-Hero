export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export type IssueStatus = "REPORTED" | "IN_PROGRESS" | "RESOLVED";

export interface CaseHistoryEntry {
  action: string;
  timestamp: number;
}

export interface Issue {
  id: string;
  incidentType: string;
  location: Location;
  description: string;
  imageDataUrl?: string;
  videoDataUrl?: string;
  status: IssueStatus;
  createdAt: number;
  verificationsCount?: number;
  verifiedBy?: string[]; // user ips or IDs
  aiCategory?: string;
  aiSeverity?: "LOW" | "MEDIUM" | "HIGH" | "Low" | "Medium" | "High";
  aiSummary?: string;
  verifyCount?: number;
  confirmedBy?: string[];
  caseHistory?: CaseHistoryEntry[];
  reporterSessionId?: string;
  city?: string;
  votes?: number;
  votedBy?: string[];
}
