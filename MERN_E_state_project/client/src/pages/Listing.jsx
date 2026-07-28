import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Keyboard, Navigation, Pagination } from 'swiper/modules';
import {
  FaBath,
  FaBed,
  FaCouch,
  FaEnvelope,
  FaImages,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaParking,
  FaShare,
  FaUserCircle,
} from 'react-icons/fa';
import 'swiper/css/bundle';

// Helper function for sanitizing input
const sanitizeInput = (input) => {
  if (!input) return '';
  return String(input).replace(/[<>]/g, '');
};

export default function Listing() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [landlord, setLandlord] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [error, setError] = useState('');
  const [contactError, setContactError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [message, setMessage] = useState('');
  const [brokenImages, setBrokenImages] = useState({});

  // Memoized price calculation
  const displayPrice = useMemo(() => {
    if (!listing) return 0;
    return listing.offer ? listing.discountPrice : listing.regularPrice;
  }, [listing]);

  const discountAmount = useMemo(() => {
    if (!listing || !listing.offer) return 0;
    return listing.regularPrice - listing.discountPrice;
  }, [listing]);

  // Memoized image URLs
  const imageUrls = useMemo(() => {
    if (!listing || !Array.isArray(listing.imageUrls)) return [];
    return listing.imageUrls.filter(url => url && url.trim() !== '');
  }, [listing]);

  // Memoized map query
  const mapQuery = useMemo(() => {
    if (!listing || !listing.address) return '';
    return encodeURIComponent(sanitizeInput(listing.address));
  }, [listing]);

  // Memoized mailto href
  const mailToHref = useMemo(() => {
    if (!landlord || !landlord.email || !listing) return '';
    const sanitizedSubject = sanitizeInput(listing.name);
    const sanitizedMessage = sanitizeInput(message);
    return `mailto:${landlord.email}?subject=${encodeURIComponent(`Regarding ${sanitizedSubject}`)}&body=${encodeURIComponent(sanitizedMessage)}`;
  }, [landlord, listing, message]);

  // Load listing with error handling and retry logic
  const loadListing = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/listing/get/${listingId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load listing.');
      }

      // Validate data before setting
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid listing data received.');
      }

      setListing(data);
      // Only set initial message if listing name exists
      if (data.name) {
        setMessage(`Hi, I am interested in ${sanitizeInput(data.name)}. Is it still available?`);
      }
    } catch (requestError) {
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => loadListing(retryCount + 1), delay);
        return;
      }
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  // Load extra details with cancellation support
  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    const loadExtraDetails = async () => {
      if (!listing || !listing.userRef) return;

      try {
        const userRef = typeof listing.userRef === 'object' 
          ? listing.userRef._id 
          : listing.userRef;

        if (!userRef) {
          console.warn('No user reference found');
          return;
        }

        // Load landlord details
        const userResponse = await fetch(`/api/user/contact/${userRef}`, {
          signal: abortController.signal
        });
        const userData = await userResponse.json();

        if (isMounted && userResponse.ok) {
          setLandlord(userData);
        }

        // Load similar listings with intersection observer
        const similarResponse = await fetch(`/api/listing/similar/${listing._id}`, {
          signal: abortController.signal
        });
        const similarData = await similarResponse.json();

        if (isMounted && similarResponse.ok) {
          setSimilarListings(Array.isArray(similarData) ? similarData : []);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading extra details:', error);
        }
      } finally {
        if (isMounted) {
          setSimilarLoading(false);
        }
      }
    };

    setSimilarLoading(true);
    loadExtraDetails();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [listing]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: sanitizeInput(listing?.name || 'Property'),
          text: `View this property: ${sanitizeInput(listing?.name || '')}`,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setShareMessage('Link copied!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        setShareMessage('Could not share');
        setTimeout(() => setShareMessage(''), 2000);
      }
    }
  };

  const handleContactLandlord = async () => {
    setShowContact(true);
    setContactError('');

    if (landlord) return;

    try {
      setContactLoading(true);
      const userRef = typeof listing.userRef === 'object' 
        ? listing.userRef._id 
        : listing.userRef;

      if (!userRef) {
        throw new Error('Landlord information not available.');
      }

      const response = await fetch(`/api/user/contact/${userRef}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not load landlord details.');
      }

      setLandlord(data);
    } catch (requestError) {
      setContactError(requestError.message);
    } finally {
      setContactLoading(false);
    }
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    // Limit message to 1000 characters
    if (value.length <= 1000) {
      setMessage(value);
    }
  };

  // Validate message before sending
  const isValidMessage = useMemo(() => {
    return message && message.trim().length >= 10 && message.trim().length <= 1000;
  }, [message]);

  if (loading) {
    return <p className='p-6 text-center font-semibold'>Loading listing...</p>;
  }

  if (error || !listing) {
    return (
      <p className='p-6 text-center font-semibold text-red-700'>
        {error || 'Listing not found.'}
      </p>
    );
  }

  return (
    <main className='min-h-screen bg-[#f7f8f5] pb-10 text-black'>
      {/* Image Gallery Section */}
      <section className='relative mx-auto h-56 w-full max-w-6xl overflow-hidden bg-slate-200 sm:h-72 lg:h-330px'>
        <Swiper
          modules={[Navigation, Pagination, Autoplay, Keyboard, A11y]}
          slidesPerView={1}
          navigation={imageUrls.length > 1}
          pagination={imageUrls.length > 1 ? { clickable: true } : false}
          keyboard={{ enabled: true }}
          loop={imageUrls.length > 1}
          autoplay={
            imageUrls.length > 1
              ? {
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          className='h-full w-full'
        >
          {imageUrls.length > 0 ? (
            imageUrls.map((imageUrl, index) => (
              <SwiperSlide key={index}>
                {brokenImages[imageUrl] ? (
                  <div className='flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-200 text-slate-600'>
                    <FaImages className='text-4xl' />
                    <p className='text-sm font-semibold'>Image unavailable</p>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`${sanitizeInput(listing.name)} property ${index + 1}`}
                    className='h-full w-full object-cover object-center'
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onError={() =>
                      setBrokenImages((previous) => ({
                        ...previous,
                        [imageUrl]: true,
                      }))
                    }
                  />
                )}
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div className='flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-200 text-slate-600'>
                <FaImages className='text-4xl' />
                <p className='text-sm font-semibold'>No listing image uploaded</p>
              </div>
            </SwiperSlide>
          )}
        </Swiper>

        <button
          type='button'
          onClick={handleShare}
          aria-label='Share this listing'
          className='absolute right-6 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:text-green-700 sm:right-10'
        >
          <FaShare />
        </button>
        {shareMessage && (
          <span className='absolute right-4 top-[calc(50%+36px)] z-20 rounded bg-slate-900 px-3 py-1 text-xs text-white sm:right-8'>
            {shareMessage}
          </span>
        )}
      </section>

      {/* Listing Details */}
      <section className='mx-auto flex max-w-2xl flex-col gap-4 px-5 py-8'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
          <h1 className='text-lg font-bold leading-tight text-black sm:text-xl'>
            {sanitizeInput(listing.name)}
          </h1>
          <p className='text-lg font-bold leading-tight text-black sm:text-xl'>
            $ {displayPrice.toLocaleString()}
            {listing.type === 'rent' ? ' / month' : ''}
          </p>
        </div>

        <p className='flex items-center gap-2 text-xs font-semibold text-slate-700 sm:text-sm'>
          <FaMapMarkerAlt className='shrink-0 text-sm text-green-700' />
          <span>{sanitizeInput(listing.address)}</span>
        </p>

        <div className='grid max-w-sm grid-cols-2 gap-4'>
          <span className='rounded bg-red-700 px-4 py-2 text-center text-xs font-bold text-white shadow-sm sm:text-sm'>
            {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          <span className='rounded bg-green-700 px-4 py-2 text-center text-xs font-bold text-white shadow-sm sm:text-sm'>
            {listing.offer
              ? `$${discountAmount.toLocaleString('en-US')} discount`
              : `$${displayPrice.toLocaleString('en-US')}`}
          </span>
        </div>

        <div className='border-t border-slate-300 pt-4'>
          <p className='text-sm font-semibold leading-6 text-black'>
            <span className='font-bold'>Description - </span>
            {listing.description || 'No description provided.'}
          </p>
        </div>

        <ul className='flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-300 pt-4 text-xs font-bold text-green-950 sm:text-sm'>
          <li className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            <FaBed className='shrink-0' />
            <span>{listing.bedrooms || 0} {listing.bedrooms === 1 ? 'bed' : 'beds'}</span>
          </li>
          <li className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            <FaBath className='shrink-0' />
            <span>{listing.bathrooms || 0} {listing.bathrooms === 1 ? 'bath' : 'baths'}</span>
          </li>
          <li className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            <FaParking className='shrink-0' />
            <span>{listing.parking ? 'Parking' : 'No parking'}</span>
          </li>
          <li className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            <FaCouch className='shrink-0' />
            <span>{listing.furnished ? 'Furnished' : 'Not furnished'}</span>
          </li>
        </ul>

        {/* Owner Profile Section */}
        <section className='border-t border-slate-300 pt-4'>
          <h2 className='mb-3 flex items-center gap-2 text-sm font-bold uppercase text-slate-800'>
            <FaUserCircle />
            Owner Profile
          </h2>
          {landlord ? (
            <div className='grid gap-2 text-sm text-slate-700'>
              <p>
                <span className='font-bold text-black'>Name: </span>
                {sanitizeInput(landlord.username)}
              </p>
              <p>
                <span className='font-bold text-black'>Email: </span>
                {landlord.email}
              </p>
            </div>
          ) : (
            <p className='text-sm font-semibold text-slate-600'>
              Owner details are loading.
            </p>
          )}

          <button
            type='button'
            onClick={handleContactLandlord}
            disabled={contactLoading}
            className='mt-5 flex w-full items-center justify-center gap-2 rounded bg-slate-700 px-4 py-3 text-xs font-bold uppercase text-white shadow transition hover:bg-slate-800 disabled:opacity-70 sm:text-sm'
          >
            <FaEnvelope />
            {contactLoading ? 'Loading contact...' : 'Contact Landlord'}
          </button>
        </section>

        {/* Contact Form Section */}
        {showContact && (
          <section className='flex flex-col gap-3 border-t border-slate-300 pt-4'>
            <h2 className='text-sm font-bold uppercase text-slate-800'>
              Contact Form
            </h2>
            {contactError && (
              <p className='text-sm font-semibold text-red-700'>{contactError}</p>
            )}
            {landlord && (
              <>
                <p className='text-sm text-slate-700'>
                  Send a message to{' '}
                  <span className='font-bold'>{sanitizeInput(landlord.username)}</span> about{' '}
                  <span className='font-bold'>{sanitizeInput(listing.name)}</span>.
                </p>
                <textarea
                  value={message}
                  onChange={handleMessageChange}
                  placeholder='Write your message here...'
                  className='min-h-28 rounded border border-slate-300 bg-white p-3 text-sm outline-none focus:border-slate-500'
                  maxLength={1000}
                />
                <div className='flex justify-between text-xs text-slate-500'>
                  <span>{message.length}/1000 characters</span>
                  <span>{isValidMessage ? '✓' : 'Min 10 characters required'}</span>
                </div>
                <a
                  href={mailToHref}
                  className={`flex items-center justify-center gap-2 rounded px-4 py-3 text-sm font-bold uppercase text-white ${
                    isValidMessage 
                      ? 'bg-green-800 hover:bg-green-900' 
                      : 'bg-gray-400 cursor-not-allowed pointer-events-none'
                  }`}
                  onClick={(e) => {
                    if (!isValidMessage) {
                      e.preventDefault();
                      setContactError('Message must be between 10 and 1000 characters.');
                    }
                  }}
                >
                  <FaPaperPlane />
                  Send Message
                </a>
              </>
            )}
          </section>
        )}

        {/* Google Map Section */}
        <section className='border-t border-slate-300 pt-4'>
          <h2 className='mb-3 flex items-center gap-2 text-sm font-bold uppercase text-slate-800'>
            <FaMapMarkerAlt className='text-green-700' />
            Google Map
          </h2>
          {listing.address ? (
            <iframe
              title={`${sanitizeInput(listing.name)} map`}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className='h-64 w-full rounded bg-slate-200'
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
            />
          ) : (
            <p className='text-sm text-slate-600'>Location not available</p>
          )}
        </section>

        {/* Similar Properties Section */}
        <section className='border-t border-slate-300 pt-4'>
          <h2 className='mb-3 text-sm font-bold uppercase text-slate-800'>
            Similar Properties
          </h2>
          {similarLoading ? (
            <p className='text-sm font-semibold text-slate-600'>
              Loading similar properties...
            </p>
          ) : similarListings.length > 0 ? (
            <div className='grid gap-3 sm:grid-cols-3'>
              {similarListings.slice(0, 6).map((similarListing) => (
                <Link
                  key={similarListing._id}
                  to={`/listing/${similarListing._id}`}
                  className='overflow-hidden rounded bg-white shadow-sm transition hover:shadow-md'
                >
                  <img
                    src={similarListing.imageUrls?.[0] || '/placeholder-image.jpg'}
                    alt={sanitizeInput(similarListing.name)}
                    className='h-28 w-full object-cover'
                    loading='lazy'
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className='p-3'>
                    <p className='truncate text-sm font-bold text-black'>
                      {sanitizeInput(similarListing.name)}
                    </p>
                    <p className='text-xs font-semibold text-slate-600'>
                      $ {similarListing.offer
                        ? similarListing.discountPrice.toLocaleString()
                        : similarListing.regularPrice.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className='text-sm font-semibold text-slate-600'>
              No similar properties found.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}