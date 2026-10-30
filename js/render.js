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
 *   #tutors-grid         -> all tutors (tutors.html)
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

// Maps a category name to a decorative color+icon class. The class only drives
// a colored icon in CSS; the category text itself is still set via textContent.
// The mapping is a controlled normalization (lowercase, strip spaces/slashes)
// of the category string — never raw innerHTML — and unknown values fall back
// to 'cat-other' so a subject is never left unstyled / showing a plain dot.
function categoryClass(name) {
  switch (String(name).toLowerCase().replace(/[\s/]+/g, '')) {
    case 'math': return 'cat-math';
    case 'science': return 'cat-science';
    case 'english': return 'cat-english';
    case 'historysocialstudies': return 'cat-history';
    case 'worldlanguages': return 'cat-languages';
    case 'computerscience': return 'cat-cs';
    case 'other': return 'cat-other';
    default: return 'cat-other';
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
  category.classList.add(categoryClass(subject.category));
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

// ---- tutors --------------------------------------------------------------

// Derive up-to-two-letter initials from a name for the photo fallback avatar.
function initialsFor(name) {
  var parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return '?';
  }
  var first = parts[0].charAt(0);
  var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

function tutorCard(tutor, categoryByName) {
  var card = document.createElement('article');
  card.className = 'card tutor-card';

  // Photo thumbnail with an initials-avatar fallback if the image is missing.
  var thumb = document.createElement('div');
  thumb.className = 'tutor-thumb';

  var avatar = document.createElement('span');
  avatar.className = 'tutor-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initialsFor(tutor.name);

  if (tutor.photo) {
    var img = document.createElement('img');
    img.className = 'tutor-photo';
    img.setAttribute('src', 'assets/tutors/' + tutor.photo);
    img.setAttribute('alt', tutor.name);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    img.setAttribute('width', '800');
    img.setAttribute('height', '800');
    // If the photo fails to load, drop it so the initials avatar shows through.
    img.addEventListener('error', function () {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
    thumb.appendChild(avatar);
    thumb.appendChild(img);
  } else {
    thumb.appendChild(avatar);
  }
  card.appendChild(thumb);

  var name = document.createElement('h3');
  name.className = 'tutor-name';
  name.textContent = tutor.name;
  card.appendChild(name);

  if (tutor.grade) {
    var grade = document.createElement('p');
    grade.className = 'tutor-grade';
    grade.textContent = tutor.grade;
    card.appendChild(grade);
  }

  // Show achievements (where the subject badges used to be). Only render when
  // a non-empty string is present, so tutors without achievements stay clean.
  if (typeof tutor.achievements === 'string' && tutor.achievements.trim()) {
    var achWrap = document.createElement('p');
    achWrap.className = 'tutor-achievements';

    var achLabel = document.createElement('span');
    achLabel.className = 'tutor-achievements-label';
    achLabel.textContent = 'Achievements: ';
    achWrap.appendChild(achLabel);

    var achText = document.createTextNode(tutor.achievements);
    achWrap.appendChild(achText);

    card.appendChild(achWrap);
  }

  if (tutor.bio) {
    var bio = document.createElement('p');
    bio.className = 'tutor-bio';
    bio.textContent = tutor.bio;
    card.appendChild(bio);
  }

  return card;
}

function renderTutors(container, tutors, categoryByName) {
  clear(container);
  if (!tutors.length) {
    showMessage(container, 'empty-state', 'No tutors listed yet — check back soon!');
    return;
  }
  var grid = document.createElement('div');
  grid.className = 'grid grid-2 grid-3';
  tutors.forEach(function (tutor) {
    grid.appendChild(tutorCard(tutor, categoryByName));
  });
  container.appendChild(grid);
}

async function initTutors() {
  const grid = document.getElementById('tutors-grid');

  if (!grid) {
    return;
  }

  let tutors;
  try {
    tutors = await loadJSON('data/tutors.json');
  } catch (e) {
    showMessage(grid, 'error-state', 'We could not load the tutor list right now — please refresh in a moment.');
    return;
  }

  // Build a subject-name -> category index so each badge can be color-keyed by
  // category. If subjects.json fails to load, badges still render (as
  // cat-other) rather than breaking the tutors grid.
  var categoryByName = {};
  try {
    var subjects = await loadJSON('data/subjects.json');
    if (Array.isArray(subjects)) {
      subjects.forEach(function (s) {
        if (s && s.name) {
          categoryByName[s.name] = s.category;
        }
      });
    }
  } catch (e) {
    categoryByName = {};
  }

  renderTutors(grid, tutors, categoryByName);
}

// ---- boot ----------------------------------------------------------------

function boot() {
  initSubjects();
  initAnnouncements();
  initTutors();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
