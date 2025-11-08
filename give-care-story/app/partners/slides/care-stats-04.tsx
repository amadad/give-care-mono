import { SlideLayout, CenteredContent, SlideTitle, SlideBody } from "../../components/slides";

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
    <SlideLayout variant="cream">
      <CenteredContent maxWidth="5xl">
        <SlideTitle className="mb-xl">
          Caregiving by the Numbers
        </SlideTitle>
        <SlideBody className="text-center mb-2xl">
          Understanding the impact on those who care for others
        </SlideBody>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full border border-amber-200"
            >
              <div className="flex items-center gap-4 mb-lg">
                <div className="text-2xl">{stat.emoji}</div>
                <h3 className="font-heading text-xl text-amber-900">{stat.title}</h3>
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <div className="font-heading text-4xl font-bold mb-md leading-tight text-amber-900">
                  {stat.bigText}
                </div>
                <p className="font-body text-md leading-relaxed mb-lg text-amber-900">
                  {stat.smallText}
                </p>
              </div>
              <a 
                href={stat.source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-body text-sm hover:underline inline-flex items-center mt-2 self-end text-amber-900"
                onClick={(e) => e.stopPropagation()}
              >
                View source
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-2xl text-center max-w-3xl mx-auto">
          <p className="font-body text-md mb-lg opacity-80 text-amber-900">
            These statistics highlight the often-overlooked challenges faced by caregivers.
          </p>

        </div>
      </CenteredContent>
    </SlideLayout>
  );
}