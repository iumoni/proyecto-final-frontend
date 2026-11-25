const API_BASE_URL = "http://localhost:8080";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const alimentosApi = {
  listar: () => request("/api/alimentos"),
  crear: (data) =>
    request("/api/alimentos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  actualizar: (id, data) =>
    request(`/api/alimentos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  eliminar: (id) =>
    request(`/api/alimentos/${id}`, {
      method: "DELETE",
    }),
};