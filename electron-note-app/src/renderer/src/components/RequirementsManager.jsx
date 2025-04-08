/*
This code block is for handling requirements management.
Users can setup a python environment and download packages.
This is necessary in order to setup code execution.
It helps implement FR 7 and FR 10
*/
import React, { useState, useEffect } from 'react'
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
  LinearProgress,
  Card,
  CardContent,
  InputAdornment,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  IconButton,
  Tooltip
} from '@mui/material'
import TerminalIcon from '@mui/icons-material/Terminal'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

const DIALOG_CONTENT_HEIGHT = '500px'
const TABLE_HEIGHT = '220px'
const CONSOLE_HEIGHT = '250px'

const RequirementsManager = () => {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState('packages')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [status, setStatus] = useState({
    python: { checked: false, installed: false, version: '' },
    pip: { checked: false, installed: false, version: '' },
    venv: { checked: false, created: false },
    requirements: { installed: false, error: null, output: '' }
  })
  const [error, setError] = useState(null)
  const [logOutput, setLogOutput] = useState([])
  const [installationProgress, setInstallationProgress] = useState(0)
  const [progressDeterminate, setProgressDeterminate] = useState(false)
  const [installTimeoutId, setInstallTimeoutId] = useState(null)

  const [installedPackages, setInstalledPackages] = useState([])
  const [packageListLoading, setPackageListLoading] = useState(false)
  const [packageSearchQuery, setPackageSearchQuery] = useState('')
  const [packagesSortBy, setPackagesSortBy] = useState('name')
  const [packagesSortDirection, setPackagesSortDirection] = useState('asc')
  const [venvExists, setVenvExists] = useState(false)
  const [pythonInfo, setPythonInfo] = useState({
    python: { version: 'Unknown' },
    pip: { version: 'Unknown' }
  })

  const steps = [
    'Check Python & pip',
    'Select requirements.txt',
    'Setup virtual environment',
    'Install packages'
  ]

  useEffect(() => {
    if (open) {
      checkEnvironmentStatus()
    }
  }, [open])

  const checkEnvironmentStatus = async () => {
    try {
      const venvResult = await window.electron.checkVenvStatus()
      setVenvExists(venvResult.exists)

      const pythonResult = await window.electron.checkPythonInstallation()
      setPythonInfo(pythonResult)

      if (venvResult.exists) {
        fetchInstalledPackages()
      }
    } catch (error) {
      console.error('Error checking environment status:', error)
      setVenvExists(false)
    }
  }

  const fetchInstalledPackages = async () => {
    setPackageListLoading(true)
    setError(null)

    try {
      const result = await window.electron.listInstalledPackages()
      
      if (result.success) {
        let processedPackages = []

        if (Array.isArray(result.packages)) {
          const samplePackage = result.packages[0]
          
          if (samplePackage) {
            if (typeof samplePackage === 'object') {
              processedPackages = result.packages.map((pkg) => {
                return {
                  name: pkg.name || pkg.package_name || Object.keys(pkg)[0] || 'Unknown',
                  version:
                    pkg.version || pkg.package_version || pkg[Object.keys(pkg)[0]] || 'Unknown'
                }
              })
            } else if (typeof samplePackage === 'string') {
              processedPackages = result.packages.map((pkgStr) => {
                const parts = pkgStr.split('@')
                return {
                  name: parts[0] || 'Unknown',
                  version: parts[1] || 'Unknown'
                }
              })
            }
          }
        }

        setInstalledPackages(processedPackages)
        setLogOutput((prev) => [...prev, `Found ${processedPackages.length} installed packages`])
      } else {
        setError(result.error || 'Failed to fetch installed packages')
        setLogOutput((prev) => [...prev, `Error: ${result.error}`])
        setInstalledPackages([])
      }
    } catch (error) {
      setError(`Error fetching installed packages: ${error.message}`)
      setLogOutput((prev) => [...prev, `Error: ${error.message}`])
      setInstalledPackages([])
    } finally {
      setPackageListLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    setViewMode('packages')
    setError(null)
    checkEnvironmentStatus()
  }

  const handleClose = () => {
    if (installTimeoutId) {
      clearTimeout(installTimeoutId)
      setInstallTimeoutId(null)
    }
    setOpen(false)
  }

  const handleStartWizard = () => {
    setViewMode('wizard')
    setStep(0)
    setError(null)
    setLogOutput([])
    setSelectedFile(null)
    setInstallationProgress(0)
    setProgressDeterminate(false)
    setStatus({
      python: { checked: false, installed: false, version: '' },
      pip: { checked: false, installed: false, version: '' },
      venv: { checked: false, created: false },
      requirements: { installed: false, error: null, output: '' }
    })
  }

  const checkPythonInstallation = async () => {
    setLoading(true)
    setLogOutput((prev) => [...prev, 'Checking Python and pip installation...'])

    try {
      const result = await window.electron.checkPythonInstallation()

      if (result.error) {
        setError(`Error checking Python installation: ${result.error}`)
        setLogOutput((prev) => [...prev, `Error: ${result.error}`])
        return false
      }

      const pythonInstalled = result.python.installed
      const pipInstalled = result.pip.installed

      setPythonInfo(result)

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
      })

      if (pythonInstalled) {
        setLogOutput((prev) => [...prev, `Python is installed: ${result.python.version}`])
      } else {
        setLogOutput((prev) => [...prev, 'Python is not installed'])
      }

      if (pipInstalled) {
        setLogOutput((prev) => [...prev, `Pip is installed: ${result.pip.version}`])
      } else {
        setLogOutput((prev) => [...prev, 'Pip is not installed'])
      }

      return pythonInstalled && pipInstalled
    } catch (error) {
      setError(`Error checking Python installation: ${error.message}`)
      setLogOutput((prev) => [...prev, `Error: ${error.message}`])
      return false
    } finally {
      setLoading(false)
    }
  }

  const selectRequirementsFile = async () => {
    setLoading(true)
    setLogOutput((prev) => [...prev, 'Selecting requirements.txt file...'])

    try {
      const result = await window.electron.selectRequirementsFile()

      if (result.error) {
        setError(`Error selecting requirements file: ${result.error}`)
        setLogOutput((prev) => [...prev, `Error: ${result.error}`])
        return false
      }

      if (result.canceled) {
        setLogOutput((prev) => [...prev, 'File selection canceled'])
        return false
      }

      setSelectedFile({
        path: result.filePath,
        name: result.fileName
      })

      setLogOutput((prev) => [...prev, `Selected file: ${result.fileName}`])
      return true
    } catch (error) {
      setError(`Error selecting requirements file: ${error.message}`)
      setLogOutput((prev) => [...prev, `Error: ${error.message}`])
      return false
    } finally {
      setLoading(false)
    }
  }

  const setupVirtualEnvironment = async () => {
    setLoading(true)
    setLogOutput((prev) => [...prev, 'Setting up virtual environment...'])

    try {
      const result = await window.electron.createVenv()

      if (!result.success) {
        setError(`Error creating virtual environment: ${result.error}`)
        setLogOutput((prev) => [...prev, `Error: ${result.error}`])

        setStatus({
          ...status,
          venv: { checked: true, created: false }
        })

        return false
      }

      setStatus({
        ...status,
        venv: { checked: true, created: true }
      })

      setVenvExists(true)
      setLogOutput((prev) => [...prev, 'Virtual environment created successfully'])
      return true
    } catch (error) {
      setError(`Error creating virtual environment: ${error.message}`)
      setLogOutput((prev) => [...prev, `Error: ${error.message}`])

      setStatus({
        ...status,
        venv: { checked: true, created: false }
      })

      return false
    } finally {
      setLoading(false)
    }
  }

  const installRequirements = async () => {
    if (!selectedFile) {
      setError('No requirements file selected')
      return false
    }

    setLoading(true)
    setLogOutput((prev) => [...prev, `Starting installation for ${selectedFile.name}...`])
    setLogOutput((prev) => [...prev, 'This may take several minutes. Please wait...'])

    setProgressDeterminate(false)
    setInstallationProgress(0)

    const progressUpdater = setInterval(() => {
      setLogOutput((prev) => {
        const progressMessages = prev.filter((msg) => msg.includes('Still working'))
        if (progressMessages.length < 3) {
          return [...prev, `Still working - installation in progress...`]
        }
        return prev
      })

      setInstallationProgress((prev) => {
        if (!progressDeterminate) {
          return (prev + 5) % 80
        }

        return Math.min(prev + 1, 95)
      })
    }, 10000)

    const timeoutId = setTimeout(() => {
      clearInterval(progressUpdater)

      setLogOutput((prev) => [
        ...prev,
        `Installation is taking longer than expected.`
      ])

      setError(
        'Installation is taking longer than expected. Check the console log for updates.'
      )
    }, 300000)

    setInstallTimeoutId(timeoutId)

    try {
      const result = await window.electron.installRequirements(selectedFile.path)

      clearInterval(progressUpdater)
      clearTimeout(timeoutId)
      setInstallTimeoutId(null)

      if (result.output) {
        const outputLines = result.output.split('\n').filter((line) => line.trim())

        outputLines.forEach((line) => {
          if (
            line.includes('warning: no files found matching') ||
            line.includes('byte-compiling') ||
            line.startsWith('  ')
          ) {
            return
          }

          if (line.includes('Successfully')) {
            setLogOutput((prev) => [...prev, `SUCCESS: ${line}`])
          } else if (line.includes('Strategy') && !line.includes('failed')) {
            setLogOutput((prev) => [...prev, `STRATEGY: ${line}`])
          } else if (
            line.includes('Warning:') ||
            line.includes('Failed') ||
            line.includes('failed')
          ) {
            setLogOutput((prev) => [...prev, `WARNING: ${line}`])
          } else if (line.includes('Installing')) {
            setLogOutput((prev) => [...prev, `INSTALLING: ${line}`])
          } else {
            setLogOutput((prev) => [...prev, line])
          }
        })
      }

      setProgressDeterminate(true)

      if (result.success) {
        setInstallationProgress(100)

        if (result.partial) {
          setLogOutput((prev) => [
            ...prev,
            `PARTIAL SUCCESS: Some packages were installed successfully`
          ])

          setStatus({
            ...status,
            requirements: {
              installed: true,
              error: result.error,
              output: result.output || ''
            }
          })

          setError(`Partial installation: ${result.error}`)

          await fetchInstalledPackages()

          return true
        } else {
          setLogOutput((prev) => [
            ...prev,
            `SUCCESS: All packages installed successfully!`
          ])

          setStatus({
            ...status,
            requirements: {
              installed: true,
              error: null,
              output: result.output || ''
            }
          })

          setError(null)

          await fetchInstalledPackages()

          return true
        }
      } else {
        setInstallationProgress(0)

        setLogOutput((prev) => [...prev, `FAILED: Installation failed: ${result.error}`])

        setStatus({
          ...status,
          requirements: {
            installed: false,
            error: result.error,
            output: result.output || ''
          }
        })

        setError(`Installation failed: ${result.error}`)
        return false
      }
    } catch (error) {
      clearInterval(progressUpdater)
      clearTimeout(timeoutId)
      setInstallTimeoutId(null)

      setInstallationProgress(0)
      setError(`Error installing requirements: ${error.message}`)
      setLogOutput((prev) => [...prev, `ERROR: ${error.message}`])

      setStatus({
        ...status,
        requirements: {
          installed: false,
          error: error.message,
          output: ''
        }
      })

      return false
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    let success = false

    switch (step) {
      case 0:
        success = await checkPythonInstallation()
        break
      case 1:
        success = await selectRequirementsFile()
        break
      case 2:
        success = await setupVirtualEnvironment()
        break
      case 3:
        success = await installRequirements()
        break
      default:
        success = true
    }

    if (success) {
      setStep((prevStep) => prevStep + 1)
    }
  }

  const handleBack = () => {
    setStep((prevStep) => prevStep - 1)
  }

  const handleReset = () => {
    if (installTimeoutId) {
      clearTimeout(installTimeoutId)
      setInstallTimeoutId(null)
    }

    setStep(0)
    setError(null)
    setLogOutput([])
    setSelectedFile(null)
    setInstallationProgress(0)
    setProgressDeterminate(false)
    setStatus({
      python: { checked: false, installed: false, version: '' },
      pip: { checked: false, installed: false, version: '' },
      venv: { checked: false, created: false },
      requirements: { installed: false, error: null, output: '' }
    })
  }

  const handlePackageSortChange = (property) => {
    const isAsc = packagesSortBy === property && packagesSortDirection === 'asc'
    setPackagesSortDirection(isAsc ? 'desc' : 'asc')
    setPackagesSortBy(property)
  }

  const getFilteredPackages = () => {
    if (!installedPackages || !Array.isArray(installedPackages) || installedPackages.length === 0) {
      return []
    }

    try {
      let filteredList = [...installedPackages]

      if (packageSearchQuery) {
        const query = packageSearchQuery.toLowerCase()
        filteredList = filteredList.filter((pkg) => {
          const name = pkg && pkg.name ? pkg.name.toLowerCase() : ''
          const version = pkg && pkg.version ? pkg.version.toLowerCase() : ''
          return name.includes(query) || version.includes(query)
        })
      }

      filteredList.sort((a, b) => {
        try {
          const factor = packagesSortDirection === 'asc' ? 1 : -1

          if (packagesSortBy === 'name') {
            const nameA = (a && a.name) || ''
            const nameB = (b && b.name) || ''
            return factor * nameA.localeCompare(nameB)
          } else if (packagesSortBy === 'version') {
            const versionA = (a && a.version) || ''
            const versionB = (b && b.version) || ''
            return factor * versionA.localeCompare(versionB)
          }
        } catch (e) {
          console.error('Error sorting packages:', e)
        }
        return 0
      })

      return filteredList
    } catch (error) {
      console.error('Error in getFilteredPackages:', error)
      return []
    }
  }

  const handleWizardCompletion = () => {
    setViewMode('packages')
    fetchInstalledPackages()
  }

  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return (
          <Box>
            <DialogContentText sx={{ mb: 2 }}>
              First, we'll check if Python and pip are installed on your system.
            </DialogContentText>

            {status.python.checked && (
              <Alert severity={status.python.installed ? 'success' : 'error'} sx={{ mt: 2 }}>
                {status.python.installed
                  ? `Python is installed: ${status.python.version}`
                  : 'Python is not installed. Please install Python to continue.'}
              </Alert>
            )}

            {status.pip.checked && (
              <Alert severity={status.pip.installed ? 'success' : 'error'} sx={{ mt: 2 }}>
                {status.pip.installed
                  ? `pip is installed: ${status.pip.version}`
                  : 'pip is not installed. Please install pip to continue.'}
              </Alert>
            )}

            {!status.python.installed && status.python.checked && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Please install Python from{' '}
                  <a
                    href="https://www.python.org/downloads/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    python.org
                  </a>
                </Typography>
              </Box>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <DialogContentText sx={{ mb: 2 }}>
              Select a requirements.txt file with the Python packages you want to install.
            </DialogContentText>

            {selectedFile && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Selected file: {selectedFile.name}
              </Alert>
            )}
          </Box>
        )

      case 2:
        return (
          <Box>
            <DialogContentText sx={{ mb: 2 }}>
              We'll set up a virtual environment to keep your packages isolated from other projects.
            </DialogContentText>

            {status.venv.checked && (
              <Alert severity={status.venv.created ? 'success' : 'error'} sx={{ mt: 2 }}>
                {status.venv.created
                  ? 'Virtual environment setup successfully.'
                  : 'Failed to set up virtual environment.'}
              </Alert>
            )}
          </Box>
        )

      case 3:
        return (
          <Box>
            <DialogContentText sx={{ mb: 2 }}>
              Finally, we'll install the packages from your requirements.txt file.
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                This may take several minutes, especially for scientific packages.
              </Typography>
            </DialogContentText>

            {(loading || installationProgress > 0) && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {progressDeterminate
                    ? `Installation progress: ${installationProgress}%`
                    : 'Installing packages...'}
                </Typography>
                {progressDeterminate ? (
                  <LinearProgress
                    variant="determinate"
                    value={installationProgress}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                ) : (
                  <LinearProgress variant="indeterminate" sx={{ height: 8, borderRadius: 1 }} />
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
        )

      case 4:
        return (
          <Box>
            <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Setup Complete!
                </Typography>
                <Typography>
                  Your Python environment is now configured with all required packages.
                </Typography>
              </Box>
            </Alert>

            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environment Information
                </Typography>
                <Typography variant="body2">
                  <strong>Python Version:</strong> {status.python.version}
                </Typography>
                <Typography variant="body2">
                  <strong>Pip Version:</strong> {status.pip.version}
                </Typography>
                {selectedFile && (
                  <Typography variant="body2">
                    <strong>Requirements File:</strong> {selectedFile.name}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )

      default:
        return 'Unknown step'
    }
  }

  const renderConsole = () => (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        mt: 2,
        p: 2,
        bgcolor: '#2b2b2b',
        color: '#f8f8f8',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        height: CONSOLE_HEIGHT,
        overflow: 'auto',
        borderRadius: 1
      }}
    >
      <Box sx={{ 
        height: '100%', 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px'
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
      }}>
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
      </Box>
    </Paper>
  )

  const renderPackagesView = () => (
    <Box>
      <DialogContentText>
        Python packages installed in your virtual environment:
      </DialogContentText>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          mt: 2
        }}
      >
        <Typography variant="subtitle1">
          {venvExists
            ? `${getFilteredPackages().length} package(s)${
                installedPackages.length !== getFilteredPackages().length
                  ? ` (filtered from ${installedPackages.length})`
                  : ''
              }`
            : 'No virtual environment found'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            placeholder="Search packages..."
            variant="outlined"
            size="small"
            value={packageSearchQuery}
            onChange={(e) => setPackageSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <Tooltip title="Refresh package list">
            <IconButton
              onClick={fetchInstalledPackages}
              disabled={packageListLoading || !venvExists}
            >
              {packageListLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {packageListLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, height: TABLE_HEIGHT }}>
          <CircularProgress />
        </Box>
      ) : !venvExists ? (
        <Box
          sx={{
            height: TABLE_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Alert severity="warning">
            No virtual environment found. Click "Install Packages" below to set up a virtual
            environment.
          </Alert>
        </Box>
      ) : installedPackages.length === 0 ? (
        <Box
          sx={{
            height: TABLE_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Alert severity="info">
            No packages installed in the virtual environment.
          </Alert>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ 
            height: TABLE_HEIGHT, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
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
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={packagesSortBy === 'name'}
                    direction={packagesSortBy === 'name' ? packagesSortDirection : 'asc'}
                    onClick={() => handlePackageSortChange('name')}
                  >
                    Package Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={packagesSortBy === 'version'}
                    direction={packagesSortBy === 'version' ? packagesSortDirection : 'asc'}
                    onClick={() => handlePackageSortChange('version')}
                  >
                    Version
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredPackages().length > 0 ? (
                getFilteredPackages().map((pkg, index) => (
                  <TableRow key={`${pkg.name}-${index}`}>
                    <TableCell>{pkg.name || 'Unknown'}</TableCell>
                    <TableCell>{pkg.version || 'Unknown'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {packageSearchQuery
                        ? 'No packages match your search.'
                        : 'No packages to display.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Environment Information
          </Typography>
          <Typography variant="body2">
            <strong>Python:</strong> {pythonInfo.python.version || 'Unknown'}
          </Typography>
          <Typography variant="body2">
            <strong>Pip:</strong> {pythonInfo.pip.version || 'Unknown'}
          </Typography>
          <Typography variant="body2">
            <strong>Virtual Environment:</strong> {venvExists ? 'Found' : 'Not found'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )

  return (
    <>
      <Tooltip title="Python Package Manager">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          sx={{
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <TerminalIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={loading ? undefined : handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: 'auto',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', pb: 1 }}>
          Python Package Manager
        </DialogTitle>

        <DialogContent sx={{ 
          height: DIALOG_CONTENT_HEIGHT, 
          p: 3,
          '&::-webkit-scrollbar': {
            width: '8px'
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
        }}>
          {viewMode === 'wizard' ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {step < steps.length && (
                <Stepper activeStep={step} sx={{ py: 2, mb: 2 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              )}

              <Box sx={{ mb: 2, flex: '0 0 auto' }}>{getStepContent(step)}</Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2, flex: '0 0 auto' }}>
                  {error}
                </Alert>
              )}

              {step < steps.length && (
                <Box sx={{ flex: '1 1 auto', minHeight: CONSOLE_HEIGHT, overflow: 'hidden' }}>
                  {renderConsole()}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {renderPackagesView()}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)', p: 2 }}>
          {viewMode === 'wizard' ? (
            step === steps.length ? (
              <>
                <Button
                  onClick={handleReset}
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                >
                  Install More Packages
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleWizardCompletion} variant="contained" color="primary">
                  View Installed Packages
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setViewMode('packages')} 
                  disabled={loading}
                  variant="outlined"
                >
                  {loading ? 'Please wait...' : 'Back to Package List'}
                </Button>

                <Box sx={{ flex: '1 1 auto' }} />

                {step > 0 && step < steps.length && (
                  <Button onClick={handleBack} disabled={loading} sx={{ mr: 1 }}>
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
                        ? 'Install'
                        : 'Next'}
                  </Button>
                )}
              </>
            )
          ) : (
            <>
              <Button
                onClick={handleStartWizard}
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
              >
                Install Packages
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleClose} variant="outlined">
                Close
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RequirementsManager