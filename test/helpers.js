// Shared test fixtures: deterministic id generator and a small sample timeline.
export function counterId(prefix = 'id') {
  let n = 0;
  return () => `${prefix}${++n}`;
}

export function sampleTimeline() {
  return {
    title: 'History',
    subtitle: 'Sub',
    theme: 'classic',
    eras: [
      {
        id: 'e1', name: 'Bronze Age', period: '3000-1200 BC', description: 'Bronze tools',
        events: [
          { id: 'v1', date: '3000 BC', title: 'Cities', description: 'First cities' },
          { id: 'v2', date: '1200 BC', title: 'Collapse', description: 'Systems collapse' },
        ],
      },
      { id: 'e2', name: 'Iron Age', period: '1200-500 BC', description: 'Iron tools', events: [] },
      { id: 'e3', name: 'Classical', period: '500 BC-500 AD', description: 'Empires', events: [] },
    ],
  };
}
