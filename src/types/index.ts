export interface Project {
  id:              string;
  title:           string;
  slug:            string;
  description:     string;
  longDescription: string | null;
  coverImage:      string | null;
  liveUrl:         string | null;
  githubUrl:       string | null;
  techStack:       string[];
  category:        "WEB" | "MOBILE" | "DESIGN" | "AI";
  featured:        boolean;
  order:           number;
  createdAt:       string;
  updatedAt:       string;
}

export interface Experience {
  id:          string;
  company:     string;
  role:        string;
  description: string;
  startDate:   string;
  endDate:     string | null;
  techUsed:    string[];
  companyLogo: string | null;
  order:       number;
}

export interface Message {
  id:        string;
  name:      string;
  email:     string;
  message:   string;
  read:      boolean;
  starred:   boolean;
  createdAt: string;
}

export type ProjectCategory = "WEB" | "MOBILE" | "DESIGN" | "AI";
