import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import './App.css';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfRrclbpAoldfmaQ_sMcZGlhuYQyC-BlM",
  authDomain: "instantly-dashboard.firebaseapp.com",
  projectId: "instantly-dashboard",
  storageBucket: "instantly-dashboard.firebasestorage.app",
  messagingSenderId: "59598409473",
  appId: "1:59598409473:web:141fd317b60d7e59851500",
  measurementId: "G-562NWL4EZ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign1, setSelectedCampaign1] = useState(null);
  const [selectedCampaign2, setSelectedCampaign2] = useState(null);
  const [startDate1, setStartDate1] = useState('');
  const [endDate1, setEndDate1] = useState('');
  const [startDate2, setStartDate2] = useState('');
  const [endDate2, setEndDate2] = useState('');
  const [analytics1, setAnalytics1] = useState(null);
  const [analytics2, setAnalytics2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetailedSummary, setShowDetailedSummary] = useState(false);
  const [humanReadableSummary, setHumanReadableSummary] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Track if user is registering

  const checkUserPermission = async (uid) => {
    try {
      const userDocRef = doc(db, 'allowedUsers', uid);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists(); // Returns true if the user is allowed
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  };

  // Check for a valid token in localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const checkPermission = async () => {
        const user = auth.currentUser;
        if (user) {
          const isAllowed = await checkUserPermission(user.uid);
          if (isAllowed) {
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('token'); // Remove the token if the user is not allowed
            setError('You do not have permission to access this application.');
          }
        }
      };
      checkPermission();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCampaigns();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (analytics1 && analytics2) {
      const summary = generateHumanReadableSummary(analytics1, analytics2);
      setHumanReadableSummary(summary);
      setShowDetailedSummary(true);
    }
  }, [analytics1, analytics2]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Raw Campaigns Data from Backend:', response.data);
      if (Array.isArray(response.data)) {
        setCampaigns(response.data);
      } else {
        console.error('Invalid campaign data format received:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
    }
  };

  const fetchAnalytics = async (campaignId, startDate, endDate, setAnalytics) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/campaigns/analytics', {
        params: {
          id: campaignId,
          start_date: startDate,
          end_date: endDate,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Fetched Analytics Data:', response.data);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const generateHumanReadableSummary = (campaign1, campaign2) => {
    if (!campaign1 || !campaign2 || !campaign1[0] || !campaign2[0]) return '';

    const campaign1Data = campaign1[0];
    const campaign2Data = campaign2[0];

    let summary = `The comparison between ${campaign1Data['Campaign Name']} and ${campaign2Data['Campaign Name']} reveals the following insights:\n\n`;

    // Compare Leads Count
    if (campaign1Data['Leads Count'] > campaign2Data['Leads Count']) {
      summary += `- ${campaign1Data['Campaign Name']} has more leads (${campaign1Data['Leads Count']}) compared to ${campaign2Data['Campaign Name']} (${campaign2Data['Leads Count']}).\n`;
    } else if (campaign1Data['Leads Count'] < campaign2Data['Leads Count']) {
      summary += `- ${campaign2Data['Campaign Name']} has more leads (${campaign2Data['Leads Count']}) compared to ${campaign1Data['Campaign Name']} (${campaign1Data['Leads Count']}).\n`;
    } else {
      summary += `- Both campaigns have the same number of leads (${campaign1Data['Leads Count']}).\n`;
    }

    // Compare Contacted Count
    if (campaign1Data['Contacted Count'] > campaign2Data['Contacted Count']) {
      summary += `- ${campaign1Data['Campaign Name']} contacted more leads (${campaign1Data['Contacted Count']}) compared to ${campaign2Data['Campaign Name']} (${campaign2Data['Contacted Count']}).\n`;
    } else if (campaign1Data['Contacted Count'] < campaign2Data['Contacted Count']) {
      summary += `- ${campaign2Data['Campaign Name']} contacted more leads (${campaign2Data['Contacted Count']}) compared to ${campaign1Data['Campaign Name']} (${campaign1Data['Contacted Count']}).\n`;
    } else {
      summary += `- Both campaigns contacted the same number of leads (${campaign1Data['Contacted Count']}).\n`;
    }

    // Compare Emails Sent Count
    if (campaign1Data['Emails Sent Count'] > campaign2Data['Emails Sent Count']) {
      summary += `- ${campaign1Data['Campaign Name']} sent more emails (${campaign1Data['Emails Sent Count']}) compared to ${campaign2Data['Campaign Name']} (${campaign2Data['Emails Sent Count']}).\n`;
    } else if (campaign1Data['Emails Sent Count'] < campaign2Data['Emails Sent Count']) {
      summary += `- ${campaign2Data['Campaign Name']} sent more emails (${campaign2Data['Emails Sent Count']}) compared to ${campaign1Data['Campaign Name']} (${campaign1Data['Emails Sent Count']}).\n`;
    } else {
      summary += `- Both campaigns sent the same number of emails (${campaign1Data['Emails Sent Count']}).\n`;
    }

    // Compare New Leads Contacted Count
    if (campaign1Data['New Leads Contacted Count'] > campaign2Data['New Leads Contacted Count']) {
      summary += `- ${campaign1Data['Campaign Name']} contacted more new leads (${campaign1Data['New Leads Contacted Count']}) compared to ${campaign2Data['Campaign Name']} (${campaign2Data['New Leads Contacted Count']}).\n`;
    } else if (campaign1Data['New Leads Contacted Count'] < campaign2Data['New Leads Contacted Count']) {
      summary += `- ${campaign2Data['Campaign Name']} contacted more new leads (${campaign2Data['New Leads Contacted Count']}) compared to ${campaign1Data['Campaign Name']} (${campaign1Data['New Leads Contacted Count']}).\n`;
    } else {
      summary += `- Both campaigns contacted the same number of new leads (${campaign1Data['New Leads Contacted Count']}).\n`;
    }

    // Compare Open Rate
    const openRate1 = parseFloat(campaign1Data['Open Rate (%)']);
    const openRate2 = parseFloat(campaign2Data['Open Rate (%)']);

    if (!isNaN(openRate1) && !isNaN(openRate2)) {
      if (openRate1 > openRate2) {
        summary += `- ${campaign1Data['Campaign Name']} had a higher open rate (${openRate1.toFixed(2)}%) compared to ${campaign2Data['Campaign Name']} (${openRate2.toFixed(2)}%).\n`;
      } else if (openRate1 < openRate2) {
        summary += `- ${campaign2Data['Campaign Name']} had a higher open rate (${openRate2.toFixed(2)}%) compared to ${campaign1Data['Campaign Name']} (${openRate1.toFixed(2)}%).\n`;
      } else {
        summary += `- Both campaigns had the same open rate (${openRate1.toFixed(2)}%).\n`;
      }
    } else {
      summary += `- Open rate data is missing or invalid for one or both campaigns.\n`;
    }

    // Compare Reply Count
    if (campaign1Data['Reply Count'] > campaign2Data['Reply Count']) {
      summary += `- ${campaign1Data['Campaign Name']} received more replies (${campaign1Data['Reply Count']}) compared to ${campaign2Data['Campaign Name']} (${campaign2Data['Reply Count']}).\n`;
    } else if (campaign1Data['Reply Count'] < campaign2Data['Reply Count']) {
      summary += `- ${campaign2Data['Campaign Name']} received more replies (${campaign2Data['Reply Count']}) compared to ${campaign1Data['Campaign Name']} (${campaign1Data['Reply Count']}).\n`;
    } else {
      summary += `- Both campaigns received the same number of replies (${campaign1Data['Reply Count']}).\n`;
    }

    return summary;
  };

  const handleCompare = async () => {
    setLoading(true);
    try {
      if (selectedCampaign1 && startDate1 && endDate1) {
        await fetchAnalytics(selectedCampaign1, startDate1, endDate1, setAnalytics1);
      }
      if (selectedCampaign2 && startDate2 && endDate2) {
        await fetchAnalytics(selectedCampaign2, startDate2, endDate2, setAnalytics2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const uid = userCredential.user.uid;
  
      // Check if the user is allowed
      const isAllowed = await checkUserPermission(uid);
      if (!isAllowed) {
        setError('You do not have permission to access this application.');
        await auth.signOut(); // Log out the user if they are not allowed
        return;
      }
  
      localStorage.setItem('token', token); // Store the token in localStorage
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from localStorage
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        </form>
        <p>
          {isRegistering ? 'Already have an account? ' : 'Don’t have an account? '}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}
          >
            {isRegistering ? 'Login here' : 'Register here'}
          </button>
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="auth-container">
        <h2>Access Denied</h2>
        <p className="error">{error}</p>
        <button onClick={() => setIsLoggedIn(false)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className={`App ${!isLoggedIn ? 'auth-page' : ''}`}>
      <header className="header">
        <h1>Campaign Analytics Comparison</h1>
        <p>Compare the performance of your campaigns side by side.</p>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>
      <div className="container">
        <div className="campaign-section">
          <h2>Campaign 1</h2>
          <div className="form-group">
            <label>Select Campaign</label>
            <select onChange={(e) => setSelectedCampaign1(e.target.value)}>
              <option value="">Select Campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" onChange={(e) => setStartDate1(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" onChange={(e) => setEndDate1(e.target.value)} />
          </div>
          {analytics1 && (
            <div className="analytics-results">
              <h3>Analytics</h3>
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics1[0]).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="campaign-section">
          <h2>Campaign 2</h2>
          <div className="form-group">
            <label>Select Campaign</label>
            <select onChange={(e) => setSelectedCampaign2(e.target.value)}>
              <option value="">Select Campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" onChange={(e) => setStartDate2(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" onChange={(e) => setEndDate2(e.target.value)} />
          </div>
          {analytics2 && (
            <div className="analytics-results">
              <h3>Analytics</h3>
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics2[0]).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <button className="compare-button" onClick={handleCompare} disabled={loading}>
        {loading ? 'Comparing...' : 'Compare Campaigns'}
      </button>
      {analytics1 && analytics2 && (
        <div className="summary">
          <h2>Summary Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Campaign 1</th>
                <th>Campaign 2</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics1[0]).map(([key]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{analytics1[0][key]}</td>
                  <td>{analytics2[0][key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showDetailedSummary && (
        <div className="detailed-summary">
          <h2>Comparison Summary</h2>
          <ul>
            {humanReadableSummary
              .split('\n')
              .filter((line) => line.trim() !== '')
              .map((line, index) => (
                <li key={index}>{line}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
