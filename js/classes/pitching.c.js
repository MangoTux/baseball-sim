import { dice } from "../module/util.m.js";

export class Pitching {
  constructor(pitcher) {
    this.pitcher = pitcher;
    this.batter = null;
  }

  isIntimidating() {
    return (this.batter.stats.intimidation - this.pitcher.stats.resolve) + dice(1, 20) > 10;
  }

  /*
  Returns a Strike or Ball, depending on a set of rolls
  */
  getZoneLocation() {
    // Chance to modify this based on other stats
    let accuracy_threshold = 8;
    // Batter makes an intimidation check against the pitcher's resolve
    let accuracy_hit = dice(1, this.pitcher.stats.pressure) * (this.isIntimidating() ? 1 : 0);
    let accuracy_mod = Math.floor((this.pitcher.stats.pitching_accuracy - 10) / 2) - accuracy_hit;
    let response = dice(1, 20) + accuracy_mod;
    if (response >= accuracy_threshold) {
      return "strike";
    }
    return "ball";
  }

  /*
  Returns true if the batter is able to meet the accuracy DC,
  modified by pressure of outs, baserunners
  */
  batterDoesContact(zone) {
    let accuracy_threshold = 12;
    let roll = dice(1, 20);
    if (roll == 20) {
      return true;
    }
    if (roll == 1) {
      return false;
    }
    let accuracy_mod = Math.floor((this.batter.stats.batting_accuracy - 10) / 2);
    if (this.situation.outs == 2) {
      accuracy_mod -= dice(1, this.batter.stats.pressure);
    }
    if (this.situation.bases >= 2) {
      accuracy_mod -= dice(1, this.batter.stats.pressure);
    }
    return (roll + accuracy_mod >= accuracy_threshold);
  }
  /*
  Returns the event based on a player's stats and the game situation
  parameters is an object containing (at least):
  batter: the current batter
  bases: number of bases filled
  outs: number of outs
  */
  getBattingEvent(parameters) {
    let pitch_count = {
      strikes: 0,
      balls: 0,
    };
    this.batter = parameters.batter;
    this.situation = parameters;
    do {
      // Generate pitch
      let zone_location = this.getZoneLocation();
      let contact = this.batterDoesContact(zone_location);
      /*
      pitcher.pitching_accuracy, batter.batting_accuracy, intimidation vs resolve, stamina skew
      */
      if (!contact && zone_location == "strike") {
        pitch_count.strikes++;
        if (pitch_count.strikes == 3) {
          return "out_strike";
        }
        continue;
      } else if (!contact && zone_location == "ball") {
        let side = ["L", "R", "U", "D"][dice(0, 3)];
        if (this.batter.hand == (side == 1 ) && dice(1, 5) <= 2) {
          return "hbp";
        }
        pitch_count.balls++;
        if (pitch_count.balls == 4) {
          return "walk";
        }
        continue;
      }
      // Pitch type is a hit
      /*
      batter power, stamina, speed
      roll of batting accuracy again: low is fly out

      */
      let roll = dice(1, 30);
      if (roll <= 20) {
        return "out";
      }
      if (roll <= 26) {
        return "single";
      } // Maybe hit for 20-29, then 3d20 success. 2 is double, 3 is triple
      if (roll <= 29) {
        let speed = dice(1, 20);
        return speed < 15 ? "double" : "triple";
      }
      if (roll == 30) {
        return "homerun";
      }
    } while (true);
  }
}
