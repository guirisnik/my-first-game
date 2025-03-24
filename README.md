# My First Game

A top-down pixel art game built with Phaser 3 and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. In a separate terminal, start the TypeScript compiler in watch mode:
```bash
npm run watch
```

4. Open your browser and navigate to `http://localhost:8000`

## Project Structure

- `src/` - Contains TypeScript source files
- `dist/` - Contains compiled JavaScript files
- `assets/` - Place your game assets (images, sounds, etc.) here

## Development

- The game code is written in TypeScript and located in `src/game.ts`
- The TypeScript compiler will automatically compile your code when you make changes
- Add your game assets to the `assets/` directory
- Modify the `preload()`, `create()`, and `update()` methods in `src/game.ts` to build your game 