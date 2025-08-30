# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Requirements
- Think hard and provide concise output
- Focus on exceptional UI/UX design
- Mobile-first responsive design

## Development Commands

### Development Server
- `npm start` or `ng serve` - Start development server at http://localhost:4200
- `ng build --watch --configuration development` - Build in watch mode for development

### Build
- `npm run build` or `ng build` - Build for production (outputs to `dist/`)
- `ng build --configuration development` - Build for development

### Testing
- `npm test` or `ng test` - Run unit tests with Karma
- No e2e testing framework is currently configured

### Code Generation
- `ng generate component component-name` - Generate new component
- `ng generate --help` - See all available schematics

## Architecture Overview

This is an Angular 20.2 application for daily expense management using modern Angular features:

### Key Technologies
- **Angular 20.2** with zoneless change detection (`provideZonelessChangeDetection()`)
- **Standalone components** (no NgModules) with explicit imports
- **Angular Signals** for reactive state management (`signal()`, `computed()`, `input()`, `output()`)
- **Angular Material** for UI components
- **Tailwind CSS** for utility-first styling
- **SCSS** for component styles
- **TypeScript 5.9**

### Project Structure
- `src/app/` - Main application code
  - `app.ts` - Root component using signals
  - `app.config.ts` - Application configuration with zoneless change detection
  - `app.routes.ts` - Router configuration (currently empty, ready for features)
- `public/` - Static assets
- Component prefix: `app-`
- Style language: SCSS

### Code Style Guidelines
Refer to `.claude/angular.md` for comprehensive Angular best practices. Key points:
- Use signal-based APIs (`input()`, `output()`, `model()`) over decorators
- Prefer `inject()` function over constructor injection
- Use `protected` for template-only class members
- Use `readonly` for Angular-initialized properties
- Event handlers named for what they do, not the triggering event
- Control flow with `@if`, `@for`, `@switch` blocks
- One component per file, organize by feature areas

### Current State
- Fresh Angular project with basic setup
- No routes or features implemented yet
- Ready for expense management functionality development