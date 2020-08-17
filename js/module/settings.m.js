export const settings = {
  game_count: 162,
  inning_count: 9,
  real_time: true,
  auto_new_day: true,
  base_runner_extra: false,
  required_outs: (() => document.querySelector("#required_outs").value)(),
}
// Handle some document queryselector stuff when available by calling functions instead
