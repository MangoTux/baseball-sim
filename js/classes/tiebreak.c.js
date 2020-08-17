import { uuid } from "../module/util.m.js";

export class Tiebreak {
  constructor() {
    this.pending_games = [];
    this.ready_matchups = [];
  }

  setStandings(standings) {
    this.standings = standings;
  }

  initialize() {
    let matchup_list = [];
    // Iterate through each division plus wildcard
    for (const [division, teams] of Object.entries(this.standings.league.divisions)) {
      let division_leader_arr = this.standings.getTeamsInFirst(division);
      if (division_leader_arr.length == 1) { continue; }
      let tiebreak_id_a = uuid();
      let tiebreak_id_b = uuid();
      if (division_leader_arr.length >= 2) {
        matchup_list.push({
          'id': tiebreak_id_a,
          'home': division_leader_arr[0],
          'away': division_leader_arr[1]
        });
      }
      if (division_leader_arr.length == 3) {
        this.pending_games.push({
          'home': division_leader_arr[2],
          'away': {
            pending: true,
            id: tiebreak_id_a,
          }
        });
      }
      if (division_leader_arr.length == 4) {
        matchup_list.push({
          'id': tiebreak_id_b,
          'home': division_leader_arr[2],
          'away': division_leader_arr[3]
        });
        this.pending_games.push({
          'home': {
            pending: true,
            id: tiebreak_id_a
          },
          'away': {
            pending: true,
            id: tiebreak_id_b
          }
        });
      }
    }
    this.ready_matchups = matchup_list;
  }

  hasGames() {
    return this.ready_matchups.length > 0;
  }

  hasTomorrow() {
    return this.pending_games.length > 0;
  }

  advance(season_scope) {
    for (let i = this.pending_games.length - 1; i >= 0; i--) {
      let matchup = {
        'home': null,
        'away': null,
      };
      let game = this.pending_games[i];
      let game_result;
      if (!!game['home'].pending) {
        game_result = season_scope.getGameById(game['home'].id);
        if (game_result == null) { continue; }
        matchup['home'] = game_result.getWinner();
      } else {
        matchup['home'] = game['home'];
      }
      if (!!game['away'].pending) {
        game_result = season_scope.getGameById(game['away'].id);
        if (game_result == null) { continue; }
        matchup['away'] = game_result.getWinner();
      } else {
        matchup['away'] = game['away'];
      }
      // Remove pending game index
      this.ready_matchups.push(matchup);
      this.pending_games.splice(i, 1);
    }
  }

  getMatchups() {
    return this.ready_matchups;
  }

  clearMatchupQueue() {
    this.ready_matchups = [];
  }
}
