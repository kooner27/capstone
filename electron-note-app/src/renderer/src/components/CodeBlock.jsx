import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, IconButton, CircularProgress, Tooltip } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ClearIcon from '@mui/icons-material/Clear'

const executionResultsStore = {}

const CodeBlock = ({ code, language, index, noteId }) => {
  const blockId = `${noteId}-${index}`

  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(executionResultsStore[blockId] || null)

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
        p: 2,
        my: 2,
        borderRadius: 1,
        position: 'relative',
        fontFamily:
          '"JetBrains Mono", "Fira Code", "Source Code Pro", Consolas, Monaco, "Andale Mono", monospace',
        whiteSpace: 'pre-wrap'
      }}
    >
      {}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}
      >
        {}
        {language && (
          <Typography
            variant="caption"
            sx={{
              color: '#61afef',
              fontWeight: 'medium'
            }}
          >
            {language}
          </Typography>
        )}

        {}
        {language && language.toLowerCase() === 'python' && venvStatus.checked && (
          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              ml: 'auto',
              mr: 2,
              color: venvStatus.available ? '#98c379' : '#d19a66',
              fontSize: '0.7rem'
            }}
          >
            {venvStatus.available
              ? '🟢 Using virtual environment'
              : '⚠️ Using system Python (No virtual environment)'}
          </Typography>
        )}

        {}
        <Box sx={{ display: 'inline-flex' }}>
          {executionResult && (
            <Tooltip title="Clear output">
              <IconButton
                size="small"
                onClick={handleClearOutput}
                sx={{
                  color: '#abb2bf',
                  backgroundColor: 'rgba(224, 108, 117, 0.1)',
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(224, 108, 117, 0.2)'
                  }
                }}
              >
                <ClearIcon sx={{ color: '#e06c75', fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={`Run ${language || 'code'}`}>
            <IconButton
              size="small"
              onClick={handleRunCode}
              disabled={isExecuting}
              sx={{
                color: '#abb2bf',
                backgroundColor: 'rgba(97, 175, 239, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(97, 175, 239, 0.2)'
                }
              }}
            >
              {isExecuting ? (
                <CircularProgress size={18} sx={{ color: '#61afef' }} />
              ) : (
                <PlayArrowIcon sx={{ color: '#61afef' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {}
      <Typography
        component="pre"
        sx={{
          m: 0,
          color: '#abb2bf',
          overflowX: 'auto',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        {code}
      </Typography>

      {}
      {executionResult && (
        <Box
          sx={{
            mt: 2,
            p: 1,
            borderTop: '1px solid #4b5263',
            backgroundColor: '#21252b',
            borderRadius: '0 0 4px 4px'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ color: '#98c379' }}>
              Output:
            </Typography>
          </Box>

          {}
          {!executionResult.success && executionResult.error && (
            <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(224, 108, 117, 0.1)', borderRadius: 1 }}>
              <Typography sx={{ color: '#e06c75', fontWeight: 'bold' }}>
                Error: {executionResult.error}
              </Typography>
              {executionResult.stack && (
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    color: '#e06c75',
                    mt: 1,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.7rem',
                    opacity: 0.7
                  }}
                >
                  {executionResult.stack}
                </Typography>
              )}
            </Box>
          )}

          {}
          {executionResult.logs && executionResult.logs.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#61afef', display: 'block', mb: 0.5 }}>
                {language === 'python' ? 'Python Output:' : 'Console Output:'}
              </Typography>
              <Box
                sx={{
                  pl: 1,
                  borderLeft: '2px solid #3a3f4b',
                  ml: 1
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
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {log.type === 'error' ? '🔴 ' : log.type === 'warn' ? '⚠️ ' : ''}
                    {log.content}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {}
          {executionResult.success &&
            (!executionResult.logs || executionResult.logs.length === 0) && (
              <Typography sx={{ color: '#98c379', fontStyle: 'italic', mt: 1 }}>
                Code executed successfully with no output.
              </Typography>
            )}
        </Box>
      )}
    </Box>
  )
}

export default CodeBlock
