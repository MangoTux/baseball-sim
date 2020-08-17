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
    }
    this.game_history = {};
    this.calculateCareerHistory();
  }

  get stat_template() {
    return {
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

  calculateCareerHistory() {
    // Aggregate all values in game_history
    let career_history = this.stat_template;
    for (const [game, stats] of Object.entries(this.game_history)) {
      for (const [key, value] of Object.entries(career_history)) {
        career_history[key] += stats[key];
      }
    }
    // After aggregate
    this.career_history = career_history;
    if (career_history.at_bat == 0) {
      this.career_history.average = "-";
    } else {
      this.career_history.average = (career_history.hits / career_history.at_bat).toFixed(3);
    }
    this.career_history.obp = this.obp.toFixed(3);
    this.career_history.slg = this.slg.toFixed(3);
    this.career_history.obs = this.obs.toFixed(3);
  }

  register(game_id, event, delta) {
    if (typeof this.game_history[game_id] === "undefined") {
      this.game_history[game_id] = this.stat_template;
    }
    this.game_history[game_id][event] += delta;
    this.calculateCareerHistory();
  }

  postEvent(game_id, event_type, response) {
    if (event_type == "run") {
      this.register(game_id, "runs", 1);
      return;
    }
    if (event_type == "out_strike") {
      this.register(game_id, "at_bat", 1);
      this.register(game_id, "strikeouts", 1);
      return;
    }
    if (event_type == "out") {
      // Sac fly = no AB counter
      if (response.runs > 0) {
        this.register(game_id, "sacrifice_flies", 1);
        this.register(game_id, "runs_batted_in", response.runs);
        return;
      }
      this.register(game_id, "at_bat", 1);
      return;
    }

    switch (event_type) {
      case "walk":
        this.register(game_id, "walks", 1);
        return;
      case "homerun":
        this.register(game_id, "home_runs", 1);
        break;
      case "triple":
        this.register(game_id, "triples", 1);
        break;
      case "double":
        this.register(game_id, "doubles", 1);
        break;
      case "single":
        this.register(game_id, "singles", 1);
        break;
      default:
        return;
    }
    this.register(game_id, "at_bat", 1);
    this.register(game_id, "hits", 1);
    this.register(game_id, "runs_batted_in", response.runs);
  }

  /*
  obp = (hits + walks + hitbypitch) / (at bats + walks + sacrifice flies + hitbypitch)
  */
  get obp() {
    let stats = this.career_history;
    let denom = stats.at_bat + stats.walks + stats.sacrifice_flies;
    if (denom == 0) { return 0; }
    return (stats.hits + stats.walks) / denom;
  }

  // slg = total bases / at bats
  get slg() {
    if (this.career_history.at_bat == 0) {
      return 0;
    }
    let productivity = this.career_history.singles;
    productivity += 2 * this.career_history.doubles;
    productivity += 3 * this.career_history.triples;
    productivity += 4 * this.career_history.home_runs;
    return productivity / this.career_history.at_bat;
  }

  // obs = obp + slg
  get obs() {
    return this.obp + this.slg;
  }
}
