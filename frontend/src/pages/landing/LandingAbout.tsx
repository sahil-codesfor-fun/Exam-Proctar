import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { ShieldCheck, Target, Award, Users } from "lucide-react";
import about1 from "@/assets/about-1.jpg";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary/60 via-background to-background py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="About Us"
              title="Nexus Proctor"
              description="Empowering academic integrity through advanced AI-driven proctoring solutions. We ensure a secure and fair testing environment for institutions globally."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src={about1} 
                alt="About Nexus Proctor" 
                className="rounded-2xl shadow-xl w-full object-cover max-h-[500px]"
              />
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  At Nexus Proctor, we believe in a world where academic assessments are trusted and secure. Our mission is to provide cutting-edge technology that safeguards the integrity of online exams, giving educators and students peace of mind.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: ShieldCheck, title: "Uncompromised Security", desc: "State-of-the-art secure browser and monitoring." },
                  { icon: Target, title: "Precision & Accuracy", desc: "Advanced AI detection to flag suspicious activities." },
                  { icon: Users, title: "Built for Institutions", desc: "Scalable infrastructure for universities of all sizes." },
                  { icon: Award, title: "Fairness First", desc: "Ensuring every student has an equal opportunity." },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
