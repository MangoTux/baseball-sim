import { League } from "./league.c.js";
import { Team } from "./team.c.js";
import { Game } from "./game.c.js";
import { Standings } from "./standings.c.js";
import { Tiebreak } from "./tiebreak.c.js";
import { Playoff } from "./playoff.c.js";
import { settings } from "../module/settings.m.js";
import { endDay, redraw, uuid } from "../module/util.m.js";

export class Season {
  constructor() {
    this.current_day = 0;
    this.total_games = settings.game_count;
    this.standings;
    this.history = [];
    this.state = "regular";
    // Each tiebreaker stores one game matchup
    this.tiebreak_system = new Tiebreak();
    this.playoff_system = new Playoff();
  }

  setLeague(league) {
    this.league = league;
    this.standings = new Standings(league);
    this.gameday();
  }

  getGameById(id) {
    for (let day = this.current_day; day > 0; day--) {
      for (const game of this.history[day]) {
        if (game.id == id) {
          return game;
        }
      }
    }
    return null;
  }

  async gameday() {
    // Debug return one matchup: [ this.matchups[0] ];
    let matchups = this.getMatchups();
    this.current_day++;
    this.history[this.current_day] = [];
    matchups.map(async (matchup) => {
      let game = new Game(matchup.away, matchup.home);
      // Override declared in tiebreaker for pending game results
      if (typeof matchup.id !== "undefined") {
        game.id = matchup.id;
      }
      this.history[this.current_day].push(game);
    });
    redraw({
      type: "start",
      id: "gameday",
    });
    await Promise.all(this.history[this.current_day].map(async (game) => {
      let box_score = await game.play();
      this.standings.postGame(game.team_away, game.team_home, box_score);
      // This is firing immediately after the previous
      redraw({
        type: "standings",
        id: "game_end",
      });
    }));
    this.manageState() && endDay();
  }

  manageState() {
    if (this.current_day < this.total_games) {
      return true;
    }
    if (this.current_day == this.total_games) {
      this.tiebreak_system.setStandings(this.standings);
      this.tiebreak_system.initialize();
      this.state = "tiebreak";
    }
    if (this.state == "tiebreak") {
      if (this.tiebreak_system.hasTomorrow()) {
        return true;
      }
      this.playoff_system.setStandings(this.standings);
      this.playoff_system.initialize();
      this.state = "playoff";
    }
    if (this.state == "playoff") {
      return this.playoff_system.hasTomorrow();
    }
    return false;
  }

  /*
  Returns a random matchup each day.
  In 162 games, should do something per-series, but it gets finicky with dynamic game counts
  */
  getRegularMatchups() {
    // Create a new scheduler and supply it with teams and game count. Here, instead of shuffling, use that class's getMatchupsForDay

    let shuffled = this.league.team_list.sort(() => 0.5 - Math.random());
    let matchup_list = [];
    for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
      matchup_list.push({
        'home': shuffled[i],
        'away': shuffled[shuffled.length - (i + 1)]
      });
    }
    return matchup_list;
  }

  /*
  - tiebreaker setup: Initial day-one matchups, plus results pending (4-to-2, 3-carry-1) in tiebreaker_pending.

  */
  getTiebreakerMatchups() {
    if (!this.tiebreak_system.hasGames()) {
      this.tiebreak_system.advance(this);
    }
    let matchups = this.tiebreak_system.getMatchups();
    this.tiebreak_system.clearMatchupQueue();
    return matchups;
  }

  // TODO
  getPlayoffMatchups() {
    // Iterate through TODO playoff bracket instance
    // Should be a standard bracket with WC games (1) > CS (5) > DS (5) > WS (7)
    return [];
  }

  getMatchups() {
    switch (this.state) {
      case "regular": return this.getRegularMatchups();
      case "tiebreak": return this.getTiebreakerMatchups();
      case "playoff": return this.getPlayoffMatchups();
    }
    return [];
  }
}
