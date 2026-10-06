import { z } from "zod";

export const requestStatuses = ["NEW", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "WITHDRAWN"] as const;
export const requestPriorities = ["HIGH", "MEDIUM", "LOW"] as const;
export const requestStatusSchema = z.enum(requestStatuses);
export const requestPrioritySchema = z.enum(requestPriorities);
export type RequestStatus = z.infer<typeof requestStatusSchema>;
export type RequestPriority = z.infer<typeof requestPrioritySchema>;

export const statusLabels: Record<RequestStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  AWAITING_USER: "Waiting for you",
  RESOLVED: "Resolved",
  WITHDRAWN: "Withdrawn",
};

export const priorityLabels: Record<RequestPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const allowedStatusTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
  NEW: ["IN_PROGRESS", "RESOLVED"],
  IN_PROGRESS: ["AWAITING_USER", "RESOLVED"],
  AWAITING_USER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["IN_PROGRESS"],
  WITHDRAWN: [],
};

export function canTransitionRequest(from: RequestStatus, to: RequestStatus) {
  return allowedStatusTransitions[from].includes(to);
}

export function statusHelp(status: RequestStatus) {
  if (status === "IN_PROGRESS") return "Your request is in progress. Please wait for an update from BoomoTech.";
  if (status === "AWAITING_USER") return "BoomoTech has replied and is waiting for your response.";
  if (status === "RESOLVED") return "This request is resolved and the conversation is read-only.";
  if (status === "WITHDRAWN") return "You withdrew this request before processing started.";
  return "BoomoTech has received this request and processing has not started.";
}
