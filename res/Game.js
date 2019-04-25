function Event() {
  this.event_log = [];
  this.post = function(team, description) {
    if (team == null) {
      this.event_log.push("====" + description + "====");
      return;
    }
    this.event_log.push(team.getName() + ": " + description);
  }
}

function Box_Score() {
  this.runs = {};
  this.hits = {};
  this.getScore = function() {
    var runs = 0;
    for (var i in this.runs) {
      runs += this.runs[i];
    }
    return runs;
  }
  this.getHits = function() {
    var hits = 0;
    for (var i in this.hits) {
      hits += this.hits[i];
    }
    return hits;
  }
  this.addHit = function(inning) {
    if (this.hits[inning] == undefined) {
      this.hits[inning] = 0;
    }
    this.hits[inning]++;
  }
  this.addRuns = function(inning, runs) {
    if (this.runs[inning] == undefined) {
      this.runs[inning] = 0;
    }
    this.runs[inning] += runs;
  }
  this.initializeInning = function(inning) {
    this.runs[inning] = 0;
    this.hits[inning] = 0;
  }
}

function Base_Path() {
  this.bases = {
    '1': false,
    '2': false,
    '3': false,
  };

  this.walk = function() {
    if (this.getBaseRunners() == 3) {
      return {outs: 0, runs: 1, hits: 0};
    }
    // For a walk, you only advance if you're walking, or if the runner on base-1 is advancing.
    // Abstracted (without caring about which runner is on the base), the logic for each base
    // post-walk is as follows.
    this.bases['3'] = this.bases['3'] || (this.bases['2'] && this.bases['1']);
    this.bases['2'] = this.bases['2'] || this.bases['1'];
    this.bases['1'] = true;
    return {outs: 0, runs: 0, hits: 0, description: "Walk"};
  }

  this.single = function(quick_advance) {
    if (quick_advance == undefined) {
      quick_advance = true;
    }
    // '3' always scores
    // '2' scores 50% of the time, goes to 3rd 50%
    // '1' depends on 2:
    // - '3' or '2' on '2' scores
    // - '2' on '2' to '3'
    var run_count = this.bases['3'] ? 1 : 0;
    this.bases['3'] = false;
    if (quick_advance && Math.random() > 0.5) {
      run_count += this.bases['2'] ? 1 : 0;
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
    this.bases['1'] = true;
    var description = "Single";
    if (run_count) {
      description += ", scoring " + run_count;
    }
    return {outs: 0, runs: run_count, hits: 1, description: description};
  }

  this.double = function() {
    // '3' always scores
    // '2' always scores
    // '1' scores 25% of the time, goes to 3rd 75%
    // Batter goes to second
    var run_count = this.bases['3'] ? 1 : 0;
    this.bases['3'] = false;
    run_count += this.bases['2'] ? 1 : 0;
    this.bases['2'] = false;
    if (Math.random() > 0.75) {
      run_count += this.bases['1'] ? 1 : 0;
    } else {
      this.bases['3'] = this.bases['1'];
    }
    this.bases['2'] = true;
    this.bases['1'] = false;
    var description = "Double";
    if (run_count) {
      description += ", scoring " + run_count;
    }
    return {outs: 0, runs: run_count, hits: 1, description: description};
  }

  this.triple = function() {
    // On a triple, only the batter will still be on the basepath.
    var run_count = this.getBaseRunners();
    this.bases['1'] = false;
    this.bases['2'] = false;
    this.bases['3'] = true;
    var description = "Triple";
    if (run_count) {
      description += ", scoring " + run_count;
    }
    return {outs: 0, runs: run_count, hits: 1, description: description};
  }

  this.homerun = function() {
    // On a home run, the batter and every runner will score.
    var run_count = 1 + this.getBaseRunners();
    this.bases['1'] = false;
    this.bases['2'] = false;
    this.bases['3'] = false;
    var description = "Home run, scoring " + run_count
    return {outs: 0, runs: run_count, hits: 1, description: description};
  }

  this.out = function() {
    var type = Config.OUT_TYPES[Math.floor(Math.random() * Config.OUT_TYPES.length)];
    var description = "";
    var run_count = 0;
    var hit_count = 0;
    var out_count = 1;
    var out_style = Math.random();
    if (type == Config.OUT_GROUND) {
      description = "Ground Out";
      if (this.getBaseRunners() > 0) {
        if (out_style < 0.8) {
          // Out, standard
        } else if (out_style < 0.9) {
          // Double play. Two outs, removing the batter and one runner. Option to advance
          var behavior = this.single(false);
          this.bases['1'] = false;
          if (this.bases['2']) {
            this.bases['2'] = false;
          } else if (this.bases['3']) {
            this.bases['3'] = false;
          }
          out_count = 2;
          description += " into Double Play.";
          run_count = behavior.runs;
          description += " Runners Advance.";
          if (run_count > 0) {
            description += " " + run_count + "Scored";
          }
        } else {
          // Sacrifice. Everybody advances one, but the runner on first is cleared
          var behavior = this.single(false);
          this.bases['1'] = false;
          run_count = behavior.runs;
          description += ", Advancing runners";
          if (run_count > 0) {
            description += " " + run_count + "Scored";
          }
        }
      }
      /*
      Ground outs can manifest as:
      Out, no runners advance (100% when getBaseRunners is 0), (80% when greater than 0)
      Double Play, removing one runner and the batter (10% when greater than 0)
      Sacrifice, advancing 1 but clearing the batter from first (10% when greater than 0)

      */
    } else if (type == Config.OUT_FLY) {
      description = "Fly Out";
      if (this.getBaseRunners() > 0 && out_style > 0.8) {
        var behavior = this.single();
        this.bases['1'] = false;
        run_count = behavior.runs;
        description += ", Advancing runners.";
        if (run_count > 0) {
          description += " " + run_count + " Scored";
        }
      }
      /*
      Fly outs can manifest as:
      Out, no runners advance
      Out, but runners advance
      */
    } else if (type == Config.OUT_STRIKE) {
      /*
      Nothing changes in basepath
      */
      description = "Struck Out";
    }
    return {outs: out_count, runs: run_count, hits: hit_count, description: description};
  }

  this.play = async function(type) {
    // Switchboard for plays.
    if (typeof this[type] !== "function") {
      return { error: "Play ["+type+"] doesn't exist" };
    }
    /*
    If the game is in real time, i.e. you can follow the plays as the game goes along,
    then create a randomly-delayed promise that will bubble back up to inning, so the entire game isn't completed
    before the first inning has had a chance to run through 3 outs.
    I'm using Promises (an entirely new concept to me) as opposed to a basic setTimeout, as that would lock the page.
    This is fine as long as there is only one game and no other interactive component, but starts to become unfeasible
    very quickly.
    */
    let play_time = 0;
    if (Config.REAL_TIME) {
      play_time = 2000 + Math.floor(Math.random() * 1000);
    }
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this[type]())
      }, play_time)
    });
  }

  this.getBaseRunners = function() {
    var runners = 0;
    for (var i in this.bases) {
      if (this.bases[i]) { runners++; }
    }
    return runners;
  }

  this.getRunnerDescription = function() {
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
}

function Game() {
  this.team_away = null;
  this.team_home = null;
  this.current_inning = 0;
  this.is_real_time = false;
  this.base_path = null;
  this.outs = 0;
  this.box_score = {
    home: new Box_Score(),
    away: new Box_Score()
  }

  this.game_view = new Game_View();
  this.events = new Event();

  this.setRealTime = function(is_real_time) {
    this.is_real_time = is_real_time;
  }

  this.setup = function(away, home) {
    this.team_away = away;
    this.team_home = home;
    this.game_id = uuid();
    this.game_view.setup(this.game_id, away, home);
  }

  /*
  This event system is kind of messy.
  TODO Incorporate fielding and batting stats to provide a more dynamic value
  */
  this.half_inning = async function(batting, fielding) {
    var box_index;
    if (this.team_home == batting) {
      box_index = "home";
    } else {
      box_index = "away";
    }
    this.box_score[box_index].initializeInning(this.current_inning);
    this.outs = 0;
    this.base_path = new Base_Path();
    var event_type;
    do {
      var runs = 0;
      var base_advance = 0;
      var event = parseInt(20 * Math.random());
      /*
      TODO Incorpoarte fielding, batting, and weather stats to provide a more dynamic value.
      */
      if (0 <= event && event < 15) {
        event_type = Config.PLAY_OUT;
      } else if (15 <= event && event < 16) {
        event_type = Config.PLAY_WALK;
      } else if (16 <= event && event < 20) {
        if (16 <= event && event < 18) {
          event_type = Config.PLAY_SINGLE;
        } else if (18 <= event && event < 19) {
          event_type = Config.PLAY_DOUBLE;
        } else if (19 <= event && event < 20) {
          if (Math.random() > 0.75) {
            event_type = Config.PLAY_TRIPLE;
          } else {
            event_type = Config.PLAY_HOMERUN;
          }
        }
      }
      response = await this.base_path.play(event_type);
      this.events.post(batting, response.description + "; " + this.base_path.getRunnerDescription());
      this.outs += response.outs;
      this.game_view.update(this);
      if (this.outs >= Config.REQUIRED_OUTS) {
        break;
      }
      if (this.current_inning >= 9 && box_index == "home" && this.box_score.home.getScore() > this.box_score.away.getScore()) {
        this.events.post(batting, "Ended the game by scoring");
        break;
      }

      this.box_score[box_index].addRuns(this.current_inning, response.runs);
      if (response.hits) {
        this.box_score[box_index].addHit(this.current_inning);
      }
    } while (true);
  }

  this.inning = async function() {
    // Increment the current inning
    this.current_inning++;
    // Assign home team as fielding and away team as batting
    // Half inning
    this.events.post(null, "INNING " + this.current_inning);
    await this.half_inning(this.team_away, this.team_home);
    // Assign away team as fielding and home team as batting
    // Half inning
    if (this.current_inning >= Config.INNING_COUNT && this.box_score.home.getScore() > this.box_score.away.getScore()) {
      // No need to play bottom half of an inning if the home team is winning and the game would be over after they play.
      return true;
    }
    await this.half_inning(this.team_home, this.team_away);

    return (this.current_inning >= Config.INNING_COUNT && this.box_score.home.getScore() != this.box_score.away.getScore());
  }

  this.play = async function() {
    var game_finished = false;
    do {
      game_finished = await this.inning();
    } while (!game_finished);
    /* TODO post the victor to update records */
  }
}
