import Image from "next/image";

export default function Slide38() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col items-center space-y-12">
          {/* Image */}
          <div className="flex justify-center">
            <Image
              src="/careg.jpg"
              alt="Colorful caregiving illustration with hands reaching to support each other"
              width={500}
              height={333}
              className="w-full max-w-md h-auto object-contain rounded-xl"
              priority
            />
          </div>
          
          {/* Offer */}
          <div className="space-y-6 max-w-2xl">
            <div className="text-center">
              <h1 className="font-heading text-4xl leading-tight text-amber-900 mb-md">
                Special Offer
              </h1>
              <p className="font-body text-lg text-amber-800">
                For APHA Community Members
              </p>
            </div>
            
            <div className="bg-white/80 rounded-xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-6xl font-heading text-amber-900">50%</div>
                  <div className="text-6xl font-heading text-amber-900">OFF</div>
                </div>
                <div className="font-body text-lg text-amber-800">First 3 months</div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-body text-md text-amber-800 mb-2">
                    You can extend this offer to your clients
                  </p>
                </div>
                
                <div className="border-t border-amber-200 pt-4 text-center">
                  <p className="font-body text-md text-amber-800 mb-2">
                    Questions or ready to get started?
                  </p>
                  <a 
                    href="mailto:ali@givecareapp.com"
                    className="font-heading text-lg text-amber-900 hover:text-amber-700 underline"
                  >
                    ali@givecareapp.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}