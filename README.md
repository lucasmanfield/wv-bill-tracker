# App

A react-based SPA that can be deployed directly to S3.

# Scraper

The data scraper has two parts.

- openstates.py will take the output from the WV openstate-scraper and merge it into a single json file for reading by the SPA.
- scraper.py is our custom scraper that pulls in additional data from wvlegislature.gov. Its output is also read by the SPA.

# Building

Built and deployed by GitHub actions (see deploy.yml). It also runs the scrapers.