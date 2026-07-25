import { useDispatch, useSelector } from "react-redux";
import { useRef, useState } from "react";
import { updateUserSuccess } from "../redux/user/userSlice";

export default function Profile() {
  const maxImageSize = 5 * 1024 * 1024;
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageSize, setImageSize] = useState("");
  const [uploadError, setUploadError] = useState("");

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const selectedImageSize = formatFileSize(file.size);
    setImageSize(selectedImageSize);

    if (file.size > maxImageSize) {
      setUploadError(
        `Image size is ${selectedImageSize}. Maximum allowed size is 5 MB.`
      );
      setUploadProgress(0);
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const data = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/upload/image");
        request.withCredentials = true;

        request.upload.addEventListener("progress", (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(percentage);
          }
        });

        request.addEventListener("load", () => {
          let response;

          try {
            response = JSON.parse(request.responseText);
          } catch {
            reject(new Error("The server returned an invalid response"));
            return;
          }

          if (request.status >= 200 && request.status < 300) {
            setUploadProgress(100);
            resolve(response);
          } else {
            reject(new Error(response.message || "Image upload failed"));
          }
        });

        request.addEventListener("error", () => {
          reject(new Error("Network error while uploading the image"));
        });

        request.addEventListener("abort", () => {
          reject(new Error("Image upload was cancelled"));
        });

        request.send(formData);
      });

      dispatch(updateUserSuccess(data.user));
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="p-3 max-w-lg mx-auto gap-4">
      <h1 className='text-3xl font-semibold text-center my-7 '>Profile</h1>
      <form className="flex flex-col">
        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
        />
        <img
          onClick={() => !uploading && fileRef.current.click()}
          src={currentUser?.avatar}
          alt="profile"
          className={`rounded-full h-24 w-24 object-cover self-center mt-2 ${
            uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        />
        <p className="text-sm text-center my-2">
          {uploading
            ? `Uploading: ${uploadProgress}% (${imageSize})`
            : imageSize
              ? `Image size: ${imageSize}`
              : "Click the image to change it"}
        </p>
        <p className="text-xs text-slate-500 text-center mb-2">
          Maximum image size: 5 MB
        </p>
        {uploading && (
          <div className="w-full h-2 bg-slate-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        )}
        {uploadError && (
          <p className="text-red-700 text-sm text-center mb-2">{uploadError}</p>
        )}
        <input
          type="text"
          placeholder="username"
          id="username"
          className="border p-3 rounded-lg"
        />
        <input
          type="email"
          placeholder="email"
          id="email"
          className="border p-3 rounded-lg"
        />
        <input
          type="password"
          placeholder="password"
          id="password"
          className="border p-3 rounded-lg"
        />
        <button
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80">
          update
        </button>
      </form>
      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer">Delete account</span>
        <span className="text-red-700 cursor-pointer">Sign out</span>
      </div>
    </div>
  )
}
