import { useState, useEffect } from 'react'
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
  Backdrop,
  Menu,
  ListItemIcon,
  ListItemText,
  LinearProgress
} from '@mui/material'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import DownloadIcon from '@mui/icons-material/Download'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useNotebook } from '../NotebookContext'
import { useNotebookData } from '../NotebookDataContext'
import html2pdf from 'html2pdf.js'
import { marked } from 'marked'

const createOffscreenContainer = () => {
  const existingContainer = document.getElementById('pdf-export-container')
  if (existingContainer) {
    document.body.removeChild(existingContainer)
  }
  const offscreenContainer = document.createElement('div')
  offscreenContainer.id = 'pdf-export-container'
  offscreenContainer.style.position = 'absolute'
  offscreenContainer.style.top = '-9999px'
  offscreenContainer.style.left = '-9999px'
  offscreenContainer.style.width = '8.5in'
  offscreenContainer.style.visibility = 'hidden'
  document.body.appendChild(offscreenContainer)
  return offscreenContainer
}

const ImportExport = () => {
  const {
    notebooks,
    sections,
    notes,
    refreshNotebooks,
    refreshSections,
    createNotebook,
    createSection,
    createNote,
    selectedNote,
    selectedNotebook,
    selectedSection
  } = useNotebook()

  const { fetchNotes } = useNotebookData()

  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [openLocationDialog, setOpenLocationDialog] = useState(false)
  const [selectedNotebookId, setSelectedNotebookId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [createNewNotebook, setCreateNewNotebook] = useState(false)
  const [createNewSection, setCreateNewSection] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const menuOpen = Boolean(menuAnchorEl)

  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [showExportProgress, setShowExportProgress] = useState(false)
  const [showImportProgress, setShowImportProgress] = useState(false)
  const [openImportZipDialog, setOpenImportZipDialog] = useState(false)
  const [importZipValidationStatus, setImportZipValidationStatus] = useState(null)
  const [zipSummary, setZipSummary] = useState(null)

  useEffect(() => {
    return () => {
      const container = document.getElementById('pdf-export-container')
      if (container) {
        document.body.removeChild(container)
      }
    }
  }, [])

  const handleButtonClick = (event) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleActionSelect = (action) => {
    handleMenuClose()
    if (action === 'import') {
      handleFileSelect()
    } else if (action === 'export') {
      handleExportToPdf()
    } else if (action === 'exportZip') {
      handleExportToZip()
    } else if (action === 'importZip') {
      handleImportFromZip()
    }
  }

  const handleExportToZip = async () => {
    try {
      setIsLoading(true)
      setShowExportProgress(true)
      setExportProgress(0)

      if (notebooks.length === 0) {
        await refreshNotebooks()
      }

      setExportProgress(10)

      const allData = {
        notebooks: [],
        timestamp: new Date().toISOString(),
        appVersion: window.electron?.app?.version || 'unknown'
      }

      for (let i = 0; i < notebooks.length; i++) {
        const notebook = notebooks[i]
        const notebookData = { ...notebook, sections: [] }

        const sectionsData = await refreshSections(notebook._id)
        setExportProgress(10 + Math.floor((i / notebooks.length) * 40))

        for (let j = 0; j < sectionsData.length; j++) {
          const section = sectionsData[j]
          const sectionData = { ...section, notes: [] }

          const notesData = await fetchNotes(notebook._id, section._id)
          setExportProgress(50 + Math.floor((i / notebooks.length) * 40))

          sectionData.notes = notesData.map((note) => ({
            _id: note._id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            labels: note.labels || []
          }))

          notebookData.sections.push(sectionData)
        }

        allData.notebooks.push(notebookData)
      }

      setExportProgress(90)

      const result = await window.electron.exportToZip(allData)

      setExportProgress(100)
      setShowExportProgress(false)

      if (result.success) {
        setNotification({
          open: true,
          message: `Backup saved successfully to ${result.filePath}`,
          severity: 'success'
        })
      } else {
        throw new Error(result.error || 'Failed to create backup')
      }
    } catch (error) {
      console.error('Error exporting to ZIP:', error)
      setNotification({
        open: true,
        message: `Error creating backup: ${error.message}`,
        severity: 'error'
      })
      setShowExportProgress(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportFromZip = async () => {
    try {
      setIsLoading(true)

      const result = await window.electron.selectBackupFile()

      if (result.canceled) {
        setIsLoading(false)
        return
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to select backup file')
      }

      setShowImportProgress(true)
      setImportProgress(10)

      const validationResult = await window.electron.validateBackupZip(result.filePath)

      if (!validationResult.valid) {
        setImportZipValidationStatus({
          valid: false,
          error: validationResult.error
        })
        setShowImportProgress(false)
        throw new Error(`Invalid backup file: ${validationResult.error}`)
      }

      setImportProgress(30)

      const summary = validationResult.summary
      setZipSummary(summary)

      setOpenImportZipDialog(true)
      setShowImportProgress(false)
      setIsLoading(false)
    } catch (error) {
      console.error('Error importing from ZIP:', error)
      setNotification({
        open: true,
        message: `Error importing backup: ${error.message}`,
        severity: 'error'
      })
      setIsLoading(false)
      setShowImportProgress(false)
    }
  }

  const handleConfirmImport = async () => {
    try {
      setIsLoading(true)
      setShowImportProgress(true)
      setImportProgress(40)

      const importResult = await window.electron.importFromBackupZip()

      if (!importResult.success) {
        throw new Error(importResult.error || 'Failed to import backup')
      }

      for (let i = 0; i < importResult.data.notebooks.length; i++) {
        const notebookData = importResult.data.notebooks[i]

        const newNotebook = await createNotebook(notebookData.name)

        setImportProgress(40 + Math.floor((i / importResult.data.notebooks.length) * 30))

        for (let j = 0; j < notebookData.sections.length; j++) {
          const sectionData = notebookData.sections[j]

          const newSection = await createSection(newNotebook._id, sectionData.title)

          for (let k = 0; k < sectionData.notes.length; k++) {
            const noteData = sectionData.notes[k]

            await createNote(
              newNotebook._id,
              newSection._id,
              noteData.title,
              noteData.content,
              noteData.labels
            )
          }
        }
      }

      setImportProgress(100)

      await refreshNotebooks()

      setNotification({
        open: true,
        message: 'Backup restored successfully!',
        severity: 'success'
      })

      setOpenImportZipDialog(false)
      setShowImportProgress(false)
    } catch (error) {
      console.error('Error completing import:', error)
      setNotification({
        open: true,
        message: `Error restoring backup: ${error.message}`,
        severity: 'error'
      })
      setShowImportProgress(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async () => {
    try {
      setIsLoading(true)
      const result = await window.api.openFileDialog()
      if (result.success) {
        setSelectedFile({ name: result.fileName })
        const normalizedContent = result.content
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n\n\n+/g, '\n\n')
          .replace(/\n## /g, '\n\n## ')
          .replace(/\n### /g, '\n\n### ')
          .replace(/\n- /g, '\n\n- ')
          .replace(/\n\n- /g, '\n\n- ')
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

  const handleExportToPdf = async () => {
    if (!selectedNote || !selectedNotebook || !selectedSection) {
      setNotification({
        open: true,
        message: 'Please select a note to export',
        severity: 'warning'
      })
      return
    }
    try {
      setIsLoading(true)
      const offscreenRoot = createOffscreenContainer()
      const container = document.createElement('div')
      container.style.padding = '20px'
      container.style.fontFamily = 'Arial, sans-serif'
      container.className = 'markdown-pdf-container'
      container.style.backgroundColor = 'white'
      const header = document.createElement('div')
      header.style.marginBottom = '20px'
      header.style.borderBottom = '1px solid #ddd'
      header.style.paddingBottom = '10px'
      header.style.pageBreakAfter = 'avoid'
      const title = document.createElement('h1')
      title.textContent = selectedNote.title || 'Untitled Note'
      title.style.margin = '0 0 5px 0'
      title.style.color = '#333'
      title.style.fontSize = '24px'
      const metaContainer = document.createElement('div')
      metaContainer.style.fontSize = '12px'
      metaContainer.style.color = '#666'
      const notebookInfo = document.createElement('span')
      notebookInfo.textContent = `Notebook: ${selectedNotebook.name}`
      notebookInfo.style.marginRight = '15px'
      const sectionInfo = document.createElement('span')
      sectionInfo.textContent = `Section: ${selectedSection.title}`
      metaContainer.appendChild(notebookInfo)
      metaContainer.appendChild(sectionInfo)
      header.appendChild(title)
      header.appendChild(metaContainer)
      container.appendChild(header)
      const contentDiv = document.createElement('div')
      contentDiv.className = 'markdown-content'
      const markdownContent = selectedNote.content || ''
      const styleElement = document.createElement('style')
      styleElement.textContent = `
        .markdown-pdf-container {
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        .markdown-content {
          line-height: 1.6;
          color: #333;
        }
        .markdown-content p, 
        .markdown-content li, 
        .markdown-content blockquote,
        .markdown-content table,
        .markdown-content pre {
          page-break-inside: avoid;
        }
        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3, 
        .markdown-content h4, 
        .markdown-content h5, 
        .markdown-content h6 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        .markdown-content h1 {
          page-break-before: auto;
        }
        .markdown-content img {
          page-break-inside: avoid;
        }
        .markdown-content ul, .markdown-content ol {
          page-break-inside: avoid;
        }
        .markdown-content h1 + p,
        .markdown-content h2 + p,
        .markdown-content h3 + p,
        .markdown-content h4 + p,
        .markdown-content h5 + p,
        .markdown-content h6 + p {
          page-break-before: avoid;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3, 
        .markdown-content h4, .markdown-content h5, .markdown-content h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-content h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }
        .markdown-content h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }
        .markdown-content h3 { font-size: 1.25em; }
        .markdown-content h4 { font-size: 1em; }
        .markdown-content h5 { font-size: 0.875em; }
        .markdown-content h6 { font-size: 0.85em; color: #6a737d; }
        .markdown-content p, .markdown-content blockquote, .markdown-content ul,
        .markdown-content ol, .markdown-content dl, .markdown-content table {
          margin-top: 0;
          margin-bottom: 16px;
        }
        .markdown-content hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #e1e4e8;
          border: 0;
        }
        .markdown-content blockquote {
          padding: 0 1em;
          color: #6a737d;
          border-left: 0.25em solid #dfe2e5;
        }
        .markdown-content ul, .markdown-content ol {
          padding-left: 2em;
        }
        .markdown-content code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(27,31,35,0.05);
          border-radius: 3px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        .markdown-content pre {
          word-wrap: normal;
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 3px;
        }
        .markdown-content pre code {
          padding: 0;
          margin: 0;
          font-size: 100%;
          word-break: normal;
          white-space: pre;
          background: transparent;
          border: 0;
        }
        .markdown-content table {
          border-spacing: 0;
          border-collapse: collapse;
          width: 100%;
          overflow: auto;
        }
        .markdown-content table th {
          font-weight: 600;
          padding: 6px 13px;
          border: 1px solid #dfe2e5;
        }
        .markdown-content table td {
          padding: 6px 13px;
          border: 1px solid #dfe2e5;
        }
        .markdown-content table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        .markdown-content img {
          max-width: 100%;
          box-sizing: border-box;
        }
        .markdown-content a {
          color: #0366d6;
          text-decoration: none;
        }
      `
      document.head.appendChild(styleElement)
      contentDiv.innerHTML = marked(markdownContent, {
        breaks: true,
        gfm: true
      })
      const enhancePageBreaks = () => {
        const headings = contentDiv.querySelectorAll('h1, h2')
        headings.forEach((heading) => {
          heading.classList.add('page-break-before')
        })
        const largeElements = contentDiv.querySelectorAll('pre, table')
        largeElements.forEach((element) => {
          if (element.offsetHeight > 500) {
            element.classList.add('page-break-before')
          }
        })
      }
      container.appendChild(contentDiv)
      offscreenRoot.appendChild(container)
      const breakStyle = document.createElement('style')
      breakStyle.textContent = `
        .page-break-before {
          page-break-before: always;
        }
        .page-break-after {
          page-break-after: always;
        }
      `
      document.head.appendChild(breakStyle)
      setTimeout(() => enhancePageBreaks(), 10)
      const fileName = `${selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      await new Promise((resolve) => setTimeout(resolve, 50))
      await html2pdf()
        .from(container)
        .set({
          margin: [0.75, 0.75, 0.75, 0.75],
          filename: fileName,
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 800
          },
          jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: 'portrait',
            compress: true
          },
          pagebreak: {
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after'
          }
        })
        .save()
      document.head.removeChild(styleElement)
      document.head.removeChild(breakStyle)
      document.body.removeChild(offscreenRoot)
      setNotification({
        open: true,
        message: 'Note exported to PDF successfully!',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      setNotification({
        open: true,
        message: `Error exporting PDF: ${error.message}`,
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
      <Tooltip title="Import/Export">
        <IconButton
          color="inherit"
          onClick={handleButtonClick}
          sx={{ color: 'white' }}
          aria-controls={menuOpen ? 'import-export-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
        >
          <ImportExportIcon />
        </IconButton>
      </Tooltip>

      <Menu
        id="import-export-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'import-export-button'
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={() => handleActionSelect('import')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <FileUploadIcon fontSize="medium" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Import Markdown" />
        </MenuItem>
        <MenuItem onClick={() => handleActionSelect('export')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <DownloadIcon fontSize="medium" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Export as PDF" />
        </MenuItem>
        <MenuItem onClick={() => handleActionSelect('exportZip')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <FolderZipIcon fontSize="medium" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Export to ZIP (Backup)" />
        </MenuItem>
        <MenuItem onClick={() => handleActionSelect('importZip')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <UploadFileIcon fontSize="medium" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Import from ZIP (Restore)" />
        </MenuItem>
      </Menu>

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

      {}
      <Dialog
        open={openImportZipDialog}
        onClose={() => setOpenImportZipDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Restore from Backup</DialogTitle>
        <DialogContent>
          {zipSummary ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                This will import all notebooks, sections, and notes from the backup. Existing items
                with the same names will not be overwritten - duplicates will be created.
              </Alert>

              <Typography variant="h6" gutterBottom>
                Backup Summary:
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Created on:</strong> {new Date(zipSummary.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  <strong>App Version:</strong> {zipSummary.appVersion}
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Content to be imported:
              </Typography>
              <Box sx={{ pl: 2, mb: 3 }}>
                <Typography>
                  <strong>{zipSummary.notebookCount}</strong> notebooks
                </Typography>
                <Typography>
                  <strong>{zipSummary.sectionCount}</strong> sections
                </Typography>
                <Typography>
                  <strong>{zipSummary.noteCount}</strong> notes
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Notebooks:
              </Typography>
              <Box sx={{ pl: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
                {zipSummary.notebooks.map((notebook, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography>
                      <strong>{notebook.name}</strong> ({notebook.sectionCount} sections,{' '}
                      {notebook.noteCount} notes)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenImportZipDialog(false)}
            color="inherit"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            color="primary"
            disabled={isLoading || !zipSummary}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Restore Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={isLoading && !openLocationDialog && !openImportZipDialog}
      >
        {showExportProgress || showImportProgress ? (
          <Box sx={{ width: 400, bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {showExportProgress ? 'Creating Backup...' : 'Restoring Backup...'}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={showExportProgress ? exportProgress : importProgress}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              {showExportProgress
                ? `Exporting notebooks and notes (${exportProgress}%)`
                : `Importing notebooks and notes (${importProgress}%)`}
            </Typography>
          </Box>
        ) : (
          <CircularProgress color="inherit" />
        )}
      </Backdrop>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ImportExport
