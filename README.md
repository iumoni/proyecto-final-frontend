# proyecto-final-frontend

Interfaz web del proyecto final de **Implementación de Sistemas**: sistema de
gestión de una granja (animales, especies, corrales, alimentos y nutrientes).

- **Página publicada:** <https://iumoni.github.io/proyecto-final-frontend/>
- **API (backend Spring Boot):**
  [Brand09823/Proyecto-Final-Sistemas](https://github.com/Brand09823/Proyecto-Final-Sistemas)

## Integrantes del equipo

- Cruz Fuentes Vianidxi Ximena
- Ojeda Guevara Brandon Adiel
- Sanchez Rodríguez Monica

## Funcionalidades

- **CRUD completo** (listar, buscar, registrar, editar y eliminar) de las 5
  entidades: Animales, Especies, Corrales, Alimentos y Nutrientes.
- **Relación N:M Alimento ↔ Nutriente:** al registrar o editar un alimento se
  marcan los nutrientes que aporta (`nutrientesIds`).
- **Relación Animal → Especie:** cada animal se registra con su especie
  (`especieId`).
- **Autenticación JWT:** consultar es libre; para registrar, editar o eliminar
  se inicia sesión (`POST /api/auth/login`) y el token se envía como
  `Authorization: Bearer <token>`. Si la sesión expira, la página pide entrar
  de nuevo y reintenta la acción.
- **Mensajes claros** cuando el backend rechaza algo (por ejemplo, eliminar una
  especie con animales asociados o un nombre duplicado).
- **Servidor configurable:** por defecto usa `http://localhost:8080`; se puede
  cambiar desde el indicador de conexión (útil con Codespaces).
- Diseño adaptable a computadora y celular.

## Cómo usarla

1. Ejecuta el backend: `mvn spring-boot:run` (queda en `http://localhost:8080`).
2. Abre <https://iumoni.github.io/proyecto-final-frontend/> en la misma
   computadora. Si Chrome pregunta si el sitio puede acceder a la red local,
   elige **Permitir**.
3. Abajo a la izquierda debe aparecer **Conectado**.
4. Pulsa **Iniciar sesión** (usuario de desarrollo: `admin` / `admin123`).

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la página: barra lateral, las 5 secciones (formulario + tabla) y los diálogos de inicio de sesión y servidor |
| `css/styles.css` | Estilos y diseño responsivo |
| `js/api.js` | Cliente HTTP: URL del servidor, sesión JWT y un CRUD por entidad (`especiesApi`, `animalesApi`, `corralesApi`, `alimentosApi`, `nutrientesApi`) |
| `js/app.js` | Lógica de la página: estado, tablas, formularios, búsqueda, inicio de sesión y manejo de errores |

## Endpoints que consume

| Entidad | Ruta |
|---|---|
| Autenticación | `POST /api/auth/login` |
| Animales | `/animales` |
| Especies | `/api/especies` |
| Corrales | `/api/corrales` |
| Alimentos | `/api/alimentos` |
| Nutrientes | `/api/nutrientes` |

`GET` es público; `POST`, `PUT` y `DELETE` requieren el token JWT.
