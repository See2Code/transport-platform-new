// Migrácia starých kontaktných údajov v miestach nakládky a vykládky
export const migrateContactData = (places: any[]) => {
    return places?.map(place => ({
        ...place,
        contactPersonName: place.contactPersonName || place.contactPerson || '',
        contactPersonPhone: place.contactPersonPhone || ''
    })) || [];
};

// Rozdelenie kontaktnej osoby na meno a priezvisko
export const splitContactName = (fullName: string) => {
    let kontaktMeno = '';
    let kontaktPriezvisko = '';
    if (fullName) {
        const casti = fullName.trim().split(' ');
        if (casti.length >= 1) {
            kontaktMeno = casti[0];
            kontaktPriezvisko = casti.slice(1).join(' ');
        }
    }
    return { kontaktMeno, kontaktPriezvisko };
}; 