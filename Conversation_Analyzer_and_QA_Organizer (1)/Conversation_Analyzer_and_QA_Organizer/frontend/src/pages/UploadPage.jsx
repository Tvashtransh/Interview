import FileUpload from '../components/FileUpload';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    // Navigate to HR dashboard after successful upload
    setTimeout(() => {
      navigate('/hr/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <FileUpload onUploadComplete={handleUploadComplete} />
    </div>
  );
};

export default UploadPage;

