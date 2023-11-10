import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TitleBar } from './Components/TitleBar';
import { Homepage } from './Components/Homepage';
import API from './API';
import { useState, useEffect } from 'react';

function App() {

  const [user, setUser] = useState(0);
  const [proposals, setProposals] = useState([{id:0, title: 'AI system research', supervisor: 'Mario Rossi', expDate: '10/1/2024', keywords: 'AI', type:'Sperimental', groups:'A32', description: 'AI thesis about...', know:'Machine learning', level:'Master', cds: 'LM_31', creatDate:'10/1/2023', status: '1'}]);

  useEffect(() => {

    setProposals([{id:0, title: 'AI system research', supervisor: 'Mario Rossi', expDate: '10/1/2024', keywords: 'AI', type:'Sperimental', groups:'A32', description: 'AI thesis about...', know:'Machine learning', level:'Master', cds: 'LM_31', creatDate:'10/1/2023', status: '1'}, {id:1, title: 'AI system research', supervisor: 'Mario Rossi', expDate: '10/1/2024', keywords: 'AI', type:'Sperimental', groups:'A32', description: 'AI thesis about...', know:'Machine learning', level:'Master', cds: 'LM_31', creatDate:'10/1/2023', status: '1'}])
   proposals.map(e=>console.log(e));
  }, [user]);

    return (
        <>
        <BrowserRouter>
          <Routes>
          <Route path='/' element={<><Homepage user={user} setUser={setUser} proposals={proposals}/></>} />
          </Routes>
        </BrowserRouter>
      </>
    );
}

export default App;