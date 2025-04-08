/*
This code block is necessary as it is the layout of our app consisting of various react components
It consists of our context, navbar, sidebar and content which are our main components.
*/
import React, { useState } from 'react'
import { Box, Divider } from '@mui/material'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ContentArea from './ContentArea'
import { NotebookProvider } from './NotebookContext'
import { NotebookDataProvider } from './NotebookDataContext'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <NotebookDataProvider>
      <NotebookProvider>
        <Box
          sx={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: sidebarOpen ? `minmax(auto, max-content) 1px 1fr` : `1fr`,
              height: '100%',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {sidebarOpen && <Sidebar />}
            {sidebarOpen && <Divider orientation="vertical" flexItem />}
            <ContentArea />
          </Box>
        </Box>
      </NotebookProvider>
    </NotebookDataProvider>
  )
}

export default AppLayout
