(() => {
  const pets = location.pathname.endsWith('pets.html');
  function updateCopy() {
    const pt = sessionStorage.getItem('wow-language') === 'pt_BR';
    document.documentElement.lang = pt ? 'pt-BR' : 'en';
    document.querySelector('[data-nav="pets"]').textContent = pt ? 'Mascotes' : 'Battle pets';
    document.getElementById('catalogue-intro').textContent = pets
      ? (pt ? 'Encontre seu próximo companheiro. Explore famílias, descubra espécies e conheça os mascotes de Azeroth.' : 'Find your next companion. Explore families, discover species and meet the battle pets of Azeroth.')
      : (pt ? 'Encontre seu lugar em Azeroth. Conheça as classes e descubra seu próximo estilo de jogo.' : 'Find your place in Azeroth. Discover the classes and your next playstyle.');
    const upcoming = document.querySelector('[data-upcoming]');
    if (upcoming) upcoming.textContent = pt ? 'Outros recursos · em desenvolvimento' : 'More features · coming soon';
  }
  document.querySelectorAll('button.feature-btn').forEach(button => { button.disabled = true; });
  document.querySelectorAll('.language-btn').forEach(button => button.addEventListener('click', updateCopy));
  const output = document.getElementById('output');
  const observer = new MutationObserver(() => {
    output.setAttribute('aria-busy', output.classList.contains('loading') ? 'true' : 'false');
    output.querySelectorAll('.category-card,.pet-card').forEach(card => {
      if (card.hasAttribute('tabindex')) return;
      card.tabIndex = 0;
      card.setAttribute('role','button');
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); } });
    });
  });
  observer.observe(output, {childList:true,subtree:true});
  updateCopy();
})();
