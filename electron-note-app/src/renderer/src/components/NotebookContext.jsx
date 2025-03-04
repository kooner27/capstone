import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getUserNotebooks, createNotebook,
  getSections, createSection,
  getNotes, createNote, updateNote
} from '../api/notebook'

const NotebookContext = createContext()

export const useNotebook = () => useContext(NotebookContext)

export const NotebookProvider = ({ children }) => {
  // API data
  const [notebooks, setNotebooks] = useState([])
  const [sections, setSections] = useState([])
  const [notes, setNotes] = useState([])
  
  // UI state
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedPage, setSelectedPage] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [editCanceled, setEditCanceled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Critical fix: Store original content in a dedicated variable that won't be affected by editing
  const [originalNoteContent, setOriginalNoteContent] = useState('')
  const [editStartContent, setEditStartContent] = useState('')

  // Load notebooks on initial render
  useEffect(() => {
    fetchNotebooks()
  }, [])

  // Load sections when a notebook is selected
  useEffect(() => {
    if (selectedNotebook) {
      fetchSections(selectedNotebook._id)
      setSelectedSection(null)
      setSelectedPage(null)
      setSelectedNote(null)
    }
  }, [selectedNotebook])

  // Load notes when a section is selected
  useEffect(() => {
    if (selectedNotebook && selectedSection) {
      fetchNotes(selectedNotebook._id, selectedSection._id)
      setSelectedPage(null)
      setSelectedNote(null)
    }
  }, [selectedSection])

  // Update selected page and original content when a note is selected
  useEffect(() => {
    if (selectedNote) {
      setSelectedPage(selectedNote.title)
      // Store original content for cancellation
      setOriginalNoteContent(selectedNote.content || '')
      console.log('Original content set:', selectedNote.content || '')
    }
  }, [selectedNote])

  // API Functions
  const fetchNotebooks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getUserNotebooks()
      setNotebooks(data)
    } catch (err) {
      console.error('Error fetching notebooks:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSections = async (notebookId) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSections(notebookId)
      setSections(data)
    } catch (err) {
      console.error('Error fetching sections:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotes = async (notebookId, sectionId) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getNotes(notebookId, sectionId)
      setNotes(data)
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Create operations
  const handleCreateNotebook = async (name) => {
    setIsLoading(true)
    setError(null)
    try {
      const newNotebook = await createNotebook(name)
      setNotebooks([...notebooks, newNotebook])
      return newNotebook
    } catch (err) {
      console.error('Error creating notebook:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSection = async (notebookId, title) => {
    setIsLoading(true)
    setError(null)
    try {
      const newSection = await createSection(notebookId, title)
      setSections([...sections, newSection])
      return newSection
    } catch (err) {
      console.error('Error creating section:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async (notebookId, sectionId, title, content = '') => {
    setIsLoading(true)
    setError(null)
    try {
      const newNote = await createNote(notebookId, sectionId, title, content)
      setNotes([...notes, newNote])
      return newNote
    } catch (err) {
      console.error('Error creating note:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateNote = async (notebookId, sectionId, noteId, title, content) => {
    setIsLoading(true)
    setError(null)
    try {
      await updateNote(notebookId, sectionId, noteId, title, content)
      setNotes(notes.map(n => 
        n._id === noteId ? { ...n, title, content } : n
      ))
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote({ ...selectedNote, title, content })
        // Update original content after saving
        setOriginalNoteContent(content)
      }
    } catch (err) {
      console.error('Error updating note:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // UI state management
  const toggleEditMode = (save = false) => {
    if (isEditMode) {
      // Exiting edit mode
      if (save && selectedNote) {
        // Save changes
        handleUpdateNote(
          selectedNotebook._id, 
          selectedSection._id, 
          selectedNote._id, 
          selectedNote.title, 
          selectedNote.content
        )
        // Update original content after saving
        setOriginalNoteContent(selectedNote.content || '')
        setIsDirty(false)
      } else {
        // Cancel - handled by cancelEdit
      }
    } else {
      // Entering edit mode - capture original content for potential cancel
      if (selectedNote) {
        // CRITICAL FIX: Store content at edit start time in dedicated variable
        setEditStartContent(selectedNote.content || '');
        console.log('Edit start content captured:', selectedNote.content || '');
      }
    }
    setIsEditMode(!isEditMode)
  }

  const cancelEdit = () => {
    console.log('Cancel edit called - reverting to stored content:', editStartContent)
    
    if (selectedNote) {
      // FIX: Use the dedicated edit start content variable to restore
      const revertedNote = { ...selectedNote, content: editStartContent }
      setSelectedNote(revertedNote)
      
      // CRITICAL: Set the content directly from our dedicated variable
      updatePageContent(editStartContent)
      
      // Notify components that edit was canceled
      setEditCanceled(true)
    }
    
    setIsEditMode(false)
    setIsDirty(false)
  }

  const getPageContent = (pageName) => {
    if (!selectedNote) return ''
    return selectedNote.content || ''
  }

  const updatePageContent = (content) => {
    if (selectedNote) {
      // Only update the local state, not backend
      const updatedNote = { ...selectedNote, content }
      setSelectedNote(updatedNote)
      setIsDirty(true)
    }
  }

  return (
    <NotebookContext.Provider
      value={{
        // Data
        notebooks,
        sections,
        notes,
        // Selected items
        selectedNotebook,
        setSelectedNotebook,
        selectedSection,
        setSelectedSection,
        selectedPage,
        setSelectedPage,
        selectedNote, 
        setSelectedNote,
        // UI state
        isEditMode,
        setIsEditMode,
        isDirty,
        setIsDirty,
        editCanceled,
        setEditCanceled,
        isLoading,
        error,
        // Content tracking
        originalNoteContent,
        setOriginalNoteContent,
        editStartContent, // IMPORTANT: Expose this to components
        // UI actions
        toggleEditMode,
        cancelEdit,
        getPageContent,
        updatePageContent,
        // CRUD operations
        createNotebook: handleCreateNotebook,
        createSection: handleCreateSection,
        createNote: handleCreateNote,
        updateNote: handleUpdateNote,
        // Refetch methods
        refreshNotebooks: fetchNotebooks,
        refreshSections: (notebookId) => fetchSections(notebookId),
        refreshNotes: (notebookId, sectionId) => fetchNotes(notebookId, sectionId)
      }}
    >
      {children}
    </NotebookContext.Provider>
  )
}