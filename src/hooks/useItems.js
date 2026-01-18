import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profiles:user_id (name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      setError(error.message);
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  const createItem = async (itemData, file) => {
    // 1. Upload image if exists
    let imageUrl = null;
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('items')
        .getPublicUrl(filePath);
      
      imageUrl = publicUrl;
    }

    // 2. Insert item record
    const { data, error } = await supabase
      .from('items')
      .insert([
        { ...itemData, image_url: imageUrl, user_id: (await supabase.auth.getUser()).data.user.id }
      ])
      .select();

    if (error) throw error;
    return data;
  };

  const fetchUserItems = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user items:', error);
      setError(error.message);
    } 
    setLoading(false);
    return data || [];
  };

  const deleteItem = async (itemId, imageUrl) => {
    // 1. Delete image if exists
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      // Need to extract the path correctly. Usually supabase returns full URL.
      // If the file path within bucket is just the filename (as per createItem), we can try deleting it.
      // However, imageUrl might include the bucket path. 
      // createItem uses `const filePath = ${fileName}` (just filename). 
      // getPublicUrl returns `.../object/public/items/filename`.
      // So stripping to filename should work if structure is flat.
      
      const { error: storageError } = await supabase.storage
        .from('items')
        .remove([fileName]);
      
      if (storageError) console.error('Error deleting image:', storageError);
    }

    // 2. Delete item record
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    
    // Refresh items list if we are verifying state locally
    setItems((prev) => prev.filter(i => i.id !== itemId));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const updateItem = async (itemId, updates) => {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', itemId)
      .select();

    if (error) throw error;
    
    // Optimistic or re-fetch
    setItems((prev) => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    return data;
  };

  return { items, loading, error, fetchItems, createItem, fetchUserItems, deleteItem, updateItem };
}
