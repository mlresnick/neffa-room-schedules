# NEFFA Room Schedule Generator


## Initial setup

Install [Node.js](https://nodejs.org).

Download or unzip the `neffa-room-schedules` directory.

`cd` into that directory.

Run `npm install`


## Generating grids

In your browser navigate to the [NEFFA](https://www.neffa.org)
"Downloadable Grid". At the time of this writing, that brings you to a page with
the text of the tab separated values (TSV). Right-click on that page and select
**Save as...**/**Save page as...** to download the file. Save the page to a file
called `grid.tsv` in the same directory as this README file.

Run `node transform.js`. This will create a `schedule.html` file in
the current directory.

View the resulting `file:///.../neffa-room-schedules/schedule.html` in a browser.

From the browser, print that page. The result should be a series of pages, one
for each session for each room.
