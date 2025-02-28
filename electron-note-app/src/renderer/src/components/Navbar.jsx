import { AppBar, Toolbar, Typography, Button, TextField, IconButton, Box } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

const Navbar = ({ toggleSidebar }) => (
  <AppBar position="static">
    <Toolbar>
      <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        TwoNote
      </Typography>
      <Button color="inherit">Edit</Button>
      <Button color="inherit">View</Button>
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
        <TextField
          variant="outlined"
          placeholder="Search..."
          size="small"
          sx={{ backgroundColor: 'white', borderRadius: 1 }}
        />
      </Box>
      <Button color="inherit">Logout</Button>
    </Toolbar>
  </AppBar>
)

export default Navbar
