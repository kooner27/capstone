import { createContext, useContext, useState, useEffect } from 'react'

const NotebookContext = createContext()

const STORAGE_KEY = 'twonote_page_content'

const loadSavedContent = () => {
  try {
    const savedContent = localStorage.getItem(STORAGE_KEY)
    return savedContent ? JSON.parse(savedContent) : {}
  } catch (error) {
    console.error('Error loading saved content:', error)
    return {}
  }
}

export const useNotebook = () => useContext(NotebookContext)

export const NotebookProvider = ({ children }) => {
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedPage, setSelectedPage] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [pageContent, setPageContent] = useState(loadSavedContent)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [editCanceled, setEditCanceled] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pageContent))
    } catch (error) {
      console.error('Error saving content to localStorage:', error)
    }
  }, [pageContent])

  const toggleEditMode = (save = false) => {
    console.log('toggleEditMode called with save:', save)
    if (isEditMode && save) {
      console.log('Saving changes')
      setIsDirty(false)
    } else if (!isEditMode) {
      console.log('Entering edit mode, storing current content')
      setLastSavedContent(pageContent[selectedPage] || '')
    } else {
      console.log('Exiting edit mode without saving, reverting to last saved content')
      cancelEdit()
    }
    
    setIsEditMode(!isEditMode)
  }

  const cancelEdit = () => {
    console.log('cancelEdit called, reverting to last saved content')
    setIsEditMode(false)
    setIsDirty(false)
    setEditCanceled(true)
    if (selectedPage) {
      setPageContent(prevContent => ({
        ...prevContent,
        [selectedPage]: lastSavedContent
      }))
    }
  }

  const updatePageContent = (content) => {
    console.log('updatePageContent called with content:', content)
    if (selectedPage && content !== undefined) {
      setPageContent(prevContent => {
        const updatedContent = {
          ...prevContent,
          [selectedPage]: content
        }
        return updatedContent
      })
      setIsDirty(false)
    }
  }

  const getPageContent = (pageName) => {
    console.log('getPageContent called with pageName:', pageName)
    return pageContent[pageName] || ''
  }

  return (
    <NotebookContext.Provider
      value={{
        selectedNotebook,
        setSelectedNotebook,
        selectedSection,
        setSelectedSection,
        selectedPage,
        setSelectedPage,
        isEditMode,
        setIsEditMode,
        toggleEditMode,
        cancelEdit,
        pageContent,
        updatePageContent,
        getPageContent,
        isDirty,
        setIsDirty,
        editCanceled,
        setEditCanceled
      }}
    >
      {children}
    </NotebookContext.Provider>
  )
}