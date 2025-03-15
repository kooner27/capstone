import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  IconButton,
  Box,
  Snackbar,
  Alert,
  Divider
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate } from 'react-router-dom'
import { useNotebook } from './NotebookContext'
import { useNotebookData } from './NotebookDataContext'
import { useState, useRef, useEffect } from 'react'
import SearchBar from './SearchBar'
import Import from './import-export/Import'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

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
    isPreviewMode,
    togglePreviewMode,
    setIsPreviewMode,
    saveContent,
    exportData,
    importData,
    createImportedNote,
    notebooks,
    fetchNotebooks,
    refreshSections,
    createNotebook,
    createSection
  } = useNotebook()

  const { updateNote } = useNotebookData()

  const [showSaveMessage, setShowSaveMessage] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/signin')
  }

  const handleEditClick = () => {
    if (isEditMode) {
      if (isPreviewMode) {
        // If we're in preview mode, go back to edit mode
        setIsPreviewMode(false)
      } else {
        // We're in edit mode but not preview mode
        toggleEditMode()
      }
    } else {
      toggleEditMode()
    }
  }

  const handleSaveClick = () => {
    // Just save without exiting edit mode
    if (saveContent()) {
      setShowSaveMessage(true)
    }
  }

  const handleCancelClick = () => {
    cancelEdit()
  }

  const handleViewClick = () => {
    if (isEditMode) {
      setIsPreviewMode(true)
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
          <Typography variant="h6" sx={{ mr: 2 }}>
            TwoNote
          </Typography>

          {/* Added a spacer to move SearchBar right */}
          <Box sx={{ flexGrow: 0.1 }} />
          <SearchBar />

          <Box sx={{ flexGrow: 0.3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              onClick={handleCancelClick}
              variant="text"
              sx={{
                visibility: isEditMode ? 'visible' : 'hidden',
                width: 80
              }}
            >
              Exit
            </Button>
            <Button
              color="inherit"
              onClick={isEditMode && !isPreviewMode ? handleSaveClick : handleEditClick}
              disabled={!selectedNote}
              variant={isEditMode && !isPreviewMode ? 'contained' : 'text'}
              sx={{
                width: 80,
                minWidth: 80,
                visibility: !selectedNote ? 'hidden' : 'visible',
                bgcolor: isEditMode && !isPreviewMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  bgcolor:
                    isEditMode && !isPreviewMode
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              {isEditMode ? (isPreviewMode ? 'Edit' : 'Save') : 'Edit'}
            </Button>
            <Button
              color="inherit"
              onClick={handleViewClick}
              disabled={!selectedNote}
              variant={isPreviewMode ? 'contained' : 'text'}
              sx={{
                width: 80,
                minWidth: 80,
                bgcolor: isPreviewMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                visibility: isEditMode ? 'visible' : 'hidden',
                '&:hover': {
                  bgcolor: isPreviewMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              View
            </Button>
          </Box>
          {/* box for space between edit and import/logout */}
          <Box sx={{ flexGrow: 1 }} />
          <Import />
          <Divider
            orientation="vertical"
            flexItem
            sx={{ mx: 1, bgcolor: 'rgba(255, 255, 255, 0.3)' }}
          />
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
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
