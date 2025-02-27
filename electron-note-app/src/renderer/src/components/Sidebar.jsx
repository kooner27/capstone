import { useNotebook } from './NotebookContext'
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Toolbar
} from '@mui/material'

const notebooksData = [
  { name: 'Notebook 1', sections: ['Section 1.1', 'Section 1.2', 'Section 1.3'] },
  { name: 'Notebook 2', sections: ['Section 2.1', 'Section 2.2'] },
  { name: 'Notebook 3', sections: ['Section 3.1', 'Section 3.2', 'Section 3.3', 'Section 3.4'] }
]

const dummyPages = {
  'Section 1.1': ['Page 1.1.1', 'Page 1.1.2', 'Page 1.1.3'],
  'Section 1.2': ['Page 1.2.1', 'Page 1.2.2'],
  'Section 1.3': ['Page 1.3.1'],
  'Section 2.1': ['Page 2.1.1', 'Page 2.1.2'],
  'Section 2.2': ['Page 2.2.1'],
  'Section 3.1': ['Page 3.1.1'],
  'Section 3.2': ['Page 3.2.1', 'Page 3.2.2'],
  'Section 3.3': ['Page 3.3.1'],
  'Section 3.4': ['Page 3.4.1']
}

const Sidebar = () => {
  const {
    selectedNotebook,
    setSelectedNotebook,
    selectedSection,
    setSelectedSection,
    setSelectedPage
  } = useNotebook()

  // 1) No notebook selected => show notebooks list
  if (!selectedNotebook) {
    return (
      <Box
        sx={{
          width: 240,
          borderRight: 1,
          borderColor: 'divider',
          boxSizing: 'border-box'
        }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>
          Notebooks
        </Typography>
        <Divider />
        <List>
          {notebooksData.map((notebook) => (
            <ListItem button key={notebook.name} onClick={() => setSelectedNotebook(notebook)}>
              <ListItemText primary={notebook.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    )
  }

  // 2) Notebook selected => two columns: sections and pages
  return (
    <Box sx={{ width: 480, display: 'flex', boxSizing: 'border-box' }}>
      {/* Left Column: Sections */}
      <Box
        sx={{
          width: 240,
          borderRight: 1,
          borderColor: 'divider',
          boxSizing: 'border-box'
        }}
      >
        {/* Header using Toolbar for consistent height */}
        <Toolbar sx={{ px: 2, minHeight: 56 }}>
          <Button
            onClick={() => setSelectedNotebook(null)}
            variant="outlined"
            size="small" // optional: adjust button size if needed
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h6" noWrap>
            {selectedNotebook.name}
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {selectedNotebook.sections.map((section) => (
            <ListItem
              button
              key={section}
              selected={selectedSection === section}
              onClick={() => {
                setSelectedSection(section)
                setSelectedPage(null) // reset page on section switch
              }}
            >
              <ListItemText primary={section} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Right Column: Pages */}
      <Box sx={{ width: 240, boxSizing: 'border-box' }}>
        {selectedSection ? (
          <>
            <Toolbar sx={{ px: 2, minHeight: 56 }}>
              <Typography variant="h6" noWrap>
                Pages in {selectedSection}
              </Typography>
            </Toolbar>
            <Divider />
            <List>
              {(dummyPages[selectedSection] || []).map((page) => (
                <ListItem button key={page} onClick={() => setSelectedPage(page)}>
                  <ListItemText primary={page} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <>
            <Toolbar sx={{ px: 2, minHeight: 56 }}>
              <Typography variant="body1">Select a section to view pages</Typography>
            </Toolbar>
            <Divider />
          </>
        )}
      </Box>
    </Box>
  )
}

export default Sidebar
