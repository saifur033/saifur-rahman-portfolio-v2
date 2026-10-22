import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Studio3D } from './Studio3D';
import { QuickPanel } from './QuickPanel';
import { PreviewDialog } from './PreviewDialog';
import { ClubDetailModal } from './ClubDetailModal';
import { ContentItem } from '../types';
import { translations } from '../i18n/translations';

interface PublicPortfolioProps {
  onOpenStudio: () => void;
}

export const PublicPortfolio: React.FC<PublicPortfolioProps> = ({ onOpenStudio }) => {
  const {
    profile,
    settings,
    lang,
    toggleTheme,
    toggleLang,
    shortlist,
    toggleShortlist,
    getItems,
    createMessage,
  } = usePortfolio();

  const t = translations[lang] || translations.en;

  // State
  const [selectedRoute, setSelectedRoute] = useState<'journey' | 'research'>('journey');
  const [tourStatus, setTourStatus] = useState<string>(
    lang === 'bn' ? 'ঘুরে দেখতে একটি রুম নির্বাচন করুন।' : 'Choose a room to begin exploring.'
  );
  const [guideSpeech, setGuideSpeech] = useState<string>(
    profile.welcome_text || t.hero.welcomeDefault
  );

  // Filters & Search
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [certSearch, setCertSearch] = useState<string>('');

  // Modals
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    imageSrc?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const [selectedClub, setSelectedClub] = useState<ContentItem | null>(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
    website_hp: '',
  });
  const [contactFeedback, setContactFeedback] = useState<string>(t.contact.defaultFeedback);
  const [contactLoading, setContactLoading] = useState(false);

  // Items
  const clubs = getItems('club');
  const activities = getItems('activity');
  const projects = getItems('project');
  const publications = getItems('publication');
  const certificates = getItems('certificate');
  const crests = getItems('crest');
  const gallery = getItems('gallery');
  const skills = getItems('skill');
  const career = getItems('career');
  const categories = getItems('category');
  const blocks = getItems('block');

  // Metrics
  const counts = {
    clubs: clubs.length,
    meetings: activities.filter((x) => x.data?.type === 'Meeting').length,
    events: activities.length,
    projects: projects.length,
    publications: publications.length,
    certificates: certificates.length,
    crests: crests.length,
  };

  // Gallery categories
  const clubsById = Object.fromEntries(clubs.map((c) => [String(c.id), c.title]));
  const galleryCategories = Array.from(
    new Set(
      gallery.map((g) => g.data.gallery_category || clubsById[String(g.data.club_id)] || 'Events')
    )
  );

  const navigateToSection = (roomId: string, opts?: { scroll?: boolean }) => {
    const section = document.getElementById(roomId);
    if (!section) return;

    // Highlight room panel
    document.querySelectorAll('.room-panel').forEach((p) => p.classList.remove('room-current'));
    section.classList.add('room-current');

    if (opts?.scroll !== false) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartTour = () => {
    const firstRoom = selectedRoute === 'research' ? 'projects' : 'about';
    if ((window as any).sr3dNavigate) {
      (window as any).sr3dNavigate(firstRoom);
    } else {
      navigateToSection(firstRoom);
    }
  };

  const handleRouteSelect = (route: 'journey' | 'research') => {
    setSelectedRoute(route);
    const startsAtProjects = route === 'research';
    const start = startsAtProjects ? t.rooms.projects : t.rooms.about;
    setTourStatus(
      lang === 'bn' ? `গাইড ${start} থেকে শুরু করবে।` : `The guide will begin at ${start}.`
    );
    setGuideSpeech(
      startsAtProjects
        ? (lang === 'bn' ? 'চলুন প্রজেক্ট ও গবেষণা ঘুরে দেখি।' : 'Let’s explore projects and research.')
        : (lang === 'bn' ? 'চলুন পেশাগত যাত্রা ঘুরে দেখি।' : 'Let’s explore the professional journey.')
    );
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.website_hp) {
      setContactFeedback(lang === 'bn' ? 'বার্তা গ্রহণ করা হয়নি।' : 'Message not accepted.');
      return;
    }
    setContactLoading(true);
    const res = await createMessage(contactForm.name, contactForm.email, contactForm.message);
    setContactLoading(false);
    if (res.ok) {
      setContactFeedback(
        res.message ||
          (lang === 'bn' ? 'ধন্যবাদ। আপনার বার্তাটি সফলভাবে পৌঁছাল।' : 'Thank you. Your message has been received.')
      );
      setContactForm({ name: '', email: '', message: '', website_hp: '' });
    } else {
      setContactFeedback(
        res.error ||
          (lang === 'bn' ? 'বার্তা পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।' : 'The message could not be sent. Please try again.')
      );
    }
  };

  // Filtered lists
  const filteredProjects = projects.filter((p) => {
    if (projectFilter === 'all') return true;
    const cat = (p.data.category || '').toLowerCase();
    return cat === projectFilter.toLowerCase();
  });

  const filteredGallery = gallery.filter((g) => {
    if (galleryFilter === 'all') return true;
    const cat = (g.data.gallery_category || clubsById[String(g.data.club_id)] || 'Events').toLowerCase();
    return cat === galleryFilter.toLowerCase();
  });

  const filteredCerts = certificates.filter((c) => {
    if (!certSearch.trim()) return true;
    const q = certSearch.toLowerCase();
    const searchTarget = `${c.title} ${c.data.issuer || ''} ${c.data.category || ''} ${c.data.issue_date || ''}`.toLowerCase();
    return searchTarget.includes(q);
  });

  return (
    <>
      <a className="skip" href="#main">
        {t.nav.skip}
      </a>

      {/* Topbar */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Portfolio home">
          SR<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#about">{t.nav.about}</a>
          <a href="#projects">{t.nav.projects}</a>
          <a href="#publications">{t.nav.publications}</a>
          <a href="#outreach">{t.nav.outreach}</a>
          <a href="#certificates">{t.nav.certificates}</a>
          <a href="#contact">{t.nav.contact}</a>
        </nav>
        <div className="top-actions">
          <button
            type="button"
            className="lang"
            onClick={toggleLang}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>
          <button
            className="icon-button"
            id="themeToggle"
            type="button"
            aria-label={t.nav.themeToggle}
            onClick={toggleTheme}
          >
            ◐
          </button>
          <button
            type="button"
            className="btn"
            style={{ padding: '4px 12px', fontSize: '0.85rem' }}
            onClick={onOpenStudio}
          >
            {t.nav.studio}
          </button>
        </div>
      </header>

      <main id="main">
        {/* Hero Section */}
        <section className="hero" id="top" aria-labelledby="heroTitle">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1 id="heroTitle">{profile.name || 'Saifur Rahman'}</h1>
            {profile.role && <h2>{profile.role}</h2>}
            {profile.degree && (
              <p className="subline">
                {profile.degree}
                {profile.university ? ` · ${profile.university}` : ''}
              </p>
            )}
            {profile.tagline && <p className="tagline">{profile.tagline}</p>}
            {profile.about && <p className="hero-about">{profile.about}</p>}

            <div className="hero-actions">
              <button className="btn primary" id="startTour" type="button" onClick={handleStartTour}>
                {t.hero.exploreWithGuide}
              </button>
              <button
                className="btn"
                id="quickView"
                type="button"
                aria-expanded={quickPanelOpen}
                onClick={() => setQuickPanelOpen(true)}
              >
                {t.hero.quickView}
              </button>
              {profile.cv_filename && (
                <>
                  <a
                    className="btn"
                    href={profile.cv_filename}
                    download="SAIFUR_RAHMAN_Resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.hero.downloadCv}
                  </a>
                  <a
                    className="btn"
                    href={profile.cv_filename}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.hero.viewCv}
                  </a>
                </>
              )}
              <a className="btn" href="#contact">
                {t.hero.contact}
              </a>
            </div>

            <div className="route-picker" aria-label="Choose a guided tour">
              <strong>{t.hero.chooseRoute}</strong>
              <div>
                <button
                  className={`route-btn ${selectedRoute === 'journey' ? 'active' : ''}`}
                  type="button"
                  aria-pressed={selectedRoute === 'journey'}
                  onClick={() => handleRouteSelect('journey')}
                >
                  {t.hero.professionalJourney}
                </button>
                <button
                  className={`route-btn ${selectedRoute === 'research' ? 'active' : ''}`}
                  type="button"
                  aria-pressed={selectedRoute === 'research'}
                  onClick={() => handleRouteSelect('research')}
                >
                  {t.hero.projectsResearch}
                </button>
              </div>
            </div>

            <p className="speech" id="guideSpeech" aria-live="polite">
              {guideSpeech}
            </p>
          </div>

          {/* 3D Studio Canvas */}
          {settings.enable_3d_studio !== false && (
            <Studio3D
              guideDialogue={profile.guide_dialogue}
              onNavigateToSection={navigateToSection}
              selectedRoute={selectedRoute}
              tourStatus={tourStatus}
              setTourStatus={setTourStatus}
              guideSpeech={guideSpeech}
              setGuideSpeech={setGuideSpeech}
            />
          )}
        </section>

        {/* Metrics Section */}
        <section className="metrics" aria-label="Published portfolio totals">
          {[
            { key: 'clubs', label: t.metrics.clubs, count: counts.clubs },
            { key: 'meetings', label: t.metrics.meetings, count: counts.meetings },
            { key: 'events', label: t.metrics.activities, count: counts.events },
            { key: 'projects', label: t.metrics.projects, count: counts.projects },
            { key: 'publications', label: t.metrics.publications, count: counts.publications },
            { key: 'certificates', label: t.metrics.certificates, count: counts.certificates },
            { key: 'crests', label: t.metrics.crests, count: counts.crests },
          ].map((metric) => (
            <div key={metric.key}>
              <strong>{metric.count}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </section>

        {/* Content Grid */}
        <section className="content-grid" aria-label="Portfolio">
          {/* 01 About & Career */}
          <article className="room-panel section-about" id="about" aria-labelledby="aboutTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.about.number}</span>
              <h2 id="aboutTitle">{t.about.title}</h2>
              <a href="#contact">{t.about.contactLink}</a>
            </div>
            <div className="about-feature">
              {profile.photo_filename ? (
                <img className="profile-photo" src={profile.photo_filename} alt="Profile portrait" />
              ) : (
                <div className="avatar-placeholder" aria-hidden="true">
                  {(profile.name || 'SR').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="about-copy">
                <p className="section-kicker">{t.about.profileKicker}</p>
                {profile.name && <h3>{profile.name}</h3>}
                {(profile.role || profile.company) && (
                  <p className="muted">
                    {profile.role || ''}
                    {profile.role && profile.company ? ' · ' : ''}
                    {profile.company || ''}
                  </p>
                )}
                {profile.about ? (
                  <p>{profile.about}</p>
                ) : (
                  <p className="muted">
                    {lang === 'bn' ? 'প্রোফাইলের বিবরণ এখনও প্রকাশিত হয়নি।' : 'Profile details have not been published yet.'}
                  </p>
                )}
                {profile.professional_summary && profile.professional_summary !== profile.about && (
                  <p>{profile.professional_summary}</p>
                )}
                {profile.interests && (
                  <p>
                    <strong>{lang === 'bn' ? 'মূল আগ্রহ ও ক্ষেত্র:' : 'Core Interests & Focus:'}</strong> {profile.interests}
                  </p>
                )}
                {(profile.degree || profile.university) && (
                  <p>
                    <strong>{t.about.educationLabel}</strong> · {profile.degree || ''}
                    {profile.degree && profile.university ? ' · ' : ''}
                    {profile.university || ''}
                  </p>
                )}
                {profile.education_summary && (
                  <p className="muted" style={{ fontSize: '0.95rem' }}>{profile.education_summary}</p>
                )}
              </div>
              <div className="skills-block">
                <h3 className="subheading">{t.about.skillsHeading}</h3>
                <div className="chips">
                  {skills.length > 0 ? (
                    skills.map((s) => (
                      <span key={s.id}>
                        {s.title}
                        {s.data?.level && <small>{s.data.level}</small>}
                      </span>
                    ))
                  ) : (
                    <p className="empty">{t.about.noSkills}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="timeline-wrap">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">{t.about.theJourneyKicker}</p>
                  <h3>{t.about.careerHeading}</h3>
                </div>
                <span>
                  {career.length} {t.about.milestonesCount}
                </span>
              </div>
              <div className="career-timeline">
                {career.length > 0 ? (
                  career.map((item, idx) => (
                    <details className="career-milestone" key={item.id} open={idx === 0}>
                      <summary>
                        <span className="timeline-marker" aria-hidden="true"></span>
                        <span className="milestone-period">{item.data?.period || ''}</span>
                        <span className="milestone-title">{item.title}</span>
                        <span className="milestone-org">{item.data?.organization || ''}</span>
                        <span className="milestone-type">{item.data?.type || 'Milestone'}</span>
                      </summary>
                      {item.data?.description && <p>{item.data.description}</p>}
                    </details>
                  ))
                ) : (
                  <p className="empty">{t.about.noMilestones}</p>
                )}
              </div>
            </div>

            {/* Academic Reference */}
            <div style={{ marginTop: '28px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
              <p className="section-kicker">{t.about.academicReferenceKicker}</p>
              <h3 style={{ margin: '4px 0' }}>Dr. Ahmed Wasif Reza</h3>
              <p className="muted" style={{ margin: '4px 0' }}>
                {lang === 'bn'
                  ? 'প্রফেসর, কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং বিভাগ এবং ডিন, ফ্যাকাল্টি অব সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং'
                  : 'Professor, Department of Computer Science & Engineering & Dean, Faculty of Sciences and Engineering'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '0.95rem' }}>
                {lang === 'bn' ? 'ইস্ট ওয়েস্ট বিশ্ববিদ্যালয়' : 'East West University'}
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                <a href="mailto:wasif@ewubd.edu">✉ wasif@ewubd.edu</a>
                <a href="tel:01780099173">☎ 01780099173</a>
              </div>
            </div>
          </article>

          {/* 02 Projects & Innovation */}
          <article className="room-panel section-projects" id="projects" aria-labelledby="projectsTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.projects.number}</span>
              <h2 id="projectsTitle">{t.projects.title}</h2>
              <a href="#projects-list">{t.projects.browseLink}</a>
            </div>
            <div className="section-intro">
              <p className="section-kicker">{t.projects.kicker}</p>
              <p>{t.projects.subtitle}</p>
            </div>

            <div className="filters" id="projectFilters" role="group" aria-label="Filter projects">
              <button
                className={`filter ${projectFilter === 'all' ? 'active' : ''}`}
                type="button"
                aria-pressed={projectFilter === 'all'}
                onClick={() => setProjectFilter('all')}
              >
                {t.projects.filterAll}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter ${projectFilter.toLowerCase() === cat.title.toLowerCase() ? 'active' : ''}`}
                  type="button"
                  aria-pressed={projectFilter.toLowerCase() === cat.title.toLowerCase()}
                  onClick={() => setProjectFilter(cat.title.toLowerCase())}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            <div id="projects-list" className="project-showcase">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((item) => {
                  const isSaved = shortlist.includes(`project-${item.id}`);
                  return (
                    <article className="project-card" key={item.id}>
                      {item.data?.image_filename ? (
                        <img className="project-cover" src={item.data.image_filename} alt="" loading="lazy" />
                      ) : (
                        <div className="project-cover project-cover-placeholder" aria-hidden="true">
                          <span>SR</span>
                        </div>
                      )}
                      <div className="project-content">
                        <div className="project-meta">
                          {item.data?.featured && <span className="featured-label">{t.projects.featured}</span>}
                          {item.data?.category && <span>{item.data.category}</span>}
                        </div>
                        <h3>{item.title}</h3>
                        {item.data?.summary && <p>{item.data.summary}</p>}
                        {item.data?.technologies && (
                          <div className="tech-tags" aria-label="Technologies">
                            {item.data.technologies.split(',').map((tech: string, i: number) => (
                              <span key={i}>{tech.trim()}</span>
                            ))}
                          </div>
                        )}
                        {(item.data?.objective || item.data?.role || item.data?.result || item.data?.description) && (
                          <details className="project-details">
                            <summary>{t.projects.detailsSummary}</summary>
                            {item.data?.objective && (
                              <p>
                                <strong>{t.projects.objective}</strong> · {item.data.objective}
                              </p>
                            )}
                            {item.data?.role && (
                              <p>
                                <strong>{t.projects.role}</strong> · {item.data.role}
                              </p>
                            )}
                            {item.data?.result && (
                              <p>
                                <strong>{t.projects.outcome}</strong> · {item.data.result}
                              </p>
                            )}
                            {item.data?.description && <p>{item.data.description}</p>}
                            {item.data?.video_url && (
                              <a href={item.data.video_url} target="_blank" rel="noopener noreferrer">
                                {t.projects.videoLink}
                              </a>
                            )}
                          </details>
                        )}
                        <div className="item-links">
                          {item.data?.github && (
                            <a href={item.data.github} target="_blank" rel="noopener noreferrer">
                              {t.projects.githubLink}
                            </a>
                          )}
                          {item.data?.demo && (
                            <a href={item.data.demo} target="_blank" rel="noopener noreferrer">
                              {t.projects.demoLink}
                            </a>
                          )}
                          <button
                            className="text-button shortlist"
                            type="button"
                            aria-pressed={isSaved}
                            onClick={() => toggleShortlist(`project-${item.id}`, item.title)}
                          >
                            {isSaved ? t.projects.shortlistSaved : t.projects.shortlistAdd}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="empty">{t.projects.noProjects}</p>
              )}
            </div>
          </article>

          {/* 03 Publications */}
          <article className="room-panel section-publications" id="publications" aria-labelledby="publicationsTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.publications.number}</span>
              <h2 id="publicationsTitle">{t.publications.title}</h2>
            </div>
            <div className="section-intro">
              <p className="section-kicker">{t.publications.kicker}</p>
              <p>{t.publications.subtitle}</p>
            </div>
            <div className="publication-list">
              {publications.length > 0 ? (
                publications.map((item, idx) => (
                  <article className="publication-entry" key={item.id}>
                    <div className="publication-index">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="publication-content">
                      <div className="publication-meta">
                        {item.data?.publication_status && (
                          <span className="status-tag">{item.data.publication_status}</span>
                        )}
                        {item.data?.type && <span>{item.data.type}</span>}
                        {item.data?.year && <span>{item.data.year}</span>}
                      </div>
                      <h3>{item.title}</h3>
                      {item.data?.authors && <p className="publication-authors">{item.data.authors}</p>}
                      {(item.data?.venue || item.data?.topic) && (
                        <p className="muted">
                          {item.data.venue || ''}
                          {item.data.venue && item.data.topic ? ' · ' : ''}
                          {item.data.topic || ''}
                        </p>
                      )}
                      {item.data?.abstract && (
                        <details className="publication-abstract">
                          <summary>{t.publications.abstract}</summary>
                          <p>{item.data.abstract}</p>
                        </details>
                      )}
                      <div className="item-links">
                        {item.data?.doi && (
                          <a href={item.data.doi} target="_blank" rel="noopener noreferrer">
                            {t.publications.doiLink}
                          </a>
                        )}
                        {item.data?.paper_url && (
                          <a href={item.data.paper_url} target="_blank" rel="noopener noreferrer">
                            {t.publications.paperLink}
                          </a>
                        )}
                        {item.data?.code_url && (
                          <a href={item.data.code_url} target="_blank" rel="noopener noreferrer">
                            {t.publications.codeLink}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty">{t.publications.noPubs}</p>
              )}
            </div>
          </article>

          {/* 04 Clubs & Outreach */}
          <article className="room-panel section-outreach" id="outreach" aria-labelledby="outreachTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.outreach.number}</span>
              <h2 id="outreachTitle">{t.outreach.title}</h2>
            </div>
            {clubs.length > 0 ? (
              <div className="organization-strip" aria-label="Organizations">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    className="organization-mark"
                    type="button"
                    style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
                    onClick={() => setSelectedClub(club)}
                  >
                    {club.data?.image_filename ? (
                      <img src={club.data.image_filename} alt="" loading="lazy" />
                    ) : (
                      <span className="organization-monogram" aria-hidden="true">
                        {club.title.substring(0, 1)}
                      </span>
                    )}
                    <span>
                      <strong>{club.title}</strong>
                      {club.data?.institution && <small>{club.data.institution}</small>}
                      {club.data?.relationship && <small>{club.data.relationship}</small>}
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty">{t.outreach.noClubs}</p>
            )}

            <div className="section-heading outreach-heading">
              <div>
                <p className="section-kicker">{t.outreach.activitiesKicker}</p>
                <h3>{t.outreach.activitiesHeading}</h3>
              </div>
            </div>
            <div className="outreach-timeline">
              {activities.length > 0 ? (
                activities.map((item) => (
                  <article className="outreach-entry" key={item.id}>
                    <div className="activity-date">{item.data?.date || ''}</div>
                    <div className="activity-marker" aria-hidden="true"></div>
                    <div className="activity-copy">
                      <span className="activity-type">{item.data?.type || 'Activity'}</span>
                      <h3>{item.title}</h3>
                      {item.data?.description && <p>{item.data.description}</p>}
                      {(item.data?.contribution || item.data?.outcome) && (
                        <details className="activity-details">
                          <summary>{t.outreach.contributionOutcomeSummary}</summary>
                          {item.data?.contribution && (
                            <p>
                              <strong>{t.outreach.contributionLabel}</strong> · {item.data.contribution}
                            </p>
                          )}
                          {item.data?.outcome && (
                            <p>
                              <strong>{t.outreach.outcomeLabel}</strong> · {item.data.outcome}
                            </p>
                          )}
                        </details>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty">{t.outreach.noActivities}</p>
              )}
            </div>
          </article>

          {/* 05 Certificates */}
          <article className="room-panel section-certificates" id="certificates" aria-labelledby="certificatesTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.certificates.number}</span>
              <h2 id="certificatesTitle">{t.certificates.title}</h2>
            </div>
            <label className="credential-search" htmlFor="certificateSearch">
              <span>{t.certificates.searchLabel}</span>
              <input
                id="certificateSearch"
                type="search"
                placeholder={t.certificates.searchPlaceholder}
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="credential-grid">
              {filteredCerts.length > 0 ? (
                filteredCerts.map((item) => (
                  <article className="credential-card" key={item.id}>
                    <div className="credential-preview">
                      {item.data?.image_filename ? (
                        <button
                          className="credential-image previewable"
                          type="button"
                          onClick={() =>
                            setPreviewData({
                              isOpen: true,
                              title: item.title,
                              description: `${item.data?.issuer || ''} · ${item.data?.issue_date || ''}`,
                              imageSrc: item.data?.image_filename,
                            })
                          }
                          aria-label={`Preview certificate: ${item.title}`}
                        >
                          <img src={item.data.image_filename} alt="" loading="lazy" />
                        </button>
                      ) : (
                        <span className="credential-emblem" aria-hidden="true">
                          CERTIFICATE
                        </span>
                      )}
                    </div>
                    <div className="credential-copy">
                      <span className="section-kicker">{item.data?.category || 'CREDENTIAL'}</span>
                      <h3>{item.title}</h3>
                      {item.data?.issuer && <p>{item.data.issuer}</p>}
                      {item.data?.issue_date && (
                        <small>
                          {t.certificates.issuedLabel} {item.data.issue_date}
                        </small>
                      )}
                      {item.data?.expiry_date && (
                        <small>
                          {t.certificates.expiresLabel} {item.data.expiry_date}
                        </small>
                      )}
                      <div className="item-links">
                        {item.data?.verification_url && (
                          <a href={item.data.verification_url} target="_blank" rel="noopener noreferrer">
                            {t.certificates.verifyLink}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty credential-empty">
                  {certSearch ? t.certificates.noMatch : t.certificates.noCerts}
                </p>
              )}
            </div>
          </article>

          {/* 06 Trophy Room */}
          <article className="room-panel section-trophies" id="trophies" aria-labelledby="trophiesTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.trophies.number}</span>
              <h2 id="trophiesTitle">{t.trophies.title}</h2>
            </div>
            <div className="trophy-display">
              {crests.length > 0 ? (
                crests.map((item) => (
                  <article className="trophy-piece" key={item.id}>
                    {item.data?.image_filename ? (
                      <button
                        className="trophy-art previewable"
                        type="button"
                        onClick={() =>
                          setPreviewData({
                            isOpen: true,
                            title: item.title,
                            description: `${item.data?.issuer || ''} · ${item.data?.description || ''} ${item.data?.reason || ''}`,
                            imageSrc: item.data?.image_filename,
                          })
                        }
                        aria-label={`View award: ${item.title}`}
                      >
                        <img src={item.data.image_filename} alt="" loading="lazy" />
                      </button>
                    ) : (
                      <div className="trophy-art trophy-art-placeholder" aria-hidden="true">
                        <span>✦</span>
                      </div>
                    )}
                    <p className="section-kicker">{item.data?.issuer || 'AWARD'}</p>
                    <h3>{item.title}</h3>
                    {item.data?.date && <small>{item.data.date}</small>}
                    {(item.data?.description || item.data?.reason) && (
                      <details className="award-details">
                        <summary>{t.trophies.recognitionSummary}</summary>
                        {item.data?.description && <p>{item.data.description}</p>}
                        {item.data?.reason && <p>{item.data.reason}</p>}
                      </details>
                    )}
                  </article>
                ))
              ) : (
                <p className="empty">{t.trophies.noAwards}</p>
              )}
            </div>
          </article>

          {/* 07 Event Gallery */}
          <article className="room-panel section-gallery" id="gallery" aria-labelledby="galleryTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.gallery.number}</span>
              <h2 id="galleryTitle">{t.gallery.title}</h2>
            </div>
            <div className="filters gallery-filters" role="group" aria-label="Filter event gallery">
              <button
                className={`filter ${galleryFilter === 'all' ? 'active' : ''}`}
                type="button"
                aria-pressed={galleryFilter === 'all'}
                onClick={() => setGalleryFilter('all')}
              >
                {t.gallery.allEvents}
              </button>
              {galleryCategories.map((cat, i) => (
                <button
                  key={i}
                  className={`filter ${galleryFilter.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                  type="button"
                  aria-pressed={galleryFilter.toLowerCase() === cat.toLowerCase()}
                  onClick={() => setGalleryFilter(cat.toLowerCase())}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="event-grid" id="event-grid">
              {filteredGallery.length > 0 ? (
                filteredGallery.map((item) => (
                  <article className="event-card" key={item.id}>
                    {item.data?.image_filename ? (
                      <button
                        className="event-image previewable"
                        type="button"
                        onClick={() =>
                          setPreviewData({
                            isOpen: true,
                            title: item.title,
                            description: item.data?.caption || '',
                            imageSrc: item.data?.image_filename,
                          })
                        }
                        aria-label={`Open photo from ${item.title}`}
                      >
                        <img src={item.data.image_filename} alt="" loading="lazy" />
                      </button>
                    ) : (
                      <div className="event-image event-image-placeholder" aria-hidden="true">
                        <span>{item.data?.gallery_category || 'EVENT'}</span>
                      </div>
                    )}
                    <div className="event-caption">
                      <span className="section-kicker">
                        {item.data?.gallery_category || 'EVENT'}
                        {item.data?.date ? ` · ${item.data.date}` : ''}
                      </span>
                      <h3>{item.title}</h3>
                      {item.data?.caption && <p>{item.data.caption}</p>}
                      {item.data?.external_url && (
                        <a href={item.data.external_url} target="_blank" rel="noopener noreferrer">
                          {t.gallery.eventDetails}
                        </a>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty">{t.gallery.noGallery}</p>
              )}
            </div>
          </article>

          {/* Location Section */}
          {(profile.location_label || profile.location_address) && (
            <article className="room-panel section-map" id="location" aria-labelledby="locationTitle" tabIndex={-1}>
              <div className="panel-head">
                <span>◎</span>
                <h2 id="locationTitle">{t.location.title}</h2>
              </div>
              <div className="contact-layout location-layout">
                <div className="contact-intro">
                  <p className="section-kicker">{t.location.kicker}</p>
                  <h3>{profile.location_label || ''}</h3>
                  {profile.location_address && <p>{profile.location_address}</p>}
                  {profile.map_lat && profile.map_lng && (
                    <p className="muted">
                      <small>
                        {profile.map_lat}, {profile.map_lng}
                      </small>
                    </p>
                  )}
                </div>
                {profile.map_url && (
                  <div className="map-embed">
                    <iframe
                      src={profile.map_url}
                      title={`Map showing ${profile.location_label || 'my location'}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            </article>
          )}

          {/* 08 Contact */}
          <article className="room-panel contact-panel section-contact" id="contact" aria-labelledby="contactTitle" tabIndex={-1}>
            <div className="panel-head">
              <span>{t.contact.number}</span>
              <h2 id="contactTitle">{t.contact.title}</h2>
            </div>
            <div className="contact-layout">
              <div className="contact-intro">
                <p className="section-kicker">{t.contact.kicker}</p>
                <h3>{t.contact.headline}</h3>
                <p>
                  {profile.contact_intro ||
                    (lang === 'bn'
                      ? 'যোগাযোগের মাধ্যম ব্যবহার করুন বা নিচে বার্তা পাঠান।'
                      : 'Use a published contact channel or send a message below.')}
                </p>
                <div className="contact-links">
                  {profile.email && <a href={`mailto:${profile.email}`}>✉ {profile.email}</a>}
                  {profile.phone && <a href={`tel:${profile.phone}`}>☎ {profile.phone}</a>}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                      Website ↗
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn ↗
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer">
                      GitHub ↗
                    </a>
                  )}
                </div>
              </div>

              {profile.email ? (
                <form className="contact-form" id="contactForm" onSubmit={handleContactSubmit}>
                  {/* Honeypot for spam */}
                  <label className="hp-field" aria-hidden="true" style={{ display: 'none' }}>
                    Leave this field empty
                    <input
                      name="website_hp"
                      value={contactForm.website_hp}
                      onChange={(e) => setContactForm({ ...contactForm, website_hp: e.target.value })}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </label>

                  <label htmlFor="contactName">
                    {t.contact.formName}
                    <input
                      id="contactName"
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={120}
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </label>

                  <label htmlFor="contactSender">
                    {t.contact.formEmail}
                    <input
                      id="contactSender"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </label>

                  <label htmlFor="contactMessage">
                    {t.contact.formMessage}
                    <textarea
                      id="contactMessage"
                      name="message"
                      rows={4}
                      required
                      maxLength={3000}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                  </label>

                  <button className="btn primary" type="submit" disabled={contactLoading}>
                    {contactLoading ? t.contact.sending : t.contact.sendButton}
                  </button>
                  <p className="form-feedback" id="contactFeedback" role="status" aria-live="polite">
                    {contactFeedback}
                  </p>
                </form>
              ) : (
                <p className="empty contact-unavailable">
                  {t.contact.unavailable}
                </p>
              )}
            </div>
          </article>
        </section>

        {/* Custom Page Builder Blocks (if any) */}
        {blocks.length > 0 && (
          <section className="content-grid" aria-label="Additional portfolio information">
            {blocks.map((block) => (
              <article className="room-panel" id={`custom-block-${block.slug}`} key={block.id}>
                <div className="panel-head">
                  <span>+</span>
                  <h2>{block.title}</h2>
                </div>
                {block.data?.body && <p className="panel-body">{block.data.body}</p>}
                {block.data?.image_filename && (
                  <img
                    className="detail-image"
                    src={block.data.image_filename}
                    alt={block.data?.image_alt || block.title}
                  />
                )}
                {block.data?.external_url && (
                  <p className="panel-body">
                    <a href={block.data.external_url} target="_blank" rel="noopener noreferrer">
                      Learn more ↗
                    </a>
                  </p>
                )}
              </article>
            ))}
          </section>
        )}
      </main>

      {/* Dialogs */}
      <QuickPanel
        isOpen={quickPanelOpen}
        profile={profile}
        lang={lang}
        onClose={() => setQuickPanelOpen(false)}
        onNavigate={navigateToSection}
      />

      <PreviewDialog
        isOpen={previewData.isOpen}
        title={previewData.title}
        description={previewData.description}
        imageSrc={previewData.imageSrc}
        lang={lang}
        onClose={() => setPreviewData({ isOpen: false, title: '', description: '' })}
      />

      <ClubDetailModal
        club={selectedClub}
        activities={activities.filter((a) => selectedClub && String(a.data?.club_id) === String(selectedClub.id))}
        crests={crests.filter((c) => selectedClub && String(c.data?.club_id) === String(selectedClub.id))}
        lang={lang}
        onClose={() => setSelectedClub(null)}
      />
    </>
  );
};
