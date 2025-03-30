/*
This code block is necessary for implementing the requirements in 4.2: User Login of our SRS,
namely: FR4, FR5.

We built upon an MUI template for this component obtained from:
https://mui.com/material-ui/getting-started/templates/?srsltid=AfmBOopQEbZNGsTIkOVctnk6rDNEYfeRhrAhQrR4P57Wm1T655QJ7HnL
*/
import * as React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CssBaseline from '@mui/material/CssBaseline'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import FormLabel from '@mui/material/FormLabel'
import FormControl from '@mui/material/FormControl'

import { Link as RouterLink } from 'react-router-dom'
import Link from '@mui/material/Link'
import { useNavigate } from 'react-router-dom'

import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import MuiCard from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import ForgotPassword from './components/ForgotPassword'
import AppTheme from '../shared-theme/AppTheme'
import ColorModeSelect from '../shared-theme/ColorModeSelect'
import { GoogleIcon, FacebookIcon, SitemarkIcon } from './components/CustomIcons'

import { loginUser } from '../../api/auth'

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    width: '500px'
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px'
  })
}))

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4)
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
    })
  }
}))

export default function SignIn(props) {
  const navigate = useNavigate()

  const [nameError, setNameError] = React.useState(false)
  const [nameErrorMessage, setNameErrorMessage] = React.useState('')
  const [passwordError, setPasswordError] = React.useState(false)
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState('')

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateInputs()) return

    const data = new FormData(event.currentTarget)
    const user = {
      username: data.get('name'),
      password: data.get('password')
    }

    try {
      const responseData = await loginUser(user)

      localStorage.setItem('token', responseData.token)
      setSuccessMessage('Login successful! Redirecting...')
      setTimeout(() => {
        navigate('/applayout')
      }, 1000)
    } catch (error) {
      // Do not use alert and instead just use our errors given in the template
      // Alert was causing issues with selecting stuff
      console.error('Login error:', error)

      // Show error in both fields
      setNameError(true)
      setPasswordError(true)
      setNameErrorMessage('Invalid credentials')
      setPasswordErrorMessage('Invalid credentials')

      // Re focus the username
      const nameField = document.getElementById('name')
      if (nameField) {
        setTimeout(() => nameField.focus(), 100)
      }
    }
  }

  const validateInputs = () => {
    const password = document.getElementById('password')
    const name = document.getElementById('name')

    let isValid = true

    if (!name.value || name.value.length < 1) {
      setNameError(true)
      setNameErrorMessage('Please enter a valid username.')
      isValid = false
    } else {
      setNameError(false)
      setNameErrorMessage('')
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true)
      setPasswordErrorMessage('Password must be at least 6 characters long.')
      isValid = false
    } else {
      setPasswordError(false)
      setPasswordErrorMessage('')
    }

    return isValid
  }

  return (
    <AppTheme {...props} mode="dark">
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        {/* <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} /> */}
        <Card variant="outlined">
          {/* <SitemarkIcon /> This came with template, we don't need it. We can have our own logo later maybe */}
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2
            }}
          >
            <FormControl>
              <FormLabel htmlFor="name">Username</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                placeholder="Jon Snow"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            {}

            {}

            {successMessage ? (
              <Typography variant="body1" color="success.main">
                {successMessage}
              </Typography>
            ) : (
              <Button type="submit" fullWidth variant="contained" onClick={validateInputs}>
                Sign in
              </Button>
            )}
            {}
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {}
            <Typography sx={{ textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <Link
                component={RouterLink}
                to="/signup"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  )
}
