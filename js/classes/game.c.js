import { BoxScore } from "./score.c.js";
import { EventLogger } from "./eventlogger.c.js";
import { Bases } from "./bases.c.js";
import { Pitching } from "./pitching.c.js";
import { uuid, redraw } from "../module/util.m.js";
import { settings } from "../module/settings.m.js";

export class Game {
  constructor(away, home) {
    this.team_away = away;
    this.team_home = home;

    this.is_finished = false;

    this.current_inning = 0;
    this.half = "^";
    this.is_real_time = false;
    this.base_path = null;
    this.outs = 0;
    this.box_score = {
      home: new BoxScore(),
      away: new BoxScore()
    };

    this.events = new EventLogger();

    this.id = uuid();
  }

  get max_inning() {
    if (this.current_inning <= settings.inning_count) {
      return settings.inning_count;
    }
    return this.current_inning;
  }

  setRealTime(is_real_time) {
    this.is_real_time = is_real_time;
  }

  async half_inning(batting, fielding) {
    let box_index;
    if (this.team_home == batting) {
      box_index = "home";
      this.half = "v";
    } else {
      box_index = "away";
      this.half = "^";
    }
    this.box_score[box_index].initializeInning(this.current_inning);
    this.outs = 0;
    this.base_path = new Bases();
    if (this.current_inning > settings.inning_count && settings.base_runner_extra) {
      // Last person in the lineup starts at second. at_bat hasn't increment yet this inning.
      this.base_path.startRunnerOnSecond(batting.at_bat);
    }
    let pitching = new Pitching(fielding.getPlayerByPosition("P"));
    let pitcher = pitching.pitcher;
    do {
      let batter = batting.nextBatter();
      pitcher.postDefenseEvent(this.id, "batter");
      // Modify stats of batter and game based on response
      // Determine current player
      // Get their stats
      let runs = 0;
      let base_advance = 0;
      let parameters = {
        batter: batter,
        bases: this.base_path.getBaseRunners(),
        outs: this.outs,
      };
      let event = pitching.getBattingEvent(parameters);
      let response = await this.base_path.play(event, this.outs, batter);
      /*
      Future consideration: Single event system, where eventlogger and batter both listen?
      */
      pitcher.postDefenseEvent(this.id, event, response);
      batter.postOffenseEvent(this.id, event, response);
      for (let runner of response.scored) {
        runner.postOffenseEvent(this.id, "run", 1);
      }
      this.events.postBatter(this.current_inning, batting, batter, response.description + "; " + this.base_path.getRunnerDescription());
      this.outs += response.outs;
      redraw({
        type: "game",
        id: this.id
      });
      if (this.outs >= settings.required_outs) {
        break;
      }
      this.box_score[box_index].addRuns(this.current_inning, response.runs);
      if (response.hits) {
        this.box_score[box_index].addHit(this.current_inning);
      }
      if (this.current_inning >= settings.inning_count && box_index == "home" && this.box_score.home.getScore() > this.box_score.away.getScore()) {
        this.events.postBatter(this.current_inning, batting, batter, "Ended the game by scoring");
        break;
      }
    } while (true);
    redraw({
      type: "game",
      id: this.id
    });
  }

  async inning() {
    this.current_inning++;
    this.events.postInning(this.current_inning);
    this.events.postTeam(this.current_inning, this.team_away);
    await this.half_inning(this.team_away, this.team_home);

    if (this.current_inning >= settings.inning_count && this.box_score.home.getScore() > this.box_score.away.getScore()) {
      // No need to play bottom half of an inning if the home team is winning and the game would be over after they play.
      return true;
    }
    this.events.postTeam(this.current_inning, this.team_home);
    await this.half_inning(this.team_home, this.team_away);

    return (this.current_inning >= settings.inning_count && this.box_score.home.getScore() != this.box_score.away.getScore());
  }

  async play() {
    redraw({
      type: "game",
      id: this.id
    });
    do {
      this.is_finished = await this.inning();
    } while (!this.is_finished);
    redraw({
      type: "game",
      id: this.id
    });
    return this.box_score;
  }

  getWinner() {
    if (this.box_score['home'].getScore() > this.box_score['away'].getScore()) {
      return this.team_home;
    }
    return this.team_away;
  }
}
