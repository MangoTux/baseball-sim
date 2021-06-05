export class Scheduler {
  constructor() {
    this.rivals = [
      { // Crosstown Classic
        "AL": "CWS",
        "NL": "CHC",
      },
      { // I-70 Series
        "AL": "KC",
        "NL": "STL",
      },
      { // Ohio Cup
        "AL": "CLE",
        "NL": "CIN",
      },
      { // Bay Bridge Series
        "AL": "OAK",
        "NL": "SF",
      },
      { // Border Series
        "AL": "MIN",
        "NL": "MIL",
      },
      { // Freeway Series
        "AL": "LAA",
        "NL": "LAD",
      },
      { // Citrus Series
        "AL": "TB",
        "NL": "MIA",
      },
      { // Subway Series
        "AL": "NYY",
        "NL": "NYM",
      },
      { // Beltway Serieis
        "AL": "BAL",
        "NL": "WSH",
      },
      {
        "AL": "HOU",
        "NL": "ARI",
      },
      {
        "AL": "DET",
        "NL": "PIT",
      },
    ];

    this.year = dice(1, 6);
    this.interleague_cycle = this.year % 3; // West -> East -> Central
    this.division_cycle = dice(1, 5);
    // TODO For interleague division, and factoring in rivals?

    this.year_schedule = [];
  }

  getRivalSeries() {
    // TODO Search for TODO Param in this.rivals, else grab year cycle for the remaining teams:
    // this.year % 2
    // Even years: ATL @ BOS; PHI @ TOR; SEA @ SD; TEX @ COL
    // Odd years: ATL @ TOR; PHI @ BOS; SEA @ COL; SD @ TEX
  }

  getTeamFromTeamForLabel(team, label) {
    let components = label.split("_");
    // Components[0] is the division
    // [1] is the series count
    // [2] is the team index
    switch (components[0]) {
      case "SLOD1":
      // Just now realizing the issue: East plays West, West plays East, and what does Central do?
      break;
      case "SLOD2":
      break;
      case "SLSD":
      break;
      case "ILGR":
      break;
      case "ILDR":
      break;
      case "ILG":
      break;
      case "ILD":
      break;
    }
  }

  /*
  A few different components at play:
  Given the [NL/AL] split, and each league having three divisions, and 162 games in a year:
  Same League, Other Division 1 (SLOD1):
  - 3 teams played 7 times, in a [3] and [4] series := SLOD1_3_[1-3] and SLOD1_4_[1-3]
  - 2 teams played 6 times, in a [3] and [3] series := SLOD1_3_[4-5] and SLOD1_3_[4-5]
  Same League, Other Division 2 (SLOD2):
  - 3 teams played 7 times, in a [3] and [4] series := SLOD2_3_[1-3] and SLOD2_4_[1-3]
  - 2 teams played 6 times, in a [3] and [3] series := SLOD2_3_[4-5] and SLOD2_3_[4-5]
  Same League, Same Division (SLSD):
  - 4 teams played 19 times, in five [3] and one [4] series := SLSD_3_[1-5]_[1-4] and SLSD_4_1_[1-4]
  Interleague, geographic, rival playing in same division (ILGR):
  - Rival team played 3 times, in one [3] series := ILGR_3_1
  Interleague, division, rival playing in same division (ILDR):
  - Rival team played 3 times, in one [3] series := ILDR_3_1_R
  - 2 teams played 3 times, in one [3] series := ILDR_3_1_[1-2]
  - 2 teams played 4 times, in two [2] series := ILDR_2_1_[3-4] and ILDR_2_2_[3-4]
  Interleague, geographic, rival playing in different division (ILG):
  - Rival team played 4 times, ine two [2] series := ILG_2_1 and ILG_2_2
  Interleague, division, rival playing in different division (ILD):
  - 1 team played 4 times, in two [2] series := ILD_2_1_1 and ILD_2_2_1
  - 4 teams played 3 times, in one [3] series := ILD_3_1_[2-5]

  Given a year of the above IDs, Create the cycle offset for division and team, then shuffle all of the above keys.
  e.g. For NYM, SLOD1_3_1_2:
  - "SLOD1" this year might be NL Central (And NL Central's SLOD1 would have to be NL East),
  - "_3" means it's a 3-game series,
  - "_1" means it's a team being played 7 times this year (Unnecessary in scheduling, maybe?)
  - "_2" means per-year index two, which might be CHI
  Directions would have to be reversible, so a blanket SLOD1 wouldn't have NLEast assigned to NLCentral assigned to NLWest assigned to NLEast
  */
  createSameLeagueSchedule() {
    let schedule = [];
    let options = [
      "SLOD1_3_1", // Same League, Other Division 1, 3-game series, Team 1
      "SLOD1_3_2",
      "SLOD1_3_3",
      "SLOD1_4_1", // Same League, Other Division 1, 4-game series, Team 1
      "SLOD1_4_2",
      "SLOD1_4_3",
      "SLOD1_3_4", // Same League, Other Division 1, 3-game series, Team 4
      "SLOD1_3_5",
      "SLOD1_3_4",
      "SLOD1_3_5",
      "SLOD2_3_1", // Same League, Other Division 2, 3-game series, Team 1
      "SLOD2_3_2",
      "SLOD2_3_3",
      "SLOD2_4_1", // Same League, Other Division 2, 4-game series, Team 1
      "SLOD2_4_2",
      "SLOD2_4_3",
      "SLOD2_3_4", // Same League, Other Division 2, 3-game series, Team 4
      "SLOD2_3_5",
      "SLOD2_3_4",
      "SLOD2_3_5",
      "SLSD_4_1", // Same League, Same Division, 4-game series, Team 1
      "SLSD_3_1", // Same League, Same Division, 3-game series, Team 1
      "SLSD_3_1",
      "SLSD_3_1",
      "SLSD_3_1",
      "SLSD_3_1",
      "SLSD_4_2", // Same League, Same Division, 4-game series, Team 2
      "SLSD_3_2",
      "SLSD_3_2",
      "SLSD_3_2",
      "SLSD_3_2",
      "SLSD_3_2",
      "SLSD_4_3", // Same League, Same Division, 4-game series, Team 3
      "SLSD_3_3",
      "SLSD_3_3",
      "SLSD_3_3",
      "SLSD_3_3",
      "SLSD_3_3",
      "SLSD_4_4", // Same League, Same Division, 4-game series, Team 4
      "SLSD_3_4",
      "SLSD_3_4",
      "SLSD_3_4",
      "SLSD_3_4",
      "SLSD_3_4",
    ];

    // TODO Shuffle Options
    // TODO Assign all teams (or leave it to scheduler?)
    // At the very least, each team should have a copy of this
  }

  createRivalSchedule() {

  }

  createInterleagueSchedule() {

  }

  createSchedule() {
    // Same League
    // (TODO Consider division for each team)
    // At certain points, add in Rivals
    // At certain points, add in Interleague
  }
}
