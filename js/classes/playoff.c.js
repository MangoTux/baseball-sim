import { uuid } from "../module/util.m.js";

class PlayoffNode {
  constructor() {

  }
}

export class Playoff {
  constructor() {
    this.bracket = null;
    // Bracket consists of playoff nodes, each containing two children (reverse-traverse) and a game count

  }

  setStandings(standings) {
    this.standings = standings;
  }

  initialize() {

  }

  hasGames() {

  }

  hasTomorrow() {

  }

  advance(season_scope) {

  }

  getMatchups() {

  }

  // This seems less necessary for playoffs, where queue is managed uniquely
  clearMatchupQueue() {
    return false;
  }
}
