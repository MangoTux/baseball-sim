export function uuid() {
  return "U"+([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export function sleep(ms) {
  const start = new Date().getTime();
  for (let i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > ms){
      break;
    }
  }
}

export var positions = {
  "pitcher": {
    id: 1,
    symbol: "P",
    name: "Pitcher"
  },
  "catcher": {
    id: 2,
    symbol: "C",
    name: "Catcher"
  },
  "first_base": {
    id: 3,
    symbol: "1B",
    name: "First Baseman"
  },
  "second_base": {
    id: 4,
    symbol: "2B",
    name: "Second Baseman"
  },
  "third_base": {
    id: 5,
    symbol: "3B",
    name: "Third Baseman"
  },
  "shortstop": {
    id: 6,
    symbol: "SS",
    name: "Shortstop"
  },
  "left_field": {
    id: 7,
    symbol: "LF",
    name: "Left Fielder"
  },
  "center_field": {
    id: 8,
    symbol: "CF",
    name: "Center Fielder"
  },
  "right_field": {
    id: 9,
    symbol: "RF",
    name: "Right Fielder"
  }
}

export const teams = {
  "NL East": [
    ["Atlanta", "Braves", "#CE1141", "#13274F", "ATL"],
    ["Miami", "Marlins", "#00A3E0", "#000000", "MIA"],
    ["New York", "Mets", "#FF5910", "#002D72", "NYM"],
    ["Philadelphia", "Phillies", "#E81828", "#002D72", "PHI"],
    ["Washington", "Nationals", "#AB0003", "#14225A", "WSH"]
  ],
  "NL Central": [
    ["Chicago", "Cubs", "#CC3433", "#0E3386", "CHC"],
    ["Cincinnati", "Reds", "#C6011F", "#000000", "CIN"],
    ["Milwaukee", "Brewers", "#FFC52F", "#12284B", "MIL"],
    ["Pittsburgh", "Pirates", "#27251F", "#FDB827", "PIT"],
    ["St. Louis", "Cardinals", "#FEDB00", "#C41E3A", "STL"]
  ],
  "NL West": [
    ["Arizona", "Diamondbacks", "#A71930", "#E3D4AD", "ARI"],
    ["Colorado", "Rockies", "#33006F", "#C4CED4", "COL"],
    ["Los Angeles", "Dodgers", "#A5ACAF", "#005A9C", "LAD"],
    ["San Diego", "Padres", "#2F241D", "#FFC425", "SD"],
    ["San Francisco", "Giants", "#FD5A1E", "#27251F", "SF"]
  ],
  "AL East": [
    ["Baltimore", "Orioles", "#DF4601", "#000000", "BAL"],
    ["Boston", "Red Sox", "#BD3039", "#0C2340", "BOS"],
    ["New York", "Yankees", "#E4002C", "#003087", "NYY"],
    ["Tampa Bay", "Rays", "#092C5C", "#F5D130", "TB"],
    ["Toronto", "Blue Jays", "#134A8E", "#E8291C", "TOR"]
  ],
  "AL Central": [
    ["Chicago", "White Sox", "#27251F", "#C4CED4", "CWS"],
    ["Cleveland", "Indians", "#0C2340", "#E31937", "CLE"],
    ["Detroit", "Tigers", "#0C2340", "#FA4616", "DET"],
    ["Kansas City", "Royals", "#004687", "#BD9B60", "KC"],
    ["Minnesota", "Twins", "#002B5C", "#D31145", "MIN"]
  ],
  "AL West": [
    ["Houston", "Astros", "#002D62", "#EB6E1F", "HOU"],
    ["Los Angeles", "Angels", "#003263", "#BA0021", "LAA"],
    ["Oakland", "Athletics", "#003831", "#EFB21E", "OAK"],
    ["Seattle", "Mariners", "#0C2C56", "#C4CED4", "SEA"],
    ["Texas", "Rangers", "#003278", "#C0111F", "TEX"]
  ]
}

export function redraw(detail) {
  const event = new CustomEvent("redraw", {detail: detail});
  document.dispatchEvent(event);
}

export function endDay() {
  const event = new CustomEvent("day_end");
  document.dispatchEvent(event);
}

export function dice(count, type) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * type) + 1;
  }
  return total;
}
