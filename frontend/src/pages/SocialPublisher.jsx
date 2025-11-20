import React, { useState, useEffect } from "react";
import {
  Camera,
  Send,
  Settings,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  X,
} from "lucide-react";

// const API_URL = "http://localhost:5000/api";
const API_URL = "https://product-12.onrender.com/api";

const apiFetch = async (url, options = {}) => {
  const config = {
    ...options,
    credentials: "include", // Important for CORS with credentials
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // If using ngrok
      ...options.headers,
    },
  };

  return fetch(url, config);
};

export default function SocialPublisher() {
  const [activeTab, setActiveTab] = useState("publish");
  const [platforms, setPlatforms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: "car",
    title: "",
    description: "",
    platform_id: "",
    target_type: "page",
    image: null,
    car_brand: "",
    car_model: "",
    car_year: "",
    car_price: "",
    car_condition: "new",
    car_mileage: "",
    car_transmission: "automatic",
    car_fuel_type: "",
    announcement_type: "",
    event_date: "",
    event_location: "",
    news_source: "",
    news_author: "",
    update_type: "",
    update_priority: "medium",
  });

  const [platformForm, setPlatformForm] = useState({
    name: "",
    page_id: "",
    access_token: "",
    platform_type: "facebook",
  });

  const [editingPlatform, setEditingPlatform] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    console.log("API URL:", API_URL);
    fetchPlatforms();
    fetchPosts();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await apiFetch(`${API_URL}/platforms`);
      const data = await response.json();
      if (data.success) setPlatforms(data.data);
    } catch (error) {
      console.error("Error fetching platforms:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await apiFetch(`${API_URL}/posts`);
      const data = await response.json();
      if (data.success) setPosts(data.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (e) => {
    const { name, value } = e.target;
    setPlatformForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // const handlePublish = async () => {
  //   if (!formData.platform_id) {
  //     alert("Please select a platform");
  //     return;
  //   }
  //   if (!formData.title || !formData.description) {
  //     alert("Please fill in title and description");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const form = new FormData();
  //     Object.keys(formData).forEach((key) => {
  //       if (formData[key] && key !== "image") {
  //         form.append(key, formData[key]);
  //       }
  //     });

  //     if (formData.image) {
  //       form.append("image", formData.image);
  //     }

  //     const response = await fetch(`${API_URL}/posts`, {
  //       method: "POST",
  //       body: form,
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       alert("Post published successfully!");
  //       setFormData({
  //         category: "car",
  //         title: "",
  //         description: "",
  //         platform_id: "",
  //         target_type: "page",
  //         image: null,
  //         car_brand: "",
  //         car_model: "",
  //         car_year: "",
  //         car_price: "",
  //         car_condition: "new",
  //         car_mileage: "",
  //         car_transmission: "automatic",
  //         car_fuel_type: "",
  //         announcement_type: "",
  //         event_date: "",
  //         event_location: "",
  //         news_source: "",
  //         news_author: "",
  //         update_type: "",
  //         update_priority: "medium",
  //       });
  //       setImagePreview(null);
  //       fetchPosts();
  //     } else {
  //       alert("Error: " + data.error);
  //     }
  //   } catch (error) {
  //     let errorMsg = error.message;
  //     if (errorMsg.includes("Facebook API Error")) {
  //       errorMsg = `Facebook posting failed: ${errorMsg}`;
  //     }
  //     alert("Error publishing post: " + errorMsg);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePublish = async () => {
    if (!formData.platform_id) {
      alert("Please select a platform");
      return;
    }
    if (!formData.title || !formData.description) {
      alert("Please fill in title and description");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] && key !== "image") {
          form.append(key, formData[key]);
        }
      });

      if (formData.image) {
        form.append("image", formData.image);
      }

      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (data.success) {
        alert("Post published successfully!");
        setFormData({
          category: "car",
          title: "",
          description: "",
          platform_id: "",
          target_type: "page",
          image: null,
          car_brand: "",
          car_model: "",
          car_year: "",
          car_price: "",
          car_condition: "new",
          car_mileage: "",
          car_transmission: "automatic",
          car_fuel_type: "",
          announcement_type: "",
          event_date: "",
          event_location: "",
          news_source: "",
          news_author: "",
          update_type: "",
          update_priority: "medium",
        });
        setImagePreview(null);
        fetchPosts();
      } else {
        // ✅ ADDED: Handle duplicate image error
        if (data.error === "Duplicate image detected" && data.duplicate_info) {
          alert(
            `❌ Duplicate image detected!\n\nThis image was already posted as: "${
              data.duplicate_info.title
            }"\nPosted on: ${new Date(
              data.duplicate_info.posted_at
            ).toLocaleString()}\n\nPlease use a different image.`
          );
        } else {
          alert("Error: " + data.error);
        }
      }
    } catch (error) {
      let errorMsg = error.message;
      if (errorMsg.includes("Facebook API Error")) {
        errorMsg = `Facebook posting failed: ${errorMsg}`;
      }
      alert("Error publishing post: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const handleAddPlatform = async () => {
    if (
      !platformForm.name ||
      !platformForm.page_id ||
      !platformForm.access_token
    ) {
      alert("Please fill all platform fields");
      return;
    }

    try {
      const url = editingPlatform
        ? `${API_URL}/platforms/${editingPlatform.id}`
        : `${API_URL}/platforms`;

      const response = await apiFetch(url, {
        method: editingPlatform ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(platformForm),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingPlatform ? "Platform updated!" : "Platform added!");
        setPlatformForm({
          name: "",
          page_id: "",
          access_token: "",
          platform_type: "facebook",
        });
        setEditingPlatform(null);
        fetchPlatforms();
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleEditPlatform = (platform) => {
    setPlatformForm({
      name: platform.name,
      page_id: platform.page_id,
      access_token: platform.access_token,
      platform_type: platform.platform_type,
    });
    setEditingPlatform(platform);
  };

  const handleDeletePlatform = async (id) => {
    if (!window.confirm("Delete this platform?")) return;

    try {
      const response = await fetch(`${API_URL}/platforms/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        alert("Platform deleted!");
        fetchPlatforms();
        fetchPosts();
        fetchPosts();
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Send className="w-8 h-8" />
              Social Media Publisher
            </h1>
            <p className="mt-2 text-blue-100">
              Publish content directly to your social platforms
            </p>
          </div>

          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab("publish")}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === "publish"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Send className="w-5 h-5 inline mr-2" />
              Publish Content
            </button>
            <button
              onClick={() => setActiveTab("platforms")}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === "platforms"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" />
              Platforms
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === "history"
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Clock className="w-5 h-5 inline mr-2" />
              History
            </button>
          </div>

          <div className="p-8">
            {activeTab === "publish" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="car">🚗 Car</option>
                      <option value="announcement">📢 Announcement</option>
                      <option value="news">📰 News</option>
                      <option value="update">🔔 Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Platform *
                    </label>
                    <select
                      name="platform_id"
                      value={formData.platform_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select Platform</option>
                      {platforms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.platform_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Type *
                    </label>
                    <select
                      name="target_type"
                      value={formData.target_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="page">📄 Page</option>
                      <option value="user">👤 User Profile</option>
                      <option value="story">📝 Story</option>
                    </select>
                    <div className="mt-1 text-xs text-gray-500">
                      {formData.target_type === "story" &&
                        "📱 Story: Image will be posted as a 24-hour story"}
                      {formData.target_type === "page" &&
                        "📄 Page Feed: Post appears on your page timeline"}
                      {formData.target_type === "user" &&
                        "❌ User Profile: Not supported by Facebook API"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a catchy title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write your post description..."
                  />
                </div>

                {/* CAR FIELDS */}
                {formData.category === "car" && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                    <h4 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
                      🚗 Car Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          name="car_brand"
                          value={formData.car_brand}
                          onChange={handleInputChange}
                          placeholder="e.g., Toyota"
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          name="car_model"
                          value={formData.car_model}
                          onChange={handleInputChange}
                          placeholder="e.g., Camry"
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          name="car_year"
                          value={formData.car_year}
                          onChange={handleInputChange}
                          placeholder="e.g., 2024"
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          name="car_price"
                          value={formData.car_price}
                          onChange={handleInputChange}
                          placeholder="e.g., 25000"
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Condition
                        </label>
                        <select
                          name="car_condition"
                          value={formData.car_condition}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="new">New</option>
                          <option value="used">Used</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Mileage
                        </label>
                        <input
                          type="text"
                          name="car_mileage"
                          value={formData.car_mileage}
                          onChange={handleInputChange}
                          placeholder="e.g., 50000 km"
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Transmission
                        </label>
                        <select
                          name="car_transmission"
                          value={formData.car_transmission}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="automatic">Automatic</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Fuel Type
                        </label>
                        <input
                          type="text"
                          name="car_fuel_type"
                          value={formData.car_fuel_type}
                          onChange={handleInputChange}
                          placeholder="e.g., Petrol, Diesel, Electric"
                          className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ANNOUNCEMENT FIELDS */}
                {formData.category === "announcement" && (
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 text-xl mb-4 flex items-center gap-2">
                      📢 Announcement Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-1">
                          Announcement Type
                        </label>
                        <input
                          type="text"
                          name="announcement_type"
                          value={formData.announcement_type}
                          onChange={handleInputChange}
                          placeholder="e.g., Product Launch, Event"
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-900 mb-1">
                          Event Date
                        </label>
                        <input
                          type="date"
                          name="event_date"
                          value={formData.event_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-purple-900 mb-1">
                          Event Location
                        </label>
                        <input
                          type="text"
                          name="event_location"
                          value={formData.event_location}
                          onChange={handleInputChange}
                          placeholder="e.g., Convention Center, New York"
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* NEWS FIELDS */}
                {formData.category === "news" && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
                    <h4 className="font-bold text-green-900 text-xl mb-4 flex items-center gap-2">
                      📰 News Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          News Source
                        </label>
                        <input
                          type="text"
                          name="news_source"
                          value={formData.news_source}
                          onChange={handleInputChange}
                          placeholder="e.g., Reuters, BBC, CNN"
                          className="w-full px-4 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">
                          Author Name
                        </label>
                        <input
                          type="text"
                          name="news_author"
                          value={formData.news_author}
                          onChange={handleInputChange}
                          placeholder="e.g., John Smith"
                          className="w-full px-4 py-2 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPDATE FIELDS */}
                {formData.category === "update" && (
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200">
                    <h4 className="font-bold text-orange-900 text-xl mb-4 flex items-center gap-2">
                      🔔 Update Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-orange-900 mb-1">
                          Update Type
                        </label>
                        <input
                          type="text"
                          name="update_type"
                          value={formData.update_type}
                          onChange={handleInputChange}
                          placeholder="e.g., System Update, Policy Change"
                          className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-orange-900 mb-1">
                          Priority Level
                        </label>
                        <select
                          name="update_priority"
                          value={formData.update_priority}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">🔥 Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* IMAGE UPLOAD */}
                <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📸 Upload Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-white">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full max-h-80 rounded-lg shadow-xl"
                        />
                        <button
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((prev) => ({ ...prev, image: null }));
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-100 p-4 rounded-full mb-4">
                            <Upload className="w-12 h-12 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-semibold text-lg">
                            Click to upload image
                          </span>
                          <span className="text-sm text-gray-500 mt-2">
                            PNG, JPG, GIF up to 10MB
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* PUBLISH BUTTON */}
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
                >
                  {loading ? (
                    <>
                      <Clock className="w-6 h-6 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Publish to Platform Now
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === "platforms" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-6 h-6" />
                    {editingPlatform ? "Edit Platform" : "Add New Platform"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="name"
                      value={platformForm.name}
                      onChange={handlePlatformChange}
                      placeholder="Platform Name (e.g., My Business Page)"
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                      name="platform_type"
                      value={platformForm.platform_type}
                      onChange={handlePlatformChange}
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>

                    <input
                      type="text"
                      name="page_id"
                      value={platformForm.page_id}
                      onChange={handlePlatformChange}
                      placeholder="Page/User ID"
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="password"
                      name="access_token"
                      value={platformForm.access_token}
                      onChange={handlePlatformChange}
                      placeholder="Access Token"
                      className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={handleAddPlatform}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {editingPlatform ? "Update" : "Add Platform"}
                    </button>

                    {editingPlatform && (
                      <button
                        onClick={() => {
                          setEditingPlatform(null);
                          setPlatformForm({
                            name: "",
                            page_id: "",
                            access_token: "",
                            platform_type: "facebook",
                          });
                        }}
                        className="px-8 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    Connected Platforms
                  </h3>
                  {platforms.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Settings className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No platforms added yet
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Add your first platform above to start publishing
                      </p>
                    </div>
                  ) : (
                    platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-5 flex items-center justify-between hover:shadow-lg transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">
                            {platform.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                              {platform.platform_type}
                            </span>
                            <span className="ml-3 text-gray-500">
                              ID: {platform.page_id}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPlatform(platform)}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Platform"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlatform(platform.id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Platform"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Publishing History
                </h3>
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No posts published yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your published content will appear here
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-bold">
                              {post.category}
                            </span>
                            <span className="text-gray-600 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                              {post.platform_name} ({post.platform_type})
                            </span>
                            <span className="text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-full">
                              {post.target_type}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-xl mb-2">
                            {post.title}
                          </h4>
                          <p className="text-gray-700 mb-3">
                            {post.description}
                          </p>

                          {post.category === "car" &&
                            (post.car_brand || post.car_model) && (
                              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                <p className="text-sm text-blue-900">
                                  <strong>Car:</strong> {post.car_brand}{" "}
                                  {post.car_model} {post.car_year}
                                  {post.car_price && ` - ${post.car_price}`}
                                </p>
                              </div>
                            )}

                          {post.category === "announcement" &&
                            post.event_date && (
                              <div className="bg-purple-50 p-3 rounded-lg mb-3">
                                <p className="text-sm text-purple-900">
                                  <strong>Event:</strong> {post.event_date}{" "}
                                  {post.event_location &&
                                    `at ${post.event_location}`}
                                </p>
                              </div>
                            )}

                          {post.category === "news" && post.news_source && (
                            <div className="bg-green-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-green-900">
                                <strong>Source:</strong> {post.news_source}{" "}
                                {post.news_author && `by ${post.news_author}`}
                              </p>
                            </div>
                          )}

                          {post.category === "update" &&
                            post.update_priority && (
                              <div className="bg-orange-50 p-3 rounded-lg mb-3">
                                <p className="text-sm text-orange-900">
                                  <strong>Priority:</strong>{" "}
                                  {post.update_priority.toUpperCase()}
                                  {post.update_type && ` - ${post.update_type}`}
                                </p>
                              </div>
                            )}

                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-48 h-48 object-cover rounded-lg shadow-md mb-3"
                            />
                          )}
                          <p className="text-xs text-gray-400">
                            📅 {new Date(post.created_at).toLocaleString()}
                          </p>
                          {post.error_message && (
                            <div className="mt-3 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-700 font-medium">
                                ❌ Error: {post.error_message}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-2 ml-4">
                          {getStatusIcon(post.status)}
                          <span className="text-sm font-bold text-gray-700 capitalize">
                            {post.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
