import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {

  let [counter, setCounter] = useState(5)

  //  let counter = 5

  const addValue = () => {
    if (counter >= 20) {
      alert("Counter value cannot be greater than 20");
      return;
    }
    // console.log("Clicked", counter);
    // counter = counter + 1
    setCounter(counter + 1)
  }

  const removeValue = () => {
    if (counter <= 0) {
      alert("Counter value cannot be negative");
      return;
      
    }
    setCounter(counter - 1)
  }

  return (
    <>
      <h1>React Development</h1>
      <h2>Counter Value: {counter}</h2>

      <button
        onClick={addValue}
      >Add Value {counter}</button>
      <br />
      <button
        onClick={removeValue}
      >Remove Value {counter}</button>
      <p>footer:{counter}</p>
    </>
  )
}

export default App;
