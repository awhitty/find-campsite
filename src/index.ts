#!/usr/bin/env node

import { DateTime } from 'luxon';
import { DateAndStatus, ICampground, ICampsite } from './types';
import * as RecreationGov from './apis/recreation_gov/recreation_gov';
import * as ReserveCA from './apis/reserve_ca/reserve_california';

function matchAvailableDateRanges(
  availabilities: DateAndStatus[],
  startDayOfWeek: number,
  lengthOfStay: number,
) {
  const sortedAvailabilities = availabilities.sort((a, b) => a.date.diff(b.date).as('days'));
  const result: DateRange[] = [];

  let sequenceStart: DateTime | null = null;
  let sequenceLength = 0;

  sortedAvailabilities.forEach((availability) => {
    if (sequenceStart) {
      if (sequenceLength === lengthOfStay) {
        const sequenceEnd = availability.date;
        result.push({ start: sequenceStart, end: sequenceEnd });
        sequenceStart = null;
        sequenceLength = 0;
      } else if (availability.isAvailable && sequenceLength < lengthOfStay) {
        sequenceLength += 1;
      } else {
        sequenceStart = null;
        sequenceLength = 0;
      }
    } else if (availability.date.weekday === startDayOfWeek && availability.isAvailable) {
      sequenceStart = availability.date;
      sequenceLength += 1;
    }
  });

  return result;
}

function makeAvailabilityKey(availability: DateRange) {
  const { start, end } = availability;
  const startFmt = start.toLocaleString(DateTime.DATE_SHORT);
  const endFmt = end.toLocaleString(DateTime.DATE_SHORT);
  return `${startFmt} to ${endFmt}`;
}

type DateRange = { start: DateTime; end: DateTime };

type Itinerary = {
  range: DateRange;
  campsites: ICampsite[];
};

function consolidateItineraries(
  matches: {
    site: ICampsite;
    matchingRanges: DateRange[];
  }[],
): Itinerary[] {
  const result: Record<string, { range: DateRange; campsites: ICampsite[] }> = {};

  matches.forEach((match) => {
    match.matchingRanges.forEach((availability) => {
      const key = makeAvailabilityKey(availability);

      if (!result[key]) {
        result[key] = {
          range: availability,
          campsites: [],
        };
      }

      result[key].campsites.push(match.site);
    });
  });

  return Object.values(result).sort((a, b) => a.range.start.diff(b.range.end).as('days'));
}

function formatRange(start: DateTime, end: DateTime) {
  const startFmt = start.toLocaleString(DateTime.DATE_SHORT);
  const endFmt = end.toLocaleString(DateTime.DATE_SHORT);
  return `${startFmt} to ${endFmt}`;
}

interface ReservationAPI {
  getCampground(campgroundId: string): Promise<ICampground | null>;
  getCampsites(campgroundId: string, monthsToCheck: number): Promise<ICampsite[]>;
}

async function doTheThing(
  api: ReservationAPI,
  campgroundId: string,
  startDayOfWeek: number,
  lengthOfStay: number,
  monthsToCheck: number,
) {
  const campground = await api.getCampground(campgroundId);

  if (!campground) {
    throw new Error(`No campground with id ${campgroundId}`);
  }

  console.log(
    `Checking for sites at ${campground.getName()} available on a ${weekdayToDay(
      startDayOfWeek,
    )} for ${lengthOfStay} ${lengthOfStay === 1 ? 'night' : 'nights'}.`,
  );
  console.log();

  const campsites = await api.getCampsites(campgroundId, monthsToCheck);

  const matches = campsites
    .map((site) => {
      const availabilities = site.getAvailableDates();
      const matchingRanges = matchAvailableDateRanges(availabilities, startDayOfWeek, lengthOfStay);

      return { site, matchingRanges };
    })
    .filter((site) => site.matchingRanges.length > 0);

  const regrouped = consolidateItineraries(matches);

  if (regrouped.length > 0) {
    const length = regrouped.length;
    console.log(`Found ${length} matching ${length === 1 ? 'itinerary' : 'itineraries'}:`);
    console.log();
    regrouped.forEach(({ range, campsites }) => {
      const { start, end } = range;
      const diff = Math.round(start.diffNow('week').as('weeks'));
      console.log(`${formatRange(start, end)} (in ${diff} ${diff === 1 ? 'week' : 'weeks'}):`);

      campsites.forEach((site) => {
        console.log(`- ${site.getName()} ${site.getUrl()}`);
      });
    });
  } else {
    console.log('No sites found for the given constraints :(');
  }
}

enum APIChoice {
  RecreationGov = 'recreation_gov',
  ReserveCA = 'reserve_ca',
}

type Argv = {
  api: APIChoice;
  campground: string;
  day: string;
  nights: number;
  months: number;
};

function pickAPI(choice: APIChoice) {
  return choice === APIChoice.RecreationGov ? RecreationGov : ReserveCA;
}

async function main(argv: Argv) {
  try {
    const api = pickAPI(argv.api);
    await doTheThing(api, argv.campground, dayToWeekday(argv.day), argv.nights, argv.months);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

function dayToWeekday(day: string) {
  return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(day) + 1;
}

function weekdayToDay(weekday: number) {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][
    weekday - 1
  ];
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { argv } = require('yargs')
    .alias('h', 'help')
    .option('api', {
      type: 'string',
      choices: ['recreation_gov', 'reserve_ca'],
      default: 'recreation_gov',
      description: 'Which reservation API to search',
    })
    .option('campground', {
      alias: 'c',
      type: 'number',
      description: "Campground's identifier",
      required: true,
    })
    .option('day', {
      alias: 'd',
      type: 'string',
      choices: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      default: 'fri',
      description: 'Day of week to start on',
    })
    .option('nights', {
      alias: 'n',
      type: 'number',
      default: 2,
    })
    .option('months', {
      alias: 'm',
      type: 'number',
      default: 6,
      description: 'Number of months to check',
    });

  main(argv);
}
