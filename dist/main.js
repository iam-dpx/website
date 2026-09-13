"use strict";
/*
  main.ts
  Dead Pixel — personal profile site
  Written by Dead Pixel (iamreal.dpx@gmail.com)
*/
/* ---------- Device mode ---------- */
function detectDeviceMode() {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
    return isMobile ? "mobile" : "desktop";
}
function applyDeviceClass() {
    const mode = detectDeviceMode();
    document.body.classList.add(mode === "mobile" ? "is-mobile" : "is-desktop");
}
/* ---------- Scroll progress bar ---------- */
function initProgressBar() {
    const bar = document.getElementById("progressBar");
    if (!bar)
        return;
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
function initMobileNav() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("siteNav");
    if (!toggle || !nav)
        return;
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
function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main .section"));
    const navLinks = Array.from(document.querySelectorAll(".topbar__nav a"));
    if (!sections.length || !navLinks.length)
        return;
    const linkFor = (id) => navLinks.find((link) => link.dataset.nav === id);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const id = entry.target.id;
            const link = linkFor(id);
            if (!link)
                return;
            if (entry.isIntersecting) {
                navLinks.forEach((l) => l.classList.remove("is-active"));
                link.classList.add("is-active");
            }
        });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
}
/* ---------- Reveal-on-scroll ---------- */
function initRevealOnScroll() {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length)
        return;
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    targets.forEach((target) => observer.observe(target));
}
/* ---------- Interactive skill tags ---------- */
function initFocusTags() {
    const tags = document.querySelectorAll("#focusTags .tag");
    tags.forEach((tag) => {
        tag.addEventListener("click", () => {
            tag.classList.toggle("is-active");
        });
    });
}
/* ---------- Copy-to-clipboard contact button ---------- */
function initCopyButton() {
    const btn = document.getElementById("copyEmailBtn");
    if (!btn)
        return;
    const email = btn.dataset.email || "";
    const originalLabel = btn.textContent || "Copy";
    btn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(email);
        }
        catch {
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
function initExpandableProjectCards() {
    document.querySelectorAll(".project-card").forEach((card) => {
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
function initTerminal() {
    const body = document.getElementById("terminalBody");
    const form = document.getElementById("terminalForm");
    const input = document.getElementById("terminalInput");
    if (!body || !form || !input)
        return;
    const print = (text, tone) => {
        const line = document.createElement("p");
        line.className = "terminal__line" + (tone ? ` terminal__line--${tone}` : "");
        line.textContent = text;
        body.appendChild(line);
    };
    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el)
            el.scrollIntoView({ behavior: "smooth" });
    };
    const printHelp = () => {
        print("Available commands:", "cyan");
        print("  about      — who I am");
        print("  make       — what I've built");
        print("  skills     — what I focus on");
        print("  contact    — how to reach me");
        print("  clear      — clear this terminal");
        print("  help       — show this list again");
    };
    const commands = {
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
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const raw = input.value.trim();
        if (!raw)
            return;
        print(`guest@deadpixel:~$ ${raw}`, "muted");
        const command = commands[raw.toLowerCase()];
        if (command) {
            command.run(print);
        }
        else {
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
    const printNextIntroLine = () => {
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
function init() {
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
