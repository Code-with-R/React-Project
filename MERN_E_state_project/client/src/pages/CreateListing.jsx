import { useState, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaImages, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';

// Validation constants
const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_NAME_LENGTH = 10;
const MAX_NAME_LENGTH = 62;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Sanitization helper
const sanitizeInput = (input) => {
    if (!input) return '';
    return String(input)
        .replace(/[<>]/g, '') // Basic XSS prevention
        .trim();
};

export default function CreateListing() {
    const { currentUser } = useSelector(state => state.user);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageUploadError, setImageUploadError] = useState('');
    const [isUploadCancelled, setIsUploadCancelled] = useState(false);
    const [uploadXhr, setUploadXhr] = useState(null);
    
    const [formData, setFormData] = useState({
        imageUrls: [],
        name: '',
        description: '',
        address: '',
        type: 'rent', // 'rent' or 'sale'
        bedrooms: 1,
        bathrooms: 1,
        regularPrice: 5000,
        discountPrice: 0,
        offer: false,
        parking: false,
        furnished: false,
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Memoized validation
    const isValidForm = useMemo(() => {
        const errors = {};
        
        if (!formData.name || formData.name.length < MIN_NAME_LENGTH) {
            errors.name = `Name must be at least ${MIN_NAME_LENGTH} characters.`;
        }
        
        if (!formData.description || formData.description.length < 20) {
            errors.description = 'Description must be at least 20 characters.';
        }
        
        if (!formData.address) {
            errors.address = 'Address is required.';
        }
        
        if (formData.regularPrice <= 0) {
            errors.regularPrice = 'Price must be greater than 0.';
        }
        
        if (formData.offer && formData.discountPrice < 0) {
            errors.discountPrice = 'Discount price cannot be negative.';
        }
        
        if (formData.offer && formData.discountPrice >= formData.regularPrice) {
            errors.discountPrice = 'Discount price must be lower than regular price.';
        }
        
        if (formData.imageUrls.length === 0) {
            errors.images = 'At least one image is required.';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleImageSubmit = useCallback(async () => {
        setImageUploadError('');
        setIsUploadCancelled(false);

        if (!files.length) {
            setImageUploadError('Please select at least one image.');
            return;
        }

        if (files.length + formData.imageUrls.length > MAX_IMAGES) {
            setImageUploadError(`You can upload a maximum of ${MAX_IMAGES} images.`);
            return;
        }

        const oversizedImage = files.find((file) => file.size > MAX_IMAGE_SIZE);
        if (oversizedImage) {
            setImageUploadError(`${oversizedImage.name} is larger than 5 MB.`);
            return;
        }

        const invalidImage = files.find(
            (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
        );
        if (invalidImage) {
            setImageUploadError('Only JPG, PNG and WEBP images are allowed.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const uploadData = new FormData();
            files.forEach((file) => uploadData.append('images', file));

            const data = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/upload/listing-images');
                xhr.withCredentials = true;

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(
                            Math.round((event.loaded / event.total) * 100)
                        );
                    }
                });

                xhr.addEventListener('load', () => {
                    let response;
                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch {
                        reject(new Error('The server returned an invalid response.'));
                        return;
                    }

                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'Image upload failed.'));
                    }
                });

                xhr.addEventListener('error', () => {
                    if (!isUploadCancelled) {
                        reject(new Error('Network error while uploading images.'));
                    }
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload cancelled.'));
                });

                setUploadXhr(xhr);
                xhr.send(uploadData);
            });

            setUploadProgress(100);
            setFormData((previousData) => ({
                ...previousData,
                imageUrls: [
                    ...previousData.imageUrls,
                    ...data.images.map((image) => image.url),
                ],
            }));
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            if (!isUploadCancelled) {
                setImageUploadError(error.message);
            }
        } finally {
            setUploading(false);
            setUploadXhr(null);
            setIsUploadCancelled(false);
        }
    }, [files, formData.imageUrls, isUploadCancelled]);

    const handleCancelUpload = useCallback(() => {
        if (uploadXhr) {
            setIsUploadCancelled(true);
            uploadXhr.abort();
        }
    }, [uploadXhr]);

    const handleRemoveImage = useCallback((imageUrl) => {
        setFormData((previousData) => ({
            ...previousData,
            imageUrls: previousData.imageUrls.filter((url) => url !== imageUrl),
        }));
    }, []);

    const handleMoveImage = useCallback((index, direction) => {
        setFormData((prev) => {
            const newUrls = [...prev.imageUrls];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            
            if (newIndex < 0 || newIndex >= newUrls.length) return prev;
            
            [newUrls[index], newUrls[newIndex]] = [newUrls[newIndex], newUrls[index]];
            return { ...prev, imageUrls: newUrls };
        });
    }, []);

    const handleChange = useCallback((e) => {
        const { id, type, value, checked } = e.target;

        if (type === 'radio' && (id === 'sale' || id === 'rent')) {
            setFormData((prev) => ({
                ...prev,
                type: id,
            }));
            return;
        }

        if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                [id]: checked,
                ...(id === 'offer' && !checked ? { discountPrice: 0 } : {}),
            }));
            return;
        }

        // Sanitize text inputs
        let sanitizedValue = value;
        if (type === 'text' || type === 'textarea') {
            sanitizedValue = sanitizeInput(value);
        }

        setFormData((prev) => ({
            ...prev,
            [id]: type === 'number' ? Number(value) : sanitizedValue,
        }));

        // Clear field-specific errors on change
        if (fieldErrors[id]) {
            setFieldErrors((prev) => ({ ...prev, [id]: '' }));
        }
    }, [fieldErrors]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!isValidForm) {
            setError('Please fix all errors before submitting.');
            return;
        }

        try {
            if (!currentUser?._id) {
                setError('You must be signed in to create a listing.');
                return;
            }

            setLoading(true);
            setError('');

            const submissionData = {
                ...formData,
                userRef: currentUser._id,
                // Ensure description has a default if empty
                description: formData.description || 'No description provided.',
            };

            const res = await fetch('/api/listing/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(submissionData),
            });
            
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Could not create listing.');
            }

            // Reset form on successful submission
            setFormData({
                imageUrls: [],
                name: '',
                description: '',
                address: '',
                type: 'rent',
                bedrooms: 1,
                bathrooms: 1,
                regularPrice: 5000,
                discountPrice: 0,
                offer: false,
                parking: false,
                furnished: false,
            });
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            navigate(`/listing/${data._id}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser, formData, navigate, isValidForm]);

    return (
        <main className='p-3 max-w-3xl mx-auto'>
            <h1 className='text-3xl font-semibold text-center my-7'>Create a Listing</h1>
            
            <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
                <div className="flex flex-col gap-4 flex-1">
                    {/* Name Field */}
                    <div>
                        <input
                            type="text"
                            placeholder='Name'
                            className={`border p-3 rounded-lg w-full ${
                                fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            id='name'
                            maxLength={MAX_NAME_LENGTH}
                            minLength={MIN_NAME_LENGTH}
                            required
                            onChange={handleChange}
                            value={formData.name}
                        />
                        {fieldErrors.name && (
                            <p className='text-red-500 text-xs mt-1'>{fieldErrors.name}</p>
                        )}
                        <div className='text-xs text-gray-500 text-right'>
                            {formData.name.length}/{MAX_NAME_LENGTH}
                        </div>
                    </div>

                    {/* Description Field */}
                    <div>
                        <textarea
                            placeholder='Description'
                            className={`border p-3 rounded-lg w-full min-h-[100px] ${
                                fieldErrors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                            id='description'
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            required
                            onChange={handleChange}
                            value={formData.description}
                        />
                        {fieldErrors.description && (
                            <p className='text-red-500 text-xs mt-1'>{fieldErrors.description}</p>
                        )}
                        <div className='text-xs text-gray-500 text-right'>
                            {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                        </div>
                    </div>

                    {/* Address Field */}
                    <div>
                        <input
                            type="text"
                            placeholder='Address'
                            className={`border p-3 rounded-lg w-full ${
                                fieldErrors.address ? 'border-red-500' : 'border-gray-300'
                            }`}
                            id='address'
                            required
                            onChange={handleChange}
                            value={formData.address}
                        />
                        {fieldErrors.address && (
                            <p className='text-red-500 text-xs mt-1'>{fieldErrors.address}</p>
                        )}
                    </div>

                    {/* Type Selection - Radio Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex gap-2 items-center">
                            <input
                                type="radio"
                                id='sale'
                                name='listingType'
                                className='w-4 h-4'
                                onChange={handleChange}
                                checked={formData.type === 'sale'}
                            />
                            <label htmlFor="sale">For Sale</label>
                        </div>
                        <div className="flex gap-2 items-center">
                            <input
                                type="radio"
                                id='rent'
                                name='listingType'
                                className='w-4 h-4'
                                onChange={handleChange}
                                checked={formData.type === 'rent'}
                            />
                            <label htmlFor="rent">For Rent</label>
                        </div>
                    </div>

                    {/* Amenities Checkboxes */}
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='parking'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.parking}
                            />
                            <label htmlFor="parking">Parking spot</label>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='furnished'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.furnished}
                            />
                            <label htmlFor="furnished">Furnished</label>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='offer'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.offer}
                            />
                            <label htmlFor="offer">Offer</label>
                        </div>
                    </div>

                    {/* Bedrooms & Bathrooms */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id='bedrooms'
                                min='1'
                                max='10'
                                required
                                className='p-3 border border-gray-300 rounded-lg w-20'
                                onChange={handleChange}
                                value={formData.bedrooms}
                            />
                            <label htmlFor="bedrooms">Beds</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id='bathrooms'
                                min='1'
                                max='10'
                                required
                                className='p-3 border border-gray-300 rounded-lg w-20'
                                onChange={handleChange}
                                value={formData.bathrooms}
                            />
                            <label htmlFor="bathrooms">Baths</label>
                        </div>
                    </div>

                    {/* Prices */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id='regularPrice'
                                min='1'
                                max='100000'
                                required
                                className={`p-3 border rounded-lg w-28 ${
                                    fieldErrors.regularPrice ? 'border-red-500' : 'border-gray-300'
                                }`}
                                onChange={handleChange}
                                value={formData.regularPrice}
                            />
                            <div className="flex flex-col">
                                <label htmlFor="regularPrice" className='text-sm'>Regular Price</label>
                                <span className='text-xs text-gray-500'>
                                    ₹ {formData.type === 'rent' ? '/ month' : ''}
                                </span>
                            </div>
                        </div>
                        
                        {formData.offer && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    id='discountPrice'
                                    min='0'
                                    max='100000'
                                    required
                                    className={`p-3 border rounded-lg w-28 ${
                                        fieldErrors.discountPrice ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    onChange={handleChange}
                                    value={formData.discountPrice}
                                />
                                <div className="flex flex-col">
                                    <label htmlFor="discountPrice" className='text-sm'>Discount Price</label>
                                    <span className='text-xs text-gray-500'>
                                        ₹ {formData.type === 'rent' ? '/ month' : ''}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    {fieldErrors.regularPrice && (
                        <p className='text-red-500 text-xs'>{fieldErrors.regularPrice}</p>
                    )}
                    {fieldErrors.discountPrice && (
                        <p className='text-red-500 text-xs'>{fieldErrors.discountPrice}</p>
                    )}
                </div>

                {/* Right Column - Images */}
                <div className="flex flex-col flex-1 gap-4">
                    <div>
                        <p className='font-semibold'>
                            Images:
                            <span className='font-normal text-gray-700 ml-2'>
                                The first image will be the cover (max {MAX_IMAGES})
                            </span>
                        </p>
                        <div className="flex gap-2 mt-2">
                            <input
                                ref={fileInputRef}
                                onChange={(event) => setFiles(Array.from(event.target.files || []))}
                                className='p-3 border border-gray-300 rounded w-full text-sm'
                                type="file"
                                id='images'
                                accept='.jpg,.jpeg,.png,.webp'
                                multiple
                                disabled={uploading || formData.imageUrls.length >= MAX_IMAGES}
                            />
                            <button
                                type='button'
                                onClick={uploading ? handleCancelUpload : handleImageSubmit}
                                disabled={!files.length && !uploading}
                                className={`p-3 border rounded uppercase hover:shadow-lg disabled:opacity-50 cursor-pointer min-w-[80px] ${
                                    uploading 
                                        ? 'border-red-500 text-red-500 hover:bg-red-50'
                                        : 'border-green-700 text-green-700 hover:bg-green-50'
                                }`}
                            >
                                {uploading ? `${uploadProgress}%` : 'Upload'}
                            </button>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-green-700 transition-all duration-200'
                                style={{ width: `${uploadProgress}%` }}
                                role='progressbar'
                                aria-valuenow={uploadProgress}
                                aria-valuemin='0'
                                aria-valuemax='100'
                            />
                        </div>
                    )}

                    {/* Image Errors */}
                    {imageUploadError && (
                        <p className='text-red-700 text-sm'>{imageUploadError}</p>
                    )}
                    {fieldErrors.images && (
                        <p className='text-red-500 text-sm'>{fieldErrors.images}</p>
                    )}

                    {/* Image Previews */}
                    <div className="space-y-2">
                        {formData.imageUrls.map((imageUrl, index) => (
                            <div
                                key={imageUrl}
                                className={`flex items-center justify-between border p-3 rounded-lg ${
                                    index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img
                                        src={imageUrl}
                                        alt={`Listing preview ${index + 1}`}
                                        className='w-20 h-20 object-cover rounded-lg flex-shrink-0'
                                    />
                                    <div className="flex flex-col">
                                        <span className='text-sm font-medium truncate'>
                                            Image {index + 1}
                                            {index === 0 && ' (Cover)'}
                                        </span>
                                        <div className="flex gap-1 mt-1">
                                            {index > 0 && (
                                                <button
                                                    type='button'
                                                    onClick={() => handleMoveImage(index, 'up')}
                                                    className='p-1 text-gray-600 hover:bg-gray-100 rounded'
                                                    aria-label="Move image up"
                                                >
                                                    <FaArrowUp size={12} />
                                                </button>
                                            )}
                                            {index < formData.imageUrls.length - 1 && (
                                                <button
                                                    type='button'
                                                    onClick={() => handleMoveImage(index, 'down')}
                                                    className='p-1 text-gray-600 hover:bg-gray-100 rounded'
                                                    aria-label="Move image down"
                                                >
                                                    <FaArrowDown size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type='button'
                                    onClick={() => handleRemoveImage(imageUrl)}
                                    className='p-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0'
                                    aria-label="Delete image"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        disabled={loading || uploading || !isValidForm}
                        className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer'
                        type='submit'
                    >
                        {loading ? 'Creating...' : 'Create Listing'}
                    </button>
                    
                    {error && <p className='text-red-700 text-sm'>{error}</p>}
                </div>
            </form>
        </main>
    );
}