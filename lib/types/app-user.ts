export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";

export type AppUser = {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: UserRole;
  profileImage?: string | null;
  balance: string | number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
