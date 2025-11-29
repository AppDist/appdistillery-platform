# Component Patterns

Reusable component patterns and examples for common UI elements with Tailwind CSS v4.

## Buttons

### Primary Button

```jsx
<button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
  Primary Button
</button>
```

### Secondary Button

```jsx
<button className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-colors">
  Secondary Button
</button>
```

### Outline Button

```jsx
<button className="px-4 py-2 border-2 border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors">
  Outline Button
</button>
```

### Button Sizes

```jsx
{/* Small */}
<button className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
  Small
</button>

{/* Medium (default) */}
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Medium
</button>

{/* Large */}
<button className="px-6 py-3 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Large
</button>
```

### Button with Icon

```jsx
<button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Add Item
</button>
```

### Loading Button

```jsx
<button 
  disabled
  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg opacity-50 cursor-not-allowed"
>
  <svg className="animate-spin size-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
  Loading...
</button>
```

## Forms

### Text Input

```jsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Email
  </label>
  <input
    type="email"
    id="email"
    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    placeholder="you@example.com"
  />
</div>
```

### Textarea

```jsx
<div className="space-y-2">
  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Message
  </label>
  <textarea
    id="message"
    rows={4}
    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
    placeholder="Your message..."
  />
</div>
```

### Select Dropdown

```jsx
<div className="space-y-2">
  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Country
  </label>
  <select
    id="country"
    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
  >
    <option>United States</option>
    <option>Canada</option>
    <option>Mexico</option>
  </select>
</div>
```

### Checkbox

```jsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="terms"
    className="size-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
  />
  <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
    I agree to the terms and conditions
  </label>
</div>
```

### Radio Buttons

```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Choose an option
  </label>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <input
        type="radio"
        id="option1"
        name="options"
        className="size-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
      <label htmlFor="option1" className="text-sm text-gray-700 dark:text-gray-300">
        Option 1
      </label>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="radio"
        id="option2"
        name="options"
        className="size-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500"
      />
      <label htmlFor="option2" className="text-sm text-gray-700 dark:text-gray-300">
        Option 2
      </label>
    </div>
  </div>
</div>
```

## Cards

### Basic Card

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
    Card Title
  </h3>
  <p className="text-gray-600 dark:text-gray-300">
    Card content goes here
  </p>
</div>
```

### Card with Image

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  <img src="/image.jpg" alt="Card" className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      Card Title
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4">
      Card description
    </p>
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
      Learn More
    </button>
  </div>
</div>
```

### Card with Header and Footer

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  {/* Header */}
  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Card Header
    </h3>
  </div>
  
  {/* Content */}
  <div className="p-6">
    <p className="text-gray-600 dark:text-gray-300">
      Main content area
    </p>
  </div>
  
  {/* Footer */}
  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between">
    <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
      Cancel
    </button>
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
      Save
    </button>
  </div>
</div>
```

## Navigation

### Navbar

```jsx
<nav className="bg-white dark:bg-gray-900 shadow">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          Logo
        </span>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Home
        </a>
        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          About
        </a>
        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Services
        </a>
        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Contact
        </a>
      </div>
    </div>
  </div>
</nav>
```

### Tabs

```jsx
<div className="border-b border-gray-200 dark:border-gray-700">
  <nav className="flex gap-4">
    <button className="px-4 py-2 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium">
      Tab 1
    </button>
    <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
      Tab 2
    </button>
    <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
      Tab 3
    </button>
  </nav>
</div>
```

### Breadcrumbs

```jsx
<nav className="flex" aria-label="Breadcrumb">
  <ol className="flex items-center gap-2">
    <li>
      <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
        Home
      </a>
    </li>
    <li className="text-gray-400">/</li>
    <li>
      <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
        Category
      </a>
    </li>
    <li className="text-gray-400">/</li>
    <li className="text-gray-900 dark:text-white font-medium">
      Current Page
    </li>
  </ol>
</nav>
```

## Alerts

### Info Alert

```jsx
<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
  <div className="flex items-start gap-3">
    <svg className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
        Information
      </h3>
      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
        This is an informational message.
      </p>
    </div>
  </div>
</div>
```

### Success Alert

```jsx
<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
  <div className="flex items-start gap-3">
    <svg className="size-5 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
        Success
      </h3>
      <p className="mt-1 text-sm text-green-700 dark:text-green-300">
        Your changes have been saved successfully.
      </p>
    </div>
  </div>
</div>
```

### Warning Alert

```jsx
<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
  <div className="flex items-start gap-3">
    <svg className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
        Warning
      </h3>
      <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
        Please review your information before proceeding.
      </p>
    </div>
  </div>
</div>
```

### Error Alert

```jsx
<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
  <div className="flex items-start gap-3">
    <svg className="size-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
        Error
      </h3>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        There was an error processing your request.
      </p>
    </div>
  </div>
</div>
```

## Badges

```jsx
{/* Default */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
  Badge
</span>

{/* Success */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
  Active
</span>

{/* Warning */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
  Pending
</span>

{/* Error */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
  Inactive
</span>
```

## Loading States

### Spinner

```jsx
<div className="flex items-center justify-center">
  <svg className="animate-spin size-8 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
</div>
```

### Skeleton Loading

```jsx
<div className="space-y-4 animate-pulse">
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
</div>
```

## Modals

### Basic Modal

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
  
  {/* Modal */}
  <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Modal Title
      </h2>
      <button 
        onClick={closeModal}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div className="text-gray-600 dark:text-gray-300 mb-6">
      Modal content goes here
    </div>
    
    <div className="flex justify-end gap-3">
      <button 
        onClick={closeModal}
        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        Cancel
      </button>
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Confirm
      </button>
    </div>
  </div>
</div>
```

## Tooltips

```jsx
<div className="relative group">
  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
    Hover me
  </button>
  
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
    Tooltip text
    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
  </div>
</div>
```

## Avatar

```jsx
{/* Image avatar */}
<img 
  src="/avatar.jpg" 
  alt="User"
  className="size-10 rounded-full object-cover"
/>

{/* Initials avatar */}
<div className="size-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
  JD
</div>

{/* With status indicator */}
<div className="relative">
  <img 
    src="/avatar.jpg" 
    alt="User"
    className="size-10 rounded-full object-cover"
  />
  <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
</div>
```

## Pagination

```jsx
<nav className="flex items-center justify-center gap-2">
  <button className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
    Previous
  </button>
  
  <button className="px-3 py-2 bg-blue-500 text-white rounded-lg">
    1
  </button>
  <button className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
    2
  </button>
  <button className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
    3
  </button>
  
  <button className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
    Next
  </button>
</nav>
```
