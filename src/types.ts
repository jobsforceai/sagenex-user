export interface UserNode {
  userId: string;
  fullName: string;
  packageUSD: number;
  isSplitSponsor: boolean;
  originalSponsorId: string;
  children: UserNode[];
}

export interface ParentNode {
  userId: string;
  fullName: string;
}
