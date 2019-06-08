function Standings(league) {
  this.league = league;
  this.record = [];
  this.standings_view = new Standings_View();

  this.setup = function() {
    for (var i = 0; i < this.league.team_list.length; i++) {
      var team = this.league.team_list[i];
      this.record[team.id] = {
        team_object: team,
        wins: 0,
        losses: 0,
        percentage: ".000",
        games_back: 0,
        game_history: [],
        runs_scored: 0,
        runs_allowed: 0,
        run_differnetial: 0,
      }
    }

    this.update();
    this.standings_view.draw(this.sortDivision());
  }
  // Track the following:
  /*
  Wins
  Losses
  Games Back
  Percentage
  Streak
  Last 10
  */
  this.postGame = function (away, home, box_score) {
    this.record[home.id].runs_scored += box_score.home.getScore();
    this.record[home.id].runs_allowed += box_score.away.getScore();
    this.record[away.id].runs_allowed += box_score.home.getScore();
    this.record[away.id].runs_scored += box_score.away.getScore();

    let winner = away;
    let loser = home;
    if (box_score.home.getScore() > box_score.away.getScore()) {
      winner = home;
      loser = away;
    }

    this.postWin(winner);
    this.postLoss(loser);
    this.update();
    this.standings_view.draw(this.sortDivision());
  }

  this.postWin = function (team) {
    this.record[team.id].wins++;
    this.record[team.id].game_history.push("W");
  }

  this.postLoss = function (team, score) {
    this.record[team.id].losses++;
    this.record[team.id].game_history.push("L");
  }

  this.calculateRunDifferential = function (team) {
    let differential = this.record[team.id].runs_scored - this.record[team.id].runs_allowed;
    this.record[team.id].run_differential = differential;
    return (differential<0?"":"+")+differential;
  }

  this.calculatePercentage = function (team) {
    let wins = this.record[team.id].wins;
    let losses = this.record[team.id].losses;
    if (wins + losses == 0) {
      return ".000";
    }
    let result = wins / (wins + losses);
    result = result.toFixed(3).replace(/^0+/, '');
    return result;
  }

  this.getDivisionLeader = function () {
    let top_team = -1;
    let top_percentage = -1;
    let current_percentage = 0;
    for (var i = 0; i < this.league.team_list.length; i++) {
      current_percentage = parseFloat(this.calculatePercentage(this.league.team_list[i]));
      if (current_percentage > top_percentage) {
        top_percentage = current_percentage;
        top_team = i;
      }
    }
    return this.league.team_list[top_team].id;
  }

  this.getGamesBack = function (team) {
    let leader = this.getDivisionLeader();
    let current = team.id;
    if (team == leader) { return "0.0"; }
    let win_difference = this.record[leader].wins - this.record[current].wins;
    let loss_difference = this.record[current].losses - this.record[leader].losses;
    let gb = (win_difference + loss_difference) / 2;
    return gb.toFixed(1);
  }

  this.update = function () {
    let team = "";
    let history = null;
    let streak_type = "";
    for (let i = 0; i < this.league.team_list.length; i++) {
      team = this.league.team_list[i];
      this.record[team.id].games_back = this.getGamesBack(team);
      this.record[team.id].percentage = this.calculatePercentage(team);
      this.record[team.id].run_differential = this.calculateRunDifferential(team);
      history = this.record[team.id].game_history;
      if (history.length == 0) { this.record[team.id].streak = "-"; continue; }
      streak_type = history[history.length - 1];
      var index = history.length-1;
      // Given ["W", "L", "W"]:
      // Streak starts at one (for last game)
      var streak = 0;
      while (index >= 0 && history[index] == streak_type) {
        streak++;
        index--;
      }
      this.record[team.id].streak = streak_type + streak;
    }
  }

  this.sortDivision = function() {
    let array_mapped = [];
    for (var i in this.record) {
      array_mapped.push(this.record[i]);
    }
    let clone = array_mapped.slice(0);
    clone.sort((a, b) =>
      (parseFloat(a.games_back) > parseFloat(b.games_back)) ? 1 : (a.games_back === b.games_back) ? ((a.wins > b.wins) ? 1 : -1) : -1
    );
    return clone;
  }
}
