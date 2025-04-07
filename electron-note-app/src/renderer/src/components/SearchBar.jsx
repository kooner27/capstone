/*
This code block is our search bar component
It connects the UI and with the api calls and the context.
It is necessary to implement section 4.5 of our SRS which is search and filter.
It covers FR15, FR16 and FR17
*/
import React, { useState, useRef, useEffect } from 'react'
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
  InputBase,
  CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import { searchContent } from '../api/search'
import { useNotebook } from './NotebookContext'
import { getUserNotebooks, getSections, getNotes } from '../api/notebook'
import { fetchUserLabels } from '../api/labels'

const DEBUG = false

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const searchRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [error, setError] = useState(null)

  const [selectedLabels, setSelectedLabels] = useState([])

  const [availableTags, setAvailableTags] = useState([])

  const [loadingTags, setLoadingTags] = useState(false)

  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoadingTags(true)
        const userTags = await fetchUserLabels()
        setAvailableTags(userTags)
      } catch (error) {
        console.error('Error fetching user tags:', error)

        setAvailableTags([])
      } finally {
        setLoadingTags(false)
      }
    }

    loadTags()
  }, [])

  const { setSelectedNotebook, setSelectedSection, setSelectedNote } = useNotebook()

  const handleResultClick = async (result) => {
    DEBUG && console.log('Search result clicked:', result)
    setOpen(false)

    try {
      switch (result.type) {
        case 'notebook':
          setSelectedNotebook(result)
          break

        case 'section':
          if (result.notebook_id) {
            DEBUG && console.log('Fetching parent notebook for section:', result.notebook_id)
            const notebooks = await getUserNotebooks()
            const notebook = notebooks.find((n) => n._id === result.notebook_id)

            if (notebook) {
              setSelectedNotebook(notebook)

              setTimeout(() => {
                DEBUG && console.log('Setting section from search:', result)
                setSelectedSection(result)
              }, 100)
            }
          }
          break

        case 'note':
          if (result.notebook_id && result.section_id) {
            DEBUG && console.log('Fetching parent notebook for note:', result.notebook_id)
            const notebooks = await getUserNotebooks()
            const notebook = notebooks.find((n) => n._id === result.notebook_id)

            if (notebook) {
              setSelectedNotebook(notebook)

              setTimeout(async () => {
                DEBUG && console.log('Fetching parent section for note:', result.section_id)
                const sections = await getSections(result.notebook_id)
                const section = sections.find((s) => s._id === result.section_id)

                if (section) {
                  setSelectedSection(section)

                  setTimeout(async () => {
                    DEBUG && console.log('Fetching notes to get complete note data')
                    const completeNotes = await getNotes(notebook._id, section._id)
                    const completeNote = completeNotes.find((n) => n._id === result._id)

                    if (completeNote) {
                      DEBUG && console.log('Setting complete note from API:', completeNote)
                      setSelectedNote(completeNote)
                    } else {
                      DEBUG && console.log('Complete note not found, using search result:', result)
                      setSelectedNote(result)
                    }
                  }, 100)
                }
              }, 100)
            }
          }
          break
        default:
          console.warn('Unknown result type:', result.type)
      }
    } catch (error) {
      console.error('Error navigating to search result:', error)
    }
  }

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
    if (e.target.value !== '') {
      setShowTagDropdown(false)
    }
  }

  const handleTagSearchChange = (e) => {
    setTagSearchQuery(e.target.value)
  }

  const handleTagSearchKeyPress = (e) => {
    if (e.key === 'Enter' && tagSearchQuery.trim()) {
      const tag = tagSearchQuery.trim().toLowerCase()
      if (!selectedLabels.includes(tag)) {
        setSelectedLabels([...selectedLabels, tag])
      }
      setTagSearchQuery('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setSelectedLabels(selectedLabels.filter((tag) => tag !== tagToRemove))
  }

  const handleSearchClick = () => {
    if (!open) {
      setShowTagDropdown(true)
    }
  }

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && (searchQuery.trim() !== '' || selectedLabels.length > 0)) {
      setShowTagDropdown(false)
      setLoading(true)
      setError(null)

      try {
        const apiResults = await searchContent(searchQuery, selectedLabels)
        DEBUG && console.log('API search results:', apiResults)
        DEBUG && console.log('Used tags:', selectedLabels)
        setSearchResults(apiResults)
        setOpen(true)
      } catch (error) {
        console.error('Search API error:', error)
        setError(error.message || 'Failed to search')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedLabels([])
    setOpen(false)
    setSearchResults(null)
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

  const getAllResults = () => {
    if (!searchResults || !searchResults.results) return []

    return [
      ...(searchResults.results.notebooks || []),
      ...(searchResults.results.sections || []),
      ...(searchResults.results.notes || [])
    ].sort((a, b) => (b.score || 0) - (a.score || 0))
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
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SearchIcon sx={{ color: 'white' }} />
                )}
              </InputAdornment>
            ),
            endAdornment: (searchQuery || selectedLabels.length > 0) && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} sx={{ color: 'white' }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {}
        {showTagDropdown && !open && (
          <Popper
            open={true}
            anchorEl={searchRef.current}
            placement="bottom-start"
            modifiers={[
              {
                name: 'offset',
                options: {
                  offset: [-50, 10]
                }
              }
            ]}
            style={{
              width: 400,
              zIndex: 1500,
              marginTop: '10px',
              left: 0
            }}
          >
            <Paper elevation={6} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="subtitle2" display="flex" alignItems="center">
                  <LocalOfferIcon sx={{ fontSize: '1rem', mr: 1 }} />
                  Available Labels
                </Typography>
              </Box>

              {}
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <InputBase
                  placeholder="Add labels to search... (Press Enter)"
                  value={tagSearchQuery}
                  onChange={handleTagSearchChange}
                  onKeyPress={handleTagSearchKeyPress}
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

              {}
              {selectedLabels.length > 0 && (
                <Box sx={{ p: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    Selected Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedLabels.map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        size="small"
                        onDelete={() => handleRemoveTag(label)}
                        color="primary"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {}
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

              {}
            </Paper>
          </Popper>
        )}

        {}
        {open && (
          <Popper
            open={open}
            anchorEl={searchRef.current}
            placement="bottom-start"
            modifiers={[
              {
                name: 'offset',
                options: {
                  offset: [-50, 10]
                }
              }
            ]}
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
                <Typography variant="subtitle2">
                  {loading
                    ? 'Searching...'
                    : error
                      ? `Error: ${error}`
                      : searchResults
                        ? `${searchResults.total_results} results${
                            searchResults.query ? ` for "${searchResults.query}"` : ''
                          }${
                            selectedLabels.length > 0
                              ? ` with tags: ${selectedLabels.join(', ')}`
                              : ''
                          }`
                        : 'No results'}
                </Typography>
              </Box>

              <List disablePadding>
                {loading ? (
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : error ? (
                  <ListItem>
                    <ListItemText
                      primary={`Error: ${error}`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: 'error'
                      }}
                    />
                  </ListItem>
                ) : getAllResults().length > 0 ? (
                  getAllResults().map((result) => (
                    <ListItem
                      key={result._id}
                      button
                      divider
                      onClick={() => handleResultClick(result)}
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
                            {result.title || result.name}
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

                        {}
                        {result.content_preview && (
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
                            {result.content_preview}
                          </Typography>
                        )}

                        {}
                        {result.labels && result.labels.length > 0 && (
                          <Box sx={{ pl: 4.5, mt: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                            {result.labels.map((label) => (
                              <Chip
                                key={label}
                                label={label}
                                size="small"
                                color="default"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
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
