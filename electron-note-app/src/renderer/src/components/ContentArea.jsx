import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNotebook } from './NotebookContext'

const MarkdownRenderer = ({ markdown }) => {
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
  const { 
    selectedNotebook, 
    selectedSection, 
    selectedPage,
    isEditMode,
    getPageContent,
    updatePageContent,
    cancelEdit,
    editCanceled,
    setEditCanceled
  } = useNotebook()

  const [currentContent, setCurrentContent] = useState('')
  const editableRef = useRef(null)
  const [contentInitialized, setContentInitialized] = useState(false)

  useEffect(() => {
    setEditCanceled(false)
  }, [selectedPage, setEditCanceled])

  const generateDefaultContent = (pageName) => {
    return `# ${pageName}\n\nThis is a sample markdown page. You can use **bold** or *italic* text.\n\n## Code Example\n\n\`\`\`javascript\nfunction hello() {\n  console.log("Hello, world!");\n  return "Hello";\n}\n\`\`\`\n\n### Lists\n\n- Item one\n- Item two\n- Item three`
  }

  useEffect(() => {
    if (selectedPage) {
      let pageContent = getPageContent(selectedPage)
      
      if (!pageContent) {
        pageContent = generateDefaultContent(selectedPage)
        updatePageContent(pageContent)
      }
      
      setCurrentContent(pageContent)
      setContentInitialized(false)
      setEditCanceled(false)
    }
  }, [selectedPage, getPageContent, updatePageContent, setEditCanceled])

  useEffect(() => {
    if (isEditMode && !contentInitialized && editableRef.current) {
      editableRef.current.innerText = currentContent
      setContentInitialized(true)
      
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus()
          
          const range = document.createRange()
          const selection = window.getSelection()
          
          range.selectNodeContents(editableRef.current)
          range.collapse(false)
          
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }, 0)
    }
  }, [isEditMode, currentContent, contentInitialized])

  const handleInput = () => {
    if (editableRef.current) {
      setCurrentContent(editableRef.current.innerText)
    }
  }

  useEffect(() => {
    if (editCanceled) {
      if (editableRef.current) {
        editableRef.current.innerText = getPageContent(selectedPage)
      }
      setCurrentContent(getPageContent(selectedPage))
      setContentInitialized(false)
      setEditCanceled(false)
    }
  }, [editCanceled, getPageContent, selectedPage, setEditCanceled])

  useEffect(() => {
    if (!isEditMode && contentInitialized && selectedPage && !editCanceled) {
      updatePageContent(currentContent)
      setContentInitialized(false)
    }
  }, [isEditMode, contentInitialized, currentContent, selectedPage, updatePageContent, editCanceled])

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
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{selectedPage}</Typography>

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
  )
}

export default ContentArea