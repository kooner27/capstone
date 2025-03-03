import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNotebook } from './NotebookContext'

// Custom markdown renderer component
const MarkdownRenderer = ({ markdown }) => {
  // Parse the markdown into sections (text or code blocks)
  const parseMarkdown = (text) => {
    const sections = [];
    let currentText = '';
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent = '';
    
    // Split by lines to process code blocks
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for code block markers ```
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Starting a code block - save previous text
          if (currentText) {
            sections.push({ type: 'text', content: currentText });
            currentText = '';
          }
          
          // Get language (if specified)
          codeLanguage = line.slice(3).trim();
          codeContent = '';
          inCodeBlock = true;
        } else {
          // Ending a code block
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
        // Add line to code content
        codeContent += (codeContent ? '\n' : '') + line;
      } else {
        // Add line to text content
        currentText += (currentText ? '\n' : '') + line;
      }
    }
    
    // Add any remaining text
    if (currentText) {
      sections.push({ type: 'text', content: currentText });
    }
    
    // If we ended with an unclosed code block, add it as text
    if (inCodeBlock && codeContent) {
      sections.push({ type: 'text', content: '```' + codeLanguage + '\n' + codeContent });
    }
    
    return sections;
  };
  
  // Format regular text (basic markdown formatting)
  const formatText = (text) => {
    // Process bold text (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Process italic text (*text*)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process headers (# Header)
    text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Process links ([text](url))
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Process lists
    // - First replace list markers with HTML markers
    text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
    // - Then wrap consecutive list items with <ul>
    const lines = text.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('<li>')) {
        if (!inList) {
          lines[i] = '<ul>' + lines[i];
          inList = true;
        }
      } else if (inList) {
        lines[i-1] = lines[i-1] + '</ul>';
        inList = false;
      }
    }
    // - Close list if document ends with a list
    if (inList && lines.length > 0) {
      lines[lines.length-1] = lines[lines.length-1] + '</ul>';
    }
    text = lines.join('\n');
    
    return text;
  };
  
  // Run code block handler
  const handleRunCode = (code) => {
    // Placeholder function - in a real app this would execute the code
    alert(`Code execution result: ${code.slice(0, 50)}...`);
  };
  
  // Render code block
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
    );
  };
  
  // Render text block with markdown formatting
  const renderTextBlock = (textBlock, index) => {
    const formattedHtml = formatText(textBlock.content);
    
    return (
      <Box key={`text-${index}`} sx={{ my: 1 }}>
        <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />
      </Box>
    );
  };
  
  // Main renderer
  const sections = parseMarkdown(markdown || '');
  
  return (
    <Box>
      {sections.map((section, index) => 
        section.type === 'code' 
          ? renderCodeBlock(section, index) 
          : renderTextBlock(section, index)
      )}
    </Box>
  );
};

const ContentArea = () => {
  const { 
    selectedNotebook, 
    selectedSection, 
    selectedPage,
    isEditMode,
    getPageContent,
    updatePageContent
  } = useNotebook()

  // Holds the current content while editing
  const [currentContent, setCurrentContent] = useState('')
  
  // Ref for the contentEditable div
  const editableRef = useRef(null)
  
  // Flag to track if the div has been initialized with content
  const [contentInitialized, setContentInitialized] = useState(false)

  // Generate default content for new pages
  const generateDefaultContent = (pageName) => {
    return `# ${pageName}\n\nThis is a sample markdown page. You can use **bold** or *italic* text.\n\n## Code Example\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello, world!");\n  return "Hello";\n}\n\`\`\`\n\n### Lists\n\n- Item one\n- Item two\n- Item three`;
  }

  // When a page is selected, update the current content
  useEffect(() => {
    if (selectedPage) {
      // Get the content for the selected page
      let pageContent = getPageContent(selectedPage);
      
      // If no content exists, create default content and save it
      if (!pageContent) {
        pageContent = generateDefaultContent(selectedPage);
        updatePageContent(pageContent);
      }
      
      setCurrentContent(pageContent);
      
      // Reset initialization when page changes
      setContentInitialized(false);
    }
  }, [selectedPage, getPageContent, updatePageContent]);

  // Set initial content when entering edit mode
  useEffect(() => {
    if (isEditMode && !contentInitialized && editableRef.current) {
      // Set the initial content
      editableRef.current.innerText = currentContent;
      setContentInitialized(true);
      
      // Place cursor at the end
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();
          
          const range = document.createRange();
          const selection = window.getSelection();
          
          range.selectNodeContents(editableRef.current);
          range.collapse(false);
          
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 0);
    }
  }, [isEditMode, currentContent, contentInitialized]);

  // Update currentContent as the user types
  const handleInput = () => {
    if (editableRef.current) {
      setCurrentContent(editableRef.current.innerText);
    }
  };

  // When edit mode is turned off, save the content
  useEffect(() => {
    if (!isEditMode && contentInitialized && selectedPage) {
      // Save the content when exiting edit mode
      updatePageContent(currentContent);
      setContentInitialized(false);
    }
  }, [isEditMode, contentInitialized, currentContent, selectedPage, updatePageContent]);

  if (!selectedPage) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Welcome to TwoNote</Typography>
        <Typography variant="body1">
          {selectedSection
            ? `Currently viewing section: ${selectedSection}. Select a page to view its content.`
            : selectedNotebook
            ? `Currently viewing ${selectedNotebook.name}. Pick a section to view pages.`
            : 'Select a notebook from the sidebar.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Heading */}
      <Typography variant="h4">{selectedPage}</Typography>

      {/* The text editor/viewer is in a scrollable container with increased height */}
      <Box
        sx={{
          height: '700px',
          overflowY: 'auto',
          p: 1,
          mt: 2,
          backgroundColor: 'transparent'
        }}
      >
        {isEditMode ? (
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleInput}
            style={{
              minHeight: "100%",
              outline: "none",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "1rem",
              lineHeight: "1.5",
              padding: "8px"
            }}
          />
        ) : (
          <MarkdownRenderer markdown={getPageContent(selectedPage)} />
        )}
      </Box>
    </Box>
  );
};

export default ContentArea;