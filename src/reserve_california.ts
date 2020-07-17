import { DateTime } from "luxon";
import { makePostRequest } from "./requests";
import { ICampground, ICampsite } from "./types";

namespace API {
  export interface GridResponse {
    Message: string;
    Filters: Filters;
    UnitTypeId: number;
    StartDate: Date;
    EndDate: Date;
    TodayDate: Date;
    MinDate: Date;
    MaxDate: Date;
    AvailableUnitsOnly: boolean;
    UnitSort: string;
    Facility: Facility;
  }

  export interface Facility {
    FacilityId: number;
    Name: string;
    Description: string;
    FacilityType: number;
    FacilityMapSize: boolean;
    FacilityImage: string;
    DatesInSeason: number;
    DatesOutOfSeason: number;
    SeasonDates: SeasonDates;
    UnitCount: number;
    AvailableUnitCount: number;
    SliceCount: number;
    AvailableSliceCount: number;
    Restrictions: Restrictions;
    Units: Units;
  }

  export interface Restrictions {
    FutureBookingStarts: Date;
    FutureBookingEnds: Date;
    MinimumStay: number;
    MaximumStay: number;
    IsRestrictionValid: boolean;
  }

  export type SeasonDates = Record<string, boolean | undefined>;

  export type Units = Record<string, Unit | undefined>;

  export interface Unit {
    UnitId: number;
    Name: string;
    ShortName: string;
    RecentPopups: number;
    IsAda: boolean;
    AllowWebBooking: boolean;
    MapInfo: MapInfo;
    IsWebViewable: boolean;
    IsFiltered: boolean;
    UnitCategoryId: number;
    SleepingUnitIds: number[];
    UnitTypeGroupId: number;
    UnitTypeId: number;
    VehicleLength: number;
    OrderBy: number;
    SliceCount: number;
    AvailableCount: number;
    Slices: AvailabilityInfoSlices;
  }

  export interface MapInfo {
    UnitImage: string;
    ImageCoordinateX: number;
    ImageCoordinateY: number;
    ImageWidth: number;
    ImageHeight: number;
    FontSize: number;
  }

  export type AvailabilityInfoSlices = Record<string, AvailabilityInfo>;

  export interface AvailabilityInfo {
    Date: Date;
    IsFree: boolean;
    IsBlocked: boolean;
    IsWalkin: boolean;
    ReservationId: number;
    Lock: null;
    MinStay: number;
  }

  export interface Filters {
    InSeasonOnly: string;
    WebOnly: string;
  }
}

const API_ENDPOINT = "https://calirdr.usedirect.com/rdr/rdr/search/grid";
const API_DATE_FORMAT = "M-d-yyyy";

class Campground implements ICampground {
  constructor(private data: API.Facility) {}

  getName() {
    return this.data.Name;
  }
}

export async function getCampground(campgroundId: string): Promise<Campground | null> {
  const request = { FacilityId: Number.parseInt(campgroundId), StartDate: "7-1-2020", EndDate: "7-2-2020" };
  try {
    const response = await makePostRequest<API.GridResponse>(API_ENDPOINT, request);
    return response.data.Facility ? new Campground(response.data.Facility) : null;
  } catch (e) {
    return null;
  }
}

class Campsite implements ICampsite {
  constructor(private data: API.Unit) {}

  getAvailableDates() {
    return Object.entries(this.data.Slices).map(([date, value]) => {
      return {
        date: DateTime.fromISO(date),
        isAvailable: value.IsFree,
      };
    });
  }

  getName() {
    return `${this.data.Name}`;
  }

  getUrl() {
    return `https://www.reservecalifornia.com/CaliforniaWebHome/`;
  }
}

export async function getCampsites(
  campgroundId: string,
  monthsToCheck: number
): Promise<Campsite[]> {
  const start = DateTime.local().startOf("day");
  const end = start.plus({ months: monthsToCheck });

  const request = {
    FacilityId: campgroundId,
    StartDate: start.toFormat(API_DATE_FORMAT),
    EndDate: end.toFormat(API_DATE_FORMAT),
  };

  const response = await makePostRequest<API.GridResponse>(API_ENDPOINT, request);

  return Object.values(response.data.Facility.Units).map((data) => new Campsite(data as API.Unit));
}