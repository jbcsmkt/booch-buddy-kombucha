import React, { useState, useEffect } from 'react';
import { Camera, Upload, Trash2, Eye, X } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { ExtendedBatchPhoto as BatchPhoto } from '../types/extended';
import { batchPhotoService } from '../services/placeholderServices';
import { format } from 'date-fns';

interface PhotoUploadProps {
  batch: BatchData;
  readOnly?: boolean;
}

const PHOTO_TYPES = [
  { value: 'scoby', label: 'SCOBY Health' },
  { value: 'color', label: 'Color/Appearance' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'general', label: 'General' }
];

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ batch, readOnly = false }) => {
  const [photos, setPhotos] = useState<BatchPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<BatchPhoto | null>(null);
  const [uploadData, setUploadData] = useState({
    photo_type: 'general',
    caption: ''
  });

  useEffect(() => {
    if (batch.id) {
      loadPhotos();
    }
  }, [batch.id]);

  const loadPhotos = async () => {
    try {
      console.log('Loading photos for batch:', batch.id);
      const response = await fetch(`http://localhost:5000/api/batches/${batch.id}/photos`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load photos: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded photos:', data);
      setPhotos(data);
    } catch (error) {
      console.error('Failed to load photos:', error);
      setPhotos([]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB to match backend)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('photo_type', uploadData.photo_type);
      formData.append('caption', uploadData.caption);

      console.log('Uploading photo for batch:', batch.id);
      
      // Upload to backend
      const response = await fetch(`http://localhost:5000/api/batches/${batch.id}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const newPhoto = await response.json();
      console.log('Photo uploaded successfully:', newPhoto);
      
      // Reload photos from server
      await loadPhotos();
      setUploadData({ photo_type: 'general', caption: '' });
      
      // Reset the file input
      event.target.value = '';
      
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        console.log('Deleting photo:', id);
        const response = await fetch(`http://localhost:5000/api/photos/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete photo: ${response.status}`);
        }
        
        console.log('Photo deleted successfully');
        await loadPhotos();
        alert('Photo deleted successfully!');
      } catch (error) {
        console.error('Failed to delete photo:', error);
        alert(`Failed to delete photo: ${error.message}`);
      }
    }
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.photo_type]) {
      acc[photo.photo_type] = [];
    }
    acc[photo.photo_type].push(photo);
    return acc;
  }, {} as Record<string, BatchPhoto[]>);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Camera className="text-brewing-gold" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Batch Photos</h2>
        </div>
      </div>

      {/* Upload Section */}
      {!readOnly && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Add Photo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo Type</label>
              <select
                value={uploadData.photo_type}
                onChange={(e) => setUploadData(prev => ({ ...prev, photo_type: e.target.value as BatchPhoto['photo_type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              >
                {PHOTO_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <input
                type="text"
                value={uploadData.caption}
                onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Optional caption"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
              <Upload size={16} />
              {isUploading ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <span className="text-sm text-gray-500">Max 5MB • JPG, PNG, GIF</span>
          </div>
        </div>
      )}

      {/* Photos Display */}
      {photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Photos Yet</h3>
          <p className="text-gray-500">Document your brewing process with photos for better tracking.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
            <div key={type} className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">
                {PHOTO_TYPES.find(t => t.value === type)?.label || type}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {typePhotos
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || 'Batch photo'}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setViewingPhoto(photo)}
                      />
                    </div>
                    
                    {/* Photo overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => setViewingPhoto(photo)}
                          className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                          title="View photo"
                        >
                          <Eye size={16} />
                        </button>
                        {!readOnly && (
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Photo info */}
                    <div className="mt-2">
                      {photo.caption && (
                        <p className="text-sm text-gray-700 truncate">{photo.caption}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {format(new Date(photo.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              <button
                onClick={() => setViewingPhoto(null)}
                className="absolute top-4 right-4 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X size={20} />
              </button>
              
              <img
                src={viewingPhoto.photo_url}
                alt={viewingPhoto.caption || 'Batch photo'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              
              <div className="bg-white rounded-lg p-4 mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {PHOTO_TYPES.find(t => t.value === viewingPhoto.photo_type)?.label || viewingPhoto.photo_type}
                    </h3>
                    {viewingPhoto.caption && (
                      <p className="text-gray-600 mt-1">{viewingPhoto.caption}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {format(new Date(viewingPhoto.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => {
                        handleDeletePhoto(viewingPhoto.id);
                        setViewingPhoto(null);
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};