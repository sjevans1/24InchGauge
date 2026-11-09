"use client";
import { createContext, useContext } from "react";
import type { StateResponse, State } from "@/lib/model";
export type Page =
  | "Overview"
  | "Members"
  | "Meetings"
  | "Documents"
  | "Finances"
  | "Property"
  | "Tasks"
  | "Settings";
export type ModalSpec = { kind: string; data?: any };
export type AppContext = {
  data: StateResponse;
  s: State;
  busy: boolean;
  error: string;
  page: Page;
  setPage: (p: Page) => void;
  open: (kind: string, data?: any) => void;
  close: () => void;
  command: (action: string, data: unknown) => Promise<any | null>;
  upload: (
    file: File,
    purpose: "logo" | "asset" | "archive",
  ) => Promise<string | null>;
  selectedMeeting: string;
  setSelectedMeeting: (id: string) => void;
  notify: (message: string) => void;
};
export const Context = createContext<AppContext>(null!);
export const useApp = () => useContext(Context);
