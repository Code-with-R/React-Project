import { useState } from 'react'
import { InputBox } from './Components'
import useCurrencyInfo from './Hooks/useCurrencyinfo'

import './App.css'

function App() {

  const [amount, setAmount] = useState(1)
  const [from, setFrom] = useState("usd")
  const [to, setTo] = useState("inr")
  const [convertedAmount, setConvertedAmount] = useState(0)

  const currencyInfo = useCurrencyInfo(from)
  const currencyOption = Object.keys(currencyInfo)

  const swapCurrency = () => {
    setFrom(to)
    setTo(from)
    setConvertedAmount(amount)
    setAmount(convertedAmount)
  }

  const convertAmount = () => {
    setConvertedAmount(amount * currencyInfo[to])
  }

  return (
    <>
      <div className="w-full h-screen flex flex-wrap justify-center items-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url('https://img.magnific.com/free-vector/collection-digital-currency-sign-background-with-text-space_1017-60247.jpg?semt=ais_hybrid&w=740&q=80')` }}
      >
        <div className="w-full">
          <div className="w-full max-w-md mx-auto border border-gray-60 rounded-lg p-5 backdrop-blur-sm bg-white/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                convertAmount();
              }}
            >
              <div className="w-full mb-1">
                <InputBox
                  lable="From"
                  amount={amount}
                  currencyOption={currencyOption}
                  onCurrencyChange={(currency) => setAmount(amount)}
                  onAmountChange={(amount) => setAmount(amount)}
                  selectCurrency={from}
                />
              </div>
              <div
                className="relative w-full h-0.5"
              >
                <button className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-md bg-blue-500 text-white px-2 py-0.5"
                  onClick={swapCurrency}
                >
                  Swap
                </button>
              </div>
              <div className="w-full mt-1 mb-4">
                <InputBox
                  lable="To"
                  amount={convertedAmount}
                  currencyOption={currencyOption}
                  onCurrencyChange={(currency) => setTo(currency)}
                  selectCurrency={to}
                  amountDisable
                />

              </div>
              <button 
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg">
                Convert {from.toLocaleUpperCase() } to {to.toLocaleUpperCase()}</button>

            </form>

          </div>
        </div>

      </div>
    </>
  )
}

export default App
