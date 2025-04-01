import { useEffect } from 'react'
import { useColorScheme } from '@mui/material/styles'

export default function DarkModeInitializer() {
  const { setMode } = useColorScheme()

  useEffect(() => {
    // Set dark mode when component mounts
    setMode('dark')
  }, [setMode])

  return null
}
