const message = document.querySelector<HTMLElement>("[data-settings-message]");

function setMessage(text: string, tone: "muted" | "error" | "success" = "muted") {
  if (!message) return;
  message.textContent = text;
  message.dataset.tone = tone;
}

document.querySelectorAll<HTMLButtonElement>("[data-settings-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector<HTMLElement>(button.dataset.settingsCopy ?? "");
    const text = target?.textContent?.trim();
    if (!text) {
      setMessage("没有找到可复制的配置模板。", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setMessage("配置模板已复制。", "success");
    } catch {
      setMessage("无法自动复制，请手动选中模板内容。", "error");
    }
  });
});
