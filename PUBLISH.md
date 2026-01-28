# Publishing Guide

## Build the package

```bash
npm run build
```

This will:
1. Compile TypeScript files
2. Generate type definitions (.d.ts files)
3. Build the library in both ES and UMD formats
4. Output everything to the `dist` folder

## Publish to npm

1. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

2. **Check package name availability**:
   Make sure `react-dual-list-box2` is available on npm. If not, update the `name` field in `package.json`.

3. **Update version** (if needed):
   ```bash
   npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # for new features (1.0.0 -> 1.1.0)
   npm version major  # for breaking changes (1.0.0 -> 2.0.0)
   ```

4. **Publish**:
   ```bash
   npm publish
   ```

   For the first time, you might want to publish as a public package:
   ```bash
   npm publish --access public
   ```

## After Publishing

Users can install your package with:
```bash
npm install react-dual-list-box2
```

Make sure they also install the peer dependencies:
```bash
npm install react react-dom @mui/material @emotion/react @emotion/styled react-virtuoso lucide-react
```
