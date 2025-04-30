export const normalizeVatId = (vatId: string | undefined): string => {
    if (!vatId) return '';
    
    // Odstránenie medzier a konverzia na veľké písmená
    const normalized = vatId.replace(/\s+/g, '').toUpperCase();
    
    // Ak už začína na SK, vrátime normalizovaný reťazec
    if (normalized.startsWith('SK')) {
        return normalized;
    }
    
    // Ak nezačína na SK, pridáme SK pred číslo
    return `SK${normalized}`;
}; 