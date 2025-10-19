export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getPhaseIcon = (status: string): string => {
  const icons: Record<string, string> = {
    'Abgeschlossen': '✅',
    'In Bearbeitung': '⏳',
    'Warten auf Feedback': '⏳',
    'Noch nicht gestartet': '⚪',
  };
  return icons[status] || '⚪';
};

export const getPhaseClass = (status: string): string => {
  if (status === 'Abgeschlossen') return 'completed';
  if (status === 'In Bearbeitung' || status === 'Warten auf Feedback') return 'pending';
  return '';
};