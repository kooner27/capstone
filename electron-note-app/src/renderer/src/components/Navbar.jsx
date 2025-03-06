import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  IconButton,
  Box,
  Snackbar,
  Alert
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate } from 'react-router-dom'
import { useNotebook } from './NotebookContext'
import { useState } from 'react'
import SearchBar from './SearchBar'

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
      setShowSaveMessage(true)
      toggleEditMode(true)
    } else {
      toggleEditMode()
    }
  }

  const handleCancelClick = () => {
    cancelEdit()
  }

  const handleViewClick = () => {
    if (isEditMode) {
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
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left side: Menu button, title, and search bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" edge="start" onClick={toggleSidebar}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">TwoNote</Typography>

            <Box sx={{ ml: 10 }}>
              <SearchBar />
            </Box>
          </Box>

          {/* Center: Edit, View, Cancel buttons */}
          <Box
            sx={{ display: 'flex', alignItems: 'centre', flexGrow: 0.5, justifyContent: 'left' }}
          >
            <Button
              color="inherit"
              onClick={handleCancelClick}
              variant="text"
              sx={{
                visibility: isEditMode ? 'visible' : 'hidden',
                width: 80
              }}
            >
              Cancel
            </Button>
            <Button
              color="inherit"
              onClick={handleEditClick}
              disabled={!selectedNote}
              variant={isEditMode ? 'contained' : 'text'}
              sx={{ width: 80 }}
            >
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
            <Button
              color="inherit"
              onClick={handleViewClick}
              disabled={!selectedNote}
              variant={!isEditMode ? 'contained' : 'text'}
              sx={{ width: 80 }}
            >
              View
            </Button>
          </Box>

          {/* Right side: Logout button */}
          <Box>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
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
