export class EventLogger {
  constructor() {
    this.event_log = {};
  }

  postInning(inning) {
    this.event_log[inning] = {};
  }

  postTeam(inning, side) {
    let name = side.getName();
    this.event_log[inning][name] = {
      name: name,
      events: []
    };
  }

  postBatter(inning, side, batter, event) {
    let name = side.getName();
    this.event_log[inning][name].events.push({
      name: batter.name,
      description: event
    });
  }
}
