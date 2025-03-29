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
import ImportExport from './import-export/ImportExport'
import RequirementsManager from './RequirementsManager'
import Labels from './Labels'

const Navbar = ({ toggleSidebar }) => {
  const DEBUG = false
  DEBUG && console.log('[DEBUG-NAVBAR] Navbar rendering')

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
    createSection,
    setSelectedNote
  } = useNotebook()

  DEBUG &&
    console.log('[DEBUG-NAVBAR] Current state:', {
      isEditMode,
      isPreviewMode,
      hasSelectedNote: !!selectedNote,
      noteId: selectedNote?._id,
      isDirty
    })

  const { updateNote } = useNotebookData()

  const [showSaveMessage, setShowSaveMessage] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/signin')
  }

  const handleEditClick = () => {
    DEBUG && console.log('[DEBUG-NAVBAR] Edit button clicked')
    DEBUG && console.log('[DEBUG-NAVBAR] Current isEditMode:', isEditMode)
    DEBUG && console.log('[DEBUG-NAVBAR] Current isPreviewMode:', isPreviewMode)

    if (isEditMode) {
      if (isPreviewMode) {
        DEBUG && console.log('[DEBUG-NAVBAR] Switching from preview mode to edit mode')
        setIsPreviewMode(false)
      } else {
        DEBUG && console.log('[DEBUG-NAVBAR] Exiting edit mode via toggleEditMode')
        toggleEditMode()
      }
    } else {
      DEBUG && console.log('[DEBUG-NAVBAR] Entering edit mode via toggleEditMode')
      toggleEditMode()
    }
  }

  const handleSaveClick = () => {
    DEBUG && console.log('[DEBUG-NAVBAR] Save button clicked')
    DEBUG && console.log('[DEBUG-NAVBAR] Current isEditMode:', isEditMode)
    DEBUG && console.log('[DEBUG-NAVBAR] Current isPreviewMode:', isPreviewMode)
    DEBUG && console.log('[DEBUG-NAVBAR] Has selectedNote:', !!selectedNote)

    if (selectedNote && isEditMode && !isPreviewMode) {
      DEBUG && console.log('[DEBUG-NAVBAR] Attempting to capture current editor content')

      const editorElement = document.querySelector('[contenteditable=true]')

      if (editorElement) {
        const currentContent = editorElement.innerText || ''
        DEBUG &&
          console.log(
            '[DEBUG-NAVBAR] Editor content captured for save:',
            currentContent.length > 50 ? currentContent.substring(0, 50) + '...' : currentContent
          )

        DEBUG &&
          console.log(
            '[DEBUG-NAVBAR] Current note content:',
            selectedNote.content
              ? selectedNote.content.length > 50
                ? selectedNote.content.substring(0, 50) + '...'
                : selectedNote.content
              : 'empty'
          )

        if (currentContent !== selectedNote.content) {
          DEBUG &&
            console.log('[DEBUG-NAVBAR] Content changed, updating note with current editor content')
          const updatedNote = { ...selectedNote, content: currentContent }
          setSelectedNote(updatedNote)
        } else {
          DEBUG && console.log('[DEBUG-NAVBAR] Content unchanged, no need to update note')
        }
      } else {
        DEBUG && console.log('[DEBUG-NAVBAR] Could not find editable element')
      }

      DEBUG && console.log('[DEBUG-NAVBAR] Calling saveContent')
      if (saveContent()) {
        DEBUG && console.log('[DEBUG-NAVBAR] Save successful, showing message')
        setShowSaveMessage(true)
      } else {
        DEBUG && console.log('[DEBUG-NAVBAR] Save failed')
      }
    } else {
      DEBUG && console.log('[DEBUG-NAVBAR] Using fallback save method')
      if (saveContent()) {
        DEBUG && console.log('[DEBUG-NAVBAR] Fallback save successful, showing message')
        setShowSaveMessage(true)
      } else {
        DEBUG && console.log('[DEBUG-NAVBAR] Fallback save failed')
      }
    }
  }

  const handleCancelClick = () => {
    DEBUG && console.log('[DEBUG-NAVBAR] Cancel button clicked')
    DEBUG && console.log('[DEBUG-NAVBAR] Current isEditMode:', isEditMode)
    DEBUG && console.log('[DEBUG-NAVBAR] Current isPreviewMode:', isPreviewMode)
    DEBUG && console.log('[DEBUG-NAVBAR] Current selectedNote:', selectedNote?._id)

    DEBUG && console.log('[DEBUG-NAVBAR] Calling cancelEdit')
    cancelEdit()
    DEBUG && console.log('[DEBUG-NAVBAR] Returned from cancelEdit')
  }

  const handleViewClick = () => {
    DEBUG && console.log('[DEBUG-NAVBAR] View button clicked')
    DEBUG && console.log('[DEBUG-NAVBAR] Current isEditMode:', isEditMode)
    DEBUG && console.log('[DEBUG-NAVBAR] Current isPreviewMode:', isPreviewMode)

    if (isEditMode) {
      DEBUG && console.log('[DEBUG-NAVBAR] Attempting to capture current content before preview')
      const editorElement = document.querySelector('[contenteditable=true]')
      if (editorElement && selectedNote) {
        const currentContent = editorElement.innerText || ''
        DEBUG &&
          console.log(
            '[DEBUG-NAVBAR] Editor content captured:',
            currentContent.length > 50 ? currentContent.substring(0, 50) + '...' : currentContent
          )

        if (currentContent !== selectedNote.content) {
          DEBUG &&
            console.log(
              '[DEBUG-NAVBAR] Content changed, updating note with current editor content before preview'
            )
          const updatedNote = { ...selectedNote, content: currentContent }
          setSelectedNote(updatedNote)
        } else {
          DEBUG && console.log('[DEBUG-NAVBAR] Content unchanged, no need to update before preview')
        }
      } else {
        DEBUG &&
          console.log(
            '[DEBUG-NAVBAR] Could not capture content: editorElement exists =',
            !!editorElement,
            'selectedNote exists =',
            !!selectedNote
          )
      }

      DEBUG && console.log('[DEBUG-NAVBAR] Setting isPreviewMode to true')
      setIsPreviewMode(true)
    } else {
      DEBUG && console.log('[DEBUG-NAVBAR] Not in edit mode, ignoring view button click')
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

          {}
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
          {}
          <Box sx={{ flexGrow: 1 }} />
          <Labels />

          <RequirementsManager />

          <ImportExport />
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
