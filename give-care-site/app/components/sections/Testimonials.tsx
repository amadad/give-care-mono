import Card, { CardBody } from '../ui/Card';
import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  location: string;
}

interface TestimonialsProps {
  className?: string;
  title?: string;
  description?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Tracey",
    role: "Caregiver",
    content: 'It\'s such a good venting tool for me… It\'s kind of like journaling that I\'m not gonna do. I can just spew and vent out loud…',
    rating: 5,
    location: "San Antonio, TX"
  },
  {
    id: 2,
    name: "Saul",
    role: "Caregiver",
    content: 'GiveCare has been a lifesaver. Having someone to talk to about my mom\'s care at any time has reduced my stress tremendously.',
    rating: 4,
    location: "Chicago, IL"
  },
  {
    id: 3,
    name: "Joel",
    role: "Caregiver",
    content: 'The personalized advice has made a huge difference in how I connect with my son. I found new ways to help us bond and communicate.',
    rating: 5,
    location: "Austin, TX"
  }
];

export default function Testimonials({ 
  className = '',
  title = 'What Caregivers Are Saying',
  description = 'Hear from those who\'ve found support through GiveCare'
}: TestimonialsProps) {
  return (
    <div className={`w-full section-tight bg-base-200 ${className}`}>
      <div className="container-editorial">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <h2 className="heading-section mb-4">{title}</h2>
            <p className="body-standard max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial: Testimonial, index: number) => (
            <ScrollAnimationWrapper
              key={testimonial.id}
              variant="fadeInUp"
              delay={index * 200}
            >
              <Card className="bg-base-100">
                <CardBody>
                  <div className="rating mb-4">
                    {[...Array(5)].map((_, i) => (
                      <input
                        key={i}
                        type="radio"
                        name={`rating-${testimonial.id}`}
                        className="mask mask-star-2 bg-orange-400"
                        checked={i < testimonial.rating}
                        readOnly
                      />
                    ))}
                  </div>
                  <p className="text-amber-900 italic mb-4">"{testimonial.content}"</p>
                  <div className="mt-auto">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-amber-800/70">{testimonial.role}</p>
                    <p className="text-xs text-amber-800/50">{testimonial.location}</p>
                  </div>
                </CardBody>
              </Card>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </div>
  );
}
