(function () {
  'use strict';

  function getContent() { return window.PORTFOLIO || {}; }
  var C = getContent(), S = C.settings || {}, P = C.person || {};
  var root = document.documentElement;
  var showConfirm = S.showPlaceholders === true || new URLSearchParams(window.location.search).get('confirm') === '1';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function $(selector) { return document.querySelector(selector); }
  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null && value !== '') node.textContent = value;
    return node;
  }
  function hasConfirm(value) { return /\[confirm\]/i.test(String(value == null ? '' : value)); }
  function canShow(value) { return value !== undefined && value !== null && value !== '' && (showConfirm || !hasConfirm(value)); }
  function appendValue(parent, tag, className, value) {
    if (!parent || !canShow(value)) return null;
    var node = el(tag, className, value);
    parent.appendChild(node);
    return node;
  }
  function appendSectionHeading(parent, text) {
    return appendValue(parent, 'h3', 'subsection-heading', text);
  }
  function darkName() { return S.darkTheme === 'midnight' ? 'midnight' : 'graphite'; }
  function email() { return (P.emailUser || '') + '@' + (P.emailDomain || ''); }
  function githubUrl() {
    var url = String(P.github || '').trim();
    var parsed;
    try { parsed = new URL(url); } catch (error) { return ''; }
    return parsed.protocol === 'https:' && /^(?:www\.)?github\.com$/i.test(parsed.host) && /^\/[A-Za-z0-9-]+\/?$/.test(parsed.pathname) && !parsed.search && !parsed.hash ? url : '';
  }
  function fd(value) {
    if (!value) return '';
    var parts = String(value).split('-'), month = +parts[1] - 1;
    return parts.length >= 3 && MON[month] ? MON[month] + ' ' + (+parts[2]) + ', ' + parts[0] : '';
  }
  function dateRange(certificate) {
    return certificate.dateEnd ? fd(certificate.date) + ' – ' + fd(certificate.dateEnd) : fd(certificate.date);
  }
  function monthYear(value) {
    var parts = String(value || '').split('-'), month = +parts[1] - 1;
    return parts.length >= 2 && MON[month] ? MON[month] + ' ' + parts[0] : '';
  }
  function normalizeTitle(value) { return String(value || '').trim().toLowerCase(); }
  function certificateType(id) {
    var types = C.certificateTypes || [];
    for (var i = 0; i < types.length; i++) if (types[i].id === id) return types[i].label;
    return id;
  }
  function filteredRecords(records, getTitle) {
    var seen = Object.create(null);
    return (records || []).filter(function (record) {
      var title = getTitle(record), key;
      if (!canShow(title)) return false;
      key = normalizeTitle(title);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function sortCertificatesByDate(records) {
    return records.slice().sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
  }
  function addPhoto(target) {
    if (!target || !S.photo) return;
    var image = new Image();
    image.className = 'photo';
    image.width = 600;
    image.height = 750;
    image.decoding = 'async';
    image.alt = 'Portrait of Jasmine L. Rotugal';
    image.addEventListener('error', function () { image.remove(); });
    image.src = S.photo;
    target.appendChild(image);
  }
  function addCredentialImage(parent, certificate) {
    var frame = el('span', 'credential-media');
    if (!certificate.file) {
      frame.classList.add('is-missing');
      frame.textContent = 'Certificate image unavailable';
      parent.appendChild(frame);
      return;
    }
    var image = new Image();
    image.width = 1200;
    image.height = 800;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = 'Certificate for ' + certificate.title;
    image.addEventListener('error', function () {
      frame.classList.add('is-missing');
      frame.textContent = 'Certificate image unavailable';
    });
    image.src = 'assets/certificates/' + certificate.file;
    frame.appendChild(image);
    parent.appendChild(frame);
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem('theme'); } catch (error) { console.warn('Could not read the saved theme preference.', error); }
  root.setAttribute('data-theme', savedTheme === 'light' ? 'ivory' : savedTheme === 'dark' ? darkName() : (S.defaultTheme || 'graphite'));

  document.addEventListener('DOMContentLoaded', function () {
    var themeButton = $('#theme-toggle');
    function updateThemeButton() {
      if (!themeButton) return;
      var light = root.getAttribute('data-theme') === 'ivory';
      themeButton.textContent = light ? 'Dark view' : 'Light view';
      themeButton.setAttribute('aria-pressed', String(light));
    }
    if (themeButton) {
      updateThemeButton();
      themeButton.addEventListener('click', function () {
        var toLight = root.getAttribute('data-theme') !== 'ivory';
        root.setAttribute('data-theme', toLight ? 'ivory' : darkName());
        try { localStorage.setItem('theme', toLight ? 'light' : 'dark'); } catch (error) { console.warn('Could not save the theme preference.', error); }
        updateThemeButton();
      });
    }
    document.querySelectorAll('[data-bind]').forEach(function (node) {
      var value = node.getAttribute('data-bind').split('.').reduce(function (object, key) {
        return object == null ? object : object[key];
      }, C);
      if (!canShow(value)) {
        var link = node.closest('a');
        if (link) link.remove();
        else node.remove();
        return;
      }
      node.textContent = value;
    });

    var resumeButton = $('#resume-btn');
    if (resumeButton) resumeButton.href = S.resumePdf || 'resume.html';
    var printButton = $('#print-btn');
    if (printButton) printButton.addEventListener('click', function () { window.print(); });

    var photoTarget = S.heroPhoto ? $('#hero-photo') : $('#about-photo');
    addPhoto(photoTarget);

    var aboutText = $('#about-text');
    appendValue(aboutText && aboutText.parentNode, 'p', 'measure', C.about);
    if (aboutText) aboutText.remove();
    var areas = $('#areas');
    (C.areas || []).forEach(function (interest) {
      appendValue(areas, 'p', 'interest-line', interest);
    });

    var skills = $('#skills');
    (C.skills || []).forEach(function (group) {
      var items = (group.items || []).filter(canShow);
      if (!canShow(group.category) || !items.length || !skills) return;
      var row = el('div', 'plain-row skill-row');
      appendValue(row, 'h3', 'row-title', group.category);
      appendValue(row, 'p', 'row-copy', items.join(' · '));
      skills.appendChild(row);
    });

    var certificates = C.certificates || [];
    var featured = filteredRecords(sortCertificatesByDate(certificates.filter(function (certificate) { return certificate.featured; })), function (certificate) { return certificate.title; });
    var featuredTitles = Object.create(null);
    featured.forEach(function (certificate) { featuredTitles[normalizeTitle(certificate.title)] = true; });

    function openCertificate(certificate, trigger) {
      var dialog = $('#modal'), body = $('#modal-body');
      if (!dialog || !body) return;
      lastCertificateButton = trigger;
      body.textContent = '';
      var title = appendValue(body, 'h2', 'dialog-title', certificate.title);
      if (title) title.id = 'modal-title';
      var meta = [certificate.issuer, dateRange(certificate), canShow(certificate.hours) && certificate.hours ? certificate.hours + ' hours' : ''].filter(Boolean).join(' · ');
      appendValue(body, 'p', 'meta', meta);
      appendValue(body, 'p', 'meta', certificate.note);
      if (certificate.file && /\.pdf$/i.test(certificate.file)) {
        var pdfLink = el('a', 'text-link', 'Open PDF');
        pdfLink.href = 'assets/certificates/' + certificate.file;
        pdfLink.target = '_blank';
        pdfLink.rel = 'noopener';
        body.appendChild(pdfLink);
      } else {
        var imageFrame = el('span', 'credential-media dialog-media');
        if (certificate.file) {
          var image = new Image();
          image.width = 1200;
          image.height = 800;
          image.decoding = 'async';
          image.alt = 'Certificate for ' + certificate.title;
          image.addEventListener('error', function () {
            imageFrame.classList.add('is-missing');
            imageFrame.textContent = 'Certificate image unavailable';
          });
          image.src = 'assets/certificates/' + certificate.file;
          imageFrame.appendChild(image);
        } else {
          imageFrame.classList.add('is-missing');
          imageFrame.textContent = 'Certificate image unavailable';
        }
        body.appendChild(imageFrame);
      }
      if (canShow(certificate.verifyUrl) && certificate.verifyUrl) {
        var verify = el('a', 'text-link', 'Verify');
        verify.href = certificate.verifyUrl;
        verify.target = '_blank';
        verify.rel = 'noopener';
        body.appendChild(verify);
      } else if (canShow(certificate.credentialId) && certificate.credentialId) {
        appendValue(body, 'p', 'meta', 'Verify with credential ID: ' + certificate.credentialId);
      }
      if (dialog.showModal) {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }

    function certificateCard(certificate) {
      var card = el('button', 'credential-card');
      card.type = 'button';
      addCredentialImage(card, certificate);
      appendValue(card, 'span', 'credential-title', certificate.title);
      appendValue(card, 'span', 'credential-issuer', certificate.issuer);
      appendValue(card, 'span', 'credential-date', dateRange(certificate));
      card.addEventListener('click', function () { openCertificate(certificate, card); });
      return card;
    }

    var credentialGrid = $('#credentials');
    if (credentialGrid) {
      featured.forEach(function (certificate) {
        credentialGrid.appendChild(certificateCard(certificate));
      });
    }

    var eligible = (C.eligibility || []).filter(function (entry) {
      return canShow(entry.title) && !featuredTitles[normalizeTitle(entry.title)];
    });
    var eligibilityList = $('#eligibility');
    eligible.forEach(function (entry) {
      var row = el('div', 'plain-row');
      appendValue(row, 'h3', 'row-title', entry.title);
      appendValue(row, 'p', 'row-copy', entry.issuer);
      if (canShow(entry.date) && fd(entry.date)) appendValue(row, 'p', 'row-copy', (entry.completed ? 'Completed ' : '') + fd(entry.date));
      if (eligibilityList) eligibilityList.appendChild(row);
    });
    appendValue($('#elig-note'), 'span', '', C.eligibilityNote);

    var dialog = $('#modal'), lastCertificateButton = null;
    if (dialog) {
      var closeButton = $('#modal-close');
      if (closeButton) closeButton.addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', function () {
        if (lastCertificateButton) lastCertificateButton.focus();
      });
    }

    var certificateCount = $('#cert-count');
    if (certificateCount) certificateCount.textContent = '(' + certificates.length + ')';
    var certificateList = $('#cert-list'), filterList = $('#filters'), status = $('#cert-status');
    if (certificateList && filterList && status) {
      var allCertificates = filteredRecords(sortCertificatesByDate(certificates), function (certificate) { return certificate.title; });
      function renderCertificates(type) {
        certificateList.textContent = '';
        var matching = allCertificates.filter(function (certificate) { return type === 'all' || certificate.type === type; });
        matching.forEach(function (certificate) { certificateList.appendChild(certificateCard(certificate)); });
        status.textContent = 'Showing ' + matching.length + ' of ' + allCertificates.length;
        filterList.querySelectorAll('button').forEach(function (button) {
          button.setAttribute('aria-pressed', String(button.getAttribute('data-type') === type));
        });
      }
      if (allCertificates.length) {
        var types = ['all'];
        (C.certificateTypes || []).forEach(function (type) {
          if (allCertificates.some(function (certificate) { return certificate.type === type.id; })) types.push(type.id);
        });
        types.forEach(function (type) {
          var filter = el('button', 'filter-button', type === 'all' ? 'All' : certificateType(type));
          filter.type = 'button';
          filter.setAttribute('data-type', type);
          filter.addEventListener('click', function () { renderCertificates(type); });
          filterList.appendChild(filter);
        });
        renderCertificates('all');
      }
    }

    function appendProjectImage(parent, project, filename) {
      var image = new Image();
      image.width = 800;
      image.height = 500;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = 'Screenshot of ' + project.title;
      image.addEventListener('error', function () { image.remove(); });
      image.src = 'assets/projects/' + filename;
      parent.appendChild(image);
    }
    function projectCard(project, full) {
      if (!canShow(project.title) || !canShow(project.status)) return null;
      var card = el('article', 'project-card');
      appendValue(card, 'h3', 'project-title', project.title);
      var metadata = [canShow(project.type) ? project.type : '', canShow(project.year) ? project.year : ''].filter(Boolean).join(' · ');
      appendValue(card, 'p', 'project-meta', metadata);
      appendValue(card, 'p', 'project-status', project.status);
      appendValue(card, 'p', 'project-summary', project.summary);
      if (full) {
        [['Role', project.role], ['Technologies', project.technologies], ['Features', project.features], ['Contributions', project.contributions]].forEach(function (field) {
          var values = Array.isArray(field[1]) ? field[1].filter(canShow) : canShow(field[1]) && field[1] ? [field[1]] : [];
          if (!values.length) return;
          appendSectionHeading(card, field[0]);
          values.forEach(function (value) { appendValue(card, 'p', 'project-detail', value); });
        });
        (project.screenshots || []).filter(canShow).concat(canShow(project.image) && project.image ? [project.image] : []).forEach(function (filename) {
          appendProjectImage(card, project, filename);
        });
      }
      if (canShow(project.link) && project.link) {
        var link = el('a', 'text-link', 'Project link');
        link.href = project.link;
        link.target = '_blank';
        link.rel = 'noopener';
        card.appendChild(link);
      }
      return card;
    }

    var projects = C.projects || [];
    var homeProjects = $('#projects');
    if (homeProjects) {
      filteredRecords(projects.filter(function (project) { return project.featured; }), function (project) { return project.title; }).forEach(function (project) {
        var card = projectCard(project, false);
        if (card) homeProjects.appendChild(card);
      });
    }
    var projectList = $('#project-list');
    if (projectList) {
      filteredRecords(projects, function (project) { return project.title; }).forEach(function (project) {
        var card = projectCard(project, true);
        if (card) projectList.appendChild(card);
      });
    }

    var education = $('#education'), educationRows = (C.education || []).filter(function (entry) {
      return canShow(entry.school) && entry.school;
    });
    if (education && educationRows.length) {
      appendSectionHeading(education, 'Education');
      educationRows.forEach(function (entry) {
        var row = el('div', 'plain-row');
        appendValue(row, 'h3', 'row-title', entry.school);
        appendValue(row, 'p', 'row-copy', entry.program);
        appendValue(row, 'p', 'row-copy', entry.years);
        education.appendChild(row);
      });
    }

    var experience = $('#experience'), experienceData = C.experience || {}, emptyText = experienceData.emptyText || {};
    if (experience) {
      var groups = [
        ['work', 'Work experience'],
        ['internship', 'Internship'],
        ['volunteer', 'Volunteer'],
        ['handsOn', 'Hands-on practice']
      ];
      var visibleGroups = [];
      groups.forEach(function (group) {
        var items = (experienceData[group[0]] || []).filter(function (item) {
          return typeof item === 'string' ? canShow(item) : canShow(item.title) && canShow(item.detail);
        });
        var empty = canShow(emptyText[group[0]]) ? emptyText[group[0]] : '';
        if (items.length || empty) visibleGroups.push({ label: group[1], items: items, empty: empty });
      });
      if (visibleGroups.length) {
        appendSectionHeading(experience, 'Experience');
        visibleGroups.forEach(function (group) {
          var row = el('div', 'plain-row');
          appendValue(row, 'h3', 'row-title', group.label);
          if (group.items.length) {
            group.items.forEach(function (item) {
              var detail = typeof item === 'string' ? item : [canShow(item.title) ? item.title : '', canShow(item.detail) ? item.detail : ''].filter(Boolean).join(': ');
              appendValue(row, 'p', 'row-copy', detail);
            });
          } else {
            appendValue(row, 'p', 'row-copy', group.empty);
          }
          experience.appendChild(row);
        });
      }
    }

    var leadershipHost = $('#leadership');
    var leaders = (C.leadership || []).filter(function (entry) {
      return entry.confirmed === true && canShow(entry.role) && canShow(entry.org) && canShow(entry.years);
    });
    if (leadershipHost && leaders.length) {
      appendSectionHeading(leadershipHost, 'Leadership');
      leaders.forEach(function (entry) {
        appendValue(leadershipHost, 'p', 'plain-row row-copy', [entry.role, entry.org, entry.years].join(', '));
      });
    }

    var moreLinks = $('#more-links');
    if (moreLinks) {
      (C.links || []).forEach(function (link) {
        if (!canShow(link.label) || !link.label || (!canShow(link.url) && !showConfirm)) return;
        var item = el('li');
        if (!link.url || hasConfirm(link.url)) {
          if (!showConfirm) return;
          appendValue(item, 'span', 'meta', link.label + ' (not set yet) [confirm]');
        } else if (canShow(link.url)) {
          var anchor = el('a', '', link.label);
          anchor.href = link.url;
          item.appendChild(anchor);
        }
        if (!item.childNodes.length) return;
        appendValue(item, 'span', 'meta', link.description);
        moreLinks.appendChild(item);
      });
    }

    var contactLine = $('#contact-line');
    if (contactLine && canShow(P.contactLine)) contactLine.textContent = P.contactLine;
    else if (contactLine) contactLine.remove();
    var contactInfo = $('#contact-info');
    if (contactInfo) {
      var mail = el('a', 'contact-email', email());
      mail.href = 'mailto:' + email();
      contactInfo.appendChild(mail);
      var copyButton = el('button', 'copy-button', 'Copy email');
      copyButton.type = 'button';
      copyButton.addEventListener('click', function () {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          copyButton.textContent = 'Copy unavailable';
          return;
        }
        navigator.clipboard.writeText(email()).then(function () {
          copyButton.textContent = 'Email copied';
        }, function () {
          copyButton.textContent = 'Copy failed';
        });
      });
      contactInfo.appendChild(copyButton);
      var github = githubUrl();
      var linkedin = canShow(P.linkedin) ? String(P.linkedin || '').trim() : '';
      var socialLinks = el('div', 'social-links');
      if (github) {
        var githubLink = el('a', '', 'GitHub');
        githubLink.href = github;
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        socialLinks.appendChild(githubLink);
      }
      if (linkedin) {
        var linkedinLink = el('a', '', 'LinkedIn');
        linkedinLink.href = linkedin;
        linkedinLink.target = '_blank';
        linkedinLink.rel = 'noopener noreferrer';
        socialLinks.appendChild(linkedinLink);
      }
      if (socialLinks.childNodes.length) contactInfo.appendChild(socialLinks);
    }
    var contactForm = $('#contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var data = new FormData(contactForm);
        window.location.href = 'mailto:' + email() + '?subject=' + encodeURIComponent('Portfolio message from ' + data.get('name')) + '&body=' + encodeURIComponent(data.get('message') + '\n\n' + data.get('name') + ' (' + data.get('email') + ')');
      });
    }

    var resumeBody = $('#resume-body');
    if (resumeBody) {
      function resumeSection(title) {
        var section = el('div', 'resume-section');
        appendValue(section, 'h2', '', title);
        resumeBody.appendChild(section);
        return section;
      }
      function resumeList(section, values) {
        var list = el('ul', 'resume-list');
        values.forEach(function (value) { appendValue(list, 'li', '', value); });
        if (list.childNodes.length) section.appendChild(list);
      }
      var objective = C.resume && C.resume.objective ? C.resume.objective : 'Building cybersecurity and network security skills through BSIT studies and Cisco Networking Academy training.';
      if (canShow(objective)) appendValue(resumeSection('Objective'), 'p', '', objective);
      var educationValues = (C.education || []).filter(function (entry) {
        return canShow(entry.school) && entry.school && canShow(entry.program) && entry.program;
      }).map(function (entry) {
        return entry.school + ' — ' + entry.program + (canShow(entry.years) && entry.years ? ' (' + entry.years + ')' : '');
      });
      if (educationValues.length) resumeList(resumeSection('Education'), educationValues);
      var skillValues = (C.skills || []).filter(function (group) {
        return canShow(group.category) && (group.items || []).some(canShow);
      }).map(function (group) {
        var terms = {
          'Security': ['Cybersecurity', 'cyber threat management', 'network security'],
          'Cloud and AI': ['cloud computing basics', 'AI ethics and responsible use'],
          'Awareness': ['data privacy', 'safe digital transactions', 'grooming awareness'],
          'Professional': ['continuous learning', 'research', 'documentation']
        }[group.category];
        return group.category + ': ' + (terms || group.items.filter(canShow)).join('; ');
      });
      if (skillValues.length) resumeList(resumeSection('Skills'), skillValues);
      var resumeCertificates = filteredRecords(certificates.filter(function (certificate) {
        return certificate.featured && canShow(certificate.issuer) && canShow(certificate.date);
      }), function (certificate) { return certificate.title; });
      if (resumeCertificates.length) {
        var certifications = resumeSection('Certifications');
        resumeList(certifications, resumeCertificates.map(function (certificate) {
          return certificate.title + ', ' + certificate.issuer + ', ' + monthYear(certificate.date);
        }));
        appendValue(certifications, 'p', '', 'More certificates are on the portfolio.');
      }
      var resumeProjects = filteredRecords(projects.filter(function (project) {
        return canShow(project.status) && canShow(project.summary);
      }), function (project) { return project.title; }).slice(0, 3);
      if (resumeProjects.length) resumeList(resumeSection('Projects'), resumeProjects.map(function (project) {
        return project.title + ' — ' + project.status + (project.summary && /not built/i.test(project.summary) ? '; Not built' : '');
      }));
      var resumeLeaders = leaders.filter(function (entry) { return canShow(entry.role) && canShow(entry.org) && canShow(entry.years); });
      if (resumeLeaders.length) resumeList(resumeSection('Leadership'), resumeLeaders.map(function (entry) {
        return entry.role + ', ' + entry.org + ', ' + entry.years;
      }));
      var contactSection = resumeSection('Contact');
      var resumeEmail = el('a', '', email());
      resumeEmail.href = 'mailto:' + email();
      contactSection.appendChild(resumeEmail);
      if (githubUrl()) {
        contactSection.appendChild(document.createTextNode(' | '));
        var resumeGithub = el('a', '', githubUrl());
        resumeGithub.href = githubUrl();
        contactSection.appendChild(resumeGithub);
      }
      if (canShow(P.linkedin) && P.linkedin) {
        contactSection.appendChild(document.createTextNode(' | '));
        var resumeLinkedin = el('a', '', P.linkedin);
        resumeLinkedin.href = P.linkedin;
        contactSection.appendChild(resumeLinkedin);
      }
      if (canShow(P.location) && P.location) contactSection.appendChild(document.createTextNode(' | ' + P.location));
    }
  });
})();
