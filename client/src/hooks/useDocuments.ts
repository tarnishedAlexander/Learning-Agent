import { useState, useEffect } from 'react';
import type { Document } from '../interfaces/documentInterface';
import { documentService } from '../services/documentService';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // La funcionalidad de agregar y eliminar documentos será implementada por otro desarrollador

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading
  };
};
