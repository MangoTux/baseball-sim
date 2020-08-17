import { uuid, positions } from "../module/util.m.js";
import { Player } from "./player.c.js";

export class Team {
  constructor(location, name, primary, text, short) {
    this.location = location;
    this.name = name;
    this.color_primary = primary;
    this.color_text = text;
    this.name_abbreviation = short;
    this.id = uuid();
    this.player_index = 0;
    this.player_list = [];
  }

  setDivision(division) {
    this.division_id = division;
  }

  getName() {
    return `${this.location} ${this.name}`;
  }

  getPrimaryColor() {
    return this.color_primary;
  }

  getAccentColor() {
    return this.color_text;
  }

  // Generates a nine-player team
  build(members) {
    for (const [key, position] of Object.entries(positions)) {
      let index = position.id-1;
      let name_object = members[index].name;
      let name = `${name_object.first} ${name_object.last}`;
      let player = new Player(name);
      player.setPosition(position);
      this.player_list.push(player);
    }
  }

  getPlayerByPosition(position) {
    return this.player_list.find(p => p.position.symbol == position);
  }

  get players() {
    return this.player_list;
  }

  get at_bat() {
    return this.player_list[this.player_index];
  }

  nextBatter() {
    this.player_index++;
    this.player_index %= 9;
    return this.at_bat;
  }
}
