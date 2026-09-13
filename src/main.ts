/*
  main.ts
  Dead Pixel — personal profile site
  Written by Dead Pixel (iamreal.dpx@gmail.com)
*/

/* ---------- Device mode ---------- */

function detectDeviceMode(): "mobile" | "desktop" {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  return isMobile ? "mobile" : "desktop";
}

function applyDeviceClass(): void {
  const mode = detectDeviceMode();
  document.body.classList.add(mode === "mobile" ? "is-mobile" : "is-desktop");
}

/* ---------- Scroll progress bar ---------- */

function initProgressBar(): void {
  const bar = document.getElementById("progressBar");
  if (!bar) return;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* ---------- Mobile nav toggle ---------- */

function initMobileNav(): void {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Scroll-spy nav ---------- */

function initScrollSpy(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("main .section"));
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".topbar__nav a"));
  if (!sections.length || !navLinks.length) return;

  const linkFor = (id: string) =>
    navLinks.find((link) => link.dataset.nav === id);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = linkFor(id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------- Reveal-on-scroll ---------- */

function initRevealOnScroll(): void {
  const targets = document.querySelectorAll<HTMLElement>(".reveal");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((target) => observer.observe(target));
}

/* ---------- Interactive skill tags ---------- */

function initFocusTags(): void {
  const tags = document.querySelectorAll<HTMLButtonElement>("#focusTags .tag");
  tags.forEach((tag) => {
    tag.addEventListener("click", () => {
      tag.classList.toggle("is-active");
    });
  });
}

/* ---------- Copy-to-clipboard contact button ---------- */

function initCopyButton(): void {
  const btn = document.getElementById("copyEmailBtn") as HTMLButtonElement | null;
  if (!btn) return;

  const email = btn.dataset.email || "";
  const originalLabel = btn.textContent || "Copy";

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard API unavailable — fail silently, the email is still
      // visible and selectable as plain text next to the button.
    }
    btn.textContent = "Copied!";
    btn.classList.add("is-copied");
    window.setTimeout(() => {
      btn.textContent = originalLabel;
      btn.classList.remove("is-copied");
    }, 1500);
  });
}

/* ---------- Expandable project cards (ready for future entries) ---------- */

function initExpandableProjectCards(): void {
  document.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("is-expanded");
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.classList.toggle("is-expanded");
      }
    });
  });
}

/* ---------- Terminal: typed intro + command list + command handling ---------- */

type TerminalCommand = {
  run: (print: (text: string, tone?: "muted" | "cyan" | "magenta") => void) => void;
};

function initTerminal(): void {
  const body = document.getElementById("terminalBody");
  const input = document.getElementById("terminalInput") as HTMLInputElement | null;
  if (!body || !input) return;

  const print = (text: string, tone?: "muted" | "cyan" | "magenta"): void => {
    const line = document.createElement("p");
    line.className = "terminal__line" + (tone ? ` terminal__line--${tone}` : "");
    line.textContent = text;
    body.appendChild(line);
  };

  const scrollToSection = (id: string): void => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const printHelp = (): void => {
    print("Available commands:", "cyan");
    print("  about      — who I am");
    print("  make       — what I've built");
    print("  skills     — what I focus on");
    print("  contact    — how to reach me");
    print("  clear      — clear this terminal");
    print("  help       — show this list again");
  };

  const commands: Record<string, TerminalCommand> = {
    about: { run: () => scrollToSection("about") },
    whoami: { run: () => scrollToSection("about") },
    make: { run: () => scrollToSection("make") },
    projects: { run: () => scrollToSection("make") },
    skills: { run: () => scrollToSection("skills") },
    contact: { run: () => scrollToSection("contact") },
    help: { run: () => printHelp() },
    clear: {
      run: () => {
        body.innerHTML = "";
      },
    },
  };

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const raw = input.value.trim();
    if (!raw) return;

    print(`guest@deadpixel:~$ ${raw}`, "muted");

    const command = commands[raw.toLowerCase()];
    if (command) {
      command.run(print);
    } else {
      print(`command not found: ${raw}`, "magenta");
      print("type 'help' to see what's available", "muted");
    }

    input.value = "";
    body.scrollTop = body.scrollHeight;
  });

  const introLines = [
    "booting profile...",
    "DEAD PIXEL — I work with anything that touches code.",
  ];

  let lineIndex = 0;

  const printNextIntroLine = (): void => {
    if (lineIndex >= introLines.length) {
      printHelp();
      return;
    }
    print(introLines[lineIndex], lineIndex === 0 ? "muted" : undefined);
    lineIndex += 1;
    window.setTimeout(printNextIntroLine, 450);
  };

  printNextIntroLine();
}

/* ---------- Init ---------- */

function init(): void {
  applyDeviceClass();
  initProgressBar();
  initMobileNav();
  initScrollSpy();
  initRevealOnScroll();
  initFocusTags();
  initCopyButton();
  initExpandableProjectCards();
  initTerminal();
}

document.addEventListener("DOMContentLoaded", init);
