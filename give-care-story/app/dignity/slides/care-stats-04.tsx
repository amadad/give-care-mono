
interface StatCard {
  emoji: string;
  title: string;
  bigText: string;
  smallText: string;
  source: string;
}

export default function Slide5() {

  const stats: StatCard[] = [
    { 
      emoji: "👥",
      title: "Young Caregivers",
      bigText: "1 in 4",
      smallText: "caregivers in the U.S. is under 34 years old",
      source: "https://www.caregiver.org/resource/caregiver-statistics-demographics/"
    },
    { 
      emoji: "💵",
      title: "Financial Strain",
      bigText: "78%",
      smallText: "of caregivers routinely cover caregiving expenses out of pocket",
      source: "https://higherlogicdownload.s3.amazonaws.com/MICHBAR/3acb3cb7-39ba-43dc-be87-c817fb53cc80/UploadedImages/pdfs/newsletter/family-caregivers-cost-survey-2021.pdf"
    },
    { 
      emoji: "🧠",
      title: "Health Impact",
      bigText: "37%",
      smallText: "of spousal caregivers report significant depressive symptoms",
      source: "https://www.sciencedirect.com/science/article/pii/S1041610224051858"
    },
    { 
      emoji: "🛏️",
      title: "Sleep Loss",
      bigText: "50%",
      smallText: "of caregivers report trouble falling back asleep, 15.4% experience interrupted sleep",
      source: "https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2748661"
    }
  ];

  return (
    <div className="relative h-screen w-full bg-[#54340E] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-2xl">
          <h1 className="font-heading text-4xl leading-tight mb-lg text-amber-100">
            Caregiving by the Numbers
          </h1>
          <p className="font-body text-lg opacity-80 text-amber-100">
            Understanding the impact on those who care for others
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white/90 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full"
            >
              <div className="flex items-center gap-4 mb-lg">
                <div className="text-2xl">{stat.emoji}</div>
                <h3 className="font-heading text-xl text-slate-800">{stat.title}</h3>
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <div className="font-heading text-4xl font-bold mb-md leading-tight text-slate-800">
                  {stat.bigText}
                </div>
                <p className="font-body text-md leading-relaxed mb-lg text-slate-700">
                  {stat.smallText}
                </p>
              </div>
              <a 
                href={stat.source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-body text-sm hover:underline inline-flex items-center mt-2 self-end text-slate-600 hover:text-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                View source
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-2xl text-center max-w-3xl mx-auto">
          <p className="font-body text-md mb-lg opacity-80 text-amber-100">
            These statistics highlight the often-overlooked challenges faced by caregivers.
          </p>
          <p className="font-body text-sm opacity-60 text-amber-100">
            Hover over each card and click "View source" to explore the research.
          </p>
        </div>
      </div>
    </div>
  );
}