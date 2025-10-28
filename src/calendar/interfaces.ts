import type { TEventColor } from "@/calendar/types";
import type { StatusEventRecord } from "@/types/statusEvent";

export type CalendarEventKind = "rappel" | "rdv";

export interface IEventMetadata {
  kind: CalendarEventKind;
  recordId: number;
  contact: {
    id?: string | null;
    prenom?: string | null;
    nom?: string | null;
  };
  phone?: string | null;
  email?: string | null;
  comment?: string | null;
  status?: string | null;
  normalizedDate?: string | null;
  normalizedTime?: string | null;
  source?: StatusEventRecord;
}

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  metadata?: IEventMetadata;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
