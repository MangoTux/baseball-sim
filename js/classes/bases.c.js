import { settings } from "../module/settings.m.js";

export class Bases {
  constructor() {
    this.bases = {
      '1': false,
      '2': false,
      '3': false,
    };
  }

  hbp() {
    let response = this.walk();
    response.description = response.runs ? "Hit By Pitch, sending a runner home" : "Hit by pitch";
    return response;
  }

  walk() {
    if (this.getBaseRunners() == 3) {
      let scored = this.getPlayersOnBases([3]);
      this.bases['3'] = this.bases['2'];
      this.bases['2'] = this.bases['1'];
      this.bases['1'] = this.batter;
      return {
        outs: 0,
        runs: 1,
        hits: 0,
        scored: scored,
        description: "Walk, sending a runner home"
      };
    }
    // For a walk, you only advance if you're walking, or if the runner on base-1 is advancing.
    // Abstracted (without caring about which runner is on the base), the logic for each base
    // post-walk is as follows.
    if (this.bases['2'] && this.bases['1']) {
      this.bases['3'] = this.bases['2'];
      this.bases['2'] = this.bases['1'];
    } else if (this.bases['1']) {
      this.bases['2'] = this.bases['1'];
    }
    this.bases['1'] = this.batter;
    return {
      outs: 0,
      runs: 0,
      hits: 0,
      scored: [],
      description: "Walk"
    };
  }

  single(quick_advance) {
    let scored = this.getPlayersOnBases([3]);
    if (typeof quick_advance === "undefined") {
      quick_advance = true;
    }
    this.bases['3'] = false;
    if (quick_advance && Math.random() > 0.5) {
      scored.concat(this.getPlayersOnBases[2]);
      this.bases['2'] = false;
      if (Math.random() > 0.5) {
        this.bases['3'] = this.bases['1'];
      } else {
        this.bases['2'] = this.bases['1'];
      }
    } else {
      this.bases['3'] = this.bases['2'];
      this.bases['2'] = this.bases['1'];
    }
    let run_count = scored.length;
    this.bases['1'] = this.batter;
    let description = "Single";
    if (run_count) {
      description += ", scoring " + run_count;
    }
    return {
      outs: 0,
      runs: run_count,
      hits: 1,
      scored: scored,
      description: description
    };
  }

  double() {
    let scored = this.getPlayersOnBases([2, 3]);
    this.bases['3'] = false;
    this.bases['2'] = false;
    // Storing players on basepath would allow stat skew
    if (Math.random() > 0.75) {
      scored.concat(this.getPlayersOnBases([1]));
    } else {
      this.bases['3'] = this.bases['1'];
    }
    let run_count = scored.length;
    this.bases['2'] = this.batter;
    this.bases['1'] = false;
    let description = "Double";
    if (run_count) {
      description += ", scoring " + run_count;
    }
    return {
      outs: 0,
      runs: run_count,
      hits: 1,
      scored: scored,
      description: description
    };
  }

  triple() {
    let run_count = this.getBaseRunners();
    let scored = this.getPlayersOnBases([1, 2, 3]);
    this.bases['1'] = false;
    this.bases['2'] = false;
    this.bases['3'] = this.batter;
    let description = "Triple";
    if (run_count) {
      description += ", scoring " + run_count;
    }
    return {
      outs: 0,
      runs: run_count,
      hits: 1,
      scored: scored,
      description: description
    };
  }

  homerun() {
    let scored = this.getPlayersOnBases([1, 2, 3]);
    scored.push(this.batter);
    let run_count = 1 + this.getBaseRunners();
    this.bases['1'] = false;
    this.bases['2'] = false;
    this.bases['3'] = false;
    let description = "Home run, scoring " + run_count;
    return {
      outs: 0,
      runs: run_count,
      hits: 1,
      scored: scored,
      description: description
    };
  }

  out_ground() {
    let response = {
      outs: 1,
      runs: 0,
      hits: 0,
      scored: [],
      description: "Fly Out",
    }
    let out_style = Math.random();

    if (this.getBaseRunners() > 0 && out_style > 0.8 && this.outs < settings.required_outs) {
      let behavior = this.single();
      this.bases['1'] = false;
      response.runs = behavior.runs;
      response.scored = behavior.scored;
      response.description += ", Advancing runners.";
      if (response.runs > 0) {
        response.description += ` ${response.runs} Scored`;
      }
    }
    return response;
  }

  out_fly() {
    let response = {
      outs: 1,
      runs: 0,
      hits: 0,
      scored: [],
      description: "Ground Out"
    }
    let out_style = Math.random();

    if (this.getBaseRunners() > 0 && this.outs < settings.required_outs - 1) {
      if (0.8 <= out_style && out_style < 0.9) {
        // Double play
        let behavior = this.single(false);
        this.bases['1'] = false;
        if (this.bases['2']) {
          this.bases['2'] = false;
        } else if (this.bases['3']) {
          this.bases['3'] = false;
        }
        response.outs = 2;
        response.description += " into Double Play.";
        response.runs = behavior.runs;
        response.scored = behavior.scored;
        response.description += " Runners Advance.";
      } else if (0.9 <= out_style) {
        // Sacrifice
        let behavior = this.single(false);
        this.bases['1'] = false;
        response.runs = behavior.runs;
        response.scored = behavior.scored;
        response.description += ", Advancing runners";
      }
    }
    if (response.runs > 0) {
      response.description += ` ${response.runs} Scored`;
    }
    return response;
  }

  out_strike() {
    return {
      outs: 1,
      runs: 0,
      hits: 0,
      scored: [],
      out_type: "out_strike",
      description: "Struck out",
    };
  }

  out() {
    let out_options = [ "ground_out", "fly_out" ];
    let type = out_options[Math.floor(Math.random() * out_options.length)];

    let response;
    if (type == "ground_out") {
      response = this.out_ground();
    } else {
      response = this.out_fly();
    }
    response.out_type = type;
    return response;
  }

  // Play switchboard
  async play(type, outs, batter) {
    this.outs = outs;
    if (typeof this[type] !== "function") {
      return { error: `Play [${type}] doesn't exist` };
    }
    let play_time = 1000 + Math.floor(Math.random() * 1000);
    if (!settings.real_time) {
      play_time = 1;
    }
    this.batter = batter;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this[type]())
      }, play_time)
    });
  }

  // Returns an array of players who are on the provided bases.
  getPlayersOnBases(base_arr) {
    let players = [];
    for (let base of base_arr) {
      if (this.bases[base]) {
        players.push(this.bases[base]);
      }
    }
    return players;
  }

  getBaseRunners() {
    let runners = 0;
    for (let i in this.bases) {
      if (this.bases[i]) { runners++; }
    }
    return runners;
  }

  getRunnerDescription() {
    if (this.bases['1'] && this.bases['2'] && this.bases['3']) {
      return "Bases are loaded.";
    }
    if (this.bases['1'] && this.bases['2'] && !this.bases['3']) {
      return "Runners on first and second.";
    }
    if (this.bases['1'] && !this.bases['2'] && this.bases['3']) {
      return "Runners on the corners.";
    }
    if (this.bases['1'] && !this.bases['2'] && !this.bases['3']) {
      return "A runner on first.";
    }
    if (!this.bases['1'] && this.bases['2'] && this.bases['3']) {
      return "Two runners in scoring position.";
    }
    if (!this.bases['1'] && this.bases['2'] && !this.bases['3']) {
      return "A runner on second.";
    }
    if (!this.bases['1'] && !this.bases['2'] && this.bases['3']) {
      return "A runner on third.";
    }
    if (!this.bases['1'] && !this.bases['2'] && !this.bases['3']) {
      return "Nobody on.";
    }
  }

  startRunnerOnSecond(player) {
    this.bases['2'] = player;
  }
}
