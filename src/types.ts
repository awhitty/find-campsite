import { DateTime } from "luxon";

export type DateAndStatus = {
  date: DateTime;
  isAvailable: boolean;
};

export interface ICampground {
  getName(): string;
}

export interface ICampsite {
  getAvailableDates(): DateAndStatus[];
  getName(): string;
  getUrl(): string;
}
