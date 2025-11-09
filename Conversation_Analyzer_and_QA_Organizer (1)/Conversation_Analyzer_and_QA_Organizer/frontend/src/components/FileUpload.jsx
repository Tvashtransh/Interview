import { useState } from 'react';
import { Upload, FileJson, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { uploadFile, processData, triggerConversion } from '../services/api';

const FileUpload = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setStatus(null);
    } else {
      alert('Please select a JSON file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
    
    setUploading(true);
    setUploadProgress(0);
    setStatus({ 
      type: 'info', 
      message: `Uploading large file (${fileSizeMB} MB / ${fileSizeGB} GB)... This may take several minutes. Please keep this tab open and do not close it.` 
    });

    try {
      const result = await uploadFile(file, (percent, loaded, total) => {
        setUploadProgress(percent);
        const loadedMB = (loaded / (1024 * 1024)).toFixed(2);
        const totalMB = (total / (1024 * 1024)).toFixed(2);
        setStatus({ 
          type: 'info', 
          message: `Uploading... ${percent}% (${loadedMB} MB / ${totalMB} MB)` 
        });
      });
      
      setUploadProgress(100);
      setStatus({
        type: 'success',
        message: `File processed successfully! Found ${result.totalChats} chats. Ready for interview analysis.`,
        data: result
      });
    } catch (error) {
      console.error('Upload error details:', error);
      setUploadProgress(0);
      
      if (error.code === 'ECONNRESET' || error.message?.includes('reset') || error.message?.includes('Network Error')) {
        setStatus({
          type: 'error',
          message: 'Network connection was reset. This can happen with very large files. Solutions: 1) Restart both frontend and backend servers, 2) Try uploading directly via backend URL, 3) Split file into smaller chunks.'
        });
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        setStatus({
          type: 'error',
          message: 'Upload timed out. The file might be too large. Please try splitting it into smaller files or contact support.'
        });
      } else {
        setStatus({
          type: 'error',
          message: error.response?.data?.error || error.message || 'Failed to upload file. Please check your connection and try again.'
        });
      }
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  const handleProcess = async () => {
    if (!status?.data) {
      alert('Please upload a file first');
      return;
    }

    setProcessing(true);
    setStatus({ type: 'info', message: 'Analyzing chats for interview relevance... This may take a while.' });

    try {
      const result = await processData();
      
      setStatus({
        type: 'success',
        message: `Processing complete! ${result.totalQuestionsSaved} interview questions saved from ${result.interviewChats} interview chats.`
      });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to process data'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleConversion = async () => {
    setConverting(true);
    setStatus({ 
      type: 'info', 
      message: '🚀 Starting LLM conversion process... Questions will be cleaned, translated, and tagged. Check server console for progress logs (every second). This may take several minutes.' 
    });

    try {
      const result = await triggerConversion();
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: `✅ Conversion started! Processed ${result.result?.processed || 0} questions from chat ${result.result?.chatId || 'N/A'}. Check formatted_question.json file. The process will continue automatically every 5 minutes until all chats are converted.`
        });
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to start conversion'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || error.message || 'Failed to trigger conversion. Make sure backend server is running.'
      });
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <FileJson className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Upload ChatGPT Export
          </h2>
          <p className="text-gray-600">
            Upload your conversations.json file to extract interview questions from chats
          </p>
        </div>

        <div className="space-y-6">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                disabled={uploading || processing}
              />
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading || processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload & Parse File</span>
              </>
            )}
          </button>

          {/* Upload Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress > 10 && (
                  <span className="text-white text-xs font-medium">{uploadProgress}%</span>
                )}
              </div>
            </div>
          )}

          {/* Process Button */}
          {status?.type === 'success' && status.data && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing with AI...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Analyze & Save Interview Questions</span>
                </>
              )}
            </button>
          )}

          {/* LLM Conversion Button */}
          {status?.type === 'success' && (
            <button
              onClick={handleConversion}
              disabled={converting || uploading || processing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4"
            >
              {converting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Converting Questions with LLM... (Check console for progress)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>🚀 Start LLM Conversion Process</span>
                </>
              )}
            </button>
          )}

          {/* Status Message */}
          {status && (
            <div
              className={`p-4 rounded-lg flex items-start space-x-3 ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : status.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-5 h-5 mt-0.5" />
              ) : (
                <Loader2 className="w-5 h-5 mt-0.5 animate-spin" />
              )}
              <div className="flex-1">
                <p className="font-medium">{status.message}</p>
                {status.data && status.type === 'success' && (
                  <p className="text-sm mt-1">
                    Total chats: {status.data.totalChats}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

