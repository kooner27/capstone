import { useState, useEffect } from 'react'
import { useNotebook } from './NotebookContext'
import { useNotebookData } from './NotebookDataContext'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import AddIcon from '@mui/icons-material/Add'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder' // Add this line
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import FolderIcon from '@mui/icons-material/Folder'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const Sidebar = () => {
  // Get selection state from NotebookContext
  const {
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote,
    setSelectedNote
  } = useNotebook()

  // Get data and operations from NotebookDataContext
  const {
    notebooks,
    sections,
    notes,
    isLoading,
    error,
    createNotebook,
    createSection,
    createNote
  } = useNotebookData()

  // Dialog states
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  // Handle keyboard shortcut (Enter) for dialogs
  const [dialogSubmitEnabled, setDialogSubmitEnabled] = useState(false)

  useEffect(() => {
    setDialogSubmitEnabled(newItemName.trim() !== '')
  }, [newItemName])

  // Common list item styles
  const listItemStyles = {
    minHeight: 48,
    '& .MuiListItemText-primary': {
      fontSize: '0.875rem',
      lineHeight: 1.25,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }

  // Dialog handlers
  const handleOpenNotebookDialog = () => {
    setNewItemName('')
    setIsNotebookDialogOpen(true)
  }

  const handleOpenSectionDialog = () => {
    setNewItemName('')
    setIsSectionDialogOpen(true)
  }

  const handleOpenNoteDialog = () => {
    console.log('fnnejnejfnefnjef')
    setNewItemName('')
    setIsNoteDialogOpen(true)
  }

  const handleCloseDialogs = () => {
    setIsNotebookDialogOpen(false)
    setIsSectionDialogOpen(false)
    setIsNoteDialogOpen(false)
  }

  const handleCreateNotebook = async () => {
    if (newItemName.trim()) {
      // Show loading state could be added here
      const notebook = await createNotebook(newItemName.trim())
      if (notebook) {
        setSelectedNotebook(notebook)
      }
      handleCloseDialogs()
    }
  }

  const handleCreateSection = async () => {
    if (newItemName.trim() && selectedNotebook) {
      // Show loading state could be added here
      const section = await createSection(selectedNotebook._id, newItemName.trim())
      if (section) {
        setSelectedSection(section)
      }
      handleCloseDialogs()
    }
  }

  const generateDefaultContent = (title) => {
    return `# ${title}\n\nThis is a sample markdown page. You can use **bold** or *italic* text.\n\n## Code Example\n\n\`\`\`javascript\nfunction hello() {\nconsole.log("Hello, world!");\n  return "Hello";\n}\n\`\`\`\n\n### Lists\n\n- Item one\n- Item two\n- Item three`;
  };

  const handleCreateNote = async () => {
    if (newItemName.trim() && selectedNotebook && selectedSection) {
      // Generate default content for the new note
      const defaultContent = generateDefaultContent(newItemName.trim());
      
      // Create note with content already set
      const note = await createNote(
        selectedNotebook._id, 
        selectedSection._id, 
        newItemName.trim(),
        defaultContent
      );
      
      if (note) {
        setSelectedNote(note);
      }
      handleCloseDialogs();
    }
  };
  
  // Handle keyboard enter key for dialogs
  const handleKeyPress = (event, createFn) => {
    if (event.key === 'Enter' && dialogSubmitEnabled) {
      createFn()
    }
  }

  // Loading and error states
  if (isLoading && !notebooks.length) {
    return (
      <Box
        sx={{
          width: 400,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error && !notebooks.length) {
    return (
      <Box
        sx={{
          width: 400,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography color="error">Error: {error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    )
  }

  // Notebooks view (first level)
  if (!selectedNotebook) {
    return (
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 56, px: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookmarkIcon fontSize="small" color="white" />
            <Typography variant="subtitle2" noWrap sx={{ maxWidth: 110 }}>
              Notebooks
            </Typography>
          </Box>
          <Tooltip title="Create new notebook" placement="bottom" TransitionComponent={Zoom}>
            <IconButton
              onClick={handleOpenNotebookDialog}
              size="small"
              sx={{
                flexShrink: 0,
                borderRadius: 1.5,
                color: 'white'
              }}
            >
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider />
        <List dense>
          {notebooks.map((notebook) => (
            <ListItem
              button
              key={notebook._id}
              onClick={() => setSelectedNotebook(notebook)}
              sx={{
                ...listItemStyles,
                borderRadius: 1,
                mx: 0.5,
                mb: 0.5
              }}
            >
              <Box component="span" sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                <BookmarkIcon fontSize="small" color="primary" />
              </Box>
              <ListItemText
                primary={notebook.name}
                primaryTypographyProps={{
                  noWrap: true,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              />
            </ListItem>
          ))}
          {!notebooks.length && !isLoading && (
            <ListItem>
              <ListItemText
                primary="No notebooks found"
                secondary="Create a notebook to get started"
              />
            </ListItem>
          )}
        </List>

        {/* Create Notebook Dialog */}
        <Dialog
          open={isNotebookDialogOpen}
          onClose={handleCloseDialogs}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 360,
              maxWidth: 'sm',
              overflow: 'auto'
            }
          }}
        >
          <DialogTitle
            sx={{
              py: 2,
              px: 3,
              fontWeight: 600,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            Create New Notebook
          </DialogTitle>
          <DialogContent sx={{ pt: 4, pb: 4 }}>
            <TextField
              autoFocus
              fullWidth
              label="Notebook Name"
              placeholder="My Amazing Notebook"
              variant="outlined"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleCreateNotebook)}
              sx={{ mb: 1, mt: 3 }}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, display: 'flex' }}>
                    <BookmarkIcon sx={{ color: 'white' }} />
                  </Box>
                ),
                sx: { borderRadius: 1.5 }
              }}
            />
            <DialogContentText
              sx={{
                mt: 3,
                mb: 2,
                fontSize: '0.875rem',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              Create a notebook to organize your thoughts and ideas.
            </DialogContentText>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 4,
              pt: 2,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Button
              onClick={handleCloseDialogs}
              color="inherit"
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNotebook}
              variant="contained"
              color="primary"
              disabled={!newItemName.trim()}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                px: 3,
                fontWeight: 500
              }}
            >
              Create Notebook
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  // Sections and Notes view (second level)
  return (
    <Box sx={{ width: 600, display: 'flex' }}>
      {/* Sections Column */}
      <Box
        sx={{
          width: 300,
          borderRight: 1,
          borderColor: 'divider',
          overflow: 'hidden' // Ensure no overflow in the section column
        }}
      >
        <Toolbar
          sx={{
            minHeight: 56,
            px: 2,
            display: 'flex',
            justifyContent: 'space-between',
            overflow: 'hidden' // Prevent toolbar overflow
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: 1
            }}
          >
            <Tooltip title="Back to notebooks" placement="bottom">
              <IconButton
                onClick={() => setSelectedNotebook(null)}
                size="small"
                sx={{
                  flexShrink: 0,
                  color: 'white'
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                maxWidth: 'calc(100% - 60px)' // Account for back button and spacing
              }}
            >
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
              >
                {selectedNotebook.name}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Create new section" placement="bottom" TransitionComponent={Zoom}>
            <IconButton
              onClick={handleOpenSectionDialog}
              size="small"
              sx={{
                flexShrink: 0,
                borderRadius: 1.5,
                color: 'white'
              }}
            >
              <CreateNewFolderIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider />
        {isLoading && !sections.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {sections.map((section) => (
              <ListItem
                button
                key={section._id}
                selected={selectedSection && selectedSection._id === section._id}
                onClick={() => {
                  setSelectedSection(section)
                  setSelectedNote(null)
                }}
                sx={{
                  ...listItemStyles,
                  borderRadius: 1,
                  mx: 0.5,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }
                }}
              >
                <Box component="span" sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                  <FolderIcon
                    fontSize="small"
                    color={
                      selectedSection && selectedSection._id === section._id ? 'primary' : 'action'
                    }
                  />
                </Box>
                <ListItemText
                  primary={section.title}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontWeight: selectedSection && selectedSection._id === section._id ? 600 : 500,
                    fontSize: '0.875rem'
                  }}
                />
              </ListItem>
            ))}
            {!sections.length && !isLoading && (
              <ListItem>
                <ListItemText
                  primary="No sections found"
                  secondary="Create a new section to get started"
                />
              </ListItem>
            )}
          </List>
        )}

        {/* Create Section Dialog */}
        <Dialog
          open={isSectionDialogOpen}
          onClose={handleCloseDialogs}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 360,
              maxWidth: 'sm'
            }
          }}
        >
          <DialogTitle
            sx={{
              py: 2,
              px: 3,
              fontWeight: 600,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            Create New Section
          </DialogTitle>
          <DialogContent sx={{ pt: 6, pb: 4 }}>
            <TextField
              autoFocus
              fullWidth
              label="Section Title"
              placeholder="e.g., Meeting Notes, Ideas, Tasks"
              variant="outlined"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleCreateSection)}
              sx={{ mb: 1, mt: 3 }}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, display: 'flex' }}>
                    <FolderIcon sx={{ color: 'white' }} />
                  </Box>
                ),
                sx: { borderRadius: 1.5 }
              }}
            />
            <DialogContentText
              sx={{
                mt: 2,
                fontSize: '0.875rem',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              Sections help you organize your notes within this notebook.
            </DialogContentText>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              pt: 1,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Button
              onClick={handleCloseDialogs}
              color="inherit"
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSection}
              variant="contained"
              color="primary"
              disabled={!newItemName.trim()}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                px: 3,
                fontWeight: 500
              }}
            >
              Create Section
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Notes Column */}
      <Box sx={{ width: 300 }}>
        <Toolbar
          sx={{
            minHeight: 56,
            px: 2,
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 'calc(100% - 60px)' // Account for the New button
            }}
          >
            {selectedSection ? `${selectedSection.title}` : 'Select a section'}
          </Typography>
          {selectedSection && (
            <Tooltip title="Create new note" placement="bottom" TransitionComponent={Zoom}>
              <IconButton
                onClick={handleOpenNoteDialog}
                size="small"
                sx={{
                  flexShrink: 0,
                  borderRadius: 1.5,
                  color: 'white'
                }}
              >
                <LibraryAddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
        <Divider />
        {isLoading && selectedSection && !notes.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {selectedSection &&
              notes.map((note) => (
                <ListItem
                  button
                  key={note._id}
                  selected={selectedNote && selectedNote._id === note._id}
                  onClick={() => setSelectedNote(note)}
                  sx={{
                    ...listItemStyles,
                    borderRadius: 1,
                    mx: 0.5,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }
                  }}
                >
                  <Box component="span" sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    <StickyNote2Icon
                      fontSize="small"
                      color={selectedNote && selectedNote._id === note._id ? 'primary' : 'action'}
                    />
                  </Box>
                  <ListItemText
                    primary={note.title}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontWeight: selectedNote && selectedNote._id === note._id ? 600 : 500,
                      fontSize: '0.875rem'
                    }}
                  />
                </ListItem>
              ))}
            {selectedSection && !notes.length && !isLoading && (
              <ListItem>
                <ListItemText
                  primary="No notes found"
                  secondary="Create a new note to get started"
                />
              </ListItem>
            )}
            {!selectedSection && (
              <ListItem>
                <ListItemText primary="Select a section to view notes" />
              </ListItem>
            )}
          </List>
        )}

        {/* Create Note Dialog */}
        <Dialog
          open={isNoteDialogOpen}
          onClose={handleCloseDialogs}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 360,
              maxWidth: 'sm'
            }
          }}
        >
          <DialogTitle
            sx={{
              py: 2,
              px: 3,
              fontWeight: 600,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            Create New Note
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Note Title"
              placeholder="What's this note about?"
              variant="outlined"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleCreateNote)}
              sx={{ mb: 1, mt: 3 }}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, display: 'flex' }}>
                    <StickyNote2Icon sx={{ color: 'white' }} />
                  </Box>
                ),
                sx: { borderRadius: 1.5 }
              }}
            />
            <DialogContentText
              sx={{
                mt: 2,
                fontSize: '0.875rem',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              Notes will be created in the "{selectedSection?.title}" section.
            </DialogContentText>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              pt: 1,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Button
              onClick={handleCloseDialogs}
              color="inherit"
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNote}
              variant="contained"
              color="primary"
              disabled={!newItemName.trim()}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                px: 3,
                fontWeight: 500
              }}
            >
              Create Note
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default Sidebar
