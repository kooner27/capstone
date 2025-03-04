import { useState } from 'react'
import { useNotebook } from './NotebookContext'
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Toolbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

const Sidebar = () => {
  const {
    notebooks,
    sections,
    notes,
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote,
    setSelectedNote,
    isLoading,
    error,
    createNotebook,
    createSection,
    createNote
  } = useNotebook()

  // Dialog states
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')

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
      const notebook = await createNotebook(newItemName.trim())
      if (notebook) {
        setSelectedNotebook(notebook)
      }
      handleCloseDialogs()
    }
  }

  const handleCreateSection = async () => {
    if (newItemName.trim() && selectedNotebook) {
      const section = await createSection(selectedNotebook._id, newItemName.trim())
      if (section) {
        setSelectedSection(section)
      }
      handleCloseDialogs()
    }
  }

  const handleCreateNote = async () => {
    if (newItemName.trim() && selectedNotebook && selectedSection) {
      const note = await createNote(
        selectedNotebook._id, 
        selectedSection._id, 
        newItemName.trim()
      )
      if (note) {
        setSelectedNote(note)
      }
      handleCloseDialogs()
    }
  }

  // Loading and error states
  if (isLoading && !notebooks.length) {
    return (
      <Box 
        sx={{ 
          width: 240, 
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
          width: 240, 
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
      <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 56, px: 2, justifyContent: 'space-between' }}>
          <Typography variant="h6">Notebooks</Typography>
          <Button 
            size="small" 
            startIcon={<AddIcon />}
            onClick={handleOpenNotebookDialog}
          >
            New
          </Button>
        </Toolbar>
        <Divider />
        <List dense>
          {notebooks.map((notebook) => (
            <ListItem
              button
              key={notebook._id}
              onClick={() => setSelectedNotebook(notebook)}
              sx={listItemStyles}
            >
              <ListItemText 
                primary={notebook.name}
                primaryTypographyProps={{ noWrap: true }}
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
        <Dialog open={isNotebookDialogOpen} onClose={handleCloseDialogs}>
          <DialogTitle>Create New Notebook</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter a name for your new notebook:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Notebook Name"
              fullWidth
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button onClick={handleCreateNotebook} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  // Sections and Notes view (second level)
  return (
    <Box sx={{ width: 480, display: 'flex' }}>
      {/* Sections Column */}
      <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 56, px: 2, gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={() => setSelectedNotebook(null)}
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0 }}
            >
              Back
            </Button>
            <Typography variant="h6" noWrap>
              {selectedNotebook.name}
            </Typography>
          </Box>
          <Button 
            size="small" 
            startIcon={<AddIcon />}
            onClick={handleOpenSectionDialog}
          >
            New
          </Button>
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
                  setSelectedSection(section);
                  setSelectedNote(null);
                }}
                sx={listItemStyles}
              >
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{ noWrap: true }}
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
        <Dialog open={isSectionDialogOpen} onClose={handleCloseDialogs}>
          <DialogTitle>Create New Section</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter a title for your new section:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Section Title"
              fullWidth
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button onClick={handleCreateSection} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Notes Column */}
      <Box sx={{ width: 240 }}>
        <Toolbar sx={{ minHeight: 56, px: 2, justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap>
            {selectedSection ? `Notes in ${selectedSection.title}` : 'Select a section'}
          </Typography>
          {selectedSection && (
            <Button 
              size="small" 
              startIcon={<AddIcon />}
              onClick={handleOpenNoteDialog}
              disabled={!selectedSection}
            >
              New
            </Button>
          )}
        </Toolbar>
        <Divider />
        {isLoading && selectedSection && !notes.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {selectedSection && notes.map((note) => (
              <ListItem
                button
                key={note._id}
                selected={selectedNote && selectedNote._id === note._id}
                onClick={() => setSelectedNote(note)}
                sx={listItemStyles}
              >
                <ListItemText 
                  primary={note.title}
                  primaryTypographyProps={{ noWrap: true }}
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
        <Dialog open={isNoteDialogOpen} onClose={handleCloseDialogs}>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter a title for your new note:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Note Title"
              fullWidth
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button onClick={handleCreateNote} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default Sidebar