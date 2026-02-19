import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useItems } from "../hooks/useItems";
import {
  Upload,
  X,
  ArrowLeft,
  Loader2,
  DollarSign,
  Tag,
  Type,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Shared categories matching Marketplace (excluding 'All')
const POST_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Stationery",
  "Dorm Needs",
  "Clothing",
  "Sports",
  "Other",
];

export default function SellItem() {
  const navigate = useNavigate();
  const { createItem } = useItems();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "Textbooks",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please upload an image of your item");
      return;
    }

    setLoading(true);
    try {
      await createItem(formData, imageFile);
      toast.success("Item listed successfully!");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to list item: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-12">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft
              size={20}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            Back
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Sell an Item
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            List your item for sale in the campus marketplace.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Item Photo <span className="text-red-500">*</span>
              </label>

              {imagePreview ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-all transform hover:scale-110 shadow-lg"
                      title="Remove image"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-all bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer">
                    <div className="space-y-2 text-center">
                      <div className="mx-auto h-16 w-16 text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleImageChange}
                            accept="image/*"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              {/* Title */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Title
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type
                      size={18}
                      className="text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="What are you selling?"
                    value={formData.title}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Price (LKR)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign
                      size={18}
                      className="text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                    />
                  </div>
                  <input
                    type="number"
                    name="price"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Category
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag
                      size={18}
                      className="text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                    />
                  </div>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all cursor-pointer"
                  >
                    {POST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  required
                  placeholder="Describe the condition, features, and reason for selling..."
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all active:scale-[0.98] hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Listing Item...
                  </>
                ) : (
                  "List Item"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
