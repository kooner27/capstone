import { AppBar, Toolbar, Typography, Button, TextField, IconButton, Box, Snackbar, Alert, Divider } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate } from 'react-router-dom'
import { useNotebook } from './NotebookContext'
import { useState } from 'react'
import Import from './import-export/Import'

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const { 
    isEditMode, 
    toggleEditMode, 
    selectedNote, 
    selectedNotebook,
    selectedSection,
    isDirty,
    cancelEdit,
    updateNote
  } = useNotebook()
  
  const [showSaveMessage, setShowSaveMessage] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/signin')
  }
  
  const handleEditClick = () => {
    if (isEditMode) {
      // Save changes
      setShowSaveMessage(true)
      toggleEditMode(true)
    } else {
      // Enter edit mode
      toggleEditMode()
    }
  }

  const handleCancelClick = () => {
    cancelEdit()
  }

  const handleViewClick = () => {
    if (isEditMode) {
      // If in edit mode, save changes first
      if (isDirty && selectedNote && selectedNotebook && selectedSection) {
        updateNote(
          selectedNotebook._id,
          selectedSection._id,
          selectedNote._id,
          selectedNote.title,
          selectedNote.content
        )
      }
      cancelEdit()
    }
  }

  const handleCloseMessage = () => {
    setShowSaveMessage(false)
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 0.5 }}>
            TwoNote
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              color="inherit"
              onClick={handleCancelClick}
              variant="text"
              sx={{ 
                bgcolor: 'transparent',
                visibility: isEditMode ? 'visible' : 'hidden',
                width: 80,
                minWidth: 80,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              color="inherit" 
              onClick={handleEditClick}
              disabled={!selectedNote}
              variant={isEditMode ? "contained" : "text"}
              sx={{ 
                width: 80,
                minWidth: 80,
                bgcolor: isEditMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  bgcolor: isEditMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              {isEditMode ? "Save" : "Edit"}
            </Button>
            <Button 
              color="inherit"
              onClick={handleViewClick}
              disabled={!selectedNote}
              variant={!isEditMode ? "contained" : "text"}
              sx={{ 
                width: 80,
                minWidth: 80,
                bgcolor: !isEditMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  bgcolor: !isEditMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              View
            </Button>
          </Box>
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            mx: 2
          }}>
            <TextField
              variant="outlined"
              placeholder="Search..."
              size="small"
              sx={{ 
                backgroundColor: 'white', 
                borderRadius: 1,
                width: 240
              }}
            />
          </Box>
          <Import />
          <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Snackbar
        open={showSaveMessage}
        autoHideDuration={3000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseMessage} severity="success" sx={{ width: '100%' }}>
          Content saved successfully!
        </Alert>
      </Snackbar>
    </>
  )
}

export default Navbar