// NotebookContext.jsx - Fixed version

import { createContext, useContext, useState, useEffect, useRef } from 'react'
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
  
  // Add a ref to track note changes vs. content edits
  const editingNoteRef = useRef(null)

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

  // FIXED: Update original content only when a new note is selected, not during edits
  useEffect(() => {
    if (selectedNote) {
      console.log('[DEBUG] Note selected/changed:', selectedNote._id);
      
      // Only update the originalNoteContent and editStartContent in these cases:
      // 1. We're not in edit mode (browsing notes)
      // 2. The note ID changed (switching to a different note)
      // 3. We're just starting to edit this note (editingNoteRef is null)
      if (!isEditMode || editingNoteRef.current !== selectedNote._id) {
        console.log('[DEBUG] Setting original content to:', selectedNote.content || '');
        setOriginalNoteContent(selectedNote.content || '');
        setEditStartContent(selectedNote.content || '');
        console.log('[DEBUG] Edit start content captured:', selectedNote.content || '');
      }
      
      // Always track the current note ID
      editingNoteRef.current = selectedNote._id;
    }
  }, [selectedNote, isEditMode]);

  // Toggle edit mode - enter or exit edit mode
  const toggleEditMode = () => {
    if (!isEditMode) {
      console.log('[DEBUG] Entering edit mode');
      // Entering edit mode - capture original content for potential cancel
      if (selectedNote) {
        // Store content at edit start time
        setEditStartContent(selectedNote.content || '')
        console.log('[DEBUG] Edit start content captured:', selectedNote.content || '')
      }
      setIsEditMode(true)
      setIsPreviewMode(false) // Start in edit mode, not preview mode
    } else {
      console.log('[DEBUG] Exiting edit mode');
      // Exiting edit mode - save any pending changes
      saveContent(); // Make sure content is saved when exiting edit mode
      setIsEditMode(false)
      setIsPreviewMode(false) // Reset preview mode when exiting edit mode
      
      // Reset the editing note ref when we exit edit mode
      editingNoteRef.current = null;
    }
  }

  // Save content
  const saveContent = () => {
    if (selectedNote && selectedNotebook && selectedSection) {
      console.log('[DEBUG] Saving note content:', selectedNote.content);
      
      // Check if there's actual content to save
      if (selectedNote.content === undefined || selectedNote.content === null) {
        console.error('[DEBUG] Attempted to save note with undefined/null content');
        return false;
      }
      
      // Save changes to backend
      dataUpdateNote(
        selectedNotebook._id, 
        selectedSection._id, 
        selectedNote._id, 
        selectedNote.title, 
        selectedNote.content
      );
      
      // Update original content references after saving
      console.log('[DEBUG] Updating original content after save to:', selectedNote.content);
      setOriginalNoteContent(selectedNote.content);
      setEditStartContent(selectedNote.content);
      setIsDirty(false);
      
      return true;
    }
    return false;
  }

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  // FIXED: Enhanced cancelEdit to properly restore the original content
  const cancelEdit = () => {
    console.log('[DEBUG] Cancel edit called');
    console.log('[DEBUG] Current isEditMode:', isEditMode);
    console.log('[DEBUG] Current selectedNote:', selectedNote?._id);
    console.log('[DEBUG] Reverting to content:', editStartContent);
    
    if (selectedNote) {
      // Log current state
      console.log('[DEBUG] Current note content before cancel:', selectedNote.content);
      console.log('[DEBUG] Original content to restore:', editStartContent);
      
      // First set flag for the ContentArea to know we're canceling
      console.log('[DEBUG] Setting editCanceled flag to true');
      setEditCanceled(true);
      
      // Exit edit mode first to ensure view mode will render the correct content
      console.log('[DEBUG] Exiting edit mode');
      setIsEditMode(false);
      setIsPreviewMode(false);
      setIsDirty(false);
      
      // Reset the editing reference
      editingNoteRef.current = null;
      
      // IMPORTANT: Use a small delay before updating the note content
      // to ensure edit mode is fully exited before content changes
      setTimeout(() => {
        console.log('[DEBUG] Now updating note with original content');
        // Create a new note object with original content
        const revertedNote = { ...selectedNote, content: editStartContent };
        console.log('[DEBUG] Created reverted note with content:', revertedNote.content);
        
        // Update the note with original content
        setSelectedNote(revertedNote);
      }, 50);
    } else {
      console.log('[DEBUG] No note selected, just exiting edit mode');
      setIsEditMode(false);
      setIsPreviewMode(false);
      setIsDirty(false);
      
      // Reset the editing reference
      editingNoteRef.current = null;
    }
  }
  
  const updatePageContent = (content) => {
    if (selectedNote) {
      console.log('[DEBUG] updatePageContent called with content:', content);
      console.log('[DEBUG] Previous note content:', selectedNote.content);
      
      // Only update the local state, not backend
      const updatedNote = { ...selectedNote, content };
      console.log('[DEBUG] Setting updated note with new content');
      setSelectedNote(updatedNote);
      setIsDirty(true);
      console.log('[DEBUG] isDirty set to true');
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