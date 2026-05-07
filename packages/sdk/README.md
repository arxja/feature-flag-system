# @arxja/feature-flags-sdk

[![npm version](https://badge.fury.io/js/@arxja/feature-flags-sdk.svg)](https://www.npmjs.com/package/@arxja/feature-flags-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Production-ready feature flag SDK for React and Node.js** - Zero-config, TypeScript-first, with built-in caching.

## ✨ Features

- 🚀 **Simple API** - One line of code to check flags
- ⚡ **Built-in caching** - 30-second cache to reduce API calls
- 🔧 **TypeScript** - Full type safety with autocomplete
- 📦 **React hooks** - `useFeatureFlag()` for easy integration
- 🌍 **Environment support** - dev/staging/production
- 🎯 **User targeting** - By ID, attributes, or percentage
- 🔄 **Real-time updates** - Flags update without page refresh

## 📦 Installation

```bash
npm install @arxja/feature-flags-sdk
# or
yarn add @arxja/feature-flags-sdk
# or
pnpm add @arxja/feature-flags-sdk
```

## 🚀 Quick Start

1. Get your API key

    Sign up at (Not available yet) and get your API key.

2. Initialize the SDK

    **For React apps**:
    
    ```jsx
      import { FeatureFlagProvider, useFeatureFlag } from '@arxja/feature-flags-sdk/react';
      // Wrap your app
      function App() {
        return (
          <FeatureFlagProvider
            config={{
              apiUrl: 'https://api.feature-flags.yourdomain.com',
              apiKey: 'sk_live_abc123',
              cacheTtl: 30,
            }}
          >
            <YourComponent />
          </FeatureFlagProvider>
        );
      }

      // Use in any component
      function YourComponent() {
        const { isEnabled, isLoading } = useFeatureFlag('dark_mode', {
          userId: 'user_123',
          environment: 'production',
        });

        if (isLoading) return <div>Loading...</div>;

        return (
          <div className={isEnabled ? 'dark' : 'light'}>
            {isEnabled ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </div>
        );
      }
    ```

    **For Node.js apps**:
    ```js
    import { FeatureFlagClient } from '@arxja/feature-flags-sdk';
    const flags = new FeatureFlagClient({
      apiUrl: 'https://api.feature-flags.yourdomain.com',
      apiKey: 'sk_live_abc123',
    });
    const showNewFeature = await flags.isEnabled('new_checkout', {
      userId: 'user_123',
      userAttributes: { tier: 'premium' }
    });

    if (showNewFeature) {
      // Show new checkout flow
    } else {
      // Show old checkout flow
    }
    ```

# 📖 API Reference

## React Hooks

### useFeatureFlag(flagKey, options)

Checks if a feature flag is enabled for a user.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| flagKey | string | Yes | The feature flag key (e.g., "dark_mode") |
| options.userId | string | No | User identifier for targeting |
| options.userAttributes | object | No | User attributes (e.g., { tier: "premium" }) |
| options.environment | string | No | Environment: 'development', 'staging', 'production' |
| options.fallback | boolean | No | Fallback value if evaluation fails (default: false) |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| isEnabled | boolean | Whether the feature is enabled |
| isLoading | boolean | Whether the request is in progress |
| error | Error \| null | Error if evaluation failed |

**Example:**

```jsx
function PremiumFeature() {
  const { isEnabled, isLoading, error } = useFeatureFlag('premium_widget', {
    userId: currentUser.id,
    userAttributes: { tier: currentUser.tier },
    fallback: false
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading feature</div>;
  if (!isEnabled) return null;

  return <PremiumWidget />;
}
```

### useFeatureFlags(flagKeys, options)

Checks multiple feature flags at once.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| flagKeys | string[] | Yes | Array of flag keys |
| options | object | No | Same options as useFeatureFlag |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| flags | Record<string, boolean> | Object mapping flag keys to enabled status |
| isLoading | boolean | Whether requests are in progress |
| error | Error \| null | Error if evaluation failed |

**Example:**

```jsx
function Dashboard() {
  const { flags, isLoading } = useFeatureFlags(
    ['new_dashboard', 'analytics_v2', 'ai_assistant'],
    { userId: currentUser.id }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {flags.new_dashboard && <NewDashboard />}
      {flags.analytics_v2 && <AnalyticsV2 />}
      {flags.ai_assistant && <AIAssistant />}
    </div>
  );
}
```

## Node.js Client

### new FeatureFlagClient(config)

Creates a new feature flag client.

**Configuration:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| apiUrl | string | Required | Your feature flag API URL |
| apiKey | string | Required | Your API key from dashboard |
| cacheTtl | number | 30 | Cache TTL in seconds |
| timeout | number | 5000 | Request timeout in milliseconds |
| onError | function | undefined | Error handler callback |

**Methods:**

#### isEnabled(flagKey, options)

Returns Promise<boolean> - whether the flag is enabled.

```typescript
const enabled = await flags.isEnabled('dark_mode', {
  userId: 'user_123'
});
```

#### getFlags(flagKeys, options)

Returns Promise<Record<string, boolean>> - batch flag evaluation.

```typescript
const flags = await client.getFlags(['flag1', 'flag2'], {
  userId: 'user_123'
});
// Returns: { flag1: true, flag2: false }
```

#### clearCache(flagKey?)

Clears the cache for a specific flag or all flags.

```typescript
// Clear specific flag
client.clearCache('dark_mode');

// Clear all cached flags
client.clearCache();
```

## 🎯 Targeting Rules

Your feature flags support powerful targeting rules:

### Percentage Rollout

```jsx
// Flag is enabled for 25% of users
const { isEnabled } = useFeatureFlag('beta_feature', {
  userId: user.id  // Same user always gets same result
});
```

### User Whitelist

```jsx
// Only specific users get the feature
const { isEnabled } = useFeatureFlag('admin_tools', {
  userId: user.id  // Works if user ID is in whitelist
});
```

### User Attributes

```jsx
// Premium users only
const { isEnabled } = useFeatureFlag('premium_feature', {
  userAttributes: { tier: user.subscriptionTier }
});
```

### Combined Rules

```jsx
// Complex targeting: 100% of premium users, 50% of free users
const { isEnabled } = useFeatureFlag('new_feature', {
  userId: user.id,
  userAttributes: { tier: user.tier }
});
```

## 🔧 Advanced Usage

### Custom Error Handling

```jsx
<FeatureFlagProvider
  config={{
    apiUrl: 'https://api.yourdomain.com',
    apiKey: 'sk_live_xxx',
    onError: (error) => {
      console.error('Feature flag error:', error);
      // Send to your error tracking service
      Sentry.captureException(error);
    }
  }}
>
  {children}
</FeatureFlagProvider>

### Manual Cache Control

typescript
import { FeatureFlagClient } from '@arxja/feature-flags-sdk';

const client = new FeatureFlagClient({ apiUrl, apiKey });

// Clear cache for specific flag
client.clearCache('flag_key');
```

### Batch Evaluation for Performance

```jsx
function Dashboard() {
  // Fetch all flags at once (single API call)
  const { flags } = useFeatureFlags([
    'feature_a',
    'feature_b',
    'feature_c',
    'feature_d'
  ], { userId });

  return (
    <div>
      {flags.feature_a && <ComponentA />}
      {flags.feature_b && <ComponentB />}
      {flags.feature_c && <ComponentC />}
      {flags.feature_d && <ComponentD />}
    </div>
  );
}
```

## 🧪 Testing

### Mocking the SDK in tests

```javascript
// Jest mock
jest.mock('@arxja/feature-flags-sdk/react', () => ({
  useFeatureFlag: () => ({
    isEnabled: true,
    isLoading: false,
    error: null
  })
}));

// Or with specific values
jest.mock('@arxja/feature-flags-sdk/react', () => ({
  useFeatureFlag: (flagKey) => ({
    isEnabled: flagKey === 'test_feature',
    isLoading: false,
    error: null
  })
}));
```

## 📝 Examples

### Example 1: A/B Testing

```jsx
function CheckoutButton() {
  const { isEnabled } = useFeatureFlag('checkout_v2', {
    userId: currentUser.id
  });

  if (isEnabled) {
    return <NewCheckoutButton />;
  }
  return <OldCheckoutButton />;
}
```

### Example 2: Gradual Rollout with Monitoring

```jsx
function NewFeature() {
  const { isEnabled, error } = useFeatureFlag('new_feature', {
    userId: currentUser.id
  });

  useEffect(() => {
    analytics.track('feature_evaluation', {
      feature: 'new_feature',
      enabled: isEnabled,
      userId: currentUser.id
    });
  }, [isEnabled]);

  if (error) {
    return <OldFeature />;
  }

  return isEnabled ? <NewFeature /> : <OldFeature />;
}
```

### Example 3: Environment-Specific Features

```jsx
function DebugTools() {
  const { isEnabled } = useFeatureFlag('debug_tools', {
    environment: process.env.NODE_ENV === 'development' ? 'development' : 'production'
  });

  if (!isEnabled) return null;
  return <DebugPanel />;
}
```

## 🔒 Security

- API keys are stored in your backend, never in client-side code
- All communication is over HTTPS
- Rate limiting per API key
- Audit logs for all flag changes

## 📄 License

MIT © Arxja

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guide.

## 📞 Support

- Documentation: (Coming soon)
- Issues: GitHub Issues