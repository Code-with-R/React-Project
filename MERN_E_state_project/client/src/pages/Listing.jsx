import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Listing() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadListing = async () => {
      try {
        const response = await fetch(`/api/listing/get/${listingId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load listing.');
        }

        setListing(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  if (loading) {
    return <p className='p-6 text-center'>Loading listing...</p>;
  }

  if (error) {
    return <p className='p-6 text-center text-red-700'>{error}</p>;
  }

  return (
    <main className='max-w-5xl mx-auto p-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {listing.imageUrls.map((imageUrl, index) => (
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`${listing.name} ${index + 1}`}
            className='w-full h-72 object-cover rounded-lg'
          />
        ))}
      </div>
      <section className='mt-6 flex flex-col gap-3'>
        <h1 className='text-3xl font-semibold'>{listing.name}</h1>
        <p className='text-slate-600'>{listing.address}</p>
        <p>{listing.description}</p>
        <p className='font-semibold'>
          ₹{(listing.offer ? listing.discountPrice : listing.regularPrice).toLocaleString()}
          {listing.type === 'rent' ? ' / month' : ''}
        </p>
        <p>
          {listing.bedrooms} bed · {listing.bathrooms} bath
          {listing.parking ? ' · Parking' : ''}
          {listing.furnished ? ' · Furnished' : ''}
        </p>
      </section>
    </main>
  );
}
