# TaskFlow

TaskFlow is a Persian, right-to-left task management dashboard for creating, tracking, editing, filtering, and deleting daily tasks. Tasks are stored in the browser using `localStorage`.

## Features

- Create tasks with a title and optional description
- Edit and delete tasks
- Change task status and filter the list
- Persist tasks between browser sessions
- Validate input and report storage errors
- Responsive, right-to-left Persian interface

## Requirements

- Node.js
- npm

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Vite will print a local URL in the terminal. Open it in your browser to use the app.

## Quality Checks

Run the automated tests, lint the code, and create a production build:

```bash
npm run test
npm run lint
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Tech Stack

- React
- TypeScript
- Vite
- Vitest and Testing Library

The npm package and project folder use the kebab-case name `task-flow`; the product is displayed as `TaskFlow`.
