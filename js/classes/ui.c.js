export class UI {
  constructor() {
    const cache_bust = () => parseInt(1000 * Math.random());
    this.update_queue = [];
    this.last_update_time = null;
    this.selector = {
      standings: "#container_standings",
      team: "#container_team",
      players: "#container_players",
      pitchers: "#container_pitchers",
      gameday: "#container_gameday",
      day: "#day_ticker",
    }
    this.directory = ""; // On production, "/projects/baseball/"
    this.standings = {
      template_url: this.directory + "templates/standings.hbs?v=" + cache_bust(),
      template: null,
      active: true,
    };
    this.team = {
      template_url: this.directory + "templates/team.hbs?v=" + cache_bust(),
      template: null,
      active: false,
    };
    this.game = {
      template_url: this.directory + "templates/boxscore.hbs?v=" + cache_bust(),
      template: null,
    };
    this.gameday = {
      template_url: this.directory + "templates/gameday.hbs?v=" + cache_bust(),
      template: null,
      active: true,
    };
    this.day = {
      template_url: this.directory + "templates/day_ticker.hbs?v=" + cache_bust(),
      template: null,
      active: true,
    };
    this.players = {
      template_url: this.directory + "templates/players.hbs?v=" + cache_bust(),
      template: null,
      active: false,
    };
    this.pitchers = {
      template_url: this.directory + "templates/pitchers.hbs?v=" + cache_bust(),
      template: null,
      active: false,
    };
    this.collapse = true;
    this.current_data = null;

    Handlebars.registerHelper("team_name", function(item) {
      return item.getName();
    });

    Handlebars.registerHelper("team_style", function(team) {
      return `background-color:${team.getAccentColor()};color:${team.getPrimaryColor()}`;
    });

    Handlebars.registerHelper("inning_iter", function(game, block) {
      let accum = '';
      for (let i = 1; i <= game.max_inning; i++) {
        accum += block.fn(i);
      }
      return accum;
    });

    Handlebars.registerHelper("inning_runs", function(game, side, inning) {
      if (typeof game.box_score[side].runs[inning] === "undefined") {
        return "-";
      }
      return game.box_score[side].runs[inning];
    });

    Handlebars.registerHelper("total_game", function(game, side, value) {
      if (value == "hits") {
        return game.box_score[side].getHits();
      }
      return game.box_score[side].getScore();
    });

    Handlebars.registerHelper("game_base", function(game, base) {
      if (game.base_path == null) {
        return "";
      }
      if (!!game.base_path.bases[base]) {
        return "active";
      }
      return "";
    });

    Handlebars.registerHelper("game_outs", function(game, out) {
      if (game.outs >= out) {
        return "active";
      }
      return "";
    });
  }

  async loadTemplates() {
    const modules = ["standings", "team", "gameday", "day", "game", "players", "pitchers"];
    for (let module of modules) {
      await fetch(this[module].template_url)
        .then(response => response.ok ? Promise.resolve(response) : Promise.reject(new Error(response.statusText)))
        .then(response => response.text())
        .then(response => Handlebars.compile(response))
        .then(response => { this[module].template = response; })
        .catch(error => console.log(error));
    }
  }

  setTeam(team_id) {
    this.team.active = true;
    this.team.id = team_id;
  }

  toggleCollapse() {
    this.collapse = !this.collapse;
    if (this.collapse) {
      document.querySelector("#full_display").classList.add("collapse");
      for (let element of document.querySelectorAll(".drilldown-table")) {
        element.classList.add("collapse");
      }
      document.querySelector("#drilldown_collapse").innerHTML = "&gt;&gt;";
    } else {
      document.querySelector("#full_display").classList.remove("collapse");
      for (let element of document.querySelectorAll(".drilldown-table")) {
        element.classList.remove("collapse");
      }
      document.querySelector("#drilldown_collapse").innerHTML = "&lt;&lt;";
    }
  }

  pushUpdate(object) {
    this.update_queue.push(object);
  }

  draw(season) {
    this.current_data = season;
    let current_time = (new Date()).getTime();
    this.gameday.has_loaded || this.drawGameday();
    this.standings.has_loaded || this.drawStandings();
    this.day.has_loaded || this.drawDay();
    if (this.last_update_time == null) {
      this.last_update_time = current_time;
      return;
    }
    if (current_time - this.last_update_time < 1) {
      return;
    }
    this.last_update_time = current_time;
    // Reduce the number of identical updates requested
    const map = new Map();
    const update_queue = [];
    for (const item of this.update_queue) {
      if (!map.has(item.id)) {
        map.set(item.id, true);
        update_queue.push(item);
      }
    }
    // Purge existing updates if gameday is requested
    for (let i = 0; i < update_queue.length; i++) {
      if (update_queue[i].type !== "start") { continue; }
      this.update_queue = [];
      this.drawGameday();
      this.drawDay();
    }
    for (let update of this.update_queue) {
      if (update.type == "game") {
        this.drawGame(update.id);
        if (this.team.active) {
          let game = this.current_data.getGameById(update.id);
          if (game == null) { continue; }
          if ([game.team_home.id, game.team_away.id].includes(this.team.id)) {
            this.drawTeam();
          }
        } else {
          this.drawPitchers();
          this.drawPlayers();
        }
      } else if (update.type == "standings") {
        this.drawStandings();
      } else if (update.type == "team") {
        this.drawTeam();
      }
    }
    this.update_queue = [];
  }

  /*
  Draws the Standings drilldown
  */
  drawStandings() {
    if (!this.standings.active) {
      document.querySelector(this.selector.standings).innerHTML = "";
      return;
    }
    if (this.standings.template == null) {
      document.querySelector(this.selector.standings).innerHTML = "Loading...";
      return;
    }
    this.standings.has_loaded = true;
    // Load the data for presentation
    const data = {
      collapse: this.collapse,
      record: {},
    };
    for (const [division, teams] of Object.entries(this.current_data.standings.record)) {
      let team_arr = [];
      // There's probably something better to get rid of the keys
      for (const [id, team_instance] of Object.entries(teams)) {
        team_arr.push(team_instance);
      }
      data.record[division] = {
        team_list: this.current_data.standings.getSortedDivision(division),
      };
    }
    document.querySelector(this.selector.standings).innerHTML = this.standings.template(data);
  }

  /*
  Draws the Team drilldown
  */
  drawTeam() {
    if (!this.team.active) {
      document.querySelector(this.selector.team).innerHTML = "";
      return;
    }
    if (this.team.template == null || this.team.id == null) {
      document.querySelector(this.selector.team).innerHTML = "Loading...";
      return;
    }
    const team = this.current_data.league.team_list.find(team => team.id == this.team.id);
    const data = {
      collapse: this.collapse,
      name: team.getName(),
      team: [],
    }
    for (const [id, player] of Object.entries(team.player_list)) {
      data.team.push({
        name: player.name,
        position: player.position.symbol,
        career_history: player.career_history,
      });
    }
    document.querySelector(this.selector.team).innerHTML = this.team.template(data);
  }

  drawPlayers() {
    if (!this.players.active) {
      document.querySelector(this.selector.players).innerHTML = "";
      return;
    }
    if (this.players.template == null || this.players.id == null) {
      document.querySelector(this.selector.players).innerHTML = "Loading...";
      return;
    }

    // Get players from all teams and sort stats
  }

  drawPitchers() {
    if (!this.pitchers.active) {
      document.querySelector(this.selector.pitchers).innerHTML = "";
      return;
    }
    if (this.pitchers.template == null || this.pitchers.id == null) {
      document.querySelector(this.selector.pitchers).innerHTML = "Loading...";
      return;
    }

    // Get all pitchers, and assemble their stats
  }

  drawGameday() {
    if (!this.gameday.active) {
      document.querySelector(this.selector.gameday).innerHTML = "";
      return;
    }
    if (this.gameday.template == null) {
      document.querySelector(this.selector.gameday).innerHTML = "Loading...";
      return;
    }
    this.gameday.has_loaded = true;
    const data = {
      collapse: !this.collapse, // Collapse refers to the drilldowns
      game_list: [],
    };
    for (const game of this.current_data.history[this.current_data.current_day]) {
      data.game_list.push(game);
    }
    document.querySelector(this.selector.gameday).innerHTML = this.gameday.template(data);
  }

  drawGame(id) {
    // Get current game details from settings
    if (this.game.template == null) {
      return;
    }
    const data = {
      game: this.current_data.getGameById(id),
      alert: null,
    }
    if (data.game.current_inning >= 5) {
      if (data.game.box_score.home.getHits() == 0 || data.game.box_score.away.getHits() == 0) {
        data.alert = "No Hitter" + (data.game.is_finished ? "!" : " Alert");
      }
    }
    let dom_object = document.querySelector(`#${id}`);
    if (dom_object == null) {
      return; // Carryover from update queue
    }
    dom_object.innerHTML = this.game.template(data);
  }

  drawDay() {
    if (this.day.template == null) {
      return;
    }
    this.day.has_loaded = true;
    const data = {
      current: this.current_data.current_day,
      total: this.current_data.total_games,
    }
    document.querySelector(this.selector.day).innerHTML = this.day.template(data);
  }
}
