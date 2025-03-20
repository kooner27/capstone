import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { useNotebook } from './NotebookContext'
import { useNotebookData } from './NotebookDataContext'
import CodeBlock from './CodeBlock' // Import the new CodeBlock component

// MarkdownRenderer component with CodeBlock integration
const MarkdownRenderer = ({ markdown }) => {
  console.log('[DEBUG-MARKDOWN] Rendering markdown with content:', 
    markdown ? (markdown.length > 50 ? markdown.substring(0, 50) + '...' : markdown) : 'empty');

  const parseMarkdown = (text) => {
    const sections = []
    let currentText = ''
    let inCodeBlock = false
    let codeLanguage = ''
    let codeContent = ''
    
    const lines = text.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          if (currentText) {
            sections.push({ type: 'text', content: currentText })
            currentText = ''
          }
          
          codeLanguage = line.slice(3).trim()
          codeContent = ''
          inCodeBlock = true
        } else {
          sections.push({ 
            type: 'code', 
            language: codeLanguage, 
            content: codeContent 
          })
          codeLanguage = ''
          codeContent = ''
          inCodeBlock = false
        }
      } else if (inCodeBlock) {
        codeContent += (codeContent ? '\n' : '') + line
      } else {
        currentText += (currentText ? '\n' : '') + line
      }
    }
    
    if (currentText) {
      sections.push({ type: 'text', content: currentText })
    }
    
    if (inCodeBlock && codeContent) {
      sections.push({ type: 'text', content: '```' + codeLanguage + '\n' + codeContent })
    }
    
    return sections
  }
  
  const formatText = (text) => {
    // First, separate all content by paragraph blocks
    const paragraphs = text.split(/\n\n+/)
    
    return paragraphs.map(paragraph => {
      // Check if this paragraph is a list before replacing newlines
      const isList = paragraph.split('\n').some(line => line.trim().match(/^- /));
      
      if (isList) {
        // Process as a list
        const listItems = paragraph.split('\n')
          .map(line => {
            // Check if line is actually a list item
            if (line.trim().match(/^- (.*)/)) {
              // Extract the content after the dash
              const content = line.trim().replace(/^- (.*)/, '$1');
              return `<li>${content}</li>`;
            }
            // If it's not a list item but part of the list paragraph
            // (like an introductory line before the list), wrap in a p tag
            return line.trim() ? `<p>${line}</p>` : '';
          })
          .filter(item => item) // Remove empty lines
          .join('');
        
        // If we found actual list items, wrap them in a ul
        if (listItems.includes('<li>')) {
          return `<ul>${listItems}</ul>`;
        }
        return listItems;
      }
      
      // For non-list paragraphs, process as before
      let processedText = paragraph.replace(/\n/g, '<br>')
      
      // Process formatting
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>')
      processedText = processedText.replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
      processedText = processedText.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
      processedText = processedText.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')
      processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      
      // Only wrap in paragraph if not already a heading
      if (!processedText.match(/^<h[1-3]>/) && 
          !processedText.match(/^<ul>/) && 
          !processedText.trim().startsWith('<li>')) {
        return '<p>' + processedText + '</p>'
      }
      
      return processedText
    }).join('')
  }
  
  const renderTextBlock = (textBlock, index) => {
    const formattedHtml = formatText(textBlock.content)
    
    const customStyles = `
      p { margin: 0 0 0.5em 0; }
      p:last-child { margin-bottom: 0; }
      h1, h2, h3 { margin-top: 0.8em; margin-bottom: 0.5em; }
      ul { margin-top: 0.3em; margin-bottom: 0.5em; padding-left: 1.5em; }
      li { margin-bottom: 0.2em; }
    `
    
    return (
      <Box key={`text-${index}`} sx={{ my: 1 }}>
        <style>{customStyles}</style>
        <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />
      </Box>
    )
  }
  
  const sections = parseMarkdown(markdown || '')
  
  return (
    <Box>
      {sections.map((section, index) => 
        section.type === 'code' 
          ? <CodeBlock 
              key={`code-${index}`}
              code={section.content}
              language={section.language}
              index={index}
            /> 
          : renderTextBlock(section, index)
      )}
    </Box>
  )
}

const ContentArea = () => {
  console.log('[DEBUG] ContentArea component rendering');
  
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
  } = useNotebook();

  // Log what we have when rendering
  console.log('[DEBUG] ContentArea current state:', {
    hasSelectedNote: !!selectedNote,
    noteId: selectedNote?._id, 
    isEditMode, 
    isPreviewMode,
    editCanceled,
    contentLength: selectedNote?.content?.length || 0
  });

  // Get loading, error, and data operations from NotebookDataContext
  const {
    isLoading,
    error,
    updateNote
  } = useNotebookData();

  const editableRef = useRef(null);
  const contentBuffer = useRef(''); // Buffer to store content without re-rendering
  
  // Handle edit cancellation - FIXED VERSION
  useEffect(() => {
    console.log('[DEBUG] editCanceled effect running, editCanceled =', editCanceled);
    console.log('[DEBUG] Current editStartContent =', 
      editStartContent ? (editStartContent.length > 50 ? editStartContent.substring(0, 50) + '...' : editStartContent) : 'empty');
    
    if (editCanceled) {
      console.log('[DEBUG] Processing edit cancellation');
      console.log('[DEBUG] Current isEditMode:', isEditMode);
      console.log('[DEBUG] Current editableRef exists:', !!editableRef.current);
      
      // Reset the editor if we're still in edit mode
      if (editableRef.current && isEditMode) {
        console.log('[DEBUG] Resetting editable content to editStartContent');
        editableRef.current.innerText = editStartContent;
      } else {
        console.log('[DEBUG] Not in edit mode, no need to reset editor');
      }
      
      // Clear the content buffer to avoid affecting content when switching modes
      console.log('[DEBUG] Clearing contentBuffer');
      contentBuffer.current = '';
      
      console.log('[DEBUG] Resetting editCanceled flag');
      setEditCanceled(false);
      
      console.log('[DEBUG] Edit cancellation processing completed');
    }
  }, [editCanceled, editStartContent, isEditMode, setEditCanceled]);

  // Handle Enter key for line breaks
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Store information about indentation before the default Enter action
      const content = editableRef.current?.innerText || '';
      const cursorPos = getCursorPosition(editableRef.current);
      const lines = content.substring(0, cursorPos).split('\n');
      let indentation = '';
      
      // Check if previous line had indentation
      if (lines.length > 0) {
        const prevLine = lines[lines.length - 1];
        const indentMatch = prevLine.match(/^(\s+)/);
        if (indentMatch) {
          indentation = indentMatch[1];
        }
      }
      
      // If there's indentation to preserve, handle it manually
      if (indentation) {
        e.preventDefault(); // Only prevent default if we need to handle indentation
        
        // Insert a real newline character followed by the indentation
        document.execCommand('insertText', false, '\n' + indentation);
      }
      
      // Update the buffer with new content
      setTimeout(() => {
        if (editableRef.current) {
          contentBuffer.current = editableRef.current.innerText || '';
        }
      }, 0);
    }
  };
  
  // Helper function to get cursor position
  const getCursorPosition = (element) => {
    let position = 0;
    if (!element) return position;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return position;
    
    const range = selection.getRangeAt(0).cloneRange();
    range.setStart(element, 0);
    position = range.toString().length;
    
    return position;
  };

  // Update content when user types
  const handleInput = () => {
    if (editableRef.current) {
      const content = editableRef.current.innerText || '';
      console.log('[DEBUG] handleInput - content updated to:', 
        content.length > 50 ? content.substring(0, 50) + '...' : content);
      
      // Store content in a ref instead of updating state immediately
      contentBuffer.current = content;
    }
  };

  // Update state only when focus is lost
  const handleBlur = () => {
    if (contentBuffer.current) {
      console.log('[DEBUG] handleBlur - updating page content with buffer:', 
        contentBuffer.current.length > 50 ? contentBuffer.current.substring(0, 50) + '...' : contentBuffer.current);
      updatePageContent(contentBuffer.current);
    }
  };

  // Make sure content is saved when exiting edit mode
  useEffect(() => {
    console.log('[DEBUG] isEditMode effect, isEditMode =', isEditMode, 'hasContentBuffer =', !!contentBuffer.current);
    
    if (!isEditMode && contentBuffer.current) {
      console.log('[DEBUG] Exiting edit mode with content in buffer, updating page content');
      updatePageContent(contentBuffer.current);
      contentBuffer.current = '';
    }
  }, [isEditMode, updatePageContent]);

  // Handle preview mode change
  useEffect(() => {
    console.log('[DEBUG] Preview mode effect, isEditMode =', isEditMode, 'isPreviewMode =', isPreviewMode);
    
    if (isEditMode && !isPreviewMode) {
      console.log('[DEBUG] Going from preview back to edit mode');
      // When going from preview back to edit mode, restore content in editor
      setTimeout(() => {
        if (editableRef.current) {
          const content = contentBuffer.current || selectedNote?.content || '';
          console.log('[DEBUG] Restoring editor content to:', 
            content.length > 50 ? content.substring(0, 50) + '...' : content);
          editableRef.current.innerText = content;
        } else {
          console.log('[DEBUG] Cannot restore editor content, editableRef.current is null');
        }
      }, 0);
    }
  }, [isPreviewMode, isEditMode, selectedNote]);

  // Initialization when switching to edit mode
  useEffect(() => {
    console.log('[DEBUG] Edit mode/selection change effect, isEditMode =', isEditMode, 'hasSelectedNote =', !!selectedNote);
    
    if (isEditMode && editableRef.current && selectedNote) {
      const content = selectedNote.content || '';
      console.log('[DEBUG] Initializing editor with content:', 
        content.length > 50 ? content.substring(0, 50) + '...' : content);
      
      // Set the content correctly when entering edit mode
      editableRef.current.innerText = content;
      contentBuffer.current = content;
      
      // Focus and position cursor at end
      setTimeout(() => {
        if (editableRef.current) {
          console.log('[DEBUG] Focusing editor and setting cursor position');
          editableRef.current.focus();
          
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(editableRef.current);
          range.collapse(false); // collapse to end
          
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          console.log('[DEBUG] Cannot focus editor, editableRef.current is null');
        }
      }, 10);
    }
  }, [isEditMode, selectedNote]);

  // Generate default content for new notes
  const generateDefaultContent = (title) => {
    return `# ${title}\n\nThis is a sample markdown page. You can use **bold** or *italic* text.\n\n## Code Example\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello, world!");\n  return "Hello";\n}\n\`\`\`\n\n### Lists\n\n- Item one\n- Item two\n- Item three`;
  };

  // Initialize new notes with default content
  useEffect(() => {
    if (selectedNote) {
      let content = selectedNote.content || '';
      
      if (!content && selectedNote.title) {
        content = generateDefaultContent(selectedNote.title);
        if (selectedNotebook && selectedSection) {
          updateNote(
            selectedNotebook._id,
            selectedSection._id,
            selectedNote._id,
            selectedNote.title,
            content
          );
        }
      }
    }
  }, [selectedNote, selectedNotebook, selectedSection, updateNote]);

  // Loading state
  if (isLoading && !selectedNote) {
    console.log('[DEBUG] Rendering loading state');
    return (
      <Box sx={{ 
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    console.log('[DEBUG] Rendering error state:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  // Welcome message when no note is selected
  if (!selectedNote) {
    console.log('[DEBUG] Rendering welcome message (no note selected)');
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
    );
  }

  // Log what we're about to render
  console.log('[DEBUG] Rendering main content with mode:', isEditMode ? (isPreviewMode ? 'preview' : 'edit') : 'view');
  console.log('[DEBUG] Note content for rendering:', 
    selectedNote.content ? (selectedNote.content.length > 50 ? selectedNote.content.substring(0, 50) + '...' : selectedNote.content) : 'empty');

  // Main content area with note content
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{selectedNote.title}</Typography>
      
      <Box
        sx={{
          height: '700px',
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
                minHeight: "100%",
                outline: "none",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "1rem",
                lineHeight: "1.5",
                padding: "8px 0",
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
  );
};

export default ContentArea;