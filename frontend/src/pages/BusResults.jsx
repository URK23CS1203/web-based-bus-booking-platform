import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "./BusResults.css";

function BusResults() {
  const location = useLocation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [sortBy, setSortBy] = useState("time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedBusId, setExpandedBusId] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [visibleStopsBusId, setVisibleStopsBusId] = useState(null);
  const [filterOption, setFilterOption] = useState("");
  const [filterType, setFilterType] = useState("");

const toggleStops = (busId) => {
  if (visibleStopsBusId === busId) setVisibleStopsBusId(null);
  else setVisibleStopsBusId(busId);
};

  const toggleSeats = (busId) => {
  if (expandedBusId === busId) {
    setExpandedBusId(null);
    setSelectedSeats([]);
  } else {
    setExpandedBusId(busId);
    setSelectedSeats([]); // reset seats when switching
  }
};

const generateSeatsLayout = () => {
  const layout = [];
  let seatNumber = 1;

  for (let row = 1; row <= 5; row++) {
    const rowSeats = [];

    // Rows 1, 2, 4, 5 → 12 seats
    if (row !== 3) {
      for (let col = 1; col <= 12; col++) {
        rowSeats.push({
          id: seatNumber,
          status: seatNumber % 7 === 0 ? "sold" : "available", // random sold pattern
        });
        seatNumber++;
      }
    } 
    // Row 3 → only one seat at the last column
    else {
      for (let col = 1; col <= 12; col++) {
        if (col === 12) {
          rowSeats.push({
            id: seatNumber,
            status: seatNumber % 7 === 0 ? "sold" : "available",
          });
          seatNumber++;
        } else {
          rowSeats.push(null); // empty space
        }
      }
    }

    layout.push(rowSeats);
  }

  return layout;
};

const handleSeatClick = (seat) => {
  if (seat.status === "sold") return; // can't select sold
  if (selectedSeats.includes(seat.id)) {
    setSelectedSeats(selectedSeats.filter((s) => s !== seat.id));
  } else {
    setSelectedSeats([...selectedSeats, seat.id]);
  }
};

const handleBook = (bus) => {
  alert(
    `Booking confirmed for Bus: ${bus.busName || "Unknown"}\nSeats: ${selectedSeats.join(", ")}`
  );
  // You can later redirect to a payment or summary page here
};

  // ✅ Fetch routes list (for dropdown options)
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

  // ✅ Load buses and search info from Home.jsx
useEffect(() => {
  if (location.state) {
    const { buses = [], from = "", to = "", date = "" } = location.state;
    setBuses(buses);
    setFrom(from);
    setTo(to);
    setDate(date);
  }
}, [location.state]);

  // ✅ Extract unique From / To lists
  const uniqueFrom = [...new Set(routes.map((r) => r.from))];
  const uniqueTo = [...new Set(routes.map((r) => r.to))];

  // ✅ Modify Search Handler
  const handleModify = async (e) => {
    e.preventDefault();
    if (!from || !to || !date) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get("http://localhost:7000/api/bus-schedule/search", {
        params: { from, to, date },
      });
      setBuses(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setBuses([]);
        setError("No buses found. Modify your search.");
      } else {
        setError("Error fetching buses. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];


  const filteredBuses = buses.filter((bus) => {
  if (!filterType) return true;

  const type = bus.busType?.toLowerCase().replace(/\s+/g, "");

  if (filterType === "ac") return type === "ac";
  if (filterType === "non-ac") return type === "non-ac";
  if (filterType === "sleeper") return type.includes("sleeper");
  if (filterType === "seater") return type.includes("seater");

  return true;
});
  // ✅ Sorting logic
  const sortedBuses = [...filteredBuses].sort((a, b) => {
    if (sortBy === "price") return a.busPrice - b.busPrice;
    if (sortBy === "duration") return (a.timeDuration || "").localeCompare(b.timeDuration || "");
    return (a.departureTime || "").localeCompare(b.departureTime || "");
  });

  return (
    <div className="bus-results-page">
      {/* 🔹 Modify Search Bar */}
      <div className="search-bar">
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">From</option>
          {uniqueFrom.map((city, idx) => (
            <option key={idx} value={city}>{city}</option>
          ))}
        </select>

        <select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">To</option>
          {uniqueTo.map((city, idx) => (
            <option key={idx} value={city}>{city}</option>
          ))}
        </select>

        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button
          onClick={handleModify}
          disabled={!from || !to || !date || loading}
          className="modify-btn"
        >
          {loading ? "Loading..." : "Modify"}
        </button>
      </div>

      {/* 🔹 Filters & Sorting */}
      <div className="filter-sort-row">
        <div className="filters">
  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
    <option value="">All</option>
    <option value="ac">AC</option>
    <option value="non-ac">Non-AC</option>
    <option value="sleeper">Sleeper</option>
    <option value="seater">Seater</option>
  </select>
</div>
        <div className="sort-by">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="time">Earliest Departure</option>
            <option value="duration">Shortest Duration</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>
      </div>

      {/* 🔹 Bus Cards */}
      <div className="bus-list">
        {error && <p className="error-msg">{error}</p>}
        {!error && buses.length === 0 && !loading && (
          <p className="no-bus-msg">No buses found. Modify your search.</p>
        )}

        {sortedBuses
  .filter((bus) => {
    if (filterOption === "ac") return bus.busType?.toLowerCase().includes("ac");
    if (filterOption === "non-ac") return !bus.busType?.toLowerCase().includes("non-ac");
    if (filterOption === "sleeper") return bus.busType?.toLowerCase().includes("sleeper");
    if (filterOption === "seater") return bus.busType?.toLowerCase().includes("seater");
    return true;
  })
  .map((bus) => (
          <div key={bus._id} className="bus-card">
  {/* --- Left (Departure) --- */}
  <div className="bus-left">
    <p>Departure Details</p>
    <h4>{bus.departureTime || "—"}, {bus.busDate || ""}</h4>
    <p>{bus.busStartLocation || ""}</p>
    <button
  className="stops-btn"
  onClick={() => toggleStops(bus._id)}
>
  {visibleStopsBusId === bus._id ? "Hide Stops" : "View Stops"}
</button>

{/* Show stops list when button is active */}
{visibleStopsBusId === bus._id && (
  <div className="stops-popup">
    <p className="stops-title">
      <strong>{bus.busStartLocation}</strong> → <strong>{bus.busEndLocation}</strong>
    </p>
    <p className="stops-list">
      {bus.stops && bus.stops.length > 0
        ? bus.stops.join(" • ")
        : "No stops available."}
    </p>
  </div>
)}
  </div>

  {/* --- Center (Duration) --- */}
  <div className="bus-center">
    <p>Travel Distance</p>
    <p className="duration">{bus.timeDuration || "—"}</p>
  </div>

  {/* --- Right Center (Arrival) --- */}
  <div className="bus-right-center">
    <h3>Arrival Details</h3>
    <p>{bus.busEndLocation || ""}</p>
    <p>{bus.busType || ""}</p>
  </div>

  {/* --- Right (Price + Action) --- */}
  <div className="bus-right">
    <img
      src={
        bus.imageUrl ||
        "https://media.assettype.com/tnm%2Fimport%2Fsites%2Fdefault%2Ffiles%2FKSRTC_Facebook_3062021_1200_0.jpg?w=1200"
      }
      alt="Bus"
    />
    <p className="price">₹{bus.busPrice || "—"}</p>

    {/* ✅ Calculate seat availability dynamically */}
    {(() => {
      const layout = generateSeatsLayout();
      const allSeats = layout.flat().filter((s) => s !== null);
      const soldSeats = allSeats.filter((s) => s.status === "sold").length;
      const availableSeats = allSeats.length - soldSeats;

      return <p className="seats">{availableSeats} seats left</p>;
    })()}

    <button
      className="choose-btn"
      onClick={() => toggleSeats(bus._id)}
    >
      {expandedBusId === bus._id ? "Hide Seats" : "Choose Seats"}
    </button>

{/* ✅ Show Seat Layout only when expanded */}
{expandedBusId === bus._id && (
  <div className="seat-layout">
    <div className="custom-seat-grid">
      {generateSeatsLayout().map((row, rowIndex) => (
        <div key={rowIndex} className="seat-row">
          {row.map((seat, colIndex) =>
            seat ? (
              <div
                key={seat.id}
                className={`seat ${seat.status} ${
                  selectedSeats.includes(seat.id) ? "selected" : ""
                }`}
                onClick={() => handleSeatClick(seat)}
              >
                {seat.id}
              </div>
            ) : (
              <div key={colIndex} className="seat empty"></div>
            )
          )}
        </div>
      ))}
    </div>

    {/* ✅ Book Button only after seat selection */}
    {selectedSeats.length > 0 && (
      <div className="book-btn-container">
        <button className="book-btn" onClick={() => handleBook(bus)}>
          Book Now ({selectedSeats.length} Seat
          {selectedSeats.length > 1 ? "s" : ""})
        </button>
      </div>
    )}
  </div>
)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BusResults;