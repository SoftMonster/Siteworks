document.querySelectorAll('a[href*="/market/listings/"]').forEach(a => {
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
});
