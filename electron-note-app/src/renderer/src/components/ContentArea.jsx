import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { useNotebook } from './NotebookContext'
import { useNotebookData } from './NotebookDataContext'

// MarkdownRenderer component is unchanged
const MarkdownRenderer = ({ markdown }) => {
  // Markdown renderer code unchanged
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
    const paragraphs = text.split(/\n\n+/)
    
    return paragraphs.map(paragraph => {
      let processedText = paragraph.replace(/\n/g, '<br>')
      
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>')
      processedText = processedText.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      processedText = processedText.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      processedText = processedText.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      
      if (processedText.match(/^- .*?(<br>- .*?)*$/)) {
        processedText = processedText.replace(/<br>- /g, '- ')
        processedText = processedText.replace(/^- (.*?)$/gm, '<li>$1</li>')
        return '<ul>' + processedText + '</ul>'
      }
      
      if (!processedText.match(/^<h[1-3]>/) && 
          !processedText.match(/^<ul>/) && 
          !processedText.trim().startsWith('<li>')) {
        return '<p>' + processedText + '</p>'
      }
      
      return processedText
    }).join('')
  }
  
  const handleRunCode = (code) => {
    alert(`Code execution result: ${code.slice(0, 50)}...`)
  }
  
  const renderCodeBlock = (codeBlock, index) => {
    return (
      <Box key={`code-${index}`} sx={{ 
        backgroundColor: '#282c34', 
        color: '#abb2bf',
        p: 2, 
        my: 2, 
        borderRadius: 1,
        position: 'relative',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
      }}>
        {codeBlock.language && (
          <Typography variant="caption" sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            p: 1,
            color: '#61afef'
          }}>
            {codeBlock.language}
          </Typography>
        )}
        
        <Typography component="pre" sx={{ m: 0, color: '#abb2bf' }}>
          {codeBlock.content}
        </Typography>
        
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => handleRunCode(codeBlock.content)}
          sx={{ mt: 1 }}
        >
          Run
        </Button>
      </Box>
    )
  }
  
  const renderTextBlock = (textBlock, index) => {
    const formattedHtml = formatText(textBlock.content)
    
    const customStyles = `
      p { margin: 0 0 0.5em 0; }
      p:last-child { margin-bottom: 0; }
      h1, h2, h3 { margin-top: 0.8em; margin-bottom: 0.5em; }
      ul { margin-top: 0.3em; margin-bottom: 0.5em; }
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
          ? renderCodeBlock(section, index) 
          : renderTextBlock(section, index)
      )}
    </Box>
  )
}

const ContentArea = () => {
  // Get selection and edit state from NotebookContext
  const { 
    selectedNotebook,
    selectedSection,
    selectedNote,
    isEditMode,
    editCanceled,
    setEditCanceled,
    updatePageContent,
    editStartContent
  } = useNotebook();

  // Get loading, error, and data operations from NotebookDataContext
  const {
    isLoading,
    error,
    updateNote
  } = useNotebookData();

  const editableRef = useRef(null);
  const contentBuffer = useRef(''); // Buffer to store content without re-rendering
  
  // Handle edit cancellation
  useEffect(() => {
    if (editCanceled) {
      console.log('Edit canceled detected, restoring original content:', editStartContent);
      
      // Reset the editor directly with edit start content
      if (editableRef.current && isEditMode) {
        editableRef.current.innerText = editStartContent;
      }
      
      // When cancelling, update the content that will be displayed in view mode
      updatePageContent(editStartContent);
      contentBuffer.current = editStartContent;
      
      setEditCanceled(false);
    }
  }, [editCanceled, editStartContent, isEditMode, setEditCanceled, updatePageContent]);

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
      // Store content in a ref instead of updating state immediately
      contentBuffer.current = editableRef.current.innerText || '';
    }
  };

  // Update state only when focus is lost
  const handleBlur = () => {
    if (contentBuffer.current) {
      updatePageContent(contentBuffer.current);
    }
  };

  // Make sure content is saved when exiting edit mode
  useEffect(() => {
    if (!isEditMode && contentBuffer.current) {
      updatePageContent(contentBuffer.current);
      contentBuffer.current = '';
    }
  }, [isEditMode, updatePageContent]);

  // Initialization when switching to edit mode
  useEffect(() => {
    if (isEditMode && editableRef.current && selectedNote) {
      console.log('Initializing editor with content:', selectedNote.content);
      
      // Set the content correctly when entering edit mode
      editableRef.current.innerText = selectedNote.content || '';
      contentBuffer.current = selectedNote.content || '';
      
      // Focus and position cursor at end
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();
          
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(editableRef.current);
          range.collapse(false); // collapse to end
          
          selection.removeAllRanges();
          selection.addRange(range);
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
              padding: "8px 0", // Removed left/right padding
              margin: 0
            }}
          />
        ) : (
          <MarkdownRenderer markdown={selectedNote.content || ''} />
        )}
      </Box>
    </Box>
  );
};

export default ContentArea;