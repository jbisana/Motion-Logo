# Animated Logo Creator

An AI-driven design laboratory that bridges static iconography with procedural motion. This application allows users to generate logos using Gemini AI Models and apply various animation patterns to preview and export them.

![App Screenshot 1](./Screenshot1.png)
![App Screenshot 2](./Screenshot2.png)

## Features

- **AI Logo Synthesis**: Generate unique logos from textual descriptions using Google Gemini models.
- **Dynamic Animations**: Apply and customize motion patterns like Float, Breathe, Spin, and Flip.
- **Granular Control**: Fine-tune animation duration and easing functions (Ease-In-Out, Linear, etc.).
- **Multi-Format Export**: Download your creations in PNG, JPG, or SVG formats with choice of quality.
- **Workspace Tools**: Undo/Redo history, Dark/Light mode, and a workspace reset feature.
- **Responsive Design**: Polished interface that works on mobile and desktop.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Gemini API Key (obtain from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd animated-logo-creator
   ```

2. Run the automated setup script:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```env
GEMINI_API_KEY=your_api_key_here
```

## Technologies Used

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: Motion (motion/react)
- **Icons**: Lucide React
- **AI**: Google Gemini API (@google/genai)
- **Build Tool**: Vite

## Disclaimer

Generated assets are created via large-scale generative models. Quality and visual accuracy depend strictly on the complexity and clarity of user-provided descriptions.

---

*Generated using Gemini AI Studio*
*Jeremy Bisana 2026*
