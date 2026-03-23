export function formatDateTime24h(raw: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function formatDateISO(d: Date): string {
    return d.toISOString().split('T')[0];
}

export function formatDateDisplay(d: Date | null): string {
    if (!d) return '-';
    return d.toLocaleDateString('lo-LA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateLao(d: Date | null): string {
    return d
        ? d.toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '-';
}
