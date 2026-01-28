# react-dual-list-box2

A React dual list box component with virtualization, search functionality, and Material UI styling. Perfect for permission management, user selection, and any scenario where you need to transfer items between two lists.

## Features

- 🚀 **Virtualized Lists** - Uses `react-virtuoso` for efficient rendering of large datasets
- 🔍 **Search Functionality** - Filter items in both lists with real-time search
- 🎨 **Material UI** - Beautiful, consistent UI using Material-UI components
- ♿ **Accessible** - Built with accessibility in mind
- 📦 **TypeScript** - Fully typed with TypeScript
- ✅ **Grouped Items** - Support for grouped items with expandable sections
- 🎯 **Bulk Operations** - Move all items or search results with a single click
- 🔄 **Duplicate Prevention** - Automatically prevents duplicate items when moving between lists



## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react-virtuoso@>=4
```

The following dependencies are optional (for Material UI styling):

```bash
npm install @mui/material@>=5 @emotion/react@>=11 @emotion/styled@>=11
```

## Installation

```bash
npm install react-dual-list-box2
```

**Note**: `lucide-react` is included as a regular dependency and will be installed automatically.

## Usage

### Basic Example

```tsx
import React, { useState } from 'react';
import { DualBox, type DualBoxProps, type ItemGroup } from 'react-dual-list-box2';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

function App() {
  const [leftItems, setLeftItems] = useState<ItemGroup[]>([
    {
      id: 1,
      label: 'Group 1',
      options: [
        { id: 1, value: 1, label: 'Option 1' },
        { id: 2, value: 2, label: 'Option 2' },
        { id: 3, value: 3, label: 'Option 3' },
      ]
    },
    {
      id: 2,
      label: 'Group 2',
      options: [
        { id: 4, value: 4, label: 'Option 4' },
        { id: 5, value: 5, label: 'Option 5' },
      ]
    }
  ]);

  const [rightItems, setRightItems] = useState<ItemGroup[]>([]);

  const handleChange: DualBoxProps['onChange'] = (newLeftItems, newRightItems) => {
    setLeftItems(newLeftItems);
    setRightItems(newRightItems);
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: '20px' }}>
        <DualBox
          leftItems={leftItems}
          rightItems={rightItems}
          onChange={handleChange}
          leftTitle="Available Items"
          rightTitle="Selected Items"
          height={400}
          width={300}
        />
      </div>
    </ThemeProvider>
  );
}
```

### With Custom Styling

```tsx
<DualBox
  leftItems={leftItems}
  rightItems={rightItems}
  onChange={handleChange}
  leftTitle="Available Permissions"
  rightTitle="Assigned Permissions"
  height={500}
  width={350}
  disabled={false}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `leftItems` | `ItemGroup[]` | **required** | Array of items to display in the left list |
| `rightItems` | `ItemGroup[]` | **required** | Array of items to display in the right list |
| `onChange` | `(leftItems: ItemGroup[], rightItems: ItemGroup[]) => void` | **required** | Callback fired when items are moved between lists |
| `leftTitle` | `string` | `"Mevcut Yetkiler"` | Title for the left list |
| `rightTitle` | `string` | `"Atanan Yetkiler"` | Title for the right list |
| `height` | `number` | `350` | Height of the list container in pixels |
| `width` | `number` | `300` | Width of the list container in pixels |
| `disabled` | `boolean` | `false` | Disable all interactions |

## Types

### DualBoxProps

The main props interface for the DualBox component.

```typescript
interface DualBoxProps {
  leftItems: ItemGroup[];
  rightItems: ItemGroup[];
  onChange: (leftItems: ItemGroup[], rightItems: ItemGroup[]) => void;
  leftTitle?: string;
  rightTitle?: string;
  height?: number;
  width?: number;
  disabled?: boolean;
}
```

### ItemGroup

Represents a group of options in the dual list box.

```typescript
interface ItemGroup {
  id: number;
  label: string;
  options: Option[];
}
```

### Option

Represents an individual selectable item within a group.

```typescript
interface Option {
  id: number;
  value: number;
  label: string;
}
```

## Features in Detail

### Virtualization

The component uses `react-virtuoso` to efficiently render large lists without performance issues. This means you can handle thousands of items without any lag or performance degradation.

### Search

- **Real-time filtering**: Items are filtered as you type
- **Group and option search**: Search works on both group names and option labels
- **Smart move operations**: "Move All" buttons respect search filters - if you search and then click "Move All", only the filtered results will be moved

### Bulk Operations

- **Select All**: Checkbox in the header selects/deselects all items in the list
- **Move Selected** (`>` / `<`): Move only the checked items between lists
- **Move All** (`>>` / `<<`): Move all items, or all search results if a search is active

### Duplicate Prevention

The component automatically prevents duplicate items when moving between lists. If an item already exists in the target list, it will be skipped during the move operation.

### Group Management

Items are organized in groups, and groups are automatically managed:
- Empty groups are removed when all their options are moved
- Groups are created or merged when options are moved
- Group structure is preserved when moving items back

## Browser Support

This component supports all modern browsers that support React 18+.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
