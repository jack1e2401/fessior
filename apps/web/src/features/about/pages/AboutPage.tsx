import React from "react";
import { FaCode, FaDatabase, FaUsers, FaBolt, FaGithub, FaEnvelope } from "react-icons/fa";

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <FaCode />,
    title: "Code Editor",
    desc: "Monaco-powered editor with syntax highlighting, auto-complete, and multi-language support.",
  },
  {
    icon: <FaDatabase />,
    title: "Problem Bank",
    desc: "MySQL-backed problems, testcases, submissions, and user progress in one focused data model.",
  },
  {
    icon: <FaUsers />,
    title: "1v1 Matchmaking",
    desc: "Real-time ELO-based matchmaking for competitive coding duels against players worldwide.",
  },
  {
    icon: <FaBolt />,
    title: "Instant Judge",
    desc: "Submissions are evaluated in seconds using our distributed Judge0-powered infrastructure.",
  },
];

const TEAM = [
  {
    name: "Anh Khoi",
    role: "Founder & Front End & UI Design",
    avatar: "https://scontent.fsgn2-11.fna.fbcdn.net/v/t39.30808-1/707370701_2065677004360048_7805962422485952348_n.jpg?stp=dst-jpg_tt6&cstp=mx800x800&ctp=s720x720&_nc_cat=105&ccb=1-7&_nc_sid=1d2534&_nc_ohc=Pvj4KZVNIcEQ7kNvwEtjW0K&_nc_oc=Adoe0Wt6O9_79YdH87gk1yh5Ywu_hFs0OptPdyo_YCOJdz2vuCtUKE1XSD4xmCUuGVzIrFxHRmCUq7fJkKtTLm0U&_nc_zt=24&_nc_ht=scontent.fsgn2-11.fna&_nc_gid=vZg9MOEaHsS2DurfZfukWw&_nc_ss=7b2a8&oh=00_AQADv787_zSsnR_zAE6I2Sh-zn6DtS3jEx2Q3_4akvVb8g&oe=6A5ADD38",
    github: "https://github.com/khoidesu",
  },
  {
    name: "Gia Bảo",
    role: "Back End & DevOps",
    avatar: "https://scontent.fsgn2-8.fna.fbcdn.net/v/t39.30808-1/661225513_1657919955397890_8693588368642079666_n.jpg?stp=dst-jpg_tt6&cstp=mx960x958&ctp=s720x720&_nc_cat=102&ccb=1-7&_nc_sid=e99d92&_nc_ohc=sPxUDSetLyEQ7kNvwFSp6Uq&_nc_oc=AdqDoSCqRmpPg2cNLw1bam_JkRFTnXg0HHJwQtWrRMJWyPGxUOd3lZnF3Of65uyaAHqfQDZQt_YAz4ob-8FQDkAN&_nc_zt=24&_nc_ht=scontent.fsgn2-8.fna&_nc_gid=x3-UxdypdPMhT2_RnQ6H0Q&_nc_ss=7b2a8&oh=00_AQCVGl7PH0AfqcSsNEyzD27EM2er4aMi30Lw2HQKzeY8fw&oe=6A5AF75B",
    github: "https://github.com/JamesHarrision",
  },
  {
    name: "Đăng Khánh",
    role: "Back End & Front End",
    avatar: "https://scontent.fsgn2-5.fna.fbcdn.net/v/t39.30808-1/416281422_1529848764535566_1841711039065416804_n.jpg?stp=dst-jpg_tt6&cstp=mx960x960&ctp=s720x720&_nc_cat=104&ccb=1-7&_nc_sid=e99d92&_nc_ohc=KLP8rZPsGaMQ7kNvwFq0rWp&_nc_oc=AdpJOdlMvPE9Fn9BP7j6HaX5TrMBjkx7Kn4MYXZjiq0YPzcN0YObXTH_Ki2_dCUEb84qkYtHhMb3p15MnH3J-X8b&_nc_zt=24&_nc_ht=scontent.fsgn2-5.fna&_nc_gid=hJdbf7cRlgfLcXKgb_gXzA&_nc_ss=7b2a8&oh=00_AQCtJG58SsucfnJdc4VEMjKWDz8n-hi7LlZcLLJw0i2tJg&oe=6A5AE380",
    github: "https://github.com/Khanh23-code",
  },
  {
    name: "Hồng Kha",
    role: "UI / UX Design & Front End",
    avatar: "https://scontent.fsgn2-5.fna.fbcdn.net/v/t39.30808-1/722605712_1517810879786789_5124653225950437071_n.jpg?stp=dst-jpg_tt6&cstp=mx2046x2048&ctp=s720x720&_nc_cat=104&ccb=1-7&_nc_sid=e99d92&_nc_ohc=Jn5AWpq5NXYQ7kNvwE4gvhe&_nc_oc=AdrP2VO8xb6ncNZllC9RmxeWmsiiL5ql0JAEh5P4qX1kvOObu2zHLJUkjEyEMyQewzVIIyjMHt3FJ3xI2fHlPYsf&_nc_zt=24&_nc_ht=scontent.fsgn2-5.fna&_nc_gid=uSDeFb5QylbR6mqwS5GLXw&_nc_ss=7b2a8&oh=00_AQA0YwjX_KLIdn2Bwx-j7R3dzgPPyjdcO61tBLrkWjhxNA&oe=6A5AF819",
    github: "https://github.com/hkha0801-sketch",
  },
  {
    name: "Văn An",
    role: "Front End & UX Design",
    avatar: "https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-1/492298392_677125858138304_1982663344962884712_n.jpg?stp=dst-jpg_tt6&cstp=mx956x950&ctp=s720x720&_nc_cat=107&ccb=1-7&_nc_sid=e99d92&_nc_ohc=6eUI27pgNN8Q7kNvwHdhEu5&_nc_oc=AdqwiRdhk9RRnONiu_gaEIPdK-ZWLjH7z_QH4OQSeMYu0c8p2R4zGS50NZ2I74AJJNJOUVIz7pKE8tjn_dYFn71J&_nc_zt=24&_nc_ht=scontent.fsgn2-3.fna&_nc_gid=H_fmXDz95ZpRHRTnCx62jA&_nc_ss=7b2a8&oh=00_AQAU2xuthfzaOcEU7BPpAx8XNT1cn0NFXkWiT7hQ2O783g&oe=6A5AE63A",
    github: "https://github.com/LeVanAnUITK19",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-washi border border-charcoal p-6 rounded-xl hover:border-vermilion transition-colors">
      <div className="text-vermilion text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-linen mb-2">{title}</h3>
      <p className="text-stone leading-relaxed">{desc}</p>
    </div>
  );
}

function TeamCard({
  name,
  role,
  avatar,
  github,
}: {
  name: string;
  role: string;
  avatar: string;
  github: string;
}) {
  return (
    <div className="flex flex-col items-center bg-washi border border-charcoal p-6 rounded-xl text-center">
      <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-charcoal" />
      <div className="text-lg font-bold text-linen mb-1">{name}</div>
      <div className="text-stone text-xs uppercase tracking-wider mb-4">{role}</div>
      <a
        href={github}
        target="_blank"
        rel="noreferrer"
        className="text-stone hover:text-vermilion transition-colors text-xl"
        aria-label={`${name} GitHub`}
      >
        <FaGithub />
      </a>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* ── Hero ── */}
      <section className="text-center py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-linen mb-6">About Us,</h1>
          <p className="text-lg text-stone max-w-2xl mx-auto mb-4 leading-relaxed">
            QUEU is a modern, fast, and minimalist platform for competitive programming and
            practical coding practice. Our mission is to provide a focused experience for
            developers to write, test, and improve their code.
          </p>
          <p className="text-lg text-stone max-w-2xl mx-auto leading-relaxed">
            Built by developers, for developers — QUEU combines asynchronous judging and
            real-time 1v1 matches in a focused coding platform.
          </p>
        </div>
      </section>

      <hr className="border-t border-charcoal my-12" />

      {/* ── Features ── */}
      <section>
        <h2 className="text-3xl font-bold text-linen mb-2 text-center">What we offer</h2>
        <p className="text-stone text-center mb-10">
          The core workflows for a compact online judge — in one place.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      <hr className="border-t border-charcoal my-12" />

      {/* ── Mission ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-stone space-y-4 leading-relaxed">
          <h2 className="text-3xl font-bold text-linen mb-2">Our Mission</h2>
          <p>
            We believe that anyone, regardless of background, can become a world-class
            programmer with the right tools and environment. QUEU was built to democratize
            access to high-quality competitive programming resources.
          </p>
          <p>
            From a problem statement to a judged submission, QUEU supports a practical coding workflow.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4 bg-washi p-6 border border-charcoal rounded-xl">
            <div className="bg-ink p-3 rounded-xl text-vermilion text-xl">
              <FaCode />
            </div>
            <div>
              <div className="text-lg font-bold text-linen mb-1">Open & Fair</div>
              <div className="text-stone text-sm">
                Problems and judging feedback are accessible to signed-in users.
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-charcoal my-12" />

      {/* ── Team ── */}
      <section>
        <h2 className="text-3xl font-bold text-linen mb-2 text-center">Meet the Team</h2>
        <p className="text-stone text-center mb-10">
          A small passionate team of engineers and designers from Vietnam 🇻🇳
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {TEAM.map((m) => (
            <TeamCard key={m.name} {...m} />
          ))}
        </div>
      </section>

      <hr className="border-t border-charcoal my-12" />

      {/* ── Contact ── */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-bold text-linen mb-2">Get in Touch</h2>
        <p className="text-stone mb-6">
          Have questions, suggestions, or want to contribute?
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="mailto:contact@queu.dev"
            className="flex items-center gap-2 bg-ink border border-charcoal px-6 py-3 rounded-xl text-linen hover:border-vermilion transition-colors"
            aria-label="Email us"
          >
            <FaEnvelope /> contact@queu.dev
          </a>
          <a
            href="https://github.com/queu-dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-ink border border-charcoal px-6 py-3 rounded-xl text-linen hover:border-vermilion transition-colors"
            aria-label="GitHub"
          >
            <FaGithub /> GitHub
          </a>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
