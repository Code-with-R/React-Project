import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import AddTodo from './Components/addTodo'
import SimpleTodo from './Components/simpleTodo'

function App() {
  
  

  return (
    <>
      <h1>Learn about redux toolkit</h1>
      <AddTodo />
      <SimpleTodo />
    </>
  )
}

export default App
