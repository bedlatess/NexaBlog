(() => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  const icons = document.querySelectorAll("[data-theme-icon]");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const modes = ["system", "light", "dark"];

  function resolveTheme(mode) {
    return mode === "system" ? (media.matches ? "dark" : "light") : mode;
  }

  function getMode() {
    const stored = localStorage.getItem("nexa-theme");
    return modes.includes(stored) ? stored : "system";
  }

  function setMode(mode) {
    const theme = resolveTheme(mode);
    root.dataset.theme = theme;
    localStorage.setItem("nexa-theme", mode);
    icons.forEach((icon) => {
      icon.textContent = mode === "system" ? "◐" : theme === "dark" ? "☾" : "☼";
    });
    buttons.forEach((button) => {
      button.setAttribute("aria-label", `切换主题，当前为${mode === "system" ? "跟随系统" : theme === "dark" ? "深色" : "浅色"}`);
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const current = getMode();
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      setMode(next);
    });
  });

  media.addEventListener("change", () => {
    if (getMode() === "system") setMode("system");
  });

  setMode(getMode());

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (window.location.pathname !== "/search/") {
        window.location.href = "/search/";
      } else {
        document.querySelector("[data-search-input]")?.focus();
      }
    }
  });
})();
