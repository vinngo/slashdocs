export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export interface Section {
  id: number;
  title: string;
  content: string;
}

export interface DocsData {
  sections: Section[];
  file_tree: FileNode[];
  metadata: {
    repo_name: string;
    repo_url: string;
    language: string;
    framework?: string;
    file_count: number;
    line_count: number;
    indexed_at: string;
  };
}

export const fakeDocsData: DocsData = {
  sections: [
    {
      id: 1,
      title: "Overview",
      content: `# Project Overview

This is a modern web application built with Next.js and TypeScript, designed to provide a seamless user experience with server-side rendering and static site generation capabilities.

## Key Features

- **Fast Performance**: Optimized builds with automatic code splitting
- **Type Safety**: Full TypeScript support throughout the application
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **SEO Friendly**: Server-side rendering for optimal search engine visibility

## Technology Stack

- Next.js 14+
- React 18
- TypeScript 5
- Tailwind CSS
- Shadcn/ui components`,
    },
    {
      id: 2,
      title: "Getting Started",
      content: `# Getting Started

Follow these steps to get the project up and running on your local machine.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Git

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/user/repo.git

# Navigate to project directory
cd repo

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Development Server

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The page auto-updates as you edit files in the \`src\` directory.`,
    },
    {
      id: 3,
      title: "Project Structure",
      content: `# Project Structure

\`\`\`
repo/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── landing/     # Landing page components
│   ├── lib/             # Utility functions and helpers
│   └── styles/          # Global styles
├── public/              # Static assets
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.ts   # Tailwind CSS configuration
\`\`\`

## Directory Descriptions

- **src/app**: Contains the Next.js app router pages and layouts
- **src/components**: Reusable React components organized by feature
- **src/lib**: Utility functions, helpers, and shared logic
- **public**: Static files like images, fonts, and icons`,
    },
    {
      id: 4,
      title: "Core Concepts",
      content: `# Core Concepts

## Component Architecture

This project follows a modular component architecture where each component has a single responsibility.

### Component Types

1. **Page Components**: Top-level components that represent routes
2. **Layout Components**: Shared layouts and wrappers
3. **UI Components**: Reusable interface elements
4. **Feature Components**: Business logic components

## State Management

State is managed using React hooks and context where needed:

\`\`\`typescript
const [state, setState] = useState(initialState);
\`\`\`

## Data Fetching

Server components fetch data at build time or request time:

\`\`\`typescript
async function getData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}
\`\`\``,
    },
    {
      id: 5,
      title: "Architecture",
      content: `# Architecture

## High-Level Architecture

The application follows a modern jamstack architecture with the following layers:

### Presentation Layer
- React components for UI rendering
- Tailwind CSS for styling
- Client-side interactivity with React hooks

### Application Layer
- Next.js app router for routing
- API routes for backend logic
- Server components for data fetching

### Data Layer
- External API integration
- Static data generation at build time
- Runtime data fetching for dynamic content

## Design Patterns

- **Component Composition**: Building complex UIs from simple components
- **Server-First**: Leveraging server components for better performance
- **Progressive Enhancement**: Core functionality works without JavaScript`,
    },
    {
      id: 6,
      title: "API Reference",
      content: `# API Reference

## Components

### Hero Component

Main landing page hero section with form input.

\`\`\`typescript
import Hero from '@/components/landing/Hero';

<Hero />
\`\`\`

**Props**: None

### Input Component

Reusable text input field.

\`\`\`typescript
import { Input } from '@/components/ui/input';

<Input
  placeholder="Enter text"
  value={value}
  onChange={handleChange}
/>
\`\`\`

**Props**:
- \`placeholder\`: string - Placeholder text
- \`value\`: string - Controlled input value
- \`onChange\`: function - Change handler

### Button Component

Clickable button element.

\`\`\`typescript
import { Button } from '@/components/ui/button';

<Button onClick={handleClick}>
  Click me
</Button>
\`\`\`

**Props**:
- \`onClick\`: function - Click handler
- \`children\`: ReactNode - Button content`,
    },
    {
      id: 7,
      title: "Configuration",
      content: `# Configuration

## Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
API_SECRET_KEY=your_secret_key

# App Configuration
NEXT_PUBLIC_APP_NAME=SlashDocs
\`\`\`

## Tailwind Configuration

Customize Tailwind in \`tailwind.config.ts\`:

\`\`\`typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      },
    },
  },
};
\`\`\`

## TypeScript Configuration

The \`tsconfig.json\` includes:

- Strict type checking
- Path aliases (@/ for src/)
- ES2022 target
- Module resolution for Next.js`,
    },
    {
      id: 8,
      title: "Development",
      content: `# Development Guide

## Code Style

This project follows standardized coding practices:

- Use TypeScript for all new files
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful component and variable names

## Component Development

When creating new components:

1. Create component file in appropriate directory
2. Export as default or named export
3. Add TypeScript interfaces for props
4. Include JSDoc comments for documentation

\`\`\`typescript
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  return <div>{title}</div>;
}
\`\`\`

## Best Practices

- Keep components small and focused
- Use server components by default
- Add "use client" only when needed
- Optimize images with next/image
- Implement error boundaries`,
    },
    {
      id: 9,
      title: "Testing",
      content: `# Testing

## Testing Strategy

This project uses modern testing tools to ensure code quality.

## Unit Testing

Test individual components and functions:

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import Hero from '@/components/landing/Hero';

test('renders hero heading', () => {
  render(<Hero />);
  const heading = screen.getByText(/Index any Github repo/i);
  expect(heading).toBeInTheDocument();
});
\`\`\`

## Integration Testing

Test component interactions and data flow.

## Running Tests

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
\`\`\``,
    },
    {
      id: 10,
      title: "Deployment",
      content: `# Deployment

## Deployment Options

### Vercel (Recommended)

The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
\`\`\`

### Docker

Build and run with Docker:

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
\`\`\`

\`\`\`bash
docker build -t my-app .
docker run -p 3000:3000 my-app
\`\`\`

## Production Checklist

- [ ] Set environment variables
- [ ] Configure custom domain
- [ ] Enable analytics
- [ ] Set up error monitoring
- [ ] Configure CDN
- [ ] Test in production mode locally`,
    },
  ],

  file_tree: [
    {
      name: "src",
      path: "src",
      type: "folder",
      children: [
        {
          name: "app",
          path: "src/app",
          type: "folder",
          children: [
            {
              name: "page.tsx",
              path: "src/app/page.tsx",
              type: "file",
            },
            {
              name: "layout.tsx",
              path: "src/app/layout.tsx",
              type: "file",
            },
            {
              name: "globals.css",
              path: "src/app/globals.css",
              type: "file",
            },
            {
              name: "docs",
              path: "src/app/docs",
              type: "folder",
              children: [
                {
                  name: "[id]",
                  path: "src/app/docs/[id]",
                  type: "folder",
                  children: [
                    {
                      name: "page.tsx",
                      path: "src/app/docs/[id]/page.tsx",
                      type: "file",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "components",
          path: "src/components",
          type: "folder",
          children: [
            {
              name: "ui",
              path: "src/components/ui",
              type: "folder",
              children: [
                {
                  name: "button.tsx",
                  path: "src/components/ui/button.tsx",
                  type: "file",
                },
                {
                  name: "input.tsx",
                  path: "src/components/ui/input.tsx",
                  type: "file",
                },
                {
                  name: "card.tsx",
                  path: "src/components/ui/card.tsx",
                  type: "file",
                },
              ],
            },
            {
              name: "landing",
              path: "src/components/landing",
              type: "folder",
              children: [
                {
                  name: "Hero.tsx",
                  path: "src/components/landing/Hero.tsx",
                  type: "file",
                },
              ],
            },
          ],
        },
        {
          name: "lib",
          path: "src/lib",
          type: "folder",
          children: [
            {
              name: "utils.ts",
              path: "src/lib/utils.ts",
              type: "file",
            },
            {
              name: "fake-data.ts",
              path: "src/lib/fake-data.ts",
              type: "file",
            },
          ],
        },
      ],
    },
    {
      name: "public",
      path: "public",
      type: "folder",
      children: [
        {
          name: "next.svg",
          path: "public/next.svg",
          type: "file",
        },
        {
          name: "vercel.svg",
          path: "public/vercel.svg",
          type: "file",
        },
      ],
    },
    {
      name: "package.json",
      path: "package.json",
      type: "file",
    },
    {
      name: "tsconfig.json",
      path: "tsconfig.json",
      type: "file",
    },
    {
      name: "tailwind.config.ts",
      path: "tailwind.config.ts",
      type: "file",
    },
    {
      name: "next.config.js",
      path: "next.config.js",
      type: "file",
    },
    {
      name: "README.md",
      path: "README.md",
      type: "file",
    },
  ],

  metadata: {
    repo_name: "slashdocs",
    repo_url: "https://github.com/user/slashdocs",
    language: "TypeScript",
    framework: "Next.js",
    file_count: 18,
    line_count: 1247,
    indexed_at: "2025-10-25T10:30:00Z",
  },
};
