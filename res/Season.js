function Season() {
  this.league = new League();
  this.league.initialize();
  this.standings;

  this.current_day = 0;
  this.season_view = new Season_View();

  this.setup = function() {
    this.league.team_list.forEach(team => team.generateStats());
    this.standings = new Standings(this.league)
    this.standings.setup();
  }

  this.gameday = async function() {
    var daily_matchups = this.league.getMatchups();
    this.current_day++;
    this.season_view.new_day(this.current_day);
    await Promise.all(daily_matchups.map(async (matchup) => {
      let game = new Game();
      game.setup(matchup.away, matchup.home);
      let box_score = await game.play();
      this.standings.postGame(matchup.away, matchup.home, box_score);
      // When all games are done, make "Next Day" button available
    }));
    if (this.current_day < Config.SEASON_LENGTH) {
      this.season_view.end_day();
    }
  }
}
