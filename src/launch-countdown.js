// September 20, 2026 at midnight in Tbilisi (UTC+4).
export const launchAt = Date.parse("2026-09-20T00:00:00+04:00");

export function remainingTime(now) {
  const seconds = Math.max(0, Math.ceil((launchAt - now) / 1000));
  return [
    Math.floor(seconds / 86400),
    Math.floor((seconds % 86400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ];
}

const timers = [...document.querySelectorAll("[data-launch-timer]")];
const units = document.body.dataset.launchUnits?.split(",") || [];
const digits = timers.map((timer) => {
  const values = units.map((unit) => {
    const group = document.createElement("span");
    const value = document.createElement("strong");
    const label = document.createElement("span");
    group.className = "launch-timer__unit";
    label.textContent = unit;
    group.append(value, label);
    timer.append(group);
    return value;
  });
  return values;
});

function updateCountdown() {
  const now = Date.now();
  const finished = now >= launchAt;
  const values = remainingTime(now);
  timers.forEach((timer, index) => {
    timer.hidden = finished;
    digits[index].forEach((digit, unit) => {
      const text = String(values[unit]).padStart(2, "0");
      if (digit.textContent !== text) digit.textContent = text;
    });
  });
  if (finished) {
    document.querySelectorAll("[data-launch-copy]").forEach((label) => {
      label.textContent = label.dataset.launched;
    });
  }
  return finished;
}

if (timers.length && !updateCountdown()) {
  const interval = window.setInterval(() => {
    if (updateCountdown()) window.clearInterval(interval);
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && updateCountdown()) window.clearInterval(interval);
  });
}
