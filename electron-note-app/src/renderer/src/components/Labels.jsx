/*
This component is for 4.7 Labels for Organization in our SRS.
The code is required for FR22, FR23, FR25
It allows users to manage labels such as viewing, creating, and deleting them
for notebooks, sections and notes.

For FR24 which is search and filtering please see the SearchBar component
*/
import { useState } from 'react'
import { useNotebook } from './NotebookContext'
import { useNotebookData } from './NotebookDataContext'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material'
import { updateNotebookLabels, updateSectionLabels, updateNoteLabels } from '../api/labels'
import IconButton from '@mui/material/IconButton'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import FolderIcon from '@mui/icons-material/Folder'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'

const Labels = () => {
  const dividerStyle = {
    my: 2,
    borderColor: 'white',
    opacity: 0.8,
    borderBottomWidth: 2
  }
  const { fetchNotebooks, fetchSections, fetchNotes } = useNotebookData()

  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [notebookLabelInput, setNotebookLabelInput] = useState('')
  const [sectionLabelInput, setSectionLabelInput] = useState('')
  const [noteLabelInput, setNoteLabelInput] = useState('')

  const [notebookLabels, setNotebookLabels] = useState([])
  const [sectionLabels, setSectionLabels] = useState([])
  const [noteLabels, setNoteLabels] = useState([])

  const {
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote,
    setSelectedNote
  } = useNotebook()

  const handleOpen = async () => {
    try {
      if (selectedNotebook) {
        const freshNotebooks = await fetchNotebooks()
        const freshNotebook = freshNotebooks.find((nb) => nb._id === selectedNotebook._id)

        if (freshNotebook) {
          setSelectedNotebook(freshNotebook)
          setNotebookLabels(freshNotebook.labels || [])
        } else {
          setNotebookLabels(selectedNotebook.labels || [])
        }
      }

      if (selectedSection && selectedNotebook) {
        const freshSections = await fetchSections(selectedNotebook._id)
        const freshSection = freshSections.find((s) => s._id === selectedSection._id)

        if (freshSection) {
          setSelectedSection(freshSection)
          setSectionLabels(freshSection.labels || [])
        } else {
          setSectionLabels(selectedSection.labels || [])
        }
      }

      if (selectedNote && selectedNotebook && selectedSection) {
        const freshNotes = await fetchNotes(selectedNotebook._id, selectedSection._id)
        const freshNote = freshNotes.find((n) => n._id === selectedNote._id)

        if (freshNote) {
          setSelectedNote(freshNote)
          setNoteLabels(freshNote.labels || [])
        } else {
          setNoteLabels(selectedNote.labels || [])
        }
      }

      setOpen(true)
    } catch (error) {
      console.error('Error refreshing data before opening labels dialog:', error)

      if (selectedNotebook) setNotebookLabels(selectedNotebook.labels || [])
      if (selectedSection) setSectionLabels(selectedSection.labels || [])
      if (selectedNote) setNoteLabels(selectedNote.labels || [])

      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setNotebookLabelInput('')
    setSectionLabelInput('')
    setNoteLabelInput('')
    setNotebookLabels([])
    setSectionLabels([])
    setNoteLabels([])
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      if (selectedNotebook) {
        console.log('Saving notebook labels:', notebookLabels)
        await updateNotebookLabels(selectedNotebook._id, notebookLabels)

        const freshNotebooks = await fetchNotebooks()
        const freshNotebook = freshNotebooks.find((nb) => nb._id === selectedNotebook._id)

        if (freshNotebook) {
          console.log('Updating selected notebook with fresh data:', freshNotebook)
          setSelectedNotebook(freshNotebook)
        }
      }

      if (selectedSection) {
        console.log('Saving section labels:', sectionLabels)
        await updateSectionLabels(selectedNotebook._id, selectedSection._id, sectionLabels)

        if (selectedNotebook) {
          const freshSections = await fetchSections(selectedNotebook._id)
          const freshSection = freshSections.find((s) => s._id === selectedSection._id)

          if (freshSection) {
            console.log('Updating selected section with fresh data:', freshSection)
            setSelectedSection(freshSection)
          }
        }
      }

      if (selectedNote) {
        console.log('Saving note labels:', noteLabels)
        await updateNoteLabels(
          selectedNotebook._id,
          selectedSection._id,
          selectedNote._id,
          noteLabels
        )

        if (selectedNotebook && selectedSection) {
          const freshNotes = await fetchNotes(selectedNotebook._id, selectedSection._id)
          const freshNote = freshNotes.find((n) => n._id === selectedNote._id)

          if (freshNote) {
            console.log('Updating selected note with fresh data:', freshNote)
            setSelectedNote(freshNote)
          }
        }
      }

      handleClose()
    } catch (error) {
      console.error('Error saving labels:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newLabel = e.target.value.trim()
      if (!newLabel) return

      switch (type) {
        case 'notebook':
          if (!notebookLabels.includes(newLabel)) setNotebookLabels([...notebookLabels, newLabel])
          setNotebookLabelInput('')
          break
        case 'section':
          if (!sectionLabels.includes(newLabel)) setSectionLabels([...sectionLabels, newLabel])
          setSectionLabelInput('')
          break
        case 'note':
          if (!noteLabels.includes(newLabel)) setNoteLabels([...noteLabels, newLabel])
          setNoteLabelInput('')
          break
      }
    }
  }

  const handleDelete = (type, labelToDelete) => {
    switch (type) {
      case 'notebook':
        setNotebookLabels(notebookLabels.filter((l) => l !== labelToDelete))
        break
      case 'section':
        setSectionLabels(sectionLabels.filter((l) => l !== labelToDelete))
        break
      case 'note':
        setNoteLabels(noteLabels.filter((l) => l !== labelToDelete))
        break
    }
  }

  return (
    <>
      {}
      <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 1 }} title="Labels">
        <LocalOfferIcon />
      </IconButton>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Labels</DialogTitle>
        <DialogContent>
          {selectedNotebook && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <BookmarkIcon fontSize="small" />
                Notebook: {selectedNotebook.name}
              </Typography>

              <TextField
                margin="dense"
                label="Add notebook label"
                fullWidth
                value={notebookLabelInput}
                onChange={(e) => setNotebookLabelInput(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, 'notebook')}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                {notebookLabels.length > 0 ? (
                  notebookLabels.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      onDelete={() => handleDelete('notebook', label)}
                      size="large"
                      color="default"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No labels for this notebook
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {selectedNotebook && selectedSection && <Divider sx={dividerStyle} />}

          {selectedSection && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FolderIcon fontSize="small" />
                Section: {selectedSection.title}
              </Typography>

              <TextField
                margin="dense"
                label="Add section label"
                fullWidth
                value={sectionLabelInput}
                onChange={(e) => setSectionLabelInput(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, 'section')}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                {sectionLabels.length > 0 ? (
                  sectionLabels.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      onDelete={() => handleDelete('section', label)}
                      size="large"
                      color="default"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No labels for this section
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {selectedSection && selectedNote && <Divider sx={dividerStyle} />}

          {selectedNote && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <StickyNote2Icon fontSize="small" />
                Note: {selectedNote.title}
              </Typography>

              <TextField
                margin="dense"
                label="Add note label"
                fullWidth
                value={noteLabelInput}
                onChange={(e) => setNoteLabelInput(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, 'note')}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                {noteLabels.length > 0 ? (
                  noteLabels.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      onDelete={() => handleDelete('note', label)}
                      size="large"
                      color="default"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No labels for this note
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {!selectedNotebook && !selectedSection && !selectedNote && (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              Please select a notebook, section, or note to manage labels
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!selectedNotebook && !selectedSection && !selectedNote}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Labels
