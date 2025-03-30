import { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  getUserNotebooks,
  createNotebook,
  getSections,
  createSection,
  getNotes,
  createNote,
  updateNote
} from '../api/notebook'
import { useNotebookData } from './NotebookDataContext'
const DEBUG = false

const NotebookContext = createContext()

export const useNotebook = () => useContext(NotebookContext)

export const NotebookProvider = ({ children }) => {
  const {
    fetchNotebooks,
    fetchSections,
    fetchNotes,
    createNotebook: dataCreateNotebook,
    createSection: dataCreateSection,
    createNote: dataCreateNote,
    updateNote: dataUpdateNote,
    notebooks,
    sections,
    notes,
    isLoading,
    error
  } = useNotebookData()

  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)

  const [isEditMode, setIsEditMode] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [editCanceled, setEditCanceled] = useState(false)
  const [originalNoteContent, setOriginalNoteContent] = useState('')
  const [editStartContent, setEditStartContent] = useState('')

  const editingNoteRef = useRef(null)

  useEffect(() => {
    fetchNotebooks()
  }, [])

  useEffect(() => {
    if (selectedNotebook) {
      fetchSections(selectedNotebook._id)
      setSelectedSection(null)
      setSelectedNote(null)
    }
  }, [selectedNotebook])

  useEffect(() => {
    if (selectedNotebook && selectedSection) {
      fetchNotes(selectedNotebook._id, selectedSection._id)
      setSelectedNote(null)
    }
  }, [selectedSection])

  // This is the updated useEffect hook to handle note selection while in edit mode
  useEffect(() => {
    if (selectedNote) {
      DEBUG && console.log('[DEBUG] Note selected/changed:', selectedNote._id)
      
      // Check if we're selecting a different note than the one we're currently editing
      if (isEditMode && editingNoteRef.current && editingNoteRef.current !== selectedNote._id) {
        DEBUG && console.log('[DEBUG] Different note selected while in edit mode - exiting edit mode')
        
        // Save content of the previous note if needed
        if (isDirty) {
          DEBUG && console.log('[DEBUG] Changes detected, saving content before switching notes')
          saveContent()
        }
        
        // Exit edit mode
        DEBUG && console.log('[DEBUG] Exiting edit mode due to note selection change')
        setIsEditMode(false)
        setIsPreviewMode(false)
        setIsDirty(false)
      }
      
      if (!isEditMode || editingNoteRef.current !== selectedNote._id) {
        DEBUG && console.log('[DEBUG] Setting original content to:', selectedNote.content || '')
        setOriginalNoteContent(selectedNote.content || '')
        setEditStartContent(selectedNote.content || '')
        DEBUG && console.log('[DEBUG] Edit start content captured:', selectedNote.content || '')
      }

      editingNoteRef.current = selectedNote._id
    }
  }, [selectedNote])

  const toggleEditMode = () => {
    if (!isEditMode) {
      DEBUG && console.log('[DEBUG] Entering edit mode')

      if (selectedNote) {
        setEditStartContent(selectedNote.content || '')
        DEBUG && console.log('[DEBUG] Edit start content captured:', selectedNote.content || '')
      }
      setIsEditMode(true)
      setIsPreviewMode(false)
    } else {
      DEBUG && console.log('[DEBUG] Exiting edit mode')

      saveContent()
      setIsEditMode(false)
      setIsPreviewMode(false)

      editingNoteRef.current = null
    }
  }

  const saveContent = () => {
    if (selectedNote && selectedNotebook && selectedSection) {
      DEBUG && console.log('[DEBUG] Saving note content:', selectedNote.content)

      if (selectedNote.content === undefined || selectedNote.content === null) {
        DEBUG && console.error('[DEBUG] Attempted to save note with undefined/null content')
        return false
      }

      dataUpdateNote(
        selectedNotebook._id,
        selectedSection._id,
        selectedNote._id,
        selectedNote.title,
        selectedNote.content
      )

      DEBUG && console.log('[DEBUG] Updating original content after save to:', selectedNote.content)
      setOriginalNoteContent(selectedNote.content)
      setEditStartContent(selectedNote.content)
      setIsDirty(false)

      return true
    }
    return false
  }

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const cancelEdit = () => {
    DEBUG && console.log('[DEBUG] Cancel edit called')
    DEBUG && console.log('[DEBUG] Current isEditMode:', isEditMode)
    DEBUG && console.log('[DEBUG] Current selectedNote:', selectedNote?._id)
    DEBUG && console.log('[DEBUG] Reverting to content:', editStartContent)

    if (selectedNote) {
      DEBUG && console.log('[DEBUG] Current note content before cancel:', selectedNote.content)
      DEBUG && console.log('[DEBUG] Original content to restore:', editStartContent)

      DEBUG && console.log('[DEBUG] Setting editCanceled flag to true')
      setEditCanceled(true)

      DEBUG && console.log('[DEBUG] Exiting edit mode')
      setIsEditMode(false)
      setIsPreviewMode(false)
      setIsDirty(false)

      editingNoteRef.current = null

      setTimeout(() => {
        DEBUG && console.log('[DEBUG] Now updating note with original content')

        const revertedNote = { ...selectedNote, content: editStartContent }
        DEBUG && console.log('[DEBUG] Created reverted note with content:', revertedNote.content)

        setSelectedNote(revertedNote)
      }, 50)
    } else {
      DEBUG && console.log('[DEBUG] No note selected, just exiting edit mode')
      setIsEditMode(false)
      setIsPreviewMode(false)
      setIsDirty(false)

      editingNoteRef.current = null
    }
  }

  const updatePageContent = (content) => {
    if (selectedNote) {
      DEBUG && console.log('[DEBUG] updatePageContent called with content:', content)
      DEBUG && console.log('[DEBUG] Previous note content:', selectedNote.content)

      const updatedNote = { ...selectedNote, content }
      DEBUG && console.log('[DEBUG] Setting updated note with new content')
      setSelectedNote(updatedNote)
      setIsDirty(true)
      DEBUG && console.log('[DEBUG] isDirty set to true')
    }
  }

  const value = {
    notebooks,
    sections,
    notes,
    isLoading,
    error,

    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    selectedNote,
    setSelectedNote,

    isEditMode,
    isPreviewMode,
    isDirty,
    editCanceled,
    setEditCanceled,
    originalNoteContent,
    editStartContent,
    setIsPreviewMode,

    toggleEditMode,
    saveContent,
    togglePreviewMode,
    cancelEdit,
    updatePageContent,

    updateNote: dataUpdateNote,

    refreshNotebooks: fetchNotebooks,
    refreshSections: fetchSections,
    createNotebook: dataCreateNotebook,
    createSection: dataCreateSection,
    createNote: dataCreateNote
  }

  return <NotebookContext.Provider value={value}>{children}</NotebookContext.Provider>
}