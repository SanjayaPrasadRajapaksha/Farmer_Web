import React from "react"
import { BrowserRouter as Router } from 'react-router-dom'
import Layout from '../src/components/Layout/Layout'
import TPRoutes from '../src/routes/TPRoutes'

function App() {
  return (
    <Router>
      <Layout>
        <TPRoutes />
      </Layout>
    </Router>
  )
}

export default App