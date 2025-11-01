export interface UserNode {
    userId: string;
    fullName: string;
    packageUSD: number;
    isSplitSponsor?: boolean;
    originalSponsorId?: string;
    children: UserNode[];
}

export interface ParentNode {
    userId: string;
    fullName:string;
}

export interface KycDocument {
    docType: 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'PAN' | 'OTHER';
    url: string;
}

export interface KycStatus {
    _id?: string;
    userId: string;
    status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    documents: KycDocument[];
    submittedAt?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;
}

export interface QueuedUser {
    userId: string;
    fullName: string;
    email: string;
    dateJoined: string;
}

export interface Recipient {
    userId: string;
    fullName: string;
}

export interface Reward {
  _id: string;
  userId: string;
  offerId: string;
  currentValueUSD: number;
  isEligible: boolean;
  isClaimed: boolean;
  claimStatus: 'NONE' | 'PENDING' | 'COMPLETED';
  isTransferred: boolean;
  transferredFrom: string | null;
  transferredTo: string | null;
  offerSnapshot: {
    id: string;
    name: string;
    valueUSD: number;
    reward: string;
    type: 'personal' | 'downline';
  };
  createdAt: string;
  updatedAt: string;
  claimedAt?: string;
}
