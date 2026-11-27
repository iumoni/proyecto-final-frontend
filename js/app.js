/* =========================================================================
   app.js — Lógica de la página
   -------------------------------------------------------------------------
   Cada catálogo (animales, especies, corrales, alimentos, nutrientes) tiene
   su CRUD completo: listar, registrar, editar y eliminar.
   La configuración de cada uno está en el objeto ENTIDADES.
   ========================================================================= */

/* ---------------- Estado global ---------------- */
const state = {
  datos: { animales: [], especies: [], corrales: [], alimentos: [], nutrientes: [] },
  filtros: { animales: "", especies: "", corrales: "", alimentos: "", nutrientes: "" },
  cargando: true,
  errorCarga: null,
  seccion: "animales",
  resaltado: null, // { entidad, id } fila recién guardada
  confirmando: null, // { entidad, id } fila con confirmación de borrado abierta
  accionPendiente: null, // se ejecuta después de iniciar sesión
};

/* ---------------- Utilidades ---------------- */
const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

function el(tag, props = {}, ...hijos) {
  const nodo = document.createElement(tag);
  Object.entries(props).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === false) return;
    if (clave === "class") nodo.className = valor;
    else if (clave === "text") nodo.textContent = valor;
    else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
    else nodo.setAttribute(clave, valor === true ? "" : valor);
  });
  hijos.flat().forEach((h) => {
    if (h === null || h === undefined || h === false) return;
    nodo.append(h instanceof Node ? h : document.createTextNode(String(h)));
  });
  return nodo;
}

function icono(nombre) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#i-${nombre}`);
  svg.append(use);
  return svg;
}

const formatoNumero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const normalizar = (texto) =>
  String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

/* ---------------- Configuración de cada catálogo ---------------- */
const ENTIDADES = {
  animales: {
    api: animalesApi,
    idKey: "id",
    singular: "animal",
    genero: "m",
    nombreDe: (a) => `${a.especie || "Animal"} #${a.id}`,
    textoBusqueda: (a) => `${a.id} ${a.especie}`,
    celdas: (a) => [
      el("td", { class: "col-id", text: a.id }),
      el("td", { class: "cell-strong", text: a.especie }),
      el("td", { class: "num", text: a.edad }),
      el("td", { class: "num", text: formatoNumero.format(Number(a.peso)) }),
    ],
    leerForm: (f) => ({
      especieId: Number(f.especieId.value),
      edad: Number(f.edad.value),
      peso: Number(f.peso.value),
    }),
    llenarForm: (f, a) => {
      f.especieId.value = a.especieId ?? "";
      f.edad.value = a.edad ?? "";
      f.peso.value = a.peso ?? "";
    },
    vacio: () =>
      state.datos.especies.length
        ? "Todavía no hay animales registrados. Usa el formulario para registrar el primero."
        : "Todavía no hay animales. Primero registra al menos una especie en Especies.",
  },

  especies: {
    api: especiesApi,
    idKey: "idEspecie",
    singular: "especie",
    genero: "f",
    nombreDe: (e) => e.nombre,
    textoBusqueda: (e) => `${e.idEspecie} ${e.nombre}`,
    celdas: (e) => {
      const total = state.datos.animales.filter((a) => a.especieId === e.idEspecie).length;
      return [
        el("td", { class: "col-id", text: e.idEspecie }),
        el("td", { class: "cell-strong", text: e.nombre }),
        el("td", { class: "num" + (total ? "" : " is-zero"), text: total }),
      ];
    },
    leerForm: (f) => ({ nombre: f.nombre.value.trim() }),
    llenarForm: (f, e) => {
      f.nombre.value = e.nombre ?? "";
    },
    vacio: () => "Todavía no hay especies. Registra una (por ejemplo Bovino) para poder dar de alta animales.",
  },

  corrales: {
    api: corralesApi,
    idKey: "idCorral",
    singular: "corral",
    genero: "m",
    nombreDe: (c) => c.nombreCorral,
    textoBusqueda: (c) => `${c.idCorral} ${c.nombreCorral}`,
    celdas: (c) => [
      el("td", { class: "col-id", text: c.idCorral }),
      el("td", { class: "cell-strong", text: c.nombreCorral }),
      el("td", { class: "num", text: c.capacidad }),
    ],
    leerForm: (f) => ({
      nombreCorral: f.nombreCorral.value.trim(),
      capacidad: Number(f.capacidad.value),
    }),
    llenarForm: (f, c) => {
      f.nombreCorral.value = c.nombreCorral ?? "";
      f.capacidad.value = c.capacidad ?? "";
    },
    vacio: () => "Todavía no hay corrales registrados. Usa el formulario para dar de alta el primero.",
  },

  alimentos: {
    api: alimentosApi,
    idKey: "idAlimento",
    singular: "alimento",
    genero: "m",
    nombreDe: (a) => a.nombreAlimento,
    textoBusqueda: (a) =>
      `${a.idAlimento} ${a.nombreAlimento} ${(a.nutrientes || []).map((n) => n.nombreNutriente).join(" ")}`,
    celdas: (a) => {
      const nutrientes = a.nutrientes || [];
      const contenido = nutrientes.length
        ? el("ul", { class: "chips" }, nutrientes.map((n) => el("li", { class: "chip", text: n.nombreNutriente })))
        : el("span", { class: "muted", text: "Sin nutrientes" });
      return [
        el("td", { class: "col-id", text: a.idAlimento }),
        el("td", { class: "cell-strong", text: a.nombreAlimento }),
        el("td", {}, contenido),
      ];
    },
    leerForm: (f) => ({
      nombreAlimento: f.nombreAlimento.value.trim(),
      nutrientesIds: $$('input[name="nutrientesIds"]:checked', f.nombreAlimento.form).map((c) => Number(c.value)),
    }),
    llenarForm: (f, a) => {
      f.nombreAlimento.value = a.nombreAlimento ?? "";
      const ids = new Set((a.nutrientes || []).map((n) => n.idNutriente));
      $$('input[name="nutrientesIds"]', f.nombreAlimento.form).forEach((c) => {
        c.checked = ids.has(Number(c.value));
      });
    },
    vacio: () => "Todavía no hay alimentos. Registra uno y marca los nutrientes que aporta.",
  },

  nutrientes: {
    api: nutrientesApi,
    idKey: "idNutriente",
    singular: "nutriente",
    genero: "m",
    nombreDe: (n) => n.nombreNutriente,
    textoBusqueda: (n) => `${n.idNutriente} ${n.nombreNutriente}`,
    celdas: (n) => {
      const total = state.datos.alimentos.filter((a) =>
        (a.nutrientes || []).some((x) => x.idNutriente === n.idNutriente)
      ).length;
      return [
        el("td", { class: "col-id", text: n.idNutriente }),
        el("td", { class: "cell-strong", text: n.nombreNutriente }),
        el("td", { class: "num" + (total ? "" : " is-zero"), text: total }),
      ];
    },
    leerForm: (f) => ({ nombreNutriente: f.nombreNutriente.value.trim() }),
    llenarForm: (f, n) => {
      f.nombreNutriente.value = n.nombreNutriente ?? "";
    },
    vacio: () => "Todavía no hay nutrientes. Registra algunos (Proteína, Fibra…) para asociarlos a los alimentos.",
  },
};

const NOMBRES_ENTIDADES = Object.keys(ENTIDADES);

/* ---------------- Mensajes (toasts) ---------------- */
function avisar(mensaje, tipo = "info") {
  const contenedor = $("#toasts");
  const toast = el(
    "div",
    { class: `toast toast-${tipo}`, role: tipo === "error" ? "alert" : null },
    el("p", { text: mensaje }),
    el(
      "button",
      { type: "button", class: "icon-btn", "aria-label": "Cerrar aviso", onclick: () => quitar() },
      icono("cerrar")
    )
  );
  const quitar = () => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 200);
  };
  contenedor.append(toast);
  // Máximo 3 avisos visibles
  while (contenedor.children.length > 3) contenedor.firstElementChild.remove();
  setTimeout(quitar, tipo === "error" ? 7000 : 4000);
}

/** Traduce un error de la API a un mensaje claro para la persona usuaria. */
function mensajeDeError(error, entidad, accion) {
  const cfg = ENTIDADES[entidad];
  const status = error && error.status;
  if (status === 0) return error.message;
  if (status === 401) return "Tu sesión no es válida o ya expiró. Inicia sesión de nuevo.";
  if (status === 400) return error.detalle || "Revisa los datos: hay un campo vacío o con un valor no permitido.";
  if (status === 404) return error.detalle || `Ese ${cfg ? cfg.singular : "registro"} ya no existe. Recarga la lista.`;
  if (status === 409) return error.detalle || "No se puede completar: el registro está en uso por otro catálogo.";
  if (status >= 500 && (accion === "crear" || accion === "actualizar")) {
    return "El servidor rechazó los datos. Es posible que ya exista un registro con ese nombre.";
  }
  if (status >= 500 && accion === "eliminar") {
    return "El servidor no pudo eliminarlo. Es posible que esté en uso por otro registro.";
  }
  return (error && error.message) || "Ocurrió un error inesperado.";
}

/* ---------------- Navegación por secciones ---------------- */
function seccionDesdeHash() {
  const hash = location.hash.replace("#", "");
  return NOMBRES_ENTIDADES.includes(hash) ? hash : "animales";
}

function mostrarSeccion(nombre, { enfocar = false } = {}) {
  state.seccion = nombre;
  $$(".panel").forEach((panel) => {
    panel.hidden = panel.dataset.entity !== nombre;
  });
  $$(".nav-item").forEach((item) => {
    if (item.dataset.section === nombre) {
      item.setAttribute("aria-current", "page");
      // En celular la barra de pestañas se desplaza para mostrar la activa
      const nav = item.parentElement;
      nav.scrollLeft = item.offsetLeft - (nav.clientWidth - item.offsetWidth) / 2;
    } else {
      item.removeAttribute("aria-current");
    }
  });
  document.title = `${$(`#h-${nombre}`).textContent} · Granja`;
  if (enfocar) $("#contenido").focus({ preventScroll: true });
}

window.addEventListener("hashchange", () => {
  mostrarSeccion(seccionDesdeHash(), { enfocar: true });
  window.scrollTo({ top: 0 });
});

/* ---------------- Render de tablas ---------------- */
function filaSkeleton(columnas) {
  return el(
    "tr",
    { class: "row-skeleton", "aria-hidden": "true" },
    Array.from({ length: columnas }, () => el("td", {}, el("span", { class: "skeleton" })))
  );
}

function celdaAcciones(entidad, item) {
  const cfg = ENTIDADES[entidad];
  const id = item[cfg.idKey];
  const nombre = cfg.nombreDe(item);
  const td = el("td", { class: "col-actions" });

  const confirmando =
    state.confirmando && state.confirmando.entidad === entidad && state.confirmando.id === id;

  if (confirmando) {
    td.append(
      el(
        "div",
        { class: "confirm" },
        el("span", { class: "confirm-text", text: "¿Eliminar?" }),
        el(
          "button",
          {
            type: "button",
            class: "btn btn-danger btn-sm",
            "data-confirm-delete": "",
            onclick: () => eliminarRegistro(entidad, id),
          },
          "Eliminar"
        ),
        el(
          "button",
          {
            type: "button",
            class: "btn btn-ghost btn-sm",
            onclick: () => {
              state.confirmando = null;
              renderTabla(entidad);
            },
          },
          "No"
        )
      )
    );
    return td;
  }

  td.append(
    el(
      "div",
      { class: "row-actions" },
      el(
        "button",
        {
          type: "button",
          class: "icon-btn",
          "aria-label": `Editar ${nombre}`,
          title: "Editar",
          onclick: () => prepararEdicion(entidad, item),
        },
        icono("editar")
      ),
      el(
        "button",
        {
          type: "button",
          class: "icon-btn icon-btn-danger",
          "aria-label": `Eliminar ${nombre}`,
          title: "Eliminar",
          onclick: () =>
            requiereSesion(() => {
              state.confirmando = { entidad, id };
              renderTabla(entidad);
              const boton = $(`#tbody-${entidad} [data-confirm-delete]`);
              if (boton) boton.focus();
            }),
        },
        icono("borrar")
      )
    )
  );
  return td;
}

function renderTabla(entidad) {
  const cfg = ENTIDADES[entidad];
  const tbody = $(`#tbody-${entidad}`);
  const panel = $(`#section-${entidad}`);
  const vacio = $("[data-empty]", panel);
  const columnas = $$("thead th", panel).length;
  tbody.textContent = "";

  if (state.cargando) {
    vacio.hidden = true;
    for (let i = 0; i < 4; i++) tbody.append(filaSkeleton(columnas));
    return;
  }

  if (state.errorCarga) {
    vacio.hidden = false;
    vacio.textContent = "";
    vacio.append(
      el("p", { class: "empty-title", text: "No se pudieron cargar los datos" }),
      el("p", { text: state.errorCarga }),
      el(
        "div",
        { class: "empty-actions" },
        el("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => cargarDatos() }, icono("recargar"), "Reintentar"),
        el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: abrirServidor }, "Cambiar servidor")
      )
    );
    return;
  }

  const lista = state.datos[entidad];
  const consulta = normalizar(state.filtros[entidad].trim());
  const filtrados = consulta ? lista.filter((item) => normalizar(cfg.textoBusqueda(item)).includes(consulta)) : lista;

  filtrados.forEach((item) => {
    const id = item[cfg.idKey];
    const tr = el("tr", { "data-id": id }, cfg.celdas(item), celdaAcciones(entidad, item));
    const editando = $(`#form-${entidad}`).elements.id.value;
    if (editando && Number(editando) === id) tr.classList.add("is-editing");
    if (state.resaltado && state.resaltado.entidad === entidad && state.resaltado.id === id) {
      tr.classList.add("is-new");
    }
    tbody.append(tr);
  });

  if (!lista.length) {
    vacio.hidden = false;
    vacio.textContent = "";
    vacio.append(el("p", { text: cfg.vacio() }));
  } else if (!filtrados.length) {
    vacio.hidden = false;
    vacio.textContent = "";
    vacio.append(el("p", { text: `Ningún resultado para “${state.filtros[entidad].trim()}”.` }));
  } else {
    vacio.hidden = true;
  }
}

function renderContadores() {
  NOMBRES_ENTIDADES.forEach((entidad) => {
    const nodo = $(`[data-count="${entidad}"]`);
    nodo.textContent = state.cargando || state.errorCarga ? "" : state.datos[entidad].length;
  });
}

/* ---------------- Opciones dependientes (especies, nutrientes) ---------------- */
function renderSelectEspecies() {
  const select = $("#animal-especie");
  const actual = select.value;
  select.textContent = "";
  select.append(el("option", { value: "", text: "Selecciona una especie" }));
  state.datos.especies.forEach((e) => select.append(el("option", { value: e.idEspecie, text: e.nombre })));
  if (actual && state.datos.especies.some((e) => String(e.idEspecie) === actual)) select.value = actual;
  $("#hint-especies-vacias").hidden = state.cargando || state.datos.especies.length > 0;
}

function renderChecksNutrientes() {
  const contenedor = $("#alimento-nutrientes");
  const marcados = new Set($$('input[name="nutrientesIds"]:checked', contenedor).map((c) => c.value));
  contenedor.textContent = "";
  state.datos.nutrientes.forEach((n) => {
    const id = `nutriente-check-${n.idNutriente}`;
    contenedor.append(
      el(
        "label",
        { class: "check", for: id },
        el("input", {
          type: "checkbox",
          id,
          name: "nutrientesIds",
          value: n.idNutriente,
          checked: marcados.has(String(n.idNutriente)),
        }),
        el("span", { text: n.nombreNutriente })
      )
    );
  });
  $("#hint-nutrientes-vacios").hidden = state.cargando || state.datos.nutrientes.length > 0;
}

function renderTodo() {
  renderSelectEspecies();
  renderChecksNutrientes();
  NOMBRES_ENTIDADES.forEach(renderTabla);
  renderContadores();
}

/* ---------------- Formularios ---------------- */
function textosFormulario(entidad, editando, item) {
  const cfg = ENTIDADES[entidad];
  const singular = cfg.singular;
  return {
    titulo: editando ? `Editar ${singular} · ${cfg.nombreDe(item)}` : `Registrar ${singular}`,
    boton: editando ? "Guardar cambios" : `Guardar ${singular}`,
  };
}

function resetForm(entidad) {
  const form = $(`#form-${entidad}`);
  form.reset();
  form.elements.id.value = "";
  const textos = textosFormulario(entidad, false);
  $("[data-title]", form).textContent = textos.titulo;
  $("[data-submit]", form).textContent = textos.boton;
  $("[data-cancel]", form).hidden = true;
  $("[data-error]", form).hidden = true;
  form.classList.remove("is-editing");
  renderTabla(entidad);
}

function prepararEdicion(entidad, item) {
  const cfg = ENTIDADES[entidad];
  const form = $(`#form-${entidad}`);
  resetForm(entidad);
  form.elements.id.value = item[cfg.idKey];
  cfg.llenarForm(form.elements, item);
  const textos = textosFormulario(entidad, true, item);
  $("[data-title]", form).textContent = textos.titulo;
  $("[data-submit]", form).textContent = textos.boton;
  $("[data-cancel]", form).hidden = false;
  form.classList.add("is-editing");
  renderTabla(entidad);

  const primerCampo = $("input:not([type=hidden]), select", form);
  if (window.matchMedia("(max-width: 899px)").matches) {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  primerCampo.focus({ preventScroll: true });
}

async function guardarRegistro(entidad) {
  const cfg = ENTIDADES[entidad];
  const form = $(`#form-${entidad}`);
  const errorBox = $("[data-error]", form);
  const boton = $("[data-submit]", form);
  const id = form.elements.id.value;
  const datos = cfg.leerForm(form.elements);
  const accion = id ? "actualizar" : "crear";

  errorBox.hidden = true;
  boton.disabled = true;
  boton.classList.add("is-loading");

  try {
    const guardado = id ? await cfg.api.actualizar(id, datos) : await cfg.api.crear(datos);
    const idGuardado = guardado ? guardado[cfg.idKey] : Number(id);
    state.resaltado = { entidad, id: idGuardado };
    resetForm(entidad);
    const articulo = cfg.genero === "f" ? "registrada" : "registrado";
    const articuloAct = cfg.genero === "f" ? "actualizada" : "actualizado";
    avisar(
      `${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} ${id ? articuloAct : articulo}: ${guardado ? cfg.nombreDe(guardado) : ""}`.trim(),
      "success"
    );
    await cargarDatos({ silencioso: true });
    $(`#form-${entidad} input:not([type=hidden]), #form-${entidad} select`).focus();
  } catch (error) {
    if (error.status === 401) {
      sesionExpirada(() => guardarRegistro(entidad), "Tu sesión expiró. Vuelve a entrar para guardar.");
      return;
    }
    errorBox.textContent = mensajeDeError(error, entidad, accion);
    errorBox.hidden = false;
  } finally {
    boton.disabled = false;
    boton.classList.remove("is-loading");
  }
}

async function eliminarRegistro(entidad, id) {
  const cfg = ENTIDADES[entidad];
  const item = state.datos[entidad].find((x) => x[cfg.idKey] === id);
  try {
    await cfg.api.eliminar(id);
    state.confirmando = null;
    const form = $(`#form-${entidad}`);
    if (Number(form.elements.id.value) === id) resetForm(entidad);
    avisar(`${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} eliminad${cfg.genero === "f" ? "a" : "o"}: ${item ? cfg.nombreDe(item) : `#${id}`}`, "success");
    await cargarDatos({ silencioso: true });
  } catch (error) {
    state.confirmando = null;
    renderTabla(entidad);
    if (error.status === 401) {
      sesionExpirada(null, "Tu sesión expiró. Vuelve a entrar para eliminar.");
      return;
    }
    avisar(mensajeDeError(error, entidad, "eliminar"), "error");
  }
}

function conectarFormularios() {
  NOMBRES_ENTIDADES.forEach((entidad) => {
    const form = $(`#form-${entidad}`);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      requiereSesion(() => guardarRegistro(entidad));
    });
    $("[data-cancel]", form).addEventListener("click", () => resetForm(entidad));
    form.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && form.elements.id.value) resetForm(entidad);
    });

    $(`#search-${entidad}`).addEventListener("input", (e) => {
      state.filtros[entidad] = e.target.value;
      renderTabla(entidad);
    });
  });
}

/* ---------------- Sesión (JWT) ---------------- */
function renderSesion() {
  const caja = $("#session-box");
  caja.textContent = "";
  document.body.classList.toggle("has-session", sesion.activa);

  if (sesion.activa) {
    caja.append(
      el(
        "div",
        { class: "session-user" },
        el("span", { class: "avatar", "aria-hidden": "true", text: (sesion.usuario || "?")[0].toUpperCase() }),
        el("span", { class: "session-text" }, el("strong", { text: sesion.usuario || "Usuario" }), el("span", { text: "Sesión activa" }))
      ),
      el(
        "button",
        { type: "button", class: "icon-btn", "aria-label": "Cerrar sesión", title: "Cerrar sesión", onclick: cerrarSesion },
        icono("salir")
      )
    );
  } else {
    caja.append(
      el(
        "button",
        { type: "button", class: "btn btn-outline btn-block", onclick: () => pedirSesion() },
        icono("candado"),
        "Iniciar sesión"
      )
    );
  }
}

/** El servidor rechazó el token (401): se cierra la sesión y se pide entrar de nuevo. */
function sesionExpirada(accionDespues, mensaje) {
  const ultimoUsuario = sesion.usuario;
  sesion.cerrar();
  renderSesion();
  if (ultimoUsuario && !$("#login-usuario").value) $("#login-usuario").value = ultimoUsuario;
  pedirSesion(accionDespues, mensaje);
}

/** Ejecuta la acción si hay sesión; si no, pide iniciar sesión y la ejecuta después. */
function requiereSesion(accion) {
  if (sesion.activa) {
    accion();
    return;
  }
  if (sesion.token) {
    sesionExpirada(accion, "Tu sesión expiró. Vuelve a entrar para continuar.");
    return;
  }
  pedirSesion(accion);
}

function pedirSesion(accionDespues = null, mensaje = null) {
  state.accionPendiente = accionDespues;
  const dialog = $("#dialog-login");
  $("#login-error").hidden = true;
  $("#login-desc").textContent =
    mensaje || "Consultar es libre. Para registrar, editar o eliminar necesitas una sesión.";
  if (!dialog.open) dialog.showModal();
  const usuario = $("#login-usuario");
  (usuario.value ? $("#login-password") : usuario).focus();
}

async function iniciarSesion(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const boton = $("#btn-login");
  const errorBox = $("#login-error");
  const usuario = form.username.value.trim();

  errorBox.hidden = true;
  boton.disabled = true;
  boton.classList.add("is-loading");
  try {
    const respuesta = await authApi.login(usuario, form.password.value);
    if (!respuesta || !respuesta.token) throw new ApiError("El servidor no devolvió un token.", 500);
    sesion.guardar(respuesta.token, usuario);
    form.password.value = "";
    $("#dialog-login").close();
    renderSesion();
    avisar(`Sesión iniciada como ${usuario}.`, "success");
    const pendiente = state.accionPendiente;
    state.accionPendiente = null;
    if (pendiente) pendiente();
  } catch (error) {
    errorBox.textContent =
      error.status === 401 || error.status === 400
        ? "Usuario o contraseña incorrectos."
        : mensajeDeError(error, null, "login");
    errorBox.hidden = false;
    form.password.select();
  } finally {
    boton.disabled = false;
    boton.classList.remove("is-loading");
  }
}

function cerrarSesion() {
  sesion.cerrar();
  renderSesion();
  avisar("Sesión cerrada.", "info");
}

/* Revisa cada 30 s si el token ya venció */
setInterval(() => {
  if (sesion.token && !sesion.activa) {
    sesion.cerrar();
    renderSesion();
    avisar("Tu sesión expiró. Inicia sesión de nuevo para hacer cambios.", "info");
  }
}, 30000);

/* ---------------- Servidor ---------------- */
function renderServidor(estado) {
  const boton = $("#btn-servidor");
  boton.dataset.state = estado;
  const url = config.apiUrl.replace(/^https?:\/\//, "");
  $("#server-label").textContent =
    estado === "ok" ? "Conectado" : estado === "error" ? "Sin conexión" : "Conectando…";
  $("#server-detail").textContent = url;
  boton.setAttribute("aria-label", `Servidor: ${$("#server-label").textContent}, ${url}. Cambiar servidor`);
}

function abrirServidor() {
  const dialog = $("#dialog-servidor");
  $("#servidor-url").value = config.apiUrl;
  dialog.showModal();
  $("#servidor-url").select();
}

function cambiarServidor(url) {
  const anterior = config.apiUrl;
  config.apiUrl = url;
  $("#dialog-servidor").close();
  if (config.apiUrl !== anterior && sesion.token) {
    sesion.cerrar(); // el token de otro servidor no sirve aquí
    renderSesion();
  }
  cargarDatos();
}

/* ---------------- Carga de datos ---------------- */
async function cargarDatos({ silencioso = false } = {}) {
  if (!silencioso) {
    state.cargando = true;
    state.errorCarga = null;
    renderServidor("loading");
    renderTodo();
  }
  try {
    const [animales, especies, corrales, alimentos, nutrientes] = await Promise.all([
      animalesApi.listar(),
      especiesApi.listar(),
      corralesApi.listar(),
      alimentosApi.listar(),
      nutrientesApi.listar(),
    ]);
    const lista = (x) => (Array.isArray(x) ? x : []);
    state.datos = {
      animales: lista(animales),
      especies: lista(especies),
      corrales: lista(corrales),
      alimentos: lista(alimentos),
      nutrientes: lista(nutrientes),
    };
    state.errorCarga = null;
    renderServidor("ok");
  } catch (error) {
    state.errorCarga = mensajeDeError(error, null, "listar");
    renderServidor("error");
  } finally {
    state.cargando = false;
    renderTodo();
    // El resaltado de la fila nueva dura una sola vez
    setTimeout(() => {
      state.resaltado = null;
    }, 1600);
  }
}

/* ---------------- Diálogos ---------------- */
function conectarDialogos() {
  $$("dialog").forEach((dialog) => {
    $$("[data-close]", dialog).forEach((b) => b.addEventListener("click", () => dialog.close()));
    // Cerrar al hacer clic fuera del cuadro
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
  $("#dialog-login").addEventListener("close", () => {
    state.accionPendiente = null;
  });
  $("#form-login").addEventListener("submit", iniciarSesion);
  $("#btn-servidor").addEventListener("click", abrirServidor);
  $("#form-servidor").addEventListener("submit", (e) => {
    e.preventDefault();
    cambiarServidor($("#servidor-url").value);
  });
  $("#btn-servidor-default").addEventListener("click", () => cambiarServidor(DEFAULT_API_URL));
}

/* ---------------- Inicio ---------------- */
function iniciar() {
  if (sesion.token && !sesion.activa) sesion.cerrar();
  conectarFormularios();
  conectarDialogos();
  renderSesion();
  mostrarSeccion(seccionDesdeHash());
  cargarDatos();
}

iniciar();
