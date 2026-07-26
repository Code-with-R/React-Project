import { useState } from 'react'

export default function CreateListing() {
    const maxImages = 6;
    const maxImageSize = 5 * 1024 * 1024;
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imageUploadError, setImageUploadError] = useState('');
    const [formData, setFormData] = useState({
        imageUrls: [],
    });

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

    return (
        <main className='p-3 max-w-3xl mx-auto'>
            <h1 className='text-3xl font-semibold text-center my-7'>Create a Listing</h1>
            <form className='flex flex-col sm:flex-row gap-4'>
                <div className="flex flex-col gap-4 flex-1" >
                    <input type="text" placeholder='Name' className='border p-3 rounded-lg' id='name' maxLength='62' minLength='10' required />
                    <textarea type="text" placeholder='Description' className='border p-3 rounded-lg' id='description' required />
                    <input type="text" placeholder='Address' className='border p-3 rounded-lg' id='address' required />
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex gap-2">
                            <input type="checkbox" id='sale' className='w-5' />
                            <span>Sell</span>
                        </div>
                        <div className="flex gap-2">
                            <input type="checkbox" id='Rent' className='w-5' />
                            <span>Rent</span>
                        </div>
                        <div className="flex gap-2">
                            <input type="checkbox" id='parking' className='w-5' />
                            <span>Parking spot</span>
                        </div>
                        <div className="flex gap-2">
                            <input type="checkbox" id='furnished' className='w-5' />
                            <span>Furnished</span>
                        </div>
                        <div className="flex gap-2">
                            <input type="checkbox" id='other' className='w-5' />
                            <span>Other</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap">
                        <div className="flex items-center gap-2">
                            <input type="number" id='bedrooms' min='1' max='10' required className='p-3 border border-gray-300 rounded-lg' />
                            <p>Beds</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" id='bathrooms' min='1' max='10' required className='p-3 border border-gray-300 rounded-lg' />
                            <p>Baths</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" id='regularPrice' min='1' max='10' required className='p-3 border border-gray-300 rounded-lg' />
                            <div className="flex flex-col items-center">
                                <p>Regular price</p>
                                <span className='text-xs'>₹ / month</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" id='discountPrice' min='1' max='10' required className='p-3 border border-gray-300 rounded-lg' />
                            <div className="flex flex-col items-center">
                                <p>Discounted price</p>
                                <span className='text-xs'>₹ / month</span>
                            </div>
                        </div>
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
                    <button className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80 cursor-pointer'>Create Listing</button>
                </div>
            </form>
        </main>
    )
}
