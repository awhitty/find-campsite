# find-campsite

This is a simple script that checks recreation.gov for any sites at a campground available on a particular day of the week.

## Install

`npm install -g find-campsite` or `yarn global add find-campsite` should do the trick.

## Usage

`find-campsite --campground <campground ID> [--day fri] [--nights 2]`

You can find a campground's ID by looking at your URL bar on recreation.gov. In the URL `https://www.recreation.gov/camping/campgrounds/231958` for Arroyo Seco Campground, `231958` is the ID.

### Examples

```
> find-campsite --campground 231958
Checking for sites at ARROYO SECO available on a Friday for 2 nights.

Found 17 matching itineraries:

6/26/2020 to 6/28/2020 (in 5 weeks):
- 033 (MCML) https://www.recreation.gov/camping/campsites/70166
- 030 (MCML) https://www.recreation.gov/camping/campsites/70217
- 003 (MCML) https://www.recreation.gov/camping/campsites/71576
- 021 (MCML) https://www.recreation.gov/camping/campsites/71596
- 023 (MCML) https://www.recreation.gov/camping/campsites/71929
7/10/2020 to 7/12/2020 (in 7 weeks):
- 033 (MCML) https://www.recreation.gov/camping/campsites/70166
- 030 (MCML) https://www.recreation.gov/camping/campsites/70217
- 011 (MCML) https://www.recreation.gov/camping/campsites/70882
- 029 (MCML) https://www.recreation.gov/camping/campsites/71168
- 037 (PCLL) https://www.recreation.gov/camping/campsites/71401
- 028 (MCML) https://www.recreation.gov/camping/campsites/71602
...
```

Want to check if there's a site for a quick overnighter?

```
> find-campsite -c 231958 -d mon -n 1
Checking for sites at ARROYO SECO available on a Monday for 1 night.

No sites found for the given constraints :(
```

Drats :(
