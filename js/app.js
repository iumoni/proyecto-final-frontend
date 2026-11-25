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

function crearCelda(texto) {
  const td = document.createElement("td");
  td.textContent = texto ?? "";
  return td;
}

function crearBotonesAccion(onEditar, onEliminar) {
  const td = document.createElement("td");
  td.className = "actions-cell";

  const btnEditar = document.createElement("button");
  btnEditar.type = "button";
  btnEditar.className = "btn btn-secondary btn-sm";
  btnEditar.textContent = "Editar";
  btnEditar.addEventListener("click", (e) => {
    e.stopPropagation();
    onEditar();
  });

  const btnEliminar = document.createElement("button");
  btnEliminar.type = "button";
  btnEliminar.className = "btn btn-danger btn-sm";
  btnEliminar.textContent = "Eliminar";
  btnEliminar.addEventListener("click", (e) => {
    e.stopPropagation();
    onEliminar();
  });

  td.appendChild(btnEditar);
  td.appendChild(btnEliminar);
  return td;
}

function renderAlimentos() {
  const query = state.filtros.alimentos.trim().toLowerCase();
  const filtrados = state.alimentos.filter((item) =>
    (item.nombreAlimento || "").toLowerCase().includes(query)
  );

  dom.tbodyAlimentos.textContent = "";
  filtrados.forEach((alimento) => {
    const tr = document.createElement("tr");
    tr.appendChild(crearCelda(alimento.idAlimento));
    tr.appendChild(crearCelda(alimento.nombreAlimento));
    tr.appendChild(
      crearBotonesAccion(
        () => prepararEdicionAlimento(alimento),
        () => borrarAlimento(alimento.idAlimento)
      )
    );
    dom.tbodyAlimentos.appendChild(tr);
  });
}

function sincronizarSelectEspecies() {
  const valorActual = dom.selectEspecie.value;
  dom.selectEspecie.textContent = "";

  const opcionDefault = document.createElement("option");
  opcionDefault.value = "";
  opcionDefault.textContent = "Selecciona una especie...";
  dom.selectEspecie.appendChild(opcionDefault);

  state.especies.forEach((esp) => {
    const option = document.createElement("option");
    option.value = esp.idEspecie;
    option.textContent = esp.nombre;
    dom.selectEspecie.appendChild(option);
  });

  if (valorActual) {
    dom.selectEspecie.value = valorActual;
  }
}

function renderEspecies() {
  const query = state.filtros.especies.trim().toLowerCase();
  const filtradas = state.especies.filter((item) =>
    (item.nombre || "").toLowerCase().includes(query)
  );

  dom.tbodyEspecies.textContent = "";
  filtradas.forEach((especie) => {
    const tr = document.createElement("tr");
    tr.appendChild(crearCelda(especie.idEspecie));
    tr.appendChild(crearCelda(especie.nombre));
    tr.appendChild(
      crearBotonesAccion(
        () => prepararEdicionEspecie(especie),
        () => borrarEspecie(especie.idEspecie)
      )
    );
    dom.tbodyEspecies.appendChild(tr);
  });

  sincronizarSelectEspecies();
}

function obtenerNombreEspecie(animal) {
  if (typeof animal.especie === "object" && animal.especie !== null) {
    return animal.especie.nombre || `ID ${animal.especie.idEspecie || ""}`;
  }
  return animal.especie || "";
}

function renderAnimales() {
  const query = state.filtros.animales.trim().toLowerCase();
  const filtrados = state.animales.filter((item) => {
    const nombreEsp = obtenerNombreEspecie(item).toLowerCase();
    const idTexto = String(item.idAnimal ?? "").toLowerCase();
    return nombreEsp.includes(query) || idTexto.includes(query);
  });

  dom.tbodyAnimales.textContent = "";
  filtrados.forEach((animal) => {
    const tr = document.createElement("tr");
    tr.appendChild(crearCelda(animal.idAnimal));
    tr.appendChild(crearCelda(obtenerNombreEspecie(animal)));
    tr.appendChild(crearCelda(animal.edad));
    tr.appendChild(crearCelda(animal.peso));
    tr.appendChild(
      crearBotonesAccion(
        () => prepararEdicionAnimal(animal),
        () => borrarAnimal(animal.idAnimal)
      )
    );
    dom.tbodyAnimales.appendChild(tr);
  });
}

document.getElementById("search-alimentos").addEventListener("input", (e) => {
  state.filtros.alimentos = e.target.value;
  renderAlimentos();
});

document.getElementById("search-especies").addEventListener("input", (e) => {
  state.filtros.especies = e.target.value;
  renderEspecies();
});

document.getElementById("search-animales").addEventListener("input", (e) => {
  state.filtros.animales = e.target.value;
  renderAnimales();
}); 