import { FaComment, FaBrain, FaChartBar } from 'react-icons/fa';

const features = [
  {
    icon: <FaComment className="h-8 w-8" />,
    title: "Text-to-Join Onboarding",
    description: "Caregivers start by texting a single keyword—no apps or log-ins. A brief SMS intake captures loved-one details and top concerns.",
  },
  {
    icon: <FaBrain className="h-8 w-8" />,
    title: "Memory-Powered AI Support",
    description: "The agent remembers each caregiver's context and replies with evidence-based tips, all screened by a three-tier medical-safety filter that runs in under a second.",
  },
  {
    icon: <FaChartBar className="h-8 w-8" />,
    title: "Anonymized Insight Feed",
    description: "High-level, de-identified trends highlight common pain points, helping you fine-tune programs and strengthen grant proposals—without exposing personal data.",
  }
];

export default function Features() {
  return (
    <section className="w-full py-16 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-section mb-4">How It Works</h2>
          <p className="text-lg text-amber-800/80 max-w-2xl mx-auto">
            What actually happens once you partner with GiveCare.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
              <div className="card-body items-center text-center">
                <div className="bg-amber-100 p-3 rounded-full mb-4 text-amber-700">
                  {feature.icon}
                </div>
                <h3 className="card-title text-xl mb-2">{feature.title}</h3>
                <p className="text-amber-800/90">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
