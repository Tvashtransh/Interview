const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Upload file
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent, e.loaded, e.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('POST', `${API_URL}/upload/upload`);
    xhr.send(formData);
  });
};

// Process data
export const processData = async () => {
  const response = await fetch(`${API_URL}/upload/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process data');
  }

  return response.json();
};

// Trigger conversion
export const triggerConversion = async () => {
  const response = await fetch(`${API_URL}/convert/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to trigger conversion');
  }

  return response.json();
};

// Get formatted questions
export const getFormattedQuestions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const response = await fetch(`${API_URL}/formatted-questions?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }

  return response.json();
};

// Get tags
export const getTags = async () => {
  const response = await fetch(`${API_URL}/formatted-questions/tags`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }

  return response.json();
};

