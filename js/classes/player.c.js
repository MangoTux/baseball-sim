import { uuid, dice } from "../module/util.m.js";

export class Player {
  constructor(name) {
    this.id = uuid();
    this.name = name;
    this.stats = {
      power: 6+dice(2, 6), // Distance correlates to bases
      batting_accuracy: 6+dice(2, 6), // Chance of making contact
      driving_accuracy: 6+dice(2, 6), // How well they can hit where intended
      pressure: dice(1, 4) - 1, // How well they perform risp or outs
      stamina: dice(1, 4), // How well they do as the game goes on
      intimidation: dice(2, 6), // How likely the pitcher is to walk them
      speed: 6+dice(2, 6), // How quickly they can run bases

      resolve: dice(3, 6), // (Pitchers only) resistance to intimidation
      pitching_accuracy: 6+dice(2, 6),
      hand: dice(1, 2) == 1 ? "L" : "R",
    }
    this.game_history = {};
    this.calculateCareerHistory();
  }

  get stat_template() {
    return {
      offense: {
        at_bat: 0,
        runs: 0,
        hits: 0,
        home_runs: 0,
        runs_batted_in: 0,
        walks: 0,
        strikeouts: 0,
        sacrifice_flies: 0,
        singles: 0,
        doubles: 0,
        triples: 0
      },
      defense: {
        batters: 0,
        outs: 0,
        hits: 0,
        runs_allowed: 0,
        home_runs: 0,
        hb: 0,
        walks: 0,
        strikeouts: 0,
        era: "0.000",
      },
    }
  }

  setPosition(position) {
    this.position = position;
    // Pitchers are good at pitching
    if (this.position.symbol == "P") {
      this.stats.pitching_accuracy += dice(1, 4);
    }
    if (2 <= this.position.id && this.position.id <= 4) {
      this.stats.batting_accuracy += 2;
    }
    if (5 <= this.position.id && this.position.id <= 7) {
      this.stats.batting_accuracy += 1;
    }
  }

  calculateCareerBattingHistory() {
    if (this.career_history.offense.at_bat == 0) {
      this.career_history.offense.average = "-";
    } else {
      this.career_history.offense.average = (this.career_history.offense.hits / this.career_history.offense.at_bat).toFixed(3);
    }
    this.career_history.offense.obp = this.obp.toFixed(3);
    this.career_history.offense.slg = this.slg.toFixed(3);
    this.career_history.offense.obs = this.obs.toFixed(3);
  }

  calculateCareerPitchingHistory() {
    for (const [game, stats] of Object.entries(this.game_history)) {
      for (const [key, value] of Object.entries(this.career_history.defense)) {
        this.career_history.defense[key] += stats.defense[key];
      }
    }
    let history = this.career_history.defense;
    let outs = history.outs;
    let ip = outs / 3;
    this.career_history.defense.innings_pitched = Math.floor(ip) + "." + (outs % 3);

    let whip = 0;
    let average = 0;
    let era = 0;

    if (ip > 0) {
      whip = (history.walks + history.hits) / ip;
    }
    if (history.batters > 0) {
      average = history.hits / history.batters;
    }
    if (history.innings_pitched > 0) {
      era = 9 * history.runs_allowed / history.innings_pitched;
    }

    this.career_history.defense.whip = whip.toFixed(3);
    this.career_history.defense.average = average.toFixed(3);
    this.career_history.defense.era = era.toFixed(3);
  }

  calculateCareerHistory() {
    // Aggregate all values in game_history
    let career_history = this.stat_template;
    for (const [game, stats] of Object.entries(this.game_history)) {
      for (const [key, value] of Object.entries(career_history.offense)) {
        career_history.offense[key] += stats.offense[key];
      }
    }
    this.career_history = career_history;
    this.calculateCareerBattingHistory();
    if (this.position && this.position.symbol == "P") {
      this.calculateCareerPitchingHistory();
    }
  }

  register(game_id, type, event, delta) {
    if (typeof this.game_history[game_id] === "undefined") {
      this.game_history[game_id] = this.stat_template;
    }
    this.game_history[game_id][type][event] += delta;
    this.calculateCareerHistory();
  }

  postDefenseEvent(game_id, event_type, response) {
    // this.register(game_id, "defense", [key], [value])
    if (event_type == "batter") {
      this.register(game_id, "defense", "batters", 1);
      return;
    }
    if (event_type == "out_strike") {
      this.register(game_id, "defense", "strikeouts", 1);
    }
    if (event_type == "walk") {
      this.register(game_id, "defense", "walks", 1);
    }
    if (event_type == "hbp") {
      this.register(game_id, "defense", "hb", 1);
    }
    if (event_type == "homerun") {
      this.register(game_id, "defense", "home_runs", 1);
    }
    this.register(game_id, "defense", "outs", response.outs);
    this.register(game_id, "defense", "hits", response.hits);
    this.register(game_id, "defense", "runs_allowed", response.runs);
  }

  postOffenseEvent(game_id, event_type, response) {
    if (event_type == "run") {
      this.register(game_id, "offense", "runs", 1);
      return;
    }
    if (event_type == "out_strike") {
      this.register(game_id, "offense", "at_bat", 1);
      this.register(game_id, "offense", "strikeouts", 1);
      return;
    }
    if (event_type == "out") {
      // Sac fly = no AB counter
      if (response.runs > 0) {
        this.register(game_id, "offense", "sacrifice_flies", 1);
        this.register(game_id, "offense", "runs_batted_in", response.runs);
        return;
      }
      this.register(game_id, "offense", "at_bat", 1);
      return;
    }

    switch (event_type) {
      case "walk":
        this.register(game_id, "offense", "walks", 1);
        return;
      case "homerun":
        this.register(game_id, "offense", "home_runs", 1);
        break;
      case "triple":
        this.register(game_id, "offense", "triples", 1);
        break;
      case "double":
        this.register(game_id, "offense", "doubles", 1);
        break;
      case "single":
        this.register(game_id, "offense", "singles", 1);
        break;
      default:
        return;
    }
    this.register(game_id, "offense", "at_bat", 1);
    this.register(game_id, "offense", "hits", 1);
    this.register(game_id, "offense", "runs_batted_in", response.runs);
  }

  /*
  obp = (hits + walks + hitbypitch) / (at bats + walks + sacrifice flies + hitbypitch)
  */
  get obp() {
    let stats = this.career_history.offense;
    let denom = stats.at_bat + stats.walks + stats.sacrifice_flies;
    if (denom == 0) { return 0; }
    return (stats.hits + stats.walks) / denom;
  }

  // slg = total bases / at bats
  get slg() {
    if (this.career_history.offense.at_bat == 0) {
      return 0;
    }
    let productivity = this.career_history.offense.singles;
    productivity += 2 * this.career_history.offense.doubles;
    productivity += 3 * this.career_history.offense.triples;
    productivity += 4 * this.career_history.offense.home_runs;
    return productivity / this.career_history.offense.at_bat;
  }

  // obs = obp + slg
  get obs() {
    return this.obp + this.slg;
  }
}
