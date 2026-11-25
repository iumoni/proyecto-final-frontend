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

const formAlimento = document.getElementById("form-alimento");
const inputAlimentoId = document.getElementById("alimento-id");
const inputNombreAlimento = document.getElementById("nombre-alimento");
const titleAlimento = document.getElementById("form-alimento-title");
const btnCancelarAlimento = document.getElementById("btn-cancelar-alimento");

function resetFormAlimento() {
  formAlimento.reset();
  inputAlimentoId.value = "";
  titleAlimento.textContent = "Registrar alimento";
  btnCancelarAlimento.hidden = true;
}

function prepararEdicionAlimento(alimento) {
  inputAlimentoId.value = alimento.idAlimento;
  inputNombreAlimento.value = alimento.nombreAlimento || "";
  titleAlimento.textContent = `Editar alimento #${alimento.idAlimento}`;
  btnCancelarAlimento.hidden = false;
  inputNombreAlimento.focus();
}

async function borrarAlimento(id) {
  try {
    await alimentosApi.eliminar(id);
    state.alimentos = state.alimentos.filter((item) => item.idAlimento !== id);
    renderAlimentos();
    mostrarMensaje("Alimento eliminado correctamente.", "success");
  } catch (error) {
    mostrarMensaje(`Error al eliminar alimento: ${error.message}`, "error");
  }
}

formAlimento.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = { nombreAlimento: inputNombreAlimento.value.trim() };
  const id = inputAlimentoId.value;

  try {
    if (id) {
      const actualizado = await alimentosApi.actualizar(id, payload);
      state.alimentos = state.alimentos.map((item) =>
        item.idAlimento === Number(id) ? actualizado : item
      );
      mostrarMensaje("Alimento actualizado correctamente.", "success");
    } else {
      const creado = await alimentosApi.crear(payload);
      state.alimentos.push(creado);
      mostrarMensaje("Alimento registrado correctamente.", "success");
    }
    resetFormAlimento();
    renderAlimentos();
  } catch (error) {
    mostrarMensaje(`Error al guardar alimento: ${error.message}`, "error");
  }
});

btnCancelarAlimento.addEventListener("click", resetFormAlimento);

const formEspecie = document.getElementById("form-especie");
const inputEspecieId = document.getElementById("especie-id");
const inputNombreEspecie = document.getElementById("nombre-especie");
const titleEspecie = document.getElementById("form-especie-title");
const btnCancelarEspecie = document.getElementById("btn-cancelar-especie");

function resetFormEspecie() {
  formEspecie.reset();
  inputEspecieId.value = "";
  titleEspecie.textContent = "Registrar especie";
  btnCancelarEspecie.hidden = true;
}

function prepararEdicionEspecie(especie) {
  inputEspecieId.value = especie.idEspecie;
  inputNombreEspecie.value = especie.nombre || "";
  titleEspecie.textContent = `Editar especie #${especie.idEspecie}`;
  btnCancelarEspecie.hidden = false;
  inputNombreEspecie.focus();
}

async function borrarEspecie(id) {
  try {
    await especiesApi.eliminar(id);
    state.especies = state.especies.filter((item) => item.idEspecie !== id);
    renderEspecies();
    mostrarMensaje("Especie eliminada correctamente.", "success");
  } catch (error) {
    mostrarMensaje(`Error al eliminar especie: ${error.message}`, "error");
  }
}

formEspecie.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = { nombre: inputNombreEspecie.value.trim() };
  const id = inputEspecieId.value;

  try {
    if (id) {
      const actualizada = await especiesApi.actualizar(id, payload);
      state.especies = state.especies.map((item) =>
        item.idEspecie === Number(id) ? actualizada : item
      );
      mostrarMensaje("Especie actualizada correctamente.", "success");
    } else {
      const creada = await especiesApi.crear(payload);
      state.especies.push(creada);
      mostrarMensaje("Especie registrada correctamente.", "success");
    }
    resetFormEspecie();
    renderEspecies();
  } catch (error) {
    mostrarMensaje(`Error al guardar especie: ${error.message}`, "error");
  }
});

btnCancelarEspecie.addEventListener("click", resetFormEspecie);

const formAnimal = document.getElementById("form-animal");
const inputAnimalId = document.getElementById("animal-id");
const inputAnimalEdad = document.getElementById("animal-edad");
const inputAnimalPeso = document.getElementById("animal-peso");
const titleAnimal = document.getElementById("form-animal-title");
const btnCancelarAnimal = document.getElementById("btn-cancelar-animal");

function resetFormAnimal() {
  formAnimal.reset();
  inputAnimalId.value = "";
  titleAnimal.textContent = "Registrar animal";
  btnCancelarAnimal.hidden = true;
}

function prepararEdicionAnimal(animal) {
  inputAnimalId.value = animal.idAnimal;
  const idEsp =
    typeof animal.especie === "object" && animal.especie !== null
      ? animal.especie.idEspecie
      : "";
  dom.selectEspecie.value = idEsp || "";
  inputAnimalEdad.value = animal.edad ?? "";
  inputAnimalPeso.value = animal.peso ?? "";
  titleAnimal.textContent = `Editar animal #${animal.idAnimal}`;
  btnCancelarAnimal.hidden = false;
  dom.selectEspecie.focus();
}

async function borrarAnimal(id) {
  try {
    await animalesApi.eliminar(id);
    state.animales = state.animales.filter((item) => item.idAnimal !== id);
    renderAnimales();
    mostrarMensaje("Animal eliminado correctamente.", "success");
  } catch (error) {
    mostrarMensaje(`Error al eliminar animal: ${error.message}`, "error");
  }
}

formAnimal.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idEspecieSeleccionada = Number(dom.selectEspecie.value);
  const especieSeleccionada = state.especies.find(
    (esp) => esp.idEspecie === idEspecieSeleccionada
  );

  const payload = {
    especie: especieSeleccionada || { idEspecie: idEspecieSeleccionada },
    edad: Number(inputAnimalEdad.value),
    peso: Number(inputAnimalPeso.value),
  };
  const id = inputAnimalId.value;

  try {
    if (id) {
      const actualizado = await animalesApi.actualizar(id, payload);
      state.animales = state.animales.map((item) =>
        item.idAnimal === Number(id) ? actualizado : item
      );
      mostrarMensaje("Animal actualizado correctamente.", "success");
    } else {
      const creado = await animalesApi.crear(payload);
      state.animales.push(creado);
      mostrarMensaje("Animal registrado correctamente.", "success");
    }
    resetFormAnimal();
    renderAnimales();
  } catch (error) {
    mostrarMensaje(`Error al guardar animal: ${error.message}`, "error");
  }
});

btnCancelarAnimal.addEventListener("click", resetFormAnimal);

async function cargarDatosIniciales() {
  try {
    const [alimentos, especies, animales] = await Promise.all([
      alimentosApi.listar(),
      especiesApi.listar(),
      animalesApi.listar(),
    ]);
    state.alimentos = Array.isArray(alimentos) ? alimentos : [];
    state.especies = Array.isArray(especies) ? especies : [];
    state.animales = Array.isArray(animales) ? animales : [];

    renderAlimentos();
    renderEspecies();
    renderAnimales();
  } catch (error) {
    mostrarMensaje(
      `No se pudieron cargar los datos iniciales: ${error.message}`,
      "error"
    );
  }
}

cargarDatosIniciales(); 