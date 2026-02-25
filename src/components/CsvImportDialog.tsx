import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import api from '../axios';

export type ImportType = 'zones' | 'equipment' | 'sensors';

interface ImportResult {
  success: boolean;
  message: string;
  imported_count?: number;
  errors?: string[];
  data?: any[];
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: ImportType;
  onImportSuccess?: () => void;
}

const importTypeLabels: Record<ImportType, { singular: string; plural: string; description: string }> = {
  zones: {
    singular: 'Zone',
    plural: 'Zones',
    description: 'Importez vos zones depuis un fichier CSV'
  },
  equipment: {
    singular: 'Équipement',
    plural: 'Équipements',
    description: 'Importez vos équipements depuis un fichier CSV'
  },
  sensors: {
    singular: 'Capteur',
    plural: 'Capteurs',
    description: 'Importez vos capteurs depuis un fichier CSV'
  }
};

const CsvImportDialog: React.FC<CsvImportDialogProps> = ({
  open,
  onOpenChange,
  importType,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importInfo, setImportInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const labels = importTypeLabels[importType] || { singular: 'Élément', plural: 'Éléments', description: 'Importez depuis un fichier CSV' };

  // Charger les infos d'import au premier rendu
  React.useEffect(() => {
    if (open && !importInfo) {
      fetchImportInfo();
    }
  }, [open, importType]);

  const fetchImportInfo = async () => {
    setIsLoadingInfo(true);
    try {
      const response = await api.get(`/import/info/${importType}`);
      setImportInfo(response.data);
    } catch (error) {
      console.error('Error fetching import info:', error);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setResult({
          success: false,
          message: 'Veuillez sélectionner un fichier CSV valide'
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        setResult({
          success: false,
          message: 'Veuillez sélectionner un fichier CSV valide'
        });
        return;
      }
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/import/${importType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        }
      });

      setResult({
        success: true,
        message: response.data.message || `Import réussi`,
        imported_count: response.data.imported_count,
        data: response.data.data
      });

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      setResult({
        success: false,
        message: errorData?.message || 'Une erreur est survenue lors de l\'import',
        errors: errorData?.errors || []
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/import/template/${importType}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_${importType}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importer des {labels.plural}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {labels.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="space-y-4 p-1">
            {/* Informations sur l'import */}
            {isLoadingInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : importInfo && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Format attendu</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="text-sm mb-2">Colonnes requises :</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {importInfo.required_columns?.map((col: string) => (
                      <Badge key={col} variant="default" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                  {importInfo.optional_columns?.length > 0 && (
                    <>
                      <p className="text-sm mb-2 mt-3">Colonnes optionnelles :</p>
                      <div className="flex flex-wrap gap-1">
                        {importInfo.optional_columns.map((col: string) => (
                          <Badge key={col} variant="outline" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Zone de dépôt de fichier */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-primary" />
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} Ko
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResult(null);
                    }}
                    className="mt-2"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="font-medium text-sm">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ou cliquez pour sélectionner un fichier
                  </p>
                </div>
              )}
            </div>

            {/* Barre de progression */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Import en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Résultat de l'import */}
            {result && (
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.success ? 'Import réussi' : 'Erreur d\'import'}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <p>{result.message}</p>
                  {result.imported_count !== undefined && (
                    <p className="mt-1 font-medium">
                      {result.imported_count} {result.imported_count > 1 ? labels.plural.toLowerCase() : labels.singular.toLowerCase()} importé(s)
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">Erreurs détectées :</p>
                      <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger le modèle
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1 sm:flex-none"
            >
              Fermer
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1 sm:flex-none gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importer
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvImportDialog;
