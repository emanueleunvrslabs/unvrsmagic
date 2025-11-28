import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Marco Rossi",
    role: "CEO Tech Solutions",
    rating: 5,
    text: "UNVRS LABS transformed our digital infrastructure with cutting-edge AI solutions. Their expertise and professionalism exceeded all expectations.",
    avatar: "MR"
  },
  {
    name: "Sofia Bianchi",
    role: "Product Manager",
    rating: 5,
    text: "The custom software they built streamlined our operations completely. Exceptional attention to detail and outstanding support throughout the project.",
    avatar: "SB"
  },
  {
    name: "Luca Ferrari",
    role: "CTO StartupHub",
    rating: 5,
    text: "Their cloud architecture expertise helped us scale from startup to enterprise. Innovative solutions that grew with our business needs perfectly.",
    avatar: "LF"
  },
  {
    name: "Elena Russo",
    role: "Digital Director",
    rating: 5,
    text: "Outstanding mobile app development with exceptional UX design. The team delivered beyond what we imagined was possible for our platform.",
    avatar: "ER"
  },
  {
    name: "Andrea Conti",
    role: "Operations Lead",
    rating: 5,
    text: "Their DevOps implementation revolutionized our deployment process. Reduced our release cycle by 70% while improving quality and stability.",
    avatar: "AC"
  },
  {
    name: "Giulia Romano",
    role: "Innovation Officer",
    rating: 5,
    text: "Strategic consulting that transformed our digital roadmap. Their insights and technical guidance were invaluable for our company's growth.",
    avatar: "GR"
  },
  {
    name: "Francesco Marino",
    role: "Founder & CEO",
    rating: 5,
    text: "Working with UNVRS LABS was a game-changer for our business. They understood our vision and delivered solutions that exceeded our wildest expectations.",
    avatar: "FM"
  },
  {
    name: "Valentina Costa",
    role: "Head of Digital",
    rating: 5,
    text: "Impressive technical expertise combined with excellent project management. They delivered on time, on budget, and with outstanding quality throughout.",
    avatar: "VC"
  },
  {
    name: "Davide Ricci",
    role: "VP Engineering",
    rating: 5,
    text: "Their AI integration capabilities are world-class. They helped us implement machine learning models that transformed our product offering completely.",
    avatar: "DR"
  },
  {
    name: "Chiara Moretti",
    role: "CMO Marketing Pro",
    rating: 5,
    text: "The mobile app they created for our marketing campaigns was flawless. Beautiful design, smooth performance, and incredible user engagement metrics.",
    avatar: "CM"
  },
  {
    name: "Roberto Gallo",
    role: "Tech Lead",
    rating: 5,
    text: "Their development team is incredibly talented and responsive. They solved complex technical challenges with elegant, scalable solutions every time.",
    avatar: "RG"
  },
  {
    name: "Alessia Bruno",
    role: "Business Owner",
    rating: 5,
    text: "From concept to launch, they guided us through every step. The custom software solution they built transformed how we operate our entire business.",
    avatar: "AB"
  },
  {
    name: "Matteo Villa",
    role: "CTO Enterprise Co",
    rating: 5,
    text: "Their cloud migration strategy was flawless. Zero downtime, seamless transition, and immediate performance improvements across all our systems.",
    avatar: "MV"
  },
  {
    name: "Serena De Luca",
    role: "Product Director",
    rating: 5,
    text: "Exceptional collaboration and communication throughout the project. They anticipated our needs and delivered innovative solutions at every turn.",
    avatar: "SD"
  },
  {
    name: "Paolo Rizzo",
    role: "COO Digital Ventures",
    rating: 5,
    text: "The automation solutions they implemented saved us countless hours. Their DevOps expertise has been transformative for our operational efficiency.",
    avatar: "PR"
  },
];

export function LandingReviews() {
  // Split reviews into 3 columns (5 reviews each)
  const column1 = reviews.slice(0, 5);
  const column2 = reviews.slice(5, 10);
  const column3 = reviews.slice(10, 15);

  return (
    <section className="py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-white/60 text-sm mb-4 tracking-wider" style={{ fontFamily: "Orbitron, sans-serif" }}>
                What Our Clients Say
              </p>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "Orbitron, sans-serif" }}>
                TRUSTED BY MANY, LOVED BY ALL
              </h2>
              <p className="text-white/60 leading-relaxed" style={{ fontFamily: "Orbitron, sans-serif" }}>
                Our clients' success stories reflect our commitment to excellence. See how we've helped them achieve their digital transformation goals.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-6 h-[600px] overflow-hidden">
            {/* Column 1 - scrolls up */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: "-50%" }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex flex-col gap-6"
            >
              {[...column1, ...column1, ...column1].map((review, i) => (
                <ReviewCard key={`col1-${i}`} review={review} />
              ))}
            </motion.div>

            {/* Column 2 - scrolls down (opposite direction) */}
            <motion.div
              initial={{ y: "-50%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex flex-col gap-6"
            >
              {[...column2, ...column2, ...column2].map((review, i) => (
                <ReviewCard key={`col2-${i}`} review={review} />
              ))}
            </motion.div>

            {/* Column 3 - scrolls up (same as column 1) */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: "-50%" }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex flex-col gap-6"
            >
              {[...column3, ...column3, ...column3].map((review, i) => (
                <ReviewCard key={`col3-${i}`} review={review} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="flex-shrink-0 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20">
          <span className="text-white font-semibold text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {review.avatar}
          </span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {review.name}
          </h3>
          <p className="text-white/60 text-xs" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {review.role}
          </p>
        </div>
      </div>
      
      <div className="flex gap-1 mb-4">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} size={14} className="fill-yellow-500 text-yellow-500" />
        ))}
      </div>

      <p className="text-white/70 text-sm leading-relaxed" style={{ fontFamily: "Orbitron, sans-serif" }}>
        {review.text}
      </p>
    </div>
  );
}
