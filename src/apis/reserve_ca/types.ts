export interface GridResponse {
  Message: string;
  Filters: Filters;
  UnitTypeId: number;
  StartDate: string;
  EndDate: string;
  TodayDate: string;
  MinDate: string;
  MaxDate: string;
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
