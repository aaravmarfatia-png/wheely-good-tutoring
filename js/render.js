/*
 * render.js — ES module. Fetches and renders data/subjects.json and
 * data/announcements.json.
 *
 * SECURITY RULE: data values are NEVER assigned via innerHTML. Every piece of
 * data-derived text is set with textContent on elements created in code.
 *
 * Container ids this module looks for on the current page (renders only the
 * ones that exist):
 *   #subjects-preview    -> first 6 subjects (home)
 *   #subjects-grid       -> all subjects (schedule); paired with #subject-search
 *   #subject-search      -> live case-insensitive substring filter on name
 *   #announcements-latest-> 3 latest announcements (home)
 *   #announcements-list  -> all announcements (news)
 *
 * fetch() of local JSON only works over http(s), not file://.
 */

// ---- helpers -------------------------------------------------------------

function clear(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function showMessage(container, className, text) {
  clear(container);
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  container.appendChild(p);
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error('Request failed: ' + res.status);
  }
  return res.json();
}

// ---- subjects ------------------------------------------------------------

// Maps a category name to a decorative color-class. The class only drives a
// colored dot in CSS; the category text itself is still set via textContent.
function categoryClass(name) {
  switch (String(name).toLowerCase()) {
    case 'math': return 'cat-math';
    case 'science': return 'cat-science';
    case 'english': return 'cat-english';
    case 'history/social studies': return 'cat-history';
    case 'world languages': return 'cat-languages';
    case 'computer science': return 'cat-cs';
    default: return '';
  }
}

function subjectCard(subject) {
  const card = document.createElement('article');
  card.className = 'card subject-card';

  const heading = document.createElement('h3');
  heading.textContent = subject.name;
  card.appendChild(heading);

  const category = document.createElement('p');
  category.className = 'subject-category';
  const catClass = categoryClass(subject.category);
  if (catClass) {
    category.classList.add(catClass);
  }
  category.textContent = subject.category;
  card.appendChild(category);

  if (Array.isArray(subject.levels) && subject.levels.length) {
    const badges = document.createElement('p');
    badges.className = 'badge-row';
    subject.levels.forEach(function (level) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = level;
      badges.appendChild(badge);
    });
    card.appendChild(badges);
  }

  return card;
}

function renderSubjects(container, subjects) {
  clear(container);
  if (!subjects.length) {
    showMessage(container, 'empty-state', 'No subjects match that search — try another word, or come say hi on Wednesday!');
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'grid grid-2 grid-3';
  subjects.forEach(function (subject) {
    grid.appendChild(subjectCard(subject));
  });
  container.appendChild(grid);
}

async function initSubjects() {
  const preview = document.getElementById('subjects-preview');
  const grid = document.getElementById('subjects-grid');
  const search = document.getElementById('subject-search');

  if (!preview && !grid) {
    return;
  }

  let subjects;
  try {
    subjects = await loadJSON('data/subjects.json');
  } catch (e) {
    if (preview) {
      showMessage(preview, 'error-state', 'We could not load the subject list right now — please refresh in a moment.');
    }
    if (grid) {
      showMessage(grid, 'error-state', 'We could not load the subject list right now — please refresh in a moment.');
    }
    return;
  }

  if (preview) {
    renderSubjects(preview, subjects.slice(0, 6));
  }

  if (grid) {
    const apply = function () {
      const term = search ? search.value.trim().toLowerCase() : '';
      const filtered = term
        ? subjects.filter(function (s) {
            return String(s.name).toLowerCase().indexOf(term) !== -1;
          })
        : subjects;
      renderSubjects(grid, filtered);
    };
    apply();
    if (search) {
      search.addEventListener('input', apply);
    }
  }
}

// ---- announcements -------------------------------------------------------

function sortAnnouncements(items) {
  return items.slice().sort(function (a, b) {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) {
      return bp - ap; // pinned first
    }
    return String(b.date).localeCompare(String(a.date)); // newest first
  });
}

function announcementCard(item) {
  const card = document.createElement('article');
  card.className = 'announcement';

  const header = document.createElement('div');

  const date = document.createElement('span');
  date.className = 'announcement-date';
  date.textContent = item.date;
  header.appendChild(date);

  if (item.pinned) {
    const flag = document.createElement('span');
    flag.className = 'pinned-flag';
    flag.textContent = 'Pinned';
    header.appendChild(flag);
  }
  card.appendChild(header);

  const title = document.createElement('h3');
  title.textContent = item.title;
  card.appendChild(title);

  const body = document.createElement('p');
  body.textContent = item.body;
  card.appendChild(body);

  return card;
}

function renderAnnouncements(container, items) {
  clear(container);
  if (!items.length) {
    showMessage(container, 'empty-state', 'No announcements yet — check back soon!');
    return;
  }
  items.forEach(function (item) {
    container.appendChild(announcementCard(item));
  });
}

async function initAnnouncements() {
  const latest = document.getElementById('announcements-latest');
  const list = document.getElementById('announcements-list');

  if (!latest && !list) {
    return;
  }

  let announcements;
  try {
    announcements = await loadJSON('data/announcements.json');
  } catch (e) {
    if (latest) {
      showMessage(latest, 'error-state', 'We could not load the latest news right now — please refresh in a moment.');
    }
    if (list) {
      showMessage(list, 'error-state', 'We could not load the latest news right now — please refresh in a moment.');
    }
    return;
  }

  const sorted = sortAnnouncements(announcements);

  if (latest) {
    renderAnnouncements(latest, sorted.slice(0, 3));
  }
  if (list) {
    renderAnnouncements(list, sorted);
  }
}

// ---- boot ----------------------------------------------------------------

function boot() {
  initSubjects();
  initAnnouncements();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
