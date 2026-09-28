export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export type UserPublic = {
  id: string;
  email: string;
  emailVerified: boolean;
};

export type ProfilePublic = {
  name: string;
  mobile: string;
  address: string;
  businessName: string | null;
};

export type MeResponse = {
  user: UserPublic;
  profile: ProfilePublic | null;
  profileCompleted: boolean;
  tasksSelected: boolean;
};

export type AuthTokenResponse = {
  token: string;
  user: UserPublic;
  profileCompleted: boolean;
  tasksSelected: boolean;
};

export type TaskPublic = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export type TasksGroupedResponse = {
  categories: Array<{
    category: string;
    tasks: TaskPublic[];
  }>;
};

export type TaskSelectionResponse = {
  tasks: TaskPublic[];
};

export type RegisterResponse = {
  message: string;
  email: string;
};

export type VerifyOtpResponse = {
  message: string;
  email: string;
};
