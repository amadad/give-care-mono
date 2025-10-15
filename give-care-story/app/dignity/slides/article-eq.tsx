import Image from "next/image";

export default function Slide9() {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-[#FFE8D6] p-8 space-y-4">
      <div className="relative h-[85vh] w-auto bg-white rounded-xl shadow-xl">
        <div className="p-8 h-full w-full flex items-center justify-center">
          <Image
            src="/eq.webp"
            alt="Equality equation"
            width={560}
            height={700}
            className="h-full w-auto object-contain"
            priority
          />
        </div>
      </div>
      <a 
        href="https://eqbench.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-sm text-amber-700 hover:underline"
      >
        Source: EQ-Bench 3 - Emotional Intelligence Benchmarks for LLMs
      </a>
    </div>
  );
}
