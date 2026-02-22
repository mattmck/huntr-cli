export interface Advisor {
  id: string;
  fullName: string;
  givenName: string;
  familyName: string;
  email: string;
  createdAt: number;
  lastSeenAt?: number;
}

export interface Member {
  id: string;
  givenName: string;
  familyName: string;
  email: string;
  createdAt: number;
  isActive: boolean;
  advisor?: Advisor;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  salary?: Salary;
  employerName?: string;
  createdAt: number;
  member?: {
    id: string;
    givenName: string;
    familyName: string;
  };
}

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
}

export interface Activity {
  id: string;
  title: string;
  note?: string;
  createdAt: number;
  completedAt?: number;
  category?: {
    id: string;
    name: string;
  };
  member?: {
    id: string;
    givenName: string;
    familyName: string;
  };
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  next?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
