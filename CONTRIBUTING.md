# Contributing to Feature Flag System

First off, thank you for considering contributing! 🎉 It's people like you that make this project better.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Convention](#commit-convention)
- [Release Process](#release-process)

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB (local or Atlas)
- Redis (optional - falls back to memory cache)
- Git

### Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/feature-flag-system.git
cd feature-flag-system

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/feature-flag-system.git

# Install dependencies
npm install
```

## 🤝 How to Contribute

### Reporting Bugs

**Before creating a bug report:**

- Check if the issue already exists
- Update to the latest version
- Try to reproduce with minimal code

**When creating a bug report:**

- Use the bug report template
- Include detailed steps to reproduce
- Include expected vs actual behavior
- Add screenshots if relevant
- Include environment details (OS, Node version, browser)

### Suggesting Features

**Before suggesting a feature:**

- Check if it's already implemented
- Check existing issues/discussions
- Consider if it fits the project scope

**When suggesting a feature:**

- Use the feature request template
- Explain the problem it solves
- Describe the proposed solution
- Consider edge cases

### Pull Requests

**Step 1: Create a branch**

```bash
# For features
git checkout -b feat/your-feature-name

# For bug fixes
git checkout -b fix/your-bug-fix

# For documentation
git checkout -b docs/your-docs-update
```

**Step 2: Make your changes**

```bash
# Follow coding standards
npm run lint
npm run format

# Run tests
npm test

# Build
npm run build

**Step 3: Commit your changes**
```

```bash
# Follow commit convention
git add .
git commit -m "feat: add awesome feature"

# Push to your fork
git push origin feat/your-feature-name
```

**Step 4: Open a Pull Request**

- Go to the repository on GitHub
- Click "New Pull Request"
- Select your branch
- Fill out the PR template
- Request review

## 💻 Development Setup

### Install Everything

```bash
# Install all dependencies (monorepo)
npm install

# Set up environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env.local

# Start development database (Docker)
npm run docker:up

# Start all services
npm run dev

# Backend runs on: http://localhost:3001
# Frontend runs on: http://localhost:3000
```

### Run Individual Services


```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Build all packages
npm run build
```

### Useful Commands

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run all tests
npm test

# Run backend tests with coverage
cd packages/backend && npm run test:coverage
```

## 📁 Project Structure

```text
feature-flag-system/
├── packages/
│   ├── backend/          # Express API
│   │   ├── src/
│   │   │   ├── config/       # Configuration
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── middleware/   # Auth, validation
│   │   │   ├── models/       # MongoDB schemas
│   │   │   ├── repositories/ # Database layer
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   └── utils/        # Helpers, logger
│   │   └── __tests__/        # Tests
│   │
│   ├── frontend/         # Next.js dashboard
│   │   ├── app/             # Pages
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # API client, utils
│   │   └── types/           # TypeScript types
│   │
│   ├── sdk/              # npm package
│   │   └── src/
│   │       ├── client/      # Core client
│   │       ├── react/       # React integration
│   │       └── types/       # Type definitions
│   │
│   └── shared/           # Shared types
│
├── docker/               # Docker config
├── scripts/              # Utility scripts
└── .github/              # GitHub workflows
```

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript (strict: true)
- Define interfaces for all data structures
- Avoid any - use unknown or proper types
- Use const and let (never var)

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | feature-flag.ts |
| Classes | PascalCase | FeatureFlagClient |
| Functions | camelCase | isEnabled() |
| Constants | UPPER_SNAKE_CASE | DEFAULT_TTL |
| Interfaces | PascalCase (no I prefix) | FeatureFlag |
| Types | PascalCase | EvaluationContext |

### Code Style

```typescript
// ✅ Good
export async function isEnabled(flagKey: string): Promise<boolean> {
  try {
    const result = await checkFlag(flagKey);
    return result.enabled;
  } catch (error) {
    logger.error('Failed to check flag', { flagKey, error });
    return false;
  }
}

// ❌ Bad
export const isEnabled = async (flagKey) => {
  try {
    const r = await checkFlag(flagKey);
    return r.enabled;
  } catch (e) {
    console.log(e);
    return false;
  }
};
```

### Error Handling

Always use the custom AppError class:

```typescript
import { AppError } from '../utils/errors.js';

if (!flag) {
  throw new AppError(`Flag ${key} not found`, 404);
}
```

### Logging

Use the logger, not console.log:

```typescript
import { logger } from '../utils/logger.js';

logger.info('Flag created', { flagKey: key });
logger.error('Database error', { error });
logger.debug('Cache hit', { flagKey });
```

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Backend tests only
cd packages/backend && npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Write Tests

```typescript
describe('FeatureFlagService', () => {
  it('should return true for enabled flag', async () => {
    const result = await service.isEnabled('test_flag', { userId: '123' });
    expect(result.enabled).toBe(true);
  });
});
```

## 📝 Commit Convention

We use Conventional Commits:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Code style (formatting) |
| refactor | Code change that neither fixes bug nor adds feature |
| perf | Performance improvement |
| test | Adding/updating tests |
| chore | Maintenance tasks |
| ci | CI/CD changes |

### Examples

```bash
feat(backend): add optimistic locking for flags

fix(frontend): resolve version conflict error handling

docs(sdk): update API documentation

test(backend): add integration tests for admin routes

chore(deps): upgrade mongoose to v8

ci: add GitHub Actions workflow
```

## ❓ Questions?

- Open an issue for bugs/features
- Join our Discord for discussions
- Email: maintainers@yourdomain.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🙏