import React, { useState, useRef } from 'react'
import {
  TextField,
  InputAdornment,
  IconButton,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  ClickAwayListener,
  Chip,
  Divider,
  InputBase
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const searchRef = useRef(null)

  // Sample available tags
  const availableTags = [
    'work',
    'personal',
    'important',
    'todo',
    'meeting',
    'idea',
    'research',
    'followup',
    'archived',
    'project',
    'review',
    'daily',
    'weekly',
    'development',
    'planning',
    'design',
    'ui',
    'feedback',
    'bug',
    'feature'
  ]

  // Simplified flat list of dummy results
  const dummyResults = [
    {
      id: 'n1',
      title: 'Project Ideas',
      type: 'notebook',
      preview: null
    },
    {
      id: 's1',
      title: 'Weekly Tasks',
      type: 'section',
      preview: null
    },
    {
      id: 'note1',
      title: 'Project Timeline Discussion',
      type: 'note',
      preview:
        'We discussed the new project timeline and agreed to move the deadline to next quarter...'
    },
    {
      id: 'n2',
      title: 'Personal Journal',
      type: 'notebook',
      preview: null
    },
    {
      id: 'note2',
      title: 'Feature Requirements',
      type: 'note',
      preview:
        'The client wants us to implement a new search functionality with filtering options...'
    },
    {
      id: 's2',
      title: 'Meeting Summaries',
      type: 'section',
      preview: null
    },
    {
      id: 'note3',
      title: 'Interview Questions',
      type: 'note',
      preview: 'Prepared questions for the senior developer position: 1) Experience with React...'
    }
  ]

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
    if (e.target.value !== '') {
      setShowTagDropdown(false)
    }
  }

  const handleTagSearchChange = (e) => {
    setTagSearchQuery(e.target.value)
  }

  // Handle click on search field to show tags
  const handleSearchClick = () => {
    if (!open) {
      setShowTagDropdown(true)
    }
  }

  // Only search when Enter is pressed
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      setOpen(true)
      setShowTagDropdown(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setOpen(false)
  }

  const handleClickAway = () => {
    setOpen(false)
    setShowTagDropdown(false)
  }

  const renderIcon = (type) => {
    switch (type) {
      case 'notebook':
        return <FolderOutlinedIcon fontSize="small" />
      case 'section':
        return <BookmarkBorderOutlinedIcon fontSize="small" />
      case 'note':
        return <DescriptionOutlinedIcon fontSize="small" />
      default:
        return <DescriptionOutlinedIcon fontSize="small" />
    }
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '300px' }}>
        <TextField
          inputRef={searchRef}
          variant="outlined"
          placeholder="Search... (Press Enter)"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={handleInputChange}
          onClick={handleSearchClick}
          onKeyPress={handleKeyPress}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { border: 'none' }
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'white' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} sx={{ color: 'white' }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Tag Dropdown */}
        {showTagDropdown && !open && (
          <Popper
            open={true}
            anchorEl={searchRef.current}
            placement="bottom-start"
            style={{
              width: 400,
              zIndex: 1500,
              marginTop: '4px',
              left: 0
            }}
          >
            <Paper elevation={6} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="subtitle2" display="flex" alignItems="center">
                  <LocalOfferIcon sx={{ fontSize: '1rem', mr: 1 }} />
                  Available Tags
                </Typography>
              </Box>

              {/* Tag Search Input */}
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <InputBase
                  placeholder="Add tags to search ..."
                  value={tagSearchQuery}
                  onChange={handleTagSearchChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                  fullWidth
                  sx={{
                    fontSize: '0.875rem',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.05)'
                  }}
                />
              </Box>

              {/* Tag List */}
              <Box
                sx={{
                  p: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}
              >
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      m: 0.5,
                      '&:hover': { bgcolor: 'primary.light', color: 'white' }
                    }}
                  />
                ))}
              </Box>

              <Divider />

              {/* <Box sx={{ p: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                add any tag filters above
                </Typography>
              </Box> */}
            </Paper>
          </Popper>
        )}

        {/* Search Results */}
        {open && searchQuery && (
          <Popper
            open={open}
            anchorEl={searchRef.current}
            placement="bottom-start"
            style={{
              width: 600,
              zIndex: 1500,
              marginTop: '4px',
              left: 0
            }}
            popperOptions={{
              modifiers: [
                {
                  name: 'preventOverflow',
                  options: {
                    boundary: document.body
                  }
                }
              ]
            }}
          >
            <Paper elevation={6} sx={{ maxHeight: 500, overflow: 'auto' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="subtitle2">Results for "{searchQuery}"</Typography>
              </Box>

              <List disablePadding>
                {dummyResults.length > 0 ? (
                  dummyResults.map((result) => (
                    <ListItem
                      key={result.id}
                      button
                      divider
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {renderIcon(result.type)}
                          </ListItemIcon>
                          <Typography variant="subtitle2" noWrap>
                            {result.title}
                          </Typography>
                          <Chip
                            label={result.type}
                            size="small"
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor:
                                result.type === 'note'
                                  ? 'info.main'
                                  : result.type === 'notebook'
                                    ? 'success.main'
                                    : 'warning.main',
                              color: 'white'
                            }}
                          />
                        </Box>

                        {result.preview && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              pl: 4.5,
                              pr: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {result.preview}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No results found"
                      primaryTypographyProps={{
                        variant: 'body2',
                        align: 'center',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Popper>
        )}
      </Box>
    </ClickAwayListener>
  )
}

export default SearchBar
