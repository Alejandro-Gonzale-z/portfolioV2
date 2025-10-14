export type FormState = {
  success: boolean;
  message: string;
  timestamp: number;
};

export enum AdminNavLinks {
  AboutMe = "About Me",
  Links = "Links",
  Resume = "Resume",
}

export type LinkType = "linkedin" | "github" | "email" | "phone";
