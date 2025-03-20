import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

const CodeBlock = ({ code, language, index }) => {
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      // JavaScript execution (client-side)
      if (language && language.toLowerCase() === 'javascript') {
        executeJavaScript(code);
      } 
      // Python execution (via Python REPL)
      else if (language && language.toLowerCase() === 'python') {
        await executePythonViaRepl(code);
      } 
      // Other languages
      else {
        setExecutionResult({
          success: false,
          error: `Running ${language || 'unknown'} code is not supported yet.`,
          logs: []
        });
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        error: `Execution error: ${error.message}`,
        logs: []
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Execute JavaScript directly in the browser
  const executeJavaScript = (code) => {
    // Set up console capture
    const originalConsole = { ...console };
    const logCapture = [];
    
    console.log = (...args) => {
      logCapture.push({ type: 'log', content: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ') });
    };
    
    console.error = (...args) => {
      logCapture.push({ type: 'error', content: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ') });
    };
    
    console.warn = (...args) => {
      logCapture.push({ type: 'warn', content: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ') });
    };
    
    try {
      // Execute the code in a controlled environment
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
      `);
      
      const result = executeCode();
      
      // Restore original console
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      
      // Set the result
      setExecutionResult({
        success: result.success,
        error: result.error,
        stack: result.stack,
        logs: logCapture
      });
    } catch (error) {
      // Restore original console
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      
      setExecutionResult({
        success: false,
        error: error.message,
        stack: error.stack,
        logs: logCapture
      });
    }
  };

  // Execute Python via Python's interactive REPL
  const executePythonViaRepl = async (code) => {
    try {
      // Check if we're in Electron and have access to the IPC API
      if (!window.electron || !window.electron.runPython) {
        throw new Error("Python execution is only available in the Electron app");
      }
      
      // Call the IPC method to execute Python
      const result = await window.electron.runPython(code);
      
      // Clean up the Python REPL output
      const cleanedOutput = cleanReplOutput(result.output || '');
      const cleanedError = cleanReplError(result.error || '');
      
      // Process the result
      const logs = [];
      
      if (cleanedOutput) {
        logs.push({ type: 'log', content: cleanedOutput });
      }
      
      if (cleanedError) {
        logs.push({ type: 'error', content: cleanedError });
      }
      
      const hasError = Boolean(cleanedError || result.error);
      
      setExecutionResult({
        success: !hasError,
        error: result.error,
        logs: logs
      });
    } catch (error) {
      setExecutionResult({
        success: false,
        error: `Failed to execute Python: ${error.message}`,
        logs: []
      });
    }
  };
  
  // Helper function to clean Python REPL output
  const cleanReplOutput = (output) => {
    if (!output) return '';
    
    // Remove Python prompts and version info
    let cleaned = output;
    
    // Remove Python version and prompt at the beginning
    cleaned = cleaned.replace(/^Python \d+\.\d+\.\d+.*?\n>>>\s+/s, '');
    
    // Remove all occurrences of the primary prompt
    cleaned = cleaned.replace(/^>>>\s+/gm, '');
    
    // Remove all occurrences of the secondary prompt
    cleaned = cleaned.replace(/^\.\.\.\s+/gm, '');
    
    // Remove the exit prompt at the end
    cleaned = cleaned.replace(/>>>\s+exit\(\)\s*$/s, '');
    
    return cleaned.trim();
  };
  
  // Helper function to clean Python REPL errors
  const cleanReplError = (error) => {
    if (!error) return '';
    
    // Remove traceback paths that aren't relevant to the user
    let cleaned = error;
    
    // Remove internal traceback info
    cleaned = cleaned.replace(/^Traceback \(most recent call last\):\s+File.*?in.+?\n\s+/s, '');
    
    return cleaned.trim();
  };

  // Helper function to get appropriate color for log types
  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#e06c75';
      case 'warn': return '#d19a66';
      default: return '#abb2bf';
    }
  };

  return (
    <Box sx={{ 
      backgroundColor: '#282c34', 
      color: '#abb2bf',
      p: 2, 
      my: 2, 
      borderRadius: 1,
      position: 'relative',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap'
    }}>
      {/* Language tag */}
      {language && (
        <Typography variant="caption" sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          p: 1,
          color: '#61afef'
        }}>
          {language}
        </Typography>
      )}
      
      {/* Code content */}
      <Typography component="pre" sx={{ m: 0, color: '#abb2bf', overflowX: 'auto' }}>
        {code}
      </Typography>
      
      {/* Run button */}
      <Button 
        variant="contained" 
        size="small" 
        onClick={handleRunCode}
        disabled={isExecuting}
        startIcon={isExecuting ? <CircularProgress size={14} color="inherit" /> : null}
        sx={{ mt: 1 }}
      >
        {isExecuting ? 'Running...' : 'Run'}
      </Button>
      
      {/* Results section */}
      {executionResult && (
        <Box sx={{ 
          mt: 2, 
          p: 1, 
          borderTop: '1px solid #4b5263',
          backgroundColor: '#21252b',
          borderRadius: '0 0 4px 4px'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#98c379' }}>Output:</Typography>
          
          {/* Errors */}
          {!executionResult.success && executionResult.error && (
            <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(224, 108, 117, 0.1)', borderRadius: 1 }}>
              <Typography sx={{ color: '#e06c75', fontWeight: 'bold' }}>
                Error: {executionResult.error}
              </Typography>
              {executionResult.stack && (
                <Typography variant="caption" component="pre" sx={{ 
                  color: '#e06c75', 
                  mt: 1,
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.7rem',
                  opacity: 0.7
                }}>
                  {executionResult.stack}
                </Typography>
              )}
            </Box>
          )}
          
          {/* Console logs */}
          {executionResult.logs && executionResult.logs.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#61afef', display: 'block', mb: 0.5 }}>
                {language === 'python' ? 'Python Output:' : 'Console Output:'}
              </Typography>
              <Box sx={{ 
                pl: 1, 
                borderLeft: '2px solid #3a3f4b', 
                ml: 1
              }}>
                {executionResult.logs.map((log, i) => (
                  <Typography key={i} variant="body2" sx={{ 
                    color: getLogColor(log.type),
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {log.type === 'error' ? '🔴 ' : log.type === 'warn' ? '⚠️ ' : ''}
                    {log.content}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
          
          {/* Success message if no logs and no errors */}
          {executionResult.success && (!executionResult.logs || executionResult.logs.length === 0) && (
            <Typography sx={{ color: '#98c379', fontStyle: 'italic', mt: 1 }}>
              Code executed successfully with no output.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CodeBlock;