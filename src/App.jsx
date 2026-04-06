import React, { useState, useEffect } from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white px-6 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">Please refresh the page or try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const App = () => {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [recommendedMovies, setRecommendedMovies] = useState([])
  const [movieProviders, setMovieProviders] = useState({})
  const [providerLoading, setProviderLoading] = useState({})
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showAllMovies, setShowAllMovies] = useState(true)

  const moods = {
    'Romantic': 10749,
    'Funny': 35,
    'Cute': 10751,
    'Thrilling': 53,
    'Adventurous': 12,
    'Action-packed': 28,
    'Drama': 18,
    'Sci-Fi': 878,
    'Mystery': 9648,
    'Horror': 27,
    'Family': 10751,
    'Fantasy': 14,
    'Documentary': 99,
    'Comedy': 35,
    'Animation': 16
  
  }

  const fetchWatchProviders = async (movieId) => {
    console.log('Fetching providers for movie:', movieId)
    if (movieProviders[movieId] && movieProviders[movieId].length > 0) {
      console.log('Using cached providers:', movieProviders[movieId])
      return movieProviders[movieId] // cache
    }

    setProviderLoading(prev => ({ ...prev, [movieId]: true }))

    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=8de352b02095f5bc84bdabc53f8bb613`)
      console.log('API response status:', res.status)
      const data = await res.json()
      console.log('API data:', data)
      const available = data.results?.US || {}
      const allProviders = [
        ...(available?.free?.map((p) => ({ ...p, type: 'free' })) || []),
        ...(available?.flatrate?.map((p) => ({ ...p, type: 'flatrate' })) || []),
        ...(available?.ads?.map((p) => ({ ...p, type: 'ads' })) || []),
        ...(available?.rent?.map((p) => ({ ...p, type: 'rent' })) || []),
        ...(available?.buy?.map((p) => ({ ...p, type: 'buy' })) || []),
      ]
      const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values())
      console.log('Resolved providers:', uniqueProviders)
      setMovieProviders(prev => ({ ...prev, [movieId]: uniqueProviders }))
      setProviderLoading(prev => ({ ...prev, [movieId]: false }))
      return uniqueProviders
    } catch (error) {
      console.error('Error fetching watch providers:', error)
      setProviderLoading(prev => ({ ...prev, [movieId]: false }))
      return []
    }
  }

  const fetchRecommendedMovies = async (genreId) => {
    try {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`
      const res = await fetch(url)
      const data = await res.json()
      setRecommendedMovies(data.results ? data.results.slice(0, 6) : [])
    } catch (error) {
      console.error('Error fetching recommended movies:', error)
      setRecommendedMovies([])
    }
  }

  const fetchMultiKeywordRecommendations = async (keywords) => {
    try {
      const query = encodeURIComponent(keywords.join(' '))
      const url = `https://api.themoviedb.org/3/search/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&query=${query}&page=1`
      const res = await fetch(url)
      const data = await res.json()
      const results = data.results || []
      setRecommendedMovies(results.slice(0, 6))
      if (results.length === 0) {
        console.log('No results for multi-keyword recommendation:', keywords)
      }
    } catch (error) {
      console.error('Error fetching multi-keyword recommendations:', error)
      setRecommendedMovies([])
    }
  }

  const getdata = async (query = '', genreId = '', pageNum = 1) => {
    try {
      let url
      if (query) {
        url = `https://api.themoviedb.org/3/search/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&query=${encodeURIComponent(query)}&page=${pageNum}`
      } else if (genreId) {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`
      } else {
        url = `https://api.themoviedb.org/3/movie/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=${pageNum}`
      }
      const res = await fetch(url)
      const data = await res.json()
      console.log(data)
      const allMovies = data.results || []
      setMovies(allMovies)

      // Automatically pick best recommendations from current results
      const sortedByQuality = [...allMovies].sort((a, b) => {
        if (b.vote_average !== a.vote_average) return b.vote_average - a.vote_average
        return (b.vote_count || 0) - (a.vote_count || 0)
      })
      setRecommendedMovies(sortedByQuality.slice(0, 6))
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchGenres = async () => {
    try {
      const res = await fetch('https://api.themoviedb.org/3/genre/movie/list?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US')
      const data = await res.json()
      setGenres(data.genres || [])
    } catch (error) {
      console.error('Error fetching genres:', error)
      setGenres([])
    }
  }

  useEffect(() => {
    fetchGenres()
  }, [])

  useEffect(() => {
    getdata(searchQuery, selectedGenre, page)
  }, [page, searchQuery, selectedGenre])

  const handleSearch = () => {
    setPage(1)
    setSelectedGenre('')
    setSelectedMood('')
    setIsSearching(true)
    const keywords = searchQuery.trim().split(/\s+/).filter(Boolean)
    if (keywords.length >= 3) {
      fetchMultiKeywordRecommendations(keywords)
    } else {
      setRecommendedMovies([])
    }
    getdata(searchQuery, '', 1)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedMood('')
    setIsSearching(false)
    setPage(1)
    setRecommendedMovies([])
    getdata('', '', 1)
  }

  const handleGenreSelect = (genreId) => {
    setSelectedGenre(genreId)
    setSelectedMood('')
    setSearchQuery('')
    setIsSearching(false)
    setPage(1)
    if (genreId) {
      fetchRecommendedMovies(genreId)
    } else {
      setRecommendedMovies([])
    }
  }

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    const genreId = moods[mood]
    setSelectedGenre(genreId)
    setSearchQuery('')
    setIsSearching(false)
    setPage(1)
    if (genreId) {
      fetchRecommendedMovies(genreId)
    } else {
      setRecommendedMovies([])
    }
  }

  const renderProviderSection = (movie) => {
    const providers = movieProviders[movie.id] || []
    const loading = providerLoading[movie.id]

    if (loading) {
      return <p className="text-xs text-blue-300 mt-1">Checking streaming availability...</p>
    }

    if (providers.length === 0) {
      return (
        <p className="text-xs text-red-400 mt-1">No streaming providers found (region may be unavailable). Click "Free Streaming" again or visit View Details.</p>
      )
    }

    const freeProviders = providers.filter(p => p.type === 'free')
    const nonFreeProviders = providers.filter(p => p.type !== 'free')

    if (freeProviders.length > 0) {
      return (
        <div className="mt-1">
          <p className="text-xs text-green-400">Free available on:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {freeProviders.map((provider) => (
              <a
                key={provider.provider_id}
                href={`https://www.google.com/search?q=${encodeURIComponent(`${movie.title} on ${provider.provider_name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-800 px-1 py-0.5 rounded hover:bg-green-700"
              >
                {provider.provider_name}
              </a>
            ))}
          </div>
          {nonFreeProviders.length > 0 && (
            <p className="text-xs text-yellow-300 mt-1">Also available (pay): {nonFreeProviders.map(p => p.provider_name).join(', ')}</p>
          )}
        </div>
      )
    }

    return (
      <div className="mt-1">
        <p className="text-xs text-red-400">Not freely available; available on:</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {nonFreeProviders.map((provider) => (
            <a
              key={provider.provider_id}
              href={`https://www.google.com/search?q=${encodeURIComponent(`${movie.title} on ${provider.provider_name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-orange-800 px-1 py-0.5 rounded hover:bg-orange-700"
            >
              {provider.provider_name}
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-black text-white px-6 py-8">
    <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl font-bold text-center mb-8">
      Movie App {isSearching ? `(Search: ${searchQuery})` : selectedMood ? `(Mood: ${selectedMood})` : selectedGenre && genres.length > 0 ? `(Genre: ${genres.find(g => g.id == selectedGenre)?.name})` : `(Page ${page})`}
    </h1>

    {/* Mood and Genre Selector and Search Bar */}
    <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
      <select
        value={selectedMood}
        onChange={(e) => handleMoodSelect(e.target.value)}
        className="px-4 py-2 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-w-48"
      >
        <option value="">Select Your Interest/Mood</option>
        {Object.keys(moods).map((mood) => (
          <option key={mood} value={mood}>
            {mood}
          </option>
        ))}
      </select>

      <select
        value={selectedGenre}
        onChange={(e) => handleGenreSelect(e.target.value)}
        className="px-4 py-2 bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-w-48"
      >
        <option value="">Select Genre</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Search for movies by title..."
        className="px-4 py-2 bg-zinc-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500 flex-1 min-w-80"
      />
      <button
        onClick={handleSearch}
        className="px-6 py-2 bg-red-600 rounded-r-lg hover:bg-red-500"
      >
        Search
      </button>
      {(isSearching || selectedGenre || selectedMood) && (
        <button
          onClick={handleClearSearch}
          className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
        >
          Clear
        </button>
      )}
      <button
        onClick={() => setShowAllMovies(prev => !prev)}
        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 ml-2"
      >
        {showAllMovies ? 'Hide All Movies' : 'Show All Movies'}
      </button>
    </div>

    {/* Recommended Movies */}
    {recommendedMovies.length > 0 && (
      <div className="mb-8 max-w-7xl mx-auto border border-yellow-500 rounded-2xl p-4 bg-zinc-950/70">
        <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">
          Top 6 Recommended Movies {selectedMood ? `for ${selectedMood} Mood` : selectedGenre && genres.length > 0 ? `in ${genres.find(g => g.id == selectedGenre)?.name}` : ''}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedMovies.map((movie) => (
            <div
              key={movie.id}
              className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
            >
              {movie.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-80 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  {movie.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {movie.overview}
                </p>
                <h4 className="text-xs mt-2 text-yellow-500 font-medium">
                  Rating: {movie.vote_average}/10
                </h4>
                <button
                  onClick={() => fetchWatchProviders(movie.id)}
                  className="px-3 py-1 bg-green-600 rounded-lg hover:bg-green-500 text-xs mt-1 mr-1"
                >
                  Free Streaming
                </button>
                {renderProviderSection(movie)}
                <a
                  href={`https://www.themoviedb.org/movie/${movie.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline mt-2 inline-block"
                >
                  <button className="px-4 py-1 bg-gray-700 rounded-lg hover:bg-gray-800 text-sm">
                    View Details
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Movie Grid */}
    {showAllMovies && (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => (
        <div
          key={movie.id}
          className="bg-zinc-900 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
        >
          {movie.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-[400] object-cover"
            />
          )}

          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              {movie.title}
            </h3>

            <p className="text-sm text-gray-400 line-clamp-2">
              {movie.overview}
            </p>

            <h4 className="text-xs mt-3 text-red-500 font-medium">
              Release: {movie.release_date}
            </h4>
            <h4 className="text-xs text-yellow-500 font-medium">
              Rating: {movie.vote_average}/10 ({movie.vote_count} votes)
            </h4>
            <button
              onClick={() => fetchWatchProviders(movie.id)}
              className="px-4 py-1 bg-green-600 rounded-lg hover:bg-green-500 text-sm mt-2 mr-2"
            >
              Free Streaming
            </button>
            {renderProviderSection(movie)}
            <a
  href={`https://www.themoviedb.org/movie/${movie.id}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-400 hover:underline mt-2 inline-block"
>
  <button  className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-900">View Details</button>
</a>
          </div>
        </div>
      ))}
      
    </div>
    )}
    {/* Pagination */}
    <div className="flex justify-center gap-6 mt-10">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50"
      >
        Prev
      </button>

      <button
        onClick={() => setPage(page + 1)}
        className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500"
      >
        Next
      </button>
    </div>
    </div>
  </div>
)}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}