import Card, { CardBody, CardTitle } from '../ui/Card';
import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

export default function Features() {
  const features = [
    {
      title: "Text-first, Always There",
      description: "Support that meets you where you are—no apps, no logins, just a caregiving companion you can reach by text, day or night.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m-4 4h6m-2 4l4-4h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h4l4 4z" />
        </svg>
      )
    },
    {
      title: "Personalized & Context-aware",
      description: "GiveCare remembers what matters. It adapts to your caregiving journey with tailored check-ins, timely nudges, and compassionate continuity.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10h.01M6 14h.01M6 18h.01M12 6h.01M12 10h.01M12 14h.01M12 18h.01M18 6h.01M18 10h.01M18 14h.01M18 18h.01" />
        </svg>
      )
    },
    {
      title: "Built-In Trust & Safety",
      description: "Every answer is checked against medically vetted sources. Guardrails ensure safe, responsible support—never guesswork, never noise.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m1-6.236a9.968 9.968 0 01-7 0A9.968 9.968 0 003 6v5c0 5.25 3.75 10.5 9 12 5.25-1.5 9-6.75 9-12V6a9.968 9.968 0 00-6-5.236z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-full py-16 bg-base-100">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How GiveCare Helps</h2>
            <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
              We provide comprehensive support to make your caregiving journey smoother and more manageable.
            </p>
          </div>
        </ScrollAnimationWrapper>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollAnimationWrapper
              key={index}
              variant="scaleIn"
              delay={index * 150}
            >
              <Card className="bg-base-200">
                <CardBody className="items-center text-center">
                  <div className="text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                  <p className="text-sm">{feature.description}</p>
                </CardBody>
              </Card>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </div>
  );
}
