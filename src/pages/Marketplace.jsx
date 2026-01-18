import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  MessageCircle,
  AlertCircle,
  X,
  User,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Refined Campus Categories
const CATEGORIES = [
  "All",
  "Textbooks",
  "Electronics",
  "Stationery",
  "Dorm Needs",
  "Clothing",
  "Sports",
  "Other",
];
const ITEMS_PER_PAGE = 9; // 3 rows of 3

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'price_asc', 'price_desc'
  const [page, setPage] = useState(0);
  const searchInputRef = useRef(null);

  // Modal State
  const [showEtiquetteModal, setShowEtiquetteModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchItems = useCallback(
    async (isLoadMore = false) => {
      setLoading(true);
      try {
        const currentPage = isLoadMore ? page + 1 : 0;
        const from = currentPage * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
          .from("items")
          .select("*, profiles:user_id (name)")
          .range(from, to);

        // Apply Filters
        if (category !== "All") {
          query = query.eq("category", category);
        }
        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }

        // Apply Sorting
        if (sortBy === "newest") {
          query = query.order("created_at", { ascending: false });
        } else if (sortBy === "price_asc") {
          query = query.order("price", { ascending: true });
        } else if (sortBy === "price_desc") {
          query = query.order("price", { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;

        if (isLoadMore) {
          setItems((prev) => [...prev, ...data]);
          setPage(currentPage);
        } else {
          setItems(data);
          setPage(0);
        }

        setHasMore(data.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Error fetching marketplace items:", error);
      } finally {
        setLoading(false);
      }
    },
    [category, searchQuery, sortBy, page]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(false);
    }, 300); // 300ms debounce for search/filter
    return () => clearTimeout(timeoutId);
  }, [category, searchQuery, sortBy]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleLoadMore = () => {
    fetchItems(true);
  };

  const handleContactClick = (item) => {
    if (!user) {
      setShowGuestModal(true);
      return;
    }
    setSelectedItem(item);
    setShowEtiquetteModal(true);
  };

  const proceedToChat = () => {
    if (!selectedItem) return;
    navigate("/chat", {
      state: {
        itemId: selectedItem.id,
        sellerId: selectedItem.user_id,
        itemTitle: selectedItem.title,
        itemImage: selectedItem.image_url,
      },
    });
    setShowEtiquetteModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-24 sm:pb-0">
      <Navbar />

      {/* Sticky Header with Advanced Layout */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col space-y-3">
            {/* Search & Sort Row - Now on Top for immediate access */}
            <div className="flex items-center justify-between gap-3">
              {/* Search Bar - Expanded on Mobile */}
              <div
                className={`transition-all duration-300 ${
                  isSearchOpen ? "flex-1" : "w-auto"
                }`}
              >
                {isSearchOpen ? (
                  <div className="relative w-full animate-in fade-in slide-in-from-right-4 duration-200">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border-none rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                      className="absolute right-3 top-2.5 text-gray-400"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Search size={20} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown - Always Visible & Compact */}
              {!isSearchOpen && (
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <ArrowDownWideNarrow className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Categories Row - Scrollable Horizontal List */}
            {/* Hide categories during search to save space? No, keep them. */}
            {!isSearchOpen && (
              <div className="w-full overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex space-x-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border 
                                          ${
                                            category === cat
                                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"
                                          }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Items Grid */}
        {items.length === 0 && !loading ? (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-300">
            <p className="text-gray-500 dark:text-gray-400 text-xl">
              No items found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ItemCard
                  item={item}
                  onContact={() => handleContactClick(item)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More / Infinite Scroll Trigger */}
        {items.length > 0 && hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-transform transform hover:scale-105"
            >
              {loading ? "Loading..." : "Load More Items"}
              {!loading && <ArrowDownWideNarrow className="ml-2 h-4 w-4" />}
            </button>
          </div>
        )}

        {loading && items.length === 0 && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Etiquette Modal */}
      {showEtiquetteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 sm:h-16 sm:w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600 dark:text-indigo-400" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                Start a Conversation
              </h3>

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-4 sm:p-5 rounded-2xl w-full mb-5 sm:mb-6 text-left border border-indigo-100 dark:border-indigo-500/20">
                <h4 className="flex items-center text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2 sm:mb-3">
                  <AlertCircle className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Community Guidelines
                </h4>
                <ul className="space-y-2">
                  {[
                    "Be polite and respectful at all times.",
                    "Clarify item details and price beforehand.",
                    "Meet in safe, public places for exchange.",
                    "Avoid sharing unnecessary personal info.",
                  ].map((text, i) => (
                    <li
                      key={i}
                      className="flex items-start text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 mr-2"></span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row w-full gap-3 sm:space-x-3 sm:gap-0">
                <button
                  onClick={() => setShowEtiquetteModal(false)}
                  className="order-2 sm:order-1 flex-1 py-2.5 sm:py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedToChat}
                  className="order-1 sm:order-2 flex-1 py-2.5 sm:py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
                >
                  Agree & Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Login Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Login Required
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You need to sign in with your student account to contact sellers
              and start chatting.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGuestModal(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
