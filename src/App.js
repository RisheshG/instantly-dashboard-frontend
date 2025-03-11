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
  storageBucket: "instantly-dashboard.appspot.com",
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const checkUserPermission = async (uid) => {
    try {
      const userDocRef = doc(db, 'allowedUsers', uid);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  };

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
            localStorage.removeItem('token');
            setError('You do not have permission to access this application.');
          }
        } else {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const newToken = await userCredential.user.getIdToken();
            localStorage.setItem('token', newToken);
            setIsLoggedIn(true);
          } catch (err) {
            localStorage.removeItem('token');
            setError('Session expired. Please log in again.');
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
      const response = await axios.get('https://instantlydashboardbackend.onrender.com/api/campaigns', {
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
      const response = await axios.get('https://instantlydashboardbackend.onrender.com/api/campaigns/analytics', {
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
    if (!campaign1 || !campaign2) return '';

    let summary = `The comparison between ${campaign1['Campaign Name']} and ${campaign2['Campaign Name']} reveals the following insights:\n\n`;

    // Compare New Prospects Contacted
    if (campaign1['New Prospects Contacted'] > campaign2['New Prospects Contacted']) {
      summary += `- ${campaign1['Campaign Name']} contacted more new prospects (${campaign1['New Prospects Contacted']}) compared to ${campaign2['Campaign Name']} (${campaign2['New Prospects Contacted']}).\n`;
    } else if (campaign1['New Prospects Contacted'] < campaign2['New Prospects Contacted']) {
      summary += `- ${campaign2['Campaign Name']} contacted more new prospects (${campaign2['New Prospects Contacted']}) compared to ${campaign1['Campaign Name']} (${campaign1['New Prospects Contacted']}).\n`;
    } else {
      summary += `- Both campaigns contacted the same number of new prospects (${campaign1['New Prospects Contacted']}).\n`;
    }

    // Compare Total Emails Sent
    if (campaign1['Total Emails Sent'] > campaign2['Total Emails Sent']) {
      summary += `- ${campaign1['Campaign Name']} sent more emails (${campaign1['Total Emails Sent']}) compared to ${campaign2['Campaign Name']} (${campaign2['Total Emails Sent']}).\n`;
    } else if (campaign1['Total Emails Sent'] < campaign2['Total Emails Sent']) {
      summary += `- ${campaign2['Campaign Name']} sent more emails (${campaign2['Total Emails Sent']}) compared to ${campaign1['Campaign Name']} (${campaign1['Total Emails Sent']}).\n`;
    } else {
      summary += `- Both campaigns sent the same number of emails (${campaign1['Total Emails Sent']}).\n`;
    }

    // Compare Delivered Emails
    if (campaign1['Delivered'] > campaign2['Delivered']) {
      summary += `- ${campaign1['Campaign Name']} delivered more emails (${campaign1['Delivered']}) compared to ${campaign2['Campaign Name']} (${campaign2['Delivered']}).\n`;
    } else if (campaign1['Delivered'] < campaign2['Delivered']) {
      summary += `- ${campaign2['Campaign Name']} delivered more emails (${campaign2['Delivered']}) compared to ${campaign1['Campaign Name']} (${campaign1['Delivered']}).\n`;
    } else {
      summary += `- Both campaigns delivered the same number of emails (${campaign1['Delivered']}).\n`;
    }

    // Compare Mails Opened
    if (campaign1['Mails Opened'] > campaign2['Mails Opened']) {
      summary += `- ${campaign1['Campaign Name']} had more emails opened (${campaign1['Mails Opened']}) compared to ${campaign2['Campaign Name']} (${campaign2['Mails Opened']}).\n`;
    } else if (campaign1['Mails Opened'] < campaign2['Mails Opened']) {
      summary += `- ${campaign2['Campaign Name']} had more emails opened (${campaign2['Mails Opened']}) compared to ${campaign1['Campaign Name']} (${campaign1['Mails Opened']}).\n`;
    } else {
      summary += `- Both campaigns had the same number of emails opened (${campaign1['Mails Opened']}).\n`;
    }

    // Compare Open Rate
    if (campaign1['Open Rate (%)'] > campaign2['Open Rate (%)']) {
      summary += `- ${campaign1['Campaign Name']} had a higher open rate (${campaign1['Open Rate (%)']}%) compared to ${campaign2['Campaign Name']} (${campaign2['Open Rate (%)']}%).\n`;
    } else if (campaign1['Open Rate (%)'] < campaign2['Open Rate (%)']) {
      summary += `- ${campaign2['Campaign Name']} had a higher open rate (${campaign2['Open Rate (%)']}%) compared to ${campaign1['Campaign Name']} (${campaign1['Open Rate (%)']}%).\n`;
    } else {
      summary += `- Both campaigns had the same open rate (${campaign1['Open Rate (%)']}%).\n`;
    }

    // Compare Responded
    if (campaign1['Responded'] > campaign2['Responded']) {
      summary += `- ${campaign1['Campaign Name']} received more replies (${campaign1['Responded']}) compared to ${campaign2['Campaign Name']} (${campaign2['Responded']}).\n`;
    } else if (campaign1['Responded'] < campaign2['Responded']) {
      summary += `- ${campaign2['Campaign Name']} received more replies (${campaign2['Responded']}) compared to ${campaign1['Campaign Name']} (${campaign1['Responded']}).\n`;
    } else {
      summary += `- Both campaigns received the same number of replies (${campaign1['Responded']}).\n`;
    }

    // Compare Reply Rate
    if (campaign1['Reply Rate (%)'] > campaign2['Reply Rate (%)']) {
      summary += `- ${campaign1['Campaign Name']} had a higher reply rate (${campaign1['Reply Rate (%)']}%) compared to ${campaign2['Campaign Name']} (${campaign2['Reply Rate (%)']}%).\n`;
    } else if (campaign1['Reply Rate (%)'] < campaign2['Reply Rate (%)']) {
      summary += `- ${campaign2['Campaign Name']} had a higher reply rate (${campaign2['Reply Rate (%)']}%) compared to ${campaign1['Campaign Name']} (${campaign1['Reply Rate (%)']}%).\n`;
    } else {
      summary += `- Both campaigns had the same reply rate (${campaign1['Reply Rate (%)']}%).\n`;
    }

    // Compare Bounced
    if (campaign1['Bounced'] > campaign2['Bounced']) {
      summary += `- ${campaign1['Campaign Name']} had more bounced emails (${campaign1['Bounced']}) compared to ${campaign2['Campaign Name']} (${campaign2['Bounced']}).\n`;
    } else if (campaign1['Bounced'] < campaign2['Bounced']) {
      summary += `- ${campaign2['Campaign Name']} had more bounced emails (${campaign2['Bounced']}) compared to ${campaign1['Campaign Name']} (${campaign1['Bounced']}).\n`;
    } else {
      summary += `- Both campaigns had the same number of bounced emails (${campaign1['Bounced']}).\n`;
    }

    // Compare Bounce Rate
    if (campaign1['Bounce Rate (%)'] > campaign2['Bounce Rate (%)']) {
      summary += `- ${campaign1['Campaign Name']} had a higher bounce rate (${campaign1['Bounce Rate (%)']}%) compared to ${campaign2['Campaign Name']} (${campaign2['Bounce Rate (%)']}%).\n`;
    } else if (campaign1['Bounce Rate (%)'] < campaign2['Bounce Rate (%)']) {
      summary += `- ${campaign2['Campaign Name']} had a higher bounce rate (${campaign2['Bounce Rate (%)']}%) compared to ${campaign1['Campaign Name']} (${campaign1['Bounce Rate (%)']}%).\n`;
    } else {
      summary += `- Both campaigns had the same bounce rate (${campaign1['Bounce Rate (%)']}%).\n`;
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

      const isAllowed = await checkUserPermission(uid);
      if (!isAllowed) {
        setError('You do not have permission to access this application.');
        await auth.signOut();
        return;
      }

      localStorage.setItem('token', token);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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
                  {Object.entries(analytics1).map(([key, value]) => (
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
                  {Object.entries(analytics2).map(([key, value]) => (
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
              {Object.entries(analytics1).map(([key]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{analytics1[key]}</td>
                  <td>{analytics2[key]}</td>
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
