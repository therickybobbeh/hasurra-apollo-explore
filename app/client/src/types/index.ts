export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  npi: string;
  name: string;
  specialty: string;
}

export type ClaimStatus = 'PAID' | 'DENIED' | 'PENDING';

export interface Claim {
  id: string;
  member_id: string;
  provider_id: string;
  dos: string;
  cpt: string;
  charge_cents: number;
  allowed_cents: number;
  status: ClaimStatus;
  denial_reason?: string | null;
  created_at: string;
  updated_at: string;
  member?: Member;
  provider?: Provider;
}

export interface Note {
  id: string;
  member_id: string;
  created_at: string;
  body: string;
}

export interface EligibilityCheck {
  id: string;
  member_id: string;
  checked_at: string;
  result: any;
  created_at: string;
}

export interface ClaimsFilter {
  status?: ClaimStatus;
  startDate?: string;
  endDate?: string;
}
