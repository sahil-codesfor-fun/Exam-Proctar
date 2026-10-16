import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Code Nexus | Smart Online Examination & AI Proctoring Platform',
    description: 'AI-driven online examination platform for university tests, coding challenges, and secure live proctoring.',
  },
  '/about': {
    title: 'About Us | Code Nexus & Geeta University',
    description: 'Empowering academic integrity through advanced AI-driven proctoring solutions. Built for institutions and universities.',
  },
  '/contact': {
    title: 'Contact Support & Institutional Sales | Code Nexus',
    description: 'Get in touch with Code Nexus support team or Geeta University academic evaluation coordinators.',
  },
  '/courses': {
    title: 'Industry Aligned Courses & Certifications | Code Nexus',
    description: 'Explore practical programming courses in Cloud, AI, Full Stack, and Mobile development.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Code Nexus Data Security',
    description: 'Learn how Code Nexus safeguards academic evaluation records, webcam telemetry, and student privacy.',
  },
  '/privacy': {
    title: 'Privacy Policy | Code Nexus Data Security',
    description: 'Learn how Code Nexus safeguards academic evaluation records, webcam telemetry, and student privacy.',
  },
  '/terms': {
    title: 'Terms and Conditions | Code Nexus Academic Integrity',
    description: 'Terms of service, academic honesty rules, and code sandboxing policies for students and educators.',
  },
  '/terms-and-conditions': {
    title: 'Terms and Conditions | Code Nexus Academic Integrity',
    description: 'Terms of service, academic honesty rules, and code sandboxing policies for students and educators.',
  },
  '/login': {
    title: 'Student Login | Code Nexus Portal',
    description: 'Sign in to your Code Nexus student examination and course assessment dashboard.',
  },
  '/fac': {
    title: 'Faculty Portal Login | Code Nexus',
    description: 'Faculty and teacher portal for managing practice manager, assessments, and real-time proctoring.',
  },
  '/adm': {
    title: 'Department Admin Portal | Code Nexus',
    description: 'Administrator portal for managing departments, subjects, students, and institutional tickets.',
  },
  '/superadmin/login': {
    title: 'Super Admin Portal | Code Nexus',
    description: 'Institution super administrator access and enterprise settings.',
  },
};

export function useDocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    const meta = routeMetadata[location.pathname] || {
      title: 'Code Nexus | Online Examination Platform',
      description: 'Smart AI-driven examination and coding platform for universities.',
    };

    document.title = meta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description);
    }

    // Trigger consent-aware analytics pageview
    trackPageView(location.pathname, meta.title);
  }, [location.pathname]);
}
