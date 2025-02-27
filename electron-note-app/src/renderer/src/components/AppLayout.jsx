import React, { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'

// Example data
const notebooksData = [
  {
    name: 'Notebook 1',
    sections: ['Section 1.1', 'Section 1.2', 'Section 1.3']
  },
  {
    name: 'Notebook 2',
    sections: ['Section 2.1', 'Section 2.2']
  },
  {
    name: 'Notebook 3',
    sections: ['Section 3.1', 'Section 3.2', 'Section 3.3', 'Section 3.4']
  }
]

const drawerWidth = 240

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNotebook, setSelectedNotebook] = useState(null)

  // Handle notebook click
  const handleNotebookClick = (notebook) => {
    setSelectedNotebook(notebook)
  }

  // Go back to notebooks list
  const handleBackToNotebooks = () => {
    setSelectedNotebook(null)
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        height: '100vh',
        width: '100vw'
      }}
    >
      {/* Navbar */}
      <AppBar position="static">
        <Toolbar>
          {/* Toggle sidebar open/close */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            TwoNote
          </Typography>
          <Button color="inherit">Edit</Button>
          <Button color="inherit">View</Button>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <TextField
              variant="outlined"
              placeholder="Search..."
              size="small"
              sx={{ backgroundColor: 'white', borderRadius: 1 }}
            />
          </Box>
          <Button color="inherit">Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Main area: Sidebar + Content */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: sidebarOpen ? `${drawerWidth}px 1fr` : `0px 1fr`,
          height: '100%'
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            overflow: 'hidden',
            borderRight: 1,
            borderColor: 'divider'
          }}
        >
          {selectedNotebook ? (
            /* Show selected notebook + sections */
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                {/* Back button */}
                <Button onClick={handleBackToNotebooks} variant="outlined" sx={{ mr: 2 }}>
                  Back
                </Button>
                <Typography variant="h6">{selectedNotebook.name}</Typography>
              </Box>
              <Divider />

              <List>
                {selectedNotebook.sections.map((section) => (
                  <ListItem button key={section}>
                    <ListItemText primary={section} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            /* Show all notebooks */
            <Box>
              <Typography variant="h6" sx={{ p: 2 }}>
                Notebooks
              </Typography>
              <Divider />
              <List>
                {notebooksData.map((notebook) => (
                  <ListItem
                    button
                    key={notebook.name}
                    onClick={() => handleNotebookClick(notebook)}
                  >
                    <ListItemText primary={notebook.name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 3 }}>
          <Typography variant="h4">Welcome to TwoNote</Typography>
          <Typography variant="body1">
            {selectedNotebook
              ? `Currently viewing ${selectedNotebook.name}. Pick a section.`
              : 'Select a notebook from the sidebar.'}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout
