import courseAws from "@/assets/course-aws.jpg";
import courseFlutter from "@/assets/course-flutter.jpg";
import courseReact from "@/assets/course-react.jpg";
import courseGenai from "@/assets/course-genai.jpg";
import testi1 from "@/assets/testi-1.jpg";
import testi2 from "@/assets/testi-2.jpg";
import testi3 from "@/assets/testi-3.jpg";

export type Course = {
  slug: string;
  title: string;
  image: string;
  weeks: string;
  level: string;
  modules: string;
  hours: string;
  category: string;
};

export const courses: Course[] = [
  {
    slug: "aws-development",
    title: "AWS Development",
    image: courseAws,
    weeks: "4 Weeks",
    level: "Advanced",
    modules: "13 Modules",
    hours: "200+ hours",
    category: "Cloud",
  },
  {
    slug: "google-flutter",
    title: "Google Flutter",
    image: courseFlutter,
    weeks: "3 Weeks",
    level: "Advanced",
    modules: "15 Modules",
    hours: "200+ hours",
    category: "Mobile",
  },
  {
    slug: "fsd-react-native",
    title: "FSD with React Native",
    image: courseReact,
    weeks: "10 Weeks",
    level: "Advanced",
    modules: "18 Modules",
    hours: "200+ hours",
    category: "Full Stack",
  },
  {
    slug: "generative-ai",
    title: "Generative AI",
    image: courseGenai,
    weeks: "6 Weeks",
    level: "Advanced",
    modules: "20 Modules",
    hours: "200+ hours",
    category: "AI",
  },
];

export const moreCourses: Course[] = [
  {
    slug: "python-fullstack",
    title: "Python Full Stack",
    image: courseGenai,
    weeks: "12 Weeks",
    level: "Beginner",
    modules: "22 Modules",
    hours: "250+ hours",
    category: "Full Stack",
  },
  {
    slug: "data-science",
    title: "Data Science & ML",
    image: courseAws,
    weeks: "8 Weeks",
    level: "Intermediate",
    modules: "16 Modules",
    hours: "220+ hours",
    category: "AI",
  },
  {
    slug: "android-development",
    title: "Android Development",
    image: courseFlutter,
    weeks: "6 Weeks",
    level: "Intermediate",
    modules: "14 Modules",
    hours: "180+ hours",
    category: "Mobile",
  },
  {
    slug: "devops-cloud",
    title: "DevOps & Cloud",
    image: courseReact,
    weeks: "5 Weeks",
    level: "Advanced",
    modules: "12 Modules",
    hours: "160+ hours",
    category: "Cloud",
  },
];

export const categories = [
  "Technology Training",
  "Coding",
  "Apt Logic",
  "Communication",
  "Profile Building",
  "Placements",
  "Certifications",
  "Internships",
  "Project Space",
];

export type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Rami Reddy",
    role: "Trainee",
    image: testi1,
    quote:
      "The program's emphasis on practical training is what sets it apart. Applying what we learn in a real-world context has been immensely helpful. I've seen a noticeable improvement in my coding abilities — an excellent investment in my future as a confident, capable developer.",
  },
  {
    name: "Sameera",
    role: "Trainee",
    image: testi2,
    quote:
      "Midnight Coders has been a game-changer for me. The practical approach to learning has made all the difference and significantly boosted my confidence and skills. I highly recommend it to anyone looking to become a proficient developer.",
  },
  {
    name: "Sankar",
    role: "Trainee",
    image: testi3,
    quote:
      "I can't say enough good things about this program. The practical sessions are incredibly valuable. Learning through real-life scenarios rather than just theory helped me understand and retain information better. The instructors are patient and knowledgeable.",
  },
];

export const counters = [
  { value: "30K", label: "Trainees" },
  { value: "10K+", label: "Certifications" },
  { value: "50+", label: "Courses" },
  { value: "100%", label: "Placement Assistance" },
];

export const partners = ["Pega", "CompTIA", "Mile2", "Automation Anywhere", "AWS", "Google", "Microsoft", "Geeta University"];

export const contact = {
  email: "support@midnightcoders.io",
  phone: "+ (91) 83 43 81 81 81",
};
