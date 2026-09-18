const portfolio = {
  name: "Danilo Gomes",
  role: "Product Designer",
  location: "Ceará · Brasil",
  email: "gomeodanilo@gmail.com",
  intro: "Transformo problemas complexos em experiências digitais claras, úteis e memoráveis.",
  about: "Desenho produtos que equilibram estratégia, clareza e uma experiência humana.",
  bio: "Atuo de ponta a ponta, da descoberta ao refinamento visual, colaborando com times para transformar incerteza em produtos que fazem sentido.",
  services: ["Product strategy", "UX research", "Interaction design", "Visual systems"],
  projects: [
    {
      slug: "projeto-um",
      title: "Projeto Um",
      category: "Produto digital",
      year: "2026",
      summary: "Uma experiência criada para simplificar uma jornada complexa e tornar decisões importantes mais claras.",
      role: "Product design",
      duration: "12 semanas",
      team: "Design + Produto + Engenharia",
      challenge: "Como poderíamos remover fricção sem simplificar demais as decisões que realmente importam?",
      context: "O produto cresceu rapidamente, mas a experiência passou a refletir a estrutura interna da empresa em vez das necessidades das pessoas.",
      outcome: "Reorganizamos a jornada em torno das intenções do usuário e criamos um sistema visual mais direto, consistente e escalável.",
      result: "A solução final conecta descoberta, decisão e acompanhamento em um fluxo contínuo, deixando as próximas ações sempre evidentes."
    },
    {
      slug: "projeto-dois",
      title: "Projeto Dois",
      category: "Experiência de serviço",
      year: "2025",
      summary: "Uma nova linguagem e uma jornada integrada para aproximar pessoas de um serviço essencial.",
      role: "UX/UI design",
      duration: "10 semanas",
      team: "Design + Negócio",
      challenge: "Como transformar um processo fragmentado em uma experiência contínua, acolhedora e fácil de entender?",
      context: "A pesquisa revelou que as pessoas não abandonavam por falta de interesse, mas por falta de confiança em cada próximo passo.",
      outcome: "Criamos uma arquitetura de informação orientada por contexto, com linguagem simples e feedback constante.",
      result: "O novo sistema reduz a carga cognitiva, dá autonomia ao usuário e sustenta o crescimento de novos serviços."
    }
  ]
};

const main = document.querySelector("#main");
const body = document.body;
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const cursor = document.querySelector(".cursor");
let observer;

function media(label, className = "") {
  return `<div class="case-media ${className} reveal"><span>${label} · imagem será substituída</span></div>`;
}

function homeTemplate() {
  return `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-aside">
        <strong>${portfolio.role}</strong>
        ${portfolio.intro}
      </div>
      <h1 class="hero-title" id="hero-title">
        <span><i>Designing</i></span>
        <span><i>useful</i></span>
        <span><i>things.</i></span>
      </h1>
      <div class="hero-foot">
        <span class="scroll-cue"><i class="scroll-dot"></i> Role para explorar</span>
        <span>${portfolio.location}</span>
      </div>
    </section>

    <section class="work-section" id="work" aria-labelledby="work-title">
      <div class="section-head reveal">
        <p class="section-label">Projetos selecionados · 01—02</p>
        <h2 class="section-title" id="work-title">Trabalhos recentes e histórias por trás deles.</h2>
      </div>
      <div class="project-list">
        ${portfolio.projects.map((project, index) => `
          <article class="project-card reveal">
            <a class="project-media cursor-target" href="#/case/${project.slug}" data-index="0${index + 1}" aria-label="Ver estudo de caso ${project.title}">
              <span class="media-grid" aria-hidden="true"></span>
            </a>
            <div class="project-info">
              <div class="project-meta">${project.category} · ${project.year}</div>
              <h3 class="project-title">${project.title}</h3>
              <p class="project-description">${project.summary}</p>
              <a class="text-link" href="#/case/${project.slug}">Ver projeto <span class="arrow"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="8" x2="8" y2="2"></line><polyline points="3 2 8 2 8 7"></polyline></svg></span></a>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="about-section" id="about" aria-labelledby="about-title">
      <div class="about-grid">
        <p class="section-label reveal">Sobre mim</p>
        <h2 class="about-copy reveal" id="about-title">${portfolio.about}</h2>
        <div class="about-detail reveal">
          <p>${portfolio.bio}</p>
          <ul class="service-list">
            ${portfolio.services.map(service => `<li>${service}</li>`).join("")}
          </ul>
        </div>
      </div>
    </section>
  `;
}

function caseTemplate(project) {
  const other = portfolio.projects.find(item => item.slug !== project.slug) || portfolio.projects[0];
  return `
    <article>
      <header class="case-hero">
        <div class="case-topline"><span>${project.category}</span><span>${project.year}</span></div>
        <h1 class="case-title">${project.title}</h1>
        <div class="case-intro">
          <p class="section-label">Visão geral</p>
          <p class="case-lead">${project.summary}</p>
          <dl class="case-facts">
            <div><dt>Papel</dt><dd>${project.role}</dd></div>
            <div><dt>Duração</dt><dd>${project.duration}</dd></div>
            <div><dt>Time</dt><dd>${project.team}</dd></div>
          </dl>
        </div>
        ${media("Visão principal")}
      </header>

      <section class="case-section">
        <div class="case-text-grid reveal">
          <p class="section-label">O desafio</p>
          <h2 class="case-copy">${project.challenge}</h2>
        </div>
        <div class="case-copy-small reveal">
          <p>${project.context}</p>
          <p>${project.outcome}</p>
        </div>
        <div class="media-pair">
          ${media("Pesquisa", "tall")}
          ${media("Mapeamento", "tall")}
        </div>
      </section>

      <section class="case-section dark">
        <div class="case-text-grid reveal">
          <p class="section-label">A solução</p>
          <h2 class="case-copy">Um sistema simples na superfície e sólido por dentro.</h2>
        </div>
        ${media("Interface final")}
        <div class="media-pair">
          ${media("Detalhe da experiência", "square")}
          ${media("Sistema visual", "square")}
        </div>
      </section>

      <section class="case-section">
        <div class="case-text-grid reveal">
          <p class="section-label">Resultado</p>
          <h2 class="case-copy">${project.result}</h2>
        </div>
        <div class="case-copy-small reveal">
          <p>Os indicadores finais e aprendizados serão adicionados com os dados reais do projeto.</p>
          <p>O estudo de caso foi estruturado para receber evidências, métricas e depoimentos sem alterar sua composição.</p>
        </div>
      </section>

      <a class="next-project" href="#/case/${other.slug}">
        <span><small>Próximo projeto</small><strong>${other.title}</strong></span>
        <span class="arrow" aria-hidden="true"><svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="8" x2="8" y2="2"></line><polyline points="3 2 8 2 8 7"></polyline></svg></span>
      </a>
    </article>
  `;
}

function syncGlobalContent() {
  document.querySelectorAll("[data-brand]").forEach(el => { el.textContent = portfolio.name; });
  document.querySelectorAll("[data-location]").forEach(el => { el.textContent = portfolio.location; });
  document.querySelectorAll("[data-email]").forEach(el => {
    el.href = `mailto:${portfolio.email}`;
  });
  document.querySelectorAll("[data-email-link]").forEach(el => { el.href = `mailto:${portfolio.email}`; });
  document.querySelector("[data-year]").textContent = new Date().getFullYear();
}

function setupReveals() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -5%" });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

function setupCursorTargets() {
  document.querySelectorAll(".cursor-target").forEach(target => {
    target.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    target.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });
}

function render() {
  if (location.hash && !location.hash.startsWith("#/")) return;

  const route = location.hash.replace(/^#\//, "");
  const [page, slug] = route.split("/");
  const project = page === "case" ? portfolio.projects.find(item => item.slug === slug) : null;

  main.innerHTML = project ? caseTemplate(project) : homeTemplate();
  document.title = project ? `${project.title} — ${portfolio.name}` : `${portfolio.name} — ${portfolio.role}`;
  syncGlobalContent();
  setupReveals();
  setupCursorTargets();
  closeMenu();
  requestAnimationFrame(() => {
    const section = !project && (page === "work" || page === "about")
      ? document.getElementById(page)
      : null;
    if (section) section.scrollIntoView();
    else window.scrollTo(0, 0);
  });
}

function closeMenu() {
  body.classList.remove("is-menu-open");
  menuButton.setAttribute("aria-expanded", "false");
}

menuButton.addEventListener("click", () => {
  const open = body.classList.toggle("is-menu-open");
  menuButton.setAttribute("aria-expanded", String(open));
});

nav.addEventListener("click", closeMenu);

document.addEventListener("mousemove", (event) => {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("hashchange", render);
render();
