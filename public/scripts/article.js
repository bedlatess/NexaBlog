(() => {
  document.querySelectorAll(".prose pre").forEach((pre) => {
    const button = document.createElement("button");
    button.className = "copy-code";
    button.type = "button";
    button.textContent = "复制";
    button.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.textContent ?? "";
      await navigator.clipboard.writeText(code);
      button.textContent = "已复制";
      window.setTimeout(() => {
        button.textContent = "复制";
      }, 1400);
    });
    pre.append(button);
  });

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 520);
    });
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const progressBar = document.querySelector("[data-reading-progress]");
  if (progressBar) {
    const article = document.querySelector("article");
    if (article) {
      const updateProgress = () => {
        const rect = article.getBoundingClientRect();
        const total = article.offsetHeight - window.innerHeight;
        const progress = Math.min(100, Math.max(0, (-rect.top / total) * 100));
        progressBar.style.width = `${progress}%`;
      };
      window.addEventListener("scroll", updateProgress, { passive: true });
      updateProgress();
    }
  }

  const tocLinks = [...document.querySelectorAll(".toc a")];
  const headings = tocLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if (headings.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        tocLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] }
    );
    headings.forEach((heading) => observer.observe(heading));
  }
})();

