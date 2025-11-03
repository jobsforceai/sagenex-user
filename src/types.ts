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
  status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  documents: {
    docType: string;
    url: string;
    uploadedAt: string;
  }[];
  rejectionReason?: string;
}

export interface CourseSummary {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  studentsEnrolled: number;
  lastUpdated: string;
  language: string;
  skillLevel: string;
  lecturesCount: number;
  totalVideoDuration: string;
  isLocked: boolean;
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
    fullName: string;
}

export interface Reward {
  _id: string;
  userId: string;
  offerId: string;
  currentValueUSD: number;
  isEligible: boolean;
  isClaimed: boolean;
  claimStatus: 'NONE' | 'PENDING' | 'DOCUMENTS_REQUIRED' | 'DOCUMENTS_PENDING' | 'COMPLETED';
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
  requiredDocuments?: {
    docType: string;
    description: string;
  }[];
  uploadedDocuments?: {
    docType: string;
    url: string;
  }[];
  rejectionReason?: string;
}
