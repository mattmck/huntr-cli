// Personal API types (for /api endpoints with Clerk auth)

export interface Board {
  id: string;
  _id: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
  lists?: BoardList[];
}

export interface BoardList {
  id: string;
  _id: string;
  name: string;
  order?: number;
}

// Company as returned inside job action data
export interface JobCompany {
  _id: string;
  id: string;
  name: string;
  color?: string;
}

// Job as returned by /api/board/{boardId}/jobs — keyed object map
export interface PersonalJob {
  _id: string;
  id: string;
  title: string;
  url?: string;
  rootDomain?: string;
  htmlDescription?: string;
  _company: string; // company ID ref
  _list?: string;
  _board: string;
  _activities?: string[];
  _notes?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  location?: {
    address?: string;
    name?: string;
    url?: string;
    lat?: string;
    lng?: string;
  };
  createdAt: string;
  updatedAt?: string;
  lastMovedAt?: string;
}

// Jobs response is an object map { [jobId]: PersonalJob }
export interface PersonalJobsResponse {
  jobs: Record<string, PersonalJob>;
}

// Action as returned by /api/board/{boardId}/actions — keyed object map
export interface PersonalAction {
  _id: string;
  id: string;
  actionType: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
  data: {
    _job?: string;
    _company?: string;
    _board?: string;
    _fromList?: string;
    _toList?: string;
    note?: ActionNote | null;
    job?: { _id: string; id: string; title: string };
    company?: JobCompany;
    fromList?: { _id: string; id: string; name: string } | null;
    toList?: { _id: string; id: string; name: string } | null;
    activity?: unknown;
    activityCategory?: unknown;
    contact?: unknown;
  };
}

export interface ActionNote {
  _id: string;
  id: string;
  text: string;
}

export interface PersonalActivity {
  id: string;
  _id: string;
  title?: string;
  note?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  jobId?: string;
  boardId?: string;
}

export interface UserProfile {
  id: string;
  _id?: string;
  email: string;
  givenName?: string;
  familyName?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}
