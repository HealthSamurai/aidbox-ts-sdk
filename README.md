# Aidbox TypeScript SDK

A monorepo containing TypeScript packages for working with Aidbox.

## Packages

- **`aidbox-client`** - Client SDK for Aidbox
- **`react-components`** - React UI components

## React Components

View the component library in [Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/).

### Development

Run Storybook locally:
```bash
pnpm storybook
```

### Local Development with Hot Reload

To use the components in your project with hot reload:

```bash
# Clone and link this repository
git clone git@github.com:HealthSamurai/aidbox-ts-sdk.git
cd aidbox-ts-sdk
pnpm install
pnpm link

# Link in your project
cd <your-ui-project>
pnpm link @health-samurai/react-components
pnpm install
```
