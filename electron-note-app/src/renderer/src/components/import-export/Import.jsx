import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Backdrop
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useNotebook } from '../NotebookContext'

const Import = () => {
  const {
    notebooks,
    sections,
    refreshNotebooks,
    refreshSections,
    createNotebook,
    createSection,
    createNote,
    isLoading: contextLoading
  } = useNotebook()

  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [openLocationDialog, setOpenLocationDialog] = useState(false)
  const [selectedNotebookId, setSelectedNotebookId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [createNewNotebook, setCreateNewNotebook] = useState(false)
  const [createNewSection, setCreateNewSection] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

// In Import.jsx, modify the handleFileSelect function:
const handleFileSelect = async () => {
  try {
    setIsLoading(true)
    const result = await window.api.openFileDialog()

    if (result.success) {
      setSelectedFile({ name: result.fileName })
      
      // Fix the line breaks in the imported content
      // This will normalize line endings and ensure proper spacing
      const normalizedContent = result.content
        .replace(/\r\n/g, '\n')  // Normalize Windows line endings
        .replace(/\r/g, '\n')    // Normalize Mac line endings
        .replace(/\n\n\n+/g, '\n\n')  // Remove excessive blank lines
        .replace(/\n## /g, '\n\n## ')  // Ensure headings have a blank line before them
        .replace(/\n### /g, '\n\n### ')  // Same for h3
        .replace(/\n- /g, '\n\n- ')  // Ensure list items start with a blank line
        .replace(/\n\n- /g, '\n\n- ');  // Avoid duplicate blank lines before lists
      
      setFileContent(normalizedContent)
      await handlePrepareLocationSelection()
    } else if (result.error) {
      setNotification({
        open: true,
        message: `Error opening file: ${result.error}`,
        severity: 'error'
      })
    }
  } catch (error) {
    setNotification({
      open: true,
      message: `Error opening file: ${error.message}`,
      severity: 'error'
    })
  } finally {
    if (!openLocationDialog) {
      setIsLoading(false)
    }
  }
}

  const handlePrepareLocationSelection = async () => {
    try {
      if (notebooks.length === 0) {
        await refreshNotebooks()
      }
      setOpenLocationDialog(true)
      setIsLoading(false)
    } catch (error) {
      setNotification({
        open: true,
        message: `Error loading notebooks: ${error.message}`,
        severity: 'error'
      })
      setIsLoading(false)
    }
  }

  const handleNotebookChange = async (event) => {
    const notebookId = event.target.value
    setSelectedNotebookId(notebookId)
    setSelectedSectionId('')

    if (notebookId) {
      setIsLoading(true)
      try {
        await refreshSections(notebookId)
      } catch (error) {
        setNotification({
          open: true,
          message: `Error loading sections: ${error.message}`,
          severity: 'error'
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleLocationDialogClose = () => {
    setOpenLocationDialog(false)
    setSelectedNotebookId('')
    setSelectedSectionId('')
    setNewNotebookName('')
    setNewSectionName('')
    setCreateNewNotebook(false)
    setCreateNewSection(false)
    setSelectedFile(null)
    setFileContent('')
  }

  const handleCompleteImport = async () => {
    setIsLoading(true)
    try {
      let notebookId = selectedNotebookId
      let sectionId = selectedSectionId

      if (createNewNotebook && newNotebookName.trim()) {
        const newNotebook = await createNotebook(newNotebookName.trim())
        if (!newNotebook) throw new Error('Failed to create notebook')
        notebookId = newNotebook._id
        await refreshSections(notebookId)
      }

      if (createNewSection && newSectionName.trim()) {
        const newSection = await createSection(notebookId, newSectionName.trim())
        if (!newSection) throw new Error('Failed to create section')
        sectionId = newSection._id
      }

      if (notebookId && sectionId && selectedFile) {
        const title = selectedFile.name.replace(/\.md$/, '')
        const newNote = await createNote(notebookId, sectionId, title, fileContent)
        if (!newNote) throw new Error('Failed to create note')

        setNotification({
          open: true,
          message: 'Note imported successfully!',
          severity: 'success'
        })
      } else {
        throw new Error('Missing required information to create note')
      }
      handleLocationDialogClose()
    } catch (error) {
      setNotification({
        open: true,
        message: `Error importing note: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false })
  }

  return (
    <>
      <Tooltip title="Import Markdown">
        <IconButton color="inherit" onClick={handleFileSelect} sx={{ color: 'white', backgroundColor: 'transparent', 
 }}>
          <UploadFileIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={openLocationDialog} onClose={handleLocationDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Select Location for Imported Note</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
              Importing: {selectedFile.name}
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Notebook:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Button
                  variant={createNewNotebook ? 'contained' : 'outlined'}
                  onClick={() => setCreateNewNotebook(true)}
                  sx={{ mr: 1 }}
                >
                  Create New
                </Button>
                <Button
                  variant={!createNewNotebook ? 'contained' : 'outlined'}
                  onClick={() => setCreateNewNotebook(false)}
                  disabled={notebooks.length === 0}
                >
                  Use Existing
                </Button>
              </Box>
              {createNewNotebook ? (
                <TextField
                  fullWidth
                  label="New Notebook Name"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  margin="normal"
                />
              ) : (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Notebook</InputLabel>
                  <Select
                    value={selectedNotebookId}
                    onChange={handleNotebookChange}
                    label="Notebook"
                  >
                    {notebooks.map((notebook) => (
                      <MenuItem key={notebook._id} value={notebook._id}>
                        {notebook.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {(selectedNotebookId || createNewNotebook) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Section:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Button
                    variant={createNewSection ? 'contained' : 'outlined'}
                    onClick={() => setCreateNewSection(true)}
                    sx={{ mr: 1 }}
                  >
                    Create New
                  </Button>
                  <Button
                    variant={!createNewSection ? 'contained' : 'outlined'}
                    onClick={() => setCreateNewSection(false)}
                    disabled={!selectedNotebookId || sections.length === 0}
                  >
                    Use Existing
                  </Button>
                </Box>
                {createNewSection ? (
                  <TextField
                    fullWidth
                    label="New Section Name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    margin="normal"
                  />
                ) : (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      label="Section"
                      disabled={!selectedNotebookId}
                    >
                      {sections.map((section) => (
                        <MenuItem key={section._id} value={section._id}>
                          {section.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLocationDialogClose}>Cancel</Button>
          <Button
            onClick={handleCompleteImport}
            variant="contained"
            disabled={
              isLoading ||
              (!createNewNotebook && !selectedNotebookId) ||
              (!createNewSection && !selectedSectionId) ||
              (createNewNotebook && !newNotebookName.trim()) ||
              (createNewSection && !newSectionName.trim())
            }
          >
            {isLoading ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={isLoading && !openLocationDialog}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default Import
