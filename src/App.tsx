import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import InputForm from './components/InputForm'
import ResultDisplay from './components/ResultDisplay'
import AIChat from './components/AIChat'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>✨ Starflect</h1>
          <p>あなたの星座から運命を読み解く</p>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<InputForm />} />
            <Route path="/result" element={<ResultDisplay />} />
            <Route path="/chat" element={<AIChatWrapper />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function AIChatWrapper() {
  // birthData, planetsをlocalStorageから取得
  const birthDataRaw = localStorage.getItem('birthData');
  let birthData = null;
  if (birthDataRaw) {
    birthData = JSON.parse(birthDataRaw);
    if (birthData.birthDate) birthData.birthDate = new Date(birthData.birthDate);
  }
  const planetsRaw = localStorage.getItem('horoscopeData');
  let planets = [];
  if (planetsRaw) {
    try {
      const parsed = JSON.parse(planetsRaw);
      planets = parsed.planets || [];
    } catch {}
  }
  if (!birthData || !planets.length) {
    return <div style={{padding: 32}}>必要なデータがありません。最初からやり直してください。</div>;
  }
  return <AIChat birthData={birthData} planets={planets} />;
}

export default App 