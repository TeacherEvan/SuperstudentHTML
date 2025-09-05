# Testing Guide

This document describes the testing setup and guidelines for the SuperstudentHTML project.

## Test Structure

Tests are organized in the `tests/` directory with the following structure:

```
tests/
├── unit/              # Unit tests for individual components
├── integration/       # Integration tests for multiple components
├── e2e/              # End-to-end tests (placeholder)
├── performance/      # Performance tests (placeholder)
└── setup.js          # Test environment setup
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e
```

## Test Coverage

The test suite covers:

### Unit Tests
- **Configuration (`config.test.js`)**: Tests game configuration constants and validation
- **Event Tracker (`eventTracker.test.js`)**: Tests event logging, performance tracking, and log management
- **Resource Manager (`resourceManager.test.js`)**: Tests URL validation, file extension validation, and font loading

### Integration Tests
- **Game Integration (`gameIntegration.test.js`)**: Tests interaction between multiple components

## Writing Tests

### Best Practices

1. **Use descriptive test names**: Tests should clearly describe what they're testing
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Mock external dependencies**: Use Jest mocks for browser APIs and external resources
4. **Test edge cases**: Include tests for error conditions and boundary values
5. **Keep tests focused**: Each test should verify one specific behavior

### Test Utilities

The test environment provides several mocked APIs:

- **Canvas API**: Mocked for graphics-related tests
- **Audio API**: Mocked for sound-related tests
- **Web Audio API**: Mocked for advanced audio features
- **localStorage**: Mocked for storage tests
- **window.location**: Mocked for URL-related tests

### Example Test

```javascript
import { MyComponent } from '../../src/js/components/myComponent.js';

describe('MyComponent', () => {
  let component;

  beforeEach(() => {
    component = new MyComponent();
  });

  test('should initialize with default values', () => {
    expect(component.value).toBe(0);
    expect(component.isActive).toBe(false);
  });

  test('should update value when method is called', () => {
    component.setValue(42);
    expect(component.value).toBe(42);
  });
});
```

## Configuration

### Jest Configuration (`jest.config.cjs`)
- Uses JSDOM environment for browser API simulation
- Babel transformation for ES6+ modules
- Test file patterns and ignore patterns
- Coverage collection settings

### Babel Configuration (`babel.config.cjs`)
- ES6+ to CommonJS transformation for Node.js compatibility
- Optimized for current Node.js version

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Release builds

## Troubleshooting

### Common Issues

1. **ES Module Import Errors**: Ensure files use `.js` extensions in imports
2. **DOM API Errors**: Check that browser APIs are properly mocked in `setup.js`
3. **Async Test Failures**: Use `async/await` or return promises from tests

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/config.test.js

# Run tests with coverage
npm test -- --coverage
```

## Future Enhancements

- Add Playwright for E2E testing
- Implement visual regression testing
- Add performance benchmarking
- Create test utilities for game-specific components