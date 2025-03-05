import { createContext, useContext, useState, useEffect } from 'react'
import { useNotebookData } from './NotebookDataContext'

const NotebookContext = createContext()

export const useNotebook = () => useContext(NotebookContext)

export const NotebookProvider = ({ children }) => {
  // Get data operations from NotebookDataContext
  const { 
    fetchNotebooks, fetchSections, fetchNotes, updateNote,
    notebooks, sections, notes, isLoading, error 
  } = useNotebookData()
  
  // Selection state
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  
  // Edit state
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [editCanceled, setEditCanceled] = useState(false)
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
      setSelectedNote(null)
    }
  }, [selectedNotebook])

  // Load notes when a section is selected
  useEffect(() => {
    if (selectedNotebook && selectedSection) {
      fetchNotes(selectedNotebook._id, selectedSection._id)
      setSelectedNote(null)
    }
  }, [selectedSection])

  // Update original content when a note is selected
  useEffect(() => {
    if (selectedNote) {
      // Store original content for cancellation
      setOriginalNoteContent(selectedNote.content || '')
      console.log('Original content set:', selectedNote.content || '')
    }
  }, [selectedNote])

  // UI state management
  const toggleEditMode = (save = false) => {
    if (isEditMode) {
      // Exiting edit mode
      if (save && selectedNote && isDirty) {
        // Save changes
        updateNote(
          selectedNotebook._id, 
          selectedSection._id, 
          selectedNote._id, 
          selectedNote.title, 
          selectedNote.content
        )
        // Update original content after saving
        setOriginalNoteContent(selectedNote.content || '')
        setIsDirty(false)
      }
    } else {
      // Entering edit mode - capture original content for potential cancel
      if (selectedNote) {
        // Store content at edit start time
        setEditStartContent(selectedNote.content || '')
        console.log('Edit start content captured:', selectedNote.content || '')
      }
    }
    setIsEditMode(!isEditMode)
  }

  const cancelEdit = () => {
    console.log('Cancel edit called - reverting to stored content:', editStartContent)
    
    if (selectedNote) {
      // Use the dedicated edit start content variable to restore
      const revertedNote = { ...selectedNote, content: editStartContent }
      setSelectedNote(revertedNote)
      
      // Notify components that edit was canceled
      setEditCanceled(true)
    }
    
    setIsEditMode(false)
    setIsDirty(false)
  }

  const updatePageContent = (content) => {
    if (selectedNote) {
      // Only update the local state, not backend
      const updatedNote = { ...selectedNote, content }
      setSelectedNote(updatedNote)
      setIsDirty(true)
    }
  }

  // Context value
  const value = {
    // Data from NotebookDataContext (read-only)
    notebooks,
    sections,
    notes,
    isLoading,
    error,
    
    // Selection state
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote, 
    setSelectedNote,
    
    // Edit state
    isEditMode,
    isDirty,
    editCanceled,
    setEditCanceled,
    originalNoteContent,
    editStartContent,
    
    // UI actions
    toggleEditMode,
    cancelEdit,
    updatePageContent,
    
    // Pass through data operations (for convenience)
    updateNote
  }

  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  )
}