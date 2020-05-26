# find-campsite

This is a simple script that checks recreation.gov for any available sites at a campground for a particular day of the week.

## Usage

`find-campsite --campground <campground ID> [--day sat] [--nights 1]`

You can find a campground's ID by looking at your URL bar on recreation.gov. In the URL `https://www.recreation.gov/camping/campgrounds/231958` for Arroyo Seco Campground, `231958` is the ID.

### Example

```
> find-campsite --campground 231958
Checking for sites at ARROYO SECO available on a Friday for 2 nights.

Found 16 matching itineraries:

6/25/2020 to 6/27/2020 (in 4 weeks):
- 033 (MCML) https://www.recreation.gov/camping/campsites/70166
- 030 (MCML) https://www.recreation.gov/camping/campsites/70217
- 003 (MCML) https://www.recreation.gov/camping/campsites/71576
- 021 (MCML) https://www.recreation.gov/camping/campsites/71596
- 023 (MCML) https://www.recreation.gov/camping/campsites/71929
7/9/2020 to 7/11/2020 (in 6 weeks):
- 033 (MCML) https://www.recreation.gov/camping/campsites/70166
- 030 (MCML) https://www.recreation.gov/camping/campsites/70217
- 011 (MCML) https://www.recreation.gov/camping/campsites/70882
- 029 (MCML) https://www.recreation.gov/camping/campsites/71168
- 028 (MCML) https://www.recreation.gov/camping/campsites/71602
- 026 (MCML) https://www.recreation.gov/camping/campsites/71669
- 027 (MCML) https://www.recreation.gov/camping/campsites/71783
- 006 (MCML) https://www.recreation.gov/camping/campsites/71896
...
```

Want to check if there's a site for a quick overnighter?

```
> find-campsite -c 231958 -d mon -n 1
Checking for sites at ARROYO SECO available on a Monday for 1 night.

No sites found for the given constraints :(
```
