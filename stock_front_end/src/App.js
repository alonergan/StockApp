import logo from './logo.svg';
import {useState} from "react"
import './App.css';

function App() {
  const [text, setText] = useState("");
  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock App</h1>   
 <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here..."
      />

      <p>Ticker: {text}</p>

         
      </header>
    </div>
  );
}
export default App;
