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

function Game_View() {
  this.game_id = null;
  this.querySelector = ".gameWindow";
  this.team_away = null;
  this.team_home = null;

  this.buildStructure = function() {
    var container = document.createElement("DIV");
    container.setAttribute("id", this.game_id);
    var box = document.createElement("TABLE");
    box.setAttribute("class", "boxscore");
    var events = document.createElement("DIV");
    events.setAttribute("class", "events");
    var header = document.createElement("TR");
    var away = document.createElement("TR");
    var home = document.createElement("TR");

    header.setAttribute("class", "boxscore-header");
    away.setAttribute("class", "boxscore-away");
    home.setAttribute("class", "boxscore-home");

    // Names
    var name_cell = document.createElement("TD");
    name_cell.setAttribute("class", "boxscore-cell name");
    header.appendChild(name_cell.cloneNode(true));
    name_cell.style.background = this.team_away.getPrimaryColor();
    name_cell.style.color = this.team_away.getTextColor();
    name_cell.textContent = this.team_away.getName();
    away.appendChild(name_cell.cloneNode(true));
    name_cell.style.background = this.team_home.getPrimaryColor();
    name_cell.style.color = this.team_home.getTextColor();
    name_cell.textContent = this.team_home.getName();
    home.appendChild(name_cell.cloneNode(true));
    // Runs and Hits
    var run_cell = document.createElement("TD");
    run_cell.setAttribute("class", "boxscore-cell runs");
    var hit_cell = document.createElement("TD");
    hit_cell.setAttribute("class", "boxscore-cell hits");
    away.appendChild(run_cell.cloneNode(true));
    away.appendChild(hit_cell.cloneNode(true));
    home.appendChild(run_cell.cloneNode(true));
    home.appendChild(hit_cell.cloneNode(true));
    run_cell.textContent = "R";
    hit_cell.textContent = "H";
    header.appendChild(run_cell.cloneNode(true));
    header.appendChild(hit_cell.cloneNode(true));

    // Finalize
    box.appendChild(header);
    box.appendChild(away);
    box.appendChild(home);
    container.appendChild(box);
    container.appendChild(events);
    document.querySelector(this.querySelector).innerHTML += container.outerHTML;
    
    // Innings
    for (var i = 1; i <= Config.INNING_COUNT; i++) {
      this.addInning(i);
    }
  }

  this.setup = function(game_id, away, home) {
    this.game_id = 'game-' + game_id;
    this.team_away = away;
    this.team_home = home;
    this.buildStructure();
    var run_cell = document.createElement("TD");
  }

  this.addInning = function(inning) {
    var new_inning = document.createElement("TD");
    new_inning.setAttribute("class", "boxscore-cell inning");
    new_inning.setAttribute("data-inning", inning);
    var rows = ["header", "away", "home"];
    for (var i in rows) {
      var row = document.querySelector("#" + this.game_id + " .boxscore-"+rows[i]);
      var run_marker = document.querySelector("#" + this.game_id + " .boxscore-"+rows[i]+" .boxscore-cell.runs");
      row.insertBefore(new_inning.cloneNode(true), run_marker);
    }
    document.querySelector("#" + this.game_id + " .boxscore-header .boxscore-cell[data-inning='"+inning+"']").textContent = inning;
  }

  this.redraw = function(box_score_away, box_score_home) {
    // For each inning, populate contents.
    // For runs and hits, populate with functions
    for (var i in box_score_away.runs) {
      var node = document.querySelector("#" + this.game_id + " .boxscore-away .boxscore-cell[data-inning='"+i+"']");
      if (node == null) {
        // Add inning
        this.addInning(i);
        node = document.querySelector("#" + this.game_id + " .boxscore-away .boxscore-cell[data-inning='"+i+"']");
      }
      node.textContent = box_score_away.runs[i];
    }
    document.querySelector("#" + this.game_id + " .boxscore-away .runs").textContent = box_score_away.getScore().toString();
    document.querySelector("#" + this.game_id + " .boxscore-away .hits").textContent = box_score_away.getHits().toString();

    for (var i in box_score_home.runs) {
      var node = document.querySelector("#" + this.game_id + " .boxscore-home .boxscore-cell[data-inning='"+i+"']");
      node.textContent = box_score_home.runs[i];
    }
    document.querySelector("#" + this.game_id + " .boxscore-home .runs").textContent = box_score_home.getScore().toString();
    document.querySelector("#" + this.game_id + " .boxscore-home .hits").textContent = box_score_home.getHits().toString();
  }

  this.showEvents = function(event_log) {
    var event_list = document.createElement("UL");
    var content, item;
    for (var i in event_log) {
      content = event_log[i];
      item = document.createElement("LI");
      item.textContent = content;
      if ((content.includes("INNING") || content.includes("scoring"))) {
        event_list.appendChild(item.cloneNode(true));
      } else if (!(content.includes(" Out")) && Config.POST_REPORTING < Config.POST_REPORTING_HIGH) {
        event_list.appendChild(item.cloneNode(true));
      } else if (Config.POST_REPORTING < Config.POST_REPORTING_MEDIUM) {
        event_list.appendChild(item.cloneNode(true));
      }
    }
    document.querySelector("#" + this.game_id + " .events").innerHTML = event_list.outerHTML;
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
    return {outs: 0, runs: 1, hits: 0, description: "Walk"};
  }

  this.single = function() {
    // '3' always scores
    // '2' scores 50% of the time, goes to 3rd 50%
    // '1' depends on 2:
    // - '3' or '2' on '2' scores
    // - '2' on '2' to '3'
    var run_count = this.bases['3'] ? 1 : 0;
    this.bases['3'] = false;
    if (Math.random() > 0.5) {
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
    this.bases['1'] = false;
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
    if (type == Config.OUT_GROUND) {
      /*
      Ground outs can manifest as:
      Out, no runners advance
      Double Play, removing one runner and the batter
      Sacrifice, advancing 1 but clearing
      */
      description = "Ground Out";
    } else if (type == Config.OUT_FLY) {
      /*
      Fly outs can manifest as:
      Out, no runners advance
      Out, but runners advance
      */
      description = "Fly Out";
    } else if (type == Config.OUT_STRIKE) {
      /*
      Nothing changes in basepath
      */
      description = "Struck Out";
    }
    return {outs: 1, runs: 0, hits: 0, description: description};
  }

  this.play = function(type) {
    // Switchboard for plays.
    if (typeof this[type] === "function") {
      return this[type]();
    }
    return { error: "Play ["+type+"] doesn't exist" };
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
  this.box_score = {
    home: new Box_Score(),
    away: new Box_Score()
  }

  this.game_view = new Game_View();
  this.events = new Event();

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
  this.half_inning = function(batting, fielding) {
    var box_index;
    if (this.team_home == batting) {
      box_index = "home";
    } else {
      box_index = "away";
    }
    this.box_score[box_index].initializeInning(this.current_inning);
    var outs = 0;
    var base_path = new Base_Path();
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
      response = base_path.play(event_type);
      this.events.post(batting, response.description + "; " + base_path.getRunnerDescription());
      outs += response.outs;
      if (outs >= Config.REQUIRED_OUTS) {
        break;
      }

      this.box_score[box_index].addRuns(this.current_inning, response.runs);
      if (response.hits) {
        this.box_score[box_index].addHit(this.current_inning);
      }
    } while (true);
  }

  this.inning = function() {
    // Increment the current inning
    this.current_inning++;
    // Assign home team as fielding and away team as batting
    // Half inning
    this.events.post(null, "INNING " + this.current_inning);
    this.half_inning(this.team_away, this.team_home);
    this.game_view.redraw(this.box_score.away, this.box_score.home);
    // Assign away team as fielding and home team as batting
    // Half inning
    if (this.current_inning >= Config.INNING_COUNT && this.box_score.home.getScore() > this.box_score.away.getScore()) {
      // No need to play bottom half of an inning if the home team is winning and the game would be over after they play.
      return true;
    }
    this.half_inning(this.team_home, this.team_away);
    this.game_view.redraw(this.box_score.away, this.box_score.home);

    return (this.current_inning >= Config.INNING_COUNT && this.box_score.home.getScore() != this.box_score.away.getScore());
  }

  this.play = function() {
    var game_finished = false;
    do {
      game_finished = this.inning();
    } while (!game_finished);
    /* TODO post the victor to update records */
    this.game_view.showEvents(this.events.event_log);
  }
}
