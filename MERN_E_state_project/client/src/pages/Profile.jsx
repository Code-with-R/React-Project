import { useDispatch, useSelector } from "react-redux";
import { useRef, useState } from "react";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess
} from "../redux/user/userSlice";

export default function Profile() {
  const maxImageSize = 5 * 1024 * 1024;
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageSize, setImageSize] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

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
      const uploadData = new FormData();
      uploadData.append("image", file);

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

        request.send(uploadData);
      });

      dispatch(updateUserSuccess(data.user));
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((previousData) => ({
      ...previousData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);

    try {
      dispatch(updateUserStart());
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      const data = await res.json();

      if (!res.ok) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));
      setFormData((previousData) => ({ ...previousData, password: "" }));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message))
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto gap-4">
      <h1 className='text-3xl font-semibold text-center my-7 '>Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col">
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
          className={`rounded-full h-24 w-24 object-cover self-center mt-2 ${uploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
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
          value={formData.username}
          id="username"
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="email"
          value={formData.email}
          id="email"
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="password"
          id="password"
          value={formData.password}
          className="border p-3 rounded-lg"
          onChange={handleChange}
        />
        <button
          disabled={loading || uploading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80">
          {loading ? "Updating..." : "Update"}
        </button>
        {error && <p className="text-red-700 mt-3">{error}</p>}
        {updateSuccess && (
          <p className="text-green-700 mt-3">Profile updated successfully.</p>
        )}
      </form>
      <div className="flex justify-between mt-5">
        <span onClick={handleDeleteUser} className="text-red-700 cursor-pointer">Delete account</span>
        <span className="text-red-700 cursor-pointer">Sign out</span>
      </div>
      <p className="text-red-700 mt-5">{error ? error : ''}</p>
      <p className="text-red-700 mt-5">{updateSuccess ? 'user is updated successfully!' : ''}</p>
    </div>
  )
}
