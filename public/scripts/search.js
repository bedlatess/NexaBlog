(() => {
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  const count = document.querySelector("[data-search-count]");

  if (!input || !results) return;

  let index = [];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function render(items, query) {
    count.textContent = query ? `${items.length} 个结果` : "输入关键词开始搜索";
    if (!query) {
      results.innerHTML = '<div class="quiet-panel"><p>可以搜索标题、摘要和标签。试试“静态”“设计”或“Markdown”。</p></div>';
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
    return index.filter((item) => item.haystack.includes(normalized)).slice(0, 12);
  }

  fetch("/search-index.json")
    .then((response) => response.json())
    .then((data) => {
      index = data;
      render([], "");
      const update = () => render(search(input.value), input.value.trim());
      input.addEventListener("input", update);
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
    });
})();
