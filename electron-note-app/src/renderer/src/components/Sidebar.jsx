/*
This code block is our side bar component.
It handles notebook hierarchy management which is section 4.4 of our SRS
It covers FR11, FR12, FR13
*/
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
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import FolderIcon from '@mui/icons-material/Folder'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// Consistent divider styling
const dividerStyle = {
  borderColor: 'rgba(30, 30, 30, 0.9)',
  backgroundColor: 'rgba(30, 30, 30, 0.9)',
  opacity: 1,
  height: '1px'
}

const generateDefaultContent = (title) => {
  return `# ${title}\n\nThis is a sample markdown page. You can use **bold** or *italic* text.\n\n## Code Example\n\n\`\`\`javascript\nfunction hello() {\nconsole.log("Hello, world!");\n  return "Hello";\n}\n\`\`\`\n\n### Lists\n\n- Item one\n- Item two\n- Item three`
}

const Sidebar = () => {
  const {
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote,
    setSelectedNote
  } = useNotebook()

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

  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const [dialogSubmitEnabled, setDialogSubmitEnabled] = useState(false)

  useEffect(() => {
    setDialogSubmitEnabled(typeof newItemName === 'string' && newItemName.trim() !== '')
  }, [newItemName])

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

  const handleOpenNotebookDialog = () => {
    setNewItemName('')
    setIsNotebookDialogOpen(true)
  }

  const handleOpenSectionDialog = () => {
    setNewItemName('')
    setIsSectionDialogOpen(true)
  }

  const handleOpenNoteDialog = () => {
    setNewItemName('')
    setIsNoteDialogOpen(true)
  }

  const handleCloseDialogs = () => {
    setIsNotebookDialogOpen(false)
    setIsSectionDialogOpen(false)
    setIsNoteDialogOpen(false)
  }

  const handleCreateNotebook = async () => {
    if (typeof newItemName === 'string' && newItemName.trim()) {
      const notebook = await createNotebook(newItemName.trim())
      if (notebook) {
        setSelectedNotebook(notebook)
      }
      handleCloseDialogs()
    }
  }

  const handleCreateSection = async () => {
    if (typeof newItemName === 'string' && newItemName.trim() && selectedNotebook) {
      const section = await createSection(selectedNotebook._id, newItemName.trim())
      if (section) {
        setSelectedSection(section)
      }
      handleCloseDialogs()
    }
  }

  const handleCreateNote = async () => {
    if (
      typeof newItemName === 'string' &&
      newItemName.trim() &&
      selectedNotebook &&
      selectedSection
    ) {
      const defaultContent = generateDefaultContent(newItemName.trim())

      const note = await createNote(
        selectedNotebook._id,
        selectedSection._id,
        newItemName.trim(),
        defaultContent
      )

      if (note) {
        setSelectedNote(note)
      }
      handleCloseDialogs()
    }
  }

  const handleKeyPress = (event, createFn) => {
    if (event.key === 'Enter' && dialogSubmitEnabled) {
      createFn()
    }
  }

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

  if (!selectedNotebook) {
    return (
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 56, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 40 }}>
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
                color: 'white',
                height: 40,
                width: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider sx={dividerStyle} />
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
              disabled={!dialogSubmitEnabled}
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

  return (
    <Box sx={{ width: 600, display: 'flex' }}>
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <Toolbar
          sx={{
            minHeight: 56,
            px: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: 1,
              height: 40
            }}
          >
            <Tooltip title="Back to notebooks" placement="bottom">
              <IconButton
                onClick={() => setSelectedNotebook(null)}
                size="small"
                sx={{
                  flexShrink: 0,
                  color: 'white',
                  height: 40,
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
                maxWidth: 'calc(100% - 60px)',
                display: 'flex',
                alignItems: 'center'
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
                color: 'white',
                height: 40,
                width: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CreateNewFolderIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider sx={dividerStyle} />
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
              disabled={!dialogSubmitEnabled}
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

      <Box sx={{ width: 300 }}>
        <Toolbar
          sx={{
            minHeight: 56,
            px: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ height: 40, display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden', mr: 1 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
            >
              {selectedSection ? `${selectedSection.title}` : 'Select a section'}
            </Typography>
          </Box>
          {selectedSection && (
            <Tooltip title="Create new note" placement="bottom" TransitionComponent={Zoom}>
              <IconButton
                onClick={handleOpenNoteDialog}
                size="small"
                sx={{
                  flexShrink: 0,
                  borderRadius: 1.5,
                  color: 'white',
                  height: 40,
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LibraryAddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
        <Divider sx={dividerStyle} />
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
              disabled={!dialogSubmitEnabled}
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