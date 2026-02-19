import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ItemCard({ item, onContact }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleContactSeller = (item) => {
    if (onContact) {
        onContact(item);
        return;
    }
    // Fallback default behavior
    if (!user) {
      if (confirm("You must be logged in to contact the seller. Go to login?")) {
        navigate('/login');
      }
      return;
    }
    navigate('/chat', { state: { itemId: item.id, sellerId: item.user_id, itemTitle: item.title, itemImage: item.image_url } });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
      <div className="aspect-h-4 aspect-w-3 bg-gray-200 dark:bg-gray-700 sm:aspect-none group-hover:opacity-75 sm:h-96 relative">
        <img
          src={item.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
          alt={item.title}
          className="h-full w-full object-cover object-center sm:h-full sm:w-full"
        />
        {item.status === 'sold' && (
             <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase">
                 SOLD
             </div>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-1.5 p-3 sm:p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
          <Link to={`/item/${item.id}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {item.title}
          </Link>
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">{item.description}</p>
        <div className="flex flex-1 flex-col justify-end">
          <p className="text-xs italic text-gray-500 dark:text-gray-400 mb-1">{item.category}</p>
          <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">LKR {item.price}</p>
        </div>
        <div className="mt-3 sm:mt-4">
             {item.status !== 'sold' ? (
                 user?.id === item.user_id ? (
                     <div className="relative z-10 flex w-full items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400 cursor-default">
                         Your Listing
                     </div>
                 ) : (
                     <button 
                        onClick={() => handleContactSeller(item)}
                        className="relative z-10 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                     >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4"/> Contact
                     </button>
                 )
             ) : (
                 <div className="relative z-10 flex w-full items-center justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed">
                     Item Sold
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}
