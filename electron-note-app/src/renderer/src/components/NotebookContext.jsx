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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pageContent))
    } catch (error) {
      console.error('Error saving content to localStorage:', error)
    }
  }, [pageContent])

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  const updatePageContent = (content) => {
    if (selectedPage && content !== undefined) {
      setPageContent(prevContent => {
        const updatedContent = {
          ...prevContent,
          [selectedPage]: content
        }
        return updatedContent
      })
    }
  }

  const getPageContent = (pageName) => {
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
        pageContent,
        updatePageContent,
        getPageContent
      }}
    >
      {children}
    </NotebookContext.Provider>
  )
}