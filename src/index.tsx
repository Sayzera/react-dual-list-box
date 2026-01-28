import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { DualBox } from './index'

const theme = createTheme()

function App() {
  const [leftItems, setLeftItems] = useState([
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
  ])

  const [rightItems, setRightItems] = useState([])

  const handleChange = (newLeftItems: any, newRightItems: any) => {
    setLeftItems(newLeftItems)
    setRightItems(newRightItems)
  }

  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: '20px' }}>
        <h1>React Dualist Box Demo</h1>
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
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
