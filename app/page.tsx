import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsultationVideo from "@/components/ConsultationVideo";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import Courses from "@/components/Courses";
import Consultations from "@/components/Consultations";
import Socials from "@/components/Socials";
import Contact from "@/components/Contact";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      
      <ScrollReveal />
      <Header />

      <main>
        <Hero />
        <About />
        <Stats />
        <ConsultationVideo />
        <Services />
        <Courses />
        <Consultations />
        <Socials />
        <Contact />
      </main>

      <Footer />
    </>
  );
}