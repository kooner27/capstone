import { useNotebook } from './NotebookContext'
import { Box, Typography, TextField, Paper } from '@mui/material'
import { useState, useEffect, useRef } from 'react'

const ContentArea = () => {
  const { 
    selectedNotebook, 
    selectedSection, 
    selectedPage, 
    isEditMode, 
    pageContent, 
    updatePageContent,
    toggleEditMode
  } = useNotebook()
  
  const [currentContent, setCurrentContent] = useState('')
  const [lastEditedPage, setLastEditedPage] = useState(null)
  const previousEditMode = useRef(isEditMode)

  useEffect(() => {
    if (selectedPage) {
      setCurrentContent(pageContent[selectedPage] || '')
      setLastEditedPage(selectedPage)
    }
  }, [selectedPage, pageContent])

  const handleContentChange = (e) => {
    setCurrentContent(e.target.value)
  }

  useEffect(() => {
    if (previousEditMode.current && !isEditMode && selectedPage) {
      updatePageContent(currentContent)
    }
    
    previousEditMode.current = isEditMode
  }, [isEditMode, selectedPage, currentContent, updatePageContent])

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {selectedPage ? (
        <>
          <Typography variant="h4" gutterBottom>{selectedPage}</Typography>
          
          {isEditMode ? (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                minHeight: '500px',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <TextField
                fullWidth
                multiline
                variant="standard"
                placeholder="Start typing your content here..."
                value={currentContent}
                onChange={handleContentChange}
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '1rem' }
                }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start'
                  }
                }}
              />
            </Paper>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                minHeight: '500px',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {pageContent[selectedPage] ? (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {pageContent[selectedPage]}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No content yet. Click "Edit" to add content.
                </Typography>
              )}
            </Paper>
          )}
        </>
      ) : (
        <>
          <Typography variant="h4">Welcome to TwoNote</Typography>
          <Typography variant="body1">
            {selectedSection
              ? `Currently viewing section: ${selectedSection}. Select a page to view its content.`
              : selectedNotebook
                ? `Currently viewing ${selectedNotebook.name}. Pick a section to view pages.`
                : 'Select a notebook from the sidebar.'}
          </Typography>
        </>
      )}
    </Box>
  )
}

export default ContentArea