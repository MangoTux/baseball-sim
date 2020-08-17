import { League } from "./classes/league.c.js";
import { Season } from "./classes/season.c.js";
import { sleep } from "./module/util.m.js";
import { settings } from "./module/settings.m.js";
import { UI } from "./classes/ui.c.js";

const league = new League();
const season = new Season();
const ui = new UI();

league.loadPlayers()
  .then(_ => {
    season.setLeague(league);
    ui.loadTemplates().then(_ => ui.draw(season));
});

// Load the active team
document.addEventListener("click", e => {
  if (e.target.classList.contains("clickable_team_id")) {
    let team_id = e.target.getAttribute("data-id");
    ui.setTeam(team_id);
    ui.pushUpdate({
      type: "team",
    });
    ui.draw(season);
    return;
  }
  if (e.target.getAttribute('id') == "new_day") {
    // favicon update
    season.gameday();
    document.title = "Baseball Sim";
    return;
  }
});

document.querySelector("#drilldown_collapse").addEventListener("click", e => {
  ui.toggleCollapse();
});

document.addEventListener("redraw", e => {
  // Refine this for an update queue
  if (typeof e.detail !== "undefined") {
    ui.pushUpdate(e.detail);
  }
  ui.draw(season);
});

document.addEventListener("day_end", e => {
  // modify favicon
  if (settings.auto_new_day) {
    setTimeout(() => {
      season.gameday();
    }, 3000);
    return;
  }
  const element = document.querySelector("#new_day");
  element && element.classList.remove("hidden");
  document.title = "(!) Baseball Sim";
  // If settings enable auto-newday, advance
  // Otherwise, show button
});
// custom fireable event to redraw ui
