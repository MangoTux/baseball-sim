function Season_View() {
  // Button to move to next day
  // Label above gameWindow to show Game [X] of Config.season_length
  this.new_day = function(game) {
    // Hide button to move to next day
    // Clear game ui, except for Game [X] of Config.season_length
    document.querySelector(Config.SELECTOR_GAME).innerHTML = "";
    if (document.querySelector(Config.SELECTOR_NEW_DAY_BUTTON)) {
      document.querySelector(Config.SELECTOR_NEW_DAY_BUTTON).remove();
    }
    document.querySelector(Config.SELECTOR_GAME).innerHTML = "<div class='overview'>" + "Game " + game + " of " + Config.SEASON_LENGTH + "</div>";
  }

  this.end_day = function() {
    // Show button to move to next day
    var standings_window = document.querySelector(Config.SELECTOR_STANDINGS)
    var button = document.createElement("BUTTON");
    button.setAttribute("onclick", "next_day()");
    button.textContent = "New Day";
    button.setAttribute("class", "next_day");
    standings_window.innerHTML += button.outerHTML;
  }
}

function Standings_View() {
  this.draw = function(record) {
    document.querySelector(Config.SELECTOR_STANDINGS).innerHTML ="";
    var columns = {
      "wins": "W",
      "losses": "L",
      "percentage": "PCT",
      "games_back": "GB",
      "streak": "STRK",
      "runs_scored": "RS",
      "runs_allowed": "RA",
      "run_differential": "RD",
    };
    for (var i = 0; i < Config.DIVISION_COUNT; i++) {
      var container = document.createElement("DIV");
      var standings = document.createElement("TABLE");
      standings.setAttribute("class", "division");
      var header = document.createElement("TR");
      header.setAttribute("class", "division-header");
      var column = document.createElement("TD");
      column.setAttribute("class", "name");
      column.textContent = "Division " + (i+1);
      header.appendChild(column.cloneNode(true));
      for (var j in columns) {
        column.setAttribute("class", j);
        column.textContent = columns[j];
        column.style["text-align"] = "center";
        header.appendChild(column.cloneNode(true));
      }
      standings.appendChild(header);
      var row;
      for (var j = 0; j < record[i].length; j++) {
        row = document.createElement("TR")
        row.setAttribute("class", "division-team");
        row.setAttribute("id", record[i][j].team_object.id);
        column.setAttribute("class", "name");
        column.setAttribute("title", record[i][j].team_object.getName());
        column.textContent = record[i][j].team_object.name;
        column.style.background = record[i][j].team_object.getPrimaryColor();
        column.style.color = record[i][j].team_object.getTextColor();
        column.style["text-align"] = "left";
        row.appendChild(column.cloneNode(true));
        column.style.background = "white";
        column.style.color = "black";
        for (var k in columns) {
          column.setAttribute("class", k);
          column.textContent = record[i][j][k];
          column.style["text-align"] = "center";
          row.appendChild(column.cloneNode(true));
        }
        standings.appendChild(row.cloneNode(true));
      }
      standings.innerHTML += "<br>";
      document.querySelector(Config.SELECTOR_STANDINGS).innerHTML += standings.outerHTML;
    }
  }

  this.setup = function(record) {
    this.draw(record);
  }
}

function Game_View() {
  this.game_id = null;
  this.team_away = null;
  this.team_home = null;

  this.buildStructure = function() {
    var container = document.createElement("DIV");
    container.setAttribute("id", this.game_id);
    container.setAttribute("class", "game");
    var box = document.createElement("TABLE");
    box.setAttribute("class", "boxscore");
    var events = document.createElement("DIV");
    events.setAttribute("class", "events");
    var batting = document.createElement("DIV");
    batting.setAttribute("class", "batting");
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
    // Batting window
    var base_list = document.createElement("UL");
    base_list.setAttribute("class", "base-list");
    var base = document.createElement("LI");
    base.setAttribute("class", "base first");
    base_list.appendChild(base.cloneNode(true));
    base.setAttribute("class", "base second");
    base_list.appendChild(base.cloneNode(true));
    base.setAttribute("class", "base third");
    base_list.appendChild(base.cloneNode(true));
    var out_detail = document.createElement("DIV");
    out_detail.setAttribute("class", "out-list");
    var out = document.createElement("DIV");
    out_detail.appendChild(out.cloneNode(true));
    for (var i = 1; i <= Config.REQUIRED_OUTS; i++) {
      out.setAttribute("class", "out out-"+i);
      out_detail.appendChild(out.cloneNode(true));
    }
    var inning_detail = document.createElement("DIV");
    inning_detail.setAttribute("class", "inning-info");
    inning_detail.textContent = "^ 1";

    batting.appendChild(base_list);
    batting.appendChild(out_detail);
    batting.appendChild(inning_detail);
    // Finalize
    box.appendChild(header);
    box.appendChild(away);
    box.appendChild(home);
    container.appendChild(box);
    container.appendChild(events);
    container.appendChild(batting);
    document.querySelector(Config.SELECTOR_GAME).innerHTML += container.outerHTML;

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

  this.scoreboard = function(box_score_away, box_score_home) {
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

  this.events = function(event_log) {
    var event_list = document.createElement("UL");
    var content, item;
    for (var i in event_log) {
      content = event_log[i];
      item = document.createElement("LI");
      item.textContent = content;
      if ((content.includes("INNING") || content.includes("scoring")) && Config.POST_REPORTING < Config.POST_REPORTING_NONE) {
        event_list.prepend(item.cloneNode(true));
      } else if (!(content.includes(" Out")) && Config.POST_REPORTING < Config.POST_REPORTING_HIGH) {
        event_list.prepend(item.cloneNode(true));
      } else if (Config.POST_REPORTING < Config.POST_REPORTING_MEDIUM) {
        event_list.prepend(item.cloneNode(true));
      }
    }
    document.querySelector("#" + this.game_id + " .events").innerHTML = event_list.outerHTML;
  }

  this.batting = function(outs, base_path) {
    var base_mapper = {
      '1':'.first',
      '2':'.second',
      '3':'.third'
    };
    var base;
    for (var i in base_mapper) {
      base = document.querySelector("#" + this.game_id + " .batting .base"+base_mapper[i]).classList;
      if (base_path.bases[i]) {
        base.add("active");
      } else {
        base.remove("active");
      }
    }
    var out;
    for (var i = 1; i <= Config.REQUIRED_OUTS; i++) {
      out = document.querySelector("#" + this.game_id + " .batting .out-list .out.out-"+i).classList;
      if (i <= outs) {
        out.add("active");
      } else {
        out.remove("active");
      }
    }
  }

  this.inning = function(inning, half) {
    document.querySelector("#" + this.game_id + " .inning-info").textContent = half + " " + inning;
  }

  this.update = function(game) {
    this.scoreboard(game.box_score.away, game.box_score.home);
    this.events(game.events.event_log);
    this.batting(game.outs, game.base_path);
    this.inning(game.current_inning, game.half);
  }
}
