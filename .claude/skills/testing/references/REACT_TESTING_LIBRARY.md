# React Testing Library Patterns

> **Philosophy**: Test components the way users interact with them
> **Official Docs**: https://testing-library.com/react

## Setup for AppDistillery

### Installation

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Setup File

```typescript
// test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

## Core Principles

1. **Test behavior, not implementation**
2. **Query by accessibility attributes**
3. **Interact like a user would**
4. **Assert on visible output**

## Query Priority

Use queries in this order:

```typescript
// 1. ✅ Accessible to everyone
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/search/i);
screen.getByText(/welcome/i);

// 2. ✅ Semantic queries
screen.getByAltText(/profile picture/i);
screen.getByTitle(/close/i);

// 3. ⚠️ Test IDs (last resort)
screen.getByTestId('user-menu');

// 4. ❌ Avoid (implementation details)
container.querySelector('.button-class');
```

## Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@appdistillery/ui';

test('button displays text and handles click', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<Button onClick={handleClick}>Click me</Button>);

  const button = screen.getByRole('button', { name: /click me/i });
  expect(button).toBeInTheDocument();

  await user.click(button);
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Form Testing

```typescript
test('form submission with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<LeadForm onSubmit={onSubmit} />);

  // Fill out form
  await user.type(screen.getByLabelText(/name/i), 'John Doe');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.type(screen.getByLabelText(/requirements/i), 'Build a website');

  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Assert
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com',
    requirements: 'Build a website',
  });
});
```

## Async Operations

```typescript
test('displays loading state then data', async () => {
  render(<LeadList />);

  // Loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data
  const leadName = await screen.findByText(/john doe/i);
  expect(leadName).toBeInTheDocument();

  // Loading indicator gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
});
```

## User Interactions

### userEvent vs fireEvent

```typescript
import userEvent from '@testing-library/user-event';

// ✅ PREFERRED: userEvent (more realistic)
test('realistic user interaction', async () => {
  const user = userEvent.setup();

  await user.type(input, 'Hello');   // Types one char at a time
  await user.click(button);           // Includes hover, focus, etc.
  await user.selectOptions(select, 'option1');
  await user.upload(fileInput, file);
});

// ⚠️ Less realistic (but sometimes necessary)
import { fireEvent } from '@testing-library/react';

test('direct event firing', () => {
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.click(button);
});
```

## Query Variants

```typescript
// getBy* - Throws error if not found (should exist)
const button = screen.getByRole('button');

// queryBy* - Returns null if not found (assert non-existence)
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

// findBy* - Returns promise, waits for element (async)
const message = await screen.findByText(/success/i);

// getAllBy* - Returns array, throws if none found
const items = screen.getAllByRole('listitem');

// queryAllBy* - Returns array, returns [] if none found
const errors = screen.queryAllByRole('alert');

// findAllBy* - Returns promise for array
const items = await screen.findAllByRole('listitem');
```

## Testing Conditional Rendering

```typescript
test('shows error message on invalid input', async () => {
  const user = userEvent.setup();
  render(<LeadForm />);

  // No error initially
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  // Enter invalid data and submit
  await user.type(screen.getByLabelText(/email/i), 'invalid');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Error appears
  expect(screen.getByRole('alert')).toHaveTextContent(/invalid email/i);
});
```

## Testing with Context/Providers

```typescript
// test/utils.tsx
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';

// In tests
import { renderWithProviders, screen } from './test/utils';

test('component with providers', () => {
  renderWithProviders(<MyComponent />);
  // ...
});
```

## Mocking API Calls

```typescript
// Using MSW (Mock Service Worker) - Recommended
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/leads', (req, res, ctx) => {
    return res(ctx.json([{ id: '1', name: 'Lead 1' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches and displays leads', async () => {
  render(<LeadList />);
  expect(await screen.findByText('Lead 1')).toBeInTheDocument();
});
```

## Common Jest-DOM Assertions

```typescript
// Visibility
expect(element).toBeInTheDocument();
expect(element).toBeVisible();

// Content
expect(element).toHaveTextContent('Hello');

// Form elements
expect(input).toHaveValue('text');
expect(input).toBeDisabled();
expect(checkbox).toBeChecked();

// Attributes
expect(element).toHaveAttribute('href', '/home');
expect(element).toHaveClass('active');

// Accessibility
expect(element).toHaveAccessibleName('Submit form');
```

## Common Mistakes

### ❌ Testing Implementation Details

```typescript
// Bad
expect(component.state.isOpen).toBe(true);

// Good
expect(screen.getByRole('dialog')).toBeVisible();
```

### ❌ Using Wrong Query

```typescript
// Bad - brittle, not accessible
const button = container.querySelector('.submit-btn');

// Good
const button = screen.getByRole('button', { name: /submit/i });
```

### ❌ Not Waiting for Async

```typescript
// Bad - race condition
render(<AsyncComponent />);
expect(screen.getByText('Loaded')).toBeInTheDocument();

// Good
render(<AsyncComponent />);
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

## Debugging

```typescript
// Print DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));

// Get suggested queries
screen.logTestingPlaygroundURL();
```

## Related

- [SKILL.md](../SKILL.md) - Main testing patterns
- [VITEST.md](VITEST.md) - Test runner configuration
- [TDD_WORKFLOWS.md](TDD_WORKFLOWS.md) - TDD with components
