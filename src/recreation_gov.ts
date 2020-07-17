import { DateTime } from "luxon";
import { ICampsite, ICampground } from "./types";
import { makeGetRequest } from "./requests";

namespace API {
  export interface Campground {
    facility_name: string;
  }

  export interface Campsite {
    availabilities: CampsiteAvailabilities;
    campsite_id: string;
    campsite_reserve_type: CampsiteReserveType;
    campsite_type: CampsiteType;
    capacity_rating: CapacityRating;
    loop: string;
    max_num_people: number;
    min_num_people: number;
    quantities: null; // ??
    site: string;
    type_of_use: TypeOfUse;
  }

  export type CampsiteAvailabilities = Record<string, CampsiteAvailability | undefined>;

  export enum CampsiteAvailability {
    Available = "Available",
    NotAvailable = "Not Available",
    NotReservable = "Not Reservable",
    NotReservableManagement = "Not Reservable Management",
    Reserved = "Reserved",
  }

  export enum CampsiteReserveType {
    SiteSpecific = "Site-Specific",
  }

  export enum CampsiteType {
    GroupStandardNonelectric = "GROUP STANDARD NONELECTRIC",
    Management = "MANAGEMENT",
    StandardNonelectric = "STANDARD NONELECTRIC",
    TentOnlyNonelectric = "TENT ONLY NONELECTRIC",
    WalkTo = "WALK TO",
  }

  export enum CapacityRating {
    Double = "Double",
    Empty = "",
    Group = "Group",
    Single = "Single",
  }

  export enum TypeOfUse {
    Overnight = "Overnight",
  }
}

function buildCampsiteURL(campgroundId: string, startDate: DateTime) {
  const adjustedStartDate = startDate.toUTC().startOf("day").toISO();
  const encodedStartDate = encodeURIComponent(adjustedStartDate);
  return `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month?start_date=${encodedStartDate}`;
}

function buildCampgroundURL(campgroundId: string) {
  return `https://www.recreation.gov/api/camps/campgrounds/${campgroundId}`;
}

class Campground implements ICampground {
  constructor(private data: API.Campground) {}

  getName() {
    return this.data.facility_name;
  }
}

export async function getCampground(campgroundId: string): Promise<Campground | null> {
  const url = buildCampgroundURL(campgroundId);
  try {
    const response = await makeGetRequest(url);
    return response.data.campground ? new Campground(response.data.campground) : null;
  } catch (e) {
    return null;
  }
}

class Campsite implements ICampsite {
  constructor(private data: API.Campsite) {}

  getAvailableDates() {
    return Object.entries(this.data.availabilities).map(([date, value]) => {
      return {
        date: DateTime.fromISO(date),
        isAvailable: value === API.CampsiteAvailability.Available,
      };
    });
  }

  getName() {
    return `${this.data.site} (${this.data.loop})`;
  }

  getUrl() {
    return `https://www.recreation.gov/camping/campsites/${this.data.campsite_id}`;
  }
}

export async function getCampsites(
  campgroundId: string,
  monthsToCheck: number
): Promise<Campsite[]> {
  const result: Campsite[] = [];

  for (let deltaMonth = 0; deltaMonth < monthsToCheck; deltaMonth += 1) {
    const searchStart = DateTime.local().startOf("month").plus({ month: deltaMonth });

    const url = buildCampsiteURL(campgroundId, searchStart);
    const response = await makeGetRequest(url);

    const campsites: Campsite[] = Object.values(response.data.campsites).map(
      (data) => new Campsite(data as API.Campsite)
    );
    result.push(...campsites);
  }

  return result;
}
