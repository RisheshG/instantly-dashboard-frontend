import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/campaigns');
            console.log("Raw Campaigns Data from Backend:", response.data);
            if (Array.isArray(response.data)) {
                setCampaigns(response.data);
            } else {
                console.error("Invalid campaign data format received:", response.data);
            }
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
        }
    };

    const fetchAnalytics = async (campaignId, startDate, endDate, setAnalytics) => {
        try {
            const response = await axios.get('http://localhost:5001/api/campaigns/analytics', {
                params: {
                    id: campaignId,
                    start_date: startDate,
                    end_date: endDate
                }
            });
            console.log("Fetched Analytics Data:", response.data);
            setAnalytics(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
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

    const formatAnalyticsData = (data) => {
        if (!data) return null;
        return data.map(campaign => ({
            "Campaign Name": campaign["Campaign Name"],
            "Campaign ID": campaign["Campaign ID"],
            "Leads Count": campaign["Leads Count"],
            "Contacted Count": campaign["Contacted Count"],
            "Open Count": campaign["Open Count"],
            "Reply Count": campaign["Reply Count"],
            "Bounced Count": campaign["Bounced Count"],
            "Unsubscribed Count": campaign["Unsubscribed Count"],
            "Completed Count": campaign["Completed Count"],
            "Emails Sent Count": campaign["Emails Sent Count"],
            "New Leads Contacted Count": campaign["New Leads Contacted Count"],
            "Open Rate (%)": campaign["Open Rate (%)"] // Include Open Rate
        }));
    };

    return (
        <div className="App">
            <header className="header">
                <h1>Campaign Analytics Comparison</h1>
                <p>Compare the performance of your campaigns side by side.</p>
            </header>
            <div className="container">
                <div className="campaign-section">
                    <h2>Campaign 1</h2>
                    <div className="form-group">
                        <label>Select Campaign</label>
                        <select onChange={(e) => setSelectedCampaign1(e.target.value)}>
                            <option value="">Select Campaign</option>
                            {campaigns.map(campaign => (
                                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
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
                                    {Object.entries(formatAnalyticsData(analytics1)[0]).map(([key, value]) => (
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
                            {campaigns.map(campaign => (
                                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
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
                                    {Object.entries(formatAnalyticsData(analytics2)[0]).map(([key, value]) => (
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
                            {Object.entries(formatAnalyticsData(analytics1)[0]).map(([key]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td>{formatAnalyticsData(analytics1)[0][key]}</td>
                                    <td>{formatAnalyticsData(analytics2)[0][key]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default App;