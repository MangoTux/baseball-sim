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
    /*
    A few different components at play:
    Given the [NL/AL] split, and each league having three divisions, and 162 games in a year:
    Same League, Other Division 1 (SLOD1):
    - 3 teams played 7 times, in a [3] and [4] series := SLOD1_3_1_[1-3] and SLOD1_4_1_[1-3]
    - 2 teams played 6 times, in a [3] and [3] series := SLOD1_3_2_[4-5] and SLOD1_3_3_[4-5]
    Same League, Other Division 2 (SLOD2):
    - 3 teams played 7 times, in a [3] and [4] series := SLOD2_3_1_[1-3] and SLOD2_4_1_[1-3]
    - 2 teams played 6 times, in a [3] and [3] series := SLOD2_3_2_[4-5] and SLOD2_3_3_[4-5]
    Same League, Same Division (SLSD):
    - 4 teams played 19 times, in five [3] and one [4] series := SLSD_3_[1-5]_[1-4] and SLSD_4_1_[1-4]
    Interleague, geographic, rival playing in same division (ILGR):
    - Rival team played 3 times, in one [3] series := ILGR_3_1
    Interleague, division, rival playing in same division (ILDR):
    - Rival team played 3 times, in one [3] series := ILDR_3_1_R
    - 2 teams played 3 times, in one [3] series := ILDR_3_1_[1-2]
    - 2 teams played 4 times, in two [2] series := ILDR_2_1_[3-4] and ILDR_2_2_[3-4]
    Interleague, geographic, rival playing in different division (ILG):
    - Rival team played 4 times, ine two [2] series := ILG_2_1 and ILG_2_2
    Interleague, division, rival playing in different division (ILD):
    - 1 team played 4 times, in two [2] series := ILD_2_1_1 and ILD_2_2_1
    - 4 teams played 3 times, in one [3] series := ILD_3_1_[2-5]

    Given a year of the above IDs, Create the cycle offset for division and team, then shuffle all of the above keys. Tricky part is handling the [2, 2] vs [3]; as there might be some days where a team doesn't play.
    e.g. For NYM, SLOD1_3_1_2:
    - "SLOD1" this year might be NL Central (And NL Central's SLOD1 would have to be NL East),
    - "_3" means it's a 3-game series,
    - "_1" means it's a team being played 7 times this year (Unnecessary in scheduling, maybe?)
    - "_2" means per-year index two, which might be CHI
    Directions would have to be reversible, so a blanket SLOD1 wouldn't have NLEast assigned to NLCentral assigned to NLWest assigned to NLEast
    */
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
