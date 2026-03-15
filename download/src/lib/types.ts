export interface User {
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  collegeId?: string;
  isBlocked: boolean;
  avatarUrl?: string;
  id: string;
}

export interface Visit {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  purposeOfVisit: string;
  collegeId: string;
}

export interface College {
  id: string;
  name: string;
}
