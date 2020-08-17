export class BoxScore {
  constructor() {
    this.runs = {};
    this.hits = {};
  }

  getScore() {
    let runs = 0;
    for (let i in this.runs) {
      runs += this.runs[i];
    }
    return runs;
  }

  getHits() {
    let hits = 0;
    for (let i in this.hits) {
      hits += this.hits[i];
    }
    return hits;
  }

  addHit(inning) {
    if (typeof this.hits[inning] === "undefined") {
      this.hits[inning] = 0;
    }
    this.hits[inning]++;
  }

  addRuns(inning, runs) {
    if (typeof this.runs[inning] === "undefined") {
      this.runs[inning] = 0;
    }
    this.runs[inning] += runs;
  }

  initializeInning(inning) {
    this.runs[inning] = 0;
    this.hits[inning] = 0;
  }
}
