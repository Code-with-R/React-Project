import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Keyboard, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css/bundle';

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

  if (error || !listing) {
    return (
      <p className='p-6 text-center text-red-700'>
        {error || 'Listing not found.'}
      </p>
    );
  }

  const hasMultipleImages = listing.imageUrls.length > 1;

  return (
    <main className='max-w-5xl mx-auto p-4'>
      <Swiper
        modules={[Navigation, Pagination, Autoplay, Keyboard, A11y]}
        slidesPerView={1}
        spaceBetween={16}
        navigation={hasMultipleImages}
        pagination={hasMultipleImages ? { clickable: true } : false}
        keyboard={{ enabled: true }}
        loop={hasMultipleImages}
        autoplay={
          hasMultipleImages
            ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        className='rounded-xl overflow-hidden'
      >
        {listing.imageUrls.map((imageUrl, index) => (
          <SwiperSlide key={imageUrl}>
            <div
              role='img'
              aria-label={`${listing.name} ${index + 1} of ${listing.imageUrls.length}`}
              className='w-full h-72 sm:h-[32rem] bg-cover bg-center bg-no-repeat'
              style={{ backgroundImage: `url("${imageUrl}")` }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <section className='mt-6 flex flex-col gap-3'>
        <h1 className='text-3xl font-semibold'>{listing.name}</h1>
        <p className='text-slate-600'>{listing.address}</p>
        <p>{listing.description}</p>
        <p className='font-semibold'>
          ₹{(listing.offer
            ? listing.discountPrice
            : listing.regularPrice
          ).toLocaleString()}
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
