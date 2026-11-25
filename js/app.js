const state = {
  alimentos: [],
  especies: [],
  animales: [],
  filtros: {
    alimentos: "",
    especies: "",
    animales: "",
  },
};

const dom = {
  statusBanner: document.getElementById("status-banner"),
  tabButtons: document.querySelectorAll(".tab-btn"),
  panels: {
    alimentos: document.getElementById("section-alimentos"),
    especies: document.getElementById("section-especies"),
    animales: document.getElementById("section-animales"),
  },
  tbodyAlimentos: document.getElementById("tbody-alimentos"),
  tbodyEspecies: document.getElementById("tbody-especies"),
  tbodyAnimales: document.getElementById("tbody-animales"),
  selectEspecie: document.getElementById("animal-especie"),
};

function mostrarMensaje(mensaje, tipo = "info") {
  dom.statusBanner.textContent = mensaje;
  dom.statusBanner.className = "status-banner";
  dom.statusBanner.hidden = false;

  if (tipo === "error") {
    dom.statusBanner.classList.add("is-error");
  } else if (tipo === "success") {
    dom.statusBanner.classList.add("is-success");
  }
}

function cambiarSeccion(seccionActiva) {
  dom.tabButtons.forEach((btn) => {
    const esActiva = btn.dataset.section === seccionActiva;
    btn.classList.toggle("is-active", esActiva);
  });

  Object.entries(dom.panels).forEach(([nombre, panel]) => {
    panel.hidden = nombre !== seccionActiva;
  });
}

dom.tabButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const targetSection = e.currentTarget.dataset.section;
    cambiarSeccion(targetSection);
  });
}); 