/*
This component is for the Delete Dialog in the navbar.
It handles the UI and updating the state after deleting notebooks, sections, notes

This code block is needed to implement FR11, FR12, FR13
which mention being able to delete and manage notebooks, sections and notes
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
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Alert
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

const DeleteDialog = () => {
  const [open, setOpen] = useState(false)
  const [deleteNotebook, setDeleteNotebook] = useState(false)
  const [deleteSection, setDeleteSection] = useState(false)
  const [deleteNote, setDeleteNote] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  const {
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote,
    setSelectedNote
  } = useNotebook()

  const { deleteNotebookItem, deleteSectionItem, deleteNoteItem } = useNotebookData()

  // Selecting the most specific item on open makes the most sense and as it is was the user most likely intended
  const handleOpen = () => {
    setOpen(true)
    setError(null)

    if (selectedNote) {
      // If a note is selected, only check the note by default
      setDeleteNote(true)
      setDeleteSection(false)
      setDeleteNotebook(false)
    } else if (selectedSection) {
      // If a section is selected (but no note), only check the section
      setDeleteNote(false)
      setDeleteSection(true)
      setDeleteNotebook(false)
    } else if (selectedNotebook) {
      // If only a notebook is selected, check the notebook
      setDeleteNote(false)
      setDeleteSection(false)
      setDeleteNotebook(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setError(null)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      // Delete in the order: note -> section -> notebook

      // Delete note if selected and checked
      if (deleteNote && selectedNote) {
        const noteSuccess = await deleteNoteItem(
          selectedNotebook._id,
          selectedSection._id,
          selectedNote._id
        )

        if (noteSuccess) {
          setSelectedNote(null)
        } else {
          throw new Error('Failed to delete note')
        }
      }

      // Delete section if selected and checked
      if (deleteSection && selectedSection) {
        const sectionSuccess = await deleteSectionItem(selectedNotebook._id, selectedSection._id)

        if (sectionSuccess) {
          setSelectedSection(null)
          setSelectedNote(null)
        } else {
          throw new Error('Failed to delete section')
        }
      }

      // Delete notebook if selected and checked
      if (deleteNotebook && selectedNotebook) {
        const notebookSuccess = await deleteNotebookItem(selectedNotebook._id)

        if (notebookSuccess) {
          setSelectedNotebook(null)
          setSelectedSection(null)
          setSelectedNote(null)
        } else {
          throw new Error('Failed to delete notebook')
        }
      }

      handleClose()
    } catch (err) {
      console.error('Error in deletion:', err)
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }
  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        sx={{ mr: 1 }}
        title="Delete"
        disabled={!selectedNotebook && !selectedSection && !selectedNote}
      >
        <DeleteIcon />
      </IconButton>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <FormGroup>
            {selectedNotebook && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deleteNotebook}
                    onChange={() => {
                      // When selecting notebook, deselect others
                      // It makes sense to only have one selection at a time
                      setDeleteNotebook(true)
                      setDeleteSection(false)
                      setDeleteNote(false)
                    }}
                  />
                }
                label={`Notebook: ${selectedNotebook.name}`}
              />
            )}

            {selectedSection && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deleteSection}
                    onChange={() => {
                      setDeleteNotebook(false)
                      setDeleteSection(true)
                      setDeleteNote(false)
                    }}
                  />
                }
                label={`Section: ${selectedSection.title}`}
              />
            )}

            {selectedNote && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deleteNote}
                    onChange={() => {
                      setDeleteNotebook(false)
                      setDeleteSection(false)
                      setDeleteNote(true)
                    }}
                  />
                }
                label={`Note: ${selectedNote.title}`}
              />
            )}
          </FormGroup>

          {/* Alert messages when deleting a section or entire notebook */}
          {deleteNotebook && selectedNotebook && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Deleting this notebook will also delete all its sections and notes.
            </Alert>
          )}

          {deleteSection && selectedSection && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Deleting this section will also delete all its notes.
            </Alert>
          )}

          {!selectedNotebook && !selectedSection && !selectedNote && (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              Please select a notebook, section, or note to delete.
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={
              isDeleting ||
              ((!selectedNotebook || !deleteNotebook) &&
                (!selectedSection || !deleteSection) &&
                (!selectedNote || !deleteNote))
            }
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeleteDialog
