import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [routes, setRoutes] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch all routes from backend on page load
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get("http://localhost:7000/api/routes");
        setRoutes(res.data);
      } catch (err) {
        console.error("Error fetching routes:", err);
      }
    };
    fetchRoutes();
  }, []);

  // ✅ Handle Search
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!from || !to || !date) {
    alert("Please select all fields before searching!");
    return;
  }

  try {
    const response = await axios.get("http://localhost:7000/api/bus-schedule/search", {
      params: { from, to, date },
    });

    navigate("/bus-results", { state: { buses: response.data, from, to, date } });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      navigate("/bus-results", { state: { buses: [], from, to, date } });
    } else {
      alert("Error fetching buses. Please try again later.");
    }
  }
};

  // ✅ Extract unique "from" and "to" locations
  const uniqueFrom = [...new Set(routes.map((r) => r.from))];
  const uniqueTo = [...new Set(routes.map((r) => r.to))];

  // ✅ Prevent selecting past dates
  const today = new Date().toISOString().split("T")[0];

  // ✅ Disable button if fields empty
  const isDisabled = !from || !to || !date;

  return (
    <div className="home-page">
      {/* 🔹 Top Menu */}
      <nav className="top-menu">
        <ul>
          <li>Cancellation</li>
          <li>Feedback</li>
          <li>Gallery</li>
          <li>Status Check</li>
        </ul>
      </nav>

      {/* 🔹 Centered Booking Form */}
      <div className="main-content">
        <fieldset className="search-box">
          <legend>Book Your Journey</legend>
          <form onSubmit={handleSubmit}>
            <label>Travelling From</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">Select city</option>
              {uniqueFrom.map((city, idx) => (
                <option key={idx} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <label>Going To</label>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Select city</option>
              {uniqueTo.map((city, idx) => (
                <option key={idx} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <label>Journey Date</label>
            <input
              type="date"
              value={date}
              min={today} // ✅ Block past dates
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <button type="submit" disabled={isDisabled}>
              Search Buses
            </button>
          </form>
        </fieldset>
      </div>
    </div>
  );
}

export default Home;