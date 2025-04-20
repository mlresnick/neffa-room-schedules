/* eslint-env node */
const { log } = require('console');
const fs = require('fs');
const path = require('path');

class RoomListGenerator {
  constructor() {
    this.cssPath = path.resolve(__dirname, '..', 'neffa-room-schedules', 'roomschedule.css');
    this.htmlFile = null;
    this.tracker = { hall: null, day: null };
  }

  static compareField(s1, s2) {
    let result = 0;

    if (s1 < s2) {
      result = -1;
    }
    else if (s1 > s2) {
      result = 1;
    }

    return result;
  }

  /** Compare two schedule entries. Comparison is by hall name, day name and military time. */
  static compareEntry(o1, o2) {
    let result = RoomListGenerator.compareField(o1.hall, o2.hall);

    if (result === 0) {
      result = RoomListGenerator.compareField(o1.day, o2.day);
    }

    if (result === 0) {
      result = RoomListGenerator.compareField(o1.miltime, o2.miltime)
    }
    return result;
  }

  formatField(entry, fieldName, indent) {
    const indentString = ' '.repeat(80);
    let result = false;
    if (entry[fieldName] !== this.tracker[fieldName]) {

      if (this.tracker[fieldName]) {
        for (let i = 2; i > indent; i--) {
          fs.writeSync(this.htmlFile, `${indentString.substring(0, 2 + ((i - 1) * 2))}</div> <!-- ${fieldName} -->\n`);
        }
      }

      fs.writeSync(this.htmlFile, `${indentString.substring(0, 2 + (indent * 2))}<div class="${fieldName}">\n`);
      fs.writeSync(
        this.htmlFile,
        `${indentString.substring(0, 2 + ((indent + 1) * 2))}<div class="name">${entry[fieldName]}</div>\n`
      );

      this.tracker[fieldName] = entry[fieldName];
      result = true;
    }
    return result;
  }

  tsvToObjects(filePath) {
    const tsv = fs.readFileSync(filePath, 'utf8');
    let fieldNameList
    const schedule = [];
    tsv.split('\n')
      .forEach((line, lineIndex) => {
        if (line !== '') {
          if (lineIndex === 0) {
            fieldNameList = line.split('\t');
          }
          else {
            const entry = {};
            line.split('\t')
              .forEach((fieldValue, fieldIndex) => {
                const fieldName = fieldNameList[fieldIndex];
                entry[fieldName] = fieldValue;
              });
            const dateVals = entry.date.split('/');

            // Move year from last position to first.
            const year = dateVals.pop();
            dateVals.unshift(year)

            for (let i = 1; i < 3; i++) {
              dateVals[i] = (dateVals[i] < 10) ? `0${dateVals[i]}` : dateVals[i];
            }
            const timeVals = [entry.miltime.substring(0, 2), entry.miltime.substring(2, 4)];
            entry.timestamp = `${dateVals.join('-')}T${timeVals.join(':')}`;
            if (entry.day === "Saturday") {
              if (entry.miltime < '1800') {
                schedule.push({ ...entry, day: 'Saturday Day' })
              }
              if (entry.miltime >= '1600') {
                schedule.push({ ...entry, day: 'Saturday Eve.' })
              }
            }
            else {
              schedule.push(entry);
            }
          }
        }
      });
    return schedule;
  }

  defaultDoIt(doIt) {
    return (typeof doit === 'undefined') ? true : doIt;
  }

  writeHTMLStart(doIt) {
    if (this.defaultDoIt(doIt)) {
      const css = fs.readFileSync(this.cssPath);
      fs.writeSync(this.htmlFile, '<!DOCTYPE html>\n');
      fs.writeSync(this.htmlFile, '<html>\n');
      fs.writeSync(this.htmlFile, '<head>\n');
      fs.writeSync(this.htmlFile, '  <meta charset="utf-8"/>\n');
      fs.writeSync(this.htmlFile, '  <title>NEFFA Room Schedules</title>\n');
      fs.writeSync(this.htmlFile, '  <style>\n');
      fs.writeSync(this.htmlFile, `${css}\n`);
      fs.writeSync(this.htmlFile, '  </style>\n')
      fs.writeSync(this.htmlFile, `  <link rel="stylesheet" href="${this.cssPath}" type="text/css" />\n`);
      fs.writeSync(this.htmlFile, '</head>\n');
      fs.writeSync(this.htmlFile, '<body>\n');
    }
  }

  writeHTMLEnd(doIt) {
    if (this.defaultDoIt(doIt)) {
      fs.writeSync(this.htmlFile, '    </div> <!-- day -->\n');
      fs.writeSync(this.htmlFile, '  </div> <!-- hall -->\n');
      fs.writeSync(this.htmlFile, '</body>\n');
      fs.writeSync(this.htmlFile, '</html>\n');
    }
  }

  generate(filePath, onePage) {
    if (typeof onePage === 'undefined') {
      onePage = true;
    }
    const schedule = this.tsvToObjects(filePath).sort(RoomListGenerator.compareEntry);

    if (onePage) {
      this.htmlFile = fs.openSync('schedule.html', 'w');
      this.writeHTMLStart();
    }

    const last = { hall: null, day: null };
    schedule.forEach((entry, index, schedule) => {
      if (entry.day !== last.day) {
        if (last.day) {
          fs.writeSync(this.htmlFile, '      </div> <!-- events -->\n')
          fs.writeSync(this.htmlFile, '    </div> <!-- day -->\n')
        }
        // if (entry.hall !== last.hall) {
        last.day = null;
        if (last.hall) {
          fs.writeSync(this.htmlFile, '  </div> <!-- hall -->\n')
          if (!onePage) {
            this.writeHTMLEnd();
            fs.closeSync(this.htmlFile)
          }
        }
        if (!onePage) {
          const filename = `${entry.day} ${entry.hall}`
            .toLowerCase()
            .replace(/&nbsp;/g, ' ')
            .replace(/(\ |\/|\()/g, '-')
            .replace(/\)/g, '')
            .replace(/\./g, '');

          this.htmlFile = fs.openSync(`${filename}.html`, 'w');
          this.writeHTMLStart();
        }

        fs.writeSync(this.htmlFile, '  <div class="hall">\n')
        fs.writeSync(this.htmlFile, `    <div class="name">${entry.hall}</div>\n`);

        last.hall = entry.hall;
        // }
        fs.writeSync(this.htmlFile, '    <div class="day">\n')
        fs.writeSync(this.htmlFile, `      <div class="name">${entry.day}</div>\n`);
        // fs.writeSync(this.htmlFile, `      <div class="name">${entry.day} — ${entry.hall}</div>\n`);
        fs.writeSync(this.htmlFile, `      <div class="events">\n`);

        last.day = entry.day;
      }
      fs.writeSync(this.htmlFile, '        <div class="entry">\n');
      ['start_time', 'short', 'rating', 'performers', 'verbose'].forEach(
        fieldName => fs.writeSync(this.htmlFile,
          `          <div class="${fieldName}">${fieldName === 'rating' && entry[fieldName].length ? 'Rating: ' : ''}${entry[fieldName]}</div>\n`
        ));
      fs.writeSync(this.htmlFile, '        </div>\n');
    })

    this.writeHTMLEnd();

    fs.closeSync(this.htmlFile);
  }
}

const generator = new RoomListGenerator();
generator.generate('grid.tsv', true);
