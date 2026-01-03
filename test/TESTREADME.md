# Testing Guide

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

Runs isolated unit tests for services, guards, and utilities.

### E2E Tests
```bash
npm run test:e2e
```

Runs full end-to-end integration tests.

### Test Coverage
```bash
npm run test:cov
```

Generates coverage report in `coverage/` directory.

### Watch Mode
```bash
npm run test:watch
```

Runs tests in watch mode for development.

## Test Structure

```
test/
├── auth.e2e-spec.ts       # Authentication flow tests
├── journal.e2e-spec.ts    # Journal operations tests
├── posts.e2e-spec.ts      # Post management tests
├── user.e2e-spec.ts       # User settings tests
├── test-db.setup.ts       # Database setup utilities
└── factories/
    └── user.factory.ts    # Test data factories

src/
└── modules/
    ├── auth/
    │   └── auth.service.spec.ts
    ├── tone/
    │   └── tone.service.spec.ts
    └── journal/
        └── journal.scorer.spec.ts
```

## Writing Tests

### Unit Tests
- Test single units in isolation
- Mock all dependencies
- Focus on business logic

### E2E Tests
- Test complete user flows
- Use real database (test environment)
- Verify HTTP responses
- Test authentication/authorization

## Test Database

The test suite uses a separate test database. Make sure to set:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/xposter_test"
```

Tests automatically clean the database before running.

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Pre-deployment checks

Minimum coverage requirement: 80%