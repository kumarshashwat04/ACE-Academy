import type { CertificationModule } from "@/lib/certifications";

export type UserRole = "admin" | "learner";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  team: string;
  av: string;
  level?: number;
  allowedLevel?: number;
  allowedLevelSource?: string;
  certifications?: CertificationModule[] | string[];
};

const USERS_STORAGE_KEY = "ace2_users";

const SEED_USERS: User[] = [
  {
    id: "u001",
    name: "Admin User",
    email: "admin@greyorange.com",
    password: "admin123",
    role: "admin",
    team: "TAC",
    av: "AU",
  },
  {
    id: "u002",
    name: "Anish Kumar",
    email: "anish.kumar@greyorange.com",
    password: "anish123",
    role: "learner",
    team: "TAC",
    av: "AK",
  },
  {
    id: "u003",
    name: "Gorle Bindu Sree",
    email: "bindu.sree@greyorange.com",
    password: "bindu123",
    role: "learner",
    team: "TAC",
    av: "GB",
  },
  {
    id: "u004",
    name: "Prachi Pandey",
    email: "prachi.pandey@greyorange.com",
    password: "prachi123",
    role: "learner",
    team: "TAC",
    av: "PP",
  },
  {
    id: "u005",
    name: "Sambit Panigrahy",
    email: "sambit.panigrahy@greyorange.com",
    password: "sambit123",
    role: "learner",
    team: "TAC",
    av: "SP",
  },
];

export function getUsersFromStorage(): User[] {
  const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored) as User[];
  }
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
  return JSON.parse(JSON.stringify(SEED_USERS)) as User[];
}

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}
