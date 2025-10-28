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
