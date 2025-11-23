# Trazo ✏️

Trazo is a creative **text-to-visuals** application that transforms your written ideas into beautiful, hand-drawn diagrams and infographics instantly. It combines a distraction-free writing environment with powerful visual generation agents to help you communicate complex concepts with ease.

![Trazo Screenshot](https://via.placeholder.com/800x450.png?text=Trazo+Application+Preview)

## ✨ Key Features

*   **📝 Integrated Document Editor:** A clean, split-view interface allowing you to write naturally while managing visuals alongside your text.
*   **🤖 AI-Powered Generation:** Simulated AI agents analyze your text semantics to suggest and generate the perfect diagram structure (Flowcharts, Cycles, Hierarchies, and more).
*   **🎨 Hand-Drawn Aesthetic:** Utilizes `RoughJS` and sketchy fonts to give every diagram a unique, human-made feel.
*   **💡 Smart Suggestions:** A dedicated sidebar offers real-time recommendations for visual styles based on your content context.
*   **⚡ Interactive Canvas:** Drag-and-drop nodes, zoom, pan, and edit your diagrams directly.
*   **💾 Auto-Save & Export:** Your work is automatically saved locally. Export your creations as high-quality PNGs or SVGs.

## 🛠️ Tech Stack

*   **Core:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + `Framer Motion` (Animations)
*   **Visuals:**
    *   [RoughJS](https://roughjs.com/): For the hand-drawn sketch style.
    *   [Dagre](https://github.com/dagrejs/dagre): For automatic graph layout and positioning.
    *   [Html-to-image](https://github.com/bubkoo/html-to-image): For exporting visuals.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/trazo.git
    cd trazo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in browser:**
    Visit `http://localhost:5173` to start creating!

## 🎮 How to Use

1.  **Write:** Type your notes, story, or ideas in the left-hand editor.
2.  **Select:** Highlight a specific paragraph or sentence you want to visualize.
3.  **Generate:** Click the **⚡ Bolt** icon or open the **Visuals** sidebar to choose a style.
4.  **Refine:** Drag nodes to adjust the layout or use the toolbar to switch diagram types (Cycle, Process, Tree, etc.).
5.  **Export:** Click "Exportar" to save your visual masterpiece.

## 📄 License

MIT
