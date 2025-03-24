import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const RequirementsManager = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({
    python: { checked: false, installed: false, version: '' },
    pip: { checked: false, installed: false, version: '' },
    venv: { checked: false, created: false },
    requirements: { installed: false, error: null, output: '' }
  });
  const [error, setError] = useState(null);
  const [logOutput, setLogOutput] = useState([]);
  const [installationProgress, setInstallationProgress] = useState(0);
  const [progressDeterminate, setProgressDeterminate] = useState(false);
  // Add a timeout state to track installation duration
  const [installTimeoutId, setInstallTimeoutId] = useState(null);

  const steps = [
    'Check Python & pip',
    'Select requirements.txt',
    'Setup virtual environment',
    'Install packages'
  ];

  const handleOpen = () => {
    setOpen(true);
    setStep(0);
    setError(null);
    setLogOutput([]);
    setSelectedFile(null);
    setInstallationProgress(0);
    setProgressDeterminate(false);
    setStatus({
      python: { checked: false, installed: false, version: '' },
      pip: { checked: false, installed: false, version: '' },
      venv: { checked: false, created: false },
      requirements: { installed: false, error: null, output: '' }
    });
  };

  const handleClose = () => {
    // Clear any active timeout before closing
    if (installTimeoutId) {
      clearTimeout(installTimeoutId);
      setInstallTimeoutId(null);
    }
    setOpen(false);
  };

  // Step 1: Check Python and pip installation
  const checkPythonInstallation = async () => {
    setLoading(true);
    setLogOutput(prev => [...prev, 'Checking Python and pip installation...']);
    
    try {
      const result = await window.electron.checkPythonInstallation();
      
      if (result.error) {
        setError(`Error checking Python installation: ${result.error}`);
        setLogOutput(prev => [...prev, `Error: ${result.error}`]);
        return false;
      }
      
      const pythonInstalled = result.python.installed;
      const pipInstalled = result.pip.installed;
      
      setStatus({
        ...status,
        python: { 
          checked: true, 
          installed: pythonInstalled, 
          version: result.python.version || '' 
        },
        pip: { 
          checked: true, 
          installed: pipInstalled, 
          version: result.pip.version || '' 
        }
      });
      
      if (pythonInstalled) {
        setLogOutput(prev => [...prev, `Python is installed: ${result.python.version}`]);
      } else {
        setLogOutput(prev => [...prev, 'Python is not installed']);
      }
      
      if (pipInstalled) {
        setLogOutput(prev => [...prev, `Pip is installed: ${result.pip.version}`]);
      } else {
        setLogOutput(prev => [...prev, 'Pip is not installed']);
      }
      
      return pythonInstalled && pipInstalled;
    } catch (error) {
      setError(`Error checking Python installation: ${error.message}`);
      setLogOutput(prev => [...prev, `Error: ${error.message}`]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select requirements.txt file
  const selectRequirementsFile = async () => {
    setLoading(true);
    setLogOutput(prev => [...prev, 'Selecting requirements.txt file...']);
    
    try {
      const result = await window.electron.selectRequirementsFile();
      
      if (result.error) {
        setError(`Error selecting requirements file: ${result.error}`);
        setLogOutput(prev => [...prev, `Error: ${result.error}`]);
        return false;
      }
      
      if (result.canceled) {
        setLogOutput(prev => [...prev, 'File selection canceled']);
        return false;
      }
      
      setSelectedFile({
        path: result.filePath,
        name: result.fileName
      });
      
      setLogOutput(prev => [...prev, `Selected file: ${result.fileName}`]);
      return true;
    } catch (error) {
      setError(`Error selecting requirements file: ${error.message}`);
      setLogOutput(prev => [...prev, `Error: ${error.message}`]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create/check virtual environment
  const setupVirtualEnvironment = async () => {
    setLoading(true);
    setLogOutput(prev => [...prev, 'Setting up virtual environment...']);
    
    try {
      const result = await window.electron.createVenv();
      
      if (!result.success) {
        setError(`Error creating virtual environment: ${result.error}`);
        setLogOutput(prev => [...prev, `Error: ${result.error}`]);
        
        setStatus({
          ...status,
          venv: { checked: true, created: false }
        });
        
        return false;
      }
      
      setStatus({
        ...status,
        venv: { checked: true, created: true }
      });
      
      setLogOutput(prev => [...prev, 'Virtual environment created/updated successfully']);
      return true;
    } catch (error) {
      setError(`Error creating virtual environment: ${error.message}`);
      setLogOutput(prev => [...prev, `Error: ${error.message}`]);
      
      setStatus({
        ...status,
        venv: { checked: true, created: false }
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Install requirements - Improved with better progress feedback
  const installRequirements = async () => {
    if (!selectedFile) {
      setError('No requirements file selected');
      return false;
    }
    
    setLoading(true);
    setLogOutput(prev => [...prev, `Starting installation process for ${selectedFile.name}...`]);
    setLogOutput(prev => [...prev, `Multiple installation strategies will be attempted automatically.`]);
    
    // Add progress message so user knows it's working
    setLogOutput(prev => [...prev, 'This may take several minutes, especially for scientific packages.']);
    setLogOutput(prev => [...prev, 'The window might appear unresponsive but installation is running...']);
    
    // Set up progress tracking
    setProgressDeterminate(false); // Start with indeterminate progress
    setInstallationProgress(0);
    
    // Start progress updates to reassure user that installation is still running
    const progressUpdater = setInterval(() => {
      setLogOutput(prev => {
        // Only add a progress message if it's been a while and we don't have too many already
        const progressMessages = prev.filter(msg => msg.includes('Still working'));
        if (progressMessages.length < 3) {
          return [...prev, `Still working - please wait, installation in progress...`];
        }
        return prev;
      });
      
      // Update the progress bar
      setInstallationProgress(prev => {
        // If we're in indeterminate mode, just cycle between 0-80%
        if (!progressDeterminate) {
          return (prev + 5) % 80;
        }
        // Otherwise, increment until we reach just under 100%
        return Math.min(prev + 1, 95);
      });
    }, 10000); // Update every 10 seconds

    // Add a safety timeout in case the installation process hangs completely
    const timeoutId = setTimeout(() => {
      clearInterval(progressUpdater);
      
      setLogOutput(prev => [...prev, 
        `Installation is taking longer than expected.`,
        `If you want to continue waiting, you can, but you may need to restart the app if it appears stuck.`
      ]);
      
      setError('Installation is taking longer than expected, but may still complete. Check the console log for updates.');
    }, 300000); // 5 minutes timeout
    
    // Store the timeout ID so we can clear it if needed
    setInstallTimeoutId(timeoutId);
    
    try {
      const result = await window.electron.installRequirements(selectedFile.path);
      
      // Clear our progress updater and timeout
      clearInterval(progressUpdater);
      clearTimeout(timeoutId);
      setInstallTimeoutId(null);
      
      // Process the installation output to display in the log
      if (result.output) {
        const outputLines = result.output.split('\n').filter(line => line.trim());
        
        // Filter and categorize output lines for more readable display
        outputLines.forEach(line => {
          // Skip some verbose output lines
          if (line.includes('warning: no files found matching') || 
              line.includes('byte-compiling') ||
              line.startsWith('  ')) {
            return; // Skip these verbose lines
          }
          
          // Add the line without emojis
          if (line.includes('Successfully')) {
            setLogOutput(prev => [...prev, `SUCCESS: ${line}`]);
          }
          else if (line.includes('Strategy') && !line.includes('failed')) {
            setLogOutput(prev => [...prev, `STRATEGY: ${line}`]);
          }
          else if (line.includes('Warning:') || line.includes('Failed') || line.includes('failed')) {
            setLogOutput(prev => [...prev, `WARNING: ${line}`]);
          }
          else if (line.includes('Installing')) {
            setLogOutput(prev => [...prev, `INSTALLING: ${line}`]);
          }
          else {
            setLogOutput(prev => [...prev, line]);
          }
        });
      }
      
      // Switch to determinate progress and set a final value
      setProgressDeterminate(true);
      
      // Handle build errors specifically
      if (result.error && (result.error.includes('build') || result.error.includes('wheel'))) {
        setLogOutput(prev => [...prev, 
          `Build-related errors detected.`,
          `These often occur with scientific packages that need compilation.`,
          `The installer attempted multiple strategies to work around these issues.`
        ]);
      }
      
      // Show final result and set final progress value
      if (result.success) {
        setInstallationProgress(100); // 100% complete
        
        if (result.partial) {
          // Partial success - some packages installed but others failed
          setLogOutput(prev => [...prev, 
            `PARTIAL SUCCESS: Some packages were installed successfully`,
            `Some packages could not be installed due to build errors`,
            `You can still use the successfully installed packages`,
            `For best results with scientific packages, consider using Anaconda Python instead`
          ]);
          
          setStatus({
            ...status,
            requirements: { 
              installed: true, // Mark as installed since we got partial success
              error: result.error,
              output: result.output || ''
            }
          });
          
          // Show a warning but don't block progression
          setError(`Partial installation: ${result.error}`);
          return true; // Return true to allow progression to completion
        } else {
          // Full success
          setLogOutput(prev => [...prev, 
            `SUCCESS: All packages installed successfully!`,
            `Your Python environment is ready to use`
          ]);
          
          setStatus({
            ...status,
            requirements: { 
              installed: true, 
              error: null,
              output: result.output || ''
            }
          });
          
          setError(null);
          return true;
        }
      } else {
        setInstallationProgress(0); // Reset progress on failure
        
        // Complete failure, but display helpful messages
        setLogOutput(prev => [...prev, `FAILED: Installation failed: ${result.error}`]);
        
        // Provide guidance for common error scenarios
        if (result.error.includes('build') || result.error.includes('wheel')) {
          setLogOutput(prev => [...prev, 
            `Build errors are common with scientific packages.`,
            `Consider using Anaconda Python which includes pre-built packages:`,
            `https://www.anaconda.com/download`,
            `Or try a simpler requirements.txt with fewer scientific packages`
          ]);
        } else if (result.error.includes('subprocess-exited-with-error')) {
          setLogOutput(prev => [...prev, 
            `This error often occurs with packages that need compilation.`,
            `You may need to install Visual C++ Build Tools on Windows:`,
            `https://visualstudio.microsoft.com/visual-cpp-build-tools/`,
            `Or try using simpler packages that don't require compilation`
          ]);
        }
        
        setStatus({
          ...status,
          requirements: { 
            installed: false, 
            error: result.error,
            output: result.output || ''
          }
        });
        
        setError(`Installation failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      // Clear our progress updater and timeout
      clearInterval(progressUpdater);
      clearTimeout(timeoutId);
      setInstallTimeoutId(null);
      
      setInstallationProgress(0); // Reset progress on error
      setError(`Error installing requirements: ${error.message}`);
      setLogOutput(prev => [...prev, `ERROR: ${error.message}`]);
      
      setStatus({
        ...status,
        requirements: { 
          installed: false, 
          error: error.message,
          output: ''
        }
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = async () => {
    let success = false;
    
    switch (step) {
      case 0: // Check Python & pip
        success = await checkPythonInstallation();
        break;
      case 1: // Select requirements file
        success = await selectRequirementsFile();
        break;
      case 2: // Setup virtual environment
        success = await setupVirtualEnvironment();
        break;
      case 3: // Install requirements
        success = await installRequirements();
        break;
      default:
        success = true;
    }
    
    if (success) {
      setStep(prevStep => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setStep(prevStep => prevStep - 1);
  };

  // Reset the process
  const handleReset = () => {
    // Clear any active timeout before resetting
    if (installTimeoutId) {
      clearTimeout(installTimeoutId);
      setInstallTimeoutId(null);
    }
    
    setStep(0);
    setError(null);
    setLogOutput([]);
    setSelectedFile(null);
    setInstallationProgress(0);
    setProgressDeterminate(false);
    setStatus({
      python: { checked: false, installed: false, version: '' },
      pip: { checked: false, installed: false, version: '' },
      venv: { checked: false, created: false },
      requirements: { installed: false, error: null, output: '' }
    });
  };

  // Render step content
  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return (
          <Box>
            <DialogContentText>
              Before we can set up a virtual environment and install packages, we need to check if Python and pip are installed on your system.
            </DialogContentText>
            
            {status.python.checked && (
              <Alert 
                severity={status.python.installed ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                {status.python.installed 
                  ? `Python is installed: ${status.python.version}` 
                  : 'Python is not installed. Please install Python to continue.'}
              </Alert>
            )}
            
            {status.pip.checked && (
              <Alert 
                severity={status.pip.installed ? 'success' : 'error'} 
                sx={{ mt: 2 }}
              >
                {status.pip.installed 
                  ? `pip is installed: ${status.pip.version}` 
                  : 'pip is not installed. Please install pip to continue.'}
              </Alert>
            )}
            
            {!status.python.installed && status.python.checked && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Please install Python from <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer">python.org</a> before continuing.
                </Typography>
              </Box>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <DialogContentText>
              Please select a requirements.txt file containing the Python packages you want to install.
            </DialogContentText>
            
            {selectedFile && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected file: {selectedFile.name}
              </Alert>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <DialogContentText>
              Now we'll set up a virtual environment for your Python packages. This keeps your packages isolated from other Python projects.
            </DialogContentText>
            
            {status.venv.checked && (
              <Alert 
                severity={status.venv.created ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                {status.venv.created 
                  ? 'Virtual environment setup successfully.' 
                  : 'Failed to set up virtual environment.'}
              </Alert>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <DialogContentText>
              Finally, we'll install the packages from your requirements.txt file into the virtual environment.
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Note:</strong> This process may take several minutes, especially for scientific packages
                that require compilation. The window may appear unresponsive, but the installation is running.
              </Typography>
            </DialogContentText>
            
            {/* Progress bar for installation */}
            {(loading || installationProgress > 0) && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {progressDeterminate 
                    ? `Installation progress: ${installationProgress}%`
                    : 'Installing packages... (This may take several minutes)'}
                </Typography>
                {progressDeterminate ? (
                  <LinearProgress 
                    variant="determinate" 
                    value={installationProgress}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                ) : (
                  <LinearProgress 
                    variant="indeterminate"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                )}
              </Box>
            )}
            
            {status.requirements.installed && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {status.requirements.error 
                  ? 'Some packages installed successfully (partial success).' 
                  : 'All packages installed successfully.'}
              </Alert>
            )}
            
            {status.requirements.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error installing packages: {status.requirements.error}
              </Alert>
            )}
          </Box>
        );
      
      case 4: // Completion step
        return (
          <Box>
            <Alert 
              severity="success" 
              icon={<CheckCircleOutlineIcon />} 
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Setup Complete!
                </Typography>
                <Typography>
                  Your Python environment is now configured with all required packages.
                </Typography>
              </Box>
            </Alert>
            
            <DialogContentText>
              You can now run Python code in this environment. All imported packages from your requirements.txt file will be available.
            </DialogContentText>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  // Render the console output
  const renderConsole = () => (
    <Paper
      elevation={3}
      sx={{
        mt: 2,
        p: 2,
        bgcolor: '#2b2b2b',
        color: '#f8f8f8',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        height: '200px', // Increased height to show more log messages
        overflow: 'auto',
        borderRadius: 1
      }}
    >
      {logOutput.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#888', fontStyle: 'italic' }}>
          Log output will appear here...
        </Typography>
      ) : (
        logOutput.map((log, index) => (
          <Typography 
            variant="body2" 
            key={index} 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              mb: 0.5,
              color: log.includes('SUCCESS') 
                ? '#98c379' 
                : log.includes('ERROR') || log.includes('FAILED') || log.includes('WARNING')
                ? '#e06c75'
                : '#f8f8f8'
            }}
          >
            {log}
          </Typography>
        ))
      )}
    </Paper>
  );

  return (
    <>
      <Button
        color="inherit"
        startIcon={<TerminalIcon />}
        onClick={handleOpen}
        sx={{ mx: 1 }}
      >
        Python Packages
      </Button>
      
      <Dialog
        open={open}
        onClose={loading ? undefined : handleClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Python Package Manager
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={step} sx={{ py: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ mb: 2 }}>
            {getStepContent(step)}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {renderConsole()}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Cancel'}
          </Button>
          
          <Box sx={{ flex: '1 1 auto' }} />
          
          {step === steps.length && (
            <Button 
              onClick={handleReset}
              variant="outlined"
            >
              Reset
            </Button>
          )}
          
          {step > 0 && step < steps.length && (
            <Button 
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </Button>
          )}
          
          {step < steps.length && (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading 
                ? step === 3 
                  ? 'Installing...' 
                  : 'Working...' 
                : step === steps.length - 1 
                  ? 'Finish' 
                  : 'Next'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RequirementsManager;