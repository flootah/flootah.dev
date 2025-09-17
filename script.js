// jsons
const navJson = '/src/json/nav.json';

async function generateNavBars(jsonUrl) {
  const topContainerId = 'nav';
  const botContainerId = 'footer';

  try {
    // get stuff from json
    const response = await fetch(jsonUrl);
    if (!response.ok) throw new Error('Failed to load navbar JSON');

    const navJson = await response.json();
    const topNavItems = navJson.topnav.items;
    const botNavItems = navJson.botnav.items;
    const topnav_container = document.getElementById(topContainerId);
    const botnav_container = document.getElementById(botContainerId);

    if (!topnav_container) throw new Error('Top container not found!');
    if (!botnav_container) throw new Error('Bottom container not found!');

    // make the top nav
    topNavItems.forEach(item => {
      const a = document.createElement('a');
      a.href = item.link;
      a.textContent = item.title;
      topnav_container.appendChild(a);
      const separator = document.createTextNode(' / ');
      if(item !== topNavItems[topNavItems.length - 1]) {
          topnav_container.appendChild(separator);
      }
    });

    const linksdiv = document.createElement('div');
    linksdiv.id = 'links';
    botnav_container.appendChild(linksdiv);

    // make the bottom nav
    botNavItems.forEach(item => {
      const a = document.createElement('a');
      a.href = item.link;
      a.textContent = item.title;
      linksdiv.appendChild(a);
      const separator = document.createTextNode(' / ');
      if(item !== botNavItems[botNavItems.length - 1]) {
          linksdiv.appendChild(separator);      // only add separator if not last item
      }
    });
  } catch (err) {
    console.error('Navbar generation error:', err);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  generateNavBars(navJson); // make navbars
});