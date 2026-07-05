import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

function MyApp(){
  return(
    <div>Custom App !</div>
  )
}

// const ReactElement = {
//     type: 'a',
//     props:{ 
//         href : 'https://google.com',
//         target: "_blank"
//     },
//     Children: 'Click ME to Visit Google'

// }

const anotherElement = (
  <a href="https://goole.com" target='_blank'>Visit goolee</a>
)


const anotherUser = "@king"

const reactElement = React.createElement(
  'a',
  {href:'https://google.com', target: "_blank"},
  'click me to visit goole',
  anotherUser
)

createRoot(document.getElementById('root')).render(
 
reactElement
)
