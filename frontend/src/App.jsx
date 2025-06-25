import React, { useState, useEffect } from "react";

// Ticketmaster API configuration - temporarily hardcoded for testing
const TICKETMASTER_API_KEY = "l7ObmWHqWDhPx3irBuJSMLjtOaxxOnkq";
const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Debug logging
console.log("API Configuration:", {
  TICKETMASTER_API_KEY: TICKETMASTER_API_KEY ? "Present" : "Missing",
  TICKETMASTER_BASE_URL: TICKETMASTER_BASE_URL
});

export default function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [priceFilter, setPriceFilter] = useState("all"); // all, under50, 50-100, 100-200, over200
  const [sortBy, setSortBy] = useState("date"); // date, price, name
  const [showFilters, setShowFilters] = useState(false);

  // Add new state for user profile, favorites, and dashboard
  const [user, setUser] = useState({
    name: "Jane Doe",
    email: "jane@example.com",
    preferences: { favoriteArtists: [], favoriteVenues: [] },
    bookingHistory: []
  });
  const [favorites, setFavorites] = useState({ artists: [], venues: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);

  // Add new state for theme
  const [theme, setTheme] = useState('light');

  // Apply dark mode to <html> element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fetch events from Ticketmaster API
  const fetchEvents = async (category = "All", size = 50) => {
    setLoading(true);
    setError(null);
    
    // Check if API key is available
    if (!TICKETMASTER_API_KEY) {
      setError("API key not configured. Please check your environment variables.");
      setEvents(getMockEvents());
      setLoading(false);
      return;
    }
    
    console.log("Fetching events with API key:", TICKETMASTER_API_KEY ? "Present" : "Missing");
    
    try {
      let url = `${TICKETMASTER_BASE_URL}?apikey=${TICKETMASTER_API_KEY}&size=${size}&countryCode=US`;
      
      // Add category filter if not "All"
      if (category !== "All") {
        const categoryMap = {
          "Concert": "music",
          "Theater": "arts",
          "Sports": "sports"
        };
        if (categoryMap[category]) {
          url += `&classificationName=${categoryMap[category]}`;
        }
      }

      // Add location filter if specified
      if (locationFilter.trim()) {
        url += `&city=${encodeURIComponent(locationFilter.trim())}`;
      }

      console.log("Making API request to:", url);

      const response = await fetch(url);
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      if (data._embedded && data._embedded.events) {
        const formattedEvents = data._embedded.events.map((event, index) => ({
          id: event.id || index + 1,
          title: event.name,
          artist: event._embedded?.attractions?.[0]?.name || event.name,
          venue: event._embedded?.venues?.[0]?.name || "Venue TBD",
          city: event._embedded?.venues?.[0]?.city?.name || "City TBD",
          state: event._embedded?.venues?.[0]?.state?.stateCode || "",
          date: event.dates?.start?.localDate || "TBD",
          time: event.dates?.start?.localTime || "TBD",
          price: event.priceRanges?.[0] 
            ? `$${event.priceRanges[0].min} - $${event.priceRanges[0].max}`
            : "Price TBD",
          priceMin: event.priceRanges?.[0]?.min || 0,
          priceMax: event.priceRanges?.[0]?.max || 0,
          image: event.images?.[0]?.url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
          category: getEventCategory(event),
          availableSeats: Math.floor(Math.random() * 300) + 50, // Mock data since API doesn't provide this
          url: event.url
        }));
        setEvents(formattedEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(`Failed to load events: ${err.message}`);
      // Fallback to mock data on error
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine event category
  const getEventCategory = (event) => {
    const classifications = event.classifications?.[0];
    if (classifications?.segment?.name === "Sports") return "Sports";
    if (classifications?.segment?.name === "Arts & Theatre") return "Theater";
    if (classifications?.segment?.name === "Music") return "Concert";
    return "Concert"; // Default
  };

  // Filter and sort events
  const getFilteredAndSortedEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(search) ||
        event.artist.toLowerCase().includes(search) ||
        event.venue.toLowerCase().includes(search) ||
        event.city.toLowerCase().includes(search)
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      filtered = filtered.filter(event => {
        if (event.date === "TBD") return false;
        const eventDate = new Date(event.date);
        
        switch (dateFilter) {
          case "today":
            return event.date === todayStr;
          case "week":
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return eventDate >= today && eventDate <= weekFromNow;
          case "month":
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return eventDate >= today && eventDate <= monthFromNow;
          default:
            return true;
        }
      });
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter(event => {
        const minPrice = event.priceMin;
        
        switch (priceFilter) {
          case "under50":
            return minPrice > 0 && minPrice < 50;
          case "50-100":
            return minPrice >= 50 && minPrice <= 100;
          case "100-200":
            return minPrice >= 100 && minPrice <= 200;
          case "over200":
            return minPrice > 200;
          default:
            return true;
        }
      });
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          if (a.date === "TBD" && b.date === "TBD") return 0;
          if (a.date === "TBD") return 1;
          if (b.date === "TBD") return -1;
          return new Date(a.date) - new Date(b.date);
        case "price":
          return (a.priceMin || 0) - (b.priceMin || 0);
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Mock events as fallback
  const getMockEvents = () => [
    {
      id: 1,
      title: "Taylor Swift - The Eras Tour",
      artist: "Taylor Swift",
      venue: "MetLife Stadium",
      city: "East Rutherford",
      state: "NJ",
      date: "2024-06-15",
      time: "20:00",
      price: "$89 - $299",
      priceMin: 89,
      priceMax: 299,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      category: "Concert",
      availableSeats: 150,
      previewUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
    },
    {
      id: 2,
      title: "Hamilton - The Musical",
      artist: "Broadway Production",
      venue: "Richard Rodgers Theatre",
      city: "New York",
      state: "NY",
      date: "2024-06-20",
      time: "19:30",
      price: "$120 - $450",
      priceMin: 120,
      priceMax: 450,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      category: "Theater",
      availableSeats: 75,
      previewUrl: "https://www.w3schools.com/html/horse.mp3"
    },
    {
      id: 3,
      title: "NBA Finals Game 7",
      artist: "Lakers vs Celtics",
      venue: "Crypto.com Arena",
      city: "Los Angeles",
      state: "CA",
      date: "2024-06-25",
      time: "19:00",
      price: "$200 - $800",
      priceMin: 200,
      priceMax: 800,
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop",
      category: "Sports",
      availableSeats: 200,
      previewUrl: ""
    }
  ];

  // Load events when entering events view
  useEffect(() => {
    if (currentView === "events") {
      fetchEvents(selectedCategory);
    }
  }, [currentView, selectedCategory, locationFilter]);

  const handleGetStarted = () => {
    setCurrentView("main");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  const handleBrowseEvents = () => {
    setCurrentView("events");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
  };

  const handleBookTicket = (eventId) => {
    alert(`Booking ticket for event ${eventId}. This would integrate with your booking system.`);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleRetry = () => {
    fetchEvents(selectedCategory);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setDateFilter("all");
    setPriceFilter("all");
    setSortBy("date");
  };

  const categories = ["All", "Concert", "Theater", "Sports"];
  const filteredEvents = getFilteredAndSortedEvents();

  // Add navigation bar
  function NavigationBar() {
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView("dashboard")} className={`text-sm font-medium ${currentView === "dashboard" ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}>Dashboard</button>
            <button onClick={() => setCurrentView("events")} className={`text-sm font-medium ${currentView === "events" ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}>Events</button>
            <button onClick={() => setCurrentView("profile")} className={`text-sm font-medium ${currentView === "profile" ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}>Profile</button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 dark:text-gray-300 text-sm">{user.name}</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 text-xs"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Add favorite handler
  function handleFavorite(type, value) {
    setFavorites((prev) => {
      const updated = { ...prev };
      if (!updated[type].includes(value)) {
        updated[type] = [...updated[type], value];
      } else {
        updated[type] = updated[type].filter((v) => v !== value);
      }
      return updated;
    });
  }

  // Add recommendation logic (simple: recommend events with favorite artists/venues)
  useEffect(() => {
    if (events.length > 0) {
      const recs = events.filter(
        (event) =>
          favorites.artists.includes(event.artist) ||
          favorites.venues.includes(event.venue)
      );
      setRecommendations(recs);
      setDashboardEvents(events.slice(0, 3)); // Upcoming events (first 3 for demo)
    }
  }, [events, favorites]);

  if (currentView === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Show Time
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-200 mb-8">
            Ticket Event App
          </h2>
          <p className="text-lg text-gray-300 max-w-md mx-auto mb-8">
            Your ultimate destination for booking tickets to the best events and concerts
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              Get Started
            </button>
            <div className="text-sm text-gray-400">
              Click to explore events and start booking tickets
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "events") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Show Time</h1>
                <span className="ml-2 text-sm text-gray-500">Browse Events</span>
              </div>
              <button
                onClick={handleBackToMain}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover amazing events, concerts, and shows. Book your tickets with ease.
            </p>
            <div className="mt-4 text-sm text-blue-600">
              Powered by Ticketmaster API
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search events, artists, or venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="City or location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  {showFilters ? "Hide" : "Show"} Filters
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Prices</option>
                    <option value="under50">Under $50</option>
                    <option value="50-100">$50 - $100</option>
                    <option value="100-200">$100 - $200</option>
                    <option value="over200">Over $200</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="price">Price</option>
                    <option value="name">Name</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2 bg-white rounded-lg shadow-sm p-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Showing {filteredEvents.length} of {events.length} events
              {searchTerm && ` for "${searchTerm}"`}
              {locationFilter && ` in ${locationFilter}`}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800">
                  <div className="h-48 bg-gray-200 dark:bg-gray-800 relative">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop";
                      }}
                    />
                    {/* Event Preview (mock: show if event.previewUrl exists) */}
                    {event.previewUrl && (
                      <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 rounded p-1 shadow">
                        {event.previewUrl.endsWith('.mp4') ? (
                          <video src={event.previewUrl} controls className="w-32 h-16 rounded" />
                        ) : (
                          <audio src={event.previewUrl} controls className="w-32" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                        {event.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        {event.availableSeats} seats left
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{event.artist}</p>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        📍 {event.venue}, {event.city}{event.state && `, ${event.state}`}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        📅 {event.date !== "TBD" ? new Date(event.date).toLocaleDateString() : "TBD"} at {event.time}
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        💰 {event.price}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                      <button
                        onClick={() => handleBookTicket(event.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Book Tickets
                      </button>
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 block text-center bg-white dark:bg-gray-800 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 text-sm font-medium py-2 px-4 rounded-md transition-colors"
                        >
                          View on Ticketmaster →
                        </a>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleFavorite("artists", event.artist)}
                        className={`text-xs px-2 py-1 rounded-full border ${favorites.artists.includes(event.artist) ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 text-blue-600 border-blue-600"}`}
                      >
                        {favorites.artists.includes(event.artist) ? "★ Favorite Artist" : "☆ Favorite Artist"}
                      </button>
                      <button
                        onClick={() => handleFavorite("venues", event.venue)}
                        className={`text-xs px-2 py-1 rounded-full border ${favorites.venues.includes(event.venue) ? "bg-green-600 text-white" : "bg-white dark:bg-gray-900 text-green-600 border-green-600"}`}
                      >
                        {favorites.venues.includes(event.venue) ? "★ Favorite Venue" : "☆ Favorite Venue"}
                      </button>
                    </div>
                    {/* Enhanced: Show preview if available */}
                    {event.previewUrl && (
                      <div className="mt-4">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</span>
                        {event.previewUrl.endsWith('.mp4') ? (
                          <video src={event.previewUrl} controls className="w-full rounded" />
                        ) : (
                          <audio src={event.previewUrl} controls className="w-full" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === "profile") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">User Profile</h2>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="mb-2"><span className="font-semibold">Name:</span> {user.name}</div>
            <div className="mb-2"><span className="font-semibold">Email:</span> {user.email}</div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Preferences</h3>
            <div className="mb-2">
              <span className="font-semibold">Favorite Artists:</span> {favorites.artists.length > 0 ? favorites.artists.join(", ") : "None"}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Favorite Venues:</span> {favorites.venues.length > 0 ? favorites.venues.join(", ") : "None"}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Booking History</h3>
            {user.bookingHistory.length === 0 ? (
              <div className="text-gray-500">No bookings yet.</div>
            ) : (
              <ul className="list-disc pl-5">
                {user.bookingHistory.map((booking, idx) => (
                  <li key={idx}>{booking}</li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Personalized Dashboard</h2>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                  <div className="font-semibold text-blue-600 mb-1">{event.title}</div>
                  <div className="text-gray-600 text-sm mb-1">{event.artist} @ {event.venue}</div>
                  <div className="text-gray-500 text-xs mb-2">{event.date} {event.time}</div>
                  <button onClick={() => setCurrentView("events")}>View Event</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Recommended For You</h3>
            {recommendations.length === 0 ? (
              <div className="text-gray-500">No recommendations yet. Favorite artists or venues to get started!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                    <div className="font-semibold text-purple-600 mb-1">{event.title}</div>
                    <div className="text-gray-600 text-sm mb-1">{event.artist} @ {event.venue}</div>
                    <div className="text-gray-500 text-xs mb-2">{event.date} {event.time}</div>
                    <button onClick={() => setCurrentView("events")}>View Event</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Show Time</h1>
              <span className="ml-2 text-sm text-gray-500">Ticket Event App</span>
            </div>
            <button
              onClick={handleBackToLanding}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Show Time!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing events, concerts, and shows. Book your tickets with ease and enjoy the best entertainment experiences.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-xl">🎫</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Booking</h3>
            <p className="text-gray-600">Book tickets in just a few clicks with our streamlined process</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">🎭</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Amazing Events</h3>
            <p className="text-gray-600">Discover concerts, theater shows, sports events, and more</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">Safe and secure payment processing for all your bookings</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-6">
              Browse our upcoming events and secure your tickets today!
            </p>
            <button 
              onClick={handleBrowseEvents}
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Browse Events
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 