import { teams } from "../module/util.m.js"
import { Team } from "./team.c.js"

export class League {
  constructor() {
    this.divisions = {};
    this.team_list = [];
  }

  addDivision(name) {
    this.divisions[name] = [];
  }

  addTeamToDivision(team, division) {
    this.divisions[division].push(team);
    team.setDivision(division);
  }

  // Generate teams and add them to each division
  buildTeams(names) {
    let team_index = 0;
    for (const [division, team_set] of Object.entries(teams)) {
      this.addDivision(division);
      for (let config of team_set) {
        let team = new Team(...config);
        team.build(names.slice(team_index*9, team_index*9+9));
        this.team_list.push(team);
        this.addTeamToDivision(team, division);
        team_index++;
      }
    }
  }

  // Generate random player names for all league-participating teams
  loadPlayers() {
    const req_str = "gender=male&results=270&nat=au,br,ca,es,fr,gb,ie,nz,us";
    return fetch("https://randomuser.me/api/?"+req_str)
      .then(response => response.ok ? Promise.resolve(response) : Promise.reject(new Error(response.statusText)))
      .then(response => response.json())
      .then(response => response.results)
      .then(names => { this.buildTeams(names); });
  }

  getAllTeams() {
    return this.team_list;
  }
}
