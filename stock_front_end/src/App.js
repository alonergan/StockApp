import logo from './logo.svg';
import {useState} from "react"
import './App.css';
import axios from 'axios';

function App() {
  const [ticker, setText] = useState("");
  const [response, setResponse] = useState("");

    const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch("http://127.0.0.1:8000/api/submit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ticker: ticker }),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setResponse("Error sending request");
    }
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock App</h1>
      <form onSubmit={handleSubmit}>   
      <input
        type="text"
        style={{padding: "8px", fontSize: "12px", height: "40px", width: "80px"}}
        value={ticker}
        placeholder="Enter Ticker"
        onChange={(e) => setText(e.target.value)}    
      />
       <button type="submit" style={{ marginLeft: "10px" }}>
          Send
        </button>
      </form>
      <div style={{ marginTop: "20px" }}>
        <strong>Response:</strong>
        <pre>{response}</pre>
      </div>
      </header>
    </div>
  );
}
export default App;
