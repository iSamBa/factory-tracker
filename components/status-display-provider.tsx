"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  ACTIVITY_STATUSES,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  type BadgeVariant
} from "@/lib/activity-status";

export interface StatusDisplay {
  label: string;
  badgeVariant: BadgeVariant;
}

export type StatusDisplayMap = Record<string, StatusDisplay>;

/** Code defaults — used until/unless the provider supplies DB overrides. */
function defaultStatusDisplay(): StatusDisplayMap {
  const map: StatusDisplayMap = {};
  for (const status of ACTIVITY_STATUSES) {
    map[status] = { label: STATUS_LABEL[status], badgeVariant: STATUS_BADGE_VARIANT[status] };
  }
  return map;
}

const StatusDisplayContext = createContext<StatusDisplayMap>(defaultStatusDisplay());

export function StatusDisplayProvider({
  value,
  children
}: {
  value: StatusDisplayMap;
  children: ReactNode;
}) {
  return <StatusDisplayContext.Provider value={value}>{children}</StatusDisplayContext.Provider>;
}

/** The active status → {label, colour} map (DB overrides merged over defaults). */
export function useStatusDisplay(): StatusDisplayMap {
  return useContext(StatusDisplayContext);
}
