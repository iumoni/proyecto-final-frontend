/* =========================================================================
   api.js — Cliente HTTP para la API de la granja (Spring Boot)
   -------------------------------------------------------------------------
   - La URL del servidor se puede cambiar desde la página (botón "Servidor")
     y se guarda en localStorage. Por defecto: http://localhost:8080
   - El token JWT se obtiene en POST /api/auth/login y se envía en la
     cabecera "Authorization: Bearer <token>" en POST, PUT y DELETE.
   ========================================================================= */

const DEFAULT_API_URL = "http://localhost:8080";
const STORAGE_KEYS = {
  apiUrl: "granja.apiUrl",
  token: "granja.token",
  user: "granja.user",
};

/* ---------- Almacenamiento seguro (localStorage puede fallar) ---------- */
function leerStorage(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarStorage(clave, valor) {
  try {
    if (valor === null || valor === undefined) {
      localStorage.removeItem(clave);
    } else {
      localStorage.setItem(clave, valor);
    }
  } catch {
    /* Sin almacenamiento: la sesión solo dura mientras la pestaña esté abierta */
  }
}

/* ---------- Configuración del servidor ---------- */
const config = {
  get apiUrl() {
    return (leerStorage(STORAGE_KEYS.apiUrl) || DEFAULT_API_URL).replace(/\/+$/, "");
  },
  set apiUrl(url) {
    const limpia = (url || "").trim().replace(/\/+$/, "");
    guardarStorage(STORAGE_KEYS.apiUrl, limpia && limpia !== DEFAULT_API_URL ? limpia : null);
  },
};

/* ---------- Sesión (JWT) ---------- */
let tokenEnMemoria = leerStorage(STORAGE_KEYS.token);
let usuarioEnMemoria = leerStorage(STORAGE_KEYS.user);

function decodificarPayloadJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const relleno = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(relleno));
  } catch {
    return null;
  }
}

const sesion = {
  get token() {
    return tokenEnMemoria;
  },
  get usuario() {
    return usuarioEnMemoria;
  },
  /** Momento (ms) en que vence el token, o null si no se puede leer. */
  get expiraEn() {
    const payload = tokenEnMemoria ? decodificarPayloadJwt(tokenEnMemoria) : null;
    return payload && payload.exp ? payload.exp * 1000 : null;
  },
  get activa() {
    if (!tokenEnMemoria) return false;
    const expira = this.expiraEn;
    return expira === null || expira > Date.now();
  },
  guardar(token, usuario) {
    tokenEnMemoria = token;
    usuarioEnMemoria = usuario;
    guardarStorage(STORAGE_KEYS.token, token);
    guardarStorage(STORAGE_KEYS.user, usuario);
  },
  cerrar() {
    tokenEnMemoria = null;
    usuarioEnMemoria = null;
    guardarStorage(STORAGE_KEYS.token, null);
    guardarStorage(STORAGE_KEYS.user, null);
  },
};

/* ---------- Errores ---------- */
class ApiError extends Error {
  constructor(mensaje, status, detalle) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status; // 0 = sin conexión
    this.detalle = detalle || "";
  }
}

/** Extrae el mensaje que manda Spring Boot ({ message, error, ... }) o el texto plano. */
async function leerMensajeError(response) {
  const texto = await response.text().catch(() => "");
  if (!texto) return "";
  try {
    const json = JSON.parse(texto);
    if (json.message && json.message !== "No message available") return json.message;
    if (Array.isArray(json.errors) && json.errors.length) {
      return json.errors.map((e) => e.defaultMessage || e.message).filter(Boolean).join(". ");
    }
    return json.error || "";
  } catch {
    return texto.length < 200 ? texto : "";
  }
}

/* ---------- Petición base ---------- */
async function request(endpoint, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  // Content-Type solo cuando hay cuerpo: así un GET no provoca preflight CORS
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && sesion.token) headers.Authorization = `Bearer ${sesion.token}`;

  let response;
  try {
    response = await fetch(`${config.apiUrl}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(
      `No hay conexión con el servidor (${config.apiUrl}). Verifica que Spring Boot esté corriendo.`,
      0,
      error.message
    );
  }

  if (!response.ok) {
    const detalle = await leerMensajeError(response);
    throw new ApiError(detalle || `Error HTTP ${response.status}`, response.status, detalle);
  }

  if (response.status === 204) return null;
  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
}

/* ---------- Fábrica de CRUD: listar, obtener, crear, actualizar, eliminar ---------- */
function crearCrudApi(ruta) {
  return {
    listar: () => request(ruta),
    obtener: (id) => request(`${ruta}/${id}`),
    crear: (data) => request(ruta, { method: "POST", body: data, auth: true }),
    actualizar: (id, data) => request(`${ruta}/${id}`, { method: "PUT", body: data, auth: true }),
    eliminar: (id) => request(`${ruta}/${id}`, { method: "DELETE", auth: true }),
  };
}

/* ---------- Endpoints del backend ---------- */
const authApi = {
  login: (username, password) =>
    request("/api/auth/login", { method: "POST", body: { username, password } }),
};

const especiesApi = crearCrudApi("/api/especies");
const animalesApi = crearCrudApi("/animales"); // el backend expone Animal en /animales
const corralesApi = crearCrudApi("/api/corrales");
const alimentosApi = crearCrudApi("/api/alimentos");
const nutrientesApi = crearCrudApi("/api/nutrientes");
