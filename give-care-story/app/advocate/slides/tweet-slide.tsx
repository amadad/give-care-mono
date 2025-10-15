import Image from "next/image";

export default function Slide13() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Image
            src="/tweet.png"
            alt="Tweet about ChatGPT and universal human experiences"
            width={800}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}