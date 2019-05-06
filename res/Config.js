var Config = {
  PLAY_SINGLE: "single",
  PLAY_DOUBLE: "double",
  PLAY_TRIPLE: "triple",
  PLAY_HOMERUN: "homerun",
  PLAY_WALK: "walk",
  PLAY_OUT: "out",
  OUT_STRIKE: "strike",
  OUT_GROUND: "ground",
  OUT_FLY: "fly",

  SELECTOR_GAME: ".gameWindow",
  SELECTOR_STANDINGS: ".standings",
  SELECTOR_NEW_DAY_BUTTON: ".next_day",

  INNING_COUNT: 9,
  REQUIRED_OUTS: 3,

  POST_REPORTING_LOW: 0,
  POST_REPORTING_MEDIUM: 1,
  POST_REPORTING_HIGH: 2,
  POST_REPORTING_NONE: 3,
  REAL_TIME: true,
  SEASON_LENGTH: 160,
};

Config.OUT_TYPES = [Config.OUT_STRIKE, Config.OUT_GROUND, Config.OUT_FLY];
Config.POST_REPORTING = Config.POST_REPORTING_LOW;
