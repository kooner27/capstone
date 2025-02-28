import { useNotebook } from './NotebookContext'
import { Box, Typography } from '@mui/material'

const ContentArea = () => {
  const { selectedNotebook, selectedSection, selectedPage } = useNotebook()

  return (
    <Box sx={{ p: 3 }}>
      {selectedPage ? (
        <>
          <Typography variant="h4">{selectedPage}</Typography>
          <Typography variant="body1">Content for {selectedPage} goes here...</Typography>
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
