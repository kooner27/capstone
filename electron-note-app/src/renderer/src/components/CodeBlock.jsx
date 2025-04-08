/*
This code file is necessary for handling the UI side of code execution.
It renders code blocks and handles execution from the render process.
It is necessary for FR7 and FR9 and FR10 which dicuss rendering and code execution
*/
import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, IconButton, CircularProgress, Tooltip, Chip } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ClearIcon from '@mui/icons-material/Clear'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const executionResultsStore = {}

const CodeBlock = ({ code, language, index, noteId }) => {
  const blockId = `${noteId}-${index}`
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(executionResultsStore[blockId] || null)
  const [copied, setCopied] = useState(false)
  const [venvStatus, setVenvStatus] = useState({
    checked: false,
    available: false
  })

  useEffect(() => {
    if (executionResult) {
      executionResultsStore[blockId] = executionResult
    }
  }, [executionResult, blockId])

  useEffect(() => {
    const checkVenvStatus = async () => {
      if (language && language.toLowerCase() === 'python') {
        try {
          if (window.electron && window.electron.checkVenvStatus) {
            const status = await window.electron.checkVenvStatus()
            setVenvStatus({
              checked: true,
              available: status.exists
            })
          } else {
            setVenvStatus({
              checked: true,
              available: false
            })
          }
        } catch (error) {
          console.error('[DEBUG-CODEBLOCK] Error checking venv status:', error)
          setVenvStatus({
            checked: true,
            available: false
          })
        }
      }
    }

    checkVenvStatus()
  }, [language])

  useEffect(() => {
    const codeSignature = code.trim()
    const storedResult = executionResultsStore[blockId]

    if (storedResult && storedResult.codeSignature !== codeSignature) {
      setExecutionResult(null)
      delete executionResultsStore[blockId]
    }
  }, [code, blockId])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRunCode = async () => {
    setIsExecuting(true)

    try {
      if (language && language.toLowerCase() === 'javascript') {
        executeJavaScript(code)
      } else if (language && language.toLowerCase() === 'python') {
        await executePythonViaRepl(code)
      } else {
        const newResult = {
          success: false,
          error: `Running ${language || 'unknown'} code is not supported yet.`,
          logs: [],
          codeSignature: code.trim()
        }
        setExecutionResult(newResult)
        executionResultsStore[blockId] = newResult
      }
    } catch (error) {
      const newResult = {
        success: false,
        error: `Execution error: ${error.message}`,
        logs: [],
        codeSignature: code.trim()
      }
      setExecutionResult(newResult)
      executionResultsStore[blockId] = newResult
    } finally {
      setIsExecuting(false)
    }
  }

  const handleClearOutput = () => {
    setExecutionResult(null)
    delete executionResultsStore[blockId]
  }

  const executeJavaScript = (code) => {
    const originalConsole = { ...console }
    const logCapture = []

    console.log = (...args) => {
      logCapture.push({
        type: 'log',
        content: args
          .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
          .join(' ')
      })
    }

    console.error = (...args) => {
      logCapture.push({
        type: 'error',
        content: args
          .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
          .join(' ')
      })
    }

    console.warn = (...args) => {
      logCapture.push({
        type: 'warn',
        content: args
          .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
          .join(' ')
      })
    }

    try {
      const executeCode = new Function(`
        try {
          ${code}
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.message,
            stack: error.stack
          };
        }
      `)

      const result = executeCode()

      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn

      const newResult = {
        success: result.success,
        error: result.error,
        stack: result.stack,
        logs: logCapture,
        codeSignature: code.trim()
      }

      setExecutionResult(newResult)
      executionResultsStore[blockId] = newResult
    } catch (error) {
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn

      const newResult = {
        success: false,
        error: error.message,
        stack: error.stack,
        logs: logCapture,
        codeSignature: code.trim()
      }

      setExecutionResult(newResult)
      executionResultsStore[blockId] = newResult
    }
  }

  const executePythonViaRepl = async (code) => {
    try {
      if (!window.electron || !window.electron.runPython) {
        throw new Error('Python execution is only available in the Electron app')
      }

      if (venvStatus.checked && !venvStatus.available) {
        const result = await window.electron.runPython(code, false)

        const cleanedOutput = cleanReplOutput(result.output || '')
        const cleanedError = cleanReplError(result.error || '')

        const logs = []

        logs.push({
          type: 'warn',
          content:
            'No virtual environment detected. Running with system Python. Use the "Python Packages" button in the navbar to set up a virtual environment.'
        })

        if (cleanedOutput) {
          logs.push({ type: 'log', content: cleanedOutput })
        }

        if (cleanedError) {
          logs.push({ type: 'error', content: cleanedError })
        }

        const hasError = Boolean(cleanedError || result.error)

        const newResult = {
          success: !hasError,
          error: result.error,
          logs: logs,
          codeSignature: code.trim()
        }

        setExecutionResult(newResult)
        executionResultsStore[blockId] = newResult
      } else {
        const result = await window.electron.runPython(code, venvStatus.available)

        const cleanedOutput = cleanReplOutput(result.output || '')
        const cleanedError = cleanReplError(result.error || '')

        const logs = []

        if (venvStatus.available) {
          logs.push({
            type: 'log',
            content: 'Running in virtual environment with installed packages.'
          })
        }

        if (cleanedOutput) {
          logs.push({ type: 'log', content: cleanedOutput })
        }

        if (cleanedError) {
          logs.push({ type: 'error', content: cleanedError })
        }

        const hasError = Boolean(cleanedError || result.error)

        const newResult = {
          success: !hasError,
          error: result.error,
          logs: logs,
          codeSignature: code.trim()
        }

        setExecutionResult(newResult)
        executionResultsStore[blockId] = newResult
      }
    } catch (error) {
      const newResult = {
        success: false,
        error: `Failed to execute Python: ${error.message}`,
        logs: [],
        codeSignature: code.trim()
      }

      setExecutionResult(newResult)
      executionResultsStore[blockId] = newResult
    }
  }

  const cleanReplOutput = (output) => {
    if (!output) return ''
    let cleaned = output
    cleaned = cleaned.replace(/^Python \d+\.\d+\.\d+.*?\n>>>\s+/s, '')
    cleaned = cleaned.replace(/^>>>\s+/gm, '')
    cleaned = cleaned.replace(/^\.\.\.\s+/gm, '')
    cleaned = cleaned.replace(/>>>\s+exit\(\)\s*$/s, '')
    return cleaned.trim()
  }

  const cleanReplError = (error) => {
    if (!error) return ''
    let cleaned = error
    cleaned = cleaned.replace(/^Traceback \(most recent call last\):\s+File.*?in.+?\n\s+/s, '')
    return cleaned.trim()
  }

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return '#e06c75'
      case 'warn':
        return '#d19a66'
      default:
        return '#abb2bf'
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: '#282c34',
        color: '#abb2bf',
        p: 0,
        my: 4,
        borderRadius: 2,
        position: 'relative',
        fontFamily:
          '"JetBrains Mono", "Fira Code", "Source Code Pro", Consolas, Monaco, "Andale Mono", monospace',
        whiteSpace: 'pre-wrap',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        border: '1px solid #3a3f4b'
      }}
    >
      {/* Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid #3a3f4b',
          backgroundColor: '#21252b',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}
      >
        {/* Left side with language and env status */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {language && (
            <Chip
              label={language.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: 'rgba(97, 175, 239, 0.15)',
                color: '#61afef',
                fontWeight: 'bold',
                borderRadius: 1,
                fontSize: '0.7rem',
                height: 24
              }}
            />
          )}

          {/* Python Venv Status - Right of language */}
          {language && language.toLowerCase() === 'python' && venvStatus.checked && (
            <Chip
              icon={
                venvStatus.available ? (
                  <CheckIcon sx={{ fontSize: '0.9rem', color: '#98c379' }} />
                ) : null
              }
              label={venvStatus.available ? 'Virtual Environment' : 'System Python'}
              size="small"
              sx={{
                backgroundColor: venvStatus.available
                  ? 'rgba(152, 195, 121, 0.1)'
                  : 'rgba(209, 154, 102, 0.1)',
                color: venvStatus.available ? '#98c379' : '#d19a66',
                fontWeight: 'medium',
                fontSize: '0.7rem',
                height: 24
              }}
            />
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Copy Button */}
          <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
            <IconButton
              size="small"
              onClick={handleCopyCode}
              sx={{
                color: copied ? '#98c379' : '#abb2bf',
                backgroundColor: copied ? 'rgba(152, 195, 121, 0.1)' : 'rgba(171, 178, 191, 0.1)',
                '&:hover': {
                  backgroundColor: copied ? 'rgba(152, 195, 121, 0.2)' : 'rgba(171, 178, 191, 0.2)'
                },
                width: 28,
                height: 28
              }}
            >
              {copied ? (
                <CheckIcon sx={{ fontSize: '0.9rem' }} />
              ) : (
                <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Clear Output Button */}
          {executionResult && (
            <Tooltip title="Clear output">
              <IconButton
                size="small"
                onClick={handleClearOutput}
                sx={{
                  color: '#e06c75',
                  backgroundColor: 'rgba(224, 108, 117, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(224, 108, 117, 0.2)'
                  },
                  width: 28,
                  height: 28
                }}
              >
                <ClearIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Run Code Button */}
          <Tooltip title={`Run ${language || 'code'}`}>
            <IconButton
              size="small"
              onClick={handleRunCode}
              disabled={isExecuting}
              sx={{
                color: '#abb2bf',
                backgroundColor: 'rgba(97, 175, 239, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(97, 175, 239, 0.25)'
                },
                width: 28,
                height: 28
              }}
            >
              {isExecuting ? (
                <CircularProgress size={16} sx={{ color: '#61afef' }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: '1rem', color: '#61afef' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Code Area */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          '& pre': {
            margin: 0,
            padding: 0,
            backgroundColor: '#21252b !important'
          },
          '& code': {
            fontFamily: 'inherit !important',
            fontSize: '0.9rem !important',
            paddingLeft: '12px !important',
            paddingTop: '12px !important',
            paddingBottom: '12px !important',
            marginLeft: '0 !important'
          },
          '& .code-line': {
            display: 'block !important',
            paddingLeft: '36px !important',
            paddingTop: '4px !important',
            paddingBottom: '4px !important',
            marginLeft: '0 !important'
          },
          '& .code-line:hover': {
            backgroundColor: 'rgba(97, 175, 239, 0.05)',
            borderLeft: '3px solid #61afef !important'
          },
          '&::-webkit-scrollbar': {
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#4b5263',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#5c6370'
            }
          }
        }}
      >
        <SyntaxHighlighter
          language={language ? language.toLowerCase() : 'text'}
          style={oneDark}
          showLineNumbers={false}
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: '24px 18px 24px 18px',
            backgroundColor: '#21252b',
            borderRadius: 0,
            overflowX: 'auto'
          }}
          codeTagProps={{
            style: {
              fontFamily:
                '"JetBrains Mono", "Fira Code", "Source Code Pro", Consolas, Monaco, monospace',
              display: 'block',
              paddingLeft: 0
            }
          }}
          lineProps={() => ({
            style: {
              display: 'block',
              paddingLeft: 0,
              marginLeft: 0,
              borderLeft: '3px solid transparent'
            },
            className: 'code-line'
          })}
          PreTag={({ children, ...props }) => (
            <pre {...props} style={{ margin: 0, padding: 0 }}>
              {children}
            </pre>
          )}
        >
          {code}
        </SyntaxHighlighter>
      </Box>

      {/* Output Area */}
      {executionResult && (
        <Box
          sx={{
            p: 0,
            borderTop: '1px solid #3a3f4b',
            backgroundColor: '#262a31'
          }}
        >
          {/* Output Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2.5,
              py: 1.5,
              borderBottom: '1px solid #3a3f4b'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: executionResult.success ? '#98c379' : '#e06c75',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '0.8rem',
                '&::before': {
                  content: '""',
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: executionResult.success ? '#98c379' : '#e06c75',
                  borderRadius: '50%',
                  marginRight: '8px'
                }
              }}
            >
              {executionResult.success ? 'Success' : 'Error'}
            </Typography>

            {/* Status Chip */}
            <Chip
              label={executionResult.success ? 'Executed Successfully' : 'Execution Failed'}
              size="small"
              sx={{
                backgroundColor: executionResult.success
                  ? 'rgba(152, 195, 121, 0.1)'
                  : 'rgba(224, 108, 117, 0.1)',
                color: executionResult.success ? '#98c379' : '#e06c75',
                fontWeight: 'medium',
                fontSize: '0.7rem',
                height: 24
              }}
            />
          </Box>

          {/* Output Content */}
          <Box
            sx={{
              p: 2.5,
              maxHeight: '300px',
              overflowY: 'auto',
              overflowX: 'auto'
            }}
          >
            {/* Error Message */}
            {!executionResult.success && executionResult.error && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: 'rgba(224, 108, 117, 0.05)',
                  borderRadius: 1,
                  border: '1px solid rgba(224, 108, 117, 0.2)'
                }}
              >
                <Typography sx={{ color: '#e06c75', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Error: {executionResult.error}
                </Typography>
                {executionResult.stack && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      color: '#e06c75',
                      mt: 1.5,
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      p: 1.5,
                      borderRadius: 1,
                      whiteSpace: 'pre',
                      fontSize: '0.75rem',
                      overflowX: 'auto'
                    }}
                  >
                    {executionResult.stack}
                  </Typography>
                )}
              </Box>
            )}

            {/* Logs Output */}
            {executionResult.logs && executionResult.logs.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1.5
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#61afef',
                      fontWeight: 'medium',
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(97, 175, 239, 0.1)',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    {language === 'python' ? 'Python Output' : 'Console Output'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    pl: 2,
                    borderLeft: '2px solid #3a3f4b',
                    py: 1,
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    borderRadius: 1,
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                    '&::-webkit-scrollbar': {
                      height: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#4b5263',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: '#5c6370'
                      }
                    }
                  }}
                >
                  {executionResult.logs.map((log, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      sx={{
                        color: getLogColor(log.type),
                        fontSize: '0.85rem',
                        fontFamily: 'inherit',
                        whiteSpace: 'pre',
                        px: 2,
                        py: 0.5,
                        borderBottom:
                          i < executionResult.logs.length - 1
                            ? '1px dashed rgba(171, 178, 191, 0.1)'
                            : 'none'
                      }}
                    >
                      {log.type === 'error' ? '🔴 ' : log.type === 'warn' ? '⚠️ ' : '💬 '}
                      {log.content}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* No Output Message */}
            {executionResult.success &&
              (!executionResult.logs || executionResult.logs.length === 0) && (
                <Typography
                  sx={{
                    color: '#abb2bf',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    backgroundColor: 'rgba(152, 195, 121, 0.05)',
                    p: 2,
                    borderRadius: 1,
                    border: '1px dashed rgba(152, 195, 121, 0.2)'
                  }}
                >
                  Code executed successfully with no output.
                </Typography>
              )}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default CodeBlock
