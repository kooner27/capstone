import { createContext, useContext, useState } from 'react'

// Create Context
const NotebookContext = createContext()

// Custom hook to use the context
export const useNotebook = () => useContext(NotebookContext)

// Context Provider Component
export const NotebookProvider = ({ children }) => {
  const [selectedNotebook, setSelectedNotebook] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedPage, setSelectedPage] = useState(null)

  return (
    <NotebookContext.Provider
      value={{
        selectedNotebook,
        setSelectedNotebook,
        selectedSection,
        setSelectedSection,
        selectedPage,
        setSelectedPage
      }}
    >
      {children}
    </NotebookContext.Provider>
  )
}
