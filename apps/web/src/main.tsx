import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

function App() {
  return (
    <main className="shell">
      <section className="panel" aria-labelledby="title">
        <p className="eyebrow">SOLIS IAOS · Sprint 0B</p>
        <h1 id="title">Validación local</h1>
        <p className="summary">
          La base técnica está preparada para desarrollo con datos sintéticos. Las funciones
          industriales, el acceso OT y el control remoto no forman parte de este incremento.
        </p>
        <dl className="status-grid">
          <div>
            <dt>Arquitectura</dt>
            <dd>Monolito modular</dd>
          </div>
          <div>
            <dt>Modo</dt>
            <dd>Read-mostly</dd>
          </div>
          <div>
            <dt>Entorno</dt>
            <dd>Local-first</dd>
          </div>
        </dl>
        <p className="notice" role="status">
          Sin conexión a planta · Sin comandos remotos
        </p>
      </section>
    </main>
  );
}

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element is missing");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
