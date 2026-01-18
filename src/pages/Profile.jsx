import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth.jsx";
import { useItems } from "../hooks/useItems";
import { supabase } from "../services/supabaseClient";
import { LogOut, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { fetchUserItems, deleteItem, updateItem } = useItems(); // Import from hook
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'delete' | 'status' | 'success'
    item: null,
    newStatus: null,
    title: "",
    message: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myItems, setMyItems] = useState([]); // State for user's items
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'listings'
  const [profile, setProfile] = useState({
    name: "",
    student_id: "",
    batch: "",
    email: "",
    avatar_url: null,
  });

  useEffect(() => {
    if (user) {
      getProfile();
      getMyItems();
    }
  }, [user]);

  const getMyItems = async () => {
    if (!user) return;
    const data = await fetchUserItems(user.id);
    setMyItems(data);
  };

  const openActionModal = (
    type,
    item = null,
    newStatus = null,
    customDetails = {}
  ) => {
    setActionModal({
      isOpen: true,
      type,
      item,
      newStatus,
      title: customDetails.title || "",
      message: customDetails.message || "",
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      type: null,
      item: null,
      newStatus: null,
      title: "",
      message: "",
    });
  };

  const handleConfirmAction = async () => {
    const { type, item, newStatus } = actionModal;
    if (!item) return;

    try {
      if (type === "status") {
        await updateItem(item.id, { status: newStatus });
        // Update local state
        setMyItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
        );
      } else if (type === "delete") {
        await deleteItem(item.id, item.image_url);
        setMyItems((prev) => prev.filter((i) => i.id !== item.id));
      }
      closeActionModal();
    } catch (e) {
      alert("Error: " + e.message);
      closeActionModal();
    }
  };

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error(error);
      }

      if (data) {
        setProfile({
          name: data.name || "",
          student_id: data.student_id || "",
          batch: data.batch || "",
          email: user.email,
          avatar_url: data.avatar_url,
        });
      } else {
        setProfile((prev) => ({ ...prev, email: user.email }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Limit file size to 2MB as requested
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image size must be less than 2MB");
      }

      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: publicUrl });

      const updates = {
        id: user.id,
        name: profile.name || "Unknown User",
        student_id: profile.student_id || "Pending",
        batch: profile.batch || "Pending",
        email: user.email,
        avatar_url: publicUrl,
        updated_at: new Date(),
      };

      let { error: updateError } = await supabase
        .from("profiles")
        .upsert(updates);
      if (updateError) throw updateError;

      alert("Avatar uploaded!");
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updates = {
        id: user.id,
        name: profile.name,
        student_id: profile.student_id,
        batch: profile.batch,
        email: user.email,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      openActionModal("success", null, null, {
        title: "Profile Saved",
        message: "Your profile details have been updated successfully.",
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-16 sm:pb-0">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
              activeTab === "listings"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            My Listings
          </button>
        </div>

        {loading ? (
          <p className="dark:text-gray-300">Loading...</p>
        ) : (
          <>
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6 max-w-2xl mx-auto">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-indigo-100 dark:border-gray-600">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <span className="text-4xl text-indigo-300">USER</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      {uploading ? "Uploading..." : "Change Photo"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={uploading}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      Max size 2MB
                    </p>
                  </div>
                </div>

                <form onSubmit={updateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email (Read Only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile.email}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 shadow-sm border p-2 text-gray-500 dark:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={profile.student_id}
                      onChange={(e) =>
                        setProfile({ ...profile, student_id: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Batch / Year
                    </label>
                    <input
                      type="text"
                      value={profile.batch}
                      onChange={(e) =>
                        setProfile({ ...profile, batch: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Save Profile"}
                  </button>
                  <br></br>
                  <hr className="border-gray-200 dark:border-gray-700 my-6" />

                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-orange-800 py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Log Out
                  </button>

                  <div className="mt-10 pt-6 border-t border-red-200 dark:border-red-900/30">
                    <h3 className="text-lg font-medium text-red-600 mb-4">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                    <Link
                      to="/delete-account"
                      className="flex w-full justify-center rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 py-3 px-4 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete Account
                    </Link>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "listings" && (
              <div>
                {myItems.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <p className="text-gray-500 dark:text-gray-400">
                      You haven't listed any items yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                    {myItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
                      >
                        <div className="aspect-h-4 aspect-w-3 bg-gray-200 dark:bg-gray-700 sm:aspect-none h-48 relative">
                          <img
                            src={
                              item.image_url ||
                              "https://via.placeholder.com/400x400?text=No+Image"
                            }
                            alt={item.title}
                            className={`h-full w-full object-cover object-center ${
                              item.status === "sold"
                                ? "opacity-50 grayscale"
                                : ""
                            }`}
                          />
                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shadow-sm
                                                ${
                                                  item.status === "available"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : item.status === "sold"
                                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col space-y-2 p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            LKR {item.price}
                          </p>

                          {/* Actions */}
                          <div className="mt-4 flex flex-col space-y-2">
                            {item.status === "available" ? (
                              <button
                                onClick={() =>
                                  openActionModal("status", item, "sold")
                                }
                                className="w-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 py-2 px-4 rounded text-xs font-semibold"
                              >
                                Mark as Sold
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openActionModal("status", item, "available")
                                }
                                className="w-full bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 py-2 px-4 rounded text-xs font-semibold"
                              >
                                Mark as Available
                              </button>
                            )}

                            <button
                              onClick={() => openActionModal("delete", item)}
                              className="w-full bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 py-2 px-4 rounded text-xs font-semibold"
                            >
                              Delete Listing
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div
              className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                actionModal.type === "delete"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : actionModal.type === "success"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-indigo-100 dark:bg-indigo-900/30"
              }`}
            >
              {actionModal.type === "delete" ? (
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : actionModal.type === "success" ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {actionModal.type === "success"
                ? actionModal.title
                : actionModal.type === "delete"
                ? "Delete Listing"
                : "Update Status"}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-2">
              {actionModal.type === "success"
                ? actionModal.message
                : actionModal.type === "delete"
                ? `Are you surely want to delete "${actionModal.item?.title}"? This action cannot be undone.`
                : `Mark "${actionModal.item?.title}" as ${actionModal.newStatus}?`}
            </p>

            <div className="flex gap-3">
              {actionModal.type !== "success" && (
                <button
                  onClick={closeActionModal}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={
                  actionModal.type === "success"
                    ? closeActionModal
                    : handleConfirmAction
                }
                className={`flex-1 py-2.5 px-4 text-white rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-[1.02] ${
                  actionModal.type === "delete"
                    ? "bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
                }`}
              >
                {actionModal.type === "success" ? "OK" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Sign Out
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutModal(false);
                  await logout();
                  navigate("/login");
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all hover:scale-[1.02]"
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
