import { useEffect, useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App() {
  const [notes, setNotes] = useState([])
  useEffect(() => {
    const apiUrl = `${import.meta.env.VITE_API_URL}/notes`
    console.log('Fetching from:', apiUrl)

    fetch(apiUrl)
      .then((res) => {
        console.log('Response Status:', res.status)
        return res.text() // Read response as text to debug it
      })
      .then((data) => {
        console.log('Fetched Response:', data) // Log full response
        try {
          const jsonData = JSON.parse(data) // Attempt JSON parsing
          setNotes(jsonData)
        } catch (error) {
          console.error('JSON Parsing Error:', error)
        }
      })
      .catch((err) => console.error('Fetch Error:', err))
  }, [])

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>

      <h2>Notes</h2>
      {notes.length === 0 ? (
        <p>No notes found.</p>
      ) : (
        <ul>
          {notes.map((note, index) => (
            <li key={index}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default App
