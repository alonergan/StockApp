import logo from './logo.svg';
import {useState} from "react"
import './App.css';

function App() {
  const [text, setText] = useState("");
  const sendToDjango = async () => {
    const response = await fetch("http://localhost:8000/api/save/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({text}),
    });

    const data = await response.json();
    console.log(data);
  }
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock App</h1>   
      <input
        type="text"
        style={{padding: "8px", fontSize: "12px", height: "40px", width: "80px"}}
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
