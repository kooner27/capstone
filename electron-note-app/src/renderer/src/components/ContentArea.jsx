import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { useNotebook } from './NotebookContext'
import { useNotebookData } from './NotebookDataContext'
import CodeBlock from './CodeBlock' // Import the CodeBlock component
const DEBUG = false

// Helper function to safely access Electron shell API
const openExternalLink = (url) => {
  if (window.electron && window.electron.shell) {
    window.electron.shell.openExternal(url)
  } else if (window.require) {
    try {
      const { shell } = window.require('electron')
      shell.openExternal(url)
    } catch (error) {
      console.error('Failed to access Electron shell:', error)
      window.open(url, '_blank')
    }
  } else {
    window.open(url, '_blank')
  }
}

// Create a separate TextBlock component to properly handle hooks
const TextBlock = ({ textBlock, index }) => {
  const blockRef = useRef(null);
  const formattedHtml = formatText(textBlock.content);

  // Add click handler for external links
  useEffect(() => {
    if (blockRef.current) {
      const links = blockRef.current.querySelectorAll('a.external-link');
      
      const handleLinkClick = (e) => {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (href) {
          openExternalLink(href);
        }
      };
      
      links.forEach(link => {
        link.addEventListener('click', handleLinkClick);
      });
      
      return () => {
        links.forEach(link => {
          link.removeEventListener('click', handleLinkClick);
        });
      };
    }
  }, [textBlock.content]);

  const customStyles = `
    p { margin: 0 0 0.5em 0; }
    p:last-child { margin-bottom: 0; }
    h1 { 
      margin-top: 1em; 
      margin-bottom: 0.6em; 
      font-weight: bold; 
      font-size: 2em;
    }
    h2 { 
      margin-top: 0.9em; 
      margin-bottom: 0.5em; 
      font-weight: bold;
      font-size: 1.5em;
    }
    h3 { 
      margin-top: 0.8em; 
      margin-bottom: 0.4em; 
      font-weight: bold;
      font-size: 1.25em;
    }
    /* Make sure strong elements in headings appear properly bold */
    h1 strong, h2 strong, h3 strong { 
      font-weight: 900; 
      color: inherit;
    }
    /* Ensure bold text is actually bold */
    strong { 
      font-weight: bold !important; 
    }
    /* Ensure italic text is actually italic */
    em {
      font-style: italic !important;
    }
    ul { margin-top: 0.3em; margin-bottom: 0.5em; padding-left: 1.5em; list-style-type: disc; }
    li { margin-bottom: 0.2em; display: list-item; }
    hr { margin: 1em 0; border: none; height: 1px; background-color: #ddd; }
    img { max-width: 100%; height: auto; }
    a.external-link { color: #0000EE; text-decoration: underline; cursor: pointer; }
  `;

  return (
    <Box sx={{ my: 1 }}>
      <style>{customStyles}</style>
      <div ref={blockRef} dangerouslySetInnerHTML={{ __html: formattedHtml }} />
    </Box>
  );
};

// Define the formatText function outside so it can be used by the TextBlock component
const formatText = (text) => {
  // Process horizontal rules first
  let formatted = text.replace(/^([-*=]{3,})$/gm, '<hr>');

  // Split by paragraphs
  const paragraphs = formatted.split(/\n\n+/);

  return paragraphs
    .map(paragraph => {
      // Skip if this is just a horizontal rule
      if (paragraph.trim() === '<hr>') {
        return paragraph;
      }

      // Check if this paragraph is a list
      const isList = paragraph.split('\n').some(line => line.trim().match(/^- /));

      if (isList) {
        const listItems = paragraph
          .split('\n')
          .map(line => {
            const listMatch = line.trim().match(/^- (.*)/);
            if (listMatch) {
              // Process inline formatting within list items
              const content = processInlineFormatting(listMatch[1]);
              return `<li>${content}</li>`;
            }
            return line.trim() ? `<p>${processInlineFormatting(line)}</p>` : '';
          })
          .filter(item => item)
          .join('');

        if (listItems.includes('<li>')) {
          return `<ul>${listItems}</ul>`;
        }
        return listItems;
      }

      // Process headings with inline formatting
      let processed = paragraph;

      // Handle headers with inline formatting
      const h1Match = processed.match(/^# (.+)$/m);
      if (h1Match) {
        const headingContent = h1Match[1];
        const formattedContent = processInlineFormatting(headingContent);
        return `<h1>${formattedContent}</h1>`;
      }

      const h2Match = processed.match(/^## (.+)$/m);
      if (h2Match) {
        const headingContent = h2Match[1];
        const formattedContent = processInlineFormatting(headingContent);
        return `<h2>${formattedContent}</h2>`;
      }

      const h3Match = processed.match(/^### (.+)$/m);
      if (h3Match) {
        const headingContent = h3Match[1];
        const formattedContent = processInlineFormatting(headingContent);
        return `<h3>${formattedContent}</h3>`;
      }

      // If it's not a header, process inline formatting and wrap in paragraph
      // Replace newlines with <br> for non-list paragraphs
      processed = processed.replace(/\n/g, '<br>');
      
      // Process all inline formatting
      processed = processInlineFormatting(processed);

      // Wrap in paragraph if not already wrapped
      if (
        !processed.match(/^<(h[1-3]|ul|hr)>/) &&
        !processed.trim().startsWith('<li>')
      ) {
        processed = `<p>${processed}</p>`;
      }

      return processed;
    })
    .join('');
};

// Move processInlineFormatting function outside components
const processInlineFormatting = (text) => {
  // Handle all inline formatting
  let processed = text;

  // Bold text - improved regex to handle bold correctly
  processed = processed.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text - process after bold to avoid conflicts
  processed = processed.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  
  // Images - process before links to avoid conflicts
  processed = processed.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
  
  // Links - add special class for external handling
  processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="external-link">$1</a>');
  
  return processed;
};

// MarkdownRenderer component with improved code block detection
const MarkdownRenderer = ({ markdown }) => {
  DEBUG &&
    console.log(
      '[DEBUG-MARKDOWN] Rendering markdown with content:',
      markdown ? (markdown.length > 50 ? markdown.substring(0, 50) + '...' : markdown) : 'empty'
    );

  const parseMarkdown = (text) => {
    if (!text) return [];
    
    // Step 1: Process and normalize the text
    let normalizedText = text;
    
    // Fix for inline code blocks: Handle cases where code blocks are on a single line with text
    // This specifically handles the pattern: Text ```language code code code```
    const inlineCodeBlockRegex = /^(.*?)\s+```(\w*)\s+(.*?)\s+```\s*$/gm;
    normalizedText = normalizedText.replace(inlineCodeBlockRegex, (match, prefix, lang, code) => {
      return `${prefix}\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
    });
    
    // Step 2: Now we can safely parse the normalized text
    const sections = [];
    let currentText = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent = '';

    const lines = normalizedText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for code blocks even with indentation
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('```')) {
        if (!inCodeBlock) {
          if (currentText) {
            sections.push({ type: 'text', content: currentText });
            currentText = '';
          }

          codeLanguage = trimmedLine.slice(3).trim();
          codeContent = '';
          inCodeBlock = true;
        } else {
          // End of code block - create a code section
          sections.push({
            type: 'code',
            language: codeLanguage,
            content: codeContent
          });
          codeLanguage = '';
          codeContent = '';
          inCodeBlock = false;
        }
      } else if (inCodeBlock) {
        // Inside a code block - accumulate code content
        codeContent += (codeContent ? '\n' : '') + line;
      } else {
        // Outside a code block - accumulate text content
        currentText += (currentText ? '\n' : '') + line;
      }
    }

    // Handle any remaining text
    if (currentText) {
      sections.push({ type: 'text', content: currentText });
    }

    // Handle unclosed code blocks
    if (inCodeBlock && codeContent) {
      sections.push({ type: 'text', content: '```' + codeLanguage + '\n' + codeContent });
    }

    return sections;
  };

  const sections = parseMarkdown(markdown || '');

  return (
    <Box>
      {sections.map((section, index) => {
        if (section.type === 'code') {
          return (
            <CodeBlock 
              key={`code-${index}`}
              code={section.content}
              language={section.language}
              index={index}
            />
          );
        } else {
          // Use the TextBlock component instead of calling a function
          return <TextBlock key={`text-${index}`} textBlock={section} index={index} />;
        }
      })}
    </Box>
  );
};

const ContentArea = () => {
  DEBUG && console.log('[DEBUG] ContentArea component rendering')

  // Get selection and edit state from NotebookContext
  const {
    selectedNotebook,
    selectedSection,
    selectedNote,
    isEditMode,
    isPreviewMode,
    editCanceled,
    setEditCanceled,
    updatePageContent,
    editStartContent,
    setIsPreviewMode
  } = useNotebook()

  // Log what we have when rendering
  DEBUG &&
    console.log('[DEBUG] ContentArea current state:', {
      hasSelectedNote: !!selectedNote,
      noteId: selectedNote?._id,
      isEditMode,
      isPreviewMode,
      editCanceled,
      contentLength: selectedNote?.content?.length || 0
    })

  // Get loading, error, and data operations from NotebookDataContext
  const { isLoading, error, updateNote } = useNotebookData()

  const editableRef = useRef(null)
  const contentBuffer = useRef('') // Buffer to store content without re-rendering

  // Handle edit cancellation - FIXED VERSION
  useEffect(() => {
    DEBUG && console.log('[DEBUG] editCanceled effect running, editCanceled =', editCanceled)
    DEBUG &&
      console.log(
        '[DEBUG] Current editStartContent =',
        editStartContent
          ? editStartContent.length > 50
            ? editStartContent.substring(0, 50) + '...'
            : editStartContent
          : 'empty'
      )

    if (editCanceled) {
      DEBUG && console.log('[DEBUG] Processing edit cancellation')
      DEBUG && console.log('[DEBUG] Current isEditMode:', isEditMode)
      DEBUG && console.log('[DEBUG] Current editableRef exists:', !!editableRef.current)

      // Reset the editor if we're still in edit mode
      if (editableRef.current && isEditMode) {
        DEBUG && console.log('[DEBUG] Resetting editable content to editStartContent')
        editableRef.current.innerText = editStartContent
      } else {
        DEBUG && console.log('[DEBUG] Not in edit mode, no need to reset editor')
      }

      // Clear the content buffer to avoid affecting content when switching modes
      DEBUG && console.log('[DEBUG] Clearing contentBuffer')
      contentBuffer.current = ''

      DEBUG && console.log('[DEBUG] Resetting editCanceled flag')
      setEditCanceled(false)

      DEBUG && console.log('[DEBUG] Edit cancellation processing completed')
    }
  }, [editCanceled, editStartContent, isEditMode, setEditCanceled])

  // Handle Enter key for line breaks
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Store information about indentation before the default Enter action
      const content = editableRef.current?.innerText || ''
      const cursorPos = getCursorPosition(editableRef.current)
      const lines = content.substring(0, cursorPos).split('\n')
      let indentation = ''

      // Check if previous line had indentation
      if (lines.length > 0) {
        const prevLine = lines[lines.length - 1]
        const indentMatch = prevLine.match(/^(\s+)/)
        if (indentMatch) {
          indentation = indentMatch[1]
        }
      }

      // If there's indentation to preserve, handle it manually
      if (indentation) {
        e.preventDefault() // Only prevent default if we need to handle indentation

        // Insert a real newline character followed by the indentation
        document.execCommand('insertText', false, '\n' + indentation)
      }

      // Update the buffer with new content
      setTimeout(() => {
        if (editableRef.current) {
          contentBuffer.current = editableRef.current.innerText || ''
        }
      }, 0)
    }
  }

  // Helper function to get cursor position
  const getCursorPosition = (element) => {
    let position = 0
    if (!element) return position

    const selection = window.getSelection()
    if (selection.rangeCount === 0) return position

    const range = selection.getRangeAt(0).cloneRange()
    range.setStart(element, 0)
    position = range.toString().length

    return position
  }

  // Update content when user types
  const handleInput = () => {
    if (editableRef.current) {
      const content = editableRef.current.innerText || ''
      DEBUG &&
        console.log(
          '[DEBUG] handleInput - content updated to:',
          content.length > 50 ? content.substring(0, 50) + '...' : content
        )

      // Store content in a ref instead of updating state immediately
      contentBuffer.current = content
    }
  }

  // Update state only when focus is lost
  const handleBlur = () => {
    if (contentBuffer.current) {
      DEBUG &&
        console.log(
          '[DEBUG] handleBlur - updating page content with buffer:',
          contentBuffer.current.length > 50
            ? contentBuffer.current.substring(0, 50) + '...'
            : contentBuffer.current
        )
      updatePageContent(contentBuffer.current)
    }
  }

  // Make sure content is saved when exiting edit mode
  useEffect(() => {
    DEBUG &&
      console.log(
        '[DEBUG] isEditMode effect, isEditMode =',
        isEditMode,
        'hasContentBuffer =',
        !!contentBuffer.current
      )

    if (!isEditMode && contentBuffer.current) {
      DEBUG &&
        console.log('[DEBUG] Exiting edit mode with content in buffer, updating page content')
      updatePageContent(contentBuffer.current)
      contentBuffer.current = ''
    }
  }, [isEditMode, updatePageContent])

  // Handle preview mode change
  useEffect(() => {
    DEBUG &&
      console.log(
        '[DEBUG] Preview mode effect, isEditMode =',
        isEditMode,
        'isPreviewMode =',
        isPreviewMode
      )

    if (isEditMode && !isPreviewMode) {
      DEBUG && console.log('[DEBUG] Going from preview back to edit mode')
      // When going from preview back to edit mode, restore content in editor
      setTimeout(() => {
        if (editableRef.current) {
          const content = contentBuffer.current || selectedNote?.content || ''
          DEBUG &&
            console.log(
              '[DEBUG] Restoring editor content to:',
              content.length > 50 ? content.substring(0, 50) + '...' : content
            )
          editableRef.current.innerText = content
        } else {
          DEBUG && console.log('[DEBUG] Cannot restore editor content, editableRef.current is null')
        }
      }, 0)
    }
  }, [isPreviewMode, isEditMode, selectedNote])

  // Initialization when switching to edit mode
  useEffect(() => {
    DEBUG &&
      console.log(
        '[DEBUG] Edit mode/selection change effect, isEditMode =',
        isEditMode,
        'hasSelectedNote =',
        !!selectedNote
      )

    if (isEditMode && editableRef.current && selectedNote) {
      const content = selectedNote.content || ''
      DEBUG &&
        console.log(
          '[DEBUG] Initializing editor with content:',
          content.length > 50 ? content.substring(0, 50) + '...' : content
        )

      // Set the content correctly when entering edit mode
      editableRef.current.innerText = content
      contentBuffer.current = content

      // Focus and position cursor at end
      setTimeout(() => {
        if (editableRef.current) {
          DEBUG && console.log('[DEBUG] Focusing editor and setting cursor position')
          editableRef.current.focus()

          const range = document.createRange()
          const selection = window.getSelection()

          range.selectNodeContents(editableRef.current)
          range.collapse(false) // collapse to end

          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          DEBUG && console.log('[DEBUG] Cannot focus editor, editableRef.current is null')
        }
      }, 10)
    }
  }, [isEditMode, selectedNote])


  // Loading state
  if (isLoading && !selectedNote) {
    DEBUG && console.log('[DEBUG] Rendering loading state')
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error) {
    DEBUG && console.log('[DEBUG] Rendering error state:', error)
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    )
  }

  // Welcome message when no note is selected
  if (!selectedNote) {
    DEBUG && console.log('[DEBUG] Rendering welcome message (no note selected)')
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Welcome to TwoNote</Typography>
        <Typography variant="body1">
          {selectedSection
            ? `Currently viewing section: ${selectedSection.title}. Select a note to view its content.`
            : selectedNotebook
              ? `Currently viewing ${selectedNotebook.name}. Pick a section to view notes.`
              : 'Select a notebook from the sidebar.'}
        </Typography>
      </Box>
    )
  }

  // Log what we're about to render
  DEBUG &&
    console.log(
      '[DEBUG] Rendering main content with mode:',
      isEditMode ? (isPreviewMode ? 'preview' : 'edit') : 'view'
    )
  DEBUG &&
    console.log(
      '[DEBUG] Note content for rendering:',
      selectedNote.content
        ? selectedNote.content.length > 50
          ? selectedNote.content.substring(0, 50) + '...'
          : selectedNote.content
        : 'empty'
    )

  // Main content area with note content
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{selectedNote.title}</Typography>

      <Box
        sx={{
          height: '850px',
          overflowY: 'auto',
          pl: 0, // Remove left padding to align with title
          pr: 0, // Remove right padding
          py: 1, // Keep top and bottom padding
          mt: 2,
          backgroundColor: 'transparent'
        }}
      >
        {isEditMode ? (
          isPreviewMode ? (
            // Preview mode within edit mode - shows rendered markdown of current edits
            <MarkdownRenderer markdown={contentBuffer.current || selectedNote.content || ''} />
          ) : (
            // Regular edit mode - shows editable text
            <pre
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              style={{
                minHeight: '100%',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '1rem',
                lineHeight: '1.5',
                padding: '8px 0',
                margin: 0
              }}
            />
          )
        ) : (
          // Regular view mode (not editing)
          <MarkdownRenderer markdown={selectedNote.content || ''} />
        )}
      </Box>
    </Box>
  )
}

export default ContentArea