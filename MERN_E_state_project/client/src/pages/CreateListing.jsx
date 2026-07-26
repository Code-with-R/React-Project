import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
    const {currentUser} = useSelector(state => state.user);
    const navigate = useNavigate();
    const maxImages = 6;
    const maxImageSize = 5 * 1024 * 1024;
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageUploadError, setImageUploadError] = useState('');
    const [formData, setFormData] = useState({
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleImageSubmit = async () => {
        setImageUploadError('');

        if (!files.length) {
            setImageUploadError('Please select at least one image.');
            return;
        }

        if (files.length + formData.imageUrls.length > maxImages) {
            setImageUploadError(`You can upload a maximum of ${maxImages} images.`);
            return;
        }

        const oversizedImage = files.find((file) => file.size > maxImageSize);
        if (oversizedImage) {
            setImageUploadError(`${oversizedImage.name} is larger than 5 MB.`);
            return;
        }

        const invalidImage = files.find(
            (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
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
                const request = new XMLHttpRequest();
                request.open('POST', '/api/upload/listing-images');
                request.withCredentials = true;

                request.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(
                            Math.round((event.loaded / event.total) * 100)
                        );
                    }
                });

                request.addEventListener('load', () => {
                    let response;
                    try {
                        response = JSON.parse(request.responseText);
                    } catch {
                        reject(new Error('The server returned an invalid response.'));
                        return;
                    }

                    if (request.status >= 200 && request.status < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'Image upload failed.'));
                    }
                });

                request.addEventListener('error', () => {
                    reject(new Error('Network error while uploading images.'));
                });

                request.send(uploadData);
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
        } catch (error) {
            setImageUploadError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (imageUrl) => {
        setFormData((previousData) => ({
            ...previousData,
            imageUrls: previousData.imageUrls.filter((url) => url !== imageUrl),
        }));
    };

    const handleChange = (e) => {
        const { id, type, value, checked } = e.target;

        if (id === 'sale' || id === 'rent') {
            setFormData((previousData) => ({
                ...previousData,
                type: id,
            }));
            return;
        }

        if (type === 'checkbox') {
            setFormData((previousData) => ({
                ...previousData,
                [id]: checked,
                ...(id === 'offer' && !checked ? { discountPrice: 0 } : {}),
            }));
            return;
        }

        setFormData((previousData) => ({
            ...previousData,
            [id]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!currentUser?._id) {
                setError('You must be signed in to create a listing.');
                return;
            }
            if (formData.imageUrls.length < 1) {
                setError('You must upload at least one image.');
                return;
            }
            if (
                formData.offer &&
                Number(formData.discountPrice) >= Number(formData.regularPrice)
            ) {
                setError('Discount price must be lower than regular price.');
                return;
            }

            setLoading(true);
            setError('');
            const res = await fetch('/api/listing/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    userRef: currentUser._id,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Could not create listing.');
            }

            navigate(`/listing/${data._id}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className='p-3 max-w-3xl mx-auto'>
            <h1 className='text-3xl font-semibold text-center my-7'>Create a Listing</h1>
            <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
                <div className="flex flex-col gap-4 flex-1" >
                    <input
                        type="text"
                        placeholder='Name'
                        className='border p-3 rounded-lg'
                        id='name'
                        maxLength='62'
                        minLength='10'
                        required
                        onChange={handleChange}
                        value={formData.name}
                    />
                    <textarea
                        type="text"
                        placeholder='Description'
                        className='border p-3 rounded-lg'
                        id='description'
                        required
                        onChange={handleChange}
                        value={formData.description}
                    />
                    <input
                        type="text"
                        placeholder='Address'
                        className='border p-3 rounded-lg'
                        id='address'
                        required
                        onChange={handleChange}
                        value={formData.address}
                    />
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='sale'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.type === 'sale'}
                            />
                            <span>Sell</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='rent'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.type === 'rent'}
                            />
                            <span>Rent</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='parking'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.parking}
                            />
                            <span>Parking spot</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='furnished'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.furnished}
                            />
                            <span>Furnished</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="checkbox"
                                id='offer'
                                className='w-5'
                                onChange={handleChange}
                                checked={formData.offer}
                            />
                            <span>Offer</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id='bedrooms'
                                min='1'
                                max='10'
                                required
                                className='p-3 border border-gray-300 rounded-lg'
                                onChange={handleChange}
                                value={formData.bedrooms}
                            />
                            <p>Beds</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id='bathrooms'
                                min='1'
                                max='10'
                                required
                                className='p-3 border border-gray-300 rounded-lg'
                                onChange={handleChange}
                                value={formData.bathrooms}
                            />
                            <p>Baths</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                id='regularPrice'
                                min='5000'
                                max='100000'
                                required
                                className='p-3 border border-gray-300 rounded-lg'
                                onChange={handleChange}
                                value={formData.regularPrice}
                            />
                            <div className="flex flex-col items-center">
                                <p>Regular price</p>
                                <span className='text-xs'>₹ / month</span>
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
                                className='p-3 border border-gray-300 rounded-lg'
                                onChange={handleChange}
                                value={formData.discountPrice}
                            />
                            <div className="flex flex-col items-center">
                                <p>Discounted price</p>
                                <span className='text-xs'>₹ / month</span>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col flex-1 gap-4">
                    <p className='font-semibold'>Images:
                        <span className='font-normal text-gray-700 ml-2'>The first image will be the cover (max 6)</span>
                    </p>
                    <div className="flex gap-4">
                        <input
                            key={files.length ? 'selected' : 'empty'}
                            onChange={(event) => setFiles(Array.from(event.target.files))}
                            className='p-3 border border-gray-300 rounded w-full'
                            type="file"
                            id='images'
                            accept='image/jpeg,image/png,image/webp'
                            multiple
                            disabled={uploading || formData.imageUrls.length >= maxImages}
                        />
                        <button
                            type='button'
                            onClick={handleImageSubmit}
                            disabled={uploading}
                            className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80 cursor-pointer'>
                            {uploading ? `${uploadProgress}%` : 'Upload'}
                        </button>
                    </div>
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
                    {imageUploadError && (
                        <p className='text-red-700 text-sm'>{imageUploadError}</p>
                    )}
                    {formData.imageUrls.map((imageUrl, index) => (
                        <div
                            key={imageUrl}
                            className='flex justify-between items-center border p-3 rounded-lg'
                        >
                            <img
                                src={imageUrl}
                                alt={`Listing preview ${index + 1}`}
                                className='w-20 h-20 object-cover rounded-lg'
                            />
                            <button
                                type='button'
                                onClick={() => handleRemoveImage(imageUrl)}
                                className='p-3 text-red-700 uppercase hover:opacity-75'
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    <button
                        disabled={loading || uploading}
                        className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80 cursor-pointer'>
                       {loading ? 'Creating...':'Create Listing'}
                    </button>
                    {error && <p className='text-red-700 text-sm'>{error}</p>}
                </div>
            </form>
        </main>
    )
}
