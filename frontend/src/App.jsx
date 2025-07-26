import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BankApp from "./components/BankApp";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <BankApp />
        

    </>
  )
}

export default App
