import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DatabaseFile {
  id: string;
  filename: string;
  file_type: string | null;
  file_size: number | null;
  file_path: string;
  uploaded_by: string | null;
  download_count: number | null;
  created_at: string;
  title?: string | null;
  description?: string | null;
  is_public?: boolean | null;
}

interface FileViewerProps {
  file: DatabaseFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FileViewer = ({ file, isOpen, onClose }: FileViewerProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!file) return null;

  const getFileType = (filename: string, mimeType?: string | null) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    }
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    }
    if (['doc', 'docx'].includes(extension || '')) {
      return 'word';
    }
    return 'other';
  };

  const fileType = getFileType(file.filename, file.file_type);

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Get the file URL from Supabase Storage
      const { data } = supabase.storage
        .from('files')
        .getPublicUrl(file.file_path);

      if (!data?.publicUrl) {
        toast({
          title: "Download failed",
          description: "Could not get file URL",
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.download = file.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count
      await supabase
        .from('files')
        .update({ download_count: (file.download_count || 0) + 1 })
        .eq('id', file.id);

      toast({
        title: "Download started",
        description: `Downloading ${file.filename}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-6 w-6" />;
      case 'pdf':
        return <FileText className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const renderFileContent = () => {
    const { data } = supabase.storage.from('files').getPublicUrl(file.file_path);
    const fileUrl = data.publicUrl;

    switch (fileType) {
      case 'image':
        return (
          <div className="flex justify-center items-center min-h-[400px] bg-muted/20 rounded-lg">
            <img
              src={fileUrl}
              alt={file.filename}
              className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="w-full h-[600px] border rounded-lg overflow-hidden">
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full"
              title={file.filename}
            />
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/20 rounded-lg space-y-4">
            {getFileIcon()}
            <div className="text-center">
              <p className="font-medium">{file.filename}</p>
              <p className="text-sm text-muted-foreground">
                {file.file_type || 'Unknown file type'}
              </p>
              <p className="text-sm text-muted-foreground">
                {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
              </p>
            </div>
            <Button onClick={handleDownload} disabled={loading} className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Downloading...' : 'Download File'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <div>
              <DialogTitle className="text-lg">{file.title || file.filename}</DialogTitle>
              {file.description && (
                <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Downloading...' : 'Download'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[calc(90vh-100px)]">
          {renderFileContent()}
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
          <span>
            Downloads: {file.download_count || 0}
          </span>
          <span>
            Uploaded: {new Date(file.created_at).toLocaleDateString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};