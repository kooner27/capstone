import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  padding: theme.spacing(6),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary
}))

const Content = styled(Box)(({ theme }) => ({
  maxWidth: '800px',
  width: '95%',
  textAlign: 'center',
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3]
}))

const ButtonContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  marginTop: '24px'
})

const Dashboard = () => {
  return (
    <Container>
      <Content>
        <Typography variant="h2" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h5" gutterBottom>
          Welcome to the dashboard!
        </Typography>
        <ButtonContainer>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontSize: '1.5rem', padding: '16px 32px' }}
          >
            Primary Button
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            sx={{ fontSize: '1.5rem', padding: '16px 32px' }}
          >
            Secondary Button
          </Button>
        </ButtonContainer>
      </Content>
    </Container>
  )
}

export default Dashboard
