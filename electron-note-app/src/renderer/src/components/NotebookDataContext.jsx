import { createContext, useContext, useState } from 'react'
import {
  getUserNotebooks,
  createNotebook as apiCreateNotebook,
  getSections,
  createSection as apiCreateSection,
  getNotes,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote
} from '../api/notebook'
import { deleteNotebook, deleteSection, deleteNote } from '../api/delete'

const NotebookDataContext = createContext()

export const useNotebookData = () => useContext(NotebookDataContext)

export const NotebookDataProvider = ({ children }) => {
  const [notebooks, setNotebooks] = useState([])
  const [sections, setSections] = useState([])
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNotebooks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getUserNotebooks()
      setNotebooks(data)
      return data
    } catch (err) {
      console.error('Error fetching notebooks:', err)
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSections = async (notebookId) => {
    if (!notebookId) return []

    setIsLoading(true)
    setError(null)
    try {
      const data = await getSections(notebookId)
      setSections(data)
      return data
    } catch (err) {
      console.error('Error fetching sections:', err)
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotes = async (notebookId, sectionId) => {
    if (!notebookId || !sectionId) return []

    setIsLoading(true)
    setError(null)
    try {
      const data = await getNotes(notebookId, sectionId)
      setNotes(data)
      return data
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const createNotebook = async (name) => {
    setIsLoading(true)
    setError(null)
    try {
      const newNotebook = await apiCreateNotebook(name)
      setNotebooks((prev) => [...prev, newNotebook])
      return newNotebook
    } catch (err) {
      console.error('Error creating notebook:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createSection = async (notebookId, title) => {
    if (!notebookId) return null

    setIsLoading(true)
    setError(null)
    try {
      const newSection = await apiCreateSection(notebookId, title)
      setSections((prev) => [...prev, newSection])
      return newSection
    } catch (err) {
      console.error('Error creating section:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createNote = async (notebookId, sectionId, title, content = '') => {
    if (!notebookId || !sectionId) return null

    setIsLoading(true)
    setError(null)
    try {
      const newNote = await apiCreateNote(notebookId, sectionId, title, content)
      setNotes((prev) => [...prev, newNote])
      return newNote
    } catch (err) {
      console.error('Error creating note:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateNote = async (notebookId, sectionId, noteId, title, content) => {
    if (!notebookId || !sectionId || !noteId) {
      console.error('Missing required parameters for updateNote:', {
        notebookId,
        sectionId,
        noteId
      })
      return false
    }

    if (content === undefined || content === null) {
      console.error('Attempted to update note with undefined/null content')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Sending note update to API with content:', content)

      await apiUpdateNote(notebookId, sectionId, noteId, title, content)

      setNotes((prev) => prev.map((n) => (n._id === noteId ? { ...n, title, content } : n)))

      console.log('Note updated successfully')
      return true
    } catch (err) {
      console.error('Error updating note:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Delete Functionality
  const deleteNotebookItem = async (notebookId) => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteNotebook(notebookId)

      // Update local state by filtering out the deleted notebook
      setNotebooks((prevNotebooks) => prevNotebooks.filter((nb) => nb._id !== notebookId))

      return true
    } catch (err) {
      console.error('Error deleting notebook:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Delete section function
  const deleteSectionItem = async (notebookId, sectionId) => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteSection(notebookId, sectionId)

      // Update local state by filtering out the deleted section
      setSections((prevSections) => prevSections.filter((s) => s._id !== sectionId))

      return true
    } catch (err) {
      console.error('Error deleting section:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Delete note function
  const deleteNoteItem = async (notebookId, sectionId, noteId) => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteNote(notebookId, sectionId, noteId)

      // Update local state by filtering out the deleted note
      setNotes((prevNotes) => prevNotes.filter((n) => n._id !== noteId))

      return true
    } catch (err) {
      console.error('Error deleting note:', err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    notebooks,
    sections,
    notes,
    isLoading,
    error,

    fetchNotebooks,
    fetchSections,
    fetchNotes,
    createNotebook,
    createSection,
    createNote,
    updateNote,
    deleteNoteItem,
    deleteSectionItem,
    deleteNotebookItem
  }

  return <NotebookDataContext.Provider value={value}>{children}</NotebookDataContext.Provider>
}
