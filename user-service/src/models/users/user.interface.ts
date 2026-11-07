export type IUser = {
  id?: number;
  name: string;
  email: string;
  password: string;
  image?: string | null;

  role: "admin" | "user";
};

export type IRegisterUser = {
  name: string;
  email: string;
  password: string;
  image?: string;
};

export type IUpdateUser = {
  name?: string;
  image?: string | null;
  role?: "admin" | "user";
};

export type IUserResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  image: string | null;
};
