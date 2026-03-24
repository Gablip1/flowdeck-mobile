<div align="center">
  <h1>🚀 n8n Mobile Manager</h1>
  <p><strong>El Gestor Nativo y Avanzado para Instancias de n8n.</strong></p>

  <!-- Badges -->
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React Native"></a>
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white" alt="Expo"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://n8n.io/"><img src="https://img.shields.io/badge/n8n-FF6C37?style=flat&logo=n8n&logoColor=white" alt="n8n Compatible"></a>
</div>

<br />

---

## 📸 Interfaz Premium (Bento Box & Native Canvas)

| Dashboard Analítico (Salud y Fallos) | Canvas Interactivo SVG (Drill-Down) |
| :---: | :---: |
| `[Insertar Captura Dashboard]` | `[Insertar Captura Canvas SVG]` |
| **Monitoreo en Tiempo Real a 60fps** | **Inspectores de Nodo y Zoom Vectorial** |

---

## 💡 La Motivación (Why?)
Las interfaces web pueden quedarse cortas cuando gestionas infraestructura crítica desde tu móvil. **n8n Mobile Manager** nace para llenar el vacío de una aplicación verdaderamente nativa, fluida y segura diseñada específicamente para Administradores de Sistemas y DevOps. Nuestro objetivo: permitirte diagnosticar un fallo de webhook, analizar ejecuciones en bruto y reiniciar flujos directamente desde tu bolsillo, con la misma latencia y feedback táctil de una app top-tier de iOS/Android.

## ✨ Características Clave (Killer Features)
- **🎨 Dashboards Bento Box**: Análisis radiográficos de la salud del sistema. Listado de Top Workflows, Gráficos de Éxito/Error, y alertas de latencia.
- **🗺️ Canvas SVG Híbrido Totalmente Interactivo**: Motor renderizado superpuesto. Reconstrucción gráfica fiel a la web oficial con *Pinch-to-Zoom* de precisión matemática, nodos arrastrables y Sombras/Glow nativas basadas en estados (rojo crítico, verde ejecución).
- **🔒 Bóveda Multi-Instancia**: Accede a todos tus servidores N8N usando encriptación biométrica nativa de iOS y Android a través de `Expo SecureStore`. Sin envío de credenciales a terceros.
- **⚡ Diagnóstico Auto-Pilot**: Si un flujo falla anocheciendo, un toque en el Dashboard saltará el enrutador directamente al *WorkflowDetail*, descargará los logs y desplegará un *Bottom Sheet* indicándote el nodo y el Stack Trace exacto de la falla.

## 🛠️ Stack Tecnológico
**Core Framework:**
- React Native + Expo (Managed Workflow)
- TypeScript (Strict Mode)

**UX & Estado:**
- `zustand`: Arquitectura de estados globales sin re-renders fantasma.
- `react-native-reanimated` & `react-native-gesture-handler`: Worklets para matemáticas vectoriales a 60 FPS en el hilo UI secundario.
- `@gorhom/bottom-sheet`: Paneles modulares de inspección infernalmente fluidos.
- `react-native-gifted-charts`: Visualizaciones de alta densidad de datos.

**Red & Seguridad:**
- `axios` interceptors
- `expo-secure-store`

## 📁 Estructura del Proyecto
```ascii
n8n-mobile-manager/
├── src/
│   ├── api/          # Interfaz REST de n8n y Autenticación
│   ├── components/   # UI Reutilizable, WorkflowCanvas.tsx y Bento Cards
│   ├── navigation/   # Stack/Tab Navigators (React Navigation 6)
│   ├── screens/      # DashboardAnalytics, WorkflowList, Settings
│   └── store/        # Zustand State (Store Múltiples Instancias)
├── assets/           # Tipografías e Íconos
├── App.tsx           # Entry Point Global
├── app.json          # Configuración de Módulos Expo
└── eas.json          # Pipelines de Build de Producción (EAS)
```

## 🚀 Instalación y Despliegue (Getting Started)

### Requisitos Previos:
- Node.js >= 18.x
- Expo CLI (`npm install -g eas-cli`)
- Una cuenta activa en Expo Application Services.
- Una instancia viva operativa de N8N.

### Repositorio y Entorno:
```bash
# 1. Clona este proyecto
git clone https://github.com/tu-usuario/n8n-mobile-manager.git

# 2. Entra en el directorio
cd n8n-mobile-manager

# 3. Instala dependencias con legado de resoluciones (si usas Reanimated/Gorhom)
npm install --legacy-peer-deps

# 4. Compila y lanza la emulacion web/nativa
npx expo start -c
```

---

## 💖 Apoya el Proyecto
Si esta herramienta te ayuda a gestionar tus arquitecturas de n8n, a salvar caídas de servidores en mitad de la noche, o te ha ahorrado horas de depuración, puedes demostrar tu apoyo invitándome a un café:

[![PayPal](https://img.shields.io/badge/Donar_con-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/GabrielMartinAsensio)

---
> **Disclaimer Legal:**  
> Este es un proyecto *Open Source* creado por la comunidad con fines administrativos y no mantiene ninguna afiliación ni relación oficial o comercial con **n8n** o **Faircode GmbH**. Logotipos y marcas registradas son propiedad de sus respectivos dueños. Use esta API app bajo su propio riesgo de servidor.
