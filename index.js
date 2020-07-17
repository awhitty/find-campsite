const axios = require('axios').default;
const fakeUa = require('fake-useragent');
const { DateTime } = require('luxon');

async function makeGetRequest(url) {
  return await axios.get(url, {
    headers: {
      'User-Agent': fakeUa(),
    },
  });
}

function buildCampsiteURL(campgroundId, startDate) {
  const adjustedStartDate = startDate.toUTC().startOf('day').toISO();
  const encodedStartDate = encodeURIComponent(adjustedStartDate);
  return `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month?start_date=${encodedStartDate}`;
}

function parseAvailabilities(availabilities) {
  return Object.entries(availabilities).map(([date, value]) => {
    return {
      date: DateTime.fromISO(date),
      status: value,
    };
  });
}

function buildCampgroundURL(campgroundId) {
  return `https://www.recreation.gov/api/camps/campgrounds/${campgroundId}`;
}

async function getCampground(campgroundId) {
  const url = buildCampgroundURL(campgroundId);
  try {
    const response = await makeGetRequest(url);
    return response.data.campground ? response.data.campground : null;
  } catch (e) {
    return null;
  }
}

async function getCampsites(campgroundId, monthsToCheck) {
  const result = [];

  for (let deltaMonth = 0; deltaMonth < monthsToCheck; deltaMonth += 1) {
    const searchStart = DateTime.local()
      .startOf('month')
      .plus({ month: deltaMonth });

    const url = buildCampsiteURL(campgroundId, searchStart);
    const response = await makeGetRequest(url);

    result.push(...Object.values(response.data.campsites));
  }

  return result;
}

function getMatchingAvailabilities(
  availabilities,
  startDayOfWeek,
  lengthOfStay,
) {
  const result = [];
  let sequenceStart = null;
  let sequenceLength = 0;
  availabilities.forEach((availability) => {
    if (sequenceStart) {
      if (availability.status === 'Available') {
        if (sequenceLength < lengthOfStay) {
          sequenceLength += 1;
        } else {
          result.push([sequenceStart, availability]);
          sequenceStart = null;
          sequenceLength = 0;
        }
      } else {
        sequenceStart = null;
        sequenceLength = 0;
      }
    } else if (
      availability.date.weekday === startDayOfWeek &&
      availability.status === 'Available'
    ) {
      sequenceStart = availability;
      sequenceLength += 1;
    }
  });
  return result;
}

function makeAvailabilityKey(availability) {
  const [start, end] = availability;
  const startFmt = start.date.toLocaleString(DateTime.DATE_SHORT);
  const endFmt = end.date.toLocaleString(DateTime.DATE_SHORT);
  return `${startFmt} to ${endFmt}`;
}

function regroupMatches(matches) {
  const result = {};
  matches.forEach((match) => {
    match.matchingAvailabilities.forEach((availability) => {
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
  return Object.values(result).sort(
    (a, b) => a.range[0].date.diff(b.range[0].date).as('days'),
  );
}

function formatRange(start, end) {
  const startFmt = start.date.toLocaleString(DateTime.DATE_SHORT);
  const endFmt = end.date.toLocaleString(DateTime.DATE_SHORT);
  return `${startFmt} to ${endFmt}`;
}

async function doTheThing(
  campgroundId,
  startDayOfWeek,
  lengthOfStay,
  monthsToCheck,
) {
  const campground = await getCampground(campgroundId);

  if (!campground) {
    throw new Error(`No campground with id ${campgroundId}`);
  }

  console.log(
    `Checking for sites at ${
      campground.facility_name
    } available on a ${weekdayToDay(startDayOfWeek)} for ${lengthOfStay} ${
      lengthOfStay === 1 ? 'night' : 'nights'
    }.`,
  );
  console.log();

  const campsites = await getCampsites(campgroundId, monthsToCheck);

  const matches = campsites
    .map((site) => {
      const matchingAvailabilities = getMatchingAvailabilities(
        parseAvailabilities(site.availabilities),
        startDayOfWeek,
        lengthOfStay,
      );

      return { site, matchingAvailabilities };
    })
    .filter((site) => site.matchingAvailabilities.length > 0);

  const regrouped = regroupMatches(matches);

  if (regrouped.length > 0) {
    const length = regrouped.length;
    console.log(
      `Found ${length} matching ${length === 1 ? 'itinerary' : 'itineraries'}:`,
    );
    console.log();
    regrouped.forEach(({ range, campsites }) => {
      const [start, end] = range;
      const diff = Math.round(start.date.diffNow('week').as('weeks'));
      console.log(
        `${formatRange(start, end)} (in ${diff} ${
          diff === 1 ? 'week' : 'weeks'
        }):`,
      );

      campsites.forEach((site) => {
        const url = `https://www.recreation.gov/camping/campsites/${site.campsite_id}`;
        console.log(`- ${site.site} (${site.loop}) ${url}`);
      });
    });
  } else {
    console.log('No sites found for the given constraints :(')
  }
}

async function main(argv) {
  try {
    await doTheThing(
      argv.campground,
      dayToWeekday(argv.day),
      argv.nights,
      argv.months,
    );
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

function dayToWeekday(day) {
  return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(day) + 1;
}

function weekdayToDay(weekday) {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekday - 1];
}

if (require.main === module) {
  const { argv } = require('yargs')
    .alias('h', 'help')
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
      type: 'number',
      default: 6,
      description: 'Number of months to check',
    });

  main(argv);
}
