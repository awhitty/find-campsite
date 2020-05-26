const axios = require('axios').default;
const fakeUa = require('fake-useragent');
const { DateTime } = require('luxon');

const NUM_MONTHS_TO_CHECK = 6;

async function makeGetRequest(url) {
  return await axios.get(url, {
    headers: {
      'User-Agent': fakeUa(),
    },
  });
}

function buildCampsiteURL(campgroundId, startDate) {
  const adjustedStartDate = startDate.toUTC().startOf('day').toISO();
  return `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month?start_date=${adjustedStartDate}`;
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

async function getCampsites(campgroundId) {
  const result = [];

  for (let deltaMonth = 0; deltaMonth < NUM_MONTHS_TO_CHECK; deltaMonth += 1) {
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
  return Object.values(result);
}

function formatRange(start, end) {
  const startFmt = start.date.toLocaleString(DateTime.DATE_SHORT);
  const endFmt = end.date.toLocaleString(DateTime.DATE_SHORT);
  return `${startFmt} to ${endFmt}`;
}

async function doTheThing(campgroundId, startDayOfWeek, lengthOfStay) {
  const campground = await getCampground(campgroundId);

  if (!campground) {
    throw new Error(`No campground with id ${campgroundId}`);
  }

  console.log(
    `Checking availabilities at ${
      campground.facility_name
    } starting on a ${weekdayToDay(startDayOfWeek)} for ${lengthOfStay} ${
      lengthOfStay === 0 ? 'night' : 'nights'
    }`,
  );
  console.log();

  const campsites = await getCampsites(campgroundId);

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
      `Found ${length} matching date ${length === 1 ? 'range' : 'ranges'}:`,
    );
    console.log();
    regrouped.forEach(({ range, campsites }) => {
      const [start, end] = range;
      const diff = Math.floor(start.date.diffNow('week').as('weeks'));
      console.log(
        `${formatRange(start, end)} (in ${diff} ${
          diff === 0 ? 'week' : 'weeks'
        }):`,
      );

      campsites.forEach((site) => {
        const url = `https://www.recreation.gov/camping/campsites/${site.campsite_id}`;
        console.log(`- ${site.site} (${site.loop}) ${url}`);
      });

      console.log();
    });
  }
}

async function main(argv) {
  try {
    await doTheThing(argv.campground, dayToWeekday(argv.start), argv.nights);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

function dayToWeekday(day) {
  return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(day);
}

function weekdayToDay(weekday) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekday];
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
    .option('start', {
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
    });

  main(argv);
}
