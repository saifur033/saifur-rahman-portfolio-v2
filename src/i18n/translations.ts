export interface TranslationSchema {
  nav: {
    skip: string;
    about: string;
    projects: string;
    publications: string;
    outreach: string;
    certificates: string;
    contact: string;
    studio: string;
    langName: string;
    themeToggle: string;
  };
  hero: {
    eyebrow: string;
    exploreWithGuide: string;
    quickView: string;
    downloadCv: string;
    viewCv: string;
    contact: string;
    chooseRoute: string;
    professionalJourney: string;
    projectsResearch: string;
    welcomeDefault: string;
  };
  rooms: {
    about: string;
    projects: string;
    publications: string;
    outreach: string;
    certificates: string;
    trophies: string;
    gallery: string;
    contact: string;
  };
  metrics: {
    clubs: string;
    meetings: string;
    activities: string;
    projects: string;
    publications: string;
    certificates: string;
    crests: string;
  };
  about: {
    number: string;
    title: string;
    contactLink: string;
    profileKicker: string;
    educationLabel: string;
    skillsHeading: string;
    noSkills: string;
    theJourneyKicker: string;
    careerHeading: string;
    milestonesCount: string;
    noMilestones: string;
    academicReferenceKicker: string;
  };
  projects: {
    number: string;
    title: string;
    browseLink: string;
    kicker: string;
    subtitle: string;
    filterAll: string;
    featured: string;
    detailsSummary: string;
    objective: string;
    role: string;
    outcome: string;
    videoLink: string;
    githubLink: string;
    demoLink: string;
    shortlistAdd: string;
    shortlistSaved: string;
    noProjects: string;
  };
  publications: {
    number: string;
    title: string;
    kicker: string;
    subtitle: string;
    abstract: string;
    doiLink: string;
    paperLink: string;
    codeLink: string;
    noPubs: string;
  };
  outreach: {
    number: string;
    title: string;
    activitiesKicker: string;
    activitiesHeading: string;
    contributionOutcomeSummary: string;
    contributionLabel: string;
    outcomeLabel: string;
    noClubs: string;
    noActivities: string;
  };
  certificates: {
    number: string;
    title: string;
    searchLabel: string;
    searchPlaceholder: string;
    issuedLabel: string;
    expiresLabel: string;
    verifyLink: string;
    noCerts: string;
    noMatch: string;
  };
  trophies: {
    number: string;
    title: string;
    recognitionSummary: string;
    noAwards: string;
  };
  gallery: {
    number: string;
    title: string;
    allEvents: string;
    eventDetails: string;
    noGallery: string;
  };
  location: {
    title: string;
    kicker: string;
  };
  contact: {
    number: string;
    title: string;
    kicker: string;
    headline: string;
    formName: string;
    formEmail: string;
    formMessage: string;
    sendButton: string;
    sending: string;
    defaultFeedback: string;
    unavailable: string;
  };
  quickView: {
    title: string;
    close: string;
  };
  preview: {
    close: string;
  };
  clubModal: {
    kicker: string;
    relatedActivities: string;
    relatedHonors: string;
    visitWebsite: string;
    close: string;
    outcome: string;
  };
}

export const translations: Record<'en' | 'bn', TranslationSchema> = {
  en: {
    nav: {
      skip: 'Skip to content',
      about: 'About',
      projects: 'Projects',
      publications: 'Publications',
      outreach: 'Outreach',
      certificates: 'Certificates',
      contact: 'Contact',
      studio: 'Studio',
      langName: 'বাংলা',
      themeToggle: 'Toggle light and dark mode',
    },
    hero: {
      eyebrow: 'COMMUNICATION · OUTREACH · TECHNOLOGY',
      exploreWithGuide: 'Explore with guide ↗',
      quickView: 'Quick view',
      downloadCv: '↓ Download CV',
      viewCv: 'View CV (PDF) ↗',
      contact: '✉ Contact',
      chooseRoute: 'Choose a route',
      professionalJourney: '↗ Professional Journey',
      projectsResearch: '♧ Projects & Research',
      welcomeDefault: 'Welcome. Choose a room to explore.',
    },
    rooms: {
      about: 'About & Career',
      projects: 'Projects & Innovation',
      publications: 'Publications',
      outreach: 'Clubs & Outreach',
      certificates: 'Certificates',
      trophies: 'Trophy Room',
      gallery: 'Event Gallery',
      contact: 'Contact',
    },
    metrics: {
      clubs: 'Clubs engaged',
      meetings: 'Meetings',
      activities: 'Activities',
      projects: 'Projects',
      publications: 'Publications',
      certificates: 'Certificates',
      crests: 'Crests & Honors',
    },
    about: {
      number: '01',
      title: 'About & Career',
      contactLink: 'Contact ↗',
      profileKicker: 'PROFILE',
      educationLabel: 'Education',
      skillsHeading: 'Skills',
      noSkills: 'No skills have been published yet.',
      theJourneyKicker: 'THE JOURNEY',
      careerHeading: 'Career & Education',
      milestonesCount: 'milestones',
      noMilestones: 'No career or education entries have been published yet.',
      academicReferenceKicker: 'ACADEMIC REFERENCE',
    },
    projects: {
      number: '02',
      title: 'Projects & Innovation',
      browseLink: 'Browse ↓',
      kicker: 'SELECTED WORK',
      subtitle: 'Explore published projects, methods and outcomes.',
      filterAll: 'All',
      featured: 'Featured',
      detailsSummary: 'Project details',
      objective: 'Objective',
      role: 'Role',
      outcome: 'Outcome',
      videoLink: 'Project video ↗',
      githubLink: 'GitHub ↗',
      demoLink: 'Live demo ↗',
      shortlistAdd: '＋ Shortlist',
      shortlistSaved: '✓ Saved',
      noProjects: 'No projects found in this category.',
    },
    publications: {
      number: '03',
      title: 'Publications',
      kicker: 'RESEARCH LIBRARY',
      subtitle: 'Published work and research in progress.',
      abstract: 'Abstract',
      doiLink: 'DOI ↗',
      paperLink: 'Read paper ↗',
      codeLink: 'Code ↗',
      noPubs: 'No publications have been published yet.',
    },
    outreach: {
      number: '04',
      title: 'Clubs & Outreach',
      activitiesKicker: 'PARTICIPATION & CONTRIBUTION',
      activitiesHeading: 'Activities',
      contributionOutcomeSummary: 'Contribution & outcome',
      contributionLabel: 'Contribution',
      outcomeLabel: 'Outcome',
      noClubs: 'No clubs have been published yet.',
      noActivities: 'No outreach activities have been published yet.',
    },
    certificates: {
      number: '05',
      title: 'Certificates',
      searchLabel: 'Search credentials',
      searchPlaceholder: 'Title, issuer or category',
      issuedLabel: 'Issued',
      expiresLabel: 'Expires',
      verifyLink: 'Verify ↗',
      noCerts: 'No certificates have been published yet.',
      noMatch: 'No credentials match this search.',
    },
    trophies: {
      number: '06',
      title: 'Trophy Room',
      recognitionSummary: 'Recognition details',
      noAwards: 'No awards have been published yet.',
    },
    gallery: {
      number: '07',
      title: 'Event Gallery',
      allEvents: 'All events',
      eventDetails: 'Event details ↗',
      noGallery: 'No event albums have been published yet.',
    },
    location: {
      title: 'Location',
      kicker: 'FIND ME',
    },
    contact: {
      number: '08',
      title: 'Contact',
      kicker: 'START A CONVERSATION',
      headline: 'Have a project or opportunity in mind?',
      formName: 'Your name',
      formEmail: 'Your email',
      formMessage: 'Message',
      sendButton: 'Send message',
      sending: 'Sending message...',
      defaultFeedback: 'Your message is sent directly to the site owner and is not shared with anyone else.',
      unavailable: 'A public email address has not been provided, so the message form is unavailable.',
    },
    quickView: {
      title: 'Quick view',
      close: 'Close',
    },
    preview: {
      close: 'Close',
    },
    clubModal: {
      kicker: 'CLUB & OUTREACH DETAILS',
      relatedActivities: 'Related Activities',
      relatedHonors: 'Related Honors & Crests',
      visitWebsite: 'Visit Club Website ↗',
      close: 'Close',
      outcome: 'Outcome',
    },
  },

  bn: {
    nav: {
      skip: 'মূল অংশে যান',
      about: 'পরিচিতি',
      projects: 'প্রজেক্ট',
      publications: 'প্রকাশনা',
      outreach: 'সম্পৃক্ততা',
      certificates: 'সার্টিফিকেট',
      contact: 'যোগাযোগ',
      studio: 'স্টুডিও',
      langName: 'English',
      themeToggle: 'লাইট ও ডার্ক মোড পরিবর্তন করুন',
    },
    hero: {
      eyebrow: 'যোগাযোগ · সম্পৃক্ততা · প্রযুক্তি',
      exploreWithGuide: 'গাইডের সাথে ঘুরে দেখুন ↗',
      quickView: 'দ্রুত দর্শন',
      downloadCv: '↓ সিভি ডাউনলোড করুন',
      viewCv: 'সিভি দেখুন (পিডিএফ) ↗',
      contact: '✉ যোগাযোগ',
      chooseRoute: 'রুট নির্বাচন করুন',
      professionalJourney: '↗ পেশাগত যাত্রা',
      projectsResearch: '♧ প্রজেক্ট ও গবেষণা',
      welcomeDefault: 'স্বাগতম। ঘুরে দেখতে যেকোনো রুম নির্বাচন করুন।',
    },
    rooms: {
      about: 'পরিচিতি ও ক্যারিয়ার',
      projects: 'প্রজেক্ট ও উদ্ভাবন',
      publications: 'গবেষণা প্রকাশনা',
      outreach: 'ক্লাব ও সম্পৃক্ততা',
      certificates: 'সার্টিফিকেটসমূহ',
      trophies: 'পুরস্কার ও স্মারক',
      gallery: 'ইভেন্ট গ্যালারি',
      contact: 'যোগাযোগ',
    },
    metrics: {
      clubs: 'যুক্ত ক্লাবসমূহ',
      meetings: 'মিটিং',
      activities: 'কার্যক্রম',
      projects: 'প্রজেক্ট',
      publications: 'প্রকাশনা',
      certificates: 'সার্টিফিকেট',
      crests: 'স্মারক ও সম্মাননা',
    },
    about: {
      number: '০১',
      title: 'পরিচিতি ও ক্যারিয়ার',
      contactLink: 'যোগাযোগ ↗',
      profileKicker: 'প্রোফাইল',
      educationLabel: 'শিক্ষা',
      skillsHeading: 'দক্ষতাসমূহ',
      noSkills: 'এখনও কোনো দক্ষতা প্রকাশিত হয়নি।',
      theJourneyKicker: 'পেশাগত যাত্রা',
      careerHeading: 'ক্যারিয়ার ও শিক্ষা',
      milestonesCount: 'টি মাইলফলক',
      noMilestones: 'এখনও কোনো ক্যারিয়ার বা শিক্ষা তথ্য প্রকাশিত হয়নি।',
      academicReferenceKicker: 'একাডেমিক রেফারেন্স',
    },
    projects: {
      number: '০২',
      title: 'প্রজেক্ট ও উদ্ভাবন',
      browseLink: 'ব্রাউজ করুন ↓',
      kicker: 'নির্বাচিত কাজসমূহ',
      subtitle: 'প্রকাশিত প্রজেক্ট, প্রযুক্তি এবং ফলাফল দেখুন।',
      filterAll: 'সকল',
      featured: 'ফিচার্ড',
      detailsSummary: 'প্রজেক্টের বিবরণ',
      objective: 'উদ্দেশ্য',
      role: 'ভূমিকা',
      outcome: 'ফলাফল',
      videoLink: 'প্রজেক্ট ভিডিও ↗',
      githubLink: 'গিটহাব ↗',
      demoLink: 'লাইভ ডেমো ↗',
      shortlistAdd: '＋ শর্টলিস্ট',
      shortlistSaved: '✓ সংরক্ষিত',
      noProjects: 'এই ক্যাটাগরিতে কোনো প্রজেক্ট পাওয়া যায়নি।',
    },
    publications: {
      number: '০৩',
      title: 'গবেষণা প্রকাশনা',
      kicker: 'রিসার্চ লাইব্রেরি',
      subtitle: 'প্রকাশিত গবেষণা ও চলমান কাজ।',
      abstract: 'সারসংক্ষেপ (Abstract)',
      doiLink: 'ডিওআই (DOI) ↗',
      paperLink: 'পেপার পড়ুন ↗',
      codeLink: 'কোড ↗',
      noPubs: 'এখনও কোনো প্রকাশনা প্রকাশিত হয়নি।',
    },
    outreach: {
      number: '০৪',
      title: 'ক্লাব ও সম্পৃক্ততা',
      activitiesKicker: 'অংশগ্রহণ ও অবদান',
      activitiesHeading: 'কার্যক্রমসমূহ',
      contributionOutcomeSummary: 'অবদান ও অর্জিত ফলাফল',
      contributionLabel: 'অবদান',
      outcomeLabel: 'ফলাফল',
      noClubs: 'এখনও কোনো ক্লাব প্রকাশিত হয়নি।',
      noActivities: 'এখনও কোনো কার্যক্রম প্রকাশিত হয়নি।',
    },
    certificates: {
      number: '০৫',
      title: 'সার্টিফিকেটসমূহ',
      searchLabel: 'সার্টিফিকেট খুঁজুন',
      searchPlaceholder: 'শিরোনাম, প্রদানকারী বা বিভাগ',
      issuedLabel: 'প্রদানের তারিখ',
      expiresLabel: 'মেয়াদ শেষ',
      verifyLink: 'যাচাই করুন ↗',
      noCerts: 'এখনও কোনো সার্টিফিকেট প্রকাশিত হয়নি।',
      noMatch: 'এই অনুসন্ধানের সাথে কোনো সার্টিফিকেট মেলেনি।',
    },
    trophies: {
      number: '০৬',
      title: 'পুরস্কার ও ট্রফি কক্ষ',
      recognitionSummary: 'স্বীকৃতির বিস্তারিত',
      noAwards: 'এখনও কোনো পুরস্কার প্রকাশিত হয়নি।',
    },
    gallery: {
      number: '০৭',
      title: 'ইভেন্ট গ্যালারি',
      allEvents: 'সকল ইভেন্ট',
      eventDetails: 'ইভেন্ট বিস্তারিত ↗',
      noGallery: 'এখনও কোনো অ্যালবাম প্রকাশিত হয়নি।',
    },
    location: {
      title: 'অবস্থান',
      kicker: 'আমাকে খুঁজুন',
    },
    contact: {
      number: '০৮',
      title: 'যোগাযোগ',
      kicker: 'কথা শুরু করুন',
      headline: 'কোনো প্রজেক্ট বা কাজের সুযোগ নিয়ে কথা বলতে চান?',
      formName: 'আপনার নাম',
      formEmail: 'আপনার ইমেইল',
      formMessage: 'বার্তা',
      sendButton: 'বার্তা পাঠান',
      sending: 'বার্তা পাঠানো হচ্ছে...',
      defaultFeedback: 'আপনার বার্তা সরাসরি আমার কাছে পৌঁছাবে এবং কারও সাথে শেয়ার করা হবে না।',
      unavailable: 'পাবলিক ইমেইল ঠিকানা দেওয়া হয়নি, তাই মেসেজ ফর্মটি বর্তমানে অনুপলব্ধ।',
    },
    quickView: {
      title: 'দ্রুত দর্শন',
      close: 'বন্ধ করুন',
    },
    preview: {
      close: 'বন্ধ করুন',
    },
    clubModal: {
      kicker: 'ক্লাব ও সম্পৃক্ততার বিবরণ',
      relatedActivities: 'সম্পর্কিত কার্যক্রমসমূহ',
      relatedHonors: 'সম্পর্কিত সম্মাননা ও স্মারক',
      visitWebsite: 'ক্লাব ওয়েবসাইট দেখুন ↗',
      close: 'বন্ধ করুন',
      outcome: 'ফলাফল',
    },
  },
};
