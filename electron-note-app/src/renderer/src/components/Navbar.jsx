import { 
  AppBar, Toolbar, Typography, Button, TextField, IconButton, Box, 
  Snackbar, Alert, Menu, MenuItem, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions,
  Select, FormControl, InputLabel, FormHelperText,
  CircularProgress
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import DescriptionIcon from '@mui/icons-material/Description'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useNavigate } from 'react-router-dom'
import { useNotebook } from './NotebookContext'
import { useState, useRef, useEffect } from 'react'
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
    updateNote,
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
  const [messageInfo, setMessageInfo] = useState({ severity: 'success', message: '' })
  const [importExportAnchorEl, setImportExportAnchorEl] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const fileInputRef = useRef(null)
  
  const [importPlacementDialogOpen, setImportPlacementDialogOpen] = useState(false)
  const [importedNoteData, setImportedNoteData] = useState(null)
  const [selectedImportNotebook, setSelectedImportNotebook] = useState('')
  const [selectedImportSection, setSelectedImportSection] = useState('')
  const [availableSections, setAvailableSections] = useState([])
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [createNewNotebook, setCreateNewNotebook] = useState(false)
  const [createNewSection, setCreateNewSection] = useState(false)
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [importValidationErrors, setImportValidationErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchNotebooks()
  }, [])

  useEffect(() => {
    if (selectedImportNotebook && !createNewNotebook) {
      loadSectionsForNotebook(selectedImportNotebook)
    } else {
      setAvailableSections([])
      setSelectedImportSection('')
    }
  }, [selectedImportNotebook, createNewNotebook])

  const loadSectionsForNotebook = async (notebookId) => {
    if (!notebookId) return
    
    setIsLoadingSections(true)
    setAvailableSections([])
    setSelectedImportSection('')
    
    try {
      await refreshSections(notebookId)
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${getUserId()}/notebooks/${notebookId}/sections`,
        { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      
      const data = await response.json();
      const sections = data.sections || [];
      
      setAvailableSections(sections)
      
      if (sections && sections.length > 0) {
        setSelectedImportSection(sections[0]._id)
      }
    } catch (error) {
      console.error('Error loading sections:', error)
      setMessageInfo({ 
        severity: 'error', 
        message: 'Failed to load sections: ' + (error.message || 'Unknown error') 
      })
      setShowSaveMessage(true)
    } finally {
      setIsLoadingSections(false)
    }
  }
  
  const getUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/signin')
  }
  
  const handleEditClick = () => {
    if (isEditMode) {
      // Save changes
      setMessageInfo({ severity: 'success', message: 'Content saved successfully!' })
      setShowSaveMessage(true)
      toggleEditMode(true)
    } else {
      // Enter edit mode
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

  const handleImportExportClick = (event) => {
    setImportExportAnchorEl(event.currentTarget)
  }

  const handleImportExportClose = () => {
    setImportExportAnchorEl(null)
  }

  const handleExport = async () => {
    handleImportExportClose()

    if (!selectedNote) {
      setMessageInfo({ 
        severity: 'warning', 
        message: 'Please select a note to export' 
      })
      setShowSaveMessage(true)
      return
    }
    
    try {t
      const doc = new jsPDF()
      
      let yPosition = 20
      
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text(selectedNote.title, 14, yPosition)
      yPosition += 15
      
      if (selectedNote.content) {
        doc.setFont(undefined, 'normal')
        doc.setFontSize(12)
        
        let cleanContent = selectedNote.content
        
        cleanContent = cleanContent.replace(/^#{1,6}\s+(.+)$/gm, '$1')
        
        const contentLines = doc.splitTextToSize(cleanContent, 180)
        
        doc.text(contentLines, 14, yPosition)
      }
      
      const safeFileName = selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'
      doc.save(`${safeFileName}.pdf`)
      
      setMessageInfo({ 
        severity: 'success', 
        message: 'Note exported as PDF successfully!' 
      })
      setShowSaveMessage(true)
    } catch (error) {
      console.error('Export error:', error)
      setMessageInfo({ 
        severity: 'error', 
        message: 'Failed to export note: ' + error.message 
      })
      setShowSaveMessage(true)
    }
  }

  const handleImportClick = () => {
    handleImportExportClose()
    setConfirmDialogOpen(true)
  }

  const handleConfirmImport = () => {
    setConfirmDialogOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const markdownContent = e.target.result
          const parsedData = await importData(markdownContent)
          
          if (parsedData && parsedData.success) {
            setImportedNoteData(parsedData)
            
            setSelectedImportNotebook('')
            setSelectedImportSection('')
            setNewNotebookName('')
            setNewSectionName('')
            setCreateNewNotebook(false)
            setCreateNewSection(false)
            setImportValidationErrors({})
            
            setImportPlacementDialogOpen(true)
          } else {
            setMessageInfo({ 
              severity: 'error', 
              message: parsedData.error || 'Failed to parse markdown' 
            })
            setShowSaveMessage(true)
          }
        } catch (error) {
          console.error('Import parsing error:', error)
          setMessageInfo({ severity: 'error', message: 'Invalid markdown format' })
          setShowSaveMessage(true)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('File reading error:', error)
      setMessageInfo({ severity: 'error', message: 'Failed to read markdown file' })
      setShowSaveMessage(true)
    }
    
    event.target.value = null
  }

  const handleImportPlacementClose = () => {
    setImportPlacementDialogOpen(false)
    setImportedNoteData(null)
  }

  const validateImportForm = () => {
    const errors = {}
    
    if (createNewNotebook && !newNotebookName.trim()) {
      errors.notebook = 'Notebook name is required'
    }
    
    if ((createNewSection || createNewNotebook) && !newSectionName.trim()) {
      errors.section = 'Section name is required'
    }
    
    if (!createNewNotebook && !selectedImportNotebook) {
      errors.notebook = 'Please select a notebook'
    }
    
    if (!createNewNotebook && !createNewSection && selectedImportNotebook && availableSections.length === 0) {
      errors.section = 'No sections available. Please create a new section.'
      setCreateNewSection(true)
    } else if (!createNewNotebook && !createNewSection && !selectedImportSection) {
      errors.section = 'Please select a section'
    }
    
    setImportValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleImportPlacementSubmit = async () => {
    if (!validateImportForm()) return
    
    setIsLoading(true)
    
    try {
      let notebookId = selectedImportNotebook
      let sectionId = selectedImportSection
      let notebookName = '';
      let sectionName = '';
      
      if (createNewNotebook) {
        try {
          const newNotebook = await createNotebook(newNotebookName)
          notebookId = newNotebook._id
          notebookName = newNotebook.name
        } catch (error) {
          console.error('Error creating notebook:', error)
          setMessageInfo({ 
            severity: 'error', 
            message: 'Failed to create notebook: ' + (error.message || 'Unknown error') 
          })
          setShowSaveMessage(true)
          setIsLoading(false)
          return
        }
      } else {
        const notebook = notebooks.find(n => n._id === notebookId)
        notebookName = notebook ? notebook.name : 'selected notebook'
      }
      
      if (createNewSection || createNewNotebook) {
        try {
          const newSection = await createSection(notebookId, newSectionName)
          sectionId = newSection._id
          sectionName = newSection.title
        } catch (error) {
          console.error('Error creating section:', error)
          setMessageInfo({ 
            severity: 'error', 
            message: 'Failed to create section: ' + (error.message || 'Unknown error') 
          })
          setShowSaveMessage(true)
          setIsLoading(false)
          return
        }
      } else {
        const section = availableSections.find(s => s._id === sectionId)
        sectionName = section ? section.title : 'selected section'
      }

      try {
        const result = await createImportedNote(
          notebookId,
          sectionId,
          importedNoteData.title,
          importedNoteData.content
        )
        
        if (result.success) {
          setMessageInfo({ 
            severity: 'success', 
            message: `Note "${importedNoteData.title}" imported successfully to ${notebookName} > ${sectionName}!` 
          })
          setShowSaveMessage(true)
          handleImportPlacementClose()
        } else {
          setMessageInfo({ 
            severity: 'error', 
            message: result.error || 'Failed to create note' 
          })
          setShowSaveMessage(true)
        }
      } catch (error) {
        console.error('Error creating note:', error)
        setMessageInfo({ 
          severity: 'error', 
          message: 'Failed to create note: ' + (error.message || 'Unknown error') 
        })
        setShowSaveMessage(true)
      }
    } catch (error) {
      console.error('Error during import process:', error)
      setMessageInfo({ 
        severity: 'error', 
        message: 'Import failed: ' + (error.message || 'Unknown error') 
      })
      setShowSaveMessage(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotebookSelect = (e) => {
    const notebookId = e.target.value
    setSelectedImportNotebook(notebookId)
    setSelectedImportSection('')
    setCreateNewSection(false)
    setNewSectionName('')
    setImportValidationErrors(prev => ({ ...prev, section: null }))
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
              Exit
            </Button>
            <Button 
              color="inherit" 
              onClick={isEditMode && !isPreviewMode ? handleSaveClick : handleEditClick}
              disabled={!selectedNote}
              variant={isEditMode && !isPreviewMode ? "contained" : "text"}
              sx={{ 
                width: 80,
                minWidth: 80,
                visibility: !selectedNote ? 'hidden' : 'visible',
                bgcolor: isEditMode && !isPreviewMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  bgcolor: isEditMode && !isPreviewMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              {isEditMode ? (isPreviewMode ? "Edit" : "Save") : "Edit"}
            </Button>
            <Button 
              color="inherit"
              onClick={handleViewClick}
              disabled={!selectedNote}
              variant={isPreviewMode ? "contained" : "text"}
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
          
          {/* Import/Export Button */}
          <Button 
            color="inherit" 
            onClick={handleImportExportClick}
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Import/Export
          </Button>
          
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      {/* Import/Export Menu */}
      <Menu
        anchorEl={importExportAnchorEl}
        open={Boolean(importExportAnchorEl)}
        onClose={handleImportExportClose}
      >
        <MenuItem onClick={handleExport}>
          <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={handleImportClick}>
          <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
          Import Markdown
        </MenuItem>
      </Menu>
      
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".md,.markdown"
        onChange={handleFileSelect}
      />
      
      {/* Confirm Import Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Import Markdown</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Import a Markdown file as a new note. You'll be able to choose where to place it after uploading.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmImport} variant="contained" color="primary">
            Select File
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Import Placement Dialog */}
      <Dialog
        open={importPlacementDialogOpen}
        onClose={handleImportPlacementClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Place Imported Note</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Choose where to place your imported note "{importedNoteData?.title || 'Imported Note'}"
          </DialogContentText>
          
          {/* Notebook Selection */}
          <Box sx={{ mb: 3 }}>
            <FormControl 
              fullWidth 
              sx={{ mb: 2 }} 
              error={!!importValidationErrors.notebook}
              disabled={createNewNotebook}
            >
              <InputLabel id="notebook-select-label">Select Notebook</InputLabel>
              <Select
                labelId="notebook-select-label"
                value={selectedImportNotebook}
                label="Select Notebook"
                onChange={handleNotebookSelect}
              >
                {notebooks.map((notebook) => (
                  <MenuItem key={notebook._id} value={notebook._id}>
                    {notebook.name}
                  </MenuItem>
                ))}
              </Select>
              {importValidationErrors.notebook && !createNewNotebook && (
                <FormHelperText>{importValidationErrors.notebook}</FormHelperText>
              )}
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Or create a new notebook:</Typography>
              <Button 
                variant={createNewNotebook ? "contained" : "outlined"} 
                size="small"
                onClick={() => setCreateNewNotebook(!createNewNotebook)}
              >
                {createNewNotebook ? "Creating New" : "Create New"}
              </Button>
            </Box>
            
            {createNewNotebook && (
              <TextField
                fullWidth
                label="New Notebook Name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                error={!!importValidationErrors.notebook && createNewNotebook}
                helperText={createNewNotebook ? importValidationErrors.notebook : ''}
                sx={{ mb: 2 }}
              />
            )}
          </Box>
          
          {/* Section Selection */}
          <Box sx={{ mb: 3 }}>
            <FormControl 
              fullWidth 
              sx={{ mb: 2 }} 
              error={!!importValidationErrors.section}
              disabled={createNewSection || !selectedImportNotebook || createNewNotebook || isLoadingSections}
            >
              <InputLabel id="section-select-label">Select Section</InputLabel>
              <Select
                labelId="section-select-label"
                value={selectedImportSection}
                label="Select Section"
                onChange={(e) => setSelectedImportSection(e.target.value)}
              >
                {isLoadingSections ? (
                  <MenuItem disabled>Loading sections...</MenuItem>
                ) : availableSections.length === 0 ? (
                  <MenuItem disabled>No sections available</MenuItem>
                ) : (
                  availableSections.map((section) => (
                    <MenuItem key={section._id} value={section._id}>
                      {section.title}
                    </MenuItem>
                  ))
                )}
              </Select>
              {importValidationErrors.section && !createNewSection && (
                <FormHelperText>{importValidationErrors.section}</FormHelperText>
              )}
              {isLoadingSections && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="caption">Loading sections...</Typography>
                </Box>
              )}
              {!isLoadingSections && selectedImportNotebook && !createNewNotebook && availableSections.length === 0 && (
                <FormHelperText>
                  No sections found in this notebook. Please create a new section.
                </FormHelperText>
              )}
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Or create a new section:</Typography>
              <Button 
                variant={createNewSection ? "contained" : "outlined"} 
                size="small"
                onClick={() => {
                  setCreateNewSection(!createNewSection);
                  if (!createNewSection && availableSections.length === 0) {
                    // Auto-fill validation errors if there are no sections available
                    setImportValidationErrors(prev => ({
                      ...prev,
                      section: createNewSection ? '' : null
                    }));
                  }
                }}
                disabled={!selectedImportNotebook && !createNewNotebook}
                color={availableSections.length === 0 && !createNewSection ? "warning" : "primary"}
              >
                {createNewSection ? "Creating New" : "Create New"}
              </Button>
            </Box>
            
            {(createNewSection || createNewNotebook) && (
              <TextField
                fullWidth
                label="New Section Name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                error={!!importValidationErrors.section && (createNewSection || createNewNotebook)}
                helperText={(createNewSection || createNewNotebook) ? importValidationErrors.section : ''}
                autoFocus
              />
            )}
          </Box>
          
          {/* Preview */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Note Preview:</Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              border: '1px solid', 
              borderColor: 'divider',
              borderRadius: 1,
              maxHeight: 200,
              overflow: 'auto'
            }}>
              <Typography variant="h6" gutterBottom>
                {importedNoteData?.title || 'Imported Note'}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {importedNoteData?.content ? 
                  (importedNoteData.content.length > 300 ? 
                    importedNoteData.content.substring(0, 300) + '...' : 
                    importedNoteData.content) : 
                  'No content'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleImportPlacementClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImportPlacementSubmit} 
            variant="contained" 
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Importing...' : 'Import Note'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={showSaveMessage}
        autoHideDuration={3000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseMessage} severity={messageInfo.severity} sx={{ width: '100%' }}>
          {messageInfo.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default Navbar