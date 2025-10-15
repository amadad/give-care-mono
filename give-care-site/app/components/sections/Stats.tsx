export default function Stats() {
  return (
    <div className="w-full bg-base-100 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">The Caregiving Crisis in Numbers</h2>
        <p className="text-lg text-base-content/80 mb-12 max-w-3xl mx-auto">
          Understanding the scale of the caregiving challenge in the United States today
        </p>
        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <div className="stats stats-vertical lg:stats-horizontal shadow-lg w-full">
              <div className="stat">
                <div className="stat-value">53M+</div>
                <div className="stat-title">Family caregivers in the United States</div>
              </div>

              <div className="stat">
                <div className="stat-value">1 in 4</div>
                <div className="stat-title">Neglect their own health while caring for others</div>
              </div>

              <div className="stat">
                <div className="stat-value">$600B</div>
                <div className="stat-title">Value of unpaid care provided annually</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
