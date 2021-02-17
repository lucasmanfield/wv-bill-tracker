# App

A react-based SPA that can be deployed directly to S3.

# Scraper

scraper.py is our custom scraper that pulls in data from wvlegislature.gov. Its output is copied into the app/src folder and included in the SPA's JS bundle. 

# Building

Built and deployed by GitHub actions (see deploy.yml). GitHub also runs the scrapers.