# Backstage Pass - Development Testing

For development testing, you can bypass authentication by adding a special header to your requests.

## How to Use

Add this header to any API request to bypass authentication:

```
x-test-user: backstage-pass
```

## What it does

- Automatically creates a test user session
- Bypasses all authentication checks
- Creates a test user with ID: `test-user-backstage`
- Username: `BackstageTestUser`

## Browser Console Method

To test in the browser, you can modify the fetch request in the queryClient to include the header:

1. Open browser console (F12)
2. Run this command to patch the fetch function:

```javascript
// Patch the global fetch to include backstage pass header
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[1]) {
    args[1].headers = args[1].headers || {};
    args[1].headers['x-test-user'] = 'backstage-pass';
  } else {
    args[1] = {
      headers: {
        'x-test-user': 'backstage-pass'
      }
    };
  }
  return originalFetch.apply(this, args);
};
console.log('🎫 Backstage pass activated! All API requests will now bypass authentication.');
```

3. Refresh the page and you'll have full access without logging in

## Security Note

This bypass only works in development mode (`NODE_ENV=development`) and will not work in production.