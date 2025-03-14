import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getUserNotebooks, createNotebook,
  getSections, createSection,
  getNotes, createNote, updateNote
} from '../api/notebook'
import { useNotebookData } from './NotebookDataContext'

const NotebookContext = createContext()

export const useNotebook = () => useContext(NotebookContext)

export const NotebookProvider = ({ children }) => {
  // Get data operations from NotebookDataContext
  const { 
    fetchNotebooks, fetchSections, fetchNotes, 
    createNotebook: dataCreateNotebook,
    createSection: dataCreateSection,
    createNote: dataCreateNote,
    updateNote: dataUpdateNote,
    notebooks, sections, notes, isLoading, error 
  } = useNotebookData()
  
  // Selection state
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  
  // Edit state
  const [isEditMode, setIsEditMode] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
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
      setEditStartContent(selectedNote.content || '')
      console.log('Original content set:', selectedNote.content || '')
    }
  }, [selectedNote])

  // Toggle edit mode - enter or exit edit mode
  const toggleEditMode = () => {
    if (!isEditMode) {
      // Entering edit mode - capture original content for potential cancel
      if (selectedNote) {
        // Store content at edit start time
        setEditStartContent(selectedNote.content || '')
        console.log('Edit start content captured:', selectedNote.content || '')
      }
      setIsEditMode(true)
      setIsPreviewMode(false) // Start in edit mode, not preview mode
    } else {
      // Exiting edit mode
      setIsEditMode(false)
      setIsPreviewMode(false) // Reset preview mode when exiting edit mode
    }
  }

  // Save content without exiting edit mode
  const saveContent = () => {
    if (selectedNote && isDirty) {
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
      setEditStartContent(selectedNote.content || '')
      setIsDirty(false)
      return true
    }
    return false
  }

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
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
    setIsPreviewMode(false)
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
    isPreviewMode,
    isDirty,
    editCanceled,
    setEditCanceled,
    originalNoteContent,
    editStartContent,
    setIsPreviewMode,
    
    // UI actions
    toggleEditMode,
    saveContent,
    togglePreviewMode,
    cancelEdit,
    updatePageContent,
    
    // Pass through data operations (for convenience)
    updateNote: dataUpdateNote,
    
    // Add these for the Import component
    refreshNotebooks: fetchNotebooks,
    refreshSections: fetchSections,
    createNotebook: dataCreateNotebook,
    createSection: dataCreateSection,
    createNote: dataCreateNote
  }

  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  )
}