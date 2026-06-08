(() => {
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  const count = document.querySelector("[data-search-count]");

  if (!input || !results) return;

  let index = [];
  let activeIndex = -1;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function highlightResult(newIndex) {
    const cards = results.querySelectorAll(".article-card");
    cards.forEach((card, i) => {
      card.classList.toggle("is-focused", i === newIndex);
    });
    activeIndex = newIndex;
    if (cards[newIndex]) {
      cards[newIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function render(items, query) {
    activeIndex = -1;
    count.textContent = query ? `${items.length} 个结果` : "输入关键词开始搜索";
    if (!query) {
      results.innerHTML = '<div class="quiet-panel"><p>可以搜索标题、摘要和标签。试试"静态""设计"或"Markdown"。</p></div>';
      return;
    }

    if (!items.length) {
      results.innerHTML = '<div class="quiet-panel"><h2>没有找到结果</h2><p>换一个更宽的关键词，或从标签页重新进入。</p></div>';
      return;
    }

    results.innerHTML = items
      .map(
        (item) => `
          <a class="article-card" href="${item.url}">
            <div>
              <p class="meta">${escapeHtml(item.date)} · ${escapeHtml(item.readingTime)}</p>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </div>
            <div class="tag-list">${item.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>
          </a>
        `
      )
      .join("");
  }

  function search(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const terms = normalized.split(/\s+/);
    return index
      .filter((item) => terms.every((term) => item.haystack.includes(term)))
      .slice(0, 12);
  }

  input.addEventListener("keydown", (e) => {
    const cards = results.querySelectorAll(".article-card");
    if (!cards.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightResult(activeIndex < cards.length - 1 ? activeIndex + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightResult(activeIndex > 0 ? activeIndex - 1 : cards.length - 1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      cards[activeIndex].click();
    }
  });

  fetch("/search-index.json")
    .then((response) => response.json())
    .then((data) => {
      index = data;
      render([], "");
      let debounceTimer;
      const update = () => render(search(input.value), input.value.trim());
      input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(update, 120);
      });
      input.closest(".search-box")?.querySelector("button")?.addEventListener("click", () => {
        update();
        const query = input.value.trim();
        const url = query ? `/search/?q=${encodeURIComponent(query)}` : "/search/";
        window.history.replaceState({}, "", url);
      });
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        input.value = q;
        render(search(q), q);
      }
      input.focus();
    });
})();
