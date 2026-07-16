export interface UserNode {
    userId: string;
    fullName: string;
    packageUSD: number;
    isSplitSponsor?: boolean;
    originalSponsorId?: string;
    children: UserNode[];
    childrenCount?: number;
    activityStatus?: 'Active' | 'Inactive';
    email?: string;
    dateJoined?: string;
}

export interface ParentNode {
    userId: string;
    fullName:string;
}

export interface KycDocument {
    docType: 'LEGAL_AGREEMENT' | 'ID_FRONT' | 'ID_BACK' | 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'PAN' | 'BANK_PROOF' | 'RECENT_ADDRESS' | 'PHOTO_VERIFICATION' | 'CONSTITUTIONAL_DOCS' | 'AUTHORITY_DOC' | 'OWNERSHIP_CHART' | 'SOURCE_OF_FUNDS' | 'TAX_RESIDENCY' | 'GOLD_INVOICE_CUSTODY' | 'OTHER';
    url: string;
    kycVersion?: string;
    documentPassword?: string;
}

export interface KycStatus {
  status: 'NOT_SUBMITTED' | 'REQUIRES_REKYC' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycVersion?: string;
  applicantType?: 'INDIVIDUAL' | 'ENTITY';
  entityType?: string;
  documents: {
    docType: string;
    url: string;
    kycVersion?: string;
    documentPassword?: string;
    uploadedAt: string;
  }[];
  rejectionReason?: string;
}

export interface CourseSummary {
  _id: string;
  title: string;
  description: string;
  price: number;
  whatYoullLearn: string[];
  goal: string;
  instructor: string;
  rating: number;
  studentsEnrolled: number;
  lastUpdated: string;
  language: string;
  skillLevel: string;
  lecturesCount: number;
  totalVideoDuration: string;
  isLocked: boolean;
  isPublished: boolean;
  accessStatus: 'unlocked' | 'next_locked' | 'locked';
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  videoUrl: string;
  content: string;
  durationSeconds?: number;
}

export interface LessonProgress {
  lessonId: string;
  watchedSeconds: number;
  completed: boolean;
}

export interface Module {
  _id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseDetails extends CourseSummary {
  whatYoullLearn: string[];
  requirements: string[];
  whoIsThisFor: string[];
  modules: Module[];
}

export interface QueuedUser {
    userId: string;
    fullName: string;
    email: string;
    dateJoined: string;
}

export interface Recipient {
    userId: string;
    /** Optional Fancy ID like "u99999" or "tiger" the user has purchased.
     *  Recipients can be searched/selected by this too. */
    fancyId?: string | null;
    fullName: string;
    packageUSD?: number;
    roiPlanType?: 'old' | 'new';
}

export interface Reward {
  _id: string;
  userId: string;
  programId: string;
  tierId: string;
  type: 'self' | 'team';
  currentValueUSD: number;
  isEligible: boolean;
  claimStatus: 'NONE' | 'PENDING' | 'DOCUMENTS_REQUIRED' | 'DOCUMENTS_PENDING' | 'COMPLETED';
  isTransferred: boolean;
  transferredFrom: string | null;
  rewardSnapshot: {
    valueUSD: number;
    reward: string;
    numberOfTickets?: number;
  };
  requiredDocuments?: {
    docType: string;
    description: string;
  }[];
  uploadedDocuments?: {
    docType: string;
    url: string;
    ticketHolderNumber?: number;
  }[];
  rejectionReason?: string;
}
export interface RewardTier {
    reward: string;
    valueUSD: number;
    numberOfTickets?: number;
}

export interface RewardProgram {
    programId: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'locked';
    images?: {
        heroImageUrl?: string;
        squareImageUrl?: string;
    };
    selfBusinessTiers: RewardTier[];
    teamBusinessTiers: RewardTier[];
    ticketRedemptionTiers?: RewardTier[];
    performanceTiers?: RewardTier[];
}

// --- Expense Management ---

export interface ExpenseItem {
    _id: string;
    category: string;
    amount: number; // Converted to USD
    amountInLocalCurrency: number;
    currency: string;
    note?: string;
    fileUrl: string;
    addedAt: string;
}

export interface ExpenseTicket {
    _id: string;
    userId: string;
    description: string;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' | 'COMPLETED';
    items: ExpenseItem[];
    totalAmount: number;
    requestedAt: string;
    approvedAt?: string;
    submittedAt?: string;
    completedAt?: string;
    ticketId: string;
    rejectionReason?: string;
}
