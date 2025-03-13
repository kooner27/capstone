import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getUserNotebooks, createNotebook,
  getSections, createSection,
  getNotes, createNote, updateNote,
  exportNotebookData, importNotebookData
} from '../api/notebook'

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
        editStartContent,
        // UI actions
        toggleEditMode,
        cancelEdit,
        updatePageContent,
        // CRUD operations
        createNotebook: handleCreateNotebook,
        createSection: handleCreateSection,
        createNote: handleCreateNote,
        updateNote: handleUpdateNote,
        // Refetch methods
        refreshNotebooks: fetchNotebooks,
        refreshSections: (notebookId) => fetchSections(notebookId),
        refreshNotes: (notebookId, sectionId) => fetchNotes(notebookId, sectionId),
        // API functions
        fetchNotebooks,
        handleCreateNotebook,
        handleCreateSection,
        handleCreateNote,
        handleUpdateNote,
        // Import/Export functions
        exportData: async () => {
          setIsLoading(true);
          setError(null);
          try {
            const data = await exportNotebookData();
            return data;
          } catch (err) {
            console.error('Error exporting data:', err);
            setError(err.message);
            return null;
          } finally {
            setIsLoading(false);
          }
        },
        importData: async (markdownContent) => {
          setIsLoading(true);
          setError(null);
          try {
            // Just parse the markdown, don't create the note yet
            const parsedData = await importNotebookData(markdownContent);
            return parsedData;
          } catch (err) {
            console.error('Error parsing markdown:', err);
            setError(err.message);
            return { success: false, error: err.message };
          } finally {
            setIsLoading(false);
          }
        },
        // Function to create a note from imported markdown
        createImportedNote: async (notebookId, sectionId, title, content) => {
          setIsLoading(true);
          setError(null);
          try {
            const newNote = await createNote(notebookId, sectionId, title, content);
            // Refresh notes after creating the new one
            await fetchNotes(notebookId, sectionId);
            return { success: true, note: newNote };
          } catch (err) {
            console.error('Error creating imported note:', err);
            setError(err.message);
            return { success: false, error: err.message };
          } finally {
            setIsLoading(false);
          }
        }
      }}
    >
      {children}
    </NotebookContext.Provider>
  )
}