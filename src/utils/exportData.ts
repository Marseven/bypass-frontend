/**
 * Fonction utilitaire pour exporter des données au format CSV
 */

/**
 * Convertit un tableau d'objets en CSV
 * @param data - Tableau d'objets à convertir
 * @param headers - En-têtes personnalisés (optionnel, si non fourni, utilise les clés du premier objet)
 * @returns Chaîne CSV
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Si des en-têtes personnalisés sont fournis, les utiliser
  // Sinon, utiliser les clés du premier objet
  const csvHeaders = headers || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Créer la ligne d'en-tête
  const headerRow = csvHeaders.map(h => `"${String(h.label).replace(/"/g, '""')}"`).join(',');

  // Créer les lignes de données
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header.key];
      // Gérer les valeurs null/undefined
      if (value === null || value === undefined) {
        return '""';
      }
      // Convertir en chaîne et échapper les guillemets
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  // Combiner l'en-tête et les données
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Télécharge un fichier CSV
 * @param csvContent - Contenu CSV
 * @param filename - Nom du fichier (sans extension)
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Créer un blob avec le contenu CSV
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Créer un lien de téléchargement
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Ajouter au DOM, cliquer, puis retirer
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer l'URL
  URL.revokeObjectURL(url);
}

/**
 * Exporte des données au format CSV
 * @param data - Tableau d'objets à exporter
 * @param filename - Nom du fichier (sans extension)
 * @param headers - En-têtes personnalisés (optionnel)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  const csvContent = convertToCSV(data, headers);
  downloadCSV(csvContent, filename);
}






