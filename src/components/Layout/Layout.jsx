import React from 'react'
import NavBar from '../NavBar/NavBar'
import Footer from '../Footer/Footer'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout