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

  // Common list item styles
  const listItemStyles = {
    minHeight: 48,
    '& .MuiListItemText-primary': {
      fontSize: '0.875rem',
      lineHeight: 1.25,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }

  if (!selectedNotebook) {
    return (
      <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          <Typography variant="h6">Notebooks</Typography>
        </Toolbar>
        <Divider />
        <List dense>
          {notebooksData.map((notebook) => (
            <ListItem
              button
              key={notebook.name}
              onClick={() => setSelectedNotebook(notebook)}
              sx={listItemStyles}
            >
              <ListItemText 
                primary={notebook.name}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    )
  }

  return (
    <Box sx={{ width: 480, display: 'flex' }}>
      {/* Sections Column */}
      <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 56, px: 2, gap: 1 }}>
          <Button
            onClick={() => setSelectedNotebook(null)}
            variant="outlined"
            size="small"
            sx={{ flexShrink: 0 }}
          >
            Back
          </Button>
          <Typography variant="h6" noWrap>
            {selectedNotebook.name}
          </Typography>
        </Toolbar>
        <Divider />
        <List dense>
          {selectedNotebook.sections.map((section) => (
            <ListItem
              button
              key={section}
              selected={selectedSection === section}
              onClick={() => {
                setSelectedSection(section)
                setSelectedPage(null)
              }}
              sx={listItemStyles}
            >
              <ListItemText 
                primary={section}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Pages Column */}
      <Box sx={{ width: 240 }}>
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          <Typography variant="h6" noWrap>
            {selectedSection ? `Pages in ${selectedSection}` : 'Select a section'}
          </Typography>
        </Toolbar>
        <Divider />
        <List dense>
          {(selectedSection ? dummyPages[selectedSection] : []).map((page) => (
            <ListItem
              button
              key={page}
              onClick={() => setSelectedPage(page)}
              sx={listItemStyles}
            >
              <ListItemText 
                primary={page}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default Sidebar