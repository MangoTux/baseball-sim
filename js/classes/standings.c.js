import { redraw } from "../module/util.m.js";

export class Standings {
  constructor(league) {
    this.league = league;
    this.record = {};
    this.initializeRecord();
  }

  initializeRecord() {
    for (const [division, teams] of Object.entries(this.league.divisions)) {
      this.record[division] = [];
      for (let i = 0; i < teams.length; i++) {
        this.record[division][teams[i].id] = {
          team_object: teams[i],
          wins: 0,
          losses: 0,
          percentage: ".000",
          games_back: 0,
          game_history: [],
          runs_scored: 0,
          runs_allowed: 0,
          streak: "-",
          run_differential: 0
        }
      }
    }
  }

  postGame(away, home, box_score) {
    // Update the records of home and away's runs allowed and runs scored
    this.record[home.division_id][home.id].runs_scored += box_score.home.getScore();
    this.record[home.division_id][home.id].runs_allowed += box_score.away.getScore();
    this.record[away.division_id][away.id].runs_scored += box_score.away.getScore();
    this.record[away.division_id][away.id].runs_allowed += box_score.home.getScore();

    let winner = away;
    let loser = home;
    if (box_score.home.getScore() > box_score.away.getScore()) {
      winner = home;
      loser = away;
    }

    this.postWin(winner);
    this.postLoss(loser);

    this.update();
  }

  postWin(team) {
    this.record[team.division_id][team.id].wins++;
    this.record[team.division_id][team.id].game_history.push("W");
  }

  postLoss(team) {
    this.record[team.division_id][team.id].losses++;
    this.record[team.division_id][team.id].game_history.push("L");
  }

  calculateRunDifferential(team) {
    let differential = this.record[team.division_id][team.id].runs_scored - this.record[team.division_id][team.id].runs_allowed;
    this.record[team.division_id][team.id].run_differential = differential;
    return (differential<0?"":"+")+differential;
  }

  calculatePercentage(team) {
    let wins = this.record[team.division_id][team.id].wins;
    let losses = this.record[team.division_id][team.id].losses;
    if (wins + losses == 0) {
      return ".000";
    }
    let result = wins / (wins + losses);
    result = result.toFixed(3).replace(/^0+/, '');
    return result;
  }

  getDivisionLeader(division_id) {
    let top_team = -1;
    let top_percentage = -1;
    let current_percentage = 0;
    for (let team of this.league.divisions[division_id]) {
      current_percentage = parseFloat(this.calculatePercentage(team));
      if (current_percentage > top_percentage) {
        top_percentage = current_percentage;
        top_team = team;
      }
    }
    return top_team.id;
  }

  getGamesBack(team) {
    let division_id = team.division_id;
    let leader = this.getDivisionLeader(division_id);
    let current = team.id;
    if (team == leader) {
      return "0.0";
    }
    let win_difference = this.record[division_id][leader].wins - this.record[division_id][current].wins;
    let loss_difference = this.record[division_id][current].losses - this.record[division_id][leader].losses;
    let gb = (win_difference + loss_difference) / 2;
    return gb.toFixed(1);
  }

  /*
  Handle streak updates and other calculations
  */
  update() {
    let team = null;
    let history = null;
    let streak_type = "";
    for (const [division, teams] of Object.entries(this.league.divisions)) {
      for (const team_index in teams) {
        team = this.league.divisions[division][team_index];
        this.record[team.division_id][team.id].games_back = this.getGamesBack(team);
        this.record[team.division_id][team.id].percentage = this.calculatePercentage(team);
        this.record[team.division_id][team.id].run_differential = this.calculateRunDifferential(team);
        history = this.record[team.division_id][team.id].game_history;
        if (history.length == 0) { this.record[team.division_id][team.id].streak = "-"; continue; }
        streak_type = history[history.length - 1];
        let index = history.length-1;
        // Given ["W", "L", "W"]:
        // Streak starts at one (for last game)
        var streak = 0;
        while (index >= 0 && history[index] == streak_type) {
          streak++;
          index--;
        }
        this.record[team.division_id][team.id].streak = streak_type + streak;
      }
    }
  }

  getSortedDivision(division_id) {
    let division = Object.values(this.record[division_id]).slice(0);
    division.sort((a, b) => {
      if (parseFloat(a.games_back) > parseFloat(b.games_back)) {
        return 1;
      }
      if (parseFloat(a.games_back) < parseFloat(b.games_back)) {
        return -1;
      }
      if (a.wins > b.wins) {
        return 1;
      }
      if (a.wins < b.wins) {
        return -1;
      }
      if (a.losses < b.losses) {
        return 1;
      }
      return -1;
    });
    return division;
  }

  getTeamsInFirst(division_id) {
    let division = Object.values(this.getSortedDivision(division_id)).slice(0);
    let leader = division[0];
    let team_list = [ leader.team_object ];
    for (let i = 1; i < division.length; i++) {
      if (division[i].wins == leader.wins && division[i].losses == leader.losses) {
        team_list.push(division[i].team_object);
      }
    }
    return team_list;
  }
}
