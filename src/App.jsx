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

const STORAGE_KEY = 'movieApp.watchlist'
const NOTES_KEY = 'movieApp.notes'
const THEME_KEY = 'movieApp.theme'
const RECENTLY_VIEWED_KEY = 'movieApp.recentlyViewed'

const App = () => {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [movieGenres, setMovieGenres] = useState([])
  const [tvGenresList, setTvGenresList] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedGenreIds, setSelectedGenreIds] = useState({ movie: null, tv: null, name: '' })
  const [selectedMood, setSelectedMood] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [recommendedMovies, setRecommendedMovies] = useState([])
  const [movieProviders, setMovieProviders] = useState({})
  const [providerLoading, setProviderLoading] = useState({})
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showAllMovies, setShowAllMovies] = useState(true)
  const [contentType, setContentType] = useState('all')
  const [watchlist, setWatchlist] = useState([])
  const [tvDetails, setTvDetails] = useState({})
  const [compareMovies, setCompareMovies] = useState([])
  const [movieNotes, setMovieNotes] = useState({})
  const [trendingMovies, setTrendingMovies] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [genrePreference, setGenrePreference] = useState({})
  const [keywordPreference, setKeywordPreference] = useState({})
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [trailerInfo, setTrailerInfo] = useState({ title: '', videoKey: '' })
  const [loadingTrailer, setLoadingTrailer] = useState(false)
  const [surpriseMovie, setSurpriseMovie] = useState(null)
  const [surpriseTrailers, setSurpriseTrailers] = useState([])
  const [surpriseLoading, setSurpriseLoading] = useState(false)
  const [pairedMovies, setPairedMovies] = useState([])

  const moods = {
    Romantic: 10749,
    Funny: 35,
    Cute: 10751,
    Thrilling: 53,
    Adventurous: 12,
    'Action-packed': 28,
    Drama: 18,
    'Sci-Fi': 878,
    Mystery: 9648,
    Horror: 27,
    Family: 10751,
    Fantasy: 14,
    Documentary: 99,
    Comedy: 35,
    Animation: 16,
  }

  const moodGenreMap = {
    Romantic: { movie: 10749, tv: 10749 },
    Funny: { movie: 35, tv: 35 },
    Cute: { movie: 10751, tv: 10751 },
    Thrilling: { movie: 53, tv: 9648 },
    Adventurous: { movie: 12, tv: 10759 },
    'Action-packed': { movie: 28, tv: 10759 },
    Drama: { movie: 18, tv: 18 },
    'Sci-Fi': { movie: 878, tv: 10765 },
    Mystery: { movie: 9648, tv: 9648 },
    Horror: { movie: 27, tv: 27 },
    Family: { movie: 10751, tv: 10751 },
    Fantasy: { movie: 14, tv: 10765 },
    Documentary: { movie: 99, tv: 99 },
    Comedy: { movie: 35, tv: 35 },
    Animation: { movie: 16, tv: 16 },
  }

  const availableGenres = contentType === 'movie' ? movieGenres : contentType === 'tv' ? tvGenresList : genres
  const isTV = contentType === 'tv'

  const getGenrePair = (genreId) => {
    const idNum = Number(genreId)
    const movieMatch = movieGenres.find((genre) => genre.id === idNum) || genres.find((genre) => genre.id === idNum)
    const tvMatch = tvGenresList.find((genre) => genre.id === idNum) || genres.find((genre) => genre.id === idNum)
    const name = movieMatch?.name || tvMatch?.name || ''
    const movieId = movieMatch?.id || (name ? movieGenres.find((genre) => genre.name === name)?.id : null)
    const tvId = tvMatch?.id || (name ? tvGenresList.find((genre) => genre.name === name)?.id : null)
    return { movie: movieId || null, tv: tvId || null, name }
  }

  const getDisplayTitle = (item) => item.title || item.name || item.original_name || 'Unknown title'
  const getDisplayDate = (item) => item.release_date || item.first_air_date || 'Unknown'

  const getGenreNames = (ids = []) => {
    return ids
      .map((id) => genres.find((genre) => genre.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
  }

  const loadLocalData = () => {
    const savedWatchlist = localStorage.getItem(STORAGE_KEY)
    const savedNotes = localStorage.getItem(NOTES_KEY)
    const savedTheme = localStorage.getItem(THEME_KEY)
    const savedRecentlyViewed = localStorage.getItem(RECENTLY_VIEWED_KEY)

    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist))
      } catch {
        setWatchlist([])
      }
    }

    if (savedNotes) {
      try {
        setMovieNotes(JSON.parse(savedNotes))
      } catch {
        setMovieNotes({})
      }
    }

    if (savedRecentlyViewed) {
      try {
        setRecentlyViewed(JSON.parse(savedRecentlyViewed))
      } catch {
        setRecentlyViewed([])
      }
    }

    if (savedTheme === 'light') {
      document.documentElement.classList.add('light')
    }
  }

  const saveThemePreference = () => {
    const theme = document.documentElement.classList.contains('light') ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme)
  }

  const saveRecentlyViewed = (items) => {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items))
  }

  const addToRecentlyViewed = (movie) => {
    const entry = {
      id: movie.id,
      media_type: movie.media_type,
      title: getDisplayTitle(movie),
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date || movie.first_air_date || '',
    }
    setRecentlyViewed((prev) => {
      const existing = prev.filter((item) => item.id !== entry.id || item.media_type !== entry.media_type)
      const updated = [entry, ...existing].slice(0, 8)
      saveRecentlyViewed(updated)
      return updated
    })
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('light')
    saveThemePreference()
  }

  const fetchGenres = async () => {
    try {
      const movieRes = fetch('https://api.themoviedb.org/3/genre/movie/list?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US')
      const tvRes = fetch('https://api.themoviedb.org/3/genre/tv/list?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US')
      const [movieData, tvData] = await Promise.all([movieRes.then((res) => res.json()), tvRes.then((res) => res.json())])
      const movieGenreList = movieData.genres || []
      const tvGenreList = tvData.genres || []
      const allGenres = [...movieGenreList, ...tvGenreList]
      const uniqueGenres = Array.from(new Map(allGenres.map((genre) => [genre.id, genre])).values())
      setGenres(uniqueGenres)
      setMovieGenres(movieGenreList)
      setTvGenresList(tvGenreList)
    } catch (error) {
      console.error('Error fetching genres:', error)
      setGenres([])
      setMovieGenres([])
      setTvGenresList([])
    }
  }

  const fetchTrendingMovies = async () => {
    try {
      if (contentType === 'all') {
        const [movieRes, tvRes] = await Promise.all([
          fetch('https://api.themoviedb.org/3/movie/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=1'),
          fetch('https://api.themoviedb.org/3/tv/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=1'),
        ])
        const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])
        const movieResults = (movieData.results || []).map((item) => ({ ...item, media_type: 'movie' }))
        const tvResults = (tvData.results || []).map((item) => ({ ...item, media_type: 'tv' }))
        setTrendingMovies([...movieResults, ...tvResults])
      } else {
        const type = contentType
        const res = await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=1`)
        const data = await res.json()
        setTrendingMovies((data.results || []).map((item) => ({ ...item, media_type: type })))
      }
    } catch (error) {
      console.error('Error fetching trending movies:', error)
      setTrendingMovies([])
    }
  }

  const fetchTopRatedMovies = async () => {
    try {
      if (contentType === 'all') {
        const [movieRes, tvRes] = await Promise.all([
          fetch('https://api.themoviedb.org/3/movie/top_rated?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=1'),
          fetch('https://api.themoviedb.org/3/tv/top_rated?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=1'),
        ])
        const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])
        const movieResults = (movieData.results || []).map((item) => ({ ...item, media_type: 'movie' }))
        const tvResults = (tvData.results || []).map((item) => ({ ...item, media_type: 'tv' }))
        setTopRatedMovies([...movieResults, ...tvResults])
      } else {
        const type = contentType
        const res = await fetch(`https://api.themoviedb.org/3/${type}/top_rated?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=1`)
        const data = await res.json()
        setTopRatedMovies((data.results || []).map((item) => ({ ...item, media_type: type })))
      }
    } catch (error) {
      console.error('Error fetching top rated movies:', error)
      setTopRatedMovies([])
    }
  }

  const fetchWatchProviders = async (movieId, typeOverride = null) => {
    if (movieProviders[movieId] && movieProviders[movieId].length > 0) {
      return movieProviders[movieId]
    }

    setProviderLoading((prev) => ({ ...prev, [movieId]: true }))

    try {
      const type = typeOverride || (contentType === 'tv' ? 'tv' : 'movie')
      const res = await fetch(`https://api.themoviedb.org/3/${type}/${movieId}/watch/providers?api_key=8de352b02095f5bc84bdabc53f8bb613`)
      const data = await res.json()
      const available = data.results?.US || {}
      const allProviders = [
        ...(available?.free?.map((p) => ({ ...p, type: 'free' })) || []),
        ...(available?.flatrate?.map((p) => ({ ...p, type: 'flatrate' })) || []),
        ...(available?.ads?.map((p) => ({ ...p, type: 'ads' })) || []),
        ...(available?.rent?.map((p) => ({ ...p, type: 'rent' })) || []),
        ...(available?.buy?.map((p) => ({ ...p, type: 'buy' })) || []),
      ]
      const uniqueProviders = Array.from(new Map(allProviders.map((p) => [p.provider_id, p])).values())
      setMovieProviders((prev) => ({ ...prev, [movieId]: uniqueProviders }))
      setProviderLoading((prev) => ({ ...prev, [movieId]: false }))
      return uniqueProviders
    } catch (error) {
      console.error('Error fetching watch providers:', error)
      setProviderLoading((prev) => ({ ...prev, [movieId]: false }))
      return []
    }
  }

  const fetchSurpriseAssets = async (movie) => {
    setSurpriseTrailers([])
    setSurpriseLoading(true)

    try {
      const type = movie.media_type === 'tv' ? 'tv' : 'movie'
      await fetchWatchProviders(movie.id, type)

      const res = await fetch(`https://api.themoviedb.org/3/${type}/${movie.id}/videos?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US`)
      const data = await res.json()
      const trailers = (data.results || [])
        .filter((item) => item.site === 'YouTube')
        .sort((a, b) => (a.type === 'Trailer' === b.type === 'Trailer' ? 0 : a.type === 'Trailer' ? -1 : 1))
        .slice(0, 3)
        .map((item) => ({
          key: item.key,
          name: item.name || item.type || 'Trailer',
          type: item.type,
          official: item.official,
          publishedAt: item.published_at,
        }))
      setSurpriseTrailers(trailers)
    } catch (error) {
      console.error('Error fetching surprise trailers:', error)
      setSurpriseTrailers([])
    } finally {
      setSurpriseLoading(false)
    }
  }

  const fetchTvDetails = async (tvId) => {
    if (tvDetails[tvId]) return
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US`)
      const data = await res.json()
      setTvDetails((prev) => ({ ...prev, [tvId]: data }))
    } catch (error) {
      console.error('Error fetching TV details:', error)
    }
  }

  const fetchRecommendedMovies = async (genreInfo) => {
    try {
      if (!genreInfo) {
        setRecommendedMovies([])
        return
      }
      if (contentType === 'all') {
        const movieGenreId = genreInfo.movie || genreInfo
        const tvGenreId = genreInfo.tv || genreInfo
        const [movieRes, tvRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${movieGenreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`),
          fetch(`https://api.themoviedb.org/3/discover/tv?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${tvGenreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`),
        ])
        const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])
        const movieResults = (movieData.results || []).map((item) => ({ ...item, media_type: 'movie' }))
        const tvResults = (tvData.results || []).map((item) => ({ ...item, media_type: 'tv' }))
        const combined = [...movieResults, ...tvResults]
        combined.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        setRecommendedMovies(combined.slice(0, 3))
      } else {
        const type = contentType
        const genreId = type === 'tv' ? (genreInfo.tv || genreInfo.movie || genreInfo) : (genreInfo.movie || genreInfo)
        const url = `https://api.themoviedb.org/3/discover/${type}?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`
        const res = await fetch(url)
        const data = await res.json()
        setRecommendedMovies((data.results || []).map((item) => ({ ...item, media_type: type })).slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching recommended movies:', error)
      setRecommendedMovies([])
    }
  }

  const addGenrePreference = (genreIds, delta = 1) => {
    if (!genreIds?.length) return
    setGenrePreference((prev) => {
      const next = { ...prev }
      genreIds.forEach((id) => {
        next[id] = Math.max(0, (next[id] || 0) + delta)
      })
      return next
    })
  }

  const addKeywordPreference = (query) => {
    const keywords = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (!keywords.length) return
    setKeywordPreference((prev) => {
      const next = { ...prev }
      keywords.forEach((keyword) => {
        next[keyword] = (next[keyword] || 0) + 1
      })
      return next
    })
  }

  const scoreMovieByHistory = (movie) => {
    let score = 0
    const genres = movie.genre_ids || []
    genres.forEach((id) => {
      score += genrePreference[id] || 0
    })
    const text = `${movie.title} ${movie.overview}`.toLowerCase()
    Object.entries(keywordPreference).forEach(([keyword, weight]) => {
      if (text.includes(keyword)) {
        score += weight
      }
    })
    return score
  }

  const getHistoricalSurpriseMovie = (pool) => {
    if (!pool.length) return null
    const scored = pool.map((movie) => ({ movie, score: scoreMovieByHistory(movie) }))
    scored.sort((a, b) => b.score - a.score)
    const topScore = scored[0].score
    if (topScore === 0) {
      return pool[Math.floor(Math.random() * pool.length)]
    }
    const topMovies = scored.filter((item) => item.score === topScore).map((item) => item.movie)
    return topMovies[Math.floor(Math.random() * topMovies.length)]
  }

  const fetchMultiKeywordRecommendations = async (keywords) => {
    try {
      const query = encodeURIComponent(keywords.join(' '))
      if (contentType === 'all') {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&query=${query}&page=1`)
        const data = await res.json()
        const results = (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        setRecommendedMovies(results.slice(0, 3))
      } else {
        const type = contentType
        const res = await fetch(`https://api.themoviedb.org/3/search/${type}?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&query=${query}&page=1`)
        const data = await res.json()
        setRecommendedMovies((data.results || []).slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching multi-keyword recommendations:', error)
      setRecommendedMovies([])
    }
  }

  const getdata = async (query = '', genreInfo = null, pageNum = 1) => {
    try {
      let allResults = []
      if (query) {
        if (contentType === 'all') {
          const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&query=${encodeURIComponent(query)}&page=${pageNum}`)
          const data = await res.json()
          allResults = (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
        } else {
          const type = contentType
          const res = await fetch(`https://api.themoviedb.org/3/search/${type}?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&query=${encodeURIComponent(query)}&page=${pageNum}`)
          const data = await res.json()
          allResults = (data.results || []).map((item) => ({ ...item, media_type: type }))
        }
      } else if (genreInfo && (genreInfo.movie || genreInfo.tv)) {
        if (contentType === 'all') {
          const movieGenreId = genreInfo.movie
          const tvGenreId = genreInfo.tv
          const [movieRes, tvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/discover/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${movieGenreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`),
            fetch(`https://api.themoviedb.org/3/discover/tv?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${tvGenreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`),
          ])
          const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])
          const movieResults = (movieData.results || []).map((item) => ({ ...item, media_type: 'movie' }))
          const tvResults = (tvData.results || []).map((item) => ({ ...item, media_type: 'tv' }))
          allResults = [...movieResults, ...tvResults]
        } else {
          const type = contentType
          const genreId = type === 'tv' ? genreInfo.tv || genreInfo.movie : genreInfo.movie || genreInfo.tv
          const res = await fetch(`https://api.themoviedb.org/3/discover/${type}?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`)
          const data = await res.json()
          allResults = (data.results || []).map((item) => ({ ...item, media_type: type }))
        }
      } else if (genreInfo) {
        const genreId = genreInfo.movie || genreInfo.tv || genreInfo
        if (contentType === 'all') {
          const [movieRes, tvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/discover/movie?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`),
            fetch(`https://api.themoviedb.org/3/discover/tv?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`),
          ])
          const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])
          const movieResults = (movieData.results || []).map((item) => ({ ...item, media_type: 'movie' }))
          const tvResults = (tvData.results || []).map((item) => ({ ...item, media_type: 'tv' }))
          allResults = [...movieResults, ...tvResults]
        } else {
          const type = contentType
          const res = await fetch(`https://api.themoviedb.org/3/discover/${type}?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&with_genres=${genreId}&sort_by=vote_average.desc&page=${pageNum}&vote_count.gte=100`)
          const data = await res.json()
          allResults = (data.results || []).map((item) => ({ ...item, media_type: type }))
        }
      } else {
        if (contentType === 'all') {
          const [movieRes, tvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/movie/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=${pageNum}`),
            fetch(`https://api.themoviedb.org/3/tv/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=${pageNum}`),
          ])
          const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()])
          const movieResults = (movieData.results || []).map((item) => ({ ...item, media_type: 'movie' }))
          const tvResults = (tvData.results || []).map((item) => ({ ...item, media_type: 'tv' }))
          allResults = [...movieResults, ...tvResults]
        } else {
          const type = contentType
          const res = await fetch(`https://api.themoviedb.org/3/${type}/popular?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US&page=${pageNum}`)
          const data = await res.json()
          allResults = (data.results || []).map((item) => ({ ...item, media_type: type }))
        }
      }

      setMovies(allResults)
      const sortedByQuality = [...allResults].sort((a, b) => {
        if ((b.vote_average || 0) !== (a.vote_average || 0)) return (b.vote_average || 0) - (a.vote_average || 0)
        return ((b.vote_count || 0) - (a.vote_count || 0))
      })
      setRecommendedMovies(sortedByQuality.slice(0, 3))
      return allResults
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }

  const fetchTrailer = async (movie) => {
    addToRecentlyViewed(movie)
    setLoadingTrailer(true)
    try {
      const type = movie.media_type === 'tv' ? 'tv' : 'movie'
      const res = await fetch(`https://api.themoviedb.org/3/${type}/${movie.id}/videos?api_key=8de352b02095f5bc84bdabc53f8bb613&language=en-US`)
      const data = await res.json()
      const trailer = (data.results || []).find((item) => item.site === 'YouTube' && item.type === 'Trailer') || (data.results || []).find((item) => item.site === 'YouTube')
      setTrailerInfo({ title: getDisplayTitle(movie), videoKey: trailer?.key || '' })
      setShowTrailerModal(true)
    } catch (error) {
      console.error('Error fetching trailer:', error)
      setTrailerInfo({ title: getDisplayTitle(movie), videoKey: '' })
      setShowTrailerModal(true)
    } finally {
      setLoadingTrailer(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    setSelectedGenre('')
    setSelectedGenreIds({ movie: null, tv: null, name: '' })
    setSelectedMood('')
    setIsSearching(true)
    addKeywordPreference(searchQuery)
    const keywords = searchQuery.trim().split(/\s+/).filter(Boolean)
    if (keywords.length >= 3) {
      fetchMultiKeywordRecommendations(keywords)
    } else {
      setRecommendedMovies([])
    }
    getdata(searchQuery, null, 1)
  }

  const pickSurpriseMovie = () => {
    const pool = movies.length ? movies : trendingMovies
    if (pool.length === 0) return

    const excludedIds = new Set([
      ...recommendedMovies.map((movie) => movie.id),
      ...trendingMovies.slice(0, 4).map((movie) => movie.id),
      ...topRatedMovies.slice(0, 4).map((movie) => movie.id),
    ])

    const filteredPool = pool.filter((movie) => !excludedIds.has(movie.id))
    const finalPool = filteredPool.length > 0 ? filteredPool : pool

    const surprise = getHistoricalSurpriseMovie(finalPool)
    if (!surprise) return
    setSurpriseMovie(surprise)
    setPairedMovies(getPairedMovies(surprise))
    fetchSurpriseAssets(surprise)
    scrollToSection('surprise')
  }

  const getPairedMovies = (baseMovie) => {
    const pool = movies.length ? movies : trendingMovies
    const matching = pool
      .filter((movie) => movie.id !== baseMovie.id && movie.genre_ids?.some((genre) => baseMovie.genre_ids?.includes(genre)))
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 2)
    return matching
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedGenreIds({ movie: null, tv: null, name: '' })
    setSelectedMood('')
    setContentType('all')
    setIsSearching(false)
    setPage(1)
    setRecommendedMovies([])
    setShowAllMovies(true)
    getdata('', null, 1)
  }

  const scrollToSection = (id) => {
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1) return
    setPage(newPage)
    scrollToSection('discover')
  }

  const displayedRecommendedMovies = (() => {
    if (recommendedMovies.length >= 3) {
      return recommendedMovies.slice(0, 3)
    }
    const extraMovies = movies.filter(
      (movie) => !recommendedMovies.some((rec) => rec.id === movie.id)
    )
    return [...recommendedMovies, ...extraMovies].slice(0, 3)
  })()
  const relatedMovies = (selectedMood || selectedGenre) ? (movies.length > 0 ? movies : displayedRecommendedMovies) : movies
  const selectedLabel = selectedMood || selectedGenreIds.name || (selectedGenre ? genres.find((g) => g.id == selectedGenre)?.name : '')
  const recommendedCompareMovieId = compareMovies.reduce((bestId, movie) => {
    if (!bestId) return movie.id
    const bestMovie = compareMovies.find((m) => m.id === bestId)
    return (movie.vote_average || 0) > (bestMovie?.vote_average || 0) ? movie.id : bestId
  }, null)

  const handleGenreSelect = (genreId) => {
    const genreInfo = getGenrePair(genreId)
    setSelectedGenre(genreId)
    setSelectedGenreIds(genreInfo)
    setSelectedMood('')
    setSearchQuery('')
    setIsSearching(false)
    setPage(1)
    if (genreInfo.movie || genreInfo.tv) {
      fetchRecommendedMovies(genreInfo)
    } else {
      setRecommendedMovies([])
    }
  }

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    const genreInfo = moodGenreMap[mood] || { movie: null, tv: null }
    setSelectedGenre(genreInfo.movie || genreInfo.tv || '')
    setSelectedGenreIds({ ...genreInfo, name: mood })
    setSearchQuery('')
    setIsSearching(false)
    setPage(1)
    if (genreInfo.movie || genreInfo.tv) {
      fetchRecommendedMovies(genreInfo)
    } else {
      setRecommendedMovies([])
    }
  }

  const isInWatchlist = (movie) => watchlist.some((item) => item.id === movie.id)

  const toggleWatchlist = (movie) => {
    if (isInWatchlist(movie)) {
      setWatchlist((prev) => prev.filter((item) => item.id !== movie.id))
      addGenrePreference(movie.genre_ids, -1)
      return
    }
    setWatchlist((prev) => [movie, ...prev])
    addGenrePreference(movie.genre_ids)
  }

  const isInCompare = (movie) => compareMovies.some((item) => item.id === movie.id)

  const toggleCompare = (movie) => {
    if (isInCompare(movie)) {
      setCompareMovies((prev) => prev.filter((item) => item.id !== movie.id))
      return
    }
    if (compareMovies.length >= 3) {
      alert('Please remove one movie before adding another to compare.')
      return
    }
    setCompareMovies((prev) => [movie, ...prev])
  }

  const removeFromCompare = (movieId) => {
    setCompareMovies((prev) => prev.filter((movie) => movie.id !== movieId))
  }

  const removeFromWatchlist = (movieId) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== movieId))
  }

  const updateMovieNote = (movieId, field, value) => {
    setMovieNotes((prev) => ({
      ...prev,
      [movieId]: {
        ...prev[movieId],
        [field]: value,
      },
    }))
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
    const freeProviders = providers.filter((p) => p.type === 'free')
    const nonFreeProviders = providers.filter((p) => p.type !== 'free')
    if (freeProviders.length > 0) {
      return (
        <div className="mt-1">
          <p className="text-xs text-green-400">Free available on:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {freeProviders.map((provider) => (
              <a
                key={provider.provider_id}
                href={`https://www.google.com/search?q=${encodeURIComponent(`${getDisplayTitle(movie)} on ${provider.provider_name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-800 px-1 py-0.5 rounded hover:bg-green-700"
              >
                {provider.provider_name}
              </a>
            ))}
          </div>
          {nonFreeProviders.length > 0 && (
            <p className="text-xs text-yellow-300 mt-1">Also available (pay): {nonFreeProviders.map((p) => p.provider_name).join(', ')}</p>
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
              href={`https://www.google.com/search?q=${encodeURIComponent(`${getDisplayTitle(movie)} on ${provider.provider_name}`)}`}
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

  const MovieCard = ({ movie }) => {
    const note = movieNotes[movie.id]
    const tvInfo = movie.media_type === 'tv' ? tvDetails[movie.id] : null
    const imagePath = movie.poster_path || movie.backdrop_path
    const overviewText = movie.overview || movie.description || 'No overview available.'
    const shortOverview = overviewText.length > 160 ? `${overviewText.slice(0, 160)}...` : overviewText

    useEffect(() => {
      if (movie.media_type === 'tv') {
        fetchTvDetails(movie.id)
      }
    }, [movie.id, movie.media_type])

    return (
      <div className="bg-zinc-900 rounded-3xl overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1">
        {imagePath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${imagePath}`}
            alt={getDisplayTitle(movie)}
            className="w-full h-72 object-cover"
          />
        ) : (
          <div className="flex h-72 items-center justify-center bg-slate-800 text-slate-400">Image not available</div>
        )}
        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="bg-slate-800 rounded-full px-3 py-1">{movie.media_type === 'tv' ? 'Series' : 'Movie'}</span>
            <span className="bg-slate-800 rounded-full px-3 py-1">{getDisplayDate(movie)}</span>
            <span className="bg-slate-800 rounded-full px-3 py-1">{movie.vote_average}/10</span>
            {movie.genre_ids?.length > 0 && (
              <span className="bg-slate-800 rounded-full px-3 py-1">{getGenreNames(movie.genre_ids)}</span>
            )}
            {movie.media_type === 'tv' && (
              <span className="bg-slate-800 rounded-full px-3 py-1">Seasons: {tvInfo?.number_of_seasons ?? '...'}</span>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{getDisplayTitle(movie)}</h3>
          <p className="text-sm text-gray-400 mb-3 overflow-hidden" style={{ maxHeight: '6rem' }}>{shortOverview}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => fetchWatchProviders(movie.id, movie.media_type || 'movie')}
              className="w-full px-3 py-2 bg-emerald-600 rounded-2xl text-sm font-medium hover:bg-emerald-500"
            >
              Free Streaming
            </button>
            <button
              onClick={() => fetchTrailer(movie)}
              className="w-full px-3 py-2 bg-sky-600 rounded-2xl text-sm font-medium hover:bg-sky-500"
            >
              Trailer Preview
            </button>
            <button
              type="button"
              onClick={() => toggleWatchlist(movie)}
              className={`w-full px-3 py-2 rounded-2xl text-sm font-medium ${isInWatchlist(movie) ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-400' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {isInWatchlist(movie) ? 'Saved' : 'Watchlist'}
            </button>
            <button
              type="button"
              onClick={() => toggleCompare(movie)}
              disabled={!isInCompare(movie) && compareMovies.length >= 3}
              className={`w-full px-3 py-2 rounded-2xl text-sm font-medium ${isInCompare(movie) ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-slate-700 hover:bg-slate-600'} ${!isInCompare(movie) && compareMovies.length >= 3 ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isInCompare(movie) ? 'Comparing' : compareMovies.length >= 3 ? 'Full' : 'Compare'}
            </button>
          </div>
          {note?.rating || note?.note ? (
            <div className="mt-4 rounded-2xl bg-slate-950 p-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                {note?.rating ? <span>Your Rating: {note.rating}★</span> : <span className="text-slate-400">No rating yet</span>}
              </div>
              {note?.note && <p className="mt-2 text-slate-400">“{note.note}”</p>}
            </div>
          ) : null}
          {renderProviderSection(movie)}
          <a
            href={`https://www.themoviedb.org/${movie.media_type === 'tv' ? 'tv' : 'movie'}/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => addToRecentlyViewed(movie)}
            className="mt-4 inline-block w-full text-center rounded-2xl bg-slate-800 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-slate-700"
          >
            View Details
          </a>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchGenres()
    loadLocalData()
    fetchTrendingMovies()
    fetchTopRatedMovies()
  }, [contentType])

  useEffect(() => {
    getdata(searchQuery, selectedGenreIds.movie || selectedGenreIds.tv ? selectedGenreIds : null, page)
  }, [contentType, page, searchQuery, selectedGenreIds])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
  }, [watchlist])
  const SectionBlock = ({ title, subtitle, children }) => (
    <div className="rounded-3xl border border-slate-800 bg-zinc-950/80 p-5 shadow-xl">
      <h2 className="text-2xl font-bold text-slate-200 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 mb-4">{subtitle}</p>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-10">
          <div className="flex flex-col gap-6 rounded-4xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-rose-400">Movie Discovery Hub</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Movie Explorer</h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                Discover films, save favorites, compare choices, and preview trailers in one elegant experience.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('discover')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-100 ring-1 ring-slate-800 hover:bg-slate-800"
              >
                Discover
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('watchlist')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-100 ring-1 ring-slate-800 hover:bg-slate-800"
              >
                Watchlist
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('compare')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-100 ring-1 ring-slate-800 hover:bg-slate-800"
              >
                Compare
              </button>
              <button
                type="button"
                onClick={pickSurpriseMovie}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
              >
                Surprise Me
              </button>
            </nav>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-4xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current session</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-100">Page {page}</span>
                <span className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-100">Watchlist {watchlist.length}</span>
                <span className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-100">Compare {compareMovies.length}/3</span>
              </div>
            </div>
            <div className="rounded-4xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">What’s new?</h2>
              <p className="mt-3 text-sm text-slate-300">Use the filters below to find movies quickly, or press Surprise Me for a fast recommendation with pairing suggestions.</p>
            </div>
          </div>

          <div className="mt-8 rounded-4xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white">Search and explore</h3>
            <p className="mt-2 text-sm text-slate-400">Find movies or web series quickly, clear the search, or filter by mood and genre. Search results appear right under this panel.</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.8fr_1.2fr]">
              <div className="grid gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                      }}
                      placeholder="Search for movies or web series by title..."
                      className="h-14 flex-1 rounded-3xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                    <button
                      onClick={handleSearch}
                      className="h-14 rounded-3xl bg-rose-600 px-6 text-sm font-semibold text-white hover:bg-rose-500"
                    >
                      Search
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-5 items-center">
                    <button
                      onClick={() => setContentType('all')}
                      className={`rounded-3xl px-5 py-3 text-sm font-semibold ${contentType === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-100 hover:bg-slate-800'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setContentType('movie')}
                      className={`rounded-3xl px-5 py-3 text-sm font-semibold ${contentType === 'movie' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-100 hover:bg-slate-800'}`}
                    >
                      Movies
                    </button>
                    <button
                      onClick={() => setContentType('tv')}
                      className={`rounded-3xl px-5 py-3 text-sm font-semibold ${contentType === 'tv' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-100 hover:bg-slate-800'}`}
                    >
                      Webseries
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleClearSearch}
                    className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm text-slate-100 hover:bg-slate-800"
                  >
                    Clear search
                  </button>
                  <button
                    onClick={() => setShowAllMovies((prev) => !prev)}
                    className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    {showAllMovies ? 'Hide Grid' : 'Show Grid'}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 items-end">
                <select
                  value={selectedMood}
                  onChange={(e) => handleMoodSelect(e.target.value)}
                  className="h-14 rounded-3xl border border-slate-800 bg-slate-900 px-4 pr-10 text-sm text-slate-100 appearance-none focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="">Select Mood</option>
                  {Object.keys(moods).map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedGenre}
                  onChange={(e) => handleGenreSelect(e.target.value)}
                  className="h-14 rounded-3xl border border-slate-800 bg-slate-900 px-4 pr-10 text-sm text-slate-100 appearance-none focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="">Select Genre</option>
                  {availableGenres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {isSearching && searchQuery.trim() && (
          <div className="mb-8 rounded-4xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Search results</h3>
                <p className="text-sm text-slate-400">Showing all matching {contentType === 'tv' ? 'series' : contentType === 'all' ? 'movies and series' : 'movies'} for "{searchQuery}".</p>
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-3xl bg-slate-900 px-5 py-3 text-sm text-slate-100 hover:bg-slate-800"
              >
                Clear search
              </button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              ) : (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">No movies found for this search.</div>
              )}
            </div>
          </div>
        )}

        {!selectedMood && !selectedGenre && !isSearching && displayedRecommendedMovies.length > 0 && (
          <div className="mb-8 rounded-4xl border border-yellow-500 bg-slate-950/80 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">
              Recommended {contentType === 'all' ? 'movies and series' : contentType === 'tv' ? 'series' : 'movies'} {selectedMood ? `for ${selectedMood}` : selectedGenre && genres.length > 0 ? `in ${genres.find((g) => g.id == selectedGenre)?.name}` : ''}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedRecommendedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        )}

        {(selectedMood || selectedGenre) && displayedRecommendedMovies.length > 0 && (
          <div className="mb-8 rounded-4xl border border-yellow-500 bg-slate-950/80 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">
              Top 3 {selectedLabel ? `${selectedLabel} picks` : 'recommended picks'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedRecommendedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        )}

        {(selectedMood || selectedGenre) && (
          <div className="mb-8 rounded-4xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">All related {contentType === 'tv' ? 'series' : contentType === 'all' ? 'movies and series' : 'movies'} for {selectedLabel}</h3>
                <p className="mt-2 text-sm text-slate-400">Browse every {contentType === 'tv' ? 'series' : contentType === 'all' ? 'movie or series' : 'movie'} matching this mood or genre.</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              {relatedMovies.length > 0 ? (
                relatedMovies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
              ) : (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">No movies found for this selection yet.</div>
              )}
            </div>
          </div>
        )}

        <main id="discover" className="space-y-8">
          {!selectedMood && !selectedGenre && !isSearching && (
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <SectionBlock title={contentType === 'tv' ? 'Trending Series' : contentType === 'all' ? 'Trending Movies & Series' : 'Trending Movies'} subtitle="Popular picks people are watching now">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingMovies.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              </SectionBlock>
              <SectionBlock title={contentType === 'tv' ? 'Top Rated Series' : contentType === 'all' ? 'Top Rated Movies & Series' : 'Top Rated Movies'} subtitle="Critically acclaimed picks with strong reviews">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topRatedMovies.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              </SectionBlock>
            </div>
          )}


          {surpriseMovie && (
          <div id="surprise" className="mb-8 rounded-4xl border border-violet-500 bg-slate-950/80 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-violet-300 mb-3">Movie Night Pick</h2>
            <p className="text-sm text-slate-400 mb-4">
              A surprise pick based on your current browsing mood and recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
              <div>
                {surpriseMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${surpriseMovie.poster_path}`}
                    alt={getDisplayTitle(surpriseMovie)}
                    className="w-full rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-3xl bg-slate-800 text-slate-400 p-8">No image available</div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{getDisplayTitle(surpriseMovie)}</h3>
                <p className="text-sm text-slate-400 mt-2">{surpriseMovie.overview || 'No overview available.'}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                  <span className="rounded-full bg-slate-800 px-3 py-1">{getDisplayDate(surpriseMovie)}</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1">{surpriseMovie.vote_average}/10</span>
                  {surpriseMovie.genre_ids?.length > 0 && (
                    <span className="rounded-full bg-slate-800 px-3 py-1">{getGenreNames(surpriseMovie.genre_ids)}</span>
                  )}
                </div>
                <div className="mt-6 rounded-3xl bg-slate-900 p-4">
                  <h4 className="text-lg font-semibold text-violet-200 mb-3">Watch Trailers</h4>
                  {surpriseLoading ? (
                    <p className="text-sm text-slate-400">Loading trailers and availability...</p>
                  ) : surpriseTrailers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                      {surpriseTrailers.map((trailer) => (
                        <div key={trailer.key} className="rounded-3xl bg-slate-950 overflow-hidden">
                          <iframe
                            className="h-40 w-full"
                            src={`https://www.youtube.com/embed/${trailer.key}`}
                            title={trailer.name}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          <div className="p-3 text-xs text-slate-200">
                            <p className="font-semibold">{trailer.name}</p>
                            <p>{trailer.type}{trailer.official ? ' • Official' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No trailers available right now.</p>
                  )}
                </div>
                <div className="mt-6 rounded-3xl bg-slate-900 p-4">
                  <h4 className="text-lg font-semibold text-violet-200 mb-3">Where to watch</h4>
                  {renderProviderSection(surpriseMovie)}
                </div>
                {pairedMovies.length > 0 && (
                  <div className="mt-6 rounded-3xl bg-slate-900 p-4">
                    <h4 className="text-lg font-semibold text-violet-200 mb-3">Perfect Pairings</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {pairedMovies.map((movie) => (
                        <div key={movie.id} className="rounded-3xl bg-slate-950 p-4">
                          <p className="font-semibold text-slate-100">{getDisplayTitle(movie)}</p>
                          <p className="text-xs text-slate-400 mt-1">Rating: {movie.vote_average}/10</p>
                          <p className="text-xs text-slate-500 mt-2">{movie.overview?.slice(0, 120) || 'No overview available.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {watchlist.length > 0 && (
          <div id="watchlist" className="mb-8 max-w-7xl mx-auto rounded-4xl border border-cyan-500 bg-slate-950/80 p-6 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-cyan-300">My Watchlist</h2>
                <p className="text-sm text-gray-400">Saved movies and personal notes are stored in your browser.</p>
              </div>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">Saved movies: {watchlist.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {watchlist.map((movie) => (
                <div key={movie.id} className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
                  <div className="flex gap-4 items-start">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                        alt={movie.title}
                        className="w-24 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">No image</div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{movie.title}</h3>
                      <p className="text-xs text-gray-400">Rating: {movie.vote_average}/10</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => updateMovieNote(movie.id, 'rating', value)}
                          className={`text-xl ${movieNotes[movie.id]?.rating >= value ? 'opacity-100' : 'opacity-40'} hover:opacity-100 transition-opacity`}
                          aria-label={`Rate ${value} stars`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows="3"
                      placeholder="Your note about this movie..."
                      value={movieNotes[movie.id]?.note || ''}
                      onChange={(e) => updateMovieNote(movie.id, 'note', e.target.value)}
                      className="mt-4 w-full resize-none rounded-3xl bg-zinc-900 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(movie.id)}
                    className="mt-4 w-full rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-500"
                  >
                    Remove from Watchlist
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAllMovies && !selectedMood && !selectedGenre && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {compareMovies.length > 0 && (
          <div id="compare" className="mt-10 rounded-4xl border border-indigo-500 bg-slate-950/80 p-6 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-indigo-300">Compare Movies</h2>
                <p className="text-sm text-gray-400">Compare selected titles side-by-side.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {compareMovies.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => removeFromCompare(movie.id)}
                    className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                  >
                    Remove: {movie.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto rounded-3xl bg-slate-900 p-4">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-slate-300">Feature</th>
                    {compareMovies.map((movie) => (
                      <th key={movie.id} className={`py-3 px-4 text-slate-300 ${movie.id === recommendedCompareMovieId ? 'bg-slate-800' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{movie.title}</span>
                          {movie.id === recommendedCompareMovieId && (
                            <span className="rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-slate-950">Best Pick</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-300">Release</td>
                    {compareMovies.map((movie) => (
                      <td key={`${movie.id}-release`} className="py-3 px-4">{movie.release_date || 'N/A'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-300">Rating</td>
                    {compareMovies.map((movie) => (
                      <td key={`${movie.id}-rating`} className="py-3 px-4">{movie.vote_average}/10</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-300">Votes</td>
                    {compareMovies.map((movie) => (
                      <td key={`${movie.id}-votes`} className="py-3 px-4">{movie.vote_count}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-300">Genres</td>
                    {compareMovies.map((movie) => (
                      <td key={`${movie.id}-genres`} className="py-3 px-4">{getGenreNames(movie.genre_ids)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-300">Overview</td>
                    {compareMovies.map((movie) => (
                      <td key={`${movie.id}-overview`} className="py-3 px-4">{movie.overview || 'No overview available.'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-6 mt-10">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-6 py-2 rounded-3xl bg-gray-700 text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            className="px-6 py-2 rounded-3xl bg-red-600 text-sm hover:bg-red-500"
          >
            Next
          </button>
        </div>
      </main>

      <footer className="mt-12 rounded-4xl border border-slate-800 bg-slate-950/70 px-6 py-6 text-center text-slate-400 shadow-xl">
        <p className="text-sm">Movie Explorer is built for fast browsing, smart recommendations, and a beautiful movie-watching planning experience.</p>
      </footer>
      </div>

      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-4xl bg-slate-950 shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-700 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">Trailer Preview</h3>
                <p className="text-sm text-slate-400">{trailerInfo.title}</p>
              </div>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="rounded-3xl bg-slate-800 px-5 py-3 text-sm text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            {loadingTrailer ? (
              <div className="p-10 text-center text-white">Loading trailer...</div>
            ) : trailerInfo.videoKey ? (
              <div className="relative" style={{ paddingTop: '56.25%' }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${trailerInfo.videoKey}`}
                  title={trailerInfo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-10 text-center text-slate-200">Trailer is not available for this movie.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
