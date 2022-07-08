import { DateTime } from 'luxon';
import { ICampground, ICampsite } from '../../types';
import { makeGetRequest } from '../../requests';
import * as API from './types';

function buildCampsiteURL(campgroundId: string, startDate: DateTime) {
  const adjustedStartDate = startDate.toUTC().startOf('day').toISO();
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
    const response = await makeGetRequest<{ campground: API.Campground }>(url);
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
        date: DateTime.fromISO(date.substr(0, 19)),
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
  monthsToCheck: number,
): Promise<Campsite[]> {
  const result: Campsite[] = [];

  for (let deltaMonth = 0; deltaMonth < monthsToCheck; deltaMonth += 1) {
    const searchStart = DateTime.local().startOf('month').plus({ month: deltaMonth });

    const url = buildCampsiteURL(campgroundId, searchStart);
    const response = await makeGetRequest<{ campsites: API.Campsite[] }>(url);

    const campsites: Campsite[] = Object.values(response.data.campsites).map(
      (data) => new Campsite(data as API.Campsite),
    );
    result.push(...campsites);
  }

  return result;
}
