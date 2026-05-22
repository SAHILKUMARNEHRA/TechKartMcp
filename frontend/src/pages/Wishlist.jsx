import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton.jsx';

export default function Wishlist() {
  const { user } = useAuth();
  const { items, loading } = useWishlist();

  if (!user) {
    return (
      <div className="bg-bg min-h-screen page-fade">
        <div className="container-page py-20 text-center flex flex-col items-center gap-4">
          <Heart size={40} className="text-faint" strokeWidth={1.5} />
          <h1 className="!text-3xl">Save what you love.</h1>
          <p className="text-muted max-w-md">
            Sign in to start building your wishlist.
          </p>
          <Link to="/login" className="glass-button-primary mt-2">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen page-fade">
      <div className="container-page py-12">
        <span className="eyebrow">{items.length} saved</span>
        <h1 className="mt-2 mb-8">Your wishlist.</h1>

        {loading ? (
          <ProductGridSkeleton />
        ) : items.length === 0 ? (
          <div className="border border-dashed border-line rounded-2xl p-20 text-center flex flex-col items-center gap-4">
            <Heart size={36} className="text-faint" strokeWidth={1.5} />
            <h2 className="!text-xl">Nothing here yet.</h2>
            <p className="text-muted max-w-sm">
              Tap the heart on any product to save it for later.
            </p>
            <Link to="/products" className="glass-button-primary mt-2">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((it, i) => (
              <ProductCard key={it.id} product={it.product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
