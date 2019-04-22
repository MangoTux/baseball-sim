/*
Javascript's version of object-oriented programming manifests as functions.
These functions (objects) will store all object-appropriate behavior,
including fields (such as team name or location)
and functions (such as utility functions to get the full name)
*/
/*
This file will contain functionalities related to teams, such as the division (a generic list of teams)
*/
function League() {
  this.team_list = [
    new Team("Rolling Green", "Ragamuffins", "#0E3386", "#FFF"),
    new Team("Streamsong", "Scalliwags", "#FD5A1E", "#FFF"),
    new Team("Pinewood", "Pigeonholers", "#003831", "#EFB21E"),
    new Team("Diamond Ridge", "Dirigibles", "#FDB827", "#27251F"),
    new Team("Gold Coast", "Glockenspiels", "#005C5C", "#C4CED4"),
    new Team("Acadian Hills", "Axolotls", "#773141", "#FFB612"),
  ];

  /*
  Returns two randomly-selected teams from the list.
  If I wanted to build a complete season scheduler, this would be built into that, instead.
  Cheap algorithm: Randomize the league, and pick the first two teams as home and away, respectively.
  */
  this.getMatchups = function() {
    if (this.team_list.length < 2) {
      throw new Error("There must be two available teams to have a game");
    }
    var shuffled = this.team_list.sort(() => 0.5 - Math.random());
    matchupList = [];
    for (var i = 0; i < Math.floor(shuffled.length / 2); i++) {
      matchupList.push({
        'home': shuffled[i],
        'away': shuffled[this.team_list.length - (i + 1)]
      });
    }
    return matchupList;
  }
}

function Team(location, name, primary, text) {
  this.location = location;
  this.name = name;
  this.color_primary = primary;
  this.color_text = text;

  this.record = {
    'W': 0,
    'L': 0
  };

  this.getName = function() {
    return "The " + this.location + " " + this.name;
  }

  this.getPrimaryColor = function() {
    return this.color_primary;
  }

  this.getTextColor = function() {
    return this.color_text;
  }
}
