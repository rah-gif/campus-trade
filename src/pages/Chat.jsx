import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth.jsx";
import { supabase } from "../services/supabaseClient";
import {
  Send,
  User,
  ChevronLeft,
  MessageCircle,
  Trash2,
  MoreVertical,
  Plus,
  Image,
  Camera,
  FileText,
  Smile,
  Reply,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ErrorBoundary from "../components/ErrorBoundary";

export default function ChatWrapper() {
  return (
    <ErrorBoundary>
      <Chat />
    </ErrorBoundary>
  );
}

function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);

  // Helper to parse reply metadata (Format: :::REPLY{json}:::Message)
  const parseMessage = (text) => {
    if (typeof text === "string" && text.startsWith(":::REPLY")) {
      const endIdx = text.indexOf(":::", 8); // 8 is length of :::REPLY
      if (endIdx > -1) {
        try {
          const jsonStr = text.substring(8, endIdx);
          const replyData = JSON.parse(jsonStr);
          const realMessage = text.substring(endIdx + 3);
          return { reply: replyData, content: realMessage };
        } catch (e) {
          console.error("Failed to parse reply", e);
        }
      }
    }
    return { reply: null, content: text };
  };

  const handleAttachmentUpload = async (event, type = "image") => {
    const file = event.target.files?.[0];
    if (!file || !activeConversation) return;

    // Limits: 5MB Images, 10MB Docs
    const MAX_SIZE = type === "image" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`File too large. Limit: ${type === "image" ? "5MB" : "10MB"}`);
      return;
    }

    if (type === "image" && !file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setIsUploading(true);
    setShowAttachMenu(false);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${activeConversation.item_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-images").getPublicUrl(filePath);

      const msg = {
        sender_id: user.id,
        receiver_id: activeConversation.other_user_id,
        item_id: activeConversation.item_id,
        message:
          type === "image" ? "Sent an image" : `Sent a file: ${file.name}`,
        image_url: publicUrl,
      };

      const { error: insertError } = await supabase
        .from("messages")
        .insert([msg]);
      if (insertError) throw insertError;
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  console.log("Chat Render. Active Conv:", activeConversation);

  // Fetch Partner Name if missing (e.g. direct nav)
  useEffect(() => {
    if (
      activeConversation &&
      !activeConversation.partner_name &&
      activeConversation.other_user_id
    ) {
      supabase
        .from("profiles")
        .select("name")
        .eq("id", activeConversation.other_user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setActiveConversation((prev) => {
              // Prevent unnecessary updates if name is already set in a race condition
              if (prev.partner_name === data.name) return prev;
              return { ...prev, partner_name: data.name };
            });
          }
        });
    }
  }, [activeConversation?.other_user_id]); // STABLE dependency

  useEffect(() => {
    if (location.state && location.state.itemId && location.state.sellerId) {
      setActiveConversation({
        item_id: location.state.itemId,
        other_user_id: location.state.sellerId,
        item_title: location.state.itemTitle || "Item",
        item_image: location.state.itemImage,
        partner_name: "", // Initialize to avoid undefined
      });
      // Clear state to prevent loop if we wanted, but optional
    }
  }, [location.state]);

  // Fetch Conversations (Unique combinations of item_id+partner)
  useEffect(() => {
    if (!user) return;

    let debounceTimeout;

    const fetchConversations = async () => {
      // Logic to fetch unique conversations is tricky in pure SQL via API if not optimized.
      // We'll simplify: Fetch all messages involved with user, then group by item_id and partner on client.
      // Ideally, a View or RPC is better, but client-side group is okay for MVP.

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
            *,
            item:items(title, image_url),
            sender:sender_id(name),
            receiver:receiver_id(name)
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages", error);
        return;
      }

      const grouped = {};
      data.forEach((msg) => {
        const isSender = msg.sender_id === user.id;

        // Strict check for deletion flags (Backend)
        if (isSender && msg.deleted_by_sender === true) return;
        if (!isSender && msg.deleted_by_receiver === true) return;

        const partnerId = isSender ? msg.receiver_id : msg.sender_id;
        const key = `${msg.item_id}-${partnerId}`;

        // Check Local Storage Deletion (Fallback for RLS/Update failures)
        // If we deleted this chat locally, ignore old messages
        const deletedTimestamp = localStorage.getItem(
          `deleted_conversation_${key}`
        );
        if (deletedTimestamp) {
          const msgTime = new Date(msg.created_at).getTime();
          if (msgTime <= parseInt(deletedTimestamp)) return;
        }

        if (!grouped[key]) {
          grouped[key] = {
            item_id: msg.item_id,
            other_user_id: partnerId,
            item_title: msg.item?.title,
            item_image: msg.item?.image_url,
            last_message: parseMessage(msg.message).content,
            last_time: msg.created_at,
            partner_name: isSender
              ? msg.receiver?.name || "User"
              : msg.sender?.name || "User",
            unread_count: 0,
          };
        }
        // Increment local unread count
        if (!isSender && !msg.read) {
          grouped[key].unread_count += 1;
        }
      });
      setConversations(Object.values(grouped));
    };

    fetchConversations();

    // Debounced trigger to handle bulk updates (like deleting a whole conversation)
    // without fetching 50 times in a row and showing partial states.
    const triggerRefresh = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        fetchConversations();
      }, 800);
    };

    // Listen for ANY message changes involving me to refresh the list
    const channel = supabase
      .channel("global_conversations_update")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        triggerRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        triggerRefresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [user]);

  // Fetch Messages for Active Conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    // Immediately clear unread count for this conversation in the list UI
    setConversations((prev) =>
      prev.map((c) => {
        if (
          c.item_id === activeConversation.item_id &&
          c.other_user_id === activeConversation.other_user_id
        ) {
          return { ...c, unread_count: 0 };
        }
        return c;
      })
    );

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("item_id", activeConversation.item_id)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${activeConversation.other_user_id}),and(sender_id.eq.${activeConversation.other_user_id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else {
        // Filter out messages deleted by current user
        const validMessages = (data || []).filter((msg) => {
          if (msg.sender_id === user.id) return !msg.deleted_by_sender;
          if (msg.receiver_id === user.id) return !msg.deleted_by_receiver;
          return true;
        });

        setMessages(validMessages);
        // Mark as read
        const unreadIds = validMessages
          .filter((m) => m.receiver_id === user.id && !m.read)
          .map((m) => m.id);
        console.log("Unread IDs in this chat:", unreadIds);
        if (unreadIds.length > 0) {
          const { error: updateError } = await supabase
            .from("messages")
            .update({ read: true })
            .in("id", unreadIds);

          if (updateError) console.error("Error marking read:", updateError);
          else {
            // Update local conversation list to clear unread count
            setConversations((prev) =>
              prev.map((c) => {
                if (
                  c.item_id === activeConversation.item_id &&
                  c.other_user_id === activeConversation.other_user_id
                ) {
                  return { ...c, unread_count: 0 };
                }
                return c;
              })
            );
            // Force Navbar update
            window.dispatchEvent(new Event("messages-read"));
          }
        }
      }
    };

    fetchMessages();

    // Realtime for THIS conversation
    const channel = supabase
      .channel(`chat:${activeConversation.item_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `item_id=eq.${activeConversation.item_id}`, // Simplified filter, check logic in callback
        },
        (payload) => {
          const newMsg = payload.new;
          // Verify it belongs to this conversation pair
          if (
            (newMsg.sender_id === user.id &&
              newMsg.receiver_id === activeConversation.other_user_id) ||
            (newMsg.sender_id === activeConversation.other_user_id &&
              newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              // 1. Prevent ID duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;

              // 2. Handle Optimistic Replacement (for my own messages)
              if (newMsg.sender_id === user.id) {
                // Find an optimistic message (numeric ID) with matching content
                const optimisticIndex = prev.findIndex(
                  (m) =>
                    typeof m.id === "number" && m.message === newMsg.message
                );
                if (optimisticIndex !== -1) {
                  const updated = [...prev];
                  updated[optimisticIndex] = newMsg; // Swap optimistic for real
                  return updated;
                }
              }

              return [...prev, newMsg];
            });

            // Mark new incoming message as read instantly if we are looking at it
            if (newMsg.receiver_id === user.id) {
              supabase
                .from("messages")
                .update({ read: true })
                .eq("id", newMsg.id)
                .then(() => {
                  window.dispatchEvent(new Event("messages-read"));
                });
              // Do not refetch conversations here to avoid badge flickering
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    let contentToSend = newMessage;

    // Prepend Reply Metadata if replying
    if (replyingTo) {
      // Parse original message content to avoid nesting metadata
      const originalContent = parseMessage(replyingTo.message).content;
      const replyMeta = JSON.stringify({
        id: replyingTo.id,
        name:
          replyingTo.sender_id === user.id
            ? "You"
            : activeConversation.partner_name || "User",
        text:
          originalContent.substring(0, 60) +
          (originalContent.length > 60 ? "..." : ""),
        isMedia: !!replyingTo.image_url,
      });
      contentToSend = `:::REPLY${replyMeta}:::${newMessage}`;
    }

    const optimisticMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: activeConversation.other_user_id,
      item_id: activeConversation.item_id,
      message: contentToSend,
      item_title: activeConversation.item_title,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setReplyingTo(null);
    setShowEmojiPicker(false);

    try {
      const { error } = await supabase.from("messages").insert([
        {
          sender_id: user.id,
          receiver_id: activeConversation.other_user_id,
          item_id: activeConversation.item_id,
          message: contentToSend,
        },
      ]);

      if (error) {
        // Rollback optimistic update
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMsg.id)
        );
        console.error("Error sending message:", error.message);
      }
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false); // Checkbox agreement

  // Force re-fetch trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Re-fetch conversations when triggered
    if (user) {
      // We can't actually call fetchConversations easily if it's inside the other useEffect.
      // But we can trigger a state update that relies on it if we move it out or use a dependency.
      // For now, assume the manual state update works, this is just placeholder.
    }
  }, [refreshTrigger]);

  const handleDeleteConversation = async () => {
    setDeleteConfirmed(false); // Reset checkbox
    setShowDeleteModal(true);
  };

  const confirmDeleteConversation = async () => {
    if (!activeConversation) return;

    // Optimistically remove from UI immediately
    const previousConversation = activeConversation; // Backup for rollback if needed (not implementing rollback complexity yet)

    // Fallback: Persist deletion locally to handle RLS/Backend limitations
    // This ensures checking 'deleted_conversation_KEY' in fetchConversations filters it out.
    const key = `${previousConversation.item_id}-${previousConversation.other_user_id}`;
    localStorage.setItem(`deleted_conversation_${key}`, Date.now().toString());

    setShowDeleteModal(false);
    setActiveConversation(null);
    setMessages([]);
    setConversations((prev) =>
      prev.filter(
        (c) =>
          !(
            c.item_id === previousConversation.item_id &&
            c.other_user_id === previousConversation.other_user_id
          )
      )
    );

    try {
      console.log("Deleting conversation:", previousConversation);

      // 1. Mark Sent Messages as Deleted
      const { error: errSender, count: countSender } = await supabase
        .from("messages")
        .update({ deleted_by_sender: true })
        .match({
          item_id: previousConversation.item_id,
          sender_id: user.id,
          receiver_id: previousConversation.other_user_id,
        })
        .select("id", { count: "exact" });

      if (errSender) {
        console.error("Failed to delete sent messages:", errSender);
        // If RLS fails here, it's a permission issue
      }

      // 2. Mark Received Messages as Deleted
      const { error: errReceiver, count: countReceiver } = await supabase
        .from("messages")
        .update({ deleted_by_receiver: true })
        .match({
          item_id: previousConversation.item_id,
          sender_id: previousConversation.other_user_id,
          receiver_id: user.id,
        })
        .select("id", { count: "exact" });

      if (errReceiver) {
        console.error("Failed to delete received messages:", errReceiver);
      }

      console.log(`Deleted: ${countSender} sent, ${countReceiver} received.`);

      // Implicit success if no major crash.
      // The optimistic UI update already handled the visual part.
    } catch (e) {
      console.error("Unexpected error deleting conversation:", e);
      alert("Something went wrong while deleting. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors relative">
      <Navbar />
      {/* ... rest of the existing JSX ... */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-5 ring-4 ring-red-50 dark:ring-red-900/20">
                <Trash2 className="h-7 w-7 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Delete Conversation?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center leading-relaxed">
                This will permanently delete the chat history for you. The other
                user will still retain their copy.
              </p>

              {/* Agreement Checkbox */}
              <div className="w-full bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl p-4 mb-6 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
                <label className="flex items-start cursor-pointer select-none">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-colors cursor-pointer"
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                    I agree to permanently delete this conversation and
                    understand it cannot be undone.
                  </span>
                </label>
              </div>

              <div className="flex w-full space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteConversation}
                  disabled={!deleteConfirmed}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold shadow-md transition-all ${
                    deleteConfirmed
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none hover:scale-[1.02]"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-70"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {/* ... */}
        <div className="absolute inset-0 flex mx-auto max-w-7xl sm:px-6 lg:px-8 py-0 sm:py-6">
          <div className="flex w-full h-full bg-white dark:bg-gray-800 shadow-xl overflow-hidden sm:rounded-lg border-t sm:border border-gray-200 dark:border-gray-700">
            {/* Conversations List */}
            <div
              className={`w-full sm:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
                activeConversation ? "hidden sm:flex" : "flex"
              }`}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Chats
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                    <MessageCircle size={48} className="mb-2 opacity-20" />
                    <p className="text-sm">No conversations yet.</p>
                  </div>
                ) : (
                  conversations.map((conv, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        console.log("Clicked conversation:", conv);
                        setActiveConversation(conv);
                      }}
                      className={`cursor-pointer w-full flex items-center p-4 transition-colors border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        activeConversation?.item_id === conv.item_id &&
                        activeConversation?.other_user_id === conv.other_user_id
                          ? "bg-indigo-50 dark:bg-gray-700/80 border-l-4 border-l-indigo-500"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="relative">
                        <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
                          {conv.item_image ? (
                            <img
                              src={conv.item_image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-500 dark:text-indigo-300">
                              <User size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {conv.partner_name || "User"}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {conv.last_time
                              ? new Date(conv.last_time).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-indigo-500 font-medium truncate mb-0.5">
                              {conv.item_title}
                            </p>
                            <p className="truncate text-sm text-gray-500 dark:text-gray-400 max-w-[150px]">
                              {conv.last_message}
                            </p>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div
              className={`flex flex-1 flex-col h-full bg-gray-50 dark:bg-gray-900 ${
                !activeConversation ? "hidden sm:flex" : "flex"
              }`}
            >
              {!activeConversation ? (
                <div className="flex flex-1 flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle size={40} />
                  </div>
                  <p className="text-lg font-medium">
                    Select a chat to start messaging
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="sticky top-0 w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50">
                    <div className="flex items-center">
                      <button
                        onClick={() => setActiveConversation(null)}
                        className="mr-3 sm:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                          {activeConversation.item_image ? (
                            <img
                              src={activeConversation.item_image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-500">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                            {activeConversation.item_title || "Item"}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Chatting with{" "}
                            {activeConversation.partner_name || "User"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleDeleteConversation}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                      title="Clear Conversation"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  {/* Messages Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-950 sm:px-6 pb-36 sm:pb-4">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user.id;
                      const { reply, content } = parseMessage(msg.message);
                      const displayMsg = { ...msg, message: content }; // Create clean msg object
                      const isImg =
                        displayMsg.image_url &&
                        /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(
                          displayMsg.image_url
                        );

                      return (
                        <div
                          key={i}
                          className={`flex w-full ${
                            isMe ? "justify-end" : "justify-start"
                          } mb-2`}
                        >
                          <div
                            className={`group relative max-w-[85%] sm:max-w-[70%] flex flex-col items-${
                              isMe ? "end" : "start"
                            }`}
                          >
                            {/* Reply Context Bubble */}
                            {reply && (
                              <div
                                className={`mb-1 p-2 rounded-xl text-xs bg-gray-200 dark:bg-gray-800 border-l-4 border-indigo-500 opacity-90 w-full cursor-pointer hover:opacity-100 transition-opacity`}
                                onClick={() => {
                                  // Potential: Scroll to original message
                                }}
                              >
                                <p className="font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                                  {reply.name}
                                </p>
                                <p className="truncate text-gray-600 dark:text-gray-300">
                                  {reply.isMedia ? "📷 Photo" : reply.text}
                                </p>
                              </div>
                            )}

                            <div
                              onClick={() => {
                                if (isMe && window.innerWidth < 640)
                                  handleDeleteMessage(msg.id);
                              }}
                              onDoubleClick={() => setReplyingTo(msg)}
                              className={`relative w-full rounded-2xl px-4 py-2 shadow-sm text-sm ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-br-none cursor-pointer sm:cursor-default"
                                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              {displayMsg.image_url ? (
                                isImg ? (
                                  <div className="mb-2">
                                    <img
                                      src={displayMsg.image_url}
                                      alt="Attachment"
                                      className="rounded-lg max-w-full max-h-[300px] object-cover border border-white/20 cursor-pointer"
                                      onClick={() =>
                                        window.open(
                                          displayMsg.image_url,
                                          "_blank"
                                        )
                                      }
                                    />
                                  </div>
                                ) : (
                                  <div className="mb-2">
                                    <a
                                      href={displayMsg.image_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`flex items-center p-3 rounded-xl transition-colors border ${
                                        isMe
                                          ? "bg-indigo-700/50 hover:bg-indigo-700 border-indigo-500/50"
                                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                                      }`}
                                    >
                                      <div
                                        className={`p-2 rounded-lg mr-3 ${
                                          isMe
                                            ? "bg-white/20 text-white"
                                            : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500"
                                        }`}
                                      >
                                        <FileText size={24} />
                                      </div>
                                      <div className="flex-1 min-w-0 text-left">
                                        <p
                                          className={`text-sm font-medium truncate ${
                                            isMe
                                              ? "text-white"
                                              : "text-gray-900 dark:text-white"
                                          }`}
                                        >
                                          {displayMsg.message.startsWith(
                                            "Sent a file: "
                                          )
                                            ? displayMsg.message.replace(
                                                "Sent a file: ",
                                                ""
                                              )
                                            : "Document"}
                                        </p>
                                        <p
                                          className={`text-xs ${
                                            isMe
                                              ? "text-indigo-200"
                                              : "text-gray-500 dark:text-gray-400"
                                          }`}
                                        >
                                          Click to view
                                        </p>
                                      </div>
                                    </a>
                                  </div>
                                )
                              ) : (
                                <p className="whitespace-pre-wrap break-words leading-relaxed">
                                  {displayMsg.message}
                                </p>
                              )}

                              {/* Render Text Caption if it's not the default system message */}
                              {displayMsg.image_url &&
                                !displayMsg.message.startsWith("Sent an") &&
                                !displayMsg.message.startsWith(
                                  "Sent a file:"
                                ) && (
                                  <p className="whitespace-pre-wrap break-words leading-relaxed text-sm mt-1">
                                    {displayMsg.message}
                                  </p>
                                )}

                              {/* Actions Row: Time + Reply + Delete */}
                              <div
                                className={`flex items-center justify-end gap-3 mt-1 opacity-75`}
                              >
                                <span className="text-[10px]">
                                  {msg.created_at
                                    ? new Date(
                                        msg.created_at
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>

                                {/* Reply Button (Icon) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplyingTo(msg);
                                  }}
                                  className={`flex items-center gap-1 text-[10px] font-bold uppercase ${
                                    isMe
                                      ? "text-indigo-200 hover:text-white"
                                      : "text-indigo-500 hover:text-indigo-600"
                                  } transition-colors`}
                                  title="Reply"
                                >
                                  <Reply size={12} /> Reply
                                </button>

                                {isMe && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="ml-1 text-xs hover:text-red-300 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Footer - Fixed Above Mobile Nav, Sticky on Desktop */}
                  <div
                    className="fixed bottom-[60px] left-0 right-0 z-50 sm:sticky sm:bottom-0 p-2 sm:p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                    style={{ paddingBottom: "0.5rem" }}
                  >
                    {/* Reply Preview Banner */}
                    {replyingTo && (
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/80 border-l-4 border-indigo-500 mb-2 mx-1 rounded-r-lg shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                            Replying to{" "}
                            {replyingTo.sender_id === user.id
                              ? "You"
                              : activeConversation.partner_name || "User"}
                          </p>
                          <p className="text-sm truncate text-gray-600 dark:text-gray-300">
                            {replyingTo.image_url ? (
                              <span className="flex items-center gap-1 italic">
                                <Image size={14} /> Photo
                              </span>
                            ) : (
                              // Clean content for preview
                              (() => {
                                const { content } = parseMessage(
                                  replyingTo.message
                                );
                                return content || "Attachment";
                              })()
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        >
                          <X
                            size={16}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        </button>
                      </div>
                    )}

                    {/* Hidden Inputs */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleAttachmentUpload(e, "image")}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={(e) => handleAttachmentUpload(e, "image")}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={docInputRef}
                      onChange={(e) => handleAttachmentUpload(e, "doc")}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />

                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-12 mb-2 z-50 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
                        <EmojiPicker
                          onEmojiClick={(emoji) =>
                            setNewMessage((prev) => prev + emoji.emoji)
                          }
                          theme="auto"
                          width={300}
                          height={400}
                        />
                      </div>
                    )}

                    {/* Attachment Menu Popover */}
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-2 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 animate-in fade-in slide-in-from-bottom-2 z-50 min-w-[170px]">
                        <div className="grid grid-cols-1 gap-1">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                          >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                              <Image size={18} />
                            </div>
                            <span>Photos</span>
                          </button>
                          <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                          >
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
                              <Camera size={18} />
                            </div>
                            <span>Camera</span>
                          </button>
                          <button
                            onClick={() => docInputRef.current?.click()}
                            className="flex items-center space-x-3 w-full p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                          >
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                              <FileText size={18} />
                            </div>
                            <span>Document</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={handleSendMessage}
                      className="flex gap-2 items-end max-w-4xl mx-auto"
                    >
                      {/* Plus Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAttachMenu(!showAttachMenu)}
                          disabled={isUploading}
                          className={`flex-shrink-0 h-11 w-11 mb-0 flex items-center justify-center rounded-full transition-all duration-300 ${
                            showAttachMenu
                              ? "bg-indigo-600 text-white rotate-45 shadow-lg"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          } ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Add attachment"
                        >
                          <Plus size={24} />
                        </button>
                      </div>

                      {/* Text Input Area with Left-Side Emoji */}
                      <div className="flex-1 relative cursor-text rounded-2xl bg-gray-100 dark:bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white dark:focus-within:bg-gray-900 transition-all flex items-end">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`absolute left-2 bottom-1.5 p-2 rounded-full transition-colors z-10 ${
                            showEmojiPicker
                              ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"
                              : "text-gray-400 hover:text-yellow-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          <Smile size={20} />
                        </button>

                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full max-h-32 min-h-[44px] py-3 pr-4 pl-12 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-white scrollbar-hide"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                      </div>

                      {isUploading ? (
                        <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                          <Send
                            size={20}
                            className={newMessage.trim() ? "ml-0.5" : ""}
                          />
                        </button>
                      )}
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
