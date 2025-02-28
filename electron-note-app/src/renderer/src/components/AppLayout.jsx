import React, { useState } from 'react'
import { Box, Divider } from '@mui/material'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ContentArea from './ContentArea'
import { NotebookProvider } from './NotebookContext'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <NotebookProvider>
      <Box sx={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh', width: '100vw' }}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: sidebarOpen ? `auto 1px 1fr` : `1fr`,
            height: '100%'
          }}
        >
          {sidebarOpen && <Sidebar />}
          {sidebarOpen && <Divider orientation="vertical" flexItem />}
          <ContentArea />
        </Box>
      </Box>
    </NotebookProvider>
  )
}

export default AppLayout
