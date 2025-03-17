import { createContext, useContext, useState } from 'react'
import { 
  getUserNotebooks, createNotebook as apiCreateNotebook,
  getSections, createSection as apiCreateSection,
  getNotes, createNote as apiCreateNote, updateNote as apiUpdateNote
} from '../api/notebook'

// Create context for notebook data operations
const NotebookDataContext = createContext()

// Custom hook to use the notebook data context
export const useNotebookData = () => useContext(NotebookDataContext)

export const NotebookDataProvider = ({ children }) => {
  // API data state
  const [notebooks, setNotebooks] = useState([])
  const [sections, setSections] = useState([])
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch data operations
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

  // CRUD operations
  const createNotebook = async (name) => {
    setIsLoading(true)
    setError(null)
    try {
      const newNotebook = await apiCreateNotebook(name)
      setNotebooks(prev => [...prev, newNotebook])
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
      setSections(prev => [...prev, newSection])
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
      setNotes(prev => [...prev, newNote])
      return newNote
    } catch (err) {
      console.error('Error creating note:', err)
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // MODIFIED: Enhanced updateNote with better logging
  const updateNote = async (notebookId, sectionId, noteId, title, content) => {
    if (!notebookId || !sectionId || !noteId) {
      console.error('Missing required parameters for updateNote:', { notebookId, sectionId, noteId });
      return false;
    }
    
    // Add validation for content
    if (content === undefined || content === null) {
      console.error('Attempted to update note with undefined/null content');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending note update to API with content:', content);
      
      // Make the API call to update the note
      await apiUpdateNote(notebookId, sectionId, noteId, title, content);
      
      // Update local state
      setNotes(prev => 
        prev.map(n => n._id === noteId ? { ...n, title, content } : n)
      );
      
      console.log('Note updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating note:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Context value
  const value = {
    // Data
    notebooks,
    sections,
    notes,
    isLoading,
    error,
    // API operations
    fetchNotebooks,
    fetchSections,
    fetchNotes,
    createNotebook,
    createSection,
    createNote,
    updateNote
  }

  return (
    <NotebookDataContext.Provider value={value}>
      {children}
    </NotebookDataContext.Provider>
  )
}